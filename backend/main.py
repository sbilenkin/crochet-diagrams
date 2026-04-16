from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from passlib.hash import bcrypt

from auth import create_access_token, get_db
from routes.projects import router as projects_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Database health check endpoint, will remove in prod
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "yeehaw"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.execute(text("SELECT * FROM users WHERE username = :username"),
        {"username": username}
        ).mappings().fetchone()
    if user and bcrypt.verify(password, user['password_hash']):
        token = create_access_token(user['user_id'])
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"user_id": user['user_id'], "username": user['username']},
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/signup")
def signup(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    password_hash = bcrypt.hash(password)
    # db query to create a new user
    try:
        db.execute(
            text("INSERT INTO users (username, password_hash) VALUES (:username, :password_hash)"),
            {"username": username, "password_hash": password_hash}
        )
        db.commit()
        return {"message": "User created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
