import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/loanCalculator';
import { routes } from '../router/routes';

const BorrowerProfile = () => {
  const { id } = useParams();
  const [borrower, setBorrower] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrower = async () => {
      try {
        const response = await api.get(`/borrowers/${id}`);
        setBorrower(response.data);
        setLoans(response.data.loans || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBorrower();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  if (!borrower) {
    return <div className="p-6 text-center">Prestatario no encontrado</div>;
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
      <div className="mb-4">
        <Link to={routes.borrowers} className="text-purple-600 hover:underline">← Volver a Prestatarios</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">
          {borrower.borrowerFirstName} {borrower.borrowerLastName}
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {borrower.borrowerEmail && (
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{borrower.borrowerEmail}</p>
            </div>
          )}
          {borrower.borrowerPhone && (
            <div>
              <p className="text-gray-500">Teléfono</p>
              <p className="font-medium">{borrower.borrowerPhone}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Fecha de registro</p>
            <p className="font-medium">{formatDate(borrower.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Préstamos</p>
            <p className="font-medium">{loans.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de Préstamos</h2>
        
        {loans.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay préstamos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Monto</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Esquema</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Meses</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{loan.id.slice(0, 8)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(parseFloat(loan.principalLoan))}</td>
                    <td className="px-4 py-2 text-center text-sm">
                      {loan.loanScheme === 'FIXED_INSTALLMENT' ? 'Fija' :
                       loan.loanScheme === 'DECREASING_INSTALLMENT' ? 'Decreciente' : 'Sin interés'}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">{loan.totalMonths}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                        {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'Mora' : 'Pagado'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Link to={routes.loanDetails.replace(':id', loan.id)} className="text-purple-600 hover:underline text-sm">
                        Ver详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowerProfile;