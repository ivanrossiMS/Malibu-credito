import loanRequestService from '../LoanRequestService.js';
import loanService from '../LoanService.js';
import clientService from '../ClientService.js';
import DateHelper from '../DateHelper.js';

export default class LoanRequestsModule {
    async init() {
        this.currentFilter = 'todos'; // Aba padrão
        await this.renderCards();
        await this.renderRequests();
        this.bindEvents();
    }

    async renderCards() {
        const requests = await loanRequestService.getAll();

        let pendenteCount = 0; let pendenteAmt = 0;
        let aprovadoCount = 0; let aprovadoAmt = 0;
        let negadoCount = 0; let negadoAmt = 0;

        requests.forEach(r => {
            const val = parseFloat(r.amount) || 0;
            if (r.status === 'pendente') {
                pendenteCount++;
                pendenteAmt += val;
            } else if (r.status === 'aprovado') {
                aprovadoCount++;
                aprovadoAmt += val;
            } else if (r.status === 'rejeitado') {
                negadoCount++;
                negadoAmt += val;
            }
        });

        // Atualiza a tela
        const el = (id) => document.getElementById(id);
        const formatBRL = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (el('card-pendente-count')) el('card-pendente-count').textContent = pendenteCount;
        if (el('card-pendente-amount')) el('card-pendente-amount').textContent = formatBRL(pendenteAmt);

        if (el('card-aprovado-count')) el('card-aprovado-count').textContent = aprovadoCount;
        if (el('card-aprovado-amount')) el('card-aprovado-amount').textContent = formatBRL(aprovadoAmt);

        if (el('card-negado-count')) el('card-negado-count').textContent = negadoCount;
        if (el('card-negado-amount')) el('card-negado-amount').textContent = formatBRL(negadoAmt);
    }

