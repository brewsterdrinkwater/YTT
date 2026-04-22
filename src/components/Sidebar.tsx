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
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, currentPath, onNavigate }) => {
  return (
    <nav style={{
      width: collapsed ? '56px' : '220px',
      background: 'var(--color-vault-navy)',
      borderRight: '1px solid var(--color-vault-border)',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>
      {NAV.map(group => (
        <div key={group.section} style={{ marginTop: '16px' }}>
          {!collapsed && (
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
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '10px 16px' : '9px 16px',
                  background: active ? 'rgba(79,142,247,0.1)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-vault-accent)' : '3px solid transparent',
                  border: 'none',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  color: active ? 'var(--color-vault-text)' : 'var(--color-vault-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
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
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Sidebar;
