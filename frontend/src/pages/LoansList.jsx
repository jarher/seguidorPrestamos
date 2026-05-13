import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import useLoanStore from '../stores/loanStore';
import useBorrowerStore from '../stores/borrowerStore';
import CreateLoanModal from '../components/loan/CreateLoanModal';
import { formatCurrency } from '../utils/loanCalculator';
import { routes } from '../router/routes';

const LoansList = () => {
  const { loans, fetchLoans, deleteLoan, loading } = useLoanStore();
  const { borrowers, fetchBorrowers } = useBorrowerStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLoans();
    fetchBorrowers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este préstamo?')) {
      try {
        await deleteLoan(id);
        toast.success('Préstamo eliminado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (!filter) return true;
    if (filter === 'ACTIVE') return loan.status === 'ACTIVE';
    if (filter === 'DEFAULTED') return loan.status === 'DEFAULTED';
    if (filter === 'PAID') return loan.status === 'PAID';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'DEFAULTED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLoanCreated = () => {
    setShowModal(false);
    fetchLoans();
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" />
      <div className="flex justify-between items-center mb-6 gap-2">
        <h1 className="text-lg sm:text-2xl font-bold">Préstamos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-surface text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-primary/80 whitespace-nowrap"
        >
          + Nuevo Préstamo
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded ${!filter ? 'bg-primary text-surface' : 'bg-surface-container-highest'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-3 py-1 rounded ${filter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-surface-container-highest'}`}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('DEFAULTED')}
          className={`px-3 py-1 rounded ${filter === 'DEFAULTED' ? 'bg-red-600 text-white' : 'bg-surface-container-highest'}`}
        >
          Mora
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`px-3 py-1 rounded ${filter === 'PAID' ? 'bg-green-600 text-white' : 'bg-surface-container-highest'}`}
        >
          Pagados
        </button>
      </div>

      {/* ── Card view: mobile / tablet ── */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <p className="text-center text-on-surface-variant py-8">Cargando...</p>
        ) : filteredLoans.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8">No hay préstamos</p>
        ) : (
          filteredLoans.map((loan) => {
            const progress = loan.totalInstallments
              ? Math.round((loan.paidInstallments / loan.totalInstallments) * 100)
              : 0;

            return (
              <Link
                key={loan.id}
                to={routes.loanDetails.replace(':id', loan.id)}
                className="block bg-surface-container rounded-2xl p-4 active:scale-[0.98] transition-transform"
              >
                {/* Header row: name + status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-on-surface font-medium truncate mr-2">
                    {loan.borrowerFirstName} {loan.borrowerLastName}
                  </span>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${loan.status === 'ACTIVE'
                    ? 'bg-primary/20 text-primary'
                    : loan.status === 'DEFAULTED'
                      ? 'bg-error/20 text-error'
                      : 'bg-success/20 text-success'
                    }`}>
                    {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'Mora' : 'Pagado'}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Monto</p>
                    <p className="text-sm font-semibold text-on-surface">
                      {formatCurrency(parseFloat(loan.principalLoan))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Esquema</p>
                    <p className="text-sm text-on-surface">
                      {loan.loanScheme === 'FIXED_INSTALLMENT' ? 'Fija' :
                        loan.loanScheme === 'DECREASING_INSTALLMENT' ? 'Decrec.' : 'Sin int.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Plazo</p>
                    <p className="text-sm text-on-surface">{loan.totalMonths} meses</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${loan.status === 'DEFAULTED' ? 'bg-error' :
                        loan.status === 'PAID' ? 'bg-success' : 'bg-primary'
                        }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    {loan.paidInstallments}/{loan.totalInstallments}
                  </span>
                </div>

                {/* Delete button (only for non-PAID) */}
                {loan.status !== 'PAID' && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(loan.id); }}
                    className="mt-3 text-xs text-error hover:text-error/80 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* ── Table view: desktop ── */}
      <div className="hidden lg:block bg-surface-container rounded-2xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Prestatario</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-on-surface-variant uppercase">Monto</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase">Esquema</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase">Meses</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase">Progreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-on-surface-variant">Cargando...</td>
              </tr>
            ) : filteredLoans.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-on-surface-variant">No hay préstamos</td>
              </tr>
            ) : (
              filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4 text-on-surface">
                    {loan.borrowerFirstName} {loan.borrowerLastName}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-on-surface">
                    {formatCurrency(parseFloat(loan.principalLoan))}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-on-surface">
                    {loan.loanScheme === 'FIXED_INSTALLMENT' ? 'Fija' :
                      loan.loanScheme === 'DECREASING_INSTALLMENT' ? 'Decreciente' : 'Sin interés'}
                  </td>
                  <td className="px-6 py-4 text-center text-on-surface">{loan.totalMonths}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${loan.status === 'ACTIVE'
                      ? 'bg-primary/20 text-primary'
                      : loan.status === 'DEFAULTED'
                        ? 'bg-error/20 text-error'
                        : 'bg-success/20 text-success'
                      }`}>
                      {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'Mora' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-on-surface">
                    {loan.paidInstallments}/{loan.totalInstallments}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={routes.loanDetails.replace(':id', loan.id)} className="text-primary hover:underline mr-3">
                      Ver
                    </Link>
                    {loan.status !== 'PAID' && (
                      <button onClick={() => handleDelete(loan.id)} className="text-error hover:text-error/80">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateLoanModal
          onClose={() => setShowModal(false)}
          onSuccess={handleLoanCreated}
        />
      )}
    </div>
  );
};

export default LoansList;