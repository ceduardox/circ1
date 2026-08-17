import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

// Atrapa errores de render y muestra una pantalla de recuperación
// en vez de dejar la app en blanco. Un clic en "Recargar" revive la app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary] Error capturado:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-900 p-6">
          <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-xl p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-400 mb-4">
              Ocurrió un error inesperado. Recarga la aplicación para continuar.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-700 hover:to-primary-600 transition-all shadow-md shadow-primary-600/25"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar aplicación
            </button>
            {this.state.message && (
              <p className="mt-4 text-[11px] text-gray-400 dark:text-dark-500 break-words">
                Detalle: {this.state.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
