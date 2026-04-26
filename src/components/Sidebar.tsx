import React from 'react';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  featured?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { section: '', items: [
    { icon: '📊', label: 'Dashboard', path: '/dashboard', featured: true },
  ]},
  { section: 'PERSONAL', items: [
    { icon: '📅', label: 'Today',     path: '/' },
    { icon: '📦', label: 'Inventory', path: '/inventory' },
  ]},
  { section: 'VAULT', items: [
    { icon: '🔒', label: 'Private',   path: '/timeline' },
    { icon: '⚙️', label: 'Settings',  path: '/settings' },
  ]},
];

interface SidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile, currentPath, onNavigate }) => {
  const showLabels = isMobile || !collapsed;

  const navStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 'calc(56px + env(safe-area-inset-top, 0px))',
        left: 0,
        bottom: 0,
        width: '260px',
        background: 'var(--color-vault-navy)',
        borderRight: '1px solid var(--color-vault-border)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        zIndex: 60,
        willChange: 'transform',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }
    : {
        width: collapsed ? '56px' : '220px',
        background: 'var(--color-vault-navy)',
        borderRight: '1px solid var(--color-vault-border)',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      };

  return (
    <nav style={navStyle}>
      {NAV.map(group => (
        <div key={group.section || '__top'} style={{ marginTop: '16px' }}>
          {showLabels && group.section && (
            <div style={{
              padding: '4px 16px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-vault-muted)',
              letterSpacing: '0.1em',
              userSelect: 'none',
            }}>
              {group.section}
            </div>
          )}
          {group.items.map(item => {
            const active = currentPath === item.path;
            const isFeatured = item.featured;

            if (isFeatured) {
              return (
                <div key={item.path} style={{ padding: collapsed && !isMobile ? '0 4px' : '0 8px' }}>
                  <button
                    onClick={() => onNavigate(item.path)}
                    title={!showLabels ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                      gap: '10px',
                      padding: isMobile ? '12px 14px' : '10px 12px',
                      background: active ? 'rgba(79,142,247,0.18)' : 'rgba(79,142,247,0.08)',
                      border: `1px solid ${active ? 'rgba(79,142,247,0.5)' : 'rgba(79,142,247,0.25)'}`,
                      borderRadius: '8px',
                      color: active ? 'var(--color-vault-text)' : 'var(--color-vault-accent)',
                      cursor: 'pointer',
                      fontSize: isMobile ? '15px' : '14px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      minHeight: 0,
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                    onMouseOver={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(79,142,247,0.14)';
                        e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)';
                        e.currentTarget.style.color = 'var(--color-vault-text)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(79,142,247,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(79,142,247,0.25)';
                        e.currentTarget.style.color = 'var(--color-vault-accent)';
                      }
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '20px' : '18px', flexShrink: 0 }}>{item.icon}</span>
                    {showLabels && <span>{item.label}</span>}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                title={!showLabels ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isMobile ? '14px 20px' : (collapsed ? '10px 16px' : '9px 16px'),
                  background: active ? 'rgba(79,142,247,0.1)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-vault-accent)' : '3px solid transparent',
                  border: 'none',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  color: active ? 'var(--color-vault-text)' : 'var(--color-vault-muted)',
                  cursor: 'pointer',
                  fontSize: isMobile ? '15px' : '14px',
                  fontFamily: 'var(--font-body)',
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  minHeight: 0,
                  minWidth: 0,
                }}
                onMouseOver={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--color-vault-text)';
                  }
                }}
                onMouseOut={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-vault-muted)';
                  }
                }}
              >
                <span style={{ fontSize: isMobile ? '20px' : '16px', flexShrink: 0 }}>{item.icon}</span>
                {showLabels && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Sidebar;
