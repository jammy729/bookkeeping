import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/income', label: 'Income' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/clients', label: 'Clients' },
    { path: '/categories', label: 'Categories' },
    { path: '/reports', label: 'Reports' },
  ];

  const bottomNavItems = [
    { path: '/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
        <div className="p-4 shrink-0">
          <h1 className="text-xl font-bold">Bookkeeping</h1>
          <p className="text-sm text-gray-400 mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 text-sm hover:bg-gray-800 rounded ${
                isActive(item.path) ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-2 space-y-1 shrink-0">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 text-sm hover:bg-gray-800 rounded ${
                isActive(item.path) ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
