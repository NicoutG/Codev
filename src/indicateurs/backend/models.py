from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "consultant" or "modificateur"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    indicators = relationship("Indicator", back_populates="creator")
    imports = relationship("Import", back_populates="user")
    formulaires = relationship("Formulaire", back_populates="creator")

class Indicator(Base):
    __tablename__ = "indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    spec_json = Column(JSON, nullable=False)  # La définition JSON de l'indicateur
    is_predefined = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="indicators")
    results = relationship("IndicatorResult", back_populates="indicator")
    formulaire_indicators = relationship("FormulaireIndicator", back_populates="indicator")

class IndicatorResult(Base):
    __tablename__ = "indicator_results"
    
    id = Column(Integer, primary_key=True, index=True)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    periode = Column(String)  # "6_mois", "18_mois", "custom"
    valeurs_json = Column(JSON, nullable=False)  # Les résultats calculés
    filters_json = Column(JSON)  # Les filtres appliqués (année, semestre, etc.)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    indicator = relationship("Indicator", back_populates="results")

class Import(Base):
    __tablename__ = "imports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fichier_nom = Column(String, nullable=False)
    type_donnee = Column(String, nullable=False)  # "insertion", "mobilite", "reussite"
    date_import = Column(DateTime(timezone=True), server_default=func.now())
    statut = Column(String, default="success")  # "success", "error"
    metadata_json = Column(JSON)  # Colonnes détectées, nombre de lignes, etc.
    error_message = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="imports")

class Formulaire(Base):
    __tablename__ = "formulaires"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False, index=True)
    demandeur = Column(String, nullable=False)  # "CTI", "Lyon1", etc.
    template_type = Column(String, nullable=False)  # "CTI", "Lyon1", etc.
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="formulaires")
    formulaire_indicators = relationship("FormulaireIndicator", back_populates="formulaire", cascade="all, delete-orphan")

class FormulaireIndicator(Base):
    __tablename__ = "formulaire_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    formulaire_id = Column(Integer, ForeignKey("formulaires.id"), nullable=False)
    indicator_id = Column(Integer, ForeignKey("indicators.id"), nullable=False)
    ordre = Column(Integer, nullable=False)
    
    # Relationships
    formulaire = relationship("Formulaire", back_populates="formulaire_indicators")
    indicator = relationship("Indicator", back_populates="formulaire_indicators")

# Tables dynamiques pour les données importées
# Ces tables seront créées dynamiquement lors de l'import
# On utilise une approche avec des tables génériques ou on crée les tables à la volée
