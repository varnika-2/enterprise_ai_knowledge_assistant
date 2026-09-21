from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto'); bearer=HTTPBearer()
def hash_password(x):return pwd.hash(x)
def verify_password(x,h):return pwd.verify(x,h)
def token(u):return jwt.encode({'sub':str(u.id),'role':u.role,'exp':datetime.now(timezone.utc)+timedelta(hours=12)},settings.jwt_secret,algorithm='HS256')
def current_user(c:HTTPAuthorizationCredentials=Depends(bearer),db:Session=Depends(get_db)):
 try: uid=int(jwt.decode(c.credentials,settings.jwt_secret,algorithms=['HS256'])['sub'])
 except (JWTError,KeyError,ValueError):raise HTTPException(401,'Invalid token')
 u=db.get(User,uid)
 if not u:raise HTTPException(401,'User not found')
 return u
