import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Walt-tab Navigation Component
 * Brutalist style: High contrast, clean lines, minimal decoration
 * Mobile: Fixed bottom bar (56px)
 * Desktop: Top bar below header
 */

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const Navigation: React.FC = () => {
  const navItems: NavItem[] = [
    {
      to: '/entry',
      label: 'Entry',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      to: '/timeline',
      label: 'Timeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      to: '/tools',
      label: 'Tools',
      icon: (
        <div className="relative w-5 h-5">
          {/* Wrench - positioned bottom-left */}
          <svg className="absolute bottom-0 left-0 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a2 2 0 002.5 2.5l3.276-3.276c.256.565.398 1.192.398 1.852z"
            />
          </svg>
          {/* Magnifying glass - positioned top-right */}
          <svg className="absolute top-0 right-0 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
      ),
    },
    {
      to: '/saved',
      label: 'Saved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - 56px height */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-40 md:hidden safe-area-bottom">
        <div className="flex h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 transition-colors duration-fast ${
                  isActive
                    ? 'text-black bg-concrete'
                    : 'text-slate hover:text-charcoal hover:bg-concrete/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon}
                  <span className={`text-tiny mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Top Navigation */}
      <nav className="hidden md:block bg-white border-b border-steel">
        <div className="max-w-content mx-auto px-md">
          <div className="flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-3 px-6 transition-colors duration-fast border-b-2 -mb-px ${
                    isActive
                      ? 'text-black border-tab-red font-semibold'
                      : 'text-slate hover:text-black border-transparent'
                  }`
                }
              >
                {item.icon}
                <span className="text-small">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
