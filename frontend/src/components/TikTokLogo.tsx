import { cn } from '@/lib/utils';

// Logo de TikTok en SVG inline (sin descargas externas).
// Path simplificado del icono oficial de la marca.
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('w-5 h-5', className)} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// Logo TikTok Shop: icono TikTok + bolsa de compra.
export function TikTokShopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('w-5 h-5', className)} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" transform="translate(-1.5 0) scale(0.9)" />
      <path d="M20 11a1 1 0 0 1 .96 1.27l-1.5 6A1 1 0 0 1 18.5 19H9.5a1 1 0 0 1-.96-.73l-1.5-6A1 1 0 0 1 8 11h12z" transform="translate(0 0.2) scale(0.92) translate(1 0)" />
      <path d="M12 9a3 3 0 0 0-3 3h2a1 1 0 0 1 2 0h2a3 3 0 0 0-3-3z" transform="translate(0 0.2) scale(0.92) translate(1 0)" />
    </svg>
  );
}

// Logo TikTok con colores de marca (para hero / marcas de estado).
export function TikTokLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-2xl text-white',
        className
      )}
      style={{ background: 'linear-gradient(90deg, #25F4EE 0%, #ffffff 30%, #FE2C55 70%)', boxShadow: '0 0 0 2px rgba(0,0,0,0.12)' }}
    >
      <TikTokIcon className="text-black w-2/3 h-2/3" />
    </div>
  );
}
