import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { StatusMessage } from "../../components/ui";
import { authService } from "../../services/finance";
import { passwordSchema } from "./password";
import { PasswordField } from "./PasswordField";

export function PasswordRecoveryScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message ?? "Senha inválida.");
    if (password !== confirmation) return setMessage("As senhas não coincidem.");
    setBusy(true);
    try { await authService.finishPasswordRecovery(password); setSuccess(true); setMessage("Senha alterada. Você já pode continuar usando sua conta."); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "Não foi possível alterar a senha."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><section className="recovery-card"><div className="brand-mark"><KeyRound size={22}/></div><p className="eyebrow">Recuperação de conta</p><h1>Escolha uma nova senha</h1><p>O link de recuperação abriu uma sessão temporária. Defina a nova senha para concluir.</p>{success ? <><StatusMessage tone="success">{message}</StatusMessage><button className="primary" onClick={onDone}>Continuar para o Nummi</button></> : <form onSubmit={submit}><PasswordField label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" showRules/><PasswordField label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password"/>{message && <StatusMessage tone="error">{message}</StatusMessage>}<button className="primary" disabled={busy}>{busy ? "Alterando…" : "Alterar senha"}</button></form>}</section></main>;
}
