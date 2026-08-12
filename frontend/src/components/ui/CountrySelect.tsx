import { useMemo, useState } from 'react';
import countries from 'world-countries';
import { Check, ChevronDown, Globe2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import 'flag-icons/css/flag-icons.min.css';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const sorted = countries
  .map(country => ({ name: country.name.common, code: country.cca2 }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function CountrySelect({ value, onChange, placeholder = 'Selecciona tu país', id }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = sorted.find(country => country.name === value || country.code === value);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return sorted;
    return sorted.filter(country =>
      country.name.toLocaleLowerCase().includes(normalizedQuery)
      || country.code.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    handleOpenChange(false);
  };

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={() => handleOpenChange(true)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300"
      >
        {selected ? (
          <span
            className={`fi fi-${selected.code.toLowerCase()} shrink-0 rounded-sm shadow-sm`}
            style={{ width: '1.5rem', height: '1rem', backgroundSize: 'cover' }}
            aria-hidden="true"
          />
        ) : (
          <Globe2 className="w-5 h-5 text-primary-500 shrink-0" />
        )}
        <span className={`flex-1 text-left truncate ${selected ? 'text-gray-900 dark:text-dark-100' : 'text-gray-400'}`}>
          {selected?.name || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[85dvh] p-0 gap-0 overflow-hidden dark:bg-dark-800 dark:border-dark-600">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-dark-700 text-left">
            <DialogTitle className="dark:text-dark-100">Selecciona tu país</DialogTitle>
          </DialogHeader>

          <div className="p-3 border-b border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 focus-within:ring-2 focus-within:ring-primary-500">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar país..."
                className="w-full bg-transparent text-sm text-gray-900 dark:text-dark-100 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto overscroll-contain flex-1 max-h-[60dvh] py-1">
            {filtered.map(country => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country.name)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-dark-700 text-left ${
                  selected?.code === country.code
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-dark-200'
                }`}
              >
                <span
                  className={`fi fi-${country.code.toLowerCase()} shrink-0 rounded-sm shadow-sm`}
                  style={{ width: '1.5rem', height: '1rem', backgroundSize: 'cover' }}
                  aria-hidden="true"
                />
                <span className="flex-1">{country.name}</span>
                <span className="text-xs text-gray-400 uppercase">{country.code}</span>
                {selected?.code === country.code && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No se encontraron países.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
