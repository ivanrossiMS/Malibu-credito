import installmentService from '../InstallmentService.js';
import templateService from '../TemplateService.js';
import clientService from '../ClientService.js';
import paymentService from '../PaymentService.js';
import storage from '../StorageService.js';
import DateHelper from '../DateHelper.js';

export default class InstallmentsModule {
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlStatus = urlParams.get('status');
        const urlClientId = urlParams.get('client_id');

        this.currentStatus = urlStatus || 'todas';
        this.currentClient = urlClientId || '';
        this.currentDateType = '';
        this.currentDateCustom = '';
        this.sortConfig = { field: 'dueDate', direction: 'asc' };
        this.currentPage = 1;
        this.itemsPerPage = 36;

        // Ajusta a interface visual se vier de um link direcionado
        if (urlStatus) {
            document.querySelectorAll('.filter-status').forEach(b => {
                if (b.dataset.status === urlStatus) {
                    b.classList.add('bg-primary', 'text-white');
                    b.classList.remove('bg-slate-100', 'text-slate-500');
                } else {
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-slate-100', 'text-slate-500');
                }
            });
        }

        await this.populateFilters();
        this.renderInstallments();
        this.bindEvents();
    }

    async populateFilters() {
        const clientSelect = document.getElementById('client-filter');
        const citySelect = document.getElementById('city-filter');

        const clients = await clientService.getAll();

        if (clientSelect) {
            clientSelect.innerHTML = '<option value="">Todos os Clientes</option>' +
                clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            if (this.currentClient) clientSelect.value = this.currentClient;
        }

        if (citySelect) {
            const cities = [...new Set(clients.map(c => c.city).filter(Boolean))].sort();
            citySelect.innerHTML = '<option value="">Todas as Cidades</option>' +
                cities.map(city => `<option value="${city}">${city}</option>`).join('');
        }
    }

    async renderInstallments() {
        const listContainer = document.getElementById('installments-list');
        if (!listContainer) return;

        let allItems = await installmentService.getAll();
        const today = DateHelper.getTodayStr();

        // 1. Filter by client
        if (this.currentClient) {
            allItems = allItems.filter(i => String(i.loan?.clientId) === String(this.currentClient) || String(i.client?.id) === String(this.currentClient));
        }

        // 2. Filter by city
        if (this.currentCity) {
            allItems = allItems.filter(i => i.client?.city === this.currentCity);
        }

        // 3. Filter by date
        if (this.currentDateType) {
            const dateType = this.currentDateType;
            if (dateType === 'hoje') {
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) === today);
            } else if (dateType === 'amanha') {
                const tStr = DateHelper.addDays(today, 1);
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) === tStr);
            } else if (dateType === '7dias') {
                const nwStr = DateHelper.addDays(today, 7);
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) >= today && DateHelper.toLocalYYYYMMDD(i.dueDate) <= nwStr);
            } else if (dateType === 'mes') {
                const now = new Date();
                const startMonth = DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
                const endMonth = DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) >= startMonth && DateHelper.toLocalYYYYMMDD(i.dueDate) <= endMonth);
            } else if (dateType === 'ano') {
                const now = new Date();
                const startYear = `${now.getFullYear()}-01-01`;
                const endYear = `${now.getFullYear()}-12-31`;
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) >= startYear && DateHelper.toLocalYYYYMMDD(i.dueDate) <= endYear);
            } else if (dateType === 'personalizado' && this.currentDateCustom) {
                allItems = allItems.filter(i => i.dueDate && DateHelper.toLocalYYYYMMDD(i.dueDate) === this.currentDateCustom);
            }
        }

        // Calculate counts for status buttons based on current filters 1-3
        const counts = {
            todas: allItems.length,
            pendente: allItems.filter(i => {
                const status = (i.status || '').toLowerCase();
                return (status === 'pendente') && DateHelper.isToday(i.dueDate);
            }).length,
            atrasada: allItems.filter(i => {
                const status = (i.status || '').toLowerCase();
                return status === 'atrasada' || ((status === 'pendente' || status === 'vendedora_pendente') && DateHelper.isPast(i.dueDate));
            }).length,
            avencer: allItems.filter(i => {
                const status = (i.status || '').toLowerCase();
                return (status === 'pendente' || status === 'vencendo') && DateHelper.isFuture(i.dueDate);
            }).length,
            paga: allItems.filter(i => (i.status || '').toLowerCase() === 'paga' || (i.status === 'pago')).length
        };

        document.querySelectorAll('.filter-status').forEach(btn => {
            const status = btn.dataset.status;
            const countSpan = btn.querySelector('.count');
            if (countSpan && counts[status] !== undefined) {
                countSpan.textContent = `(${counts[status]})`;
            }
        });

        // 4. Finally Filter by status
        let installments = allItems;
        if (this.currentStatus === 'avencer') {
            installments = installments.filter(i => (i.status || '').toLowerCase() === 'pendente' && DateHelper.isFuture(i.dueDate));
        } else if (this.currentStatus === 'pendente') {
            installments = installments.filter(i => (i.status || '').toLowerCase() === 'pendente' && DateHelper.isToday(i.dueDate));
        } else if (this.currentStatus === 'atrasada') {
            installments = installments.filter(i => {
                const status = (i.status || '').toLowerCase();
                return status === 'atrasada' || (status === 'pendente' && DateHelper.isPast(i.dueDate));
            });
        } else if (this.currentStatus === 'paga') {
            installments = installments.filter(i => {
                const status = (i.status || '').toLowerCase();
                return status === 'paga' || status === 'pago';
            });
        } else if (this.currentStatus !== 'todas') {
            installments = installments.filter(i => (i.status || '').toLowerCase() === this.currentStatus.toLowerCase());
        }

        // 4. Sort
        installments.sort((a, b) => {
            let valA = a[this.sortConfig.field];
            let valB = b[this.sortConfig.field];

            // Handle nested client name for sorting
            if (this.sortConfig.field === 'clientName') {
                valA = a.client?.name || '';
                valB = b.client?.name || '';
            }

            if (valA < valB) return this.sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // 5. Pagination
        const totalItems = installments.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedInstallments = installments.slice(startIndex, startIndex + this.itemsPerPage);

        // Map proofs from payments for paginated items securely
        const payments = await paymentService.getAll();
        paginatedInstallments.forEach(item => {
            const payment = payments.find(p => String(p.installmentId) === String(item.id));
            if (payment && payment.proof) item.proof = payment.proof;
            if (payment && payment.createdAt) item.paidAt = payment.createdAt; // Herança visual da data do pagamento legítimo
        });

        // Update pagination UI
        const controls = document.getElementById('pagination-controls');
        const info = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (controls && info && prevBtn && nextBtn) {
            controls.classList.remove('hidden');
            info.textContent = `Página ${this.currentPage} de ${totalPages} (${totalItems} registros)`;
            prevBtn.disabled = this.currentPage <= 1;
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        if (paginatedInstallments.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                        <p>Nenhuma parcela encontrada para os filtros selecionados.</p>
                    </td>
                </tr>
            `;
            return;
        }

        listContainer.innerHTML = paginatedInstallments.map(item => {
            const avatarHtml = item.client && item.client.avatar
                ? `<img src="${item.client.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0">`
                : `<div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">${item.client?.name ? item.client.name.charAt(0) : '?'}</div>`;

            // Fix for 0,00: StorageService converts DB 'installment_value' to camelCase 'installmentValue'
            const installmentValue = parseFloat(item.installmentValue || item.amount || 0);

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-xs font-medium text-slate-400">
                    ${item.loan?.loanCode || '---'}
                </td>
                <td class="px-6 py-4 text-sm font-medium ${this.getStatusCardClass(item.dueDate)}">
                    ${DateHelper.formatLocal(item.dueDate)}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <p class="font-bold text-slate-900">${item.client?.name || 'Cliente Sem Nome'}</p>
                            <p class="text-xs text-slate-500">${item.client?.phone || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-slate-500">
                    ${item.client?.city || '<span class="italic text-slate-300">Não informada</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 font-bold tracking-widest uppercase">
                    P ${item.number} <span class="text-xs text-slate-400 font-medium">/ ${item.loan?.numInstallments || item.number}</span>
                </td>
                <td class="px-6 py-4 text-sm font-black text-emerald-600">R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm font-medium text-slate-500">
                    ${DateHelper.formatLocal(item.paidAt)}
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${this.getStatusBadgeClass(item.status, item.dueDate)}">
                        ${this.getDisplayStatus(item.status, item.dueDate)}
                    </span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-2">
                    <button onclick="editInstallment(${item.id})" class="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors" title="Editar Parcela">
                        <i data-lucide="edit-2" class="w-5 h-5"></i>
                    </button>
                    ${item.proof ? `
                        <button onclick="viewProof(${item.id})" class="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors" title="Ver Comprovante">
                            <i data-lucide="eye" class="w-5 h-5"></i>
                        </button>
                    ` : ''}
                    <button onclick="sendWarning(${item.id})" class="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Enviar Cobrança">
                        <i data-lucide="message-circle" class="w-5 h-5"></i>
                    </button>
                    ${item.status !== 'paga' ? `
                        <button onclick="markAsPaid(${item.id})" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors" title="Marcar como Paga">
                            <i data-lucide="check-circle" class="w-5 h-5"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    getStatusCardClass(dueDate) {
        if (DateHelper.isPast(dueDate)) return 'text-rose-600 font-bold';
        if (DateHelper.isToday(dueDate)) return 'text-amber-600 font-bold';
        return 'text-slate-600';
    }

    getDisplayStatus(status, dueDate) {
        status = String(status || '').toLowerCase();
        if (status === 'paga' || status === 'pago') return 'PAGA';

        if (DateHelper.isPast(dueDate)) return 'ATRASADA';
        if (DateHelper.isToday(dueDate)) return 'VENCE HOJE';

        return 'A VENCER';
    }

    getStatusBadgeClass(status, dueDate) {
        status = String(status || '').toLowerCase();

        if (status === 'paga' || status === 'pago') return 'bg-emerald-50 text-emerald-600';

        if (DateHelper.isPast(dueDate)) return 'bg-rose-50 text-rose-600 border border-rose-100';
        if (DateHelper.isToday(dueDate)) return 'bg-amber-100/50 text-amber-600 border border-amber-200 shadow-sm';

        return 'bg-slate-100 text-slate-500';
    }

    bindEvents() {
        // Status Filters
        document.querySelectorAll('.filter-status').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.filter-status').forEach(b => {
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-slate-100', 'text-slate-500');
                });
                btn.classList.add('bg-primary', 'text-white');
                btn.classList.remove('bg-slate-100', 'text-slate-500');
                this.currentStatus = btn.dataset.status;
                this.renderInstallments();
            };
        });

        // Client Filter
        const clientFilter = document.getElementById('client-filter');
        if (clientFilter) {
            clientFilter.onchange = (e) => {
                this.currentClient = e.target.value;
                this.currentPage = 1;
                this.renderInstallments();
            };
        }

        // City Filter
        const cityFilter = document.getElementById('city-filter');
        if (cityFilter) {
            cityFilter.onchange = (e) => {
                this.currentCity = e.target.value;
                this.currentPage = 1;
                this.renderInstallments();
            };
        }

        // Date Filter
        const dateTypeSelect = document.getElementById('date-filter-type');
        const dateCustomInput = document.getElementById('date-filter-custom');

        if (dateTypeSelect && dateCustomInput) {
            dateTypeSelect.onchange = (e) => {
                this.currentDateType = e.target.value;
                if (this.currentDateType === 'personalizado') {
                    dateCustomInput.classList.remove('hidden');
                } else {
                    dateCustomInput.classList.add('hidden');
                    this.currentDateCustom = '';
                    dateCustomInput.value = '';
                }
                this.currentPage = 1;
                this.renderInstallments();
            };

            dateCustomInput.oninput = (e) => {
                this.currentDateCustom = e.target.value;
                this.currentPage = 1;
                this.renderInstallments();
            };
        }

        // Pagination buttons
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderInstallments();
                }
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentPage++;
                this.renderInstallments();
            };
        }

        // Sortable Headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.onclick = () => {
                const field = header.dataset.sort;
                if (this.sortConfig.field === field) {
                    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortConfig.field = field;
                    this.sortConfig.direction = 'asc';
                }
                this.renderInstallments();
            };
        });

        window.markAsPaid = async (id) => {
            const modal = document.getElementById('pay-installment-modal');
            if (!modal) return;
            document.getElementById('pay-inst-id').value = id;
            document.getElementById('pay-inst-date').value = DateHelper.getTodayStr();
            document.getElementById('pay-inst-notes').value = '';
            modal.classList.remove('hidden');
        };

        // Handle the pay modal submit (Event Delegation explicitly targeting the form in case of rebuilds)
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'pay-installment-form') {
                e.preventDefault();

                // Evite dupla execução se o formulário for submetido várias vezes acidentalmente
                if (e.target.dataset.processing === 'true') return;
                e.target.dataset.processing = 'true';

                const id = document.getElementById('pay-inst-id').value;
                const date = document.getElementById('pay-inst-date').value;
                const notes = document.getElementById('pay-inst-notes').value;

                const btn = e.target.querySelector('button[type="submit"]');
                let originalContent = 'Confirmar Pagamento';
                if (btn) {
                    originalContent = btn.innerHTML;
                    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processando...';
                    btn.disabled = true;
                    lucide.createIcons();
                }

                try {
                    const installments = await installmentService.getAll();
                    const inst = installments.find(i => String(i.id) === String(id));

                    if (inst) {
                        await paymentService.registerPayment({
                            installmentId: inst.id,
                            amount: inst.installmentValue || inst.amount || 0,
                            method: 'pix',
                            notes: notes || 'Baixa manual pelo administrador',
                            createdAt: new Date(date + 'T12:00:00Z').toISOString(), // force the selected date
                            paymentDate: date
                        });

                        document.getElementById('pay-installment-modal').classList.add('hidden');
                        this.renderInstallments();
                        alert("Parcela baixada e pagamento registrado!");
                    }
                } catch (error) {
                    alert("Erro ao baixar parcela: " + error.message);
                } finally {
                    delete e.target.dataset.processing;
                    if (btn) {
                        btn.innerHTML = originalContent;
                        btn.disabled = false;
                        lucide.createIcons();
                    }
                }
            }
        });

        // Close pay modal
        document.querySelectorAll('.close-pay-installment').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = document.getElementById('pay-installment-modal');
                if (modal) modal.classList.add('hidden');
            });
        });



        window.viewProof = async (id) => {
            const installments = await installmentService.getAll();
            const inst = installments.find(i => String(i.id) === String(id));

            const payments = await paymentService.getAll();
            const payment = payments.find(p => String(p.installmentId) === String(id));

            const proof = inst?.proof || payment?.proof || payment?.installment?.proof;

            if (proof) {
                this.showProofModal(proof);
            } else {
                alert("Nenhum comprovante encontrado no sistema para esta parcela.");
            }
        };

        // Close proof modal
        document.querySelectorAll('.close-proof-modal').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('proof-viewer-modal');
                if (modal) modal.classList.add('hidden');
            };
        });

        window.sendWarning = async (id) => {
            const installments = await installmentService.getAll();
            const inst = installments.find(i => String(i.id) === String(id));

            const templates = await templateService.getAll();
            if (templates.length === 0) {
                alert("Nenhum template cadastrado. Vá em Templates primeiro.");
                return;
            }

            const template = templates[0];
            const msg = templateService.generateMessage(template, {
                nome_cliente: inst.client?.name || 'Cliente',
                valor_parcela: parseFloat(inst.installmentValue || inst.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                data_vencimento: DateHelper.formatLocal(inst.dueDate)
            });

            const phone = inst.client?.phone?.replace(/\D/g, '') || '';
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        };

        // Edit Installment functions
        window.editInstallment = async (id) => {
            const installments = await installmentService.getAll();
            const inst = installments.find(i => String(i.id) === String(id));
            if (!inst) return;

            document.getElementById('edit-inst-id').value = inst.id;

            const originalDate = inst.dueDate ? inst.dueDate.split('T')[0] : '';
            document.getElementById('edit-inst-date-original').value = originalDate;
            document.getElementById('edit-inst-date-new').value = '';

            document.getElementById('edit-inst-amount').value = parseFloat(inst.installmentValue || inst.amount || 0).toFixed(2);
            document.getElementById('edit-inst-status').value = inst.status;

            // Load existing payment method or default
            const payments = await paymentService.getAll();
            const existingPayment = payments.find(p => String(p.installmentId) === String(id));
            if (existingPayment && existingPayment.method) {
                document.getElementById('edit-inst-method').value = existingPayment.method;
            } else {
                document.getElementById('edit-inst-method').value = 'pix';
            }

            // Show method selector only if status is Paga
            const methodContainer = document.getElementById('edit-inst-method-container');
            if (inst.status === 'paga') {
                methodContainer.classList.remove('hidden');
            } else {
                methodContainer.classList.add('hidden');
            }

            const modal = document.getElementById('edit-installment-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        };

        const statusSelect = document.getElementById('edit-inst-status');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                const methodContainer = document.getElementById('edit-inst-method-container');
                if (e.target.value === 'paga') {
                    methodContainer.classList.remove('hidden');
                } else {
                    methodContainer.classList.add('hidden');
                }
            });
        }

        document.querySelectorAll('.close-edit-installment').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('edit-installment-modal');
                if (modal) modal.classList.add('hidden');
            };
        });

        const editForm = document.getElementById('edit-installment-form');
        if (editForm) {
            editForm.onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-inst-id').value;
                const originalDate = document.getElementById('edit-inst-date-original').value;
                const newDateInput = document.getElementById('edit-inst-date-new').value;
                const finalDate = newDateInput || originalDate;

                const newAmount = document.getElementById('edit-inst-amount').value;
                const newStatus = document.getElementById('edit-inst-status').value;
                const newMethod = document.getElementById('edit-inst-method').value;

                try {
                    const installments = await installmentService.getAll();
                    let instTarget = installments.find(i => String(i.id) === String(id));

                    const payments = await paymentService.getAll();
                    const existingPayment = payments.find(p => String(p.installmentId) === String(id));

                    // Rule 1: Reverter de Paga para Pendente/Atrasada = Remover Pagamento
                    if (instTarget.status === 'paga' && newStatus !== 'paga') {
                        if (existingPayment) {
                            await storage.delete('payments', existingPayment.id);
                        }
                    }

                    // Rule 2: Marcar como Paga vindo de Pendente/Atrasada
                    if (instTarget.status !== 'paga' && newStatus === 'paga') {
                        if (existingPayment) {
                            existingPayment.amount = newAmount;
                            existingPayment.method = newMethod;
                            await storage.put('payments', existingPayment);
                        } else {
                            await paymentService.registerPayment({
                                installmentId: id,
                                amount: newAmount,
                                method: newMethod,
                                notes: 'Baixa efetuada via edição de parcela'
                            });
                        }
                    }

                    // Rule 3: Edição direta de uma que já estava Paga (Mudança de Valor ou Método)
                    if (instTarget.status === 'paga' && newStatus === 'paga') {
                        if (existingPayment) {
                            existingPayment.amount = newAmount;
                            existingPayment.method = newMethod;
                            await storage.put('payments', existingPayment);
                        }
                    }

                    await installmentService.update(id, {
                        dueDate: finalDate,
                        amount: parseFloat(newAmount),
                        status: newStatus
                    });

                    const modal = document.getElementById('edit-installment-modal');
                    if (modal) modal.classList.add('hidden');

                    alert('Parcela atualizada com sucesso!');
                    this.renderInstallments(); // reload
                } catch (err) {
                    console.error('Erro ao editar', err);
                    alert('Falha ao editar parcela.');
                }
            };
        }
    }

    showProofModal(proof) {
        const modal = document.getElementById('proof-viewer-modal');
        const display = document.getElementById('proof-display');
        if (!modal || !display) return;

        display.innerHTML = '';
        if (proof.startsWith('data:image/') || (typeof proof === 'string' && (proof.match(/\.(jpeg|jpg|gif|png)$/) != null))) {
            const img = document.createElement('img');
            img.src = proof;
            img.className = 'max-w-full max-h-full object-contain rounded-xl shadow-2xl';
            display.appendChild(img);
        } else {
            const iframe = document.createElement('iframe');
            iframe.src = proof;
            iframe.className = 'w-full h-full border-none rounded-xl bg-white';
            display.appendChild(iframe);
        }

        modal.classList.remove('hidden');
        lucide.createIcons();
    }
}

