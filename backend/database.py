import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# On Vercel the filesystem is read-only except /tmp
IS_VERCEL = bool(os.environ.get("VERCEL"))

if IS_VERCEL:
    SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/apu_calculator.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./apu_calculator.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
