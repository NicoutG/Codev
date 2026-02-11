import React, { useMemo, useState } from 'react';
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  Bar,
  Line,
  Pie,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  columns: string[];
  title?: string;
  config?: any;
}

// Couleurs pour les graphiques
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

function isNumericLike(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  const s = String(value).trim();
  if (s === '') return false;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n);
}

function toNumberSafe(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Détecte combien de colonnes "label" on a au début, avant la/les colonnes numériques.
 * Ex:
 *  - [label, nb] => 1
 *  - [label1, label2, nb] => 2
 *  - [label1, label2, nb1, nb2] => 2
 */
function detectLeadingLabelColumnCount(rows: any[], cols: string[]): number {
  const sample = rows.slice(0, 15);
  let labelCount = 0;

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];

    // Une colonne est considérée numérique si TOUS les values non vides du sample sont numeric-like
    const nonEmpty = sample
      .map(r => r?.[col])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    const looksNumeric = nonEmpty.length > 0 && nonEmpty.every(v => isNumericLike(v));

    if (looksNumeric) break;
    labelCount++;
  }

  return Math.min(labelCount, 2);
}

export const Chart: React.FC<ChartProps> = ({ type, data, columns, title, config }) => {
  const [twoLabelViewMode, setTwoLabelViewMode] = useState<'all' | 'select'>('all'); // NEW

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ color: '#64748b' }}>Aucune donnée à afficher</p>
      </div>
    );
  }

  const labelCount = detectLeadingLabelColumnCount(data, columns);
  const isTwoLabelMode = labelCount >= 2 && columns.length >= 3;

  // --- Helpers pour rendre un chart (utilisé par les deux modes) ---
  const renderOneChart = (
    chartType: ChartProps['type'],
    chartData: any[],
    pieData: any[],
    valueCols: string[]
  ) => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {valueCols.map((col, idx) => (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={COLORS[idx % COLORS.length]}
                  name={col}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {valueCols.map((col, idx) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  name={col}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={95}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {valueCols.map((col, idx) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.6}
                  name={col}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Type de graphique non supporté</div>;
    }
  };

  // --- Mode 2 labels ---
  const twoLabelGroups = useMemo(() => {
    if (!isTwoLabelMode) return [];

    const groupCol = columns[0];
    const categoryCol = columns[1];
    const valueCols = columns.slice(labelCount);

    const groupsMap = new Map<string, any[]>();
    data.forEach((row) => {
      const g = String(row?.[groupCol] ?? 'N/A').trim() || 'N/A';
      if (!groupsMap.has(g)) groupsMap.set(g, []);
      groupsMap.get(g)!.push(row);
    });

    const groups = Array.from(groupsMap.entries()).map(([groupName, rows]) => {
      const chartData = rows.map((row) => {
        const result: any = {};
        result.name = String(row?.[categoryCol] ?? 'N/A').trim() || 'N/A';
        valueCols.forEach((col) => {
          result[col] = toNumberSafe(row?.[col]);
        });
        return result;
      });

      const pieValueCol = valueCols[0];
      const pieData = rows.map((row, idx) => ({
        name: String(row?.[categoryCol] ?? `Catégorie ${idx + 1}`).trim() || 'N/A',
        value: toNumberSafe(row?.[pieValueCol]),
      }));

      return { groupName, chartData, pieData, valueCols };
    });

    // Tri stable pour un affichage plus propre
    groups.sort((a, b) => a.groupName.localeCompare(b.groupName, 'fr'));

    return groups;
  }, [isTwoLabelMode, data, columns, labelCount]);

  const [selectedGroupName, setSelectedGroupName] = useState<string>('');

  // Sync sélection par défaut quand on arrive en mode select / quand les groups changent
  React.useEffect(() => {
    if (!isTwoLabelMode) return;

    if (twoLabelViewMode === 'select') {
      const first = twoLabelGroups[0]?.groupName || '';
      setSelectedGroupName((prev) => prev || first);
    }
  }, [isTwoLabelMode, twoLabelGroups, twoLabelViewMode]);

  // --- Mode normal (1 label + N valeurs) ---
  const chartData = useMemo(() => {
    return data.map((row) => {
      const result: any = {};
      if (columns[0]) {
        result.name = String(row[columns[0]] || 'N/A');
      }
      columns.slice(1).forEach((col) => {
        result[col] = toNumberSafe(row?.[col]);
      });
      return result;
    });
  }, [data, columns]);

  const pieData = useMemo(() => {
    return data.map((row, idx) => ({
      name: String(row[columns[0]] || `Catégorie ${idx + 1}`),
      value: toNumberSafe(row?.[columns[1]])
    }));
  }, [data, columns]);

  const renderNormalChart = () => {
    return renderOneChart(type, chartData, pieData, columns.slice(1));
  };

  // --- UI toggle + rendu ---
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {(title || isTwoLabelMode) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {title ? (
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              {title}
            </h3>
          ) : <div />}

          {isTwoLabelMode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                {twoLabelViewMode === 'all' ? 'Tous les graphiques' : 'Sélection'}
              </span>

              <button
                type="button"
                onClick={() => setTwoLabelViewMode(prev => (prev === 'all' ? 'select' : 'all'))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: twoLabelViewMode === 'all' ? '#f1f5f9' : '#e0e7ff',
                  color: twoLabelViewMode === 'all' ? '#334155' : '#1e40af',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {twoLabelViewMode === 'all' ? '🔽 Passer en sélection' : '📊 Tout afficher'}
              </button>
            </div>
          )}
        </div>
      )}

      {isTwoLabelMode ? (
        twoLabelViewMode === 'select' ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <label style={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: 500
              }}>
                Choisir :
              </label>

              <select
                value={selectedGroupName}
                onChange={(e) => setSelectedGroupName(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  minWidth: '220px',
                  outline: 'none'
                }}
              >
                {twoLabelGroups.map(g => (
                  <option key={g.groupName} value={g.groupName}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const g = twoLabelGroups.find(x => x.groupName === selectedGroupName) || twoLabelGroups[0];
              if (!g) {
                return (
                  <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: '#64748b' }}>Aucune donnée à afficher</p>
                  </div>
                );
              }

              return (
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '0.75rem'
                  }}>
                    {g.groupName}
                  </div>

                  {renderOneChart(type, g.chartData, g.pieData, g.valueCols)}
                </div>
              );
            })()}
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {twoLabelGroups.map((g) => (
              <div
                key={g.groupName}
                style={{
                  flex: '1 1 420px',
                  minWidth: '320px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '0.75rem'
                }}>
                  {g.groupName}
                </div>

                {renderOneChart(type, g.chartData, g.pieData, g.valueCols)}
              </div>
            ))}
          </div>
        )
      ) : (
        renderNormalChart()
      )}
    </div>
  );
};
