import { useEffect, useState, useCallback } from 'react';

// Lee el nombre del bundle JS actual desde el HTML cargado.
function getCurrentBundle(): string | null {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  for (const s of scripts) {
    const src = (s as HTMLScriptElement).src || '';
    const m = src.match(/assets\/index-([A-Za-z0-9_-]+)\.js/);
    if (m) return m[1];
  }
  return null;
}

// Consulta el index.html fresco y extrae el hash del bundle servido.
async function fetchLatestBundle(): Promise<string | null> {
  try {
    const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/assets\/index-([A-Za-z0-9_-]+)\.js/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Detecta si hay una nueva versión del frontend desplegada y expone
// la acción de recargar. El HTML no se cachea (no-cache en el servidor),
// así que comparando su hash del bundle sabemos si cambió.
export function useUpdateDetector(intervalMs = 60000) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const cur = getCurrentBundle();
    setCurrent(cur);

    let timer: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      const latest = await fetchLatestBundle();
      if (!latest) return;
      if (current && latest !== current) {
        setUpdateAvailable(true);
        if (timer) clearInterval(timer);
      }
    };

    // Revisa al volver a la pestaña (útil en móvil) y en intervalos.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility as any);

    const start = () => {
      timer = setInterval(check, intervalMs);
    };
    const t0 = setTimeout(start, 8000);
    return () => {
      if (timer) clearInterval(timer);
      clearTimeout(t0);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility as any);
    };
  }, [current, intervalMs]);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return { updateAvailable, reload };
}
