# Enterprise AI Knowledge Assistant

Recruiter-ready GenAI/RAG portfolio project: multi-format ingestion, hybrid BM25 + vector retrieval, cross-encoder reranking, citation-grounded local LLM answers, JWT/RBAC, SQL/web tools, and an evaluation dashboard.

## Run locally
1. Install Docker Desktop, Python 3.11+, Node.js 20+.
2. Copy `.env.example` to `.env`.
3. `docker compose up -d postgres ollama`
4. `docker exec -it enterprise_ollama ollama pull llama3.2:3b`
5. Backend: `cd backend && python -m venv .venv && .venv\\Scripts\\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
6. Frontend: `cd frontend && npm install && npm run dev`
7. Open http://localhost:5173

Demo: demo@example.com / Demo@123

See `docs/ARCHITECTURE.md` and `docs/PORTFOLIO.md`.
