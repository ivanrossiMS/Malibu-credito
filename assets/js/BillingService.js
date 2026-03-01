import storage from './StorageService.js';
import DateHelper from './DateHelper.js';

class BillingService {
    constructor() {
        this.INSTALLMENT_AMOUNT = 10.00;
        this.DUE_DAY = 10;
    }

    /**
     * Gera parcelas para um usuário ADMIN se necessário.
     * Regra: Uma parcela por mês, vencimento todo dia 10.
     * O ciclo começa no first_access_at.
     */
    async generateMissingInstallments(user) {
        if (!user || (user.role !== 'admin' && user.role !== 'ADMIN')) return;
        if (!user.firstAccessAt) return;

        const firstAccess = DateHelper.getLocalDate(user.firstAccessAt);
        const now = new Date();

        // Iterar desde o mês do primeiro acesso até o mês atual + 1 (para garantir a próxima)
        let currentIter = new Date(firstAccess.getFullYear(), firstAccess.getMonth(), 1);
        const endIter = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const installments = await storage.query('billing_installments', 'userId', user.id);
        const existingMonths = installments.map(i => i.competenceMonth);

        while (currentIter <= endIter) {
            const competenceMonth = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}`;

            if (!existingMonths.includes(competenceMonth)) {
                const dueDate = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}-${String(this.DUE_DAY).padStart(2, '0')}`;

                await storage.add('billing_installments', {
                    userId: user.id,
                    competenceMonth: competenceMonth,
                    dueDate: dueDate,
                    amount: this.INSTALLMENT_AMOUNT,
                    status: 'A_VENCER',
                    createdAt: new Date().toISOString()
                });
                console.log(`Billing: Created installment for ${competenceMonth} (Admin: ${user.email})`);
            }

            currentIter.setMonth(currentIter.getMonth() + 1);
        }

        await this.syncInstallmentStatuses(user.id);
    }

    /**
     * Atualiza o status das parcelas (A_VENCER -> VENCIDA) baseado na data atual.
     */
    async syncInstallmentStatuses(userId) {
        const installments = await storage.query('billing_installments', 'userId', userId);
        const todayStr = DateHelper.getTodayStr();

        for (const inst of installments) {
            let newStatus = inst.status;

            if (inst.status !== 'PAGA') {
                if (inst.dueDate < todayStr) {
                    newStatus = 'VENCIDA';
                } else {
                    newStatus = 'A_VENCER';
                }
            }

            if (newStatus !== inst.status) {
                await storage.put('billing_installments', {
                    ...inst,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Verifica se o usuário possui alguma parcela vencida.
     */
    async hasOverdueInstallment(userId) {
        await this.syncInstallmentStatuses(userId);
        const installments = await storage.query('billing_installments', 'userId', userId);
        return installments.some(i => i.status === 'VENCIDA');
    }

    /**
     * Retorna todas as mensalidades de um usuário.
     */
    async getUserInstallments(userId) {
        return await storage.getAdvanced('billing_installments', {
            eq: { userId: userId },
            order: { column: 'dueDate', ascending: false }
        });
    }

    /**
     * Marca uma parcela como paga.
     */
    async markAsPaid(installmentId) {
        const inst = await storage.getById('billing_installments', installmentId);
        if (!inst) return;

        await storage.put('billing_installments', {
            ...inst,
            status: 'PAGA',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Desfaz um pagamento.
     */
    async undoPayment(installmentId) {
        const inst = await storage.getById('billing_installments', installmentId);
        if (!inst) return;

        await storage.put('billing_installments', {
            ...inst,
            status: 'A_VENCER', // Será corrigido pelo sync se estiver vencida
            paidAt: null,
            updatedAt: new Date().toISOString()
        });

        await this.syncInstallmentStatuses(inst.userId);
    }
}

const billingService = new BillingService();
export default billingService;
