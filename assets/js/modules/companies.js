import companyService from '../CompanyService.js';
import billingService from '../BillingService.js';
import DateHelper from '../DateHelper.js';
import storage from '../StorageService.js';

class Companies {
    constructor() {
        this.companiesList = document.getElementById('companies-list');
        this.modal = document.getElementById('company-modal');
        this.form = document.getElementById('company-form');
        this.modalTitle = document.getElementById('modal-title');

        this.financeModal = document.getElementById('finance-modal');
        this.financeList = document.getElementById('finance-installments-list');
        this.currentFinanceCompany = null;
    }

    async init() {
        if (!this.companiesList) return;

        await this.loadCompanies();
        this.bindEvents();

        // Expor funções globais para o HTML (onClick)
        window.openAddCompanyModal = () => this.openModal();
        window.closeCompanyModal = () => this.closeModal();
        window.editCompany = (id) => this.editCompany(id);
        window.deleteCompany = (id) => this.deleteCompany(id);
        window.openCompanyFinance = (id) => this.openFinance(id);
        window.closeFinanceModal = () => this.closeFinanceModal();
        window.generateCompanyBilling = () => this.generateBilling();
        window.toggleAccessOverride = () => this.toggleAccessOverride();
        window.toggleCompanyBlockStatus = () => this.toggleManualBlock();
        window.financeMarkAsPaid = (id) => this.markAsPaid(id);
        window.financeEdit = (id) => this.financeEdit(id);
        window.financeVoucher = (id) => this.financeVoucher(id);
        window.financeDelete = (id) => this.financeDelete(id);
    }

    async loadCompanies() {
        try {
            const companies = await companyService.getAll();
            this.renderCompanies(companies);
        } catch (error) {
            console.error("Erro ao carregar empresas:", error);
        }
    }

