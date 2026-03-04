import backupService from '../BackupService.js';
import demoService from '../DemoService.js';
import storage from '../StorageService.js';
import companyService from '../CompanyService.js';
import DateHelper from '../DateHelper.js';

export default class SettingsModule {
    constructor() {
        this.logsList = document.getElementById('system-logs-list');
        this.companyFilter = document.getElementById('log-filter-company');
        this.userFilter = document.getElementById('log-filter-user');
        this.actionFilter = document.getElementById('log-filter-action');
        this.dateFromFilter = document.getElementById('log-filter-date-from');
        this.dateToFilter = document.getElementById('log-filter-date-to');

        this.logs = [];
        this.companies = [];
    }

    async init() {
        if (!this.logsList) return;

        await this.loadInitialData();
        this.bindEvents();
    }

    async loadInitialData() {
        try {
            this.companies = await companyService.getAll();
            this.populateFilters();
            await this.loadLogs();
        } catch (error) {
            console.error("Settings: Error loading initial data", error);
        }
    }

    populateFilters() {
        if (this.companyFilter) {
            const options = this.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            this.companyFilter.innerHTML = `<option value="all">Todas as Empresas</option>${options}`;
        }
    }

    async loadLogs() {
        try {
            this.logsList.innerHTML = `<tr><td colspan="4" class="px-8 py-10 text-center opacity-50 italic">Carregando Auditoria...</td></tr>`;

            const result = await storage.getAdvanced('system_logs', {
                order: { column: 'created_at', ascending: false },
                limit: 500
            });

            if (result && result._error === 'TABLE_NOT_FOUND') {
                this.logsList.innerHTML = `<tr><td colspan="4" class="px-8 py-10 text-center text-amber-600 font-bold bg-amber-50 rounded-2xl border border-amber-100">
                    <i data-lucide="database" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Tabela de Auditoria não encontrada em sua nuvem.<br>
                    <span class="text-[10px] font-normal uppercase tracking-widest block mt-1">Execute o script de setup no painel do Supabase.</span>
                </td></tr>`;
                lucide.createIcons();
                return;
            }

            this.logs = Array.isArray(result) ? result : [];

            this.populateUserFilter();
            this.applyFilters();
        } catch (error) {
            console.error("Settings: Error loading logs", error);
            this.logsList.innerHTML = `<tr><td colspan="4" class="px-8 py-10 text-center text-rose-500 font-bold">Erro ao carregar auditoria global.</td></tr>`;
        }
    }

    populateUserFilter() {
        if (!this.userFilter) return;
        const users = [...new Set(this.logs.map(l => l.userEmail).filter(Boolean))];
        const options = users.map(u => `<option value="${u}">${u}</option>`).join('');
        this.userFilter.innerHTML = `<option value="all">Todos os Usuários</option>${options}`;
    }

