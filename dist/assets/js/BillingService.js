import storage from './StorageService.js';
import DateHelper from './DateHelper.js';

/**
 * BillingService v1.0.1 - Updated 2026-03-02
 */
class BillingService {
    constructor() {
        this.INSTALLMENT_AMOUNT = 10.00;
        this.DUE_DAY = 10;
    }

    /**
     * Gera uma quantidade específica de parcelas para um usuário com valores e datas customizadass.
     */
    async generateMonthlyInstallments(user, count = 1, amount = null, firstDueDate = null) {
        if (!user) return;

        const finalAmount = amount !== null ? parseFloat(amount) : this.INSTALLMENT_AMOUNT;
        let startDate;

        if (firstDueDate) {
            startDate = new Date(firstDueDate + 'T12:00:00'); // Evitar problemas de timezone
        } else {
            // Fallback: Buscar parcelas existentes para encontrar o ponto de partida
            const installments = await this.getUserInstallments(user.id);
            if (installments.length > 0) {
                const latest = installments[0];
                const [year, month] = latest.competenceMonth.split('-').map(Number);
                startDate = new Date(year, month, this.DUE_DAY);
            } else {
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), this.DUE_DAY);
            }
        }

        for (let i = 0; i < count; i++) {
            const currentIter = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
            const competenceMonth = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}`;
            const dueDate = currentIter.toISOString().split('T')[0];

            await storage.add('billing_installments', {
                userId: user.id,
                competenceMonth: competenceMonth,
                dueDate: dueDate,
                amount: finalAmount,
                status: 'A_VENCER',
                createdAt: new Date().toISOString()
            });
            console.log(`Billing: Created installment for ${competenceMonth} (Due: ${dueDate}, Amount: ${finalAmount})`);
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
     * Além disso, bloqueia o acesso se houver parcelas vencidas.
     */
    async syncInstallmentStatuses(userId) {
        const installments = await storage.query('billing_installments', 'userId', userId);
        const todayStr = DateHelper.getTodayStr();
        let hasOverdue = false;

        for (const inst of installments) {
            let newStatus = inst.status;

            if (inst.status !== 'PAGA') {
                if (inst.dueDate < todayStr) {
                    newStatus = 'VENCIDA';
                    hasOverdue = true;
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

        // Bloqueio automático por inadimplência
        if (hasOverdue) {
            const user = await storage.getById('users', userId);
            if (user && user.accessEnabled && !user.accessOverride) {
                await storage.put('users', { ...user, accessEnabled: false });
                console.log(`Billing: Access REVOKED for ${user.email} (Overdue found)`);
            }
        }
    }

    /**
     * Verifica se o usuário possui alguma parcela vencida.
     */
    async hasOverdueInstallment(userId) {
        const installments = await storage.query('billing_installments', 'userId', userId);
        const todayStr = DateHelper.getTodayStr();
        return installments.some(i => i.status === 'VENCIDA' || (i.status === 'A_VENCER' && i.dueDate < todayStr));
    }

    /**
     * Verifica se a empresa possui alguma parcela vencida.
     */
    async hasCompanyOverdue(companyId) {
        if (!companyId) return false;

        // Sync statuses before checking
        await this.syncCompanyInstallmentStatuses(companyId);

        const installments = await storage.getAdvanced('billing_installments', {
            eq: { company_id: companyId }
        });

        const todayStr = DateHelper.getTodayStr();
        return installments.some(i => i.status === 'VENCIDA' || (i.status === 'A_VENCER' && i.dueDate < todayStr));
    }

    /**
     * Atualiza o status das parcelas da empresa (A_VENCER -> VENCIDA)
     */
    async syncCompanyInstallmentStatuses(companyId) {
        const installments = await storage.getAdvanced('billing_installments', {
            eq: { company_id: companyId }
        });

        const todayStr = DateHelper.getTodayStr();
        console.log(`[BillingSync] Syncing for company ${companyId}. Today: ${todayStr}`);

        for (const inst of installments) {
            let newStatus = inst.status;

            if (inst.status !== 'PAGA') {
                const dueDate = DateHelper.toLocalYYYYMMDD(inst.dueDate);
                if (dueDate < todayStr) {
                    newStatus = 'VENCIDA';
                } else {
                    newStatus = 'A_VENCER';
                }
            }

            if (newStatus !== inst.status) {
                console.log(`[BillingSync] Update ${inst.id}: ${inst.status} -> ${newStatus}`);
                await storage.put('billing_installments', {
                    ...inst,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Retorna todas as mensalidades de um usuário.
     */
    async getUserInstallments(userId) {
        return await storage.getAdvanced('billing_installments', {
            eq: { userId: userId },
            order: { column: 'dueDate', ascending: true }
        });
    }

    /**
     * Marca uma parcela como paga.
     * Se for a do mês atual ou a última vencida, tenta liberar o acesso.
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

        // 1. Desbloqueio de Usuário Individual (Legado/Acesso Direto)
        if (inst.userId) {
            const anyOverdue = await this.hasOverdueInstallment(inst.userId);
            if (!anyOverdue) {
                const user = await storage.getById('users', inst.userId);
                if (user && !user.accessEnabled) {
                    await storage.put('users', { ...user, accessEnabled: true });
                    console.log(`Billing: Access RESTORED for ${user.email} (Payment confirmed)`);
                }
            }
        }

        // 2. Desbloqueio de Empresa (Multi-Tenant)
        if (inst.company_id || inst.companyId) {
            const companyId = inst.company_id || inst.companyId;
            const anyCompanyOverdue = await this.hasCompanyOverdue(companyId);

            if (!anyCompanyOverdue) {
                const company = await storage.getById('companies', companyId);
                if (company && company.status === 'bloqueado') {
                    await storage.put('companies', { ...company, status: 'ativo' });
                    console.log(`Billing: Company ${companyId} RESTORED to 'ativo' (All installments paid)`);
                }
            }
        }
    }

    /**
     * Gera mensalidades para uma empresa inteira.
     */
    async generateCompanyInstallments(companyId, count = 1, amount = null, firstDueDate = null) {
        if (!companyId) return;

        const finalAmount = amount !== null ? parseFloat(amount) : this.INSTALLMENT_AMOUNT;
        let startDate;

        if (firstDueDate) {
            startDate = new Date(firstDueDate + 'T12:00:00');
        } else {
            const installments = await storage.getAdvanced('billing_installments', {
                eq: { company_id: companyId },
                order: { column: 'dueDate', ascending: false },
                limit: 1
            });

            if (installments.length > 0) {
                const latest = installments[0];
                const [year, month] = latest.competenceMonth.split('-').map(Number);
                startDate = new Date(year, month, this.DUE_DAY);
            } else {
                const now = new Date();
                startDate = new Date(now.getFullYear(), now.getMonth(), this.DUE_DAY);
            }
        }

        for (let i = 0; i < count; i++) {
            const currentIter = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
            const competenceMonth = `${currentIter.getFullYear()}-${String(currentIter.getMonth() + 1).padStart(2, '0')}`;
            const dueDate = currentIter.toISOString().split('T')[0];

            await storage.add('billing_installments', {
                company_id: companyId,
                competenceMonth: competenceMonth,
                dueDate: dueDate,
                amount: finalAmount,
                status: 'A_VENCER',
                createdAt: new Date().toISOString()
            });
            console.log(`Billing: Created company installment for ${competenceMonth} (ID: ${companyId})`);
        }

        await this.syncCompanyInstallmentStatuses(companyId);
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

        // Sincroniza status e consequentemente bloqueia se necessário
        await this.syncInstallmentStatuses(inst.userId);
    }
}

const billingService = new BillingService();
export default billingService;