    async renderRequests() {
        const listContainer = document.getElementById('requests-list');
        if (!listContainer) return;

        let requests = await loanRequestService.getAll();

        // Aplica o filtro atual ('todos', 'pendente', 'aprovado', 'rejeitado')
        if (this.currentFilter !== 'todos') {
            requests = requests.filter(r => r.status === this.currentFilter);
        }

        // Ordenar: mais recentes primeiro
        requests.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at).getTime();
            const dateB = new Date(b.createdAt || b.created_at).getTime();
            return dateB - dateA;
        });

        if (requests.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                        <p>Nenhuma solicitação encontrada para o filtro "${this.currentFilter}".</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        for (const req of requests) {
            // Obter cliente atualizado via ClientService
            let client = req.client;
            if (req.clientId) {
                const c = await clientService.getById(req.clientId);
                if (c) client = c;
            }

            // Configurar Status Badge e Botões de Ação
            let statusBadge = '';
            let actionButtons = '';

            if (req.status === 'pendente') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">PENDENTE</span>`;
                actionButtons = `
                    <button onclick="openApprovalModal(${req.id})" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors" title="Aprovar">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                    </button>
                    <button onclick="rejectRequest(${req.id})" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Rejeitar">
                        <i data-lucide="x-circle" class="w-5 h-5"></i>
                    </button>
                `;
            } else if (req.status === 'aprovado') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">APROVADO</span>`;
                actionButtons = `<span class="text-[10px] font-black tracking-widest text-emerald-500 uppercase flex items-center gap-1 justify-end"><i data-lucide="check" class="w-4 h-4"></i> Concluído</span>`;
            } else if (req.status === 'rejeitado') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">REJEITADO</span>`;
                actionButtons = `<span class="text-[10px] font-black tracking-widest text-rose-500 uppercase flex items-center gap-1 justify-end"><i data-lucide="x" class="w-4 h-4"></i> Negado</span>`;
            }

            const avatarHtml = client && client.avatar
                ? `<img src="${client.avatar}" class="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0">`
                : `<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">${client?.name ? client.name.charAt(0) : '?'}</div>`;

            // Extract PIX key from description
            let pixKey = '---';
            if (req.description) {
                const pixMatch = req.description.match(/CHAVE PIX:\s*(.*)/);
                if (pixMatch) pixKey = pixMatch[1];
            }

            html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-8 py-4 text-sm text-slate-500 text-center border-l-2 ${req.status === 'pendente' ? 'border-amber-400 bg-amber-50/10' : (req.status === 'aprovado' ? 'border-emerald-400' : 'border-rose-400')}">
                    ${DateHelper.formatLocal(req.createdAt || req.created_at)}
                </td>
                <td class="px-8 py-4 text-left">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <p class="font-bold text-slate-900 leading-tight">${client?.name || '---'}</p>
                            <p class="text-xs text-slate-400 mt-0.5">${client?.phone || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-4 text-xs font-black text-emerald-600 text-left">
                    ${pixKey}
                </td>
                <td class="px-8 py-4 text-sm font-medium text-slate-600 text-left">
                    ${req.client?.city || '<span class="italic text-slate-400">Não informada</span>'}
                </td>
                <td class="px-8 py-4 text-sm font-bold text-slate-900 text-center">
                    R$ ${parseFloat(req.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td class="px-8 py-4 text-sm font-bold text-emerald-600 text-center">
                    ${req.total_amount ? 'R$ ' + parseFloat(req.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '<span class="text-slate-300">-</span>'}
                </td>
                <td class="px-8 py-4 text-sm text-slate-600 text-center">
                    ${req.installments || '?'}x ${String(req.frequency || '').toLowerCase() === 'diaria' || String(req.frequency || '').toLowerCase() === 'diario' ? 'Diário' : (String(req.frequency || '').toLowerCase() === 'semanal' ? 'Semanal' : (String(req.frequency || '').toLowerCase() === 'mensal' ? 'Mensal' : 'Não Declarado'))}
                </td>
                <td class="px-8 py-4 text-center">
                    ${statusBadge}
                </td>
                <td class="px-8 py-4 text-right flex justify-end gap-2">
                    ${actionButtons}
                </td>
            </tr>
            `;
        }

        listContainer.innerHTML = html;

        lucide.createIcons();
    }

    bindEvents() {
        // Lógica de Filtros (Tabs)
        document.querySelectorAll('.filter-tab').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.filter-tab').forEach(b => {
                    b.classList.remove('active', 'bg-slate-800', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'text-slate-500', 'border', 'border-slate-200');
                });
                btn.classList.add('active', 'bg-slate-800', 'text-white', 'shadow-md');
                btn.classList.remove('bg-white', 'text-slate-500', 'border', 'border-slate-200');

                this.currentFilter = btn.dataset.tab;
                this.renderRequests();
            };
        });

        const modal = document.getElementById('approval-modal');
        const form = document.getElementById('approval-form');

        window.openApprovalModal = async (id) => {
            const req = await loanRequestService.getById(id);
            if (!req) return;

            document.getElementById('req-id').value = req.id;
            document.getElementById('req-client-name').textContent = req.client?.name || '---';
            document.getElementById('req-amount').value = req.amount;
            document.getElementById('req-installments').value = req.installments;
            document.getElementById('req-frequency').value = req.frequency === 'diaria' ? 'diario' : 'mensal';
            document.getElementById('req-interest').value = '';

            // Extract PIX key from description for display
            let pixKey = '---';
            if (req.description) {
                const pixMatch = req.description.match(/CHAVE PIX:\s*(.*)/);
                if (pixMatch) pixKey = pixMatch[1];
            }
            document.getElementById('req-pix-display').textContent = pixKey;

            // Set start date: Stored field > Parse from description > Default tomorrow
            let startDate = req.startDate || req.start_date;

            if (!startDate && req.description) {
                // Tenta extrair da descrição: "Data da 1ª Parcela: DD/MM/AAAA"
                const match = req.description.match(/Data da 1ª Parcela:\s*(\d{2})\/(\d{2})\/(\d{4})/);
                if (match) {
                    startDate = `${match[3]}-${match[2]}-${match[1]}`;
                }
            }

            document.getElementById('req-startDate').value = startDate || DateHelper.addDays(DateHelper.getTodayStr(), 1);

            modal.classList.remove('hidden');
            this.calculateApprovalPreview();
        };

        const previewInputs = ['req-amount', 'req-interest', 'req-interest-type', 'req-installments'];
        previewInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = () => this.calculateApprovalPreview();
        });

        this.calculateApprovalPreview = () => {
            const amount = parseFloat(document.getElementById('req-amount').value) || 0;
            const interest = parseFloat(document.getElementById('req-interest').value) || 0;
            const installments = parseInt(document.getElementById('req-installments').value) || 0;
            const interestType = document.getElementById('req-interest-type').value;
            const frequency = document.getElementById('req-frequency').value;

            if (amount > 0 && installments > 0) {
                let installmentValue = 0;
                let total = 0;

                if (frequency === 'semanal') {
                    installmentValue = (amount / installments) + interest;
                    total = installmentValue * installments;
                } else {
                    total = amount + interest;
                    installmentValue = total / installments;
                }
                document.getElementById('req-total-preview-display').textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                document.getElementById('req-total-preview-display').textContent = 'R$ 0,00';
            }
        };

        window.rejectRequest = async (id) => {
            if (confirm("Deseja realmente rejeitar esta solicitação?")) {
                const req = await loanRequestService.getById(id);
                if (!req) return;

                await loanRequestService.updateStatus(id, 'rejeitado');
                this.renderRequests();

                // Enviar mensagem de WhatsApp
                if (req.client && req.client.phone) {
                    const phone = String(req.client.phone).replace(/\D/g, '');
                    if (phone) {
                        const amountFormatted = parseFloat(req.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const msg = encodeURIComponent(
                            `Olá ${req.client.name.split(' ')[0]} O seu empréstimo de *R$ ${amountFormatted}* foi *Negado*! Qualquer dúvida, estamos à disposição!`
                        );
                        const url = `https://wa.me/${phone}?text=${msg}`;
                        window.open(url, '_blank');
                    }
                }
            }
        };

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const id = parseInt(document.getElementById('req-id').value);
                const req = await loanRequestService.getById(id);

                const amount = parseFloat(document.getElementById('req-amount').value);
                const interestRate = parseFloat(document.getElementById('req-interest').value);
                const interestType = document.getElementById('req-interest-type').value;
                const numInstallments = parseInt(document.getElementById('req-installments').value);
                const frequency = document.getElementById('req-frequency').value;

                // Simple calculation for approval
                let installmentValue = 0;
                let totalAmount = 0;

                if (frequency === 'semanal') {
                    installmentValue = (amount / numInstallments) + interestRate;
                    totalAmount = installmentValue * numInstallments;
                } else {
                    totalAmount = amount + interestRate;
                    installmentValue = totalAmount / numInstallments;
                }

                const loanData = {
                    clientid: req.clientid || req.clientId,
                    amount: amount,
                    interestRate: interestRate,
                    interestType: interestType,
                    numInstallments: numInstallments,
                    installmentValue: installmentValue,
                    frequency: frequency,
                    startDate: document.getElementById('req-startDate').value,
                    notes: req.description || ''
                };

                try {
                    await loanService.createLoan(loanData);

                    // Sincroniza as edições feitas pelo Admin de volta para a tabela de 'loan_requests'
                    // Utiliza storage.getById() para obter registro puro (sem joins) evitando PGRST errors no put()
                    const { default: storage } = await import('../StorageService.js');
                    const originalReq = await storage.getById('loan_requests', id);

                    if (originalReq) {
                        originalReq.amount = amount;
                        originalReq.installments = numInstallments;
                        originalReq.frequency = frequency;
                        originalReq.status = 'aprovado';
                        // Removemos a injeção do total_amount pois o PostgreSQL schema não possui esta coluna. (Evita erro PGRST204)
                        await storage.put('loan_requests', originalReq);
                    }

                    modal.classList.add('hidden');
                    this.renderRequests();

                    // Enviar mensagem de WhatsApp
                    if (req.client && req.client.phone) {
                        const phone = String(req.client.phone).replace(/\D/g, '');
                        if (phone) {
                            const amountFormatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            const totalAmountFormatted = totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            const msg = encodeURIComponent(
                                `Olá ${req.client.name.split(' ')[0]} O seu empréstimo de *R$ ${amountFormatted}* (total com juros R$ ${totalAmountFormatted}) acaba de ser *Aprovado*! As parcelas já foram geradas no sistema. Acesse o seu painel em nosso site para conferir. Qualquer dúvida, estamos à disposição!`
                            );
                            const url = `https://wa.me/${phone}?text=${msg}`;
                            window.open(url, '_blank');
                        }
                    }

                    alert("Empréstimo aprovado e contrato gerado com sucesso!");
                } catch (error) {
                    alert(error.message);
                }
            };
        }

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => modal.classList.add('hidden');
        });
    }
}

