import { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import useLoanStore from '../../stores/loanStore';
import useBorrowerStore from '../../stores/borrowerStore';
import { calculatePaymentSchedule, formatCurrency, formatDate } from '../../utils/loanCalculator';
import { createLoanSchema } from '../../utils/validators';

const CreateLoanModal = ({ onClose, onSuccess }) => {
  const { createLoan, loading } = useLoanStore();
  const { borrowers, fetchBorrowers } = useBorrowerStore();
  
  const [formData, setFormData] = useState({
    borrowerId: '',
    principalLoan: '',
    monthlyRate: '',
    loanScheme: 'FIXED_INSTALLMENT',
    totalMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
  });

  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const calculatePreview = useCallback(() => {
    const data = {
      borrowerId: formData.borrowerId,
      principalLoan: parseFloat(formData.principalLoan),
      monthlyRate: parseFloat(formData.monthlyRate),
      loanScheme: formData.loanScheme,
      totalMonths: parseInt(formData.totalMonths),
      startDate: formData.startDate,
    };

    const result = createLoanSchema.safeParse(data);
    if (result.success) {
      const schedule = calculatePaymentSchedule({
        principalLoan: data.principalLoan,
        monthlyRate: data.monthlyRate,
        loanScheme: data.loanScheme,
        totalMonths: data.totalMonths,
        startDate: data.startDate,
      });
      setPreview(schedule);
    } else {
      setPreview([]);
    }
  }, [formData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [calculatePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const data = {
      borrowerId: formData.borrowerId,
      principalLoan: parseFloat(formData.principalLoan),
      monthlyRate: parseFloat(formData.monthlyRate),
      loanScheme: formData.loanScheme,
      totalMonths: parseInt(formData.totalMonths),
      startDate: formData.startDate,
      ...(formData.maturityDate && { maturityDate: formData.maturityDate }),
    };

    const result = createLoanSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await createLoan(data);
      toast.success('Préstamo creado correctamente');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear préstamo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
      <ToastContainer position="top-right" />
      <div className="bg-surface-container rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <h2 className="text-xl font-bold mb-4 text-on-surface">Nuevo Préstamo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Prestatario *</label>
              <select
                name="borrowerId"
                value={formData.borrowerId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
              >
                <option value="">Seleccionar...</option>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.borrowerFirstName} {b.borrowerLastName}
                  </option>
                ))}
              </select>
              {errors.borrowerId && <p className="text-error text-sm mt-1">{errors.borrowerId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Monto *</label>
              <input
                type="number"
                name="principalLoan"
                value={formData.principalLoan}
                onChange={handleChange}
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
                placeholder="1000000"
              />
              {errors.principalLoan && <p className="text-error text-sm mt-1">{errors.principalLoan}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Tasa Mensual *</label>
              <input
                type="number"
                name="monthlyRate"
                value={formData.monthlyRate}
                onChange={handleChange}
                step="0.0001"
                min="0"
                max="1"
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
                placeholder="0.02"
              />
              {errors.monthlyRate && <p className="text-error text-sm mt-1">{errors.monthlyRate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Esquema *</label>
              <select
                name="loanScheme"
                value={formData.loanScheme}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
              >
                <option value="FIXED_INSTALLMENT">Cuota Fija</option>
                <option value="DECREASING_INSTALLMENT">Cuota Decreciente</option>
                <option value="NO_INTEREST">Sin Interés</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Meses *</label>
              <input
                type="number"
                name="totalMonths"
                value={formData.totalMonths}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
                placeholder="12"
              />
              {errors.totalMonths && <p className="text-error text-sm mt-1">{errors.totalMonths}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Fecha Inicio *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
              />
              {errors.startDate && <p className="text-error text-sm mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant">Fecha Vencimiento</label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-outline bg-surface-container-low text-on-surface rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant"
              />
            </div>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-on-surface">Vista Previa del Schedule</h3>
              <div className="max-h-60 overflow-y-auto border border-outline rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-surface-container-low sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-on-surface-variant">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-on-surface-variant">Fecha</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-on-surface-variant">Capital</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-on-surface-variant">Interés</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-on-surface-variant">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {preview.map((inst) => (
                      <tr key={inst.installmentNumber}>
                        <td className="px-3 py-2 text-sm text-on-surface">{inst.installmentNumber}</td>
                        <td className="px-3 py-2 text-sm text-on-surface">{formatDate(inst.dueDate)}</td>
                        <td className="px-3 py-2 text-sm text-on-surface text-right">{formatCurrency(inst.principalAmount)}</td>
                        <td className="px-3 py-2 text-sm text-on-surface text-right">{formatCurrency(inst.interestAmount)}</td>
                        <td className="px-3 py-2 text-sm text-on-surface text-right font-medium">{formatCurrency(inst.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || preview.length === 0}
              className="px-4 py-2 bg-primary text-surface rounded-md hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Préstamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLoanModal;