import storage from './StorageService.js';
import loanService from './LoanService.js';

class InstallmentService {
    async getAll() {
        await loanService.updateAllLoansStatus(); // Force status check globally
        const items = await storage.getAll('installments');
        for (let item of items) {
            item.loan = await storage.getById('loans', item.loanId);
            if (item.loan) {
                item.client = await storage.getById('clients', item.loan.clientId);
            }
        }
        return items;
    }

    async getByLoan(loanId) {
        return await storage.query('installments', 'loanId', loanId);
    }

    async updateStatus(id, status) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        const item = await storage.getById('installments', numericId);
        if (!item) throw new Error("Parcela não encontrada.");
        item.status = status;
        if (status === 'paga') {
            item.paidAt = new Date().toISOString();
        }
        await storage.put('installments', item);
        await loanService.checkAndUpdateLoanStatus(item.loanId); // Informa o contrato de que uma parcela evoluiu
        return item; // Ensure returning item is compatible if anything relies on returning value
    }

    async update(id, data) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        const item = await storage.getById('installments', numericId);
        if (!item) throw new Error("Parcela não encontrada.");

        if (data.dueDate !== undefined) item.dueDate = data.dueDate;
        if (data.amount !== undefined) item.amount = data.amount;
        if (data.status !== undefined) item.status = data.status;

        if (item.status === 'paga' && !item.paidAt) {
            item.paidAt = new Date().toISOString();
        }

        await storage.put('installments', item);
        await loanService.checkAndUpdateLoanStatus(item.loanId);
        return item;
    }

    async updateProof(id, proof) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        const item = await storage.getById('installments', numericId);
        if (!item) throw new Error("Parcela não encontrada.");
        item.proof = proof;
        return await storage.put('installments', item);
    }

    async queryByStatus(status) {
        return await storage.query('installments', 'status', status);
    }
}

const installmentService = new InstallmentService();
export default installmentService;
