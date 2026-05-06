import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import useBorrowerStore from '../stores/borrowerStore';
import BorrowerFormModal from '../components/borrower/BorrowerFormModal';
import { routes } from '../router/routes';

const BorrowersList = () => {
  const { borrowers, fetchBorrowers, deleteBorrower, loading } = useBorrowerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState(null);

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este prestatario?')) {
      try {
        await deleteBorrower(id);
        toast.success('Prestatario eliminado');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const filteredBorrowers = borrowers.filter(
    (b) =>
      b.borrowerFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowerLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (borrower) => {
    setEditingBorrower(borrower);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBorrower(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchBorrowers();
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prestatarios</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          + Nuevo Prestatario
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar prestatario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Préstamos Activos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : filteredBorrowers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay prestatarios</td>
              </tr>
            ) : (
              filteredBorrowers.map((borrower) => (
                <tr key={borrower.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={routes.borrowerProfile.replace(':id', borrower.id)} className="text-purple-600 hover:underline">
                      {borrower.borrowerFirstName} {borrower.borrowerLastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{borrower.borrowerEmail || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{borrower.borrowerPhone || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{borrower.activeLoansCount || 0}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(borrower)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(borrower.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <BorrowerFormModal
          borrower={editingBorrower}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default BorrowersList;