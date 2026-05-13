import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import useBorrowerStore from '../stores/borrowerStore';
import { downloadPortfolioReport, downloadBorrowerReport } from '../services/exportService';

const Reports = () => {
  const { borrowers, fetchBorrowers } = useBorrowerStore();
  const [loading, setLoading] = useState(false);

  const handleDownloadPortfolio = async (format) => {
    setLoading(true);
    try {
      await downloadPortfolioReport(format);
      toast.success(`Reporte de cartera descargado en ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBorrower = async (borrowerId, format) => {
    setLoading(true);
    try {
      await downloadBorrowerReport(borrowerId, format);
      toast.success(`Reporte de prestatario descargado en ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al descargar reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Reportes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reporte de Cartera</h2>
          <p className="text-gray-600 text-sm mb-4">
            Descarga un reporte completo de todos los préstamos en tu cartera.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadPortfolio('csv')}
              disabled={loading}
              className="flex-1 bg-primary text-surface py-2 px-4 rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              CSV
            </button>
            <button
              onClick={() => handleDownloadPortfolio('xlsx')}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Excel
            </button>
          </div>
        </div>

        <div className="bg-surface-container rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reportes por Prestatario</h2>
          <p className="text-gray-600 text-sm mb-4">
            Descarga el historial de préstamos de un prestatario específico.
          </p>
          <div className="space-y-3">
            <select
              id="borrowerSelect"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => {
                if (e.target.value) fetchBorrowers();
              }}
            >
              <option value="">Seleccionar prestatario...</option>
              <option value="load">Cargar prestatarios...</option>
            </select>

            {borrowers.length > 0 && (
              <select
                id="borrowerId"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar prestatario...</option>
                {borrowers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.borrowerFirstName} {b.borrowerLastName}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const select = document.getElementById('borrowerId');
                  if (select?.value) handleDownloadBorrower(select.value, 'csv');
                }}
                disabled={loading || borrowers.length === 0}
                className="flex-1 bg-primary text-surface py-2 px-4 rounded-lg hover:bg-primary/80 disabled:opacity-50"
              >
                CSV
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('borrowerId');
                  if (select?.value) handleDownloadBorrower(select.value, 'xlsx');
                }}
                disabled={loading || borrowers.length === 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;