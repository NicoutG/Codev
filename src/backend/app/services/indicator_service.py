from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.dao.indicator_dao import IndicatorDao
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from app.models.user import User


class IndicatorService:
    def __init__(self):
        self.dao = IndicatorDao()

    def list_indicators(self, db: Session, skip: int = 0, limit: int = 100):
        return self.dao.get_all(db, skip=skip, limit=limit)

    def get_indicator(self, db: Session, indicator_id: int):
        db_indicator = self.dao.get_by_id(db, indicator_id)
        if not db_indicator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Indicateur introuvable"
            )
        return db_indicator

    def create_indicator(self, db: Session, data: IndicatorCreate, current_user: User):
        return self.dao.create(
            db,
            title=data.title,
            description=data.description,
            indicator=data.indicator,
            created_by=current_user.id
        )

    def update_indicator(self, db: Session, indicator_id: int, data: IndicatorUpdate):
        db_indicator = self.get_indicator(db, indicator_id)
        return self.dao.update(
            db,
            db_indicator,
            title=data.title,
            description=data.description,
            indicator=data.indicator
        )

    def delete_indicator(self, db: Session, indicator_id: int):
        db_indicator = self.get_indicator(db, indicator_id)
        self.dao.delete(db, db_indicator)