    renderCompanies(companies) {
        if (!this.companiesList) return;

        if (companies.length === 0) {
            this.companiesList.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                        Nenhuma empresa cadastrada.
                    </td>
                </tr>
            `;
            return;
        }

        this.companiesList.innerHTML = companies.map(company => `
            <tr>
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-700">${company.name}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-slate-500">${company.cnpj || '---'}</div>
                    <div class="text-xs text-slate-400">slug: ${company.slug}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${company.asaasApiKey ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                        <span class="text-xs ${company.asaasApiKey ? 'text-emerald-600 font-bold' : 'text-slate-400'}">
                            ${company.asaasApiKey ? 'Configurado' : 'Pendente'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${company.status === 'ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }">
                        ${company.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        <button onclick="openCompanyFinance(${company.id})" class="text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-all" title="Financeiro / Mensalidades">
                            <i data-lucide="circle-dollar-sign" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editCompany(${company.id})" class="text-slate-500 hover:bg-slate-100 p-2 rounded-xl transition-all" title="Editar">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteCompany(${company.id})" class="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
    }

    bindEvents() {
        if (this.form) {
            this.form.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleSave();
            };
        }
    }

    openModal(company = null) {
        if (!this.modal) return;

        this.form.reset();
        document.getElementById('company-id').value = company ? company.id : '';
        document.getElementById('company-name').value = company ? company.name : '';
        document.getElementById('company-slug').value = company ? company.slug : '';
        document.getElementById('company-cnpj').value = company ? (company.cnpj || '') : '';
        // Status removed from UI, handled by finance/manual block button
        document.getElementById('company-asaas-key').value = company ? (company.asaasApiKey || company.asaas_api_key || '') : '';
        document.getElementById('company-asaas-env').value = company ? (company.asaasEnvironment || company.asaas_environment || 'sandbox') : 'sandbox';
        document.getElementById('company-asaas-wallet').value = company ? (company.asaasWalletId || company.asaas_wallet_id || '') : '';
        document.getElementById('company-pix-key').value = company ? (company.pixKey || company.pix_key || '') : '';

        this.modalTitle.textContent = company ? 'Editar Empresa' : 'Nova Empresa';
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    async editCompany(id) {
        const company = await companyService.getById(id);
        if (company) {
            this.openModal(company);
        }
    }

    async handleSave() {
        const id = document.getElementById('company-id').value || null;

        const companyData = {
            id: id,
            name: document.getElementById('company-name').value,
            slug: document.getElementById('company-slug').value,
            cnpj: document.getElementById('company-cnpj').value,
            asaas_api_key: document.getElementById('company-asaas-key').value,
            asaas_environment: document.getElementById('company-asaas-env').value,
            asaas_wallet_id: document.getElementById('company-asaas-wallet').value,
            pix_key: document.getElementById('company-pix-key').value
        };

        // If it's a new company, force "bloqueado" status
        if (!id) {
            companyData.status = 'bloqueado';
        } else {
            // If it's an update, we should preserve the current status
            const existing = await companyService.getById(id);
            if (existing) {
                companyData.status = existing.status;
            }
        }

        try {
            await companyService.save(companyData);
            this.closeModal();
            await this.loadCompanies();
            alert("Empresa salva com sucesso!");
        } catch (error) {
            alert("Erro ao salvar empresa: " + error.message);
        }
    }
    async deleteCompany(id) {
        if (confirm("ATENÇÃO: Excluir esta empresa removerá todos os dados vinculados a ela. Esta ação não pode ser desfeita.\n\nDeseja continuar?")) {
            try {
                await companyService.delete(id);
                await this.loadCompanies();
                alert("Empresa excluída com sucesso!");
            } catch (error) {
                alert("Erro ao excluir empresa: " + error.message);
            }
        }
    }

    async openFinance(id) {
        const company = await companyService.getById(id);
        if (!company) return;

        this.currentFinanceCompany = company;
        document.getElementById('finance-company-name').textContent = company.name;
        document.getElementById('finance-access-override').checked = !!(company.access_override || company.accessOverride);

        await this.refreshFinanceInfo();

        this.financeModal.classList.remove('hidden');
        lucide.createIcons();
    }

    closeFinanceModal() {
        this.financeModal.classList.add('hidden');
        this.currentFinanceCompany = null;
    }

    async refreshFinanceInfo() {
        const id = this.currentFinanceCompany.id;

        // Check Debt Status
        const hasOverdue = await billingService.hasCompanyOverdue(id);
        const override = document.getElementById('finance-access-override').checked;

        const banner = document.getElementById('finance-access-banner');
        const iconDiv = document.getElementById('finance-status-icon');
        const title = document.getElementById('finance-status-title');
        const desc = document.getElementById('finance-status-desc');
        const blockBtn = document.getElementById('finance-manual-block');

        // Manual Block Button State
        const isBlocked = this.currentFinanceCompany.status === 'bloqueado';
        blockBtn.textContent = isBlocked ? 'DESBLOQUEAR ACESSO' : 'BLOQUEAR ACESSO';
        blockBtn.className = isBlocked
            ? 'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all shadow-sm'
            : 'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 hover:bg-rose-200 transition-all shadow-sm';

        if (isBlocked) {
            banner.className = 'p-6 rounded-3xl border border-rose-200 bg-rose-100/50 flex items-center justify-between gap-4';
            iconDiv.className = 'w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white';
            title.textContent = 'ACESSO BLOQUEADO MANUALMENTE';
            title.className = 'font-black text-rose-900';
            desc.textContent = 'O Master suspendeu o acesso desta empresa por tempo indeterminado.';
        } else if (!hasOverdue || override) {
            banner.className = 'p-6 rounded-3xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between gap-4';
            iconDiv.className = 'w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white';
            title.textContent = 'Acesso Liberado';
            title.className = 'font-black text-emerald-900';
            desc.textContent = override ? 'Acesso liberado forçadamente pelo Master.' : 'A empresa está em dia com as mensalidades.';
        } else {
            banner.className = 'p-6 rounded-3xl border border-rose-100 bg-rose-50 flex items-center justify-between gap-4';
            iconDiv.className = 'w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white';
            title.textContent = 'Acesso Bloqueado';
            title.className = 'font-black text-rose-900';
            desc.textContent = 'Existem mensalidades vencidas pendentes.';
        }

        // List Installments
        const installments = await storage.getAdvanced('billing_installments', {
            eq: { company_id: id },
            order: { column: 'dueDate', ascending: false }
        });

        if (installments.length === 0) {
            this.financeList.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Nenhuma mensalidade gerada.</td></tr>`;
        } else {
            this.financeList.innerHTML = installments.map(inst => {
                const statusClass = inst.status === 'PAGA' ? 'text-emerald-500' : (inst.status === 'VENCIDA' ? 'text-rose-500' : 'text-amber-500');
                return `
                    <tr>
                        <td class="px-6 py-4">${DateHelper.formatLocal(inst.dueDate)}</td>
                        <td class="px-6 py-4">R$ ${parseFloat(inst.amount).toFixed(2)}</td>
                        <td class="px-6 py-4 ${statusClass}">${inst.status}</td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex justify-end gap-1">
                                ${inst.status !== 'PAGA' ? `
                                    <button onclick="financeMarkAsPaid(${inst.id})" class="text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg uppercase transition-all">Baixar</button>
                                ` : `
                                    <button onclick="financeVoucher(${inst.id})" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Ver Comprovante">
                                        <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                                    </button>
                                `}
                                <button onclick="financeEdit(${inst.id})" class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all" title="Editar">
                                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="financeDelete(${inst.id})" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Excluir">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    async financeEdit(id) {
        const inst = await storage.getById('billing_installments', id);
        if (!inst) return;

        const newAmount = prompt("Novo valor da parcela:", inst.amount);
        const newDate = prompt("Nova data de vencimento (AAAA-MM-DD):", inst.dueDate);

        if (newAmount !== null && newDate !== null) {
            try {
                inst.amount = parseFloat(newAmount);
                inst.dueDate = newDate;
                await storage.put('billing_installments', inst);
                await this.refreshFinanceInfo();
            } catch (error) {
                alert("Erro ao editar parcela: " + error.message);
            }
        }
    }

    async financeVoucher(id) {
        const inst = await storage.getById('billing_installments', id);
        if (!inst || inst.status !== 'PAGA') return;

        const company = this.currentFinanceCompany;

        const voucherText = `
            COMPROVANTE DE PAGAMENTO - MENSALIDADE
            ------------------------------------
            EMPRESA: ${company.name}
            CNPJ: ${company.cnpj || '---'}
            REF. MÊS: ${inst.competenceMonth}
            VALOR: R$ ${parseFloat(inst.amount).toFixed(2)}
            DATA PAGTO: ${new Date(inst.paidAt).toLocaleDateString()}
            ------------------------------------
            SISTEMA MALIBU CRÉDITO
        `;

        const win = window.open('', '_blank');
        win.document.write(`<pre>${voucherText}</pre>`);
        win.document.close();
        win.print();
    }

    async generateBilling() {
        if (!this.currentFinanceCompany) return;
        const count = parseInt(document.getElementById('finance-count').value);
        const amount = parseFloat(document.getElementById('finance-amount').value);
        const firstDue = document.getElementById('finance-first-due').value;

        try {
            await billingService.generateCompanyInstallments(this.currentFinanceCompany.id, count, amount, firstDue);
            await this.refreshFinanceInfo();
            alert(`${count} mensalidade(s) gerada(s) com sucesso!`);
        } catch (error) {
            alert("Erro ao gerar mensalidades: " + error.message);
        }
    }

    async toggleManualBlock() {
        if (!this.currentFinanceCompany) return;
        const currentStatus = this.currentFinanceCompany.status;
        const newStatus = currentStatus === 'bloqueado' ? 'ativo' : 'bloqueado';
        const msg = newStatus === 'bloqueado'
            ? "Deseja realmente BLOQUEAR o acesso de todos os usuários desta empresa?"
            : "Deseja DESBLOQUEAR o acesso desta empresa?";

        if (confirm(msg)) {
            try {
                const company = await companyService.getById(this.currentFinanceCompany.id);
                company.status = newStatus;
                await companyService.save(company);
                this.currentFinanceCompany = company; // Update local state
                await this.refreshFinanceInfo();
                await this.loadCompanies(); // Update main table
            } catch (error) {
                alert("Erro ao alterar status da empresa: " + error.message);
            }
        }
    }

    async toggleAccessOverride() {
        if (!this.currentFinanceCompany) return;
        const override = document.getElementById('finance-access-override').checked;

        try {
            const company = await companyService.getById(this.currentFinanceCompany.id);
            company.access_override = override;
            await companyService.save(company);
            await this.refreshFinanceInfo();
        } catch (error) {
            alert("Erro ao salvar override: " + error.message);
        }
    }

    async markAsPaid(id) {
        if (confirm("Confirmar recebimento desta mensalidade?")) {
            try {
                await billingService.markAsPaid(id);
                await this.refreshFinanceInfo();
            } catch (error) {
                alert("Erro ao baixar mensalidade: " + error.message);
            }
        }
    }

    async financeDelete(id) {
        if (confirm("Deseja realmente EXCLUIR esta mensalidade permanentemente?")) {
            try {
                await storage.delete('billing_installments', id);
                await this.refreshFinanceInfo();
            } catch (error) {
                alert("Erro ao excluir mensalidade: " + error.message);
            }
        }
    }
}

export default Companies;
