# app/models/etudiants.py

from sqlalchemy import Column, String, Text
from app.core.database import Base


class Etudiants(Base):
    __tablename__ = "etudiants"

    # PK demandée
    id_polytech = Column(String(64), primary_key=True, index=True)

    centre = Column(Text, nullable=True)
    composante = Column(Text, nullable=True)
    iae_etape_code = Column(Text, nullable=True)
    iae_version_code = Column(Text, nullable=True)
    iae_etape_lib = Column(Text, nullable=True)
    redoublant = Column(Text, nullable=True)
    sexe = Column(Text, nullable=True)
    age = Column(Text, nullable=True)
    nationalite = Column(Text, nullable=True)
    bac = Column(Text, nullable=True)
    bac_annee = Column(Text, nullable=True)
    bac_mention = Column(Text, nullable=True)
    bac_lieu = Column(Text, nullable=True)
    titre_access = Column(Text, nullable=True)
    titre_acces_iea = Column(Text, nullable=True)
    titre_acces_pays = Column(Text, nullable=True)
    boursier = Column(Text, nullable=True)
    dernier_etablissement_code = Column(Text, nullable=True)
    dernier_etablissement_lib = Column(Text, nullable=True)
    premier_etablissement_code = Column(Text, nullable=True)
    premier_etablissement_lib = Column(Text, nullable=True)
    type_dernier_diplome_code = Column(Text, nullable=True)
    type_dernier_diplome_lib = Column(Text, nullable=True)
    regime_inscription = Column(Text, nullable=True)
