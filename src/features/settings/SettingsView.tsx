import { FormEvent, useEffect, useState } from "react";
import {
  Archive,
  AtSign,
  KeyRound,
  Laptop,
  Moon,
  Pencil,
  Shield,
  Sun,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { Card, Field, StatusMessage } from "../../components/ui";
import { emailChangeSchema, passwordChangeSchema, profileFormSchema } from "../../schemas";
import { authService, financeService } from "../../services/finance";
import { PasswordField } from "../auth/PasswordField";
import type { Category, Profile, ThemeMode, UserSettings } from "../../types";

type Tone = "success" | "error" | "info";
type CategoryForm = Pick<Category, "name" | "scope" | "color" | "archived">;

const blankCategory = (): CategoryForm => ({
  name: "",
  scope: "both",
  color: "#22c55e",
  archived: false
});

interface SettingsViewProps {
  profile: Profile | null;
  settings: UserSettings | null;
  categories: Category[];
  email: string;
  busy: boolean;
  run: (action: () => Promise<unknown>, message: string) => Promise<boolean>;
  remove: (action: () => Promise<void>) => Promise<void>;
}

export function SettingsView({
  profile,
  settings,
  categories,
  email,
  busy,
  run,
  remove
}: SettingsViewProps) {
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    currency: "BRL",
    locale: "pt-BR",
    timezone: "America/Porto_Velho"
  });
  const [emailForm, setEmailForm] = useState({ email: "", confirmation: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmation: ""
  });
  const [category, setCategory] = useState<CategoryForm>(blankCategory());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<Tone>("info");
  const [accountBusy, setAccountBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      display_name: profile.display_name,
      currency: profile.currency,
      locale: profile.locale,
      timezone: profile.timezone
    });
  }, [profile]);

  function fail(message: string) {
    setTone("error");
    setFeedback(message);
  }

  function success(message: string) {
    setTone("success");
    setFeedback(message);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const parsed = profileFormSchema.safeParse(profileForm);
    if (!parsed.success) {
      fail(parsed.error.issues[0]?.message ?? "Confira o perfil.");
      return;
    }
    await run(() => financeService.updateProfile(parsed.data), "Perfil atualizado.");
  }

  async function saveEmail(event: FormEvent) {
    event.preventDefault();
    const parsed = emailChangeSchema.safeParse(emailForm);
    if (!parsed.success) {
      fail(parsed.error.issues[0]?.message ?? "Confira os e-mails.");
      return;
    }

    setAccountBusy(true);
    try {
      await authService.updateEmail(parsed.data.email);
      success(
        "Enviamos a confirmação para o novo e-mail. O endereço atual permanece válido até a confirmação."
      );
      setEmailForm({ email: "", confirmation: "" });
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Não foi possível alterar o e-mail.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    const parsed = passwordChangeSchema.safeParse(passwordForm);
    if (!parsed.success) {
      fail(parsed.error.issues[0]?.message ?? "Confira as senhas.");
      return;
    }

    setAccountBusy(true);
    try {
      await authService.updatePassword(parsed.data.currentPassword, parsed.data.password);
      success("Senha alterada com sucesso.");
      setPasswordForm({ currentPassword: "", password: "", confirmation: "" });
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Não foi possível alterar a senha.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function setTheme(theme: ThemeMode) {
    const previous = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    const saved = await run(() => financeService.updateSettings({ theme }), "Tema atualizado.");
    if (!saved) document.documentElement.dataset.theme = previous;
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (category.name.trim().length < 1) {
      fail("Informe o nome da categoria.");
      return;
    }

    const saved = await run(
      () => financeService.saveCategory(
        { ...category, name: category.name.trim() },
        categoryId ?? undefined
      ),
      categoryId ? "Categoria atualizada." : "Categoria criada."
    );
    if (saved) {
      setCategory(blankCategory());
      setCategoryId(null);
    }
  }

  function editCategory(item: Category) {
    setCategoryId(item.id);
    setCategory({
      name: item.name,
      scope: item.scope,
      color: item.color,
      archived: item.archived
    });
  }

  async function signOut(scope: "global" | "others") {
    if (scope === "global" && !window.confirm(
      "Sair de todos os dispositivos? Será necessário entrar novamente em cada navegador."
    )) return;

    setAccountBusy(true);
    setFeedback("");
    try {
      await authService.signOut(scope);
      if (scope === "others") success("As outras sessões foram encerradas.");
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Não foi possível encerrar as sessões.");
    } finally {
      setAccountBusy(false);
    }
  }

  const disabled = busy || accountBusy;

  return (
    <div className="settings-stack">
      {feedback && <StatusMessage tone={tone}>{feedback}</StatusMessage>}

      <div className="two">
        <Card title="Perfil" subtitle="Informações usadas na interface" actions={<UserRound size={20} />}>
          <form className="grid compact-grid" onSubmit={saveProfile} noValidate>
            <Field label="Nome">
              <input
                value={profileForm.display_name}
                onChange={(event) => setProfileForm({
                  ...profileForm,
                  display_name: event.target.value
                })}
                maxLength={80}
                autoComplete="name"
                disabled={disabled}
              />
            </Field>
            <Field label="Moeda">
              <input
                value={profileForm.currency}
                onChange={(event) => setProfileForm({
                  ...profileForm,
                  currency: event.target.value.toUpperCase()
                })}
                maxLength={3}
                disabled={disabled}
              />
            </Field>
            <Field label="Idioma">
              <input
                value={profileForm.locale}
                onChange={(event) => setProfileForm({
                  ...profileForm,
                  locale: event.target.value
                })}
                maxLength={20}
                disabled={disabled}
              />
            </Field>
            <Field label="Fuso horário">
              <select
                value={profileForm.timezone}
                onChange={(event) => setProfileForm({
                  ...profileForm,
                  timezone: event.target.value
                })}
                disabled={disabled}
              >
                <option value="America/Porto_Velho">Rondônia / Manaus</option>
                <option value="America/Sao_Paulo">Brasília / São Paulo</option>
                <option value="America/Rio_Branco">Acre</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            <button className="primary" disabled={disabled}>Salvar perfil</button>
          </form>
        </Card>

        <Card
          title="Aparência e privacidade"
          subtitle="O escuro neon é o padrão"
          actions={settings?.theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
        >
          <div className="theme-picker">
            <button
              type="button"
              className={settings?.theme !== "light" ? "selected" : ""}
              onClick={() => setTheme("dark")}
              disabled={disabled}
            >
              <Moon />Escuro neon<small>Contraste alto e verde elétrico</small>
            </button>
            <button
              type="button"
              className={settings?.theme === "light" ? "selected" : ""}
              onClick={() => setTheme("light")}
              disabled={disabled}
            >
              <Sun />Claro aurora<small>Fundo luminoso e acentos esmeralda</small>
            </button>
          </div>

          <label className="switch-row">
            <span>
              <b>Ocultar valores</b>
              <small>Esconde números financeiros sem apagar dados</small>
            </span>
            <input
              type="checkbox"
              checked={settings?.privacy_mode ?? false}
              onChange={(event) => {
                void run(
                  () => financeService.updateSettings({ privacy_mode: event.target.checked }),
                  "Privacidade atualizada."
                );
              }}
              disabled={disabled}
            />
          </label>

          <label className="switch-row">
            <span>
              <b>Modo compacto</b>
              <small>Reduz espaçamentos em telas densas</small>
            </span>
            <input
              type="checkbox"
              checked={settings?.compact_mode ?? false}
              onChange={(event) => {
                void run(
                  () => financeService.updateSettings({ compact_mode: event.target.checked }),
                  "Densidade atualizada."
                );
              }}
              disabled={disabled}
            />
          </label>
        </Card>
      </div>

      <div className="two">
        <Card title="E-mail da conta" subtitle={`Atual: ${email}`} actions={<AtSign size={20} />}>
          <form onSubmit={saveEmail} className="stack-form" noValidate>
            <Field label="Novo e-mail">
              <input
                type="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm({ ...emailForm, email: event.target.value })}
                autoComplete="email"
                maxLength={254}
                disabled={disabled}
              />
            </Field>
            <Field label="Confirmar novo e-mail">
              <input
                type="email"
                value={emailForm.confirmation}
                onChange={(event) => setEmailForm({
                  ...emailForm,
                  confirmation: event.target.value
                })}
                autoComplete="email"
                maxLength={254}
                disabled={disabled}
              />
            </Field>
            <button className="primary" disabled={disabled}>Solicitar alteração</button>
            <p className="muted">A alteração só termina depois da confirmação por e-mail.</p>
          </form>
        </Card>

        <Card
          title="Alterar senha"
          subtitle="A senha atual é obrigatória"
          actions={<KeyRound size={20} />}
        >
          <form onSubmit={savePassword} className="stack-form" noValidate>
            <PasswordField
              label="Senha atual"
              value={passwordForm.currentPassword}
              onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
              autoComplete="current-password"
            />
            <PasswordField
              label="Nova senha"
              value={passwordForm.password}
              onChange={(value) => setPasswordForm({ ...passwordForm, password: value })}
              autoComplete="new-password"
              showRules
            />
            <PasswordField
              label="Confirmar nova senha"
              value={passwordForm.confirmation}
              onChange={(value) => setPasswordForm({ ...passwordForm, confirmation: value })}
              autoComplete="new-password"
            />
            <button className="primary" disabled={disabled}>Alterar senha</button>
          </form>
        </Card>
      </div>

      <Card
        title="Sessões"
        subtitle="Controle onde sua conta permanece conectada"
        actions={<Laptop size={20} />}
      >
        <div className="session-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => signOut("others")}
            disabled={disabled}
          >
            <Shield size={17} />Sair de outros dispositivos
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => signOut("global")}
            disabled={disabled}
          >
            <Laptop size={17} />Sair de todos os dispositivos
          </button>
        </div>
        <p className="muted">
          Tokens de acesso já emitidos expiram automaticamente. A revogação encerra os tokens de atualização.
        </p>
      </Card>

      <Card title="Categorias" subtitle="Edite, arquive ou exclua categorias não utilizadas">
        <form className="grid" onSubmit={saveCategory} noValidate>
          <Field label="Nome">
            <input
              value={category.name}
              onChange={(event) => setCategory({ ...category, name: event.target.value })}
              maxLength={60}
              disabled={disabled}
            />
          </Field>
          <Field label="Uso">
            <select
              value={category.scope}
              onChange={(event) => setCategory({
                ...category,
                scope: event.target.value as CategoryForm["scope"]
              })}
              disabled={disabled}
            >
              <option value="both">Entradas e saídas</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
          </Field>
          <Field label="Cor">
            <input
              type="color"
              value={category.color}
              onChange={(event) => setCategory({ ...category, color: event.target.value })}
              disabled={disabled}
            />
          </Field>
          <div className="form-actions">
            <button className="primary" disabled={disabled}>
              {categoryId ? "Salvar categoria" : "Adicionar categoria"}
            </button>
            {categoryId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setCategoryId(null);
                  setCategory(blankCategory());
                }}
                disabled={disabled}
              >
                <X size={16} />Cancelar
              </button>
            )}
          </div>
        </form>

        <ul className="list category-list">
          {categories.map((item) => (
            <li key={item.id}>
              <div>
                <span className="category-dot" style={{ background: item.color }} />
                <div>
                  <b>{item.name}</b>
                  <small>
                    {item.archived
                      ? "arquivada"
                      : item.scope === "both"
                        ? "entradas e saídas"
                        : item.scope === "income"
                          ? "entradas"
                          : "saídas"}
                  </small>
                </div>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="icon"
                  onClick={() => {
                    void run(
                      () => financeService.saveCategory({
                        name: item.name,
                        scope: item.scope,
                        color: item.color,
                        archived: !item.archived
                      }, item.id),
                      item.archived ? "Categoria restaurada." : "Categoria arquivada."
                    );
                  }}
                  aria-label={item.archived ? "Restaurar categoria" : "Arquivar categoria"}
                  disabled={disabled}
                >
                  <Archive size={16} />
                </button>
                <button
                  type="button"
                  className="icon"
                  onClick={() => editCategory(item)}
                  aria-label={`Editar categoria ${item.name}`}
                  disabled={disabled}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon danger-icon"
                  onClick={() => remove(() => financeService.deleteCategory(item.id))}
                  aria-label={`Excluir categoria ${item.name}`}
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
