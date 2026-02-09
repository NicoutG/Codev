from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.indicator import Indicator

# Table de liaison many-to-many entre Report et Indicator
report_indicators = Table(
    'report_indicators',
    Base.metadata,
    Column('report_id', Integer, ForeignKey('reports.id', ondelete='CASCADE'), primary_key=True),
    Column('indicator_id', Integer, ForeignKey('indicators.id', ondelete='CASCADE'), primary_key=True),
    Column('chart_type', String(50), nullable=True),  # bar, line, pie, etc.
    Column('chart_config', Text, nullable=True),  # JSON pour options de graphique
    Column('display_order', Integer, default=0)  # Ordre d'affichage dans le rapport
)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relation many-to-many avec Indicator (utilise une chaîne pour éviter les imports circulaires)
    indicators = relationship(
        "Indicator",
        secondary=report_indicators,
        back_populates="reports",
        lazy="select"
    )
