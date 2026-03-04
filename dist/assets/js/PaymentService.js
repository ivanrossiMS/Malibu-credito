import storage from './StorageService.js';
import installmentService from './InstallmentService.js';
import DateHelper from './DateHelper.js';

class PaymentService {
    async getAll() {
        // Query de 3º Grau: Pagamento -> Parcela -> Empréstimo -> Cliente. Resolvido pelo Supabase em 1 único passe.
        const items = await storage.getAdvanced('payments', {
            select: '*, installment:installments(*, loan:loans!loanid(*, client:clients(*)))'
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
        paymentData.createdAt = paymentData.createdAt || new Date().toISOString();
        paymentData.paymentDate = paymentData.paymentDate || DateHelper.toLocalYYYYMMDD(paymentData.createdAt);

        // Ensure clientId and company_id is present for easy filtering and RLS
        if (paymentData.installmentId && (!paymentData.clientId || !paymentData.company_id)) {
            const inst = await storage.getById('installments', paymentData.installmentId);
            if (inst) {
                const refLoanId = inst.loanid || inst.loanId;
                if (!paymentData.company_id) {
                    paymentData.company_id = inst.company_id || inst.companyId;
                }

                if (refLoanId && !paymentData.clientId) {
                    const loan = await storage.getById('loans', refLoanId);
                    if (loan) {
                        paymentData.clientId = loan.clientId || loan.clientid;
                        if (!paymentData.company_id) {
                            paymentData.company_id = loan.company_id || loan.companyId;
                        }
                    }
                }
            }
        }

        // Sanitização de colunas inexistentes no DB (Evita PGRST204)
        if (paymentData.notes) {
            delete paymentData.notes;
        }

        const id = await storage.add('payments', paymentData);

        // Update installment status
        if (paymentData.installmentId) {
            await installmentService.updateStatus(paymentData.installmentId, 'PAID');
        }

        return id;
    }
}

const paymentService = new PaymentService();
export default paymentService;
