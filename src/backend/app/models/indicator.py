from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)

    # Tu as demandé: title, description, indicator(json)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    indicator = Column(JSONB, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relation many-to-many avec Report
    reports = relationship(
        "Report",
        secondary="report_indicators",
        back_populates="indicators",
        lazy="select"
    )