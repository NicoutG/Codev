"""
Script pour créer le rapport CTI avec les 9 indicateurs d'insertion professionnelle.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.indicator import Indicator
from app.models.report import Report
from app.models.user import User


def create_cti_report(db: Session):
    """
    Crée le rapport prédéfini "Emploi pour la CTI" avec les 9 indicateurs CTI.
    """
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        print("❌ Utilisateur admin non trouvé. Veuillez d'abord exécuter seed_users.")
        return None
    
    # Vérifier si le rapport existe déjà
    existing_report = db.query(Report).filter(Report.title == "Emploi pour la CTI").first()
    if existing_report:
        print(f"⚠️  Le rapport 'Emploi pour la CTI' existe déjà (ID: {existing_report.id})")
        print("   Suppression de l'ancien rapport...")
        # Supprimer les associations existantes
        db.execute(
            text("DELETE FROM report_indicators WHERE report_id = :report_id"),
            {"report_id": existing_report.id}
        )
        db.delete(existing_report)
        db.commit()
    
    # Récupérer les 9 indicateurs CTI (par ordre d'ID ou par titre)
    cti_indicator_titles = [
        "Nombre de diplômés employés (y compris thèses et VIE)",
        "Insertion de diplômés en moins de 2 mois",
        "En recherche d'emploi 6 mois après l'obtention du diplôme",
        "Embauche avec un statut de cadre (détail H/F)",
        "Insertion en CDI (détail H/F)",
        "Nombre de diplômés ayant un emploi basé en France",
        "Insertion poste basé à l'étranger",
        "Nombre de diplômés actuellement en thèse",
        "Diplômés en poursuite d'études"
    ]
    
    indicators = []
    for title in cti_indicator_titles:
        indicator = db.query(Indicator).filter(Indicator.title == title).first()
        if indicator:
            indicators.append(indicator)
        else:
            print(f"⚠️  Indicateur non trouvé: {title}")
    
    if len(indicators) != 9:
        print(f"❌ Erreur: {len(indicators)}/9 indicateurs trouvés. Veuillez d'abord exécuter seed_predefined_indicators.")
        return None
    
    # Créer le nouveau rapport
    report = Report(
        title="Emploi pour la CTI",
        description="Rapport regroupant les 9 indicateurs d'insertion professionnelle pour les demandes de la CTI.",
        created_by=admin_user.id
    )
    db.add(report)
    db.flush()  # Pour obtenir l'ID
    
    # Associer les indicateurs avec leurs graphiques
    chart_configs = {
        0: {"chart_type": "bar", "display_order": 0},  # Nombre employés
        1: {"chart_type": "bar", "display_order": 1},  # Insertion < 2 mois
        2: {"chart_type": "bar", "display_order": 2},  # Recherche ≥ 6 mois
        3: {"chart_type": "bar", "display_order": 3},  # Cadre H/F (barres groupées)
        4: {"chart_type": "bar", "display_order": 4},  # CDI H/F (barres groupées)
        5: {"chart_type": "bar", "display_order": 5},  # Emploi France
        6: {"chart_type": "bar", "display_order": 6},  # Emploi étranger
        7: {"chart_type": "bar", "display_order": 7},  # En thèse
        8: {"chart_type": "bar", "display_order": 8}   # Poursuite études
    }
    
    for idx, indicator in enumerate(indicators):
        config = chart_configs.get(idx, {"chart_type": "bar", "display_order": idx})
        db.execute(
            text("""
                INSERT INTO report_indicators (report_id, indicator_id, chart_type, chart_config, display_order)
                VALUES (:report_id, :indicator_id, :chart_type, :chart_config, :display_order)
            """),
            {
                "report_id": report.id,
                "indicator_id": indicator.id,
                "chart_type": config["chart_type"],
                "chart_config": "{}",
                "display_order": config["display_order"]
            }
        )
    
    db.commit()
    print(f"✅ Rapport 'Emploi pour la CTI' créé avec succès (ID: {report.id})")
    print(f"   {len(indicators)} indicateurs associés")
    return report


if __name__ == "__main__":
    db = SessionLocal()
    try:
        create_cti_report(db)
    finally:
        db.close()
