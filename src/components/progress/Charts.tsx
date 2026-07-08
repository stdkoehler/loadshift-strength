import type { ProgressWeek } from '@/lib/types';

const W = 640;
const H = 220;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;

const GRID = '#404040';
const TEXT = '#737373';

function scales(weeks: ProgressWeek[], maxVal: number) {
  const n = weeks.length;
  const x = (i: number) => PAD_L + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD_L - PAD_R));
  const y = (v: number) => PAD_T + (1 - (maxVal ? v / maxVal : 0)) * (H - PAD_T - PAD_B);
  return { x, y };
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function LineChart({
  weeks,
  series,
}: {
  weeks: ProgressWeek[];
  series: { key: 'sollTop' | 'istTop'; color: string; dashed?: boolean }[];
}) {
  const allVals = series.flatMap((s) => weeks.map((w) => w[s.key]).filter((v): v is number => v != null));
  const maxVal = niceMax(Math.max(1, ...allVals));
  const { x, y } = scales(weeks, maxVal);
  const ticks = [0, 0.5, 1].map((f) => maxVal * f);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={4} y={y(t) + 4} fill={TEXT} fontSize={11}>{Math.round(t)}</text>
        </g>
      ))}
      {weeks.map((w, i) => (
        <text key={i} x={x(i)} y={H - 8} fill={TEXT} fontSize={11} textAnchor="middle">{w.week}</text>
      ))}
      {series.map((s) => {
        const pts = weeks
          .map((w, i) => (w[s.key] != null ? `${x(i)},${y(w[s.key] as number)}` : null))
          .filter(Boolean)
          .join(' ');
        return (
          <g key={s.key}>
            <polyline
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeDasharray={s.dashed ? '5 5' : 'none'}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {weeks.map((w, i) => (w[s.key] != null ? <circle key={i} cx={x(i)} cy={y(w[s.key] as number)} r={3.5} fill={s.color} /> : null))}
          </g>
        );
      })}
    </svg>
  );
}

export function BarChart({
  weeks,
  keys,
}: {
  weeks: ProgressWeek[];
  keys: { key: 'volumeSoll' | 'volumeIst'; color: string; soft?: boolean }[];
}) {
  const allVals = keys.flatMap((k) => weeks.map((w) => w[k.key] || 0));
  const maxVal = niceMax(Math.max(1, ...allVals));
  const n = weeks.length;
  const groupW = (W - PAD_L - PAD_R) / n;
  const barW = Math.min(14, (groupW - 6) / keys.length);
  const y = (v: number) => PAD_T + (1 - (maxVal ? v / maxVal : 0)) * (H - PAD_T - PAD_B);
  const ticks = [0, 0.5, 1].map((f) => maxVal * f);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={4} y={y(t) + 4} fill={TEXT} fontSize={11}>{Math.round(t)}</text>
        </g>
      ))}
      {weeks.map((w, i) => {
        const cx = PAD_L + groupW * i + groupW / 2;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const v = w[k.key] || 0;
              const bx = cx - (keys.length * barW) / 2 + ki * barW;
              const by = y(v);
              return (
                <rect
                  key={k.key}
                  x={bx}
                  y={by}
                  width={Math.max(0, barW - 2)}
                  height={Math.max(0, y(0) - by)}
                  rx={2}
                  fill={k.color}
                  opacity={k.soft ? 0.45 : 1}
                />
              );
            })}
            <text x={cx} y={H - 8} fill={TEXT} fontSize={11} textAnchor="middle">{w.week}</text>
          </g>
        );
      })}
    </svg>
  );
}
