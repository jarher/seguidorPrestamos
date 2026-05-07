import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { routes } from './routes';
import { SidebarProvider } from '../context/SidebarContext';

import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Settings from '../pages/Settings.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import BorrowersList from '../pages/BorrowersList.jsx';
import BorrowerProfile from '../pages/BorrowerProfile.jsx';
import LoansList from '../pages/LoansList.jsx';
import LoanDetails from '../pages/LoanDetails.jsx';
import Reports from '../pages/Reports.jsx';

import NavigationPanel from '../components/navigation/NavigationPanel';
import MobileNav from '../components/navigation/MobileNav';
import '../App.css';

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="app-layout">
        <NavigationPanel />
        <MobileNav />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
};

const AppRouter = () => {
  const token = sessionStorage.getItem('token');
  const isAuthenticated = !!token;

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <Route element={<AuthLayout />}>
            <Route path={routes.login} element={<Login />} />
            <Route path={routes.register} element={<Register />} />
            <Route path="*" element={<Navigate to={routes.login} replace />} />
          </Route>
        ) : (
          <Route element={<AppLayout />}>
            <Route path={routes.dashboard} element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path={routes.borrowers} element={<PrivateRoute><BorrowersList /></PrivateRoute>} />
            <Route path={routes.borrowerProfile} element={<PrivateRoute><BorrowerProfile /></PrivateRoute>} />
            <Route path={routes.loans} element={<PrivateRoute><LoansList /></PrivateRoute>} />
            <Route path={routes.loanDetails} element={<PrivateRoute><LoanDetails /></PrivateRoute>} />
            <Route path={routes.reports} element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path={routes.settings} element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;