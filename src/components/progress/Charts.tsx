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
import type { ProgressWeek } from '@/lib/types';

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

export function LineChart({
  weeks,
  series,
}: {
  weeks: ProgressWeek[];
  series: { key: 'sollTop' | 'istTop'; color: string; dashed?: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RLineChart data={weeks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="week" tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ stroke: GRID }}
          labelFormatter={(w) => `Woche ${w}`}
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

export function BarChart({
  weeks,
  keys,
}: {
  weeks: ProgressWeek[];
  keys: { key: 'volumeSoll' | 'volumeIst'; color: string; soft?: boolean }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RBarChart data={weeks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="week" tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tick={{ fill: TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          labelFormatter={(w) => `Woche ${w}`}
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
