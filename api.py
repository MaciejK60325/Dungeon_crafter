from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional, List
from contextlib import asynccontextmanager
import hashlib


# --- MODELE ---
class Users(SQLModel, table=True):
    userID: Optional[int] = Field(default=None, primary_key=True)
    login: str
    password: str
    mail: str

class UserCreate(SQLModel):
    login: str
    password: str
    mail: str

class Rooms(SQLModel, table = True):
    roomID: Optional[int] = Field(default=None, primary_key=True)
    userID: int = Field(foreign_key="users.userID")
    players: str = Field(default='')
    roomName: str
    tags: str
    data: str = Field(default='')
    roomCode: str

class RoomCreate(SQLModel):
    userID: int
    roomName: str
    tags: str
    roomCode: str

# --- BAZA ---
sqlite_file_name = "database/database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- STARTUP ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


# --- FASTAPI + CORS ---
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


# --- ENDPOINTY ---
@app.post("/users/", response_model=Users)
def create_user(users: UserCreate):
    users.password = Encode(users.password)
    db_user = Users.from_orm(users)
    with Session(engine) as session:
        # Sprawdzenie czy login już istnieje
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
            
            room.players =  ','.join(map(str, players))
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

    #hashing
    encoded_pass = hashlib.sha256(salted_pass.encode("utf-8")).hexdigest()

    return encoded_pass

# --- Decode password ---

# def Decode(password: str):
    
#     #unhashing later
#     decoded_pass = password
#     unsalted_pass = decoded_pass.replace(salt, '')

#     return unsalted_pass