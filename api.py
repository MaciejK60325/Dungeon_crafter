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
    "http://127.0.0.1:5500",  # Twój frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # <- lub ["*"] w testach
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
        return {"message": "Zalogowano", "user": user.login}
    

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