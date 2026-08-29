'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  fechas: string[];
  valores: number[];
  etiqueta: string;
}

interface TrendChartProps {
  data: TrendData[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return <div>No hay datos disponibles</div>;
  }

  // Transformar datos para Recharts
  const chartData = data[0].fechas.map((fecha, index) => {
    const point: any = { fecha };
    data.forEach((serie) => {
      point[serie.etiqueta] = serie.valores[index] || 0;
    });
    return point;
  });

  const colors = ['#2c8cc4', '#22c55e', '#eab308', '#7b1f3a', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fecha" />
        <YAxis />
        <Tooltip />
        <Legend />
        {data.map((serie, index) => (
          <Line
            key={serie.etiqueta}
            type="monotone"
            dataKey={serie.etiqueta}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}