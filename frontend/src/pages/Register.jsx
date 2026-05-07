import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from '../stores/authStore.js';
import { registerSchema } from '../utils/validators.js';
import { routes } from '../router/routes.js';

const Register = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {
      userEmail: formData.get('userEmail'),
      userPassword: formData.get('userPassword'),
      userFirstName: formData.get('userFirstName'),
      userLastName: formData.get('userLastName'),
    };

    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      await register(data);
      toast.success('¡Cuenta creada exitosamente!');
      navigate(routes.dashboard);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <ToastContainer position="top-right" />
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="userFirstName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Juan"
            />
            {errors.userFirstName && <p className="text-red-500 text-sm mt-1">{errors.userFirstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              name="userLastName"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Pérez"
            />
            {errors.userLastName && <p className="text-red-500 text-sm mt-1">{errors.userLastName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              name="userEmail"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="correo@ejemplo.com"
            />
            {errors.userEmail && <p className="text-red-500 text-sm mt-1">{errors.userEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              name="userPassword"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
            {errors.userPassword && <p className="text-red-500 text-sm mt-1">{errors.userPassword}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to={routes.login} className="text-purple-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;