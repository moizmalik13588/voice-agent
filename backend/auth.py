from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import Hospital


def get_hospital(
    x_api_key: str = Header(..., description="Hospital API Key"),
    db: Session = Depends(get_db)
) -> Hospital:
    hospital = db.execute(
        select(Hospital).where(Hospital.api_key == x_api_key)
        .where(Hospital.is_active == True)
    ).scalars().first()

    if not hospital:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")

    return hospital