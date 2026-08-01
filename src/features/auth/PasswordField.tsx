import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "../../components/ui";
import { passwordChecks } from "./password";

export function PasswordField({ label, value, onChange, autoComplete, showRules = false, required = true }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; showRules?: boolean; required?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <Field label={label}><div className="password-input"><input type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} minLength={showRules ? 10 : 1} maxLength={128} required={required}/><button type="button" className="password-toggle" onClick={() => setVisible(current => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{showRules && <ul className="password-rules" aria-label="Requisitos da senha">{passwordChecks(value).map(rule => <li key={rule.label} className={rule.ok ? "ok" : ""}>{rule.ok ? "✓" : "○"} {rule.label}</li>)}</ul>}</Field>;
}
