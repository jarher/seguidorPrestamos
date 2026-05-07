import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, User, DollarSign } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { registerSchema } from '../utils/validators';
import { routes } from '../router/routes';

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
    <div className="w-full max-w-md">
      <div className="bg-surface-container rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Lender's HQ</h1>
        </div>

        <h2 className="text-title-lg text-on-surface text-center mb-6">Crear Cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-label-sm text-on-surface-variant block mb-2">Nombre</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                name="userFirstName"
                className="w-full bg-surface-container-low pl-12 pr-4 py-3 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Juan"
              />
            </div>
            {errors.userFirstName && (
              <p className="text-error text-xs mt-2">{errors.userFirstName}</p>
            )}
          </div>

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-2">Apellido</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                name="userLastName"
                className="w-full bg-surface-container-low pl-12 pr-4 py-3 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Pérez"
              />
            </div>
            {errors.userLastName && (
              <p className="text-error text-xs mt-2">{errors.userLastName}</p>
            )}
          </div>

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-2">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                name="userEmail"
                className="w-full bg-surface-container-low pl-12 pr-4 py-3 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="correo@ejemplo.com"
              />
            </div>
            {errors.userEmail && (
              <p className="text-error text-xs mt-2">{errors.userEmail}</p>
            )}
          </div>

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="password"
                name="userPassword"
                className="w-full bg-surface-container-low pl-12 pr-4 py-3 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            {errors.userPassword && (
              <p className="text-error text-xs mt-2">{errors.userPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-surface font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to={routes.login} className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;