import React from 'react';
import VaultIcon from './VaultIcon';

interface TopBarProps {
  onMenuToggle: () => void;
  onSearchOpen: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, onSearchOpen }) => {
  return (
    <header style={{
      height: '56px',
      background: 'var(--color-vault-navy)',
      borderBottom: '1px solid var(--color-vault-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Toggle + logo */}
      <button
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-vault-muted)',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ☰
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-vault-gold)', flexShrink: 0 }}>
        <VaultIcon size={24} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--color-vault-text)',
          letterSpacing: '-0.01em',
        }}>
          Valt<span style={{ color: 'var(--color-vault-muted)', fontWeight: 400 }}>-tab</span>
        </span>
      </div>

      {/* Centered search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onSearchOpen}
          aria-label="Open command palette"
          style={{
            width: '40%',
            minWidth: '200px',
            maxWidth: '480px',
            background: 'var(--color-vault-steel)',
            border: '1px solid var(--color-vault-border)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: 'var(--color-vault-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            cursor: 'text',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
            transition: 'border-color 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--color-vault-muted)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--color-vault-border)')}
        >
          <span>🔍</span>
          <span style={{ flex: 1 }}>Search your vault...</span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            background: 'var(--color-vault-navy)',
            border: '1px solid var(--color-vault-border)',
            borderRadius: '4px',
            padding: '1px 5px',
          }}>⌘K</span>
        </button>
      </div>

      {/* Avatar placeholder */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--color-vault-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 600,
        color: 'white',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        V
      </div>
    </header>
  );
};

export default TopBar;
