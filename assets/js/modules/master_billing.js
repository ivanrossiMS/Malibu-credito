import storage from '../StorageService.js';
import billingService from '../BillingService.js';
import DateHelper from '../DateHelper.js';
import companyService from '../CompanyService.js';

class MasterBilling {
    constructor() {
        this.billingList = document.getElementById('master-billing-list');
        this.companyFilter = document.getElementById('master-company-filter');
        this.statusFilter = document.getElementById('master-status-filter');

        this.kpiTotalPaid = document.getElementById('kpi-total-paid');
        this.kpiTotalPending = document.getElementById('kpi-total-pending');
        this.kpiThisMonth = document.getElementById('kpi-this-month');

        this.installments = [];
        this.companies = [];
    }

    async init() {
        if (!this.billingList) return;

        await this.loadInitialData();
        this.bindEvents();

        // Expor globais
        window.refreshBilling = () => this.loadBilling();
        window.masterMarkAsPaid = (id) => this.markAsPaid(id);
        window.masterUndoPayment = (id) => this.undoPayment(id);
        window.masterEditInstallment = (id) => this.editInstallment(id);
        window.masterVoucher = (id) => this.viewVoucher(id);
    }

    async loadInitialData() {
        try {
            // Carregar empresas para o filtro
            this.companies = await companyService.getAll();
            this.populateCompanyFilter();

            await this.loadBilling();
        } catch (error) {
            console.error("Master Billing: Failed to load initial data", error);
        }
    }

    populateCompanyFilter() {
        if (!this.companyFilter) return;

        const options = this.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        this.companyFilter.innerHTML = `<option value="all">Todas as Empresas</option>${options}`;
    }

    async loadBilling() {
        try {
            // Buscar todas as mensalidades (o Master vê tudo via StorageService)
            this.installments = await storage.getAdvanced('billing_installments', {
                order: { column: 'dueDate', ascending: false },
                // Precisamos trazer o usuário para saber a empresa se não estiver direto na parcela
                // Mas por regra de multi-tenant, billing_installments TEM company_id
            });

            // Como as parcelas podem não ter o join da empresa direto no Storage.getAdvanced simples,
            // Vamos enriquecer os dados se necessário ou confiar no company_id da tabela.

            this.applyFilters();
        } catch (error) {
            console.error("Master Billing: Error loading installments", error);
            this.billingList.innerHTML = `<tr><td colspan="6" class="px-8 py-10 text-center text-rose-500 font-bold">Erro ao carregar dados.</td></tr>`;
        }
    }

    bindEvents() {
        if (this.companyFilter) {
            this.companyFilter.onchange = () => this.applyFilters();
        }
        if (this.statusFilter) {
            this.statusFilter.onchange = () => this.applyFilters();
        }
    }

    applyFilters() {
        const companyId = this.companyFilter.value;
        const status = this.statusFilter.value;

        let filtered = [...this.installments];

        // Ignorar órfãos (segurança de UI)
        filtered = filtered.filter(i => {
            const cid = i.company_id || i.companyId;
            return cid && this.companies.some(c => c.id === cid);
        });

        if (companyId !== 'all') {
            const idInt = parseInt(companyId);
            filtered = filtered.filter(i => (i.company_id || i.companyId) === idInt);
        }

        if (status !== 'all') {
            filtered = filtered.filter(i => i.status === status);
        }

        this.updateKPIs(filtered);
        this.renderList(filtered);
    }

    updateKPIs(data) {
        const today = DateHelper.getTodayStr();
        const currentMonth = today.substring(0, 7); // YYYY-MM

        const totalPaid = data
            .filter(i => i.status === 'PAGA')
            .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        const totalPending = data
            .filter(i => i.status !== 'PAGA')
            .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        const thisMonthForecast = data
            .filter(i => i.competenceMonth === currentMonth)
            .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        if (this.kpiTotalPaid) this.kpiTotalPaid.textContent = fmt(totalPaid);
        if (this.kpiTotalPending) this.kpiTotalPending.textContent = fmt(totalPending);
        if (this.kpiThisMonth) this.kpiThisMonth.textContent = fmt(thisMonthForecast);
    }

