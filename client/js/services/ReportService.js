import { formatCurrency } from '../utils/calculations.js';

export class ReportService {
    /**
     * Descarga un archivo CSV genérico usando Blob para mayor compatibilidad
     */
    static downloadCSV(rows, filename) {
        // Usamos punto y coma (;) como separador para mejor compatibilidad con Excel en español
        const separator = ';';
        
        // Función para limpiar y escapar valores
        const formatValue = (val) => {
            if (val === null || val === undefined) return '';
            let stringVal = String(val);
            // Si el valor contiene el separador o saltos de línea, lo envolvemos en comillas
            if (stringVal.includes(separator) || stringVal.includes('\n') || stringVal.includes('"')) {
                stringVal = `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        };

        const csvRows = rows.map(row => row.map(formatValue).join(separator));
        const csvContent = "\uFEFF" + csvRows.join("\n"); // BOM para caracteres especiales
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Genera un reporte de la cartera completa
     */
    static generatePortfolioReport(loans = []) {
        const headers = [
            "Referencia", 
            "Prestatario", 
            "Email", 
            "Telefono", 
            "Monto Prestado", 
            "Interes (%)", 
            "Estado", 
            "Fecha Inicio", 
            "Capital Pagado", 
            "Intereses Pagados", 
            "Total Recaudado", 
            "Capital Pendiente"
        ];
        
        const rows = loans.map(loan => {
            const history = loan.paymentsHistory || [];
            const totalPaidInterest = history.reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
            const totalPaidCapital = history.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
            const pendingCapital = (parseFloat(loan.amount) || 0) - totalPaidCapital;
            const totalCollected = totalPaidInterest + totalPaidCapital;

            return [
                `#${loan.referenceId || (loan.id ? loan.id.slice(-6) : 'N/A')}`,
                loan.borrowerName || 'Sin Nombre',
                loan.email || '',
                loan.phone || '',
                loan.amount || 0,
                loan.interest || 0,
                (loan.status || 'Desconocido').toUpperCase(),
                loan.startDate || '',
                totalPaidCapital,
                totalPaidInterest,
                totalCollected,
                pendingCapital
            ];
        });

        this.downloadCSV([headers, ...rows], `Reporte_Cartera_${new Date().toISOString().split('T')[0]}.csv`);
    }

    /**
     * Genera un reporte detallado de un prestatario específico
     */
    static generateBorrowerHistoryReport(loan) {
        if (!loan) return;

        const headers = ["Fecha", "Concepto", "Abono Capital", "Abono Interes", "Total Transaccion"];
        const history = loan.paymentsHistory || [];
        
        const rows = history.map(p => [
            p.date || '',
            "Pago registrado",
            parseFloat(p.capital) || 0,
            parseFloat(p.interest) || 0,
            (parseFloat(p.capital) || 0) + (parseFloat(p.interest) || 0)
        ]);

        const totalPaidInterest = history.reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
        const totalPaidCapital = history.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
        const pendingCapital = (parseFloat(loan.amount) || 0) - totalPaidCapital;

        const summaryData = [
            [],
            ["RESUMEN FINANCIERO", "", "", "", ""],
            ["Total Prestado", loan.amount || 0, "", "", ""],
            ["Tasa de Interes", `${loan.interest || 0}%`, "", "", ""],
            ["Capital Ya Recaudado", totalPaidCapital, "", "", ""],
            ["Intereses Ya Recaudados", totalPaidInterest, "", "", ""],
            ["Total Cobrado a la fecha", totalPaidCapital + totalPaidInterest, "", "", ""],
            ["Saldo Pendiente de Capital", pendingCapital, "", "", ""]
        ];

        this.downloadCSV([
            ["ESTADO DE CUENTA INDIVIDUAL", "", "", "", ""],
            ["Prestatario", loan.borrowerName || 'Sin Nombre', "", "", ""],
            ["Referencia", `#${loan.referenceId || (loan.id ? loan.id.slice(-6) : 'N/A')}`, "", "", ""],
            ["Fecha de Generacion", new Date().toLocaleString(), "", "", ""],
            [],
            headers,
            ...rows,
            ...summaryData
        ], `Reporte_${(loan.borrowerName || 'cliente').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    }

    /**
     * Genera un reporte detallado de un prestatario que incluye todos sus préstamos
     */
    static generateBorrowerComprehensiveReport(borrowerName, allLoans) {
        if (!borrowerName) return;

        const borrowerLoans = allLoans.filter(l => l.borrowerName === borrowerName);
        
        if (borrowerLoans.length === 0) return;

        const headers = ["Referencia", "Monto Prestado", "Intereses Pagados", "Capital Pagado", "Estado"];
        
        const rows = borrowerLoans.map(loan => {
            const history = loan.paymentsHistory || [];
            const interestPaid = history.reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
            const capitalPaid = history.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
            
            let statusLabel = 'ACTIVO';
            if (loan.status === 'completed') statusLabel = 'PAGADO';
            if (loan.status === 'mora') statusLabel = 'EN MORA';

            return [
                `#${loan.referenceId || (loan.id ? loan.id.slice(-6) : 'N/A')}`,
                loan.amount || 0,
                interestPaid,
                capitalPaid,
                statusLabel
            ];
        });

        const totalBorrowed = borrowerLoans.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0);
        const totalInterest = borrowerLoans.reduce((acc, l) => {
            return acc + (l.paymentsHistory || []).reduce((pAcc, p) => pAcc + (parseFloat(p.interest) || 0), 0);
        }, 0);

        this.downloadCSV([
            ["REPORTE HISTORICO DEL PRESTATARIO", ""],
            ["NOMBRE DEL PRESTATARIO", borrowerName],
            ["FECHA GENERACION", new Date().toLocaleString()],
            [],
            headers,
            ...rows,
            [],
            ["TOTALES GENERALES", totalBorrowed, totalInterest, "", ""]
        ], `Reporte_Historial_${borrowerName.replace(/\s+/g, '_')}.csv`);
    }
}

