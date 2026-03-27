import { store } from './store.js';

export const initNotifications = () => {
    if (!("Notification" in window)) {
        console.warn("Este navegador no soporta notificaciones de escritorio");
        return;
    }

    if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    setInterval(() => checkDueToday(), 60000);
    setInterval(() => checkUpcomingPayments(), 3600000);
    
    checkDueToday();
    checkUpcomingPayments();
};

const checkDueToday = () => {
    const { loans } = store.getState();
    const today = new Date().toISOString().split('T')[0];
    let dueCount = 0;

    loans.forEach(loan => {
        (loan.schedule || []).forEach(p => {
            if (p.date === today && p.status === 'pendiente') {
                dueCount++;
            }
        });
    });

    if (dueCount > 0) {
        new Notification("Lender's HQ | Recordatorio de Cobro", {
            body: `Tienes ${dueCount} cobros pendientes para el día de hoy.`,
            icon: '/assets/icon.png'
        });
    }
};

const checkUpcomingPayments = () => {
    const { loans } = store.getState();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const upcomingPayments = [];
    
    loans.forEach(loan => {
        (loan.schedule || []).forEach(p => {
            if (p.status === 'pendiente') {
                const dueDate = new Date(p.date);
                dueDate.setHours(0, 0, 0, 0);
                
                if (dueDate > today && dueDate <= weekFromNow) {
                    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    upcomingPayments.push({
                        borrower: loan.borrowerName,
                        amount: p.totalPayment,
                        date: p.date,
                        daysUntil: daysUntil
                    });
                }
            }
        });
    });
    
    if (upcomingPayments.length > 0) {
        const sortedPayments = upcomingPayments.sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        const details = sortedPayments.slice(0, 3).map(p => 
            `${p.borrower}: ${p.daysUntil === 1 ? 'mañana' : `en ${p.daysUntil} días`}`
        ).join(', ');
        
        const message = upcomingPayments.length === 1 
            ? `${sortedPayments[0].borrower} debe pagar mañana.`
            : `Próximos cobros: ${details}${upcomingPayments.length > 3 ? ` y ${upcomingPayments.length - 3} más` : ''}.`;
        
        new Notification("Lender's HQ | Recordatorio Semanal", {
            body: message
        });
    }
};

export const getPaymentsDueToday = () => {
    const { loans } = store.getState();
    const today = new Date().toISOString().split('T')[0];
    const payments = [];
    
    loans.forEach(loan => {
        (loan.schedule || []).forEach(p => {
            if (p.date === today && p.status === 'pendiente') {
                payments.push({
                    loanId: loan.id,
                    borrower: loan.borrowerName,
                    ...p
                });
            }
        });
    });
    
    return payments;
};

export const getUpcomingPayments = (days = 7) => {
    const { loans } = store.getState();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    
    const payments = [];
    
    loans.forEach(loan => {
        (loan.schedule || []).forEach(p => {
            if (p.status === 'pendiente') {
                const dueDate = new Date(p.date);
                if (dueDate > today && dueDate <= futureDate) {
                    payments.push({
                        loanId: loan.id,
                        borrower: loan.borrowerName,
                        ...p
                    });
                }
            }
        });
    });
    
    return payments.sort((a, b) => new Date(a.date) - new Date(b.date));
};
