from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional, List
from contextlib import asynccontextmanager

# --- MODELE ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    login: str
    password: str
    mail: str

class UserCreate(SQLModel):
    login: str
    password: str
    mail: str

# --- BAZA ---
sqlite_file_name = "database.db"
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
    allow_origins=origins,  # <- lub ["*"] w testach
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- ENDPOINTY ---
@app.post("/users/", response_model=User)
def create_user(user: UserCreate):
    db_user = User.from_orm(user)
    with Session(engine) as session:
        # Sprawdzenie czy login już istnieje
        existing_user = session.exec(select(User).where(User.login == user.login)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Login już istnieje")
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

@app.get("/users/", response_model=List[User])
def read_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users

@app.post("/login/")
def login_user(login: str, password: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.login == login, User.password == password)).first()
        if not user:
            raise HTTPException(status_code=400, detail="Niepoprawny login lub hasło")
        return {"message": "Zalogowano", "user": user.login}