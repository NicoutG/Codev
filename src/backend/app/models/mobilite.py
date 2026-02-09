# app/models/mobilite.py

from sqlalchemy import Column, String, Text
from app.core.database import Base


class Mobilite(Base):
    __tablename__ = "mobilite"

    # PK demandée
    id_polytech_inter = Column(String(64), primary_key=True, index=True)

    sexe = Column(Text, nullable=True)
    filiere = Column(Text, nullable=True)
    cursus = Column(Text, nullable=True)
    nationalite = Column(Text, nullable=True)
    diplome = Column(Text, nullable=True)
    stage_3a = Column(Text, nullable=True)
    stage_4a = Column(Text, nullable=True)
    s9_5a = Column(Text, nullable=True)
    stage_5a = Column(Text, nullable=True)
    double_diplome = Column(Text, nullable=True)
    sejourt_court = Column(Text, nullable=True)
    cesure = Column(Text, nullable=True)
    substitution = Column(Text, nullable=True)
    nb_mois_stage = Column(Text, nullable=True)
    nb_mois_etude = Column(Text, nullable=True)
    commentaires = Column(Text, nullable=True)
    total = Column(Text, nullable=True)
