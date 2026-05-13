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
        <h1 className="text-lg sm:text-2xl font-bold">Prestatarios</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-surface text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-primary/80 whitespace-nowrap"
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
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* ── Card view: mobile / tablet ── */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <p className="text-center text-on-surface-variant py-8">Cargando...</p>
        ) : filteredBorrowers.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8">No hay prestatarios</p>
        ) : (
          filteredBorrowers.map((borrower) => (
            <Link
              key={borrower.id}
              to={routes.borrowerProfile.replace(':id', borrower.id)}
              className="block bg-surface-container rounded-2xl p-4 active:scale-[0.98] transition-transform"
            >
              {/* Header row: name + active loans badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-on-surface font-medium truncate mr-2">
                  {borrower.borrowerFirstName} {borrower.borrowerLastName}
                </span>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/20 text-primary">
                  {borrower.activeLoansCount || 0} préstamo{(borrower.activeLoansCount || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Email</p>
                  <p className="text-sm text-on-surface truncate">{borrower.borrowerEmail || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Teléfono</p>
                  <p className="text-sm text-on-surface">{borrower.borrowerPhone || '-'}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(borrower); }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(borrower.id); }}
                  className="text-xs text-error hover:text-error/80 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Table view: desktop ── */}
      <div className="hidden lg:block bg-surface-container rounded-2xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Préstamos Activos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-on-surface-variant">Cargando...</td>
              </tr>
            ) : filteredBorrowers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-on-surface-variant">No hay prestatarios</td>
              </tr>
            ) : (
              filteredBorrowers.map((borrower) => (
                <tr key={borrower.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-6 py-4 text-on-surface">
                    <Link to={routes.borrowerProfile.replace(':id', borrower.id)} className="text-primary hover:underline">
                      {borrower.borrowerFirstName} {borrower.borrowerLastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{borrower.borrowerEmail || '-'}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{borrower.borrowerPhone || '-'}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{borrower.activeLoansCount || 0}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(borrower)}
                      className="text-primary hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(borrower.id)}
                      className="text-error hover:text-error/80"
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