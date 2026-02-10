import React from 'react';
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

  // Préparer les données pour les graphiques
  // Détecter si on a un group_by (première colonne = catégorie, autres = valeurs)
  const hasGroupBy = columns.length > 1 && 
    (typeof data[0]?.[columns[0]] === 'string' || typeof data[0]?.[columns[0]] === 'number');
  
  // Pour les graphiques avec group_by (ex: Genre -> Nombre)
  const chartData = data.map((row) => {
    const result: any = {};
    // Première colonne = catégorie (X axis)
    if (columns[0]) {
      result.name = String(row[columns[0]] || 'N/A');
    }
    // Autres colonnes = valeurs (Y axis)
    columns.slice(1).forEach((col) => {
      const value = row[col];
      result[col] = value !== null && value !== undefined ? 
        (typeof value === 'number' ? value : parseFloat(String(value)) || 0) : 0;
    });
    return result;
  });

  // Pour les graphiques en camembert
  const pieData = data.map((row, idx) => ({
    name: String(row[columns[0]] || `Catégorie ${idx + 1}`),
    value: typeof row[columns[1]] === 'number' ? row[columns[1]] : 
      (parseFloat(String(row[columns[1]])) || 0)
  }));

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {columns.slice(1).map((col, idx) => (
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
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {columns.slice(1).map((col, idx) => (
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
                {pieData.map((entry, index) => (
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
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              {columns.slice(1).map((col, idx) => (
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

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {title && (
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          {title}
        </h3>
      )}
      {renderChart()}
    </div>
  );
};
