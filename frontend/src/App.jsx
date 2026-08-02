import React, { useEffect, useState } from 'react';
import './App.css';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { ThemeProvider } from './theme/ThemeContext';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import Dashboard from './pages/Dashboard/Dashboard';
import AllStores from './pages/AllStores/AllStores';
import StoreDetails from './pages/StoreDetails/StoreDetails';
import CategoryPage from './pages/Categories/CategoryPage';
import CategoriesOverview from './pages/Categories/CategoriesOverview';
import AIAssistant from './pages/AIAssistant/AIAssistant';
import AddPage from './pages/AddPage/AddPage';
import AuthPage from './pages/Auth/AuthPage';
import SellerProfile from './pages/SellerProfile/SellerProfile';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import Settings from './pages/Settings/Settings';
import {
  onAuthStateChangedListener,
  logoutUser,
  getUserProfile,
} from './firebase/firebaseService';

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ء-ي\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const parseLocation = () => {
  const pathname = window.location.pathname || '/';
  if (pathname.startsWith('/store/')) {
    return { page: 'store-details', params: { storeSlug: pathname.replace('/store/', '') } };
  }
  if (pathname.startsWith('/category/')) {
    return { page: 'category-page', params: { categoryName: decodeURIComponent(pathname.replace('/category/', '')) } };
  }
  if (pathname === '/all-stores' || pathname === '/stores') {
    return { page: 'all-stores', params: {} };
  }
  if (pathname === '/ai') {
    return { page: 'ai', params: {} };
  }
  if (pathname === '/add-page') {
    return { page: 'add-page', params: {} };
  }
  if (pathname === '/auth') {
    return { page: 'auth', params: {} };
  }
  if (pathname === '/seller-profile') {
    return { page: 'seller-profile', params: {} };
  }
  if (pathname === '/admin-dashboard') {
    return { page: 'admin-dashboard', params: {} };
  }
  if (pathname === '/admin/login') {
    return { page: 'admin-login', params: {} };
  }
  if (pathname === '/settings') {
    return { page: 'settings', params: {} };
  }

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    if (hash.startsWith('/store/')) {
      return { page: 'store-details', params: { storeSlug: hash.replace('/store/', '') } };
    }
    if (hash.startsWith('/category/')) {
      return { page: 'category-page', params: { categoryName: decodeURIComponent(hash.replace('/category/', '')) } };
    }
    if (hash === '/admin/login') {
      return { page: 'admin-login', params: {} };
    }
    return { page: hash, params: {} };
  }

  return { page: 'dashboard', params: {} };
};

const buildPath = (page, params) => {
  if (page === 'store-details' && params.storeSlug) {
    return `/store/${params.storeSlug}`;
  }
  if (page === 'category-page' && params.categoryName) {
    return `/category/${encodeURIComponent(params.categoryName)}`;
  }
  if (page === 'all-stores') return '/all-stores';
  if (page === 'ai') return '/ai';
  if (page === 'add-page') return '/add-page';
  if (page === 'auth') return '/auth';
  if (page === 'seller-profile') return '/seller-profile';
  if (page === 'admin-dashboard') return '/admin-dashboard';
  if (page === 'admin-login') return '/admin/login';
  if (page === 'settings') return '/settings';
  return '/';
}

function AppInner({ dir }) {
  const initialRoute = parseLocation();
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [pageParams, setPageParams] = useState(initialRoute.params);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const onPopState = () => {
      const route = parseLocation();
      setCurrentPage(route.page);
      setPageParams(route.params);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    setMobileMenuOpen(false);
    const path = buildPath(page, params);
    window.history.pushState({}, '', path);
  };  const handleLogout = async () => {
    await logoutUser();
    setCurrentPage('dashboard');
  };

  const activePage = currentPage === 'category-page' ? 'categories' : currentPage;

  const renderPage = () => {
    switch (currentPage) {
      case 'all-stores':
        return (
          <AllStores
            onViewStore={(store) => handleNavigate('store-details', { storeSlug: store.slug || store.id, storeId: store.id })}
            onNavigate={handleNavigate}
            initialSearch={pageParams.searchQuery}
            initialCategory={pageParams.category}
          />
        );
      case 'store-details':
        return <StoreDetails storeId={pageParams.storeId} storeSlug={pageParams.storeSlug} onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'categories':
        return <CategoriesOverview onNavigate={handleNavigate} />;
      case 'category-page':
        return (
          <CategoryPage
            categoryName={pageParams.categoryName}
            onViewStore={(item) =>
              handleNavigate('store-details', {
                storeId: typeof item === 'string' ? item : item?.id,
                storeSlug: item && typeof item === 'object' ? item.slug || item.id : undefined,
              })
            }
            onNavigate={handleNavigate}
          />
        );
      case 'ai':
        return <AIAssistant onNavigate={handleNavigate} />;
      case 'add-page':
        return (
          <AddPage
            key={pageParams.storeId || 'new'}
            currentUser={currentUser}
            userProfile={userProfile}
            onNavigate={handleNavigate}
            editingStoreId={pageParams.storeId}
          />
        );
      case 'auth':
        return <AuthPage currentUser={currentUser} onNavigate={handleNavigate} pageParams={pageParams} />;
      case 'seller-profile':
        return <SellerProfile currentUser={currentUser} userProfile={userProfile} onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} currentUser={currentUser} onLogout={handleLogout} />;
      case 'admin-login':
        return <AdminLogin onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewStore={(id) => handleNavigate('store-details', { storeId: id })} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-root" dir={dir}>
      <Header
        onMenuToggle={() => setMobileMenuOpen(true)}
        onNavigate={handleNavigate}
        activePage={activePage}
        currentUser={currentUser}
      />
      <Navigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="app-content">{renderPage()}</main>
    </div>
  );
}

const AppShell = () => {
  const { dir } = useI18n();
  return <AppInner dir={dir} />;
};

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
