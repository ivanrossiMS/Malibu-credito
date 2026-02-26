import clientService from '../ClientService.js';

export default class ClientsModule {
    async init() {
        this.allClients = await clientService.getAll(); // Cache local para filtros
        this.populateCities();
        this.renderClients();
        this.bindEvents();
    }

    populateCities() {
        const cityFilter = document.getElementById('client-city-filter');
        if (!cityFilter) return;

        const cities = [...new Set(this.allClients.map(c => c.city).filter(Boolean))].sort();
        let html = '<option value="all">Todas Cidades</option>';
        cities.forEach(city => {
            html += `<option value="${city}">${city}</option>`;
        });
        cityFilter.innerHTML = html;
    }

    async renderClients(query = '') {
        const listContainer = document.getElementById('clients-list');
        if (!listContainer) return;

        // Recupera os valores dos filtros
        const cityFilterVal = document.getElementById('client-city-filter')?.value || 'all';
        const statusFilterVal = document.getElementById('client-status-filter')?.value || '';

        // Se houver query ele faz o search principal, se não pega todos
        let clients = query ? await clientService.search(query) : this.allClients || await clientService.getAll();

        // Aplica filtro de cidade
        if (cityFilterVal !== 'all') {
            clients = clients.filter(c => c.city === cityFilterVal);
        }

        // Aplica filtro de status
        if (statusFilterVal !== '') {
            clients = clients.filter(c => c.status === statusFilterVal);
        }

        if (clients.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                        <p>Nenhum cliente encontrado com os filtros atuais.</p>
                    </td>
                </tr>
            `;
            return;
        }

        listContainer.innerHTML = clients.map(client => {
            const avatarHtml = client.avatar
                ? `<img src="${client.avatar}" class="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0">`
                : `<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">${client.name ? client.name.charAt(0) : '?'}</div>`;

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <p class="font-bold text-slate-900">${client.name}</p>
                            <p class="text-xs text-slate-500">${client.email || 'Sem email'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 hidden md:table-cell text-sm text-slate-600 font-medium">${client.city || '<span class="text-slate-400 italic">Não informada</span>'}</td>
                <td class="px-6 py-4 hidden lg:table-cell">
                    <a href="https://wa.me/${(client.phone || '').replace(/\D/g, '')}" target="_blank" class="flex items-center gap-1 text-primary hover:underline">
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                        <span class="text-sm font-medium">${client.phone || 'Sem telefone'}</span>
                    </a>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${this.getStatusClass(client.status)}">
                        ${client.status.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        <button onclick="editClient(${client.id})" class="p-2 text-slate-400 hover:text-primary transition-colors">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    getStatusClass(status) {
        switch (status) {
            case 'ativo': return 'bg-emerald-50 text-emerald-600';
            case 'inativo': return 'bg-slate-100 text-slate-400';
            case 'bloqueado': return 'bg-rose-50 text-rose-600';
            default: return 'bg-slate-50 text-slate-500';
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.oninput = (e) => this.renderClients(e.target.value);
        }

        const cityFilter = document.getElementById('client-city-filter');
        if (cityFilter) {
            cityFilter.onchange = () => this.renderClients(searchInput ? searchInput.value : '');
        }

        const statusFilter = document.getElementById('client-status-filter');
        if (statusFilter) {
            statusFilter.onchange = () => this.renderClients(searchInput ? searchInput.value : '');
        }

        const addBtn = document.getElementById('add-client-btn');
        const modal = document.getElementById('client-modal');
        if (addBtn && modal) {
            addBtn.onclick = () => {
                document.getElementById('client-form').reset();
                document.getElementById('client-id').value = '';
                document.getElementById('modal-title').textContent = 'Novo Cliente';
                modal.classList.remove('hidden');
                setTimeout(() => {
                    const content = modal.querySelector('.max-w-4xl');
                    if (content) content.classList.remove('scale-95');
                }, 10);
            };
        }

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => {
                const modal = btn.closest('.fixed');
                const content = modal.querySelector('.max-w-4xl');
                if (content) content.classList.add('scale-95');
                setTimeout(() => modal.classList.add('hidden'), 200);
            };
        });

        const form = document.getElementById('client-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const idValue = document.getElementById('client-id').value;
                const data = {
                    id: idValue ? parseInt(idValue) : null,
                    name: document.getElementById('name').value,
                    cpf_cnpj: document.getElementById('cpf_cnpj').value,
                    rg: document.getElementById('rg').value,
                    birth: document.getElementById('birth').value,
                    marital: document.getElementById('marital').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    status: document.getElementById('status').value,
                    street: document.getElementById('street').value,
                    number: document.getElementById('number').value,
                    neighborhood: document.getElementById('neighborhood').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    occupation: document.getElementById('occupation').value,
                    company: document.getElementById('company').value
                };

                try {
                    // Update only explicitly via update() if editing, to preserve avatar/images
                    if (data.id) {
                        await clientService.update(data.id, data);
                    } else {
                        await clientService.save(data);
                    }

                    const modal = document.getElementById('client-modal');
                    const content = modal.querySelector('.max-w-4xl');
                    if (content) content.classList.add('scale-95');
                    setTimeout(() => modal.classList.add('hidden'), 200);

                    this.renderClients();
                } catch (error) {
                    alert(error.message);
                }
            };
        }

        // Expose global functions for row actions
        window.editClient = async (id) => {
            const client = await clientService.getById(id);
            document.getElementById('client-id').value = client.id;
            document.getElementById('name').value = client.name || '';
            document.getElementById('cpf_cnpj').value = client.cpf_cnpj || '';
            document.getElementById('rg').value = client.rg || '';
            document.getElementById('birth').value = client.birth || '';
            document.getElementById('marital').value = client.marital || '';
            document.getElementById('email').value = client.email || '';
            document.getElementById('phone').value = client.phone || '';
            document.getElementById('status').value = client.status || 'ativo';

            document.getElementById('street').value = client.street || '';
            document.getElementById('number').value = client.number || '';
            document.getElementById('neighborhood').value = client.neighborhood || '';
            document.getElementById('city').value = client.city || '';
            document.getElementById('state').value = client.state || '';

            document.getElementById('occupation').value = client.occupation || '';
            document.getElementById('company').value = client.company || '';

            document.getElementById('modal-title').textContent = 'Editar Cliente';
            const modal = document.getElementById('client-modal');
            modal.classList.remove('hidden');
            setTimeout(() => {
                const content = modal.querySelector('.max-w-4xl');
                if (content) content.classList.remove('scale-95');
            }, 10);
        };
    }
}
