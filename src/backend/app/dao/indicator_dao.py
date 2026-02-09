from sqlalchemy.orm import Session
from app.models.indicator import Indicator


class IndicatorDao:
    def get_by_id(self, db: Session, indicator_id: int) -> Indicator | None:
        return db.query(Indicator).filter(Indicator.id == indicator_id).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> list[Indicator]:
        return db.query(Indicator).order_by(Indicator.id.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, title: str, description, indicator, created_by: int | None) -> Indicator:
        db_indicator = Indicator(
            title=title,
            description=description,
            indicator=indicator,
            created_by=created_by
        )
        db.add(db_indicator)
        db.commit()
        db.refresh(db_indicator)
        return db_indicator

    def update(self, db: Session, db_indicator: Indicator, **kwargs) -> Indicator:
        for key, value in kwargs.items():
            if value is not None:
                setattr(db_indicator, key, value)
        db.commit()
        db.refresh(db_indicator)
        return db_indicator

    def delete(self, db: Session, db_indicator: Indicator) -> None:
        db.delete(db_indicator)
        db.commit()
