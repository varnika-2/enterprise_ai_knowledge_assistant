from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import QueryLog
from ..auth import current_user
router=APIRouter(prefix='/evaluation',tags=['Evaluation'])
@router.get('/summary')
def summary(u=Depends(current_user),db:Session=Depends(get_db)):
 rows=db.query(QueryLog).filter(QueryLog.user_id==u.id).all();n=max(1,len(rows));return {'query_count':len(rows),'recall':0,'precision':0,'mrr':0,'ndcg':0,'faithfulness':sum(r.faithfulness or 0 for r in rows)/n,'answer_relevance':sum(r.answer_relevance or 0 for r in rows)/n,'citation_accuracy':sum(r.citation_accuracy or 0 for r in rows)/n,'latency_ms':round(sum(r.latency_ms or 0 for r in rows)/n,2),'token_usage':round(sum(r.token_usage or 0 for r in rows)/n,2)}
