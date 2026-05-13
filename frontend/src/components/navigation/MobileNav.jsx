import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Settings, Menu } from 'lucide-react';
import { routes } from '../../router/routes';
import { useSidebar } from '../../context/SidebarContext';

const navItems = [
  { icon: Home, label: 'Inicio', path: routes.dashboard },
  { icon: FileText, label: 'Préstamos', path: routes.loans },
  { icon: Users, label: 'Prestatarios', path: routes.borrowers },
  { icon: BarChart3, label: 'Reportes', path: routes.reports },
  { icon: Settings, label: 'Ajustes', path: routes.settings }
];

const MobileNav = () => {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();

  return (
    <div className="lg:hidden">
      <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 border-outline bg-surface-container">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover-high transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6 text-on-surface" />
        </button>

        <Link to={routes.dashboard} className="ml-3 flex items-center gap-2">
          <span className="text-lg font-bold text-primary tracking-tight">Lender's HQ</span>
        </Link>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 h-16 z-30 border-outline safe-area-pb bg-surface-container">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== routes.dashboard && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]
                  ${isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileNav;