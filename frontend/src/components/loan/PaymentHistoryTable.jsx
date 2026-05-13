import { formatCurrency, formatDate } from '../../utils/loanCalculator';
import { isBefore, startOfDay } from 'date-fns';

const PaymentHistoryTable = ({ schedule, loanStatus, onMarkPaid, loading }) => {
  const today = startOfDay(new Date());

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Vencimiento</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capital</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interés</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {schedule.map((inst) => {
            const dueDate = startOfDay(new Date(inst.dueDate));
            const isOverdue = !inst.isPaid && isBefore(dueDate, today);
            const isPaid = inst.isPaid;

            return (
              <tr key={inst.installmentNumber} className={isOverdue ? 'bg-red-50' : ''}>
                <td className="px-4 py-3 text-sm">{inst.installmentNumber}</td>
                <td className="px-4 py-3 text-sm">
                  {formatDate(inst.dueDate)}
                  {isOverdue && <span className="ml-2 text-xs text-red-600">(Vencida)</span>}
                </td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(parseFloat(inst.principalAmount))}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(parseFloat(inst.interestAmount))}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(parseFloat(inst.totalAmount))}</td>
                <td className="px-4 py-3 text-center">
                  {isPaid ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Pagada
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Vencida
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {loanStatus !== 'PAID' && !isPaid && (
                    <button
                      onClick={() => onMarkPaid(inst.installmentNumber)}
                      disabled={loading}
                      className="text-sm bg-primary text-surface px-3 py-1 rounded hover:bg-primary/80 disabled:opacity-50"
                    >
                      Marcar Pagada
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;