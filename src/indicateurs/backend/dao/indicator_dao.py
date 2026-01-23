from sqlalchemy.orm import Session
from models import Indicator, IndicatorResult
from typing import List, Optional, Dict, Any

class IndicatorDao:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self) -> List[Indicator]:
        """Get all indicators"""
        return self.db.query(Indicator).all()
    
    def get_by_id(self, indicator_id: int) -> Optional[Indicator]:
        """Get indicator by ID"""
        return self.db.query(Indicator).filter(Indicator.id == indicator_id).first()
    
    def create(self, title: str, description: str, spec_json: Dict[str, Any], 
               created_by_id: int, is_predefined: bool = False) -> Indicator:
        """Create a new indicator"""
        indicator = Indicator(
            title=title,
            description=description,
            spec_json=spec_json,
            created_by_id=created_by_id,
            is_predefined=is_predefined
        )
        self.db.add(indicator)
        self.db.commit()
        self.db.refresh(indicator)
        return indicator
    
    def update(self, indicator_id: int, **kwargs) -> Optional[Indicator]:
        """Update an indicator"""
        indicator = self.get_by_id(indicator_id)
        if not indicator:
            return None
        
        for key, value in kwargs.items():
            if hasattr(indicator, key):
                setattr(indicator, key, value)
        
        self.db.commit()
        self.db.refresh(indicator)
        return indicator
    
    def delete(self, indicator_id: int) -> bool:
        """Delete an indicator"""
        indicator = self.get_by_id(indicator_id)
        if not indicator:
            return False
        
        self.db.delete(indicator)
        self.db.commit()
        return True
    
    def get_predefined(self) -> List[Indicator]:
        """Get all predefined indicators"""
        return self.db.query(Indicator).filter(Indicator.is_predefined == True).all()
    
    def save_result(self, indicator_id: int, periode: str, 
                   valeurs_json: Dict[str, Any], filters_json: Optional[Dict[str, Any]] = None) -> IndicatorResult:
        """Save calculation result"""
        result = IndicatorResult(
            indicator_id=indicator_id,
            periode=periode,
            valeurs_json=valeurs_json,
            filters_json=filters_json or {}
        )
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result
    
    def get_results(self, indicator_id: int) -> List[IndicatorResult]:
        """Get all results for an indicator"""
        return self.db.query(IndicatorResult).filter(
            IndicatorResult.indicator_id == indicator_id
        ).order_by(IndicatorResult.calculated_at.desc()).all()
