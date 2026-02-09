import React from 'react';

// Import conditionnel de recharts (sera installé plus tard)
let BarChart: any, LineChart: any, PieChart: any, AreaChart: any;
let Bar: any, Line: any, Pie: any, Area: any, XAxis: any, YAxis: any, CartesianGrid: any, Tooltip: any, Legend: any, ResponsiveContainer: any;

try {
  const recharts = require('recharts');
  BarChart = recharts.BarChart;
  LineChart = recharts.LineChart;
  PieChart = recharts.PieChart;
  AreaChart = recharts.AreaChart;
  Bar = recharts.Bar;
  Line = recharts.Line;
  Pie = recharts.Pie;
  Area = recharts.Area;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
  ResponsiveContainer = recharts.ResponsiveContainer;
} catch (e) {
  // Recharts non installé, on utilisera un placeholder
}

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  columns: string[];
  title?: string;
  config?: any;
}

export const Chart: React.FC<ChartProps> = ({ type, data, columns, title, config }) => {
  // Si recharts n'est pas disponible, afficher un placeholder
  if (!BarChart) {
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
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          opacity: 0.3
        }}>
          📊
        </div>
        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '0.5rem'
        }}>
          Graphique {type} - {data.length} point{data.length > 1 ? 's' : ''} de données
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          Recharts sera intégré prochainement
        </p>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  // Pour les graphiques simples, on prend la première colonne comme X et la deuxième comme Y
  const chartData = data.map((row, idx) => {
    const result: any = { name: idx + 1 };
    columns.forEach((col, colIdx) => {
      result[col] = row[col] !== null && row[col] !== undefined ? row[col] : 0;
    });
    return result;
  });

  // Pour les graphiques en camembert, on utilise la première colonne comme label et la deuxième comme valeur
  const pieData = data.map((row) => ({
    name: String(row[columns[0]] || 'N/A'),
    value: typeof row[columns[1]] === 'number' ? row[columns[1]] : 0
  }));

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={columns[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.slice(1).map((col, idx) => (
                <Bar key={col} dataKey={col} fill={`hsl(${idx * 60}, 70%, 50%)`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={columns[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.slice(1).map((col, idx) => (
                <Line key={col} type="monotone" dataKey={col} stroke={`hsl(${idx * 60}, 70%, 50%)`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={columns[0] || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {columns.slice(1).map((col, idx) => (
                <Area key={col} type="monotone" dataKey={col} stroke={`hsl(${idx * 60}, 70%, 50%)`} fill={`hsl(${idx * 60}, 70%, 50%)`} fillOpacity={0.6} />
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
