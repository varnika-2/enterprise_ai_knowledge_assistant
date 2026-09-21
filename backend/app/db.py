from sqlalchemy import create_engine,text
from sqlalchemy.orm import declarative_base,sessionmaker
from .config import settings
engine=create_engine(settings.database_url,pool_pre_ping=True); SessionLocal=sessionmaker(bind=engine); Base=declarative_base()
def init_db():
    with engine.begin() as c:c.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
def get_db():
    db=SessionLocal()
    try:yield db
    finally:db.close()
