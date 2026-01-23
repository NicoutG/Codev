from sqlalchemy.orm import Session
from dao.formulaire_dao import FormulaireDao
from services.indicator_service import IndicatorService
from services.calculation_service import CalculationService
from typing import Dict, Any, List, Optional

class FormulaireService:
    def __init__(self, db: Session):
        self.dao = FormulaireDao(db)
        self.indicator_service = IndicatorService(db)
        self.calc_service = CalculationService(db)
        self.db = db
    
    def list_formulaires(self):
        """List all formulaires"""
        return self.dao.get_all()
    
    def get_formulaire(self, formulaire_id: int):
        """Get formulaire by ID"""
        return self.dao.get_by_id(formulaire_id)
    
    def create_formulaire(self, nom: str, demandeur: str, template_type: str,
                         created_by_id: int, indicator_ids: List[int], 
                         chart_types: Optional[Dict[int, str]] = None):
        """Create a new formulaire"""
        return self.dao.create(nom, demandeur, template_type, created_by_id, indicator_ids, chart_types)
    
    def update_formulaire(self, formulaire_id: int, **kwargs):
        """Update a formulaire"""
        return self.dao.update(formulaire_id, **kwargs)
    
    def delete_formulaire(self, formulaire_id: int):
        """Delete a formulaire"""
        return self.dao.delete(formulaire_id)
    
    def generate_formulaire_data(self, formulaire_id: int, 
                                periode: str = None,
                                filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate complete formulaire data with calculated results"""
        formulaire = self.dao.get_by_id(formulaire_id)
        if not formulaire:
            raise ValueError("Formulaire not found")
        
        indicators = self.dao.get_indicators(formulaire_id)
        
        formulaire_data = {
            "id": formulaire.id,
            "nom": formulaire.nom,
            "demandeur": formulaire.demandeur,
            "template_type": formulaire.template_type,
            "indicators": []
        }
        
        # Calculate each indicator
        for indicator in indicators:
            try:
                results = self.calc_service.calculate_indicator(
                    indicator.spec_json,
                    periode=periode,
                    filters=filters
                )
                
                # Get chart type for this indicator
                fi = next((fi for fi in formulaire.formulaire_indicators if fi.indicator_id == indicator.id), None)
                chart_type = fi.chart_type if fi else "none"
                
                formulaire_data["indicators"].append({
                    "id": indicator.id,
                    "title": indicator.title,
                    "description": indicator.description,
                    "results": results,
                    "chart_type": chart_type
                })
            except Exception as e:
                # Add error indicator
                formulaire_data["indicators"].append({
                    "id": indicator.id,
                    "title": indicator.title,
                    "error": str(e),
                    "results": []
                })
        
        return formulaire_data
