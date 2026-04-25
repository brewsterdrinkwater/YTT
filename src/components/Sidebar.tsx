import React from 'react';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { section: 'PERSONAL', items: [
    { icon: '📅', label: 'Today',    path: '/' },
    { icon: '📆', label: 'Calendar', path: '/calendar' },
    { icon: '📓', label: 'Journal',  path: '/entry' },
  ]},
  { section: 'FAMILY', items: [
    { icon: '👨‍👩‍👧', label: 'Family',    path: '/family' },
    { icon: '📇', label: 'Contacts', path: '/contacts' },
    { icon: '🗂️', label: 'Documents', path: '/documents' },
  ]},
  { section: 'LIFE', items: [
    { icon: '🎯', label: 'Goals',    path: '/goals' },
    { icon: '💡', label: 'Notes',    path: '/notes' },
    { icon: '📊', label: 'Insights', path: '/dashboard' },
  ]},
  { section: 'VAULT', items: [
    { icon: '🔒', label: 'Private',  path: '/timeline' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
    { icon: '🔐', label: 'Security', path: '/security' },
  ]},
];

interface SidebarProps {
  collapsed: boolean;
  isMobile?: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile, currentPath, onNavigate }) => {
  // On mobile: sidebar is a fixed overlay drawer (slide in/out)
  // On desktop: sidebar is inline and collapses to icon-only
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
        <div key={group.section} style={{ marginTop: '16px' }}>
          {showLabels && (
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
