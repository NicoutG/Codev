from sqlalchemy import Column, Integer, String, Text

from app.core.database import Base


class Mobilite(Base):
    __tablename__ = "mobilite"

    # PK
    id_polytech_inter = Column(String(64), primary_key=True, index=True)

    sexe = Column(String(8), nullable=True)
    filiere = Column(String(64), nullable=True)
    cursus = Column(String(64), nullable=True)

    nationalite = Column(Text, nullable=True)

    # ex: "oui"
    diplome = Column(Text, nullable=True)

    # Ces colonnes semblent parfois vides, parfois 0/1
    # On garde Integer pour 0/1 (si import envoie "1"/"0" ça se cast bien)
    stage_3a = Column(Integer, nullable=True)
    stage_4a = Column(Integer, nullable=True)
    s9_5a = Column(Integer, nullable=True)
    stage_5a = Column(Integer, nullable=True)

    double_diplome = Column(Integer, nullable=True)
    sejourt_court = Column(Integer, nullable=True)
    cesure = Column(Integer, nullable=True)
    substitution = Column(Text, nullable=True)

    nb_mois_stage = Column(Integer, nullable=True)
    nb_mois_etude = Column(Integer, nullable=True)

    commentaires = Column(Text, nullable=True)
    total = Column(Integer, nullable=True)
