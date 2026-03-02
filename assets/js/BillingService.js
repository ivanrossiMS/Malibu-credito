import storage from './StorageService.js';
import DateHelper from './DateHelper.js';

class BillingService {
    constructor() {
        this.INSTALLMENT_AMOUNT = 10.00;
        this.DUE_DAY = 10;
    }

    /**
     * Gera uma quantidade específica de parcelas para um usuário.
     * Começa a partir da última parcela existente ou do mês atual.
     */
    async generateMonthlyInstallments(user, count = 1) {
        if (!user) return;

        // Buscar parcelas existentes para encontrar o ponto de partida
        const installments = await this.getUserInstallments(user.id);
        let startDate;

        if (installments.length > 0) {
            // Pegar a competência da última parcela (ordenada por data decrescente no getUserInstallments)
            const latest = installments[0];
            const [year, month] = latest.competenceMonth.split('-').map(Number);
            startDate = new Date(year, month, 1); // Próximo mês
        } else {
            // Se não tem nada, começa no mês atual
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        for (let i = 0; i < count; i++) {
            const currentIter = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const competenceMonth = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}`;
            const dueDate = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}-${String(this.DUE_DAY).padStart(2, '0')}`;

            await storage.add('billing_installments', {
                userId: user.id,
                competenceMonth: competenceMonth,
                dueDate: dueDate,
                amount: this.INSTALLMENT_AMOUNT,
                status: 'A_VENCER',
                createdAt: new Date().toISOString()
            });
            console.log(`Billing: Created custom installment for ${competenceMonth} (User: ${user.email})`);
        }

        await this.syncInstallmentStatuses(user.id);
    }

    /**
     * Gera parcelas faltantes automaticamente (legado/auto-gestão).
     */
    async generateMissingInstallments(user) {
        if (!user || !user.firstAccessAt) return;

        const firstAccess = new Date(user.firstAccessAt);
        const now = new Date();

        // Se já passaram meses desde o primeiro acesso e não tem parcelas, gera.
        // Por simplicidade, vamos usar a nova função se o count for calculado.
        const installments = await this.getUserInstallments(user.id);
        if (installments.length === 0) {
            await this.generateMonthlyInstallments(user, 1);
        }
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
