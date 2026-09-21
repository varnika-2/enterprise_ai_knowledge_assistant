from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import init_db,Base,engine,SessionLocal
from .models import User
from .auth import hash_password
from .routes import auth,documents,chat,evaluation
app=FastAPI(title='Enterprise AI Knowledge Assistant',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(',')],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
@app.on_event('startup')
def startup():
 init_db();Base.metadata.create_all(bind=engine);db=SessionLocal()
 if not db.query(User).filter(User.email=='demo@example.com').first():db.add(User(email='demo@example.com',password_hash=hash_password('Demo@123'),role='admin'));db.commit()
 db.close()
@app.get('/health')
def health():return {'status':'healthy'}
app.include_router(auth.router);app.include_router(documents.router);app.include_router(chat.router);app.include_router(evaluation.router)
