import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getIndicator, calculateIndicator } from "../api/indicatorApi";
import { exportIndicatorExcel } from "../api/exportApi";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function IndicatorResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [periode, setPeriode] = useState("");
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadIndicator();
  }, [id]);

  async function loadIndicator() {
    try {
      const data = await getIndicator(id);
      setIndicator(data);
    } catch (err) {
      console.error("Error loading indicator:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCalculate() {
    setCalculating(true);
    try {
      const filters = {};
      if (annee) filters.annee = parseInt(annee);
      
      const data = await calculateIndicator(id, periode || null, Object.keys(filters).length > 0 ? filters : null);
      setResults(data.results || []);
    } catch (err) {
      alert("Erreur lors du calcul: " + err.message);
    } finally {
      setCalculating(false);
    }
  }

  async function handleExport() {
    try {
      await exportIndicatorExcel(id, "default");
    } catch (err) {
      alert("Erreur lors de l'export: " + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (!indicator) {
    return <div style={{ padding: "20px" }}>Indicateur non trouvé</div>;
  }

  // Prepare data for charts
  const chartData = results.length > 0 ? results.map((r, idx) => ({
    name: Object.values(r)[0] || `Valeur ${idx + 1}`,
    value: Object.values(r)[1] || Object.values(r)[Object.keys(r).length - 1] || 0
  })) : [];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>{indicator.title}</h1>
          {indicator.description && <p style={{ color: "#666" }}>{indicator.description}</p>}
        </div>
        <button
          onClick={() => navigate("/indicators")}
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
        <h3 style={{ marginTop: 0 }}>Paramètres de calcul</h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Période
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">Toutes périodes</option>
              <option value="6_mois">6 mois</option>
              <option value="18_mois">18 mois</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Année
            </label>
            <input
              type="number"
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              placeholder="Année"
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            style={{
              padding: "8px 20px",
              backgroundColor: calculating ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: calculating ? "not-allowed" : "pointer"
            }}
          >
            {calculating ? "Calcul..." : "Calculer"}
          </button>
          {results.length > 0 && (
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
          )}
        </div>
      </div>

      {results.length > 0 && (
        <>
          <div style={{ marginBottom: "30px" }}>
            <h2>Résultats</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(results[0]).map((key) => (
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

          {chartData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "30px", marginTop: "30px" }}>
              <div>
                <h3>Graphique en camembert</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3>Graphique en barres</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {results.length === 0 && !calculating && (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          Cliquez sur "Calculer" pour voir les résultats
        </div>
      )}
    </div>
  );
}
