from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..auth import hash_password,verify_password,token
router=APIRouter(prefix='/auth',tags=['Auth'])
class C(BaseModel):email:str;password:str
@router.post('/register')
def register(x:C,db:Session=Depends(get_db)):
 if db.query(User).filter(User.email==x.email.lower()).first():raise HTTPException(409,'Email already registered')
 u=User(email=x.email.lower(),password_hash=hash_password(x.password));db.add(u);db.commit();db.refresh(u);return {'access_token':token(u)}
@router.post('/login')
def login(x:C,db:Session=Depends(get_db)):
 u=db.query(User).filter(User.email==x.email.lower()).first()
 if not u or not verify_password(x.password,u.password_hash):raise HTTPException(401,'Invalid credentials')
 return {'access_token':token(u),'role':u.role}
