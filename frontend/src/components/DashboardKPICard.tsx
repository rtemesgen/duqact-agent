import type { ReactNode } from 'react';

export function DashboardKPICard({
  label,
  value,
  hint,
  icon,
  accent = 'default'
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: 'default' | 'gold' | 'green';
}) {
  return (
    <article className={`metricCard metric-${accent}`}>
      <span className="metricLabel">{label}</span>
      <div className="metricValueGroup">
        {icon && <div className="metricIcon">{icon}</div>}
        <strong>{value}</strong>
      </div>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

