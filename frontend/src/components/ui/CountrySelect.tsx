import { useEffect, useMemo, useRef, useState } from 'react';
import countries from 'world-countries';
import { Search, Check } from 'lucide-react';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const sorted = countries
  .map(c => ({ name: c.name.common, code: c.cca2, flag: c.flag }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function CountrySelect({ value, onChange, placeholder = 'Selecciona tu país', id }: CountrySelectProps & { id?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = sorted.find(c => c.name === value || c.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, 60);
    return sorted.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 60);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300"
      >
        <span className="text-xl leading-none">{selected?.flag || '🌐'}</span>
        <span className={`flex-1 text-left truncate ${selected ? 'text-gray-900 dark:text-dark-100' : 'text-gray-400'}`}>
          {selected?.name || placeholder}
        </span>
        <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg animate-fade-in max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-dark-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar país..."
              className="w-full bg-transparent text-sm text-gray-900 dark:text-dark-100 focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.name); setOpen(false); setQuery(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-dark-700 text-left ${
                  selected?.code === c.code ? 'bg-primary-50/60 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-dark-200'
                }`}
              >
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                {selected?.code === c.code && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">Sin resultados para "{query}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}