import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import useLoanStore from '../stores/loanStore';
import PaymentHistoryTable from '../components/loan/PaymentHistoryTable';
import { formatCurrency, formatDate } from '../utils/loanCalculator';
import { routes } from '../router/routes';

const LoanDetails = () => {
  const { id } = useParams();
  const { currentLoan, currentSchedule, fetchLoanById, markInstallmentPaid, updateLoanStatus, loading } = useLoanStore();
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchLoanById(id);
  }, [id]);

  const handleMarkPaid = async (installmentNumber) => {
    try {
      await markInstallmentPaid(id, installmentNumber);
      toast.success('Cuota marcada como pagada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al marcar cuota');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateLoanStatus(id, newStatus);
      toast.success('Estado actualizado');
      setShowStatusModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  if (loading || !currentLoan) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'DEFAULTED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" />
      <div className="mb-4">
        <Link to={routes.loans} className="text-purple-600 hover:underline">← Volver a Préstamos</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Préstamo #{id.slice(0, 8)}</h1>
            <p className="text-gray-600">Prestatario: {currentLoan.borrower?.borrowerFirstName} {currentLoan.borrower?.borrowerLastName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentLoan.status)}`}>
              {currentLoan.status === 'ACTIVE' ? 'Activo' : currentLoan.status === 'DEFAULTED' ? 'En Mora' : 'Pagado'}
            </span>
            <button
              onClick={() => setShowStatusModal(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Cambiar Estado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Monto</p>
            <p className="font-medium">{formatCurrency(parseFloat(currentLoan.principalLoan))}</p>
          </div>
          <div>
            <p className="text-gray-500">Tasa Mensual</p>
            <p className="font-medium">{(parseFloat(currentLoan.monthlyRate) * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-gray-500">Meses</p>
            <p className="font-medium">{currentLoan.totalMonths}</p>
          </div>
          <div>
            <p className="text-gray-500">Esquema</p>
            <p className="font-medium">
              {currentLoan.loanScheme === 'FIXED_INSTALLMENT' ? 'Cuota Fija' :
               currentLoan.loanScheme === 'DECREASING_INSTALLMENT' ? 'Decreciente' : 'Sin Interés'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Fecha Inicio</p>
            <p className="font-medium">{formatDate(currentLoan.startDate)}</p>
          </div>
          {currentLoan.maturityDate && (
            <div>
              <p className="text-gray-500">Fecha Vencimiento</p>
              <p className="font-medium">{formatDate(currentLoan.maturityDate)}</p>
            </div>
          )}
          {currentLoan.statusUpdatedAt && (
            <div>
              <p className="text-gray-500">Último Cambio de Estado</p>
              <p className="font-medium">{formatDate(currentLoan.statusUpdatedAt)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de Cuotas</h2>
        <PaymentHistoryTable
          schedule={currentSchedule}
          loanStatus={currentLoan.status}
          onMarkPaid={handleMarkPaid}
          loading={loading}
        />
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Cambiar Estado</h3>
            <div className="space-y-2">
              {['ACTIVE', 'DEFAULTED', 'PAID'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={currentLoan.status === status}
                  className={`w-full p-3 rounded-lg border text-left ${
                    currentLoan.status === status
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {status === 'ACTIVE' ? 'Activo' : status === 'DEFAULTED' ? 'En Mora' : 'Pagado'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;