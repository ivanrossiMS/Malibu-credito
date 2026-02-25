import storage from './StorageService.js';

class LoanService {
    async getAll() {
        const loans = await storage.getAll('loans');
        // Enhance with client data
        for (let loan of loans) {
            loan.client = await storage.getById('clients', loan.clientId);
        }
        return loans;
    }

    async getById(id) {
        const loan = await storage.getById('loans', id);
        if (loan) {
            loan.client = await storage.getById('clients', loan.clientId);
            loan.installments = await storage.query('installments', 'loanId', id);
        }
        return loan;
    }

    async createLoan(loanData) {
        loanData.createdAt = new Date().toISOString();
        loanData.status = 'ativo';
        loanData.loanCode = await this.generateLoanCode();

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

        Object.assign(loan, updatedData);
        await storage.put('loans', loan);

        // Regenerate unpaid installments safely
        const allInstallments = await storage.query('installments', 'loanId', id);
        const existingPaid = allInstallments.filter(i => i.status === 'paga');

        // Remove pending installments
        for (let inst of allInstallments) {
            if (inst.status !== 'paga') {
                await storage.delete('installments', inst.id);
            }
        }

        // Generate full schedule
        const newInstallments = this.generateInstallments(id, loan);
        for (let inst of newInstallments) {
            // Only insert if it doesn't collide with an already paid installment number
            const isPaid = existingPaid.find(p => parseInt(p.number) === parseInt(inst.number));
            if (!isPaid) {
                await storage.add('installments', inst);
            }
        }
    }

    async generateLoanCode() {
        const loans = await storage.getAll('loans');
        const count = loans.length + 1;
        const date = new Date();
        const year = date.getFullYear().toString().substring(2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const sequence = count.toString().padStart(3, '0');
        return `MAL-${year}${month}-${sequence}`;
    }

    generateInstallments(loanId, data) {
        const installments = [];
        const startDate = new Date(data.startDate);

        for (let i = 1; i <= data.numInstallments; i++) {
            const dueDate = new Date(startDate);

            if (data.frequency === 'diario') {
                dueDate.setDate(startDate.getDate() + (i - 1));
            } else {
                // Default: Mensal
                dueDate.setMonth(startDate.getMonth() + (i - 1));
            }

            installments.push({
                loanId: loanId,
                number: i,
                amount: data.installmentValue,
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'pendente',
                createdAt: new Date().toISOString()
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
        const loan = await storage.getById('loans', loanId);
        if (!loan) return;

        const installments = await storage.query('installments', 'loanId', loanId);
        if (!installments || installments.length === 0) return;

        const today = new Date().toISOString().split('T')[0];

        // Auto-detect overdue installments
        for (let inst of installments) {
            if (inst.status === 'pendente' && inst.dueDate < today) {
                inst.status = 'atrasada';
                await storage.put('installments', inst);
            }
        }

        let allPaid = true;
        let hasOverdue = false;

        for (let inst of installments) {
            if (inst.status !== 'paga') allPaid = false;
            if (inst.status === 'atrasada') hasOverdue = true;
        }

        let newStatus = loan.status;
        if (allPaid) {
            newStatus = 'quitado';
        } else if (hasOverdue) {
            newStatus = 'atrasado';
        } else {
            if (loan.status === 'quitado' || loan.status === 'atrasado') {
                newStatus = 'ativo';
            }
        }

        if (loan.status !== newStatus) {
            loan.status = newStatus;
            await storage.put('loans', loan);
        }
    }

    async updateAllLoansStatus() {
        const loans = await storage.getAll('loans');
        for (let loan of loans) {
            if (loan.status !== 'quitado') {
                await this.checkAndUpdateLoanStatus(loan.id);
            }
        }
    }
}

const loanService = new LoanService();
export default loanService;
