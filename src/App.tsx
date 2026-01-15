import React, { useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { ToastContainer } from '@/components/ui';
import { LockScreen } from '@/components/LockScreen';
import {
  Login,
  Dashboard,
  Products,
  Sales,
  SalesList,
  StockPage,
  Reports,
  Customers,
  DebtPayments,
  Returns,
  SettingsPage,
  Users,
  CategoryManagement,
  ColorManagement,
} from '@/pages';
import { useAppStore } from '@/store/appStore';

const App: React.FC = () => {
  const { activePage, setActivePage, toasts, removeToast, currentUser, isAdmin, lockScreen, isScreenLocked } = useAppStore();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser && activePage !== 'login') {
      setActivePage('login');
    } else if (currentUser && activePage === 'login') {
      setActivePage('dashboard');
    }
  }, [currentUser, activePage, setActivePage]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!currentUser || isScreenLocked) return;
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer - 3 minutes (180000ms)
    inactivityTimerRef.current = setTimeout(() => {
      lockScreen();
    }, 180000); // 3 dəqiqə
  }, [currentUser, lockScreen, isScreenLocked]);

  // Inactivity timer - track user activity
  useEffect(() => {
    if (!currentUser || isScreenLocked) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Reset timer on user activity
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentUser, resetInactivityTimer, isScreenLocked]);

  // Keyboard shortcuts (only when logged in)
  useEffect(() => {
    if (!currentUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 - Lock Screen (yeni funksiya)
      if (e.key === 'F5') {
        e.preventDefault();
        lockScreen();
        return;
      }
      
      // Qıfıl ekranındaysa digər shortcutlar işləməsin
      if (isScreenLocked) return;

      // F1 - Products
      if (e.key === 'F1') {
        e.preventDefault();
        setActivePage('products');
      }
      // F2 - Sales
      if (e.key === 'F2') {
        e.preventDefault();
        setActivePage('sales');
      }
      // F3 - Stock
      if (e.key === 'F3') {
        e.preventDefault();
        setActivePage('stock');
      }
      // F4 - Reports (only admin)
      if (e.key === 'F4' && isAdmin()) {
        e.preventDefault();
        setActivePage('reports');
      }
      // F6 - Customers
      if (e.key === 'F6') {
        e.preventDefault();
        setActivePage('customers');
      }
      // F7 - Debt Payments
      if (e.key === 'F7') {
        e.preventDefault();
        setActivePage('debtpayments');
      }
      // F8 - Returns
      if (e.key === 'F8') {
        e.preventDefault();
        setActivePage('returns');
      }
      // F9 - Sales List
      if (e.key === 'F9') {
        e.preventDefault();
        setActivePage('saleslist');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActivePage, currentUser, isAdmin, lockScreen, isScreenLocked]);

  // Show login page if not authenticated
  if (!currentUser || activePage === 'login') {
    return (
      <>
        <Login />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'saleslist':
        return <SalesList />;
      case 'customers':
        return <Customers />;
      case 'stock':
        return <StockPage />;
      case 'reports':
        // Only admin can see reports
        return isAdmin() ? <Reports /> : <Dashboard />;
      case 'debtpayments':
        return <DebtPayments />;
      case 'returns':
        return <Returns />;
      case 'settings':
        // Only admin can see settings
        return isAdmin() ? <SettingsPage /> : <Dashboard />;
      case 'users':
        // Only admin can manage users
        return isAdmin() ? <Users /> : <Dashboard />;
      case 'categories':
        // Only admin can manage categories
        return isAdmin() ? <CategoryManagement /> : <Dashboard />;
      case 'colors':
        // Only admin can manage colors
        return isAdmin() ? <ColorManagement /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </Layout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <LockScreen />
    </>
  );
};

export default App;
