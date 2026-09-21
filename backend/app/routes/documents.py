from fastapi import APIRouter,Depends,UploadFile,File,HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Document
from ..auth import current_user
from ..services.ingestion import load_file,load_url
from ..services.rag import chunks,index
router=APIRouter(prefix='/documents',tags=['Documents'])
@router.post('/upload')
async def upload(file:UploadFile=File(...),u=Depends(current_user),db:Session=Depends(get_db)):
 try:
  text=load_file(file.filename,await file.read());cs=chunks(text);index(cs,[{'source':file.filename,'owner_id':u.id,'chunk_index':i} for i in range(len(cs))]);d=Document(owner_id=u.id,filename=file.filename,source_type='file');db.add(d);db.commit();return {'filename':file.filename,'chunks':len(cs)}
 except Exception as e:raise HTTPException(400,str(e))
@router.post('/web')
def web(x:dict,u=Depends(current_user),db:Session=Depends(get_db)):
 try:
  url=x['url'];cs=chunks(load_url(url));index(cs,[{'source':url,'owner_id':u.id,'chunk_index':i} for i in range(len(cs))]);d=Document(owner_id=u.id,filename=url,source_type='web');db.add(d);db.commit();return {'source':url,'chunks':len(cs)}
 except Exception as e:raise HTTPException(400,str(e))
