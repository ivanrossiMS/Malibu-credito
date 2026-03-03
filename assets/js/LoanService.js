import storage from './StorageService.js';
import DateHelper from './DateHelper.js';

class LoanService {
    async getAll() {
        return await storage.getAdvanced('loans', { select: '*, client:clients(*)' });
    }

    async getById(id) {
        const result = await storage.getAdvanced('loans', { select: '*, client:clients(*)', eq: { id: id }, limit: 1 });
        const loan = result.length > 0 ? result[0] : null;
        if (loan) {
            // Installments podem não possuir FK direta clara com Loans para a View Atual, manter query simples.
            loan.installments = await storage.query('installments', 'loanid', id);
        }
        return loan;
    }

    async createLoan(loanData) {
        loanData.createdAt = new Date().toISOString();
        loanData.status = 'ATIVO';
        loanData.loanCode = await this.generateLoanCode();

        // Explicit fallback for common naming variations
        loanData.clientid = loanData.clientid || loanData.clientId || loanData.client_id;
        delete loanData.clientId;
        delete loanData.client_id;

        const loanId = await storage.add('loans', loanData);

        // Generate installments
        const installments = this.generateInstallments(loanId, loanData);
        for (let inst of installments) {
            await storage.add('installments', inst);
        }

        return loanId;
    }

    async updateLoan(id, updatedData) {
        const loan = await storage.getById('loans', id);
        if (!loan) throw new Error("Empréstimo não encontrado.");

        // Fallback for naming variations
        updatedData.clientid = updatedData.clientid || updatedData.clientId || updatedData.client_id;
        delete updatedData.clientId;
        delete updatedData.client_id;

        Object.assign(loan, updatedData);
        await storage.put('loans', loan);

        // Efficiently update installments instead of full regeneration
        const newInstallmentSchedule = this.generateInstallments(id, loan);

        // Filter out those that are already paid logic
        const existingInstallments = await storage.query('installments', 'loanid', id);

        // Process each installment in the new schedule
        for (let newInst of newInstallmentSchedule) {
            const existing = existingInstallments.find(e => parseInt(e.number) === parseInt(newInst.number));

            if (existing) {
                const s = String(existing.status || '').toUpperCase();
                const isPaid = s === 'PAID' || s === 'PAGA' || s === 'PAGO' || s === 'QUITADO';

                if (!isPaid) {
                    // Update existing unpaid installment
                    const updatedInst = { ...existing, ...newInst };
                    await storage.put('installments', updatedInst);
                }
            } else {
                // Add new installment if it doesn't exist
                await storage.add('installments', newInst);
            }
        }

        // Cleanup: remove installments that are beyond the new numInstallments count and NOT paid
        const newMaxNumber = parseInt(loan.numInstallments);
        const toDelete = existingInstallments.filter(e => {
            const num = parseInt(e.number);
            const s = String(e.status || '').toUpperCase();
            const isPaid = s === 'PAID' || s === 'PAGA' || s === 'PAGO' || s === 'QUITADO';
            return num > newMaxNumber && !isPaid;
        });

        for (let inst of toDelete) {
            await storage.delete('installments', inst.id);
        }
    }

    async generateLoanCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return `MAL-${result}`;
    }

    generateInstallments(loanId, data) {
        const installments = [];
        const startDate = DateHelper.getLocalDate(data.startDate);

        for (let i = 1; i <= data.numInstallments; i++) {
            const dueDate = DateHelper.getLocalDate(DateHelper.toLocalYYYYMMDD(startDate));

            if (data.frequency === 'diario') {
                dueDate.setDate(startDate.getDate() + (i - 1));
            } else if (data.frequency === 'semanal') {
                dueDate.setDate(startDate.getDate() + (i - 1) * 7);
            } else {
                // Default: Mensal
                dueDate.setMonth(startDate.getMonth() + (i - 1));
            }

            installments.push({
                loanid: loanId,
                number: i,
                amount: data.installmentValue || data.amount,
                due_date: DateHelper.toLocalYYYYMMDD(dueDate),
                status: 'PENDING',
                installmentCode: `${data.loanCode || 'MAL'}-${i}`
            });
        }

        return installments;
    }

    async updateStatus(id, status) {
        const loan = await storage.getById('loans', id);
        loan.status = status;
        return await storage.put('loans', loan);
    }

    async checkAndUpdateLoanStatus(loanId) {
        if (!auth.isAdmin()) return; // Non-admins shouldn't trigger DB status updates
        if (!loanId || loanId === 'undefined' || loanId === 'null') return;
        const loan = await storage.getById('loans', loanId);
        if (!loan) return;

        const installments = await storage.query('installments', 'loanid', loanId);
        if (!installments || installments.length === 0) return;

        const today = DateHelper.getTodayStr();

        // Auto-detect overdue installments
        for (let inst of installments) {
            if (inst.status === 'PENDING' && DateHelper.isPast(inst.dueDate)) {
                inst.status = 'OVERDUE';
                await storage.put('installments', inst);
            }
        }

        let allPaid = true;
        let hasOverdue = false;

        for (let inst of installments) {
            if (inst.status !== 'PAID') allPaid = false;
            if (inst.status === 'OVERDUE') hasOverdue = true;
        }

        let newStatus = loan.status;
        if (allPaid) {
            newStatus = 'PAID';
        } else if (hasOverdue) {
            newStatus = 'OVERDUE';
        } else {
            if (loan.status === 'PAID' || loan.status === 'OVERDUE') {
                newStatus = 'ACTIVE';
            }
        }

        if (loan.status !== newStatus) {
            loan.status = newStatus;
            await storage.put('loans', loan);
        }
    }

    async deleteLoan(id) {
        // 1. Get all installments
        const installments = await storage.query('installments', 'loanid', id);

        // 2. Delete all records in cascade (Payments -> Installments -> Loan)
        for (let inst of installments) {
            // Delete payments linked to this installment
            const payments = await storage.query('payments', 'installmentid', inst.id);
            for (let pay of payments) {
                await storage.delete('payments', pay.id);
            }
            // Delete the installment
            await storage.delete('installments', inst.id);
        }

        // 3. Delete the loan record
        return await storage.delete('loans', id);
    }

    async updateAllLoansStatus() {
        const loans = await storage.getAll('loans');
        for (let loan of loans) {
            const s = String(loan.status || '').toLowerCase();
            if (s !== 'quitado' && s !== 'paid') {
                await this.checkAndUpdateLoanStatus(loan.id);
            }
        }
    }
}

const loanService = new LoanService();
export default loanService;
