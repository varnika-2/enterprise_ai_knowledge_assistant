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
def hybrid(q,k=12):
 dense=store().similarity_search_with_score(q,k=k)
 if not dense:return []
 docs=[d for d,s in dense]; scores=BM25Okapi([d.page_content.split() for d in docs]).get_scores(q.split());mx=max(scores) if len(scores) else 1
 out=[]
 for i,(d,s) in enumerate(dense):out.append((d,(1/(1+float(s)))+float(scores[i])/(mx+1e-6)))
 return sorted(out,key=lambda x:x[1],reverse=True)[:k]
def ask(q):
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()
    cand = hybrid(q)
    retrieval_ms = (time.perf_counter() - retrieval_start) * 1000

    rerank_start = time.perf_counter()

    pairs = [(q, d.page_content) for d, _ in cand]
    rs = reranker().predict(pairs) if pairs else []

    ranked = sorted(
        [(d, float(s)) for (d, _), s in zip(cand, rs)],
        key=lambda x: x[1],
        reverse=True
    )[:5]

    reranking_ms = (time.perf_counter() - rerank_start) * 1000

    ctx = []
    src = []

    for i, (d, s) in enumerate(ranked, 1):
        ctx.append(f'[S{i}] {d.page_content}')

        src.append({
            'citation': f'S{i}',
            'source': d.metadata.get('source', 'Unknown'),
            'score': round(s, 4)
        })

    prompt = (
        'You are an enterprise knowledge assistant. '
        'Answer ONLY from the provided context. '
        'The context may contain spreadsheet or table data. '
        'When working with tables, carefully preserve the relationship '
        'between column headers, rows, species, names, and numerical values. '
        'Do not invent missing columns, values, or relationships. '
        'If the context does not contain enough information to answer, '
        'say that you could not find sufficient information. '
        'When making factual claims, cite the supporting source using '
        '[S1], [S2], etc. '
        'For comparison or ranking questions, explicitly identify the '
        'relevant rows and values before giving the conclusion. '
        '\n\nCONTEXT:\n'
        + '\n\n'.join(ctx)
        + '\n\nQUESTION:\n'
        + q
    )

    generation_start = time.perf_counter()

    llm = ChatOllama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=0.1
    )

    r = llm.invoke(prompt)

    generation_ms = (time.perf_counter() - generation_start) * 1000

    metadata = getattr(r, 'response_metadata', {}) or {}

    tokens = (
        int(metadata.get('eval_count', 0) or 0)
        + int(metadata.get('prompt_eval_count', 0) or 0)
    )

    total_ms = (time.perf_counter() - total_start) * 1000

    return {
        'answer': r.content,
        'sources': src,
        'latency_ms': round(total_ms, 2),
        'retrieval_ms': round(retrieval_ms, 2),
        'reranking_ms': round(reranking_ms, 2),
        'generation_ms': round(generation_ms, 2),
        'token_usage': tokens
    }
