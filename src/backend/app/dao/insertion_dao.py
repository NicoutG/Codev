# app/dao/insertion_dao.py

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.insertion import Insertion
from typing import Any, Dict, List

class InsertionDao:
    def upsert(self, db: Session, payload: dict) -> Insertion:
        """
        UPSERT PostgreSQL sur la PK: code
        payload doit contenir au minimum {"code": "..."}
        """
        if not payload.get("code"):
            raise ValueError("Missing required primary key field: code")

        stmt = insert(Insertion).values(**payload)

        update_cols = {c.name: stmt.excluded[c.name] for c in Insertion.__table__.columns if c.name != "code"}

        stmt = stmt.on_conflict_do_update(
            index_elements=["code"],
            set_=update_cols
        ).returning(Insertion)

        row = db.execute(stmt).scalar_one()
        db.commit()
        return row

    def delete(self, db: Session, code: str) -> bool:
        q = db.query(Insertion).filter(Insertion.code == code)
        deleted = q.delete(synchronize_session=False)
        db.commit()
        return deleted > 0

    def export_all(self, db: Session) -> List[Dict[str, Any]]:
        rows = db.query(Insertion).all()
        return [{c.name: getattr(r, c.name) for c in Insertion.__table__.columns} for r in rows]

