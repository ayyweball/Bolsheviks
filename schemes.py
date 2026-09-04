from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Schemes

router = APIRouter(
    prefix = "/api/schemes",
    tags =["Schemes"]
)

def get_db():
    db=SessionLocal()

    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_schemes(db:Session = Depends(get_db)):
   schemes = db.query(Schemes).all()

   return schemes