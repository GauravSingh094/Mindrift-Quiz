import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ChartWrapperProps {
  data: any[];
  dataKey: string;
  categoryKey: string;
  height?: number;
  glowColor?: 'purple' | 'green' | 'amber';
}

export function RechartsAreaWrapper({
  data,
  dataKey,
  categoryKey,
  height = 300,
  glowColor = 'purple',
}: ChartWrapperProps) {
  const colorMap = {
    purple: '#8b5cf6',
    green: '#10b981',
    amber: '#f59e0b',
  };

  const activeColor = colorMap[glowColor];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`glowGrad-${glowColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(24, 24, 27, 0.5)" vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 'bold' }}
            itemStyle={{ color: activeColor, fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={activeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#glowGrad-${glowColor})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RechartsLineWrapper({
  data,
  dataKey,
  categoryKey,
  height = 300,
  glowColor = 'purple',
}: ChartWrapperProps) {
  const colorMap = {
    purple: '#8b5cf6',
    green: '#10b981',
    amber: '#f59e0b',
  };

  const activeColor = colorMap[glowColor];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(24, 24, 27, 0.5)" vertical={false} />
          <XAxis
            dataKey={categoryKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 'bold' }}
            itemStyle={{ color: activeColor, fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={activeColor}
            strokeWidth={2}
            dot={{ r: 3, stroke: activeColor, strokeWidth: 1, fill: 'hsl(var(--background))' }}
            activeDot={{ r: 5, stroke: activeColor, strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
