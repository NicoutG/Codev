from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.report import Report, report_indicators
from app.models.indicator import Indicator
from typing import List, Optional


class ReportDao:
    def get_by_id(self, db: Session, report_id: int) -> Optional[Report]:
        return db.query(Report).filter(Report.id == report_id).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).order_by(Report.id.desc()).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        title: str,
        description: Optional[str],
        created_by: Optional[int],
        indicator_configs: List[dict]
    ) -> Report:
        """
        Crée un rapport avec ses indicateurs associés.
        indicator_configs: Liste de dict avec {indicator_id, chart_type, chart_config, display_order}
        """
        report = Report(
            title=title,
            description=description,
            created_by=created_by
        )
        db.add(report)
        db.flush()  # Pour obtenir l'ID du rapport

        # Associer les indicateurs
        for config in indicator_configs:
            indicator_id = config.get('indicator_id')
            chart_type = config.get('chart_type')
            chart_config = config.get('chart_config')
            display_order = config.get('display_order', 0)
            
            # Convertir chart_config en JSON string si c'est un dict
            chart_config_str = None
            if chart_config:
                import json
                chart_config_str = json.dumps(chart_config) if isinstance(chart_config, dict) else chart_config
            
            db.execute(
                report_indicators.insert().values(
                    report_id=report.id,
                    indicator_id=indicator_id,
                    chart_type=chart_type,
                    chart_config=chart_config_str,
                    display_order=display_order
                )
            )

        db.commit()
        db.refresh(report)
        return report

    def update(
        self,
        db: Session,
        report: Report,
        title: Optional[str] = None,
        description: Optional[str] = None,
        indicator_configs: Optional[List[dict]] = None
    ) -> Report:
        if title is not None:
            report.title = title
        if description is not None:
            report.description = description

        # Mettre à jour les indicateurs si fourni
        if indicator_configs is not None:
            # Supprimer les associations existantes
            db.execute(
                report_indicators.delete().where(
                    report_indicators.c.report_id == report.id
                )
            )
            
            # Ajouter les nouvelles associations
            for config in indicator_configs:
                indicator_id = config.get('indicator_id')
                chart_type = config.get('chart_type')
                chart_config = config.get('chart_config')
                display_order = config.get('display_order', 0)
                
                chart_config_str = None
                if chart_config:
                    import json
                    chart_config_str = json.dumps(chart_config) if isinstance(chart_config, dict) else chart_config
                
                db.execute(
                    report_indicators.insert().values(
                        report_id=report.id,
                        indicator_id=indicator_id,
                        chart_type=chart_type,
                        chart_config=chart_config_str,
                        display_order=display_order
                    )
                )

        db.commit()
        db.refresh(report)
        return report

    def delete(self, db: Session, report: Report) -> None:
        db.delete(report)
        db.commit()

    def get_indicators_with_config(self, db: Session, report_id: int) -> List[dict]:
        """
        Récupère les indicateurs d'un rapport avec leur configuration.
        Retourne une liste de dict avec {indicator, chart_type, chart_config, display_order}
        """
        results = db.query(
            Indicator,
            report_indicators.c.chart_type,
            report_indicators.c.chart_config,
            report_indicators.c.display_order
        ).join(
            report_indicators,
            Indicator.id == report_indicators.c.indicator_id
        ).filter(
            report_indicators.c.report_id == report_id
        ).order_by(
            report_indicators.c.display_order
        ).all()

        indicators_with_config = []
        for indicator, chart_type, chart_config_str, display_order in results:
            chart_config = None
            if chart_config_str:
                import json
                try:
                    chart_config = json.loads(chart_config_str)
                except:
                    chart_config = chart_config_str

            indicators_with_config.append({
                'indicator': indicator,
                'chart_type': chart_type,
                'chart_config': chart_config,
                'display_order': display_order
            })

        return indicators_with_config
