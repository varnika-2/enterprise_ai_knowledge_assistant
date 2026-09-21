# Production architecture

React → FastAPI → Auth/RBAC, RAG Service, Agent Service → PostgreSQL + pgvector → Vector Search + BM25 → Cross Encoder Reranker → LLM → Answer + Citations → Evaluation → Monitoring.

Supported ingestion: PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown and webpages.

Evaluation targets: Retrieval Recall, Precision, MRR, nDCG, Faithfulness, Answer Relevance, Citation Accuracy, Latency and Token Usage.
