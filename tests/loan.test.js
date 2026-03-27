import { describe, it, expect } from 'vitest';
import { calculateLoanSchedule, calculateFlatLoanSchedule, calculateScheduleStatus } from '../client/js/utils/calculations.js';

describe('Cuota Decreciente (Abono Capital Fijo + Interés sobre Saldo)', () => {
    it('should calculate decreasing installment schedule correctly - user example', () => {
        const principal = 1000000;
        const interest = 15; // 15% MENSUAL (directo, no anual)
        const payments = 5;
        const startDate = '2024-01-01';

        const schedule = calculateLoanSchedule(principal, interest, payments, startDate);

        expect(schedule).toHaveLength(5);
        
        // Abono capital fijo = 1,000,000 / 5 = 200,000
        expect(schedule[0].principalPayment).toBe(200000);
        expect(schedule[1].principalPayment).toBe(200000);
        expect(schedule[2].principalPayment).toBe(200000);
        expect(schedule[3].principalPayment).toBe(200000);
        expect(schedule[4].principalPayment).toBe(200000);

        // Cuota 1: 200,000 + (1,000,000 * 0.15) = 200,000 + 150,000 = 350,000
        expect(schedule[0].interestPayment).toBe(150000);
        expect(schedule[0].totalPayment).toBe(350000);

        // Cuota 2: 200,000 + (800,000 * 0.15) = 200,000 + 120,000 = 320,000
        expect(schedule[1].interestPayment).toBe(120000);
        expect(schedule[1].totalPayment).toBe(320000);

        // Cuota 3: 200,000 + (600,000 * 0.15) = 200,000 + 90,000 = 290,000
        expect(schedule[2].interestPayment).toBe(90000);
        expect(schedule[2].totalPayment).toBe(290000);

        // Cuota 4: 200,000 + (400,000 * 0.15) = 200,000 + 60,000 = 260,000
        expect(schedule[3].interestPayment).toBe(60000);
        expect(schedule[3].totalPayment).toBe(260000);

        // Cuota 5: 200,000 + (200,000 * 0.15) = 200,000 + 30,000 = 230,000
        expect(schedule[4].interestPayment).toBe(30000);
        expect(schedule[4].totalPayment).toBe(230000);

        // Saldo final debe ser 0
        expect(schedule[4].remainingBalance).toBe(0);
    });

    it('should verify total interest matches expected sum', () => {
        const principal = 1000000;
        const interest = 15;
        const payments = 5;
        const startDate = '2024-01-01';

        const schedule = calculateLoanSchedule(principal, interest, payments, startDate);

        // Suma de intereses: 150000 + 120000 + 90000 + 60000 + 30000 = 450,000
        const totalInterest = schedule.reduce((sum, p) => sum + p.interestPayment, 0);
        expect(totalInterest).toBe(450000);

        // Suma total pagada = 1,000,000 + 450,000 = 1,450,000
        const totalPaid = schedule.reduce((sum, p) => sum + p.totalPayment, 0);
        expect(totalPaid).toBe(1450000);
    });

    it('should generate correct dates for monthly installments', () => {
        const principal = 1000000;
        const interest = 15;
        const payments = 3;
        const startDate = '2024-03-15';

        const schedule = calculateLoanSchedule(principal, interest, payments, startDate);

        expect(schedule[0].date).toBe('2024-04-15');
        expect(schedule[1].date).toBe('2024-05-15');
        expect(schedule[2].date).toBe('2024-06-15');
    });
});

describe('Cuota Fija (Interés sobre Saldo Inicial)', () => {
    it('should calculate flat interest schedule correctly', () => {
        const principal = 1000000;
        const interest = 15; // 15% MENSUAL
        const payments = 5;
        const startDate = '2024-01-01';

        const schedule = calculateFlatLoanSchedule(principal, interest, payments, startDate);

        expect(schedule).toHaveLength(5);
        
        // Abono capital fijo = 1,000,000 / 5 = 200,000
        expect(schedule[0].principalPayment).toBe(200000);
        
        // Interés fijo = 1,000,000 * 0.15 = 150,000 (constante cada mes)
        expect(schedule[0].interestPayment).toBe(150000);
        expect(schedule[1].interestPayment).toBe(150000);
        expect(schedule[2].interestPayment).toBe(150000);
        expect(schedule[3].interestPayment).toBe(150000);
        expect(schedule[4].interestPayment).toBe(150000);

        // Cuota fija = 200,000 + 150,000 = 350,000 (constante)
        expect(schedule[0].totalPayment).toBe(350000);
        expect(schedule[4].totalPayment).toBe(350000);

        // Saldo final debe ser 0
        expect(schedule[4].remainingBalance).toBe(0);
    });
});

describe('Sin Intereses', () => {
    it('should calculate interest-free schedule correctly', () => {
        const principal = 1000000;
        const interest = 0;
        const payments = 5;
        const startDate = '2024-01-01';

        const schedule = calculateFlatLoanSchedule(principal, interest, payments, startDate);

        expect(schedule).toHaveLength(5);
        
        // Cada cuota = 1,000,000 / 5 = 200,000
        expect(schedule[0].totalPayment).toBe(200000);
        expect(schedule[4].totalPayment).toBe(200000);
        
        // Sin intereses
        expect(schedule[0].interestPayment).toBe(0);
        
        // Saldo final debe ser 0
        expect(schedule[4].remainingBalance).toBe(0);
    });
});

describe('Mora Calculations', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const longAgo = new Date(Date.now() - 86400000 * 40).toISOString().split('T')[0];

    it('should mark future installments as pending', () => {
        const loan = {
            startDate: today,
            amount: 1000,
            payments: 1,
            paymentsHistory: [],
            schedule: calculateLoanSchedule(1000, 15, 1, today) // Cuota en 1 mes
        };

        const result = calculateScheduleStatus(loan);
        expect(result[0].status).toBe('pendiente');
    });

    it('should mark unpaid past installments as mora', () => {
        const loan = {
            startDate: longAgo,
            amount: 1000,
            payments: 1,
            paymentsHistory: [],
            schedule: calculateLoanSchedule(1000, 15, 1, longAgo) // Venció hace 10 días aprox
        };

        const result = calculateScheduleStatus(loan);
        expect(result[0].status).toBe('mora');
    });

    it('should mark paid past installments as pagada', () => {
        const loan = {
            startDate: longAgo,
            amount: 1000,
            payments: 1,
            paymentsHistory: [
                { capital: 1000, interest: 150, date: yesterday }
            ],
            schedule: calculateLoanSchedule(1000, 15, 1, longAgo)
        };

        const result = calculateScheduleStatus(loan);
        expect(result[0].status).toBe('pagada');
    });
});
