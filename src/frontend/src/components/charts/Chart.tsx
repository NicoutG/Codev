import React, { useEffect, useMemo, useState } from 'react';
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
  config?: {
    pieValueKey?: string;   // si m>1, choisir quelle colonne numérique alimente le pie
    maxCharts?: number;     // garde-fou si TOUT génère trop de graphiques
  };
}

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

const SEL_ALL = '-- TOUT --';
const SEL_IGNORE = '-- IGNORER --';

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

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function colorForKey(key: string): string {
  const idx = hashString(key) % COLORS.length;
  return COLORS[idx];
}

function formatLabelValue(v: any): string {
  const s = String(v ?? '').trim();
  return s === '' ? 'N/A' : s;
}

/**
 * Détecte n colonnes labels au début, puis m colonnes numériques.
 */
function detectLeadingLabelColumnCount(rows: any[], cols: string[]): number {
  const sample = rows.slice(0, 20);
  let labelCount = 0;

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];

    const nonEmpty = sample
      .map(r => r?.[col])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    const looksNumeric = nonEmpty.length > 0 && nonEmpty.every(v => isNumericLike(v));

    if (looksNumeric) break;
    labelCount++;
  }

  return Math.min(labelCount, cols.length);
}

type SelectionMap = Record<string, string>;

type ChartGroup = {
  key: string;
  title: string;
  rows: any[];
};

function buildTitle(parts: Array<{ key: string; value: string }>) {
  return parts.map(p => `${p.key}=${p.value}`).join(' | ');
}

