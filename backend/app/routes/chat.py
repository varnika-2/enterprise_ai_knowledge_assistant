from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import QueryLog
from ..auth import current_user
from ..services.rag import ask
from ..services.agent import classify
router=APIRouter(prefix='/chat',tags=['Chat'])
@router.post('')
def chat(x:dict,u=Depends(current_user),db:Session=Depends(get_db)):
 r=ask(x.get('question',''));db.add(QueryLog(user_id=u.id,question=x.get('question',''),answer=r['answer'],latency_ms=r['latency_ms'],token_usage=r['token_usage']));db.commit();r['intent']=classify(x.get('question',''));return r
