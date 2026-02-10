from sqlalchemy import Column, Integer, String, Text

from app.core.database import Base


class Insertion(Base):
    __tablename__ = "insertion"

    # PK
    code = Column(String(64), primary_key=True, index=True)

    # Champs très variables -> Text (sauf num évident)
    date = Column(Text, nullable=True)  # ex: "mars-23"
    promotion = Column(Integer, nullable=True)  # ex: 2022

    formation = Column(Text, nullable=True)
    specialite = Column(Text, nullable=True)

    # Exemple: 'M' / 'F'
    genre = Column(String(8), nullable=True)

    age = Column(Integer, nullable=True)
    nationalite = Column(Text, nullable=True)
    bac = Column(Text, nullable=True)

    csp = Column(Integer, nullable=True)

    reponse = Column(Text, nullable=True)
    situation_mars = Column(Text, nullable=True)

    recherche_emploi_depuis = Column(Text, nullable=True)
    refus_plusieurs_emplois = Column(Text, nullable=True)

    type_etude = Column(Text, nullable=True)
    type_etude_autre = Column(Text, nullable=True)

    secteur_cifre = Column(Text, nullable=True)
    secteur_cifre_autre = Column(Text, nullable=True)

    intitule_formation = Column(Text, nullable=True)
    etablissement_formation = Column(Text, nullable=True)

    situation_represente = Column(Text, nullable=True)
    situation_represente_autre = Column(Text, nullable=True)

    egalement_recherche_emploi = Column(Text, nullable=True)
    premier_emploi_depuis_diplome = Column(Text, nullable=True)

    situation = Column(Text, nullable=True)
    situation_inactive_depuis = Column(Text, nullable=True)

    num_emploi = Column(Text, nullable=True)

    temps_pour_premier_emploi = Column(Text, nullable=True)

    moyen_trouver_emploi = Column(Text, nullable=True)
    moyen_trouver_emploi_autre = Column(Text, nullable=True)

    employeur = Column(Text, nullable=True)
    employeur_autre = Column(Text, nullable=True)

    secteur_activite_organisme = Column(Text, nullable=True)

    type_emploi = Column(Text, nullable=True)
    type_emploi_autre = Column(Text, nullable=True)

    type_volontariat = Column(Text, nullable=True)
    type_volontariat_autre = Column(Text, nullable=True)

    statut_emploi = Column(Text, nullable=True)

    condition_depart_entreprise = Column(Text, nullable=True)
    condition_depart_entreprise_autre = Column(Text, nullable=True)
    objectif_premier_emploi = Column(Text, nullable=True)
    objectif_premier_emploi_autre = Column(Text, nullable=True)
    intitule_emploi = Column(Text, nullable=True)
    responsabilite_hierarchique = Column(Text, nullable=True)
    responsabilite_projet = Column(Text, nullable=True)
    responsabilite_equipe = Column(Text, nullable=True)
    responsabilite_budget = Column(Text, nullable=True)
    mission_rse = Column(Text, nullable=True)
    mission_rse_environnement = Column(Text, nullable=True)
    mission_rse_egalite = Column(Text, nullable=True)
    mission_rse_handicap = Column(Text, nullable=True)
    mission_rse_ouverture = Column(Text, nullable=True)
    mission_rse_ethique = Column(Text, nullable=True)
    mission_rse_autre = Column(Text, nullable=True)
    moyen_trouver_emploi_2 = Column(Text, nullable=True)
    moyen_trouver_emploi_autre_2 = Column(Text, nullable=True)
    critere_principal = Column(Text, nullable=True)
    critere_principal_autre = Column(Text, nullable=True)
    duree_trouver_emploi = Column(Text, nullable=True)
    employeur_2 = Column(Text, nullable=True)
    employeur_2_autre = Column(Text, nullable=True)
    employeur_2_type = Column(Text, nullable=True)
    taille_organisme_2 = Column(Text, nullable=True)
    secteur_activite_organisme_2 = Column(Text, nullable=True)
    type_emploi_2 = Column(Text, nullable=True)
    statut_emploi_autre_2 = Column(Text, nullable=True)
    createur_entreprise = Column(Text, nullable=True)
    activite_principale = Column(Text, nullable=True)
    type_volontariat_2 = Column(Text, nullable=True)
    type_volontariat_autre_2 = Column(Text, nullable=True)
    statut_emploi_2 = Column(Text, nullable=True)
    fonction_emploi_2 = Column(Text, nullable=True)
    fonction_emploi_autre_2 = Column(Text, nullable=True)
    temps_travail = Column(Text, nullable=True)
    heure_par_semaine = Column(Text, nullable=True)
    teletravail = Column(Text, nullable=True)
    moyenne_jours_teletravail = Column(Integer, nullable=True)
    departement = Column(Text, nullable=True)
    pays = Column(Text, nullable=True)
    ville = Column(Text, nullable=True)
    emploi_represente_2 = Column(Text, nullable=True)
    emploi_represente_autre_2 = Column(Text, nullable=True)
    recherche_emploi = Column(Text, nullable=True)
    raison_recherche_emploi = Column(Text, nullable=True)
