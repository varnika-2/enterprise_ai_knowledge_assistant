from functools import lru_cache
import time
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_postgres import PGVector
from langchain_ollama import ChatOllama
from sentence_transformers import CrossEncoder
from rank_bm25 import BM25Okapi
from ..config import settings
@lru_cache
def emb():return HuggingFaceEmbeddings(model_name=settings.embedding_model,model_kwargs={'device':'cpu'},encode_kwargs={'normalize_embeddings':True})
@lru_cache
def store():return PGVector(embeddings=emb(),collection_name='enterprise_documents',connection=settings.database_url,use_jsonb=True)
@lru_cache
def reranker():return CrossEncoder(settings.reranker_model)
def chunks(t):return RecursiveCharacterTextSplitter(chunk_size=settings.chunk_size,chunk_overlap=settings.chunk_overlap,separators=['\n\n','\n','. ',' ','']).split_text(t)
def index(texts,meta):store().add_texts(texts,metadatas=meta)
def hybrid(q,k=8):
 dense=store().similarity_search_with_score(q,k=k)
 if not dense:return []
 docs=[d for d,s in dense]; scores=BM25Okapi([d.page_content.split() for d in docs]).get_scores(q.split());mx=max(scores) if len(scores) else 1
 out=[]
 for i,(d,s) in enumerate(dense):out.append((d,(1/(1+float(s)))+float(scores[i])/(mx+1e-6)))
 return sorted(out,key=lambda x:x[1],reverse=True)[:k]
def ask(q):
 start=time.perf_counter(); cand=hybrid(q); pairs=[(q,d.page_content) for d,_ in cand]; rs=reranker().predict(pairs) if pairs else []
 ranked=sorted([(d,float(s)) for (d,_),s in zip(cand,rs)],key=lambda x:x[1],reverse=True)[:5]
 ctx=[];src=[]
 for i,(d,s) in enumerate(ranked,1):ctx.append(f'[S{i}] {d.page_content}');src.append({'citation':f'S{i}','source':d.metadata.get('source','Unknown'),'score':round(s,4)})
 prompt='You are an enterprise knowledge assistant. Answer ONLY from the context. If unsupported, say you could not find sufficient information. Cite factual claims as [S1], [S2].\n\nCONTEXT:\n'+ '\n\n'.join(ctx)+'\n\nQUESTION:\n'+q
 r=ChatOllama(base_url=settings.ollama_base_url,model=settings.ollama_model,temperature=0.1).invoke(prompt);m=getattr(r,'response_metadata',{}) or {};tokens=int(m.get('eval_count',0) or 0)+int(m.get('prompt_eval_count',0) or 0)
 return {'answer':r.content,'sources':src,'latency_ms':round((time.perf_counter()-start)*1000,2),'token_usage':tokens}
