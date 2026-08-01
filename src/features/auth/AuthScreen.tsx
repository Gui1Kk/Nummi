import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import { StatusMessage } from "../../components/ui";
import { AuthServiceError, authService } from "../../services/finance";
import { passwordSchema } from "./password";
import { PasswordField } from "./PasswordField";

type Mode = "login" | "register" | "forgot" | "check-email";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "success" | "warning" | "error">("info");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function resetFeedback() { setMessage(""); setNeedsConfirmation(false); }
  function switchMode(next: Mode) { resetFeedback(); setMode(next); setPassword(""); setConfirmation(""); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); resetFeedback();
    try {
      if (mode === "forgot") {
        await authService.requestPasswordReset(email);
        setTone("success");
        setMessage("Se existir uma conta para esse e-mail, enviaremos um link de recuperação. Confira também o spam.");
        return;
      }
      if (mode === "register") {
        if (name.trim().length < 2) throw new Error("Informe seu nome.");
        const parsed = passwordSchema.safeParse(password);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "A senha não atende aos requisitos.");
        if (password !== confirmation) throw new Error("As senhas não coincidem.");
        const result = await authService.signUp(email, password, name);
        setMode("check-email"); setCooldown(60); setTone("success");
        setMessage(result.requiresConfirmation ? "Conta criada. Confirme o e-mail antes de entrar." : "Conta criada e sessão iniciada.");
        return;
      }
      await authService.signIn(email, password);
    } catch (caught) {
      const error = caught instanceof Error ? caught : new Error("Falha ao autenticar.");
      setTone("error"); setMessage(error.message);
      if (error instanceof AuthServiceError && error.code === "email_not_confirmed") setNeedsConfirmation(true);
    } finally { setBusy(false); }
  }

  async function resend() {
    if (cooldown || !email) return;
    setBusy(true); resetFeedback();
    try { await authService.resendConfirmation(email); setCooldown(60); setTone("success"); setMessage("E-mail reenviado. Confira a caixa de entrada e o spam."); }
    catch (caught) { setTone("error"); setMessage(caught instanceof Error ? caught.message : "Não foi possível reenviar."); }
    finally { setBusy(false); }
  }

  const title = mode === "login" ? "Entre na sua conta" : mode === "register" ? "Crie sua conta" : mode === "forgot" ? "Recupere o acesso" : "Confirme seu e-mail";
  return <main className="auth-page"><div className="auth-glow one"/><div className="auth-glow two"/><section className="auth-shell">
    <div className="auth-story"><div className="brand-mark">N</div><p className="eyebrow">Nummi</p><h1>Seu dinheiro, sem névoa.</h1><p>Registre entradas, saídas, assinaturas e recorrências com uma visão mensal limpa.</p><div className="auth-benefits"><span><ShieldCheck size={18}/>Dados isolados por usuário</span><span><CheckCircle2 size={18}/>Planejado separado do realizado</span><span><MailCheck size={18}/>Conta protegida por e-mail</span></div></div>
    <div className="auth-panel"><div className="auth-panel-head">{mode !== "login" && <button type="button" className="icon ghost" onClick={() => switchMode("login")} aria-label="Voltar"><ArrowLeft size={18}/></button>}<div><p className="eyebrow">Acesso seguro</p><h2>{title}</h2></div></div>
      {mode === "check-email" ? <div className="email-state"><MailCheck size={48}/><p>Enviamos a confirmação para <b>{email}</b>. A conta só poderá entrar depois que o link for aberto.</p>{message && <StatusMessage tone={tone}>{message}</StatusMessage>}<button type="button" onClick={resend} disabled={busy || cooldown > 0}>{cooldown ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}</button><button type="button" className="link" onClick={() => switchMode("login")}>Voltar para o login</button></div> : <form onSubmit={submit} noValidate>
        {mode === "register" && <label className="field"><span>Nome</span><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" maxLength={80} required/></label>}
        <label className="field"><span>E-mail</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" inputMode="email" maxLength={254} required/></label>
        {mode !== "forgot" && <PasswordField label="Senha" value={password} onChange={setPassword} autoComplete={mode === "register" ? "new-password" : "current-password"} showRules={mode === "register"}/>} 
        {mode === "register" && <PasswordField label="Confirmar senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password"/>}
        {message && <StatusMessage tone={tone}>{message}</StatusMessage>}
        {needsConfirmation && <button type="button" className="secondary" onClick={resend} disabled={busy || cooldown > 0}>{cooldown ? `Reenviar em ${cooldown}s` : "Reenviar confirmação"}</button>}
        <button className="primary" disabled={busy}>{busy ? "Processando…" : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar recuperação"}</button>
        {mode === "login" && <><button type="button" className="link" onClick={() => switchMode("forgot")}>Esqueci minha senha</button><div className="auth-separator"><span>ou</span></div><button type="button" className="secondary" onClick={() => switchMode("register")}>Criar uma conta</button></>}
        {mode === "register" && <button type="button" className="link" onClick={() => switchMode("login")}>Já tenho uma conta</button>}
      </form>}
    </div>
  </section></main>;
}
