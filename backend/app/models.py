from datetime import datetime
from sqlalchemy import Column,Integer,String,DateTime,Text,Float
from .db import Base
class User(Base):
 __tablename__='users'; id=Column(Integer,primary_key=True); email=Column(String(255),unique=True,index=True); password_hash=Column(String(255)); role=Column(String(30),default='user'); created_at=Column(DateTime,default=datetime.utcnow)
class Document(Base):
 __tablename__='documents'; id=Column(Integer,primary_key=True); owner_id=Column(Integer,index=True); filename=Column(String(500)); source_type=Column(String(50)); created_at=Column(DateTime,default=datetime.utcnow)
class QueryLog(Base):
 __tablename__='query_logs'; id=Column(Integer,primary_key=True); user_id=Column(Integer); question=Column(Text); answer=Column(Text); latency_ms=Column(Float); token_usage=Column(Integer); faithfulness=Column(Float,default=0); answer_relevance=Column(Float,default=0); citation_accuracy=Column(Float,default=0); created_at=Column(DateTime,default=datetime.utcnow)
