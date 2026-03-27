/**
 * Cuota Decreciente (Abono a Capital Fijo + Interés sobre Saldo)
 * Las cuotas disminuyen progresivamente porque el interés se calcula
 * sobre el saldo pendiente, no sobre el capital inicial.
 * 
 * Ejemplo: Préstamo 1,000,000, 15% mensual, 5 cuotas
 * - Cuota 1: 200,000 + 150,000 = 350,000
 * - Cuota 2: 200,000 + 120,000 = 320,000
 * - Cuota 3: 200,000 +  90,000 = 290,000
 */

export const calculateLoanSchedule = (principal, monthlyInterestRate, numPayments, startDate) => {
    const rate = monthlyInterestRate / 100;
    const fixedPrincipalPayment = principal / numPayments;
    let remainingBalance = principal;
    const schedule = [];

    const currentDate = new Date(startDate);

    for (let i = 1; i <= numPayments; i++) {
        const interestPayment = remainingBalance * rate;
        const totalInstallment = fixedPrincipalPayment + interestPayment;
        
        remainingBalance -= fixedPrincipalPayment;
        
        // Ensure balance doesn't show negative due to floating point
        const displayBalance = Math.max(0, remainingBalance);

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);

        schedule.push({
            installmentNumber: i,
            date: new Date(currentDate).toISOString().split('T')[0],
            principalPayment: Math.round(fixedPrincipalPayment * 100) / 100,
            interestPayment: Math.round(interestPayment * 100) / 100,
            totalPayment: Math.round(totalInstallment * 100) / 100,
            remainingBalance: Math.round(displayBalance * 100) / 100,
            status: 'pendiente'
        });
    }

    return schedule;
};

/**
 * Cuota Fija (Interés sobre Saldo Inicial / Flat)
 * Todas las cuotas son iguales porque el interés se calcula
 * una sola vez sobre el capital inicial y se reparte en cuotas iguales.
 * 
 * Ejemplo: Préstamo 1,000,000, 15% mensual, 5 cuotas
 * - Interés total: 1,000,000 * 15% * 5 = 750,000
 * - Interés mensual: 750,000 / 5 = 150,000
 * - Cuota 1-5: 200,000 + 150,000 = 350,000 (constante)
 */
export const calculateFlatLoanSchedule = (principal, monthlyInterestRate, numPayments, startDate) => {
    const rate = monthlyInterestRate / 100;
    const fixedInterestPayment = principal * rate;
    const fixedPrincipalPayment = principal / numPayments;
    const totalInstallment = fixedPrincipalPayment + fixedInterestPayment;
    
    let remainingBalance = principal;
    const schedule = [];
    const currentDate = new Date(startDate);

    for (let i = 1; i <= numPayments; i++) {
        remainingBalance -= fixedPrincipalPayment;
        const displayBalance = Math.max(0, remainingBalance);
        currentDate.setMonth(currentDate.getMonth() + 1);

        schedule.push({
            installmentNumber: i,
            date: new Date(currentDate).toISOString().split('T')[0],
            principalPayment: Math.round(fixedPrincipalPayment * 100) / 100,
            interestPayment: Math.round(fixedInterestPayment * 100) / 100,
            totalPayment: Math.round(totalInstallment * 100) / 100,
            remainingBalance: Math.round(displayBalance * 100) / 100,
            status: 'pendiente'
        });
    }

    return schedule;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Cruza el historial de pagos de un préstamo con su cronograma (schedule)
 * para definir si cada cuota ha sido completada, está pendiente o en mora.
 */
export const calculateScheduleStatus = (loan) => {
    // Copia profunda para no mutar el modelo original sin querer
    const schedule = JSON.parse(JSON.stringify(loan.schedule || []));
    const payments = loan.paymentsHistory || [];
    
    // Suma de pagos realizados
    let totalPaidCapital = payments.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
    let totalPaidInterest = payments.reduce((acc, p) => acc + (parseFloat(p.interest) || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i];
        
        // Tolerancia a pequeños errores de coma flotante
        const epsilon = 0.01;
        
        const expectedCapital = parseFloat(item.principalPayment);
        const expectedInterest = parseFloat(item.interestPayment);
        
        let isCapitalPaid = false;
        let isInterestPaid = false;

        if (totalPaidCapital >= expectedCapital - epsilon) {
            totalPaidCapital -= expectedCapital;
            isCapitalPaid = true;
        } else {
             totalPaidCapital = 0;
        }

        if (totalPaidInterest >= expectedInterest - epsilon) {
            totalPaidInterest -= expectedInterest;
            isInterestPaid = true;
        } else {
             totalPaidInterest = 0;
        }
        
        if (isCapitalPaid && isInterestPaid) {
            item.status = 'pagada';
        } else {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            
            if (itemDate < today) {
                item.status = 'mora';
            } else {
                item.status = 'pendiente';
            }
        }
    }
    
    return schedule;
};
