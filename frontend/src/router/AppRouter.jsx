import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { routes } from './routes';

// Importación de las páginas
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import BorrowersList from '../pages/BorrowersList.jsx';
import BorrowerProfile from '../pages/BorrowerProfile.jsx';
import LoansList from '../pages/LoansList.jsx';
import LoanDetails from '../pages/LoanDetails.jsx';
import Reports from '../pages/Reports.jsx';

import NavigationPanel from '../components/navigation/NavigationPanel';

const AppLayout = () => {
  const location = useLocation();
  const hideNavigation = [routes.login, routes.register].includes(location.pathname);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!hideNavigation && <NavigationPanel />}
      <main className={`flex-1 overflow-y-auto ${!hideNavigation ? 'bg-gray-50' : 'bg-white'}`}>
        <Routes>
          <Route path={routes.login} element={<Login />} />
          <Route path={routes.register} element={<Register />} />

          <Route path={routes.dashboard} element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path={routes.borrowers} element={<PrivateRoute><BorrowersList /></PrivateRoute>} />
          <Route path={routes.borrowerProfile} element={<PrivateRoute><BorrowerProfile /></PrivateRoute>} />
          <Route path={routes.loans} element={<PrivateRoute><LoansList /></PrivateRoute>} />
          <Route path={routes.loanDetails} element={<PrivateRoute><LoanDetails /></PrivateRoute>} />
          <Route path={routes.reports} element={<PrivateRoute><Reports /></PrivateRoute>} />

          <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default AppRouter;
