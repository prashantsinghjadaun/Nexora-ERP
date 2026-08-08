import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { ProductListPage } from './pages/inventory/ProductListPage';
import { StockMovementPage } from './pages/inventory/StockMovementPage';
import { ChallanListPage } from './pages/challans/ChallanListPage';
import { CreateChallanPage } from './pages/challans/CreateChallanPage';
import { ChallanDetailPage } from './pages/challans/ChallanDetailPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (currentPath === '/' || currentPath === '') {
    window.location.pathname = '/dashboard';
    return null;
  }

  if (currentPath === '/login') {
    return <LoginPage />;
  }

  // Handle route patterns
  let content = <DashboardPage />;
  let title = 'Dashboard Overview';
  let allowedRoles: ('ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS')[] = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];

  if (currentPath === '/dashboard') {
    content = <DashboardPage />;
    title = 'Executive Dashboard';
  } else if (currentPath === '/customers') {
    content = <CustomerListPage />;
    title = 'Customer CRM';
    allowedRoles = ['ADMIN', 'SALES', 'ACCOUNTS'];
  } else if (currentPath.startsWith('/customers/')) {
    const id = currentPath.split('/')[2];
    content = <CustomerDetailPage customerId={id} />;
    title = 'Customer Account Profile';
    allowedRoles = ['ADMIN', 'SALES', 'ACCOUNTS'];
  } else if (currentPath === '/products') {
    content = <ProductListPage />;
    title = 'Products Catalog & Inventory';
  } else if (currentPath === '/stock-movements') {
    content = <StockMovementPage />;
    title = 'Stock Movements Audit Log';
    allowedRoles = ['ADMIN', 'WAREHOUSE', 'ACCOUNTS'];
  } else if (currentPath === '/challans') {
    content = <ChallanListPage />;
    title = 'Sales Challans Overview';
  } else if (currentPath === '/challans/new') {
    content = <CreateChallanPage />;
    title = 'Create Draft Sales Challan';
    allowedRoles = ['ADMIN', 'SALES'];
  } else if (currentPath.startsWith('/challans/')) {
    const id = currentPath.split('/')[2];
    content = <ChallanDetailPage challanId={id} />;
    title = 'Sales Challan Inspector';
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout currentPath={currentPath} title={title}>
        {content}
      </AppLayout>
    </ProtectedRoute>
  );
};

export const MainApp: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default MainApp;
