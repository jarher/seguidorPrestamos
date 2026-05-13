import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Settings, LogOut, X, DollarSign, Sun, Moon } from 'lucide-react';
import { routes } from '../../router/routes';
import { useSidebar } from '../../context/SidebarContext';
import useAuthStore from '../../stores/authStore';
import useThemeStore from '../../stores/themeStore';

const navItems = [
  { icon: Home, label: 'Dashboard', path: routes.dashboard },
  { icon: FileText, label: 'Préstamos', path: routes.loans },
  { icon: Users, label: 'Prestatarios', path: routes.borrowers },
  { icon: BarChart3, label: 'Reportes', path: routes.reports },
];

const NavigationPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isOpen, closeSidebar } = useSidebar();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate(routes.login);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeSidebar}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        w-64 bg-surface-container h-screen max-h-screen overflow-y-auto
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="flex flex-col flex-1 h-full">
          <div className="p-6 border-b border-outline flex items-center justify-between lg:justify-start">
            <Link
              to={routes.dashboard}
              className="flex items-center gap-3"
              onClick={closeSidebar}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-on-surface tracking-tight">Lender's HQ</span>
            </Link>

            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-surface-container-high lg:hidden transition-colors"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <p className="text-label-sm text-on-surface-variant px-4 mb-3">Menú Principal</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== routes.dashboard && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-outline space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
            <Link
              to={routes.settings}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NavigationPanel;