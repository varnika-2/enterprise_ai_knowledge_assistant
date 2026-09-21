from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    database_url:str; jwt_secret:str; ollama_base_url:str='http://localhost:11434'; ollama_model:str='llama3.2:3b'; embedding_model:str='sentence-transformers/all-MiniLM-L6-v2'; reranker_model:str='cross-encoder/ms-marco-MiniLM-L-6-v2'; chunk_size:int=900; chunk_overlap:int=120; cors_origins:str='http://localhost:5173'
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')
settings=Settings()
