const StatCard = ({ icon: Icon, label, value, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-surface-container text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
  };

  const iconBgStyles = {
    default: 'bg-primary/20',
    success: 'bg-success/20',
    warning: 'bg-warning/20',
    error: 'bg-error/20',
  };

  return (
    <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBgStyles[variant]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-label-sm text-on-surface-variant">{label}</span>
      </div>
      <p className="text-title-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
};

export default StatCard;