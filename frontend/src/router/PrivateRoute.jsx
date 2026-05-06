import { Navigate } from 'react-router-dom';
import { routes } from './routes';

const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    return <Navigate to={routes.login} replace />;
  }

  return children;
};

export default PrivateRoute;