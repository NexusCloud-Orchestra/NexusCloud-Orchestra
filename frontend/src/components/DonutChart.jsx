import { formatBytes } from '../lib/utils';

/**
 * SVG donut showing used vs free storage, with an optional per-connection
 * breakdown rendered as proportional arcs.
 */
export default function DonutChart({ used = 0, total = 0, segments = [] }) {
  const size = 176;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(used / total, 1) : 0;

  const COLORS = ['#4F7DF9', '#0FB5A8', '#F5873B', '#6366F1', '#F2545B', '#22B573', '#D97706'];

  let cursor = 0;
  const arcs = segments
    .filter((s) => s.used > 0 && total > 0)
    .map((s, i) => {
      const frac = Math.min(s.used / total, 1 - cursor);
      const arc = {
        dash: `${frac * circumference} ${circumference}`,
        offset: -cursor * circumference,
        color: COLORS[i % COLORS.length],
        key: s.id || i,
      };
      cursor += frac;
      return arc;
    });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} role="img" aria-label={`Storage used: ${formatBytes(used)} of ${formatBytes(total)}`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--table-header)" strokeWidth={stroke} />
          {arcs.length > 0 ? (
            arcs.map((a) => (
              <circle
                key={a.key}
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeDasharray={a.dash}
                strokeDashoffset={a.offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cx})`}
                style={{ transition: 'stroke-dasharray 500ms ease, stroke-dashoffset 500ms ease' }}
              />
            ))
          ) : (
            <circle
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={stroke}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{ transition: 'stroke-dasharray 500ms ease' }}
            />
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <strong style={{ fontSize: '1.35rem', letterSpacing: '-0.02em' }}>{Math.round(pct * 100)}%</strong>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>used</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--accent)' }} />
          <span>Used</span>
          <strong style={{ marginLeft: 'auto' }}>{formatBytes(used)}</strong>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ background: 'var(--table-header)', border: '1px solid var(--border-strong)' }} />
          <span>Free</span>
          <strong style={{ marginLeft: 'auto' }}>{formatBytes(Math.max(total - used, 0))}</strong>
        </div>
      </div>
    </div>
  );
}