export const Chart: React.FC<ChartProps> = ({ type, data, columns, title, config }) => {
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

  const labelCount = useMemo(() => detectLeadingLabelColumnCount(data, columns), [data, columns]);
  const labelCols = useMemo(() => columns.slice(0, labelCount), [columns, labelCount]);
  const numericCols = useMemo(() => columns.slice(labelCount), [columns, labelCount]);

  // Cas flat : 1 label + m numériques (comportement normal)
  const isHierarchical = labelCols.length >= 2 && numericCols.length >= 1;

  // Pour le mode hierarchical :
  // - selects = tous les labels sauf le dernier (catégories)
  const filterLabelCols = useMemo(() => {
    if (!isHierarchical) return [];
    return labelCols.slice(0, labelCols.length - 1);
  }, [isHierarchical, labelCols]);

  const categoryLabelCol = useMemo(() => {
    if (!isHierarchical) return '';
    return labelCols[labelCols.length - 1];
  }, [isHierarchical, labelCols]);

  const pieValueKey = useMemo(() => {
    if (!numericCols.length) return '';
    const wanted = config?.pieValueKey;
    if (wanted && numericCols.includes(wanted)) return wanted;
    return numericCols[0];
  }, [numericCols, config?.pieValueKey]);

  // ===== Selections (avec IGNORER / TOUT) =====
  const [selections, setSelections] = useState<SelectionMap>({});

  // Init : par défaut on met la 1ère valeur dispo (comme ton UX actuelle),
  // mais tu peux changer en SEL_ALL si tu veux démarrer en "tout"
  useEffect(() => {
    if (!isHierarchical) return;

    const next: SelectionMap = {};
    let workingRows = data.slice();

    for (const col of filterLabelCols) {
      const values = Array.from(new Set(workingRows.map(r => formatLabelValue(r?.[col]))))
        .sort((a, b) => a.localeCompare(b, 'fr'));

      // valeur par défaut : première valeur réelle si dispo, sinon N/A
      const chosen = values[0] ?? 'N/A';
      next[col] = chosen;

      // cascade sur valeur choisie (si on initialise sur une valeur)
      workingRows = workingRows.filter(r => formatLabelValue(r?.[col]) === chosen);
    }

    setSelections(next);
  }, [isHierarchical, filterLabelCols, data, labelCols.join('|'), numericCols.join('|')]);

  // Options de select (cascadées) + ajout de TOUT/IGNORER
  const selectOptionsByCol = useMemo(() => {
    if (!isHierarchical) return {} as Record<string, string[]>;

    const result: Record<string, string[]> = {};

    for (let i = 0; i < filterLabelCols.length; i++) {
      const col = filterLabelCols[i];

      // On cascade seulement sur les colonnes précédentes
      // si elles sont fixées à une valeur (ni TOUT ni IGNORER)
      let rows = data.slice();
      for (let j = 0; j < i; j++) {
        const prevCol = filterLabelCols[j];
        const sel = selections[prevCol];
        if (sel && sel !== SEL_ALL && sel !== SEL_IGNORE) {
          rows = rows.filter(r => formatLabelValue(r?.[prevCol]) === sel);
        }
      }

      const values = Array.from(new Set(rows.map(r => formatLabelValue(r?.[col]))))
        .sort((a, b) => a.localeCompare(b, 'fr'));

      result[col] = [SEL_ALL, SEL_IGNORE, ...values];
    }

    return result;
  }, [isHierarchical, filterLabelCols, data, selections]);

  // Quand un select change :
  // - on met la valeur
  // - et on "répare" les selects suivants si leurs valeurs ne sont plus valides
  const handleSelectChange = (col: string, value: string) => {
    setSelections(prev => {
      const next = { ...prev, [col]: value };

      const idx = filterLabelCols.indexOf(col);
      if (idx >= 0) {
        for (let i = idx + 1; i < filterLabelCols.length; i++) {
          const c = filterLabelCols[i];

          // Recompute options for c based on previous fixed selections
          let rows = data.slice();
          for (let j = 0; j < i; j++) {
            const pc = filterLabelCols[j];
            const sel = next[pc];
            if (sel && sel !== SEL_ALL && sel !== SEL_IGNORE) {
              rows = rows.filter(r => formatLabelValue(r?.[pc]) === sel);
            }
          }

          const values = Array.from(new Set(rows.map(r => formatLabelValue(r?.[c]))))
            .sort((a, b) => a.localeCompare(b, 'fr'));

          const allowed = new Set([SEL_ALL, SEL_IGNORE, ...values]);

          const current = next[c];
          if (!current || !allowed.has(current)) {
            // Si on perd la valeur, on retombe sur une valeur réelle si possible, sinon IGNORER
            next[c] = values[0] ?? SEL_IGNORE;
          }
        }
      }

      return next;
    });
  };

  // ===== Préparation données pour un chart : aggregation sur la catégorie =====
  const prepareChartData = (rows: any[]) => {
    const map = new Map<string, any>();

    rows.forEach(r => {
      const cat = formatLabelValue(r?.[categoryLabelCol]);
      if (!map.has(cat)) {
        const base: any = { name: cat };
        numericCols.forEach(nc => (base[nc] = 0));
        map.set(cat, base);
      }
      const acc = map.get(cat)!;
      numericCols.forEach(nc => {
        acc[nc] += toNumberSafe(r?.[nc]);
      });
    });

    const chartData = Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), 'fr')
    );

    const pieData = chartData.map(d => ({
      name: String(d.name),
      value: toNumberSafe(d?.[pieValueKey]),
    }));

    return { chartData, pieData };
  };

  // ===== Rendu d’un chart (bar/line/area/pie) =====
  const renderOneChart = (rows: any[]) => {
    const { chartData, pieData } = prepareChartData(rows);

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {numericCols.map((col) => (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={colorForKey(`series:${col}`)}
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
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {numericCols.map((col) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={colorForKey(`series:${col}`)}
                  strokeWidth={2}
                  name={col}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {numericCols.map((col) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={colorForKey(`series:${col}`)}
                  fill={colorForKey(`series:${col}`)}
                  fillOpacity={0.6}
                  name={col}
                />
              ))}
            </AreaChart>
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
                {pieData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorForKey(`label:${categoryLabelCol}:${String(entry.name)}`)}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Type de graphique non supporté</div>;
    }
  };

  // ===== Mode flat (1 label + m numériques) inchangé =====
  const renderFlatChart = () => {
    const xCol = columns[0];
    const series = columns.slice(1);

    const chartData = data.map((row) => {
      const result: any = {};
      result.name = formatLabelValue(row?.[xCol]);
      series.forEach((c) => (result[c] = toNumberSafe(row?.[c])));
      return result;
    });

    const pieKey = (config?.pieValueKey && series.includes(config.pieValueKey))
      ? config.pieValueKey
      : (series[0] ?? '');

    const pieData = chartData.map((d) => ({
      name: String(d.name),
      value: toNumberSafe(d?.[pieKey]),
    }));

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {series.map((col) => (
                <Bar
                  key={col}
                  dataKey={col}
                  fill={colorForKey(`series:${col}`)}
                  name={col}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {series.map((col) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={colorForKey(`series:${col}`)}
                  strokeWidth={2}
                  name={col}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {series.map((col) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={colorForKey(`series:${col}`)}
                  fill={colorForKey(`series:${col}`)}
                  fillOpacity={0.6}
                  name={col}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorForKey(`label:${xCol}:${String(entry.name)}`)}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Type de graphique non supporté</div>;
    }
  };

  // ===== Génération des charts selon selections (TOUT / IGNORER / valeur) =====
  const chartsToRender: ChartGroup[] = useMemo(() => {
    if (!isHierarchical) return [];

    const maxCharts = config?.maxCharts ?? 200;

    // Colonnes fixées (valeur précise)
    const fixedCols = filterLabelCols.filter(c => {
      const sel = selections[c];
      return sel && sel !== SEL_ALL && sel !== SEL_IGNORE;
    });

    // Colonnes split (TOUT)
    const splitCols = filterLabelCols.filter(c => selections[c] === SEL_ALL);

    // IGNORER : on ne fait rien de spécial, ça veut juste dire "ne pas fixer et ne pas split"
    // => ces colonnes seront automatiquement agrégées par le prepareChartData.

    // Base rows filtrées par fixed only
    let baseRows = data.slice();
    for (const c of fixedCols) {
      const v = selections[c];
      baseRows = baseRows.filter(r => formatLabelValue(r?.[c]) === v);
    }

    if (splitCols.length === 0) {
      // 1 seul chart
      const fixedParts = fixedCols.map(c => ({ key: c, value: selections[c] }));
      const t = fixedParts.length ? buildTitle(fixedParts) : 'Tous';

      return [{
        key: t,
        title: t,
        rows: baseRows
      }];
    }

    // Sinon: group by splitCols combination
    const groupsMap = new Map<string, { title: string; rows: any[] }>();

    for (const r of baseRows) {
      const parts = splitCols.map(c => ({ key: c, value: formatLabelValue(r?.[c]) }));
      const comboTitle = buildTitle(parts);
      const key = comboTitle || 'Tous';

      if (!groupsMap.has(key)) {
        // Titre complet = fixed (si tu veux les afficher) + split
        const fixedParts = fixedCols.map(c => ({ key: c, value: selections[c] }));
        const fullTitle = buildTitle([...fixedParts, ...parts]);
        groupsMap.set(key, { title: fullTitle || key, rows: [] });
      }
      groupsMap.get(key)!.rows.push(r);
    }

    // Tri stable + limite
    const groups = Array.from(groupsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
      .slice(0, maxCharts)
      .map(([k, v]) => ({ key: k, title: v.title, rows: v.rows }));

    return groups;
  }, [isHierarchical, data, filterLabelCols, selections, config?.maxCharts]);

  // ===== Render =====
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: isHierarchical ? '1rem' : '0.75rem',
        flexWrap: 'wrap'
      }}>
        {title && (
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            {title}
          </h3>
        )}

        {isHierarchical && (
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Catégories : <span style={{ color: '#334155', fontWeight: 600 }}>{categoryLabelCol}</span>
            {type === 'pie' && numericCols.length > 1 && (
              <span style={{ marginLeft: '0.5rem' }}>
                (Circulaire basé sur <b>{pieValueKey}</b>)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mode hierarchical */}
      {isHierarchical ? (
        <>
          {/* Selects */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
            {filterLabelCols.map((col) => {
              const opts = selectOptionsByCol[col] ?? [SEL_ALL, SEL_IGNORE];
              const val = selections[col] ?? (opts.includes(SEL_ALL) ? SEL_ALL : (opts[0] ?? SEL_IGNORE));

              return (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {col}
                  </label>
                  <select
                    value={val}
                    onChange={(e) => handleSelectChange(col, e.target.value)}
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
                    {opts.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Charts list (1 ou plusieurs selon TOUT) */}
          {chartsToRender.length === 0 ? (
            <div style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#64748b' }}>Aucune donnée pour cette sélection</p>
            </div>
          ) : chartsToRender.length === 1 ? (
            renderOneChart(chartsToRender[0].rows)
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              {chartsToRender.length >= (config?.maxCharts ?? 200) && (
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  flex: '0 0 32%',   // 3 par ligne
                  minWidth: '300px'  // évite que ça devienne trop petit
                }}>
                  Trop de graphiques à afficher : rendu limité à {config?.maxCharts ?? 200}.
                  (Tu peux ajuster <b>config.maxCharts</b>)
                </div>
              )}

              {chartsToRender.map((g) => (
                <div key={g.key} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}>
                      {g.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {g.rows.length} ligne{g.rows.length > 1 ? 's' : ''} — catégories: {categoryLabelCol}
                    </div>
                  </div>

                  {renderOneChart(g.rows)}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Mode flat
        renderFlatChart()
      )}
    </div>
  );
};