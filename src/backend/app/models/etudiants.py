from sqlalchemy import Column, Integer, String, Text

from app.core.database import Base


class Etudiants(Base):
    __tablename__ = "etudiants"

    # PK
    id_polytech = Column(String(64), primary_key=True, index=True)

    # Texte court
    centre = Column(String(64), nullable=True)
    composante = Column(String(64), nullable=True)
    iae_etape_code = Column(String(64), nullable=True)
    iae_version_code = Column(String(32), nullable=True)
    iae_etape_lib = Column(Text, nullable=True)

    # Exemple: 'N' / 'O'
    redoublant = Column(String(8), nullable=True)

    # Exemple: 'M' / 'F'
    sexe = Column(String(8), nullable=True)

    # Numériques
    age = Column(Integer, nullable=True)
    bac_annee = Column(Integer, nullable=True)

    # Texte
    nationalite = Column(Text, nullable=True)
    bac = Column(Text, nullable=True)
    bac_mention = Column(Text, nullable=True)
    bac_lieu = Column(Text, nullable=True)
    titre_access = Column(Text, nullable=True)
    titre_acces_iea = Column(Text, nullable=True)
    titre_acces_pays = Column(Text, nullable=True)
    boursier = Column(Text, nullable=True)
    dernier_etablissement_code = Column(String(64), nullable=True)
    dernier_etablissement_lib = Column(Text, nullable=True)
    premier_etablissement_code = Column(String(64), nullable=True)
    premier_etablissement_lib = Column(Text, nullable=True)
    type_dernier_diplome_code = Column(String(64), nullable=True)
    type_dernier_diplome_lib = Column(Text, nullable=True)
    regime_inscription = Column(Text, nullable=True)
