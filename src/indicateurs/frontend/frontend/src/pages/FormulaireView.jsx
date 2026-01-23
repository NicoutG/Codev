import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateFormulaire, getAvailableParams } from "../api/formulaireApi";
import { exportFormulaire } from "../api/exportApi";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FormulaireView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulaireData, setFormulaireData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("");
  const [annee, setAnnee] = useState("");
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    loadAvailableParams();
  }, [id]);

  useEffect(() => {
    loadFormulaire();
  }, [id, periode, annee]);

  async function loadAvailableParams() {
    try {
      const params = await getAvailableParams(parseInt(id));
      setAvailablePeriods(params.periods || []);
      setAvailableYears(params.years || []);
    } catch (err) {
      console.error("Error loading available params:", err);
    }
  }

  async function loadFormulaire() {
    try {
      const filters = {};
      if (annee) filters.annee = parseInt(annee);
      
      const data = await generateFormulaire(
        parseInt(id),
        periode || null,
        Object.keys(filters).length > 0 ? filters : null
      );
      setFormulaireData(data);
    } catch (err) {
      alert("Erreur lors du chargement: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const filters = {};
      if (annee) filters.annee = parseInt(annee);
      
      await exportFormulaire(
        parseInt(id),
        periode || null,
        Object.keys(filters).length > 0 ? filters : null
      );
    } catch (err) {
      alert("Erreur lors de l'export: " + err.message);
    }
  }

  function handleReset() {
    setPeriode("");
    setAnnee("");
  }

  function prepareChartData(results) {
    if (!results || results.length === 0) return [];
    return results.map((r, idx) => ({
      name: Object.values(r)[0] || `Valeur ${idx + 1}`,
      value: Object.values(r)[1] || Object.values(r)[Object.keys(r).length - 1] || 0
    }));
  }

  function renderChart(chartType, data, title) {
    if (!data || data.length === 0) return null;

    switch (chartType) {
      case "pie":
        return (
          <div>
            <h4>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      case "bar":
        return (
          <div>
            <h4>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "line":
        return (
          <div>
            <h4>{title}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (!formulaireData) {
    return <div style={{ padding: "20px" }}>Formulaire non trouvé</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>{formulaireData.nom}</h1>
          <p style={{ color: "#666" }}>
            Demandeur: {formulaireData.demandeur} | Template: {formulaireData.template_type}
          </p>
        </div>
        <button
          onClick={() => navigate("/formulaires")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Retour
        </button>
      </div>

      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <h3 style={{ marginTop: 0 }}>Paramètres</h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Période
            </label>
            <select
              value={periode}
              onChange={(e) => {
                setPeriode(e.target.value);
              }}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minWidth: "150px"
              }}
            >
              <option value="">Toutes périodes</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p === "6_mois" ? "6 mois" : p === "18_mois" ? "18 mois" : p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Année
            </label>
            <select
              value={annee}
              onChange={(e) => {
                setAnnee(e.target.value);
              }}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minWidth: "150px"
              }}
            >
              <option value="">Toutes années</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Réinitialiser
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: "8px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Exporter Excel
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "30px" }}>
        {formulaireData.indicators.map((indicator) => {
          const chartData = prepareChartData(indicator.results);
          const chartType = indicator.chart_type || "none";

          return (
            <div
              key={indicator.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "white"
              }}
            >
              <h2>{indicator.title}</h2>
              {indicator.description && (
                <p style={{ color: "#666", marginBottom: "20px" }}>{indicator.description}</p>
              )}

              {indicator.error ? (
                <div style={{ color: "red", padding: "10px", backgroundColor: "#fee", borderRadius: "4px" }}>
                  Erreur: {indicator.error}
                </div>
              ) : (
                <>
                  {chartType !== "none" && chartData.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      {renderChart(chartType, chartData, indicator.title)}
                    </div>
                  )}

                  {indicator.results && indicator.results.length > 0 && (
                    <div>
                      <h3>Résultats</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#f0f0f0" }}>
                              {Object.keys(indicator.results[0]).map((key) => (
                                <th key={key} style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {indicator.results.map((row, idx) => (
                              <tr key={idx}>
                                {Object.keys(indicator.results[0]).map((key) => (
                                  <td key={key} style={{ padding: "10px", border: "1px solid #ddd" }}>
                                    {row[key] !== null && row[key] !== undefined ? String(row[key]) : ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
