import companyService from '../CompanyService.js';
import billingService from '../BillingService.js';
import DateHelper from '../DateHelper.js';
import storage from '../StorageService.js';

// ASAAS Supabase Project URL (mesma usada pelo StorageService)
const SUPABASE_URL = 'https://hfavkgsghlqgdqfckwce.supabase.co';

class Companies {
    constructor() {
        this.companiesList = document.getElementById('companies-list');
        this.modal = document.getElementById('company-modal');
        this.form = document.getElementById('company-form');
        this.modalTitle = document.getElementById('modal-title');

        this.financeModal = document.getElementById('finance-modal');
        this.financeList = document.getElementById('finance-installments-list');
        this.currentFinanceCompany = null;

        // Estado da integração ASAAS da empresa em edição
        this._currentIntegration = null;
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

        // ASAAS integration globals
        window.switchTab = (tab) => this.switchTab(tab);
        window.saveAsaasIntegration = () => this.saveAsaasIntegration();
        window.testAsaasConnection = () => this.testAsaasConnection();
        window.regenerateWebhookToken = () => this.regenerateWebhookToken();
        window.copyWebhookUrl = () => this.copyWebhookUrl();
        window.toggleApiKeyVisibility = () => this.toggleApiKeyVisibility();
    }

    // ─── Tab Switching ──────────────────────────────────────────────────────

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-slate-400');
        });
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

        const activeBtn = document.getElementById(`tab-${tab}`);
        const activePanel = document.getElementById(`panel-${tab}`);
        if (activeBtn) { activeBtn.classList.add('border-primary', 'text-primary'); activeBtn.classList.remove('border-transparent', 'text-slate-400'); }
        if (activePanel) activePanel.classList.remove('hidden');

        // Carregar integração ao abrir tab ASAAS se já temos uma empresa selecionada
        if (tab === 'asaas') {
            const id = document.getElementById('company-id').value;
            if (id) {
                this._loadAsaasIntegration(id);
            } else {
                // Mostrar aviso de que precisa salvar a empresa primeiro
                document.getElementById('asaas-no-company').classList.remove('hidden');
                document.getElementById('asaas-form-wrapper').classList.add('hidden');
            }
        }

        if (window.lucide) lucide.createIcons();
    }

    // ─── Load Companies ─────────────────────────────────────────────────────

    async loadCompanies() {
        try {
            const companies = await companyService.getAll();
            // Para cada empresa, buscar o status da integração ASAAS
            const intStatuses = await this._fetchAllIntegrationStatuses(companies);
            this.renderCompanies(companies, intStatuses);
        } catch (error) {
            console.error("Erro ao carregar empresas:", error);
        }
    }

    async _fetchAllIntegrationStatuses(companies) {
        // Busca em lote os status (sem API keys!) para exibir na tabela
        const statuses = {};
        try {
            // Usar a supabase client diretamente (sem service_role - apenas campos públicos)
            for (const c of companies) {
                const result = await storage.getAdvanced('company_integrations', {
                    eq: { company_id: c.id, provider: 'asaas' },
                    select: 'id,company_id,environment,is_enabled,last_test_ok,last_test_at,webhook_token'
                });
                if (result && result.length > 0) {
                    const intg = result[0];
                    statuses[c.id] = {
                        configured: true,
                        hasKey: !!(intg.apiKeyEncrypted || intg.api_key_encrypted || intg.hasApiKey), // boolean flag
                        environment: intg.environment,
                        lastTestOk: intg.lastTestOk || intg.last_test_ok,
                        webhookToken: intg.webhookToken || intg.webhook_token
                    };
                } else {
                    statuses[c.id] = { configured: false };
                }
            }
        } catch (e) {
            console.warn("Não foi possível carregar status de integração:", e);
        }
        return statuses;
    }

    renderCompanies(companies, intStatuses = {}) {
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

        this.companiesList.innerHTML = companies.map(company => {
            const intStatus = intStatuses[company.id] || {};
            const configured = intStatus.configured;
            const envLabel = intStatus.environment === 'production' ? 'PRODUÇÃO' : (intStatus.environment ? 'SANDBOX' : '---');
            const testOk = intStatus.lastTestOk;

            let asaasDot = 'bg-slate-300';
            let asaasLabel = 'Não configurado';
            let asaasBadge = 'text-slate-400';
            if (configured && testOk === true) { asaasDot = 'bg-emerald-500'; asaasLabel = `OK — ${envLabel}`; asaasBadge = 'text-emerald-600 font-bold'; }
            else if (configured && testOk === false) { asaasDot = 'bg-amber-400'; asaasLabel = `Config. sem teste — ${envLabel}`; asaasBadge = 'text-amber-600 font-bold'; }
            else if (configured) { asaasDot = 'bg-blue-400'; asaasLabel = `Configurado — ${envLabel}`; asaasBadge = 'text-blue-600 font-bold'; }

            return `
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
                            <span class="w-2 h-2 rounded-full ${asaasDot}"></span>
                            <span class="text-xs ${asaasBadge}">${asaasLabel}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${company.status === 'ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
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
            `;
        }).join('');

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

        this.modalTitle.textContent = company ? 'Editar Empresa' : 'Nova Empresa';

        // Reset ASAAS tab
        this._currentIntegration = null;
        document.getElementById('asaas-api-key').value = '';
        document.getElementById('asaas-webhook-token').value = '';
        document.getElementById('asaas-webhook-url').value = '';
        document.getElementById('asaas-status-banner').classList.add('hidden');
        document.getElementById('test-result').classList.add('hidden');

        if (company) {
            document.getElementById('asaas-no-company').classList.add('hidden');
            document.getElementById('asaas-form-wrapper').classList.remove('hidden');
        } else {
            document.getElementById('asaas-no-company').classList.remove('hidden');
            document.getElementById('asaas-form-wrapper').classList.add('hidden');
        }

        // Always open on "dados" tab first
        this.switchTab('dados');

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
            id,
            name: document.getElementById('company-name').value,
            slug: document.getElementById('company-slug').value,
            cnpj: document.getElementById('company-cnpj').value || null
        };

        if (!id) {
            companyData.status = 'bloqueado';
        } else {
            const existing = await companyService.getById(id);
            if (existing) companyData.status = existing.status;
        }

        try {
            const savedId = await companyService.save(companyData);
            const finalId = id || savedId;

            // Update hidden field so ASAAS tab can be used right after
            document.getElementById('company-id').value = finalId;

            // Unhide ASAAS form if this was a new company
            document.getElementById('asaas-no-company').classList.add('hidden');
            document.getElementById('asaas-form-wrapper').classList.remove('hidden');

            await this.loadCompanies();
            alert("Empresa salva! Agora configure a integração ASAAS na aba ao lado.");
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

    // ─── ASAAS Integration ──────────────────────────────────────────────────

    async _loadAsaasIntegration(companyId) {
        try {
            const result = await storage.getAdvanced('company_integrations', {
                eq: { company_id: companyId, provider: 'asaas' },
                select: 'id,company_id,environment,is_enabled,last_test_ok,last_test_at,webhook_token'
            });

            const intg = result && result.length > 0 ? result[0] : null;
            this._currentIntegration = intg;

            const wrapper = document.getElementById('asaas-form-wrapper');
            const noCompany = document.getElementById('asaas-no-company');
            wrapper.classList.remove('hidden');
            noCompany.classList.add('hidden');

            if (intg) {
                document.getElementById('asaas-env').value = intg.environment || 'sandbox';
                const token = intg.webhookToken || intg.webhook_token || '';
                document.getElementById('asaas-webhook-token').value = token;
                this._updateWebhookUrl(companyId, token);

                // Key status
                const keyStatusEl = document.getElementById('asaas-key-status');
                // We can't know if key is set from here (only service_role can see), but we check last_test_ok as proxy
                if (intg.lastTestOk === true) {
                    keyStatusEl.textContent = '✓ API Key configurada e testada com sucesso';
                    keyStatusEl.className = 'text-[10px] ml-1 font-bold text-emerald-600';
                } else if (intg.lastTestOk === false) {
                    keyStatusEl.textContent = '⚠ Último teste falhou — verifique a API Key';
                    keyStatusEl.className = 'text-[10px] ml-1 font-bold text-rose-500';
                } else {
                    keyStatusEl.textContent = 'Para alterar a key, cole a nova chave acima e salve';
                    keyStatusEl.className = 'text-[10px] ml-1 font-bold text-slate-400';
                }

                // Status banner
                this._renderAsaasStatusBanner(intg);
            } else {
                // Sem integração ainda — limpar campos
                document.getElementById('asaas-webhook-token').value = '';
                document.getElementById('asaas-webhook-url').value = 'Salve a integração para gerar a URL';
                document.getElementById('asaas-key-status').textContent = '';
                document.getElementById('asaas-status-banner').classList.add('hidden');
            }

        } catch (e) {
            console.warn("Erro ao carregar integração ASAAS:", e);
        }
    }

    _renderAsaasStatusBanner(intg) {
        const banner = document.getElementById('asaas-status-banner');
        const icon = document.getElementById('asaas-status-icon');
        const text = document.getElementById('asaas-status-text');
        const sub = document.getElementById('asaas-status-sub');

        banner.classList.remove('hidden');

        if (intg.lastTestOk === true) {
            banner.className = 'p-4 rounded-2xl border border-emerald-100 bg-emerald-50 flex items-center gap-3';
            icon.className = 'w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0';
            icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
            text.textContent = `Integração ASAAS operacional (${intg.environment === 'production' ? 'Produção' : 'Sandbox'})`;
            text.className = 'font-bold text-sm text-emerald-800';
            sub.textContent = intg.lastTestAt ? `Último teste: ${new Date(intg.lastTestAt).toLocaleString('pt-BR')}` : '';
        } else if (intg.lastTestOk === false) {
            banner.className = 'p-4 rounded-2xl border border-rose-100 bg-rose-50 flex items-center gap-3';
            icon.className = 'w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0';
            icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
            text.textContent = 'Falha na conexão ASAAS — verifique a API Key';
            text.className = 'font-bold text-sm text-rose-800';
            sub.textContent = intg.lastTestAt ? `Último teste: ${new Date(intg.lastTestAt).toLocaleString('pt-BR')}` : '';
        } else {
            banner.className = 'p-4 rounded-2xl border border-amber-100 bg-amber-50 flex items-center gap-3';
            icon.className = 'w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0';
            icon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
            text.textContent = 'Integração configurada — clique em "Testar Conexão"';
            text.className = 'font-bold text-sm text-amber-800';
            sub.textContent = '';
        }
    }

    _updateWebhookUrl(companyId, token) {
        const urlEl = document.getElementById('asaas-webhook-url');
        if (!urlEl) return;
        if (companyId && token) {
            urlEl.value = `${SUPABASE_URL}/functions/v1/webhook-pix?company_id=${companyId}&token=${token}`;
        } else {
            urlEl.value = 'Salve a integração para gerar a URL';
        }
    }

    async saveAsaasIntegration() {
        const companyId = document.getElementById('company-id').value;
        if (!companyId) {
            alert("Salve primeiro os dados da empresa antes de configurar a integração ASAAS.");
            this.switchTab('dados');
            return;
        }

        const apiKey = document.getElementById('asaas-api-key').value.trim();
        const environment = document.getElementById('asaas-env').value;
        const webhookToken = document.getElementById('asaas-webhook-token').value.trim();

        const btn = document.getElementById('btn-save-asaas');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Salvando...';
        if (window.lucide) lucide.createIcons();

        try {
            // Importar auth para obter user_id — necessário para autorização server-side
            const auth = (await import('../AuthService.js')).default;
            const requestingUserId = auth.profile?.id;

            if (!requestingUserId) {
                throw new Error("Não foi possível identificar o usuário logado. Faça login novamente.");
            }

            // Chamar Edge Function — criptografa API Key server-side e valida que user é MASTER
            const result = await storage.invoke('save-company-integration', {
                company_id: parseInt(companyId),
                api_key: apiKey || undefined,   // apenas se fornecido
                environment,
                webhook_token: webhookToken || undefined,
                requesting_user_id: requestingUserId   // ← autorização server-side
            });

            // Atualizar UI com token retornado
            const newToken = result.webhookToken || result.webhook_token || webhookToken;
            document.getElementById('asaas-webhook-token').value = newToken;
            this._updateWebhookUrl(companyId, newToken);
            document.getElementById('asaas-api-key').value = ''; // limpar campo por segurança

            const keyStatusEl = document.getElementById('asaas-key-status');
            if (apiKey) {
                keyStatusEl.textContent = '✓ Nova API Key salva com criptografia AES-256-GCM';
                keyStatusEl.className = 'text-[10px] ml-1 font-bold text-emerald-600';
            }

            await this.loadCompanies();
            alert("Integração ASAAS salva com sucesso!\nAgora clique em 'Testar Conexão' e copie a Webhook URL para o painel ASAAS.");
        } catch (err) {
            // Extrair mensagem real de erros da Edge Function (403, 400, etc)
            let msg = err.message || 'Erro desconhecido';
            try {
                if (err.context && typeof err.context.json === 'function') {
                    const body = await err.context.json();
                    msg = body.error || body.message || msg;
                }
            } catch (_) { /* usar msg original */ }
            alert('Erro ao salvar integração: ' + msg);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save" class="w-4 h-4 inline mr-1"></i> Salvar Integração';
            if (window.lucide) lucide.createIcons();
        }
    }

    async testAsaasConnection() {
        const companyId = document.getElementById('company-id').value;
        if (!companyId) {
            alert("Salve a empresa primeiro.");
            return;
        }

        const btn = document.getElementById('btn-test-asaas');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Testando...';
        if (window.lucide) lucide.createIcons();

        const resultEl = document.getElementById('test-result');
        resultEl.classList.remove('hidden');
        resultEl.className = 'p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500';
        resultEl.textContent = 'Verificando conexão com o ASAAS...';

        try {
            const result = await storage.invoke('test-asaas-connection', {
                company_id: parseInt(companyId)
            });

            if (result.ok) {
                resultEl.className = 'p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700';
                resultEl.innerHTML = `✅ ${result.message}<br><span class="text-xs font-normal text-emerald-600">${result.accountName || ''}</span>`;
                // Refresh integration data to update banner
                await this._loadAsaasIntegration(companyId);
            } else {
                resultEl.className = 'p-4 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700';
                resultEl.innerHTML = `❌ ${result.message || result.error || 'Falha ao conectar'}`;
            }
        } catch (err) {
            resultEl.className = 'p-4 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700';
            resultEl.textContent = '❌ Erro: ' + (err.message || err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="wifi" class="w-4 h-4 inline mr-1"></i> Testar Conexão';
            if (window.lucide) lucide.createIcons();
        }
    }

    async regenerateWebhookToken() {
        const companyId = document.getElementById('company-id').value;
        if (!companyId) { alert("Salve a empresa primeiro."); return; }

        if (!confirm("Ao regenerar o token, a URL de webhook atual ficará inválida. Você precisará atualizar o webhook no painel ASAAS.\n\nDeseja continuar?")) return;

        // Gerar token novo no cliente e enviar para o servidor
        const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        try {
            const auth = (await import('../AuthService.js')).default;
            const requestingUserId = auth.profile?.id;

            await storage.invoke('save-company-integration', {
                company_id: parseInt(companyId),
                webhook_token: newToken,
                requesting_user_id: requestingUserId   // ← autorização server-side
            });

            document.getElementById('asaas-webhook-token').value = newToken;
            this._updateWebhookUrl(companyId, newToken);
            alert("Token regenerado! Atualize o webhook no painel ASAAS com a nova URL.");
        } catch (err) {
            alert("Erro ao regenerar token: " + err.message);
        }
    }

    copyWebhookUrl() {
        const urlEl = document.getElementById('asaas-webhook-url');
        const url = urlEl.value;
        if (!url || url.includes('Salve')) { alert("Salve a integração primeiro."); return; }

        navigator.clipboard.writeText(url).then(() => {
            alert("URL do Webhook copiada!\n\nCole essa URL na seção 'Webhooks' do painel ASAAS desta empresa.");
        }).catch(() => {
            // Fallback para navegadores sem clipboard API
            urlEl.select();
            document.execCommand('copy');
            alert("URL copiada!");
        });
    }

    toggleApiKeyVisibility() {
        const input = document.getElementById('asaas-api-key');
        const icon = document.getElementById('toggle-key-icon');
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        if (window.lucide) lucide.createIcons();
    }

    // ─── Finance Modal ──────────────────────────────────────────────────────

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

        const hasOverdue = await billingService.hasCompanyOverdue(id);
        const override = document.getElementById('finance-access-override').checked;

        const banner = document.getElementById('finance-access-banner');
        const iconDiv = document.getElementById('finance-status-icon');
        const title = document.getElementById('finance-status-title');
        const desc = document.getElementById('finance-status-desc');
        const blockBtn = document.getElementById('finance-manual-block');

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
                const statusClass = inst.status === 'PAGA' ? 'text-emerald-600 font-black' : (inst.status === 'VENCIDA' ? 'text-rose-600 font-black' : 'text-amber-600 font-black');
                return `
                    <tr>
                        <td class="px-6 py-4 font-medium text-slate-700">${DateHelper.formatLocal(inst.dueDate)}</td>
                        <td class="px-6 py-4 font-bold text-slate-900">R$ ${parseFloat(inst.amount).toFixed(2)}</td>
                        <td class="px-6 py-4 ${statusClass}">${inst.status}</td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex justify-end gap-2">
                                ${inst.status !== 'PAGA' ? `
                                    <button onclick="financeMarkAsPaid(${inst.id})" class="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200">Baixar</button>
                                ` : `
                                    <button onclick="financeVoucher(${inst.id})" class="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl transition-all" title="Ver Comprovante">
                                        <i data-lucide="receipt" class="w-4 h-4"></i>
                                    </button>
                                `}
                                <button onclick="financeEdit(${inst.id})" class="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all" title="Editar">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button onclick="financeDelete(${inst.id})" class="p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-xl transition-all" title="Excluir">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();
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
            REF.MÊS: ${inst.competenceMonth}
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
                this.currentFinanceCompany = company;
                await this.refreshFinanceInfo();
                await this.loadCompanies();
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
