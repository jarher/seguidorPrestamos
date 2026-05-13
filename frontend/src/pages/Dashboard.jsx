import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';
import useLoanStore from '../stores/loanStore';
import useBorrowerStore from '../stores/borrowerStore';
import { formatCurrency } from '../utils/loanCalculator';
import { routes } from '../router/routes';
import StatCard from '../components/ui/StatCard';
import useAuthStore from '../stores/authStore';

const Dashboard = () => {
  const { loans, fetchLoans } = useLoanStore();
  const { borrowers, fetchBorrowers } = useBorrowerStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchLoans(), fetchBorrowers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPrestado = loans.reduce((sum, loan) => sum + parseFloat(loan.principalLoan), 0);

  const totalEnMora = loans
    .filter(loan => loan.status === 'DEFAULTED')
    .reduce((sum, loan) => sum + parseFloat(loan.principalLoan), 0);

  const loansPaid = loans.filter(loan => loan.status === 'PAID');
  const totalCobrado = loansPaid.reduce((sum, loan) => {
    return sum + (loan.paidInstallments / loan.totalInstallments) * parseFloat(loan.principalLoan);
  }, 0);

  const activeBorrowers = borrowers.filter(b => b.activeLoansCount > 0);

  const recentLoans = [...loans].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  const pendingLoans = loans.filter(loan => loan.status === 'ACTIVE').slice(0, 3);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md text-on-surface">
            Hola, {user?.userFirstName || 'Usuario'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Resumen de tu cartera de préstamos
          </p>
        </div>

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Prestado"
          value={formatCurrency(totalPrestado)}
          variant="default"
        />
        <StatCard
          icon={AlertTriangle}
          label="En Mora"
          value={formatCurrency(totalEnMora)}
          variant="error"
        />
        <StatCard
          icon={CheckCircle}
          label="Cobrado"
          value={formatCurrency(totalCobrado)}
          variant="success"
        />
        <StatCard
          icon={Users}
          label="Prestatarios Activos"
          value={activeBorrowers.length}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg text-on-surface font-medium">Préstamos Activos</h2>
            <Link to={routes.loans} className="text-primary text-sm hover:underline">
              Ver todos
            </Link>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="w-10 h-10 text-on-surface-variant mb-3" />
              <p className="text-on-surface-variant">No hay préstamos activos</p>
              <Link
                to={routes.loans}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Crear el primero
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLoans.map((loan) => (
                <Link
                  key={loan.id}
                  to={routes.loanDetails.replace(':id', loan.id)}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-on-surface font-medium text-sm">
                        {loan.borrowerFirstName} {loan.borrowerLastName}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {loan.totalMonths} meses · {loan.paidInstallments}/{loan.totalInstallments} cuotas
                      </p>
                    </div>
                  </div>
                  <p className="text-on-surface font-semibold">
                    {formatCurrency(parseFloat(loan.principalLoan))}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg text-on-surface font-medium">Prestatarios Recientes</h2>
            <Link to={routes.borrowers} className="text-primary text-sm hover:underline">
              Ver todos
            </Link>
          </div>

          {activeBorrowers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-on-surface-variant mb-3" />
              <p className="text-on-surface-variant">No hay prestatarios</p>
              <Link
                to={routes.borrowers}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Agregar el primero
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBorrowers.slice(0, 5).map((borrower) => (
                <Link
                  key={borrower.id}
                  to={routes.borrowerProfile.replace(':id', borrower.id)}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {borrower.borrowerFirstName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-on-surface font-medium text-sm">
                        {borrower.borrowerFirstName} {borrower.borrowerLastName}
                      </p>
                      <p className="text-on-surface-variant text-xs">
                        {borrower.activeLoansCount} préstamo(s) activo(s)
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg text-on-surface font-medium">Actividad Reciente</h2>
        </div>

        {recentLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-10 h-10 text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLoans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${loan.status === 'ACTIVE' ? 'bg-primary' :
                    loan.status === 'DEFAULTED' ? 'bg-error' : 'bg-success'
                    }`} />
                  <div>
                    <p className="text-on-surface text-sm">
                      {loan.borrowerFirstName} {loan.borrowerLastName}
                    </p>
                    <p className="text-on-surface-variant text-xs">
                      {format(new Date(loan.createdAt), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-on-surface font-medium text-sm">
                    {formatCurrency(parseFloat(loan.principalLoan))}
                  </p>
                  <span className={`text-label-sm ${loan.status === 'ACTIVE' ? 'text-primary' :
                    loan.status === 'DEFAULTED' ? 'text-error' : 'text-success'
                    }`}>
                    {loan.status === 'ACTIVE' ? 'Activo' :
                      loan.status === 'DEFAULTED' ? 'En mora' : 'Pagado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Link
        to={routes.loans}
        className="flex items-center w-12 h-12 ml-auto rounded-full justify-center bg-primary text-surface font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">Nuevo Préstamo</span>
      </Link>
    </div>
  );
};

export default Dashboard;