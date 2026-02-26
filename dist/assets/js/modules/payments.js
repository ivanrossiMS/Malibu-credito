import paymentService from '../PaymentService.js';
import DateHelper from '../DateHelper.js';

export default class PaymentsModule {
    async init() {
        await this.renderPayments();
        this.updateStats();
    }

    async renderPayments() {
        const listContainer = document.getElementById('payments-list');
        if (!listContainer) return;

        try {
            const payments = await paymentService.getAll();

            if (payments.length === 0) {
                listContainer.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                            <p>Nenhum pagamento registrado.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Sort by date desc
            payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            listContainer.innerHTML = payments.map(p => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 text-sm text-slate-600">${DateHelper.formatLocal(p.createdAt)}</td>
                    <td class="px-6 py-4 text-sm font-bold text-slate-900">${p.client?.name || 'Cliente deletado'}</td>
                    <td class="px-6 py-4 text-sm font-black text-emerald-600">R$ ${parseFloat(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="px-6 py-4 text-sm text-slate-500 capitalize">${p.method || 'dinheiro'}</td>
                    <td class="px-6 py-4 text-right">
                        <button class="p-2 text-slate-400 hover:text-primary transition-colors">
                            <i data-lucide="receipt" class="w-5 h-5"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            lucide.createIcons();
            this.updateStats(payments);

        } catch (error) {
            console.error("Erro ao carregar pagamentos:", error);
        }
    }

    updateStats(payments = null) {
        const todayStatEl = document.getElementById('payment-stat-today');
        const monthStatEl = document.getElementById('payment-stat-month');

        if (!todayStatEl && !monthStatEl) return;

        const today = DateHelper.getTodayStr();
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const pList = payments || [];

        const totalToday = pList
            .filter(p => p.createdAt.split('T')[0] === today)
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const totalMonth = pList
            .filter(p => p.createdAt >= firstDayMonth)
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        if (todayStatEl) todayStatEl.textContent = `R$ ${totalToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (monthStatEl) monthStatEl.textContent = `R$ ${totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

