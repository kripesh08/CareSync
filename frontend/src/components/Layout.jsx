import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  Home,
  Users,
  Building2,
  Pill,
  FileText,
  Settings,
  LogOut,
  User,
  Shield,
  UserCircle,
  Package,
  Search,
  List,
  Monitor,
  Ticket,
  Database
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Enhanced Color themes for different roles with modern gradients
  const getTheme = () => {
    switch (user?.role) {
      case 'ADMIN':
        return {
          sidebarBg: 'bg-gradient-to-b from-red-900 to-gray-900',
          sidebarText: 'text-gray-100',
          activeItem: 'bg-white/10 text-white shadow-lg border-r-4 border-red-500',
          hoverItem: 'hover:bg-white/5 hover:text-white',
          badge: 'bg-red-900/50 text-red-200 border border-red-700',
          logoutBtn: 'bg-red-700 hover:bg-red-600 shadow-lg'
        };
      case 'PHARMACY':
        return {
          sidebarBg: 'bg-gradient-to-b from-emerald-900 to-gray-900',
          sidebarText: 'text-gray-100',
          activeItem: 'bg-white/10 text-white shadow-lg border-r-4 border-emerald-500',
          hoverItem: 'hover:bg-white/5 hover:text-white',
          badge: 'bg-emerald-900/50 text-emerald-200 border border-emerald-700',
          logoutBtn: 'bg-red-700 hover:bg-red-600 shadow-lg'
        };
      case 'HOSPITAL':
        return {
          sidebarBg: 'bg-gradient-to-b from-purple-900 to-gray-900',
          sidebarText: 'text-gray-100',
          activeItem: 'bg-white/10 text-white shadow-lg border-r-4 border-purple-500',
          hoverItem: 'hover:bg-white/5 hover:text-white',
          badge: 'bg-purple-900/50 text-purple-200 border border-purple-700',
          logoutBtn: 'bg-red-700 hover:bg-red-600 shadow-lg'
        };
      case 'PATIENT':
        return {
          sidebarBg: 'bg-gradient-to-b from-blue-900 to-gray-900',
          sidebarText: 'text-gray-100',
          activeItem: 'bg-white/10 text-white shadow-lg border-r-4 border-blue-500',
          hoverItem: 'hover:bg-white/5 hover:text-white',
          badge: 'bg-blue-900/50 text-blue-200 border border-blue-700',
          logoutBtn: 'bg-red-700 hover:bg-red-600 shadow-lg'
        };
      default:
        return {
          sidebarBg: 'bg-gradient-to-b from-gray-800 to-gray-900',
          sidebarText: 'text-gray-100',
          activeItem: 'bg-white/10 text-white shadow-lg border-r-4 border-gray-500',
          hoverItem: 'hover:bg-white/5 hover:text-white',
          badge: 'bg-gray-700 text-gray-200 border border-gray-600',
          logoutBtn: 'bg-red-700 hover:bg-red-600 shadow-lg'
        };
    }
  };

  const theme = getTheme();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'Pharmacy Management', href: '/admin/pharmacies', icon: Building2 },
          { name: 'Hospital Management', href: '/admin/hospitals', icon: Building2 },
          { name: 'Medicine Management', href: '/admin/medicines', icon: Pill },
          { name: 'Order Management', href: '/admin/orders', icon: Package },
          { name: 'Queue Management', href: '/admin/queue-management', icon: List },
          { name: 'Data Management', href: '/admin/data-management', icon: Database },
        ];
      case 'PATIENT':
        return [
          ...baseItems,
          { name: 'Search Medicines', href: '/search-medicines', icon: Search },
          { name: 'Browse Pharmacies', href: '/browse-pharmacies', icon: Building2 },
          { name: 'My Bookings', href: '/my-bookings', icon: Package },
          { name: 'Browse Hospitals', href: '/browse-hospitals', icon: Building2 },
          { name: 'Search Queues', href: '/search-queues', icon: Search },
          { name: 'My Tokens', href: '/my-tokens', icon: Ticket },
          { name: 'Profile', href: '/patient/profile', icon: UserCircle },
        ];
      case 'PHARMACY':
        return [
          ...baseItems,
          { name: 'Inventory', href: '/pharmacy/inventory', icon: Pill },
          { name: 'Orders', href: '/pharmacy/orders', icon: Settings },
          { name: 'Prescriptions', href: '/pharmacy/prescriptions', icon: FileText },
          { name: 'Profile', href: '/pharmacy/profile', icon: UserCircle },
        ];
      case 'HOSPITAL':
        return [
          ...baseItems,
          { name: 'Queue Management', href: '/hospital/queues', icon: List },
          { name: 'Token Board', href: '/hospital/tokens', icon: Monitor },
          { name: 'Profile', href: '/hospital/profile', icon: UserCircle },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const SidebarContent = () => (
    <div className={`flex-1 flex flex-col min-h-0 ${theme.sidebarBg} transition-colors duration-300`}>
      <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 mb-4 mt-2">
          <span className="text-2xl font-bold text-white tracking-widest uppercase">CareSync</span>
        </div>
        <nav className="mt-2 flex-1 px-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive ? theme.activeItem : `${theme.hoverItem} ${theme.sidebarText}`
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 flex text-gray-100" style={{ minHeight: '100%' }}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-900/90 backdrop-blur-sm ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`} onClick={() => setSidebarOpen(false)} />

        <div className={`relative flex-1 flex flex-col max-w-xs w-full transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-gray-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-30 shadow-2xl">
        <SidebarContent />
      </div>

      {/* Main content container */}
      <div className="md:pl-72 flex flex-col flex-1 w-full bg-gray-900 transition-all duration-300">

        {/* Mobile menu button */}
        <div className="md:hidden sticky top-0 z-20 pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 bg-gray-900">

          {/* Header - Moved INSIDE main content and removed 'sticky' to allow scrolling away */}
          <header className="bg-gray-800/20 backdrop-blur-xl w-full animate-fade-in relative z-10 transition-all duration-300">
            <div className="flex justify-between h-16 px-8 items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {(() => {
                    const path = location.pathname;
                    if (path.includes('/profile')) return 'Account Profile';
                    if (path.includes('/inventory')) return 'Medicine Inventory';
                    if (path.includes('/orders')) return 'Order Management';
                    if (path.includes('/prescriptions')) return 'Prescription Desk';
                    if (path.includes('/search-medicines')) return 'Medicine Library';
                    if (path.includes('/dashboard')) return 'Overview Dashboard';
                    return 'Dashboard';
                  })()}
                </h1>
              </div>
              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-3 bg-gray-800/80 px-4 py-2 rounded-full border border-gray-700/50 shadow-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-200">{user?.email}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badge} ml-2`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white shadow-lg transition-all duration-200 active:scale-95 hover:shadow-xl ml-12 ${theme.logoutBtn}`}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Header bottom subtle glow line instead of border */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-30 shadow-[0_1px_10px_rgba(16,185,129,0.1)]"></div>
          </header>

          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;