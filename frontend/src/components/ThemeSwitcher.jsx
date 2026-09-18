import { useEffect, useRef, useState } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const active = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change theme"
        title="Change theme"
        className="flex items-center gap-2 bg-card border border-line hover:border-line-strong text-muted hover:text-hi px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
      >
        <Palette size={15} className="text-brand-2" />
        {!compact && <span className="hidden lg:inline">{active.label}</span>}
        {!compact && <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-60 bg-card border border-line rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn"
        >
          <p className="px-2.5 py-1.5 text-[0.65rem] uppercase tracking-wider font-bold text-faint">
            Interface theme
          </p>
          {themes.map((t) => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  isActive ? 'bg-brand-soft' : 'hover:bg-card-hover'
                }`}
              >
                <span className="flex shrink-0 -space-x-1.5">
                  {t.swatch.map((c, i) => (
                    <span
                      key={i}
                      className="w-4 h-4 rounded-full border border-line"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs font-semibold ${isActive ? 'text-brand' : 'text-hi'}`}>
                    {t.label}
                  </span>
                  <span className="block text-[0.68rem] text-faint truncate">{t.hint}</span>
                </span>
                {isActive && <Check size={14} className="text-brand shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
