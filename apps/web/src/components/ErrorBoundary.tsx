import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@spa/ui-kit';

interface State {
  error: Error | null;
}

/** Rede de segurança: uma tela quebrada não derruba o app inteiro. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Na v2 isto vai para o serviço de observabilidade (Sentry/OTel).
    console.error('[StudyPlanner]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6">
        <div className="w-full max-w-md rounded-card border border-hair bg-surface p-6 text-center shadow-paper">
          <span aria-hidden className="mx-auto mb-3 block h-3 w-16 -rotate-2 rounded-sm bg-caneta/60" />
          <h1 className="font-display text-xl font-extrabold text-ink">Algo quebrou nesta tela</h1>
          <p className="mt-2 text-[13.5px] text-ink-2">
            Seus dados continuam salvos no dispositivo. Recarregue a página — se persistir, exporte seus
            dados em Configurações antes de tentar de novo.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 p-2 text-left font-mono text-[11px] text-ink-3">
            {this.state.error.message}
          </pre>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }
}
