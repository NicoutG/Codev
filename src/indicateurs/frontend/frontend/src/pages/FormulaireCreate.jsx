import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getIndicators } from "../api/indicatorApi";
import { createFormulaire } from "../api/formulaireApi";

export default function FormulaireCreate() {
  const [nom, setNom] = useState("");
  const [demandeur, setDemandeur] = useState("CTI");
  const [templateType, setTemplateType] = useState("CTI");
  const [indicators, setIndicators] = useState([]);
  const [availableIndicators, setAvailableIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadIndicators();
  }, []);

  async function loadIndicators() {
    try {
      const data = await getIndicators();
      setAvailableIndicators(data);
    } catch (err) {
      console.error("Error loading indicators:", err);
    }
  }

  function toggleIndicator(id) {
    if (indicators.includes(id)) {
      setIndicators(indicators.filter((i) => i !== id));
    } else {
      setIndicators([...indicators, id]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom || indicators.length === 0) {
      alert("Veuillez remplir tous les champs et sélectionner au moins un indicateur");
      return;
    }

    setLoading(true);
    try {
      await createFormulaire({
        nom,
        demandeur,
        template_type: templateType,
        indicator_ids: indicators
      });
      navigate("/formulaires");
    } catch (err) {
      alert("Erreur lors de la création: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Créer un formulaire</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Nom du formulaire *
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Demandeur *
          </label>
          <select
            value={demandeur}
            onChange={(e) => setDemandeur(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="CTI">CTI</option>
            <option value="Lyon1">Lyon 1</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Type de template *
          </label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          >
            <option value="CTI">CTI</option>
            <option value="Lyon1">Lyon 1</option>
            <option value="default">Par défaut</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
            Indicateurs * (sélectionnez au moins un)
          </label>
          <div style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "15px",
            maxHeight: "400px",
            overflowY: "auto"
          }}>
            {availableIndicators.map((indicator) => (
              <label
                key={indicator.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                  cursor: "pointer",
                  backgroundColor: indicators.includes(indicator.id) ? "#e3f2fd" : "transparent",
                  borderRadius: "4px",
                  marginBottom: "5px"
                }}
              >
                <input
                  type="checkbox"
                  checked={indicators.includes(indicator.id)}
                  onChange={() => toggleIndicator(indicator.id)}
                  style={{ marginRight: "10px" }}
                />
                <div>
                  <div style={{ fontWeight: "bold" }}>{indicator.title}</div>
                  {indicator.description && (
                    <div style={{ fontSize: "14px", color: "#666" }}>{indicator.description}</div>
                  )}
                  {indicator.is_predefined && (
                    <span style={{
                      fontSize: "12px",
                      color: "#ff9800",
                      marginLeft: "10px"
                    }}>
                      Pré-défini
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
          {indicators.length > 0 && (
            <p style={{ marginTop: "10px", color: "#666" }}>
              {indicators.length} indicateur(s) sélectionné(s)
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Création..." : "Créer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/formulaires")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
