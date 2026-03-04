import storage from '../StorageService.js';
import companyService from '../CompanyService.js';
import masterBillingService from '../BillingService.js'; // Assuming BillingService has master logic or we'll use generic

export default class MasterDashboardModule {
    async init() {
        console.log("Master Dashboard Initializing...");

        // Expose handlers if needed

        await this.loadData();
    }

    async loadData() {
        try {
            // Load global metrics
            const [companies, users, allInstallments] = await Promise.all([
                companyService.getAll(),
                storage.getAll('users'),
                storage.getAdvanced('billing_installments')
            ]);

            const activeCompanies = companies.filter(c => c.status === 'ativo');
            const admins = users.filter(u => u.role === 'admin' || u.role === 'ADMIN');

            // Update Stats
            const elCompanies = document.getElementById('master-stat-companies');
            const elAdmins = document.getElementById('master-stat-admins');

            if (elCompanies) elCompanies.textContent = activeCompanies.length;
            if (elAdmins) elAdmins.textContent = admins.length;

            // Calculate Billing (Total paid in the current month - Cash Flow)
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const monthlyBilling = allInstallments
                .filter(i => {
                    const status = (i.status || '').toUpperCase();
                    const isPaid = status === 'PAGA' || status === 'PAGO';
                    const paidMonth = i.paidAt ? i.paidAt.substring(0, 7) : (i.paid_at ? i.paid_at.substring(0, 7) : null);

                    // Contabiliza se a competência for este mês OU se foi pago este mês
                    return isPaid && (i.competenceMonth === currentMonth || paidMonth === currentMonth);
                })
                .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

            // Calculate Forecast (Everything that belongs to this month)
            const forecast = allInstallments
                .filter(i => i.competenceMonth === currentMonth)
                .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

            // Calculate Overdue (Only what belongs to this month and is OVERDUE)
            const overdueMonth = allInstallments
                .filter(i => i.competenceMonth === currentMonth && (i.status || '').toUpperCase() === 'VENCIDA')
                .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

            const fmt = (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            const elBilling = document.getElementById('master-stat-billing');
            const elForecast = document.getElementById('master-stat-forecast');
            const elOverdue = document.getElementById('master-stat-overdue-month');

            if (elBilling) elBilling.textContent = fmt(monthlyBilling);
            if (elForecast) elForecast.textContent = fmt(forecast);
            if (elOverdue) elOverdue.textContent = fmt(overdueMonth);

            this.renderRecentCompanies(companies);
            this.renderPendingActions(allInstallments, companies);

        } catch (error) {
            console.error("Error loading master dashboard data:", error);
        }
    }

    renderRecentCompanies(companies) {
        const container = document.getElementById('master-recent-companies');
        if (!container) return;
        container.innerHTML = '';

        if (companies.length === 0) {
            container.innerHTML = `<p class="text-slate-400 text-center py-10 font-bold uppercase tracking-widest text-xs">Nenhuma empresa cadastrada</p>`;
            return;
        }

        // Sort by id/date and take last 5
        const recent = [...companies].reverse().slice(0, 5);

        container.innerHTML = recent.map(c => {
            const statusLabel = c.status === 'ativo' ? 'Ativo' : 'Bloqueado';
            const statusClass = c.status === 'ativo' ? 'text-emerald-600' : 'text-rose-600';
            const bgClass = c.status === 'ativo' ? 'bg-emerald-500/10' : 'bg-rose-500/10';

            return `
                <div class="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-premium transition-all group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 font-black">
                            ${c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-slate-900 font-black text-sm uppercase tracking-tight">${c.name}</p>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest">${c.city || 'Cidade não informada'} - ${c.state || 'UF'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right hidden sm:block">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Status Geral</p>
                            <span class="text-[10px] font-black ${statusClass} uppercase">${statusLabel}</span>
                        </div>
                        <button onclick="window.location.href='?page=companies&id=${c.id}'" class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <i data-lucide="chevron-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    renderPendingActions(installments, companies) {
        const container = document.getElementById('master-pending-actions');
        if (!container) return;
        container.innerHTML = '';

        // Filtrar parcelas vencidas
        const overdue = installments.filter(i => i.status === 'VENCIDA');

        if (overdue.length === 0) {
            container.innerHTML = `
                <div class="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <i data-lucide="check-circle" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Tudo em dia!</p>
                </div>
            `;
        } else {
            container.innerHTML = overdue.map(inst => {
                const company = companies.find(c => c.id === (inst.company_id || inst.companyId)) || { name: 'Desconhecida' };
                return `
                    <div class="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center justify-between group hover:bg-rose-50 transition-all cursor-pointer" onclick="window.location.href='?page=master_billing'">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-500 border border-rose-100">
                                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <p class="text-[11px] font-black text-slate-900 uppercase pr-2 truncate max-w-[120px]">${company.name}</p>
                                <p class="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Vencimento: ${inst.dueDate.split('-').reverse().join('/')}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[11px] font-black text-slate-900">R$ ${parseFloat(inst.amount).toFixed(2)}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        lucide.createIcons();
    }
}
