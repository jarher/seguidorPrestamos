import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import useLoanStore from '../stores/loanStore';
import useBorrowerStore from '../stores/borrowerStore';
import { formatCurrency, formatDate } from '../utils/loanCalculator';
import { routes } from '../router/routes';

const Dashboard = () => {
  const { loans, fetchLoans } = useLoanStore();
  const { borrowers, fetchBorrowers } = useBorrowerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchLoans(), fetchBorrowers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
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

  const today = new Date();
  const todayLoans = [];

  const todayDateStr = format(today, 'yyyy-MM-dd');
  const todayLoansFromStore = loans.filter(l =>
    l.startDate && l.startDate <= todayDateStr && l.status === 'ACTIVE'
  ).slice(0, 3);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">Total Prestado</p>
          <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalPrestado)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <p className="text-sm text-red-600 font-medium">Total en Mora</p>
          <p className="text-2xl font-bold text-red-800">{formatCurrency(totalEnMora)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <p className="text-sm text-green-600 font-medium">Total Cobrado</p>
          <p className="text-2xl font-bold text-green-800">{formatCurrency(totalCobrado)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Prestatarios Activos</h2>
            <Link to={routes.borrowers} className="text-sm text-purple-600 hover:underline">Ver todos</Link>
          </div>
          {activeBorrowers.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay prestatarios activos</p>
          ) : (
            <div className="space-y-3">
              {activeBorrowers.slice(0, 5).map(borrower => (
                <div key={borrower.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <Link to={routes.borrowerProfile.replace(':id', borrower.id)} className="text-purple-600 hover:underline">
                    {borrower.borrowerFirstName} {borrower.borrowerLastName}
                  </Link>
                  <span className="text-sm text-gray-500">{borrower.activeLoansCount} préstamo(s)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Próximos Préstamos</h2>
          {todayLoansFromStore.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay préstamos activos</p>
          ) : (
            <div className="space-y-3">
              {todayLoansFromStore.map((loan) => (
                <div key={loan.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-100">
                  <div>
                    <Link to={routes.loanDetails.replace(':id', loan.id)} className="font-medium text-sm text-purple-600 hover:underline">
                      {loan.borrowerFirstName} {loan.borrowerLastName}
                    </Link>
                    <p className="text-xs text-gray-500">{loan.totalMonths} meses</p>
                  </div>
                  <p className="font-bold text-yellow-800">{formatCurrency(parseFloat(loan.principalLoan))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Préstamos Recientes</h2>
          <Link to={routes.loans} className="text-sm text-purple-600 hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prestatario</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Monto</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Progreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loans.slice(0, 5).map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link to={routes.loanDetails.replace(':id', loan.id)} className="text-purple-600 hover:underline">
                      {loan.borrowerFirstName} {loan.borrowerLastName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(parseFloat(loan.principalLoan))}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      loan.status === 'DEFAULTED' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'Mora' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-sm">
                    {loan.paidInstallments}/{loan.totalInstallments} cuotas
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;