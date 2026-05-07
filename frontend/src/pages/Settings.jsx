import { useState } from 'react';
import { toast } from 'react-toastify';
import { User, Lock, Bell, Trash2, AlertTriangle } from 'lucide-react';
import useAuthStore from '../stores/authStore';

const Settings = () => {
  const { user, deleteAccount } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Cuenta eliminada exitosamente');
    } catch (error) {
      toast.error('Error al eliminar la cuenta');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-headline-md text-on-surface">Configuración</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <div className="bg-surface-container rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-outline">
          <h2 className="text-title-lg text-on-surface font-medium flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Información de la Cuenta
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Nombre</span>
            <span className="text-on-surface">{user?.userFirstName} {user?.userLastName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Correo electrónico</span>
            <span className="text-on-surface">{user?.userEmail}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-outline">
          <h2 className="text-title-lg text-on-surface font-medium flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificaciones
          </h2>
        </div>
        <div className="p-5">
          <p className="text-on-surface-variant text-sm">
            Las notificaciones se envían automáticamente cuando se generan recordatorios de pago.
          </p>
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl overflow-hidden border border-error/30">
        <div className="p-5 border-b border-error/20">
          <h2 className="text-title-lg text-error font-medium flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona de Peligro
          </h2>
        </div>
        <div className="p-5">
          <p className="text-on-surface-variant text-sm mb-4">
            Eliminar tu cuenta es irreversible. Todos tus datos, prestatarios, préstamos e historial serán eliminados permanentemente.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Cuenta
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-error text-sm font-medium">
                ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-white hover:bg-error/90 transition-colors"
                >
                  Sí, eliminar mi cuenta
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;