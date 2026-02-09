from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.dao.report_dao import ReportDao
from app.dao.indicator_dao import IndicatorDao
from app.schemas.report import ReportCreate, ReportUpdate
from app.models.user import User
from app.models.report import Report


class ReportService:
    def __init__(self):
        self.dao = ReportDao()
        self.indicator_dao = IndicatorDao()

    def list_reports(self, db: Session, skip: int = 0, limit: int = 100) -> List[Report]:
        return self.dao.get_all(db, skip=skip, limit=limit)

    def get_report(self, db: Session, report_id: int) -> Report:
        report = self.dao.get_by_id(db, report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rapport introuvable"
            )
        return report

    def create_report(self, db: Session, data: ReportCreate, current_user: User) -> Report:
        # Vérifier que tous les indicateurs existent
        for indicator_id in data.indicator_ids:
            indicator = self.indicator_dao.get_by_id(db, indicator_id)
            if not indicator:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Indicateur {indicator_id} introuvable"
                )

        # Préparer les configurations d'indicateurs
        indicator_configs = []
        
        # Si indicator_configs est fourni, l'utiliser
        if data.indicator_configs:
            for config in data.indicator_configs:
                indicator_configs.append({
                    'indicator_id': config.indicator_id,
                    'chart_type': config.chart_type,
                    'chart_config': config.chart_config,
                    'display_order': config.display_order
                })
        # Sinon, utiliser indicator_ids avec valeurs par défaut
        else:
            for idx, indicator_id in enumerate(data.indicator_ids):
                indicator_configs.append({
                    'indicator_id': indicator_id,
                    'chart_type': None,
                    'chart_config': None,
                    'display_order': idx
                })

        return self.dao.create(
            db=db,
            title=data.title,
            description=data.description,
            created_by=current_user.id,
            indicator_configs=indicator_configs
        )

    def update_report(self, db: Session, report_id: int, data: ReportUpdate) -> Report:
        report = self.get_report(db, report_id)

        # Vérifier les indicateurs si fournis
        if data.indicator_ids is not None:
            for indicator_id in data.indicator_ids:
                indicator = self.indicator_dao.get_by_id(db, indicator_id)
                if not indicator:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Indicateur {indicator_id} introuvable"
                    )

        # Préparer les configurations si fournies
        indicator_configs = None
        if data.indicator_configs is not None:
            indicator_configs = []
            for config in data.indicator_configs:
                indicator_configs.append({
                    'indicator_id': config.indicator_id,
                    'chart_type': config.chart_type,
                    'chart_config': config.chart_config,
                    'display_order': config.display_order
                })
        elif data.indicator_ids is not None:
            # Si seulement indicator_ids est fourni, utiliser valeurs par défaut
            indicator_configs = []
            for idx, indicator_id in enumerate(data.indicator_ids):
                indicator_configs.append({
                    'indicator_id': indicator_id,
                    'chart_type': None,
                    'chart_config': None,
                    'display_order': idx
                })

        return self.dao.update(
            db=db,
            report=report,
            title=data.title,
            description=data.description,
            indicator_configs=indicator_configs
        )

    def delete_report(self, db: Session, report_id: int) -> None:
        report = self.get_report(db, report_id)
        self.dao.delete(db, report)
