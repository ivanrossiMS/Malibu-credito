import storage from '../StorageService.js';
import auth from '../AuthService.js';
import loanService from '../LoanService.js';
import loanRequestService from '../LoanRequestService.js';

export default class ClientLoanRequestModule {
    async init() {
        if (!auth.isAuthenticated()) return;
        this.client = await this.getCurrentClient();
        if (!this.client) return;

        this.interestRate = 0.035; // 3.5% am
        this.bindEvents();
        this.updateSummary();
        lucide.createIcons();
    }

    async getCurrentClient() {
        const clients = await storage.getAll('clients');
        return clients.find(c => c.userId === auth.currentUser.id);
    }

    bindEvents() {
        const amountInput = document.getElementById('loan-amount');
        const instInput = document.getElementById('loan-installments');
        const freqInputs = document.querySelectorAll('input[name="loan-frequency"]');
        const submitBtn = document.getElementById('submit-loan-request');
        const startDateInput = document.getElementById('loan-start-date');

        amountInput.oninput = () => {
            document.getElementById('amount-display').textContent = this.formatCurrency(amountInput.value);
            this.updateSummary();
        };

        instInput.oninput = () => {
            document.getElementById('installments-display').textContent = instInput.value + 'x';
            this.updateSummary();
        };

        freqInputs.forEach(input => {
            input.onchange = () => this.updateSummary();
        });

        if (startDateInput) {
            startDateInput.onchange = () => this.updateSummary();
        }

        submitBtn.onclick = () => this.submitRequest();
    }

    updateSummary() {
        const amount = parseFloat(document.getElementById('loan-amount').value);
        const installmentsValue = parseInt(document.getElementById('loan-installments').value);
        const frequencyValue = document.querySelector('input[name="loan-frequency"]:checked').value;
        const startDateInput = document.getElementById('loan-start-date');

        document.getElementById('sum-amount').textContent = this.formatCurrency(amount);
        document.getElementById('sum-installments').textContent = installmentsValue + 'x';
        document.getElementById('sum-frequency').textContent = frequencyValue === 'diaria' ? 'Diário' : (frequencyValue === 'semanal' ? 'Semanal' : 'Mensal');

        const sumDate = document.getElementById('sum-start-date');
        if (startDateInput && startDateInput.value && sumDate) {
            const dt = startDateInput.value.split('-');
            sumDate.textContent = `${dt[2]}/${dt[1]}/${dt[0]}`;
        } else if (sumDate) {
            sumDate.textContent = '--/--/----';
        }
    }

    async submitRequest() {
        const submitBtn = document.getElementById('submit-loan-request');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i><span>ENVIANDO...</span>';
        lucide.createIcons();

        try {
            const amount = parseFloat(document.getElementById('loan-amount').value);
            const installments = parseInt(document.getElementById('loan-installments').value);
            const frequency = document.querySelector('input[name="loan-frequency"]:checked').value;
            const startDate = document.getElementById('loan-start-date').value;
            const pixKey = document.getElementById('loan-pix-key').value;
            const description = document.getElementById('loan-desc').value;

            if (!pixKey) {
                alert("Por favor, informe uma Chave PIX para receber o valor.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Lançar Solicitação</span><i data-lucide="send" class="w-5 h-5"></i>';
                lucide.createIcons();
                return;
            }

            if (!startDate) {
                alert("Por favor, escolha uma Data da 1ª Parcela para a simulação.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Lançar Solicitação</span><i data-lucide="send" class="w-5 h-5"></i>';
                lucide.createIcons();
                return;
            }

            const dt = startDate.split('-');
            const formattedDate = `${dt[2]}/${dt[1]}/${dt[0]}`;
            const finalDescription = `CHAVE PIX: ${pixKey}\nData da 1ª Parcela: ${formattedDate}\n\nObservações Adicionais:\n${description}`;

            const loanRequest = {
                clientid: this.client.id,
                amount: amount,
                installments: installments,
                frequency: frequency,
                description: finalDescription,
                status: 'pendente'
            };

            // Use the dedicated LoanRequestService
            await loanRequestService.save(loanRequest);

            alert("Sua solicitação foi enviada com sucesso! Analisaremos seu perfil e retornaremos em breve.");

            // Atualizar UI sem recarregar a página (PWA mode)
            document.getElementById('loan-amount').value = 1500;
            document.getElementById('loan-installments').value = 6;
            document.getElementById('loan-start-date').value = '';
            document.getElementById('loan-pix-key').value = '';
            document.getElementById('loan-desc').value = '';
            this.updateSummary();

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>SOLICITAR AGORA</span><i data-lucide="send" class="w-5 h-5"></i>';
            lucide.createIcons();
        } catch (error) {
            alert("Erro ao enviar solicitação: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>SOLICITAR AGORA</span><i data-lucide="send" class="w-5 h-5"></i>';
            lucide.createIcons();
        }
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
}
