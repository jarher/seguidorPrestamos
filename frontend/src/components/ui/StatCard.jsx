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
        <div className={`w-[clamp(2.5rem,2rem+2.38vw,3rem)] h-[clamp(2.5rem,2rem+2.38vw,3rem)] rounded-xl ${iconBgStyles[variant]} flex items-center justify-center`}>
          <Icon className="w-[clamp(1.25rem,0.75rem+2.38vw,1.5rem)] h-[clamp(1.25rem,0.75rem+2.38vw,1.5rem)]" />
        </div>
        <span className="text-[clamp(0.35rem,0.5rem+2.38vw,0.725rem)] text-on-surface-variant">{label}</span>
      </div>
      <p className="text-[clamp(1.125rem,0.625rem+2.38vw,1.375rem)] font-semibold text-on-surface">{value}</p>
    </div>
  );
};

export default StatCard;