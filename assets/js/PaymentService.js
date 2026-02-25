import storage from './StorageService.js';
import installmentService from './InstallmentService.js';

class PaymentService {
    async getAll() {
        // Query de 3º Grau: Pagamento -> Parcela -> Empréstimo -> Cliente. Resolvido pelo Supabase em 1 único passe.
        const items = await storage.getAdvanced('payments', {
            select: '*, installment:installments(*, loan:loans(*, client:clients(*)))'
        });

        // Achatar os objetos para manter a reatividade da casca original
        for (let item of items) {
            if (item.installment && item.installment.loan) {
                item.loan = item.installment.loan;
                if (item.installment.loan.client) {
                    item.client = item.installment.loan.client;
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
