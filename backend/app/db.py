from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

database_url = settings.database_url

# Force SQLAlchemy to use Psycopg 3
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )

engine = create_engine(
    database_url,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def init_db():
    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()