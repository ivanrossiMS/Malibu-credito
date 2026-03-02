import companyService from '../CompanyService.js';

class Companies {
    constructor() {
        this.companiesList = document.getElementById('companies-list');
        this.modal = document.getElementById('company-modal');
        this.form = document.getElementById('company-form');
        this.modalTitle = document.getElementById('modal-title');
    }

    async init() {
        if (!this.companiesList) return;

        await this.loadCompanies();
        this.bindEvents();

        // Expor funções globais para o HTML (onClick)
        window.openAddCompanyModal = () => this.openModal();
        window.closeCompanyModal = () => this.closeModal();
        window.editCompany = (id) => this.editCompany(id);
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
                    <button onclick="editCompany(${company.id})" class="text-slate-500 hover:bg-slate-100 p-2 rounded-xl transition-all" title="Editar">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
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
        document.getElementById('company-status').value = company ? company.status : 'ativo';
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
        const companyData = {
            id: document.getElementById('company-id').value || null,
            name: document.getElementById('company-name').value,
            slug: document.getElementById('company-slug').value,
            cnpj: document.getElementById('company-cnpj').value,
            status: document.getElementById('company-status').value,
            asaas_api_key: document.getElementById('company-asaas-key').value,
            asaas_environment: document.getElementById('company-asaas-env').value,
            asaas_wallet_id: document.getElementById('company-asaas-wallet').value,
            pix_key: document.getElementById('company-pix-key').value
        };

        try {
            await companyService.save(companyData);
            this.closeModal();
            await this.loadCompanies();
            alert("Empresa salva com sucesso!");
        } catch (error) {
            alert("Erro ao salvar empresa: " + error.message);
        }
    }
}

export default Companies;