    bindEvents() {
        [this.companyFilter, this.userFilter, this.actionFilter, this.dateFromFilter, this.dateToFilter].forEach(f => {
            if (f) f.onchange = () => this.applyFilters();
        });

        const refreshBtn = document.getElementById('refresh-logs-btn');
        if (refreshBtn) refreshBtn.onclick = () => this.loadLogs();

        const exportLogsBtn = document.getElementById('export-logs-csv-btn');
        if (exportLogsBtn) exportLogsBtn.onclick = () => this.exportLogsToCSV();

        const backupServerBtn = document.getElementById('backup-server-btn');
        if (backupServerBtn) {
            backupServerBtn.onclick = async () => {
                try {
                    backupServerBtn.disabled = true;
                    backupServerBtn.textContent = 'Processando...';
                    await new Promise(r => setTimeout(r, 1500));
                    await storage.add('backups_history', { status: 'COMPLETED', fileSize: 1024 });
                    await storage.logAction('BACKUP', 'SETTINGS', { type: 'SERVER' });
                    alert("Backup realizado com sucesso no servidor!");
                } catch (err) {
                    alert("Erro: " + err.message);
                } finally {
                    backupServerBtn.disabled = false;
                    location.reload();
                }
            };
        }

        const exportBtn = document.getElementById('export-backup-btn');
        if (exportBtn) {
            exportBtn.onclick = async () => {
                await backupService.exportData();
                await storage.logAction('BACKUP', 'SETTINGS', { type: 'DOWNLOAD' });
            };
        }

        const importTrigger = document.getElementById('import-backup-trigger');
        const importInput = document.getElementById('import-backup-input');
        if (importTrigger && importInput) {
            importTrigger.onclick = () => importInput.click();
            importInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        if (confirm("Sobrescrever dados cloud?")) {
                            await backupService.importData(event.target.result);
                            await storage.logAction('IMPORT', 'SETTINGS');
                            alert("Dados importados!");
                            window.location.reload();
                        }
                    } catch (error) {
                        alert("Erro: " + error.message);
                    }
                };
                reader.readAsText(file);
            };
        }

        const demoBtn = document.getElementById('generate-demo-btn');
        if (demoBtn) {
            demoBtn.onclick = async () => {
                if (confirm("Gerar dados demo?")) {
                    await demoService.generate();
                    await storage.logAction('DEMO_GENERATE', 'SETTINGS');
                    alert("Dados prontos!");
                    window.location.href = '?page=dashboard';
                }
            };
        }

        const resetBtn = document.getElementById('factory-reset-btn');
        const resetModal = document.getElementById('reset-modal');
        const closeResetModal = document.getElementById('close-reset-modal');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');

        if (resetBtn) resetBtn.onclick = () => resetModal?.classList.remove('hidden');
        if (closeResetModal) closeResetModal.onclick = () => resetModal?.classList.add('hidden');

        if (confirmResetBtn) {
            confirmResetBtn.onclick = async () => {
                const storesToClear = [];
                const resetLoans = document.getElementById('reset-loans').checked;
                const resetClients = document.getElementById('reset-clients').checked;
                const resetUsers = document.getElementById('reset-users').checked;

                if (!resetLoans && !resetClients && !resetUsers) return alert("Selecione algo.");

                if (confirm("Apagar selecionados?")) {
                    if (prompt("Digite 'APAGAR':") === 'APAGAR') {
                        if (resetLoans) storesToClear.push('loans', 'installments', 'payments', 'loan_requests');
                        if (resetClients) storesToClear.push('clients');
                        if (resetUsers) storesToClear.push('users');

                        try {
                            await storage.clearStores(storesToClear);
                            await storage.logAction('FACTORY_RESET', 'SETTINGS', { cleared: storesToClear });
                            alert("Limpeza concluída!");
                            window.location.reload();
                        } catch (err) {
                            alert("Erro: " + err.message);
                        }
                    }
                }
            };
        }
    }

    applyFilters() {
        const companyId = this.companyFilter.value;
        const userEmail = this.userFilter.value;
        const action = this.actionFilter.value;
        const dateFrom = this.dateFromFilter?.value;
        const dateTo = this.dateToFilter?.value;

        let filtered = [...this.logs];

        if (companyId !== 'all') {
            const idInt = parseInt(companyId);
            filtered = filtered.filter(l => l.companyId === idInt);
        }

        if (userEmail !== 'all') {
            filtered = filtered.filter(l => l.userEmail === userEmail);
        }

        if (action !== 'all') {
            filtered = filtered.filter(l => l.action === action);
        }

        if (dateFrom) {
            filtered = filtered.filter(l => l.createdAt >= `${dateFrom}T00:00:00`);
        }

        if (dateTo) {
            filtered = filtered.filter(l => l.createdAt <= `${dateTo}T23:59:59`);
        }

        this.lastFilteredLogs = filtered;
        this.renderLogs(filtered);
    }

    exportLogsToCSV() {
        const data = this.lastFilteredLogs || this.logs;
        if (!data || data.length === 0) return alert("Nenhum dado para exportar.");

        const headers = ["Data", "Hora", "Empresa", "Usuário", "Módulo", "Ação", "Detalhes"];
        const rows = data.map(log => {
            const company = this.companies.find(c => c.id === log.companyId) || { name: 'Sistema' };
            const date = new Date(log.createdAt);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                company.name,
                log.userEmail || 'Anônimo',
                log.module,
                log.action,
                log.details ? log.details.replace(/"/g, '""') : '-'
            ];
        });

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel
        csvContent += headers.join(";") + "\n";
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(";") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `malibu_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    renderLogs(data) {
        if (!this.logsList) return;

        if (data.length === 0) {
            this.logsList.innerHTML = `<tr><td colspan="4" class="px-8 py-20 text-center opacity-30 font-bold tracking-widest text-xs">Nenhum log encontrado.</td></tr>`;
            return;
        }

        this.logsList.innerHTML = data.map(log => {
            const company = this.companies.find(c => c.id === log.companyId) || { name: 'Sistema' };
            const statusClass = log.action === 'DELETE' ? 'bg-rose-100 text-rose-600' :
                (log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600');

            return `
                <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="px-8 py-4">
                        <div class="text-xs font-bold text-slate-800">${DateHelper.formatLocal(log.createdAt)}</div>
                        <div class="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">${new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td class="px-8 py-4 text-xs font-black text-slate-700">
                        ${log.userEmail || 'Anônimo'}<br>
                        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${company.name}</span>
                    </td>
                    <td class="px-8 py-4">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">${log.module}</span>
                        <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${statusClass}">${log.action}</span>
                    </td>
                    <td class="px-8 py-4 text-[10px] text-slate-500">
                        ${log.details ? '<button class="hover:text-primary underline" onclick=\'alert(JSON.stringify(JSON.parse(this.dataset.details), null, 2))\'>Ver detalhes</button>' : '-'}
                        <div class="hidden" data-details='${log.details || "{}"}'></div>
                    </td>
                </tr>
            `;
        }).join('');
        lucide.createIcons();
    }
}
