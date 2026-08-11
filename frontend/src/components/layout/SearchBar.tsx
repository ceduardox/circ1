import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { programApi } from '@/services/api';
import { Search, X, BookOpen, FileText } from 'lucide-react';

interface SearchBarProps {
  onClose?: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ days: any[]; contents: any[] }>({ days: [], contents: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ days: [], contents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await programApi.search(query.trim());
        setResults(res.data);
      } catch {
        setResults({ days: [], contents: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    onClose?.();
  };

  const hasResults = results.days.length > 0 || results.contents.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar días, contenidos..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults({ days: [], contents: [] }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400 dark:text-dark-400 text-sm">
              Buscando...
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-400 dark:text-dark-400 text-sm">
              No se encontraron resultados
            </div>
          ) : (
            <>
              {results.days.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider bg-gray-50 dark:bg-dark-700">
                    Días
                  </p>
                  {results.days.map((day: any) => (
                    <button
                      key={day.id}
                      onClick={() => handleSelect(`/day/${day.dayNumber}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left"
                    >
                      <BookOpen className="w-4 h-4 text-primary-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                          Día {day.dayNumber}: {day.title}
                        </p>
                        {day.description && (
                          <p className="text-xs text-gray-500 dark:text-dark-400 truncate">{day.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.contents.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider bg-gray-50 dark:bg-dark-700">
                    Contenidos
                  </p>
                  {results.contents.map((content: any) => (
                    <button
                      key={content.id}
                      onClick={() => handleSelect(`/day/${content.day.dayNumber}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                          {content.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-400">
                          Día {content.day.dayNumber} · {content.type.replace('_', ' ')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
