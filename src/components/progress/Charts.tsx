'use client';

import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const GRID = '#404040';
const TEXT = '#737373';

const LABELS: Record<string, string> = {
  sollTop: 'Soll',
  istTop: 'Ist',
  volumeSoll: 'Soll',
  volumeIst: 'Ist',
};

const tooltipContentStyle = {
  background: '#171717',
  border: '1px solid #404040',
  borderRadius: 8,
  fontSize: 12,
};

const tooltipLabelStyle = { color: '#a3a3a3' };
const tooltipItemStyle = { color: '#e5e5e5' };

// Datum-keyed data (Verlauf) shows the ISO date as-is; week-keyed data (Fortschritt)
// prefixes it with "Woche".
function labelFor(xKey: string, value: unknown) {
  return xKey === 'week' ? `Woche ${value}` : String(value);
}

export function LineChart<T extends object>({
  data,
  xKey = 'week',
  series,
}: {
  data: T[];
  xKey?: string;
  series: { key: string; color: string; dashed?: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RLineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ stroke: GRID }}
          labelFormatter={(v) => labelFor(xKey, v)}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={LABELS[s.key] ?? s.key}
            stroke={s.color}
            strokeWidth={2.5}
            strokeDasharray={s.dashed ? '5 5' : undefined}
            dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}

export function BarChart<T extends object>({
  data,
  xKey = 'week',
  keys,
}: {
  data: T[];
  xKey?: string;
  keys: { key: string; color: string; soft?: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RBarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          labelFormatter={(v) => labelFor(xKey, v)}
        />
        {keys.map((k) => (
          <Bar
            key={k.key}
            dataKey={k.key}
            name={LABELS[k.key] ?? k.key}
            fill={k.color}
            fillOpacity={k.soft ? 0.45 : 1}
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
