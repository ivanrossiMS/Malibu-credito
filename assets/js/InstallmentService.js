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
        return await storage.query('installments', 'loanid', loanId);
    }

    async updateStatus(id, status) {
        const item = await storage.getById('installments', id);
        if (!item) throw new Error("Parcela não encontrada.");
        item.status = status;

        // Strip paidAt as it's not a real column in installments (it belongs to payments) to prevent PGRST204
        delete item.paidAt;
        delete item.paid_at;

        await storage.put('installments', item);
        await loanService.checkAndUpdateLoanStatus(item.loanid || item.loanId); // Informa o contrato de que uma parcela evoluiu
        return item; // Ensure returning item is compatible if anything relies on returning value
    }

    async update(id, data) {
        const item = await storage.getById('installments', id);
        if (!item) throw new Error("Parcela não encontrada.");

        if (data.dueDate !== undefined) item.dueDate = data.dueDate;
        if (data.amount !== undefined) item.amount = data.amount;
        if (data.status !== undefined) item.status = data.status;

        // Strip paidAt as it's not a real column in installments (it belongs to payments) to prevent PGRST204
        delete item.paidAt;
        delete item.paid_at;

        await storage.put('installments', item);
        await loanService.checkAndUpdateLoanStatus(item.loanid || item.loanId);
        return item;
    }

    async updateProof(id, proof) {
        const item = await storage.getById('installments', id);
        if (!item) throw new Error("Parcela não encontrada.");
        item.proof = proof;
        return await storage.put('installments', item);
    }

    async queryByStatus(status) {
        return await storage.query('installments', 'status', status);
    }

    subscribe(clientId, callback) {
        // Subscribe to installments of the client's loans
        // Note: Supabase RLS will handle the filtering if configured.
        // For now we subscribe to the table and the UI filters.
        return storage.subscribe('installments', '*', (payload) => {
            callback(payload);
        });
    }
}

const installmentService = new InstallmentService();
export default installmentService;
