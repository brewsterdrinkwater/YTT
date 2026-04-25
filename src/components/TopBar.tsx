import React from 'react';
import VaultIcon from './VaultIcon';

interface TopBarProps {
  onMenuToggle: () => void;
  onSearchOpen: () => void;
  isMobile?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, onSearchOpen, isMobile }) => {
  return (
    <header style={{
      background: 'var(--color-vault-navy)',
      borderBottom: '1px solid var(--color-vault-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        paddingRight: '16px',
        gap: isMobile ? '10px' : '16px',
      }}>
        {/* Hamburger */}
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
            minHeight: 0,
            minWidth: 0,
          }}
        >
          ☰
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-vault-gold)', flexShrink: 0 }}>
          <VaultIcon size={22} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: isMobile ? '16px' : '18px',
            color: 'var(--color-vault-text)',
            letterSpacing: '-0.01em',
          }}>
            Valt<span style={{ color: 'var(--color-vault-muted)', fontWeight: 400 }}>-tab</span>
          </span>
        </div>

        {/* Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: isMobile ? 'flex-end' : 'center' }}>
          {isMobile ? (
            <button
              onClick={onSearchOpen}
              aria-label="Open search"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-vault-muted)',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px 8px',
                lineHeight: 1,
                minHeight: 0,
                minWidth: 0,
              }}
            >
              🔍
            </button>
          ) : (
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
                minHeight: 0,
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
          )}
        </div>

        {/* Avatar */}
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
      </div>
    </header>
  );
};

export default TopBar;
