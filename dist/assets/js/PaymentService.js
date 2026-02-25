import storage from './StorageService.js';
import installmentService from './InstallmentService.js';

class PaymentService {
    async getAll() {
        const items = await storage.getAll('payments');
        for (let item of items) {
            if (item.installmentId) {
                const numericId = typeof item.installmentId === 'string' ? parseInt(item.installmentId) : item.installmentId;
                item.installment = await storage.getById('installments', numericId);
                if (item.installment) {
                    const numericLoanId = typeof item.installment.loanId === 'string' ? parseInt(item.installment.loanId) : item.installment.loanId;
                    item.loan = await storage.getById('loans', numericLoanId);
                    if (item.loan) {
                        const numericClientId = typeof item.loan.clientId === 'string' ? parseInt(item.loan.clientId) : item.loan.clientId;
                        item.client = await storage.getById('clients', numericClientId);
                    }
                }
            }
        }
        return items;
    }

    async registerPayment(paymentData) {
        paymentData.createdAt = new Date().toISOString();

        // Ensure clientId is present for easy filtering in client view
        if (!paymentData.clientId && paymentData.installmentId) {
            const inst = await storage.getById('installments', paymentData.installmentId);
            if (inst) {
                const loan = await storage.getById('loans', inst.loanId);
                if (loan) {
                    paymentData.clientId = loan.clientId;
                }
            }
        }

        const id = await storage.add('payments', paymentData);

        // Update installment status
        if (paymentData.installmentId) {
            await installmentService.updateStatus(paymentData.installmentId, 'paga');
        }

        return id;
    }
}

const paymentService = new PaymentService();
export default paymentService;
