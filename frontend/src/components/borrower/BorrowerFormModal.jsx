import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import useBorrowerStore from '../../stores/borrowerStore';
import { createBorrowerSchema } from '../../utils/validators';

const BorrowerFormModal = ({ borrower, onClose, onSuccess }) => {
  const { createBorrower, updateBorrower, loading } = useBorrowerStore();
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.target);
    const data = {
      borrowerFirstName: formData.get('borrowerFirstName'),
      borrowerLastName: formData.get('borrowerLastName') || undefined,
      borrowerEmail: formData.get('borrowerEmail') || undefined,
      borrowerPhone: formData.get('borrowerPhone') || undefined,
    };

    const result = createBorrowerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (borrower) {
        await updateBorrower(borrower.id, data);
        toast.success('Prestatario actualizado');
      } else {
        await createBorrower(data);
        toast.success('Prestatario creado');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer position="top-right" />
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {borrower ? 'Editar Prestatario' : 'Nuevo Prestatario'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              name="borrowerFirstName"
              defaultValue={borrower?.borrowerFirstName}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.borrowerFirstName && <p className="text-red-500 text-sm mt-1">{errors.borrowerFirstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              name="borrowerLastName"
              defaultValue={borrower?.borrowerLastName || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="borrowerEmail"
              defaultValue={borrower?.borrowerEmail || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.borrowerEmail && <p className="text-red-500 text-sm mt-1">{errors.borrowerEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="tel"
              name="borrowerPhone"
              defaultValue={borrower?.borrowerPhone || ''}
              placeholder="+573001234567"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.borrowerPhone && <p className="text-red-500 text-sm mt-1">{errors.borrowerPhone}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-surface rounded-md hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowerFormModal;