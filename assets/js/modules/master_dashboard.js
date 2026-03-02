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
            const [companies, users] = await Promise.all([
                companyService.getAll(),
                storage.getAll('users')
            ]);

            const admins = users.filter(u => u.role === 'admin' || u.role === 'ADMIN');

            // Update Stats
            document.getElementById('master-stat-companies').textContent = companies.length;
            document.getElementById('master-stat-admins').textContent = admins.length;

            // Calculate Billing (Simple sum of all paid/pending in master billing)
            // This would normally come from a specific Service
            const billingTotal = 0; // Placeholder for now
            document.getElementById('master-stat-billing').textContent = `R$ ${billingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            this.renderRecentCompanies(companies);
            this.renderPendingActions(admins);

        } catch (error) {
            console.error("Error loading master dashboard data:", error);
        }
    }

    renderRecentCompanies(companies) {
        const container = document.getElementById('master-recent-companies');
        if (!container) return;

        if (companies.length === 0) {
            container.innerHTML = `<p class="text-slate-400 text-center py-10 font-bold uppercase tracking-widest text-xs">Nenhuma empresa cadastrada</p>`;
            return;
        }

        // Sort by id/date and take last 5
        const recent = [...companies].reverse().slice(0, 5);

        container.innerHTML = recent.map(c => `
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
                        <span class="text-[10px] font-black text-emerald-600 uppercase">Ativo</span>
                    </div>
                    <button onclick="window.location.href='?page=companies&id=${c.id}'" class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    renderPendingActions(admins) {
        // Logic to show admins without generated billing or overdue
        const container = document.getElementById('master-pending-actions');
        if (!container) return;

        // Simplified placeholder for now
        container.innerHTML = `
            <div class="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                <i data-lucide="check-circle" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Tudo em dia!</p>
            </div>
        `;
        lucide.createIcons();
    }
}
