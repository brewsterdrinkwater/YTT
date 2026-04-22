import React, { useEffect, useState, useRef } from 'react';

interface Entry {
  title: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  entries?: Entry[];
  onNavigate?: (path: string) => void;
}

const QUICK_ACTIONS = [
  { label: '+ New journal entry', path: '/entry' },
  { label: '+ Add to lists', path: '/lists' },
  { label: 'Go to Today', path: '/' },
  { label: 'Open Settings', path: '/settings' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  entries = [],
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const filtered = query
    ? entries.filter(e => e.title.toLowerCase().includes(query.toLowerCase()))
    : entries.slice(0, 5);

  const handleAction = (path: string) => {
    onNavigate?.(path);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: '90vw',
          background: 'var(--color-vault-steel)',
          border: '1px solid var(--color-vault-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-vault-border)',
        }}>
          <span style={{ fontSize: '16px' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your vault..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--color-vault-text)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
            }}
          />
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-vault-muted)',
            background: 'var(--color-vault-navy)',
            border: '1px solid var(--color-vault-border)',
            borderRadius: '4px',
            padding: '1px 6px',
          }}>ESC</span>
        </div>

        {/* Quick actions (when no query) */}
        {!query && (
          <div style={{ padding: '8px 0' }}>
            <div style={{
              padding: '6px 16px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-vault-muted)',
              letterSpacing: '0.08em',
            }}>QUICK ACTIONS</div>
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleAction(action.path)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-vault-text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.1)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                › {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {filtered.length > 0 && (
          <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-vault-border)' }}>
            <div style={{
              padding: '6px 16px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-vault-muted)',
              letterSpacing: '0.08em',
            }}>RESULTS</div>
            {filtered.map((entry, i) => (
              <button
                key={i}
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-vault-text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.1)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                › {entry.title}
              </button>
            ))}
          </div>
        )}

        {query && filtered.length === 0 && (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--color-vault-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          }}>
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandPalette;
