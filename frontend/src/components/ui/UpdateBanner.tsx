import { RefreshCw } from 'lucide-react';

interface UpdateBannerProps {
  onReload: () => void;
}

export function UpdateBanner({ onReload }: UpdateBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] px-4">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-gray-900 dark:bg-dark-800 text-white border border-white/10 shadow-2xl p-4 animate-enter-up">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">¡Hay una actualización!</p>
          <p className="text-xs text-white/70 mt-0.5 leading-tight">Toca para ver la versión nueva.</p>
        </div>
        <button
          onClick={onReload}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
