import os
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Session, create_engine, select, LargeBinary
from typing import Optional, List
from contextlib import asynccontextmanager
import hashlib


# --- FASTAPI + CORS ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MODELE ---
class Users(SQLModel, table=True):
    userID: Optional[int] = Field(default=None, primary_key=True)
    login: str
    password: str
    mail: str
    reset_token: Optional[str] = Field(default=None)

class UserCreate(SQLModel):
    login: str
    password: str
    mail: str

class Rooms(SQLModel, table=True):
    roomID: Optional[int] = Field(default=None, primary_key=True)
    userID: int = Field(foreign_key="users.userID")
    players: str = Field(default='')
    roomName: str
    tags: str
    data: str = Field(default='')
    roomCode: str
    img: bytes = Field(default=None)

class RoomCreate(SQLModel):
    userID: int
    roomName: str
    tags: str
    roomCode: str
    img: bytes

class ForgotPasswordRequest(SQLModel):
    login: str
    mail: str

class ResetPasswordConfirm(SQLModel):
    mail: str
    token: str
    new_password: str


# --- BAZA ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "database")
os.makedirs(DB_DIR, exist_ok=True) 

sqlite_url = f"sqlite:///{os.path.join(DB_DIR, 'database.db')}"
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# --- KONFIGURACJA SMTP (E-MAIL) ---
# Jeśli testujesz lokalnie, możesz wpisać dane swojego Gmaila (i użyć "Hasła aplikacji" z konta Google)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "twój_email@gmail.com"
SENDER_PASSWORD = "twoje_haslo_aplikacji"

def send_email_code(to_email: str, code: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "Dungeon Crafter - Kod resetowania hasła"

        body = f"Twój kod weryfikacyjny do zmiany hasła to: {code}\n\nJeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Błąd wysyłania e-maila: {e}")
        raise HTTPException(status_code=500, detail="Nie udało się wysłać wiadomości e-mail z systemów SMTP")


# --- ENDPOINTY ---
@app.post("/forgot-password/")
def forgot_password(data: ForgotPasswordRequest):
    with Session(engine) as session:
        user = session.exec(select(Users).where(Users.login == data.login, Users.mail == data.mail)).first()
        if not user:
            raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika o takim loginie i adresie e-mail")
        
        # Generujemy losowy 6-cyfrowy kod i zapisujemy w bazie
        code = str(random.randint(100000, 999999))
        user.reset_token = code
        session.add(user)
        session.commit()
        
        # Wysyłamy kod na prawdziwy e-mail
        send_email_code(data.mail, code)
        
        return {"message": "Kod weryfikacyjny został wysłany na podany adres e-mail"}

@app.post("/reset-password-confirm/")
def reset_password_confirm(data: ResetPasswordConfirm):
    with Session(engine) as session:
        user = session.exec(select(Users).where(Users.mail == data.mail, Users.reset_token == data.token)).first()
        if not user:
            raise HTTPException(status_code=400, detail="Niepoprawny kod weryfikacyjny lub adres e-mail")
        
        # Ustawiamy nowe hasło i kasujemy token, żeby nie można go było użyć drugi raz
        user.password = Encode(data.new_password)
        user.reset_token = None
        session.add(user)
        session.commit()
        return {"message": "Hasło zostało pomyślnie zmienione"}

@app.post("/users/", response_model=Users)
def create_user(users: UserCreate):
    users.password = Encode(users.password)
    db_user = Users.from_orm(users)
    with Session(engine) as session:
        existing_user = session.exec(select(Users).where(Users.login == users.login)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Login już istnieje")
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

@app.get("/users/", response_model=List[Users])
def read_users():
    with Session(engine) as session:
        users = session.exec(select(Users)).all()
        return users

@app.post("/login/")
def login_user(login: str, password: str):
    with Session(engine) as session:
        user = session.exec(select(Users).where(Users.login == login, Users.password == Encode(password))).first()
        if not user:
            raise HTTPException(status_code=400, detail="Niepoprawny login lub hasło")
        return {"message": "Zalogowano", "user": user.login, "userID": user.userID}
    

# --- POKOJE ---
@app.post("/rooms/", response_model=Rooms)
def create_rooms(rooms: RoomCreate):
    db_room = Rooms.from_orm(rooms)
    with Session(engine) as session:
        session.add(db_room)
        session.commit()
        session.refresh(db_room)
        return db_room

@app.get("/rooms/")
def get_rooms_from_userID(userID: int):
    with Session(engine) as session:
        rooms = session.exec(select(Rooms).where(Rooms.userID == userID)).all()
        return rooms
    
@app.delete("/rooms/")
def delete_room(roomID: int):
    with Session(engine) as session:
        room = session.exec(select(Rooms).where(Rooms.roomID == roomID)).one()
        session.delete(room)
        session.commit()

@app.post("/joinRoom/")
def join_room(roomCode: str, userID: int):
    with Session(engine) as session:
        room = session.exec(select(Rooms).where(Rooms.roomCode == roomCode)).one()
        players = room.players.split(',')

        if(str(userID) not in players):
            players.append(userID)
            room.players = ','.join(map(str, players))
            session.add(room)
            session.commit()
            session.refresh(room)

@app.get("/friendRooms/")
def read_friend_rooms(userID: int):
    with Session(engine) as session:
        rooms = session.exec(select(Rooms).where(Rooms.players.like(f'%{userID}%'))).all()
        return rooms


# SALT added to password
SALT = "fishnet"

# --- Encode password ---
def Encode(password: str):
    salted_pass = password + SALT
    encoded_pass = hashlib.sha256(salted_pass.encode("utf-8")).hexdigest()
    return encoded_pass