import backupService from '../BackupService.js';
import demoService from '../DemoService.js';
import storage from '../StorageService.js';

export default class SettingsModule {
    async init() {
        this.bindEvents();
    }

    bindEvents() {
        const resetBtn = document.getElementById('factory-reset-btn');
        const resetModal = document.getElementById('reset-modal');
        const closeResetModal = document.getElementById('close-reset-modal');
        const confirmResetBtn = document.getElementById('confirm-reset-btn');

        if (resetBtn && resetModal) {
            resetBtn.onclick = () => {
                resetModal.classList.remove('hidden');
            };
        }

        if (closeResetModal) {
            closeResetModal.onclick = () => {
                resetModal.classList.add('hidden');
            };
        }

        if (confirmResetBtn) {
            confirmResetBtn.onclick = async () => {
                const storesToClear = [];
                const resetLoans = document.getElementById('reset-loans').checked;
                const resetClients = document.getElementById('reset-clients').checked;
                const resetUsers = document.getElementById('reset-users').checked;

                if (!resetLoans && !resetClients && !resetUsers) {
                    alert("Por favor, selecione ao menos uma opção.");
                    return;
                }

                const confirmText = resetUsers ?
                    "⚠️ ATENÇÃO: Apagar 'Usuários' irá deslogar você imediatamente. Continuar?" :
                    "Deseja realmente apagar os dados selecionados?";

                if (confirm(confirmText)) {
                    if (resetLoans) storesToClear.push('loans', 'installments', 'payments', 'loan_requests');
                    if (resetClients) storesToClear.push('clients');
                    if (resetUsers) storesToClear.push('users');

                    try {
                        const promptMsg = "Para confirmar a exclusão definitiva, digite 'APAGAR':";
                        if (prompt(promptMsg) === 'APAGAR') {
                            await storage.clearStores(storesToClear);

                            if (resetUsers) {
                                alert("Dados apagados. O sistema será reiniciado.");
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = 'index.php';
                            } else {
                                alert("Dados selecionados foram apagados com sucesso.");
                                resetModal.classList.add('hidden');
                                window.location.reload();
                            }
                        }
                    } catch (err) {
                        alert("Erro ao limpar dados: " + err.message);
                    }
                }
            };
        }

        const demoBtn = document.getElementById('generate-demo-btn');
        if (demoBtn) {
            demoBtn.onclick = async () => {
                if (confirm("Deseja gerar dados de demonstração? Isso facilitará o teste das funcionalidades.")) {
                    await demoService.generate();
                    alert("Dados de demonstração gerados com sucesso!");
                    window.location.href = '?page=dashboard';
                }
            };
        }
        const exportBtn = document.getElementById('export-backup-btn');
        if (exportBtn) {
            exportBtn.onclick = async () => {
                await backupService.exportData();
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
                        if (confirm("Isso irá sobrescrever seus dados locais atuais. Deseja continuar?")) {
                            await backupService.importData(event.target.result);
                            alert("Dados importados com sucesso! O sistema será reiniciado.");
                            window.location.reload();
                        }
                    } catch (error) {
                        alert("Erro ao importar backup: " + error.message);
                    }
                };
                reader.readAsText(file);
            };
        }
    }
}
