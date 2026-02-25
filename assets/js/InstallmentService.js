import storage from './StorageService.js';
import loanService from './LoanService.js';

class InstallmentService {
    async getAll() {
        // Usa as chaves estrangeiras (`loan:loans(*, client:clients(*))`) para auto-preencher os dados vinculados numa query atômica.
        if (typeof loanService.updateAllLoansStatus === 'function') {
            await loanService.updateAllLoansStatus(); // Safe-guard call
        }
        const items = await storage.getAdvanced('installments', {
            select: '*, loan:loans(*, client:clients(*))'
        });
        for (let item of items) {
            // Compatibilidade Reversa com antigas props independentes (espalmando árvore json pro root)
            if (item.loan && item.loan.client) {
                item.client = item.loan.client;
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
