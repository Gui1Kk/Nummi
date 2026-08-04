import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(JSON.stringify({
      event: "frontend_render_error",
      message: error.message,
      componentStack: info.componentStack
    }));
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error" role="alert">
          <div className="brand-mark">N</div>
          <p className="eyebrow">Falha inesperada</p>
          <h1>Esta tela não conseguiu abrir.</h1>
          <p>
            Seus dados não foram apagados. Recarregue a aplicação. Se o problema continuar,
            informe o horário aproximado ao suporte.
          </p>
          <div className="form-actions">
            <button className="primary" onClick={() => window.location.reload()}>
              Recarregar aplicação
            </button>
            <button
              className="secondary"
              onClick={() => this.setState({ failed: false })}
            >
              Tentar novamente
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
