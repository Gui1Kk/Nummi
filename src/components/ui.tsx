import type { ReactNode } from "react";

export function Card({ title, subtitle, actions, children, className = "" }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}><div className="card-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</div>{children}</section>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className={`field ${error ? "invalid" : ""}`}><span>{label}</span>{children}{hint && !error && <small>{hint}</small>}{error && <small role="alert">{error}</small>}</label>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orb">N</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function StatusMessage({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: ReactNode }) {
  return <div className={`notice ${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}
