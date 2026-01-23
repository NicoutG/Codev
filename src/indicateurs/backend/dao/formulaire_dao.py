from sqlalchemy.orm import Session
from models import Formulaire, FormulaireIndicator, Indicator
from typing import List, Optional, Dict, Any

class FormulaireDao:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self) -> List[Formulaire]:
        """Get all formulaires"""
        return self.db.query(Formulaire).all()
    
    def get_by_id(self, formulaire_id: int) -> Optional[Formulaire]:
        """Get formulaire by ID"""
        return self.db.query(Formulaire).filter(Formulaire.id == formulaire_id).first()
    
    def create(self, nom: str, demandeur: str, template_type: str, 
               created_by_id: int, indicator_ids: List[int], 
               chart_types: Optional[Dict[int, str]] = None) -> Formulaire:
        """Create a new formulaire"""
        formulaire = Formulaire(
            nom=nom,
            demandeur=demandeur,
            template_type=template_type,
            created_by_id=created_by_id
        )
        self.db.add(formulaire)
        self.db.flush()  # Get ID without committing
        
        # Add indicators
        for idx, indicator_id in enumerate(indicator_ids, start=1):
            fi = FormulaireIndicator(
                formulaire_id=formulaire.id,
                indicator_id=indicator_id,
                ordre=idx,
                chart_type=chart_types.get(indicator_id, "none") if chart_types else "none"
            )
            self.db.add(fi)
        
        self.db.commit()
        self.db.refresh(formulaire)
        return formulaire
    
    def update(self, formulaire_id: int, **kwargs) -> Optional[Formulaire]:
        """Update a formulaire"""
        formulaire = self.get_by_id(formulaire_id)
        if not formulaire:
            return None
        
        indicator_ids = kwargs.pop('indicator_ids', None)
        
        for key, value in kwargs.items():
            if hasattr(formulaire, key):
                setattr(formulaire, key, value)
        
        # Update indicators if provided
        if indicator_ids is not None:
            chart_types = kwargs.pop('chart_types', None)
            # Delete existing
            self.db.query(FormulaireIndicator).filter(
                FormulaireIndicator.formulaire_id == formulaire_id
            ).delete()
            
            # Add new
            for idx, indicator_id in enumerate(indicator_ids, start=1):
                fi = FormulaireIndicator(
                    formulaire_id=formulaire_id,
                    indicator_id=indicator_id,
                    ordre=idx,
                    chart_type=chart_types.get(indicator_id, "none") if chart_types else "none"
                )
                self.db.add(fi)
        
        self.db.commit()
        self.db.refresh(formulaire)
        return formulaire
    
    def delete(self, formulaire_id: int) -> bool:
        """Delete a formulaire"""
        formulaire = self.get_by_id(formulaire_id)
        if not formulaire:
            return False
        
        self.db.delete(formulaire)
        self.db.commit()
        return True
    
    def get_indicators(self, formulaire_id: int) -> List[Indicator]:
        """Get all indicators for a formulaire"""
        formulaire = self.get_by_id(formulaire_id)
        if not formulaire:
            return []
        
        indicators = []
        for fi in sorted(formulaire.formulaire_indicators, key=lambda x: x.ordre):
            indicators.append(fi.indicator)
        return indicators