    renderList(data) {
        if (data.length === 0) {
            this.billingList.innerHTML = `
                <tr>
                    <td colspan="6" class="px-8 py-20 text-center">
                        <div class="flex flex-col items-center gap-2 opacity-30">
                            <i data-lucide="inbox" class="w-12 h-12"></i>
                            <p class="font-bold uppercase tracking-widest text-xs">Nenhum faturamento encontrado</p>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        this.billingList.innerHTML = data.map(inst => {
            const company = this.companies.find(c => c.id === (inst.company_id || inst.companyId)) || { name: 'Desconhecida' };
            const statusClass = inst.status === 'PAGA' ? 'bg-emerald-100 text-emerald-600' :
                (DateHelper.isPast(inst.dueDate) ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600');
            const statusLabel = inst.status === 'PAGA' ? 'Paga' : (DateHelper.isPast(inst.dueDate) ? 'Vencida' : 'Aberta');

            return `
                <tr class="hover:bg-slate-50/50 transition-colors group">
                    <td class="px-8 py-5">
                        <div class="font-black text-slate-800 tracking-tight">${company.name}</div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">ID: ${(inst.company_id || inst.companyId)}</div>
                    </td>
                    <td class="px-8 py-5 text-center">
                        <span class="text-sm font-bold text-slate-600">${inst.competenceMonth}</span>
                    </td>
                    <td class="px-8 py-5 text-center text-sm font-medium text-slate-500">
                        ${DateHelper.formatLocal(inst.dueDate)}
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="font-black text-slate-800">R$ ${parseFloat(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            ${inst.status !== 'PAGA' ? `
                                <button onclick="masterMarkAsPaid(${inst.id})" class="text-emerald-500 hover:bg-emerald-50 p-2 rounded-xl transition-all" title="Confirmar Pagamento">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                            ` : `
                                <button onclick="masterVoucher(${inst.id})" class="text-indigo-500 hover:bg-indigo-50 p-2 rounded-xl transition-all" title="Ver Comprovante">
                                    <i data-lucide="receipt" class="w-4 h-4"></i>
                                </button>
                                <button onclick="masterUndoPayment(${inst.id})" class="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all" title="Estornar / Reabrir">
                                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                                </button>
                            `}
                            <button onclick="masterEditInstallment(${inst.id})" class="text-slate-500 hover:bg-slate-50 p-2 rounded-xl transition-all" title="Editar Parcela">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    async markAsPaid(id) {
        if (!confirm("Confirmar recebimento manual desta mensalidade?")) return;
        try {
            await billingService.markAsPaid(id);
            await this.loadBilling();
        } catch (error) {
            alert("Erro ao baixar parcela: " + error.message);
        }
    }

    async undoPayment(id) {
        if (!confirm("Deseja realmente reabrir esta mensalidade?")) return;
        try {
            await billingService.undoPayment(id);
            await this.loadBilling();
        } catch (error) {
            alert("Erro ao estornar: " + error.message);
        }
    }

    async editInstallment(id) {
        // Como o modal de edição está no contexto de Companies, 
        // mas as parcelas são da mesma tabela, podemos usar um prompt simples 
        // ou redirecionar se necessário. Mas o usuário pediu "opção de editar".
        // Vamos implementar um prompt simples de Valor e Data para o Master.

        const inst = await storage.getById('billing_installments', id);
        if (!inst) return;

        const newAmount = prompt("Novo Valor (R$):", inst.amount);
        if (newAmount === null) return;

        const newDate = prompt("Nova Data de Vencimento (AAAA-MM-DD):", inst.dueDate);
        if (newDate === null) return;

        try {
            await storage.put('billing_installments', {
                ...inst,
                amount: parseFloat(newAmount),
                dueDate: newDate,
                updatedAt: new Date().toISOString()
            });
            await this.loadBilling();
            alert("Parcela atualizada!");
        } catch (error) {
            alert("Erro ao editar: " + error.message);
        }
    }

    viewVoucher(id) {
        // Se houver integração de comprovante (URL no banco)
        storage.getById('billing_installments', id).then(inst => {
            if (inst && inst.voucherUrl) {
                window.open(inst.voucherUrl, '_blank');
            } else {
                alert("Nenhum comprovante anexado a esta parcela.");
            }
        });
    }
}

export default MasterBilling;
