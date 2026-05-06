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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Préstamos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          + Nuevo Préstamo
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded ${!filter ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-3 py-1 rounded ${filter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('DEFAULTED')}
          className={`px-3 py-1 rounded ${filter === 'DEFAULTED' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
        >
          Mora
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`px-3 py-1 rounded ${filter === 'PAID' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          Pagados
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prestatario</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Esquema</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Meses</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progreso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredLoans.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No hay préstamos</td>
              </tr>
            ) : (
              filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {loan.borrowerFirstName} {loan.borrowerLastName}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatCurrency(parseFloat(loan.principalLoan))}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {loan.loanScheme === 'FIXED_INSTALLMENT' ? 'Fija' :
                     loan.loanScheme === 'DECREASING_INSTALLMENT' ? 'Decreciente' : 'Sin interés'}
                  </td>
                  <td className="px-6 py-4 text-center">{loan.totalMonths}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                      {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'Mora' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {loan.paidInstallments}/{loan.totalInstallments}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={routes.loanDetails.replace(':id', loan.id)} className="text-purple-600 hover:underline mr-3">
                      Ver
                    </Link>
                    {loan.status !== 'PAID' && (
                      <button onClick={() => handleDelete(loan.id)} className="text-red-600 hover:text-red-800">
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