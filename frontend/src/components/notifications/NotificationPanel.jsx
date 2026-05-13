import useNotificationStore from '../../stores/notificationStore';

const NotificationPanel = ({ notifications, onClose }) => {
  const { markAsRead, markAllAsRead } = useNotificationStore();

  const handleNotificationClick = async (id) => {
    await markAsRead(id);
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold">Notificaciones</h3>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Marcar todo leído
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500 text-sm">No hay notificaciones</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <p className="text-sm text-gray-800">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.scheduledFor).toLocaleDateString('es-CO', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;