import auth from '../AuthService.js';
import storage from '../StorageService.js';
import installmentService from '../InstallmentService.js';
import DateHelper from '../DateHelper.js';

export default class ClientPaymentsModule {
    async init() {
        this.client = auth.profile;
        if (!this.client) return;

        this.installments = [];
        this.currentFilter = 'ALL';
        this.realtimeChannel = null;

        await this.loadData();
        this.renderStats();
        this.renderList();
        this.bindEvents();
        this.setupRealtime();
    }

    async loadData() {
        const all = await installmentService.getAll();
        // Filter by current client (linked via loan -> client)
        this.installments = all.filter(i => i.loan && i.loan.clientid === this.client.id);

        // Initial sorting
        this.installments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    }

    setupRealtime() {
        // Subscribe to any changes in installments
        this.realtimeChannel = installmentService.subscribe(this.client.id, async (payload) => {
            console.log("Realtime Update Received (Installments):", payload);
            await this.loadData();
            this.renderStats();
            this.renderList();

            // If modal is open and the payment was for that installment, we might want to close it or show success
            if (payload.status === 'PAID') {
                const modal = document.getElementById('pix-modal');
                if (!modal.classList.contains('hidden')) {
                    // Logic to check if this was the paying one could be added
                    // For now we just refresh everything
                }
            }
        });
    }

    renderStats() {
        const paid = this.installments.filter(i => i.status === 'PAID').length;
        const pending = this.installments.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').length;

        document.getElementById('stats-paid-count').textContent = paid;
        document.getElementById('stats-pending-count').textContent = pending;
    }

    renderList() {
        const container = document.getElementById('payments-list');
        if (!container) return;

        let filtered = this.installments;
        if (this.currentFilter !== 'ALL') {
            filtered = this.installments.filter(i => i.status === this.currentFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">Nenhuma parcela encontrada.</td></tr>';
            return;
        }

        container.innerHTML = filtered.map(inst => {
            const statusClass = this.getStatusClass(inst.status);
            const canPay = inst.status === 'PENDING' || inst.status === 'OVERDUE';

            return `
                <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">#${inst.number}</div>
                            <span class="text-xs font-bold text-slate-900">${inst.loan?.loanCode || '---'}</span>
                        </div>
                    </td>
                    <td class="px-8 py-5 text-xs text-slate-500 font-medium">${DateHelper.formatLocal(inst.dueDate)}</td>
                    <td class="px-8 py-5 text-sm font-black text-slate-900">R$ ${parseFloat(inst.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusClass}">
                            ${this.translateStatus(inst.status)}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        ${canPay ? `
                            <button onclick="openPixModal(${inst.id})" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                                Pagar Agora
                            </button>
                        ` : `
                            <div class="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-end gap-1">
                                <i data-lucide="check" class="w-3 h-3 text-emerald-500"></i> Efetuado
                            </div>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    getStatusClass(status) {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-600';
            case 'OVERDUE': return 'bg-rose-50 text-rose-600';
            default: return 'bg-amber-50 text-amber-600';
        }
    }

    translateStatus(status) {
        switch (status) {
            case 'PAID': return 'Paga';
            case 'OVERDUE': return 'Vencida';
            default: return 'Pendente';
        }
    }

    bindEvents() {
        const filterEl = document.getElementById('payment-filter-status');
        if (filterEl) {
            filterEl.onchange = (e) => {
                this.currentFilter = e.target.value;
                this.renderList();
            };
        }

        window.openPixModal = async (id) => {
            const inst = this.installments.find(i => i.id === id);
            if (!inst) return;

            const modal = document.getElementById('pix-modal');
            const amountEl = document.getElementById('pix-amount');
            const qrContainer = document.getElementById('pix-qr-container');
            const copyBtn = document.getElementById('pix-copy-btn');

            amountEl.textContent = `R$ ${parseFloat(inst.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            modal.classList.remove('hidden');

            try {
                // Call Edge Function
                const charge = await storage.invoke('create-pix-charge', { installment_id: id });

                qrContainer.innerHTML = `<img src="${charge.qrCodeUrl}" class="w-full h-full object-contain rounded-xl">`;

                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(charge.copyPaste);
                    alert("Código PIX copiado!");
                };
            } catch (err) {
                console.error("Error creating PIX charge:", err);
                qrContainer.innerHTML = `<div class="text-rose-500 text-xs font-bold text-center p-4">Erro ao gerar cobrança. Tente novamente.</div>`;
            }
        };

        const closeModal = () => {
            document.getElementById('pix-modal').classList.add('hidden');
        };

        document.querySelectorAll('.close-pix-modal').forEach(btn => btn.onclick = closeModal);
    }
}
