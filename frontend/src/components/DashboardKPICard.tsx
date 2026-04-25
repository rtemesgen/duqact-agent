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
      <div className="metricHeader">
        <span>{label}</span>
        {icon && <div className="metricIcon">{icon}</div>}
      </div>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

