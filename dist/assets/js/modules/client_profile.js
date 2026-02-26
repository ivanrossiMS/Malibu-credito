import auth from '../AuthService.js';
import clientService from '../ClientService.js';

export default class ClientProfileModule {
    constructor() {
        this.client = null;
    }

    async init() {
        if (!auth.isAuthenticated()) return;

        try {
            // Find client profile linked to this user
            this.client = await clientService.getByUserId(auth.currentUser.id);

            if (!this.client) {
                console.error("Perfil de cliente não encontrado para o usuário logado.");
                return;
            }

            this.renderProfile();
            this.bindEvents();
        } catch (error) {
            console.error("Erro fatal ao carregar o módulo Perfil do Cliente:", error);
        }
    }

    renderProfile() {
        // --- 1. CABEÇALHO VIP (Header) ---
        const nameEl = document.getElementById('profile-name');
        const initialsEl = document.getElementById('profile-initials');
        const emailMainEl = document.getElementById('profile-email-main');
        const statusBadge = document.getElementById('profile-status-badge');
        const memberSince = document.getElementById('profile-member-since');
        const internalId = document.getElementById('profile-internal-id');

        if (nameEl) {
            nameEl.textContent = this.client.name || 'Cliente Sem Nome';
            nameEl.classList.remove('loading-pulse');
        }

        if (initialsEl) {
            if (this.client.avatar) {
                initialsEl.innerHTML = `<img src="${this.client.avatar}" class="w-full h-full object-cover">`;
            } else {
                initialsEl.textContent = this.getInitials(this.client.name);
            }
        }

        if (emailMainEl) {
            emailMainEl.innerHTML = `<i data-lucide="mail" class="w-5 h-5 opacity-70"></i><span>${this.client.email || '--'}</span>`;
        }

        // Status Control (Assuming default 'Ativo' but preparing for extensibility)
        if (statusBadge) {
            const status = this.client.status || 'Ativo';
            if (status.toLowerCase() === 'bloqueado' || status.toLowerCase() === 'inativo') {
                statusBadge.className = "inline-block px-4 py-1.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                statusBadge.textContent = "Conta " + status;
            } else {
                statusBadge.textContent = "Conta " + status; // Keeps default emerald classes
            }
        }

        if (memberSince) {
            memberSince.textContent = this.client.createdAt ? DateHelper.formatLocal(this.client.createdAt) : '--/--/----';
        }

        if (internalId) {
            internalId.textContent = `#${String(this.client.id).padStart(4, '0')}`;
        }


        // --- 2. CARD: IDENTIDADE ---
        this.fillElement('profile-cpf', this.formatCpfCnpj(this.client.cpf_cnpj || this.client.cpfCnpj));
        const birthDate = this.client.birth_date || this.client.birthDate;
        this.fillElement('profile-birth', birthDate ? DateHelper.formatLocal(birthDate) : null);
        this.fillElement('profile-marital', this.client.marital_status || this.client.maritalStatus);

        // --- 3. CARD: CONTATO ---
        this.fillElement('profile-phone', this.formatPhone(this.client.phone));
        this.fillElement('profile-email', this.client.email);

        // --- 4. CARD: ENDEREÇO ---
        this.fillElement('profile-street', this.client.street);
        this.fillElement('profile-number', this.client.number);
        this.fillElement('profile-neighborhood', this.client.neighborhood);

        const cityState = (this.client.city && this.client.state)
            ? `${this.client.city} / ${this.client.state}`
            : null;
        this.fillElement('profile-city-state', cityState);

        // --- 5. CARD: PROFISSIONAL ---
        this.fillElement('profile-occupation', this.client.occupation);
        this.fillElement('profile-company', this.client.company);

        // Re-renderizar ícones que foram injetados dinamicamente (se aplicável)
        lucide.createIcons();
    }

    bindEvents() {
        const btnOpenEdit = document.getElementById('btn-open-edit');
        const btnCloseEdit = document.getElementById('btn-close-edit');
        const modalEdit = document.getElementById('edit-profile-modal');
        const formEdit = document.getElementById('form-edit-profile');
        const avatarUpload = document.getElementById('avatar-upload');
        const avatarContainer = document.getElementById('avatar-container');

        // Modal Open/Close
        if (btnOpenEdit && modalEdit) {
            btnOpenEdit.onclick = () => {
                this.populateEditForm();
                modalEdit.showModal();
            };
        }
        if (btnCloseEdit && modalEdit) {
            btnCloseEdit.onclick = () => modalEdit.close();
        }

        // Form Submit
        if (formEdit) {
            formEdit.onsubmit = async (e) => {
                e.preventDefault();
                const btnSubmit = formEdit.querySelector('button[type="submit"]');
                const originalText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> SALVANDO...';
                btnSubmit.disabled = true;

                try {
                    const updatedData = {
                        name: document.getElementById('edit-name').value.trim(),
                        cpf_cnpj: document.getElementById('edit-cpf').value.trim(),
                        birth_date: document.getElementById('edit-birth').value,
                        marital_status: document.getElementById('edit-marital').value,
                        street: document.getElementById('edit-street').value.trim(),
                        number: document.getElementById('edit-number').value.trim(),
                        neighborhood: document.getElementById('edit-neighborhood').value.trim(),
                        city: document.getElementById('edit-city').value.trim(),
                        state: document.getElementById('edit-state').value.trim(),
                        occupation: document.getElementById('edit-occupation').value.trim(),
                        company: document.getElementById('edit-company').value.trim()
                    };

                    await clientService.update(this.client.id, updatedData);

                    // Update current local instance with the new data
                    Object.assign(this.client, updatedData);

                    // Re-render
                    this.renderProfile();

                    // Fechar via timeout pra UX de salvamento
                    setTimeout(() => {
                        modalEdit.close();
                        btnSubmit.innerHTML = originalText;
                        btnSubmit.disabled = false;
                        lucide.createIcons();
                    }, 500);

                } catch (error) {
                    alert('Erro ao salvar alterações: ' + error.message);
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.disabled = false;
                    lucide.createIcons();
                }
            };
        }

        // Avatar Upload
        if (avatarContainer && avatarUpload) {
            avatarContainer.onclick = () => avatarUpload.click();

            avatarUpload.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    alert("A imagem não pode ter mais que 2MB.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64Data = event.target.result;
                    try {
                        // Salva no banco offline
                        await clientService.update(this.client.id, { avatar: base64Data });
                        this.client.avatar = base64Data;

                        // Reflete na tela do Perfil
                        this.renderProfile();

                        // Tenta refletir global (Sidebar/Nav) se estiver em App.js setupUI
                        const globalAvatars = document.querySelectorAll('.user-initials');
                        globalAvatars.forEach(el => {
                            el.innerHTML = `<img src="${base64Data}" class="w-full h-full object-cover rounded-full">`;
                            el.classList.remove('bg-primary');
                        });

                    } catch (err) {
                        alert("Erro ao salvar foto de perfil: " + err.message);
                    }
                };
                reader.readAsDataURL(file);
            };
        }
    }

    populateEditForm() {
        const cl = this.client;
        document.getElementById('edit-name').value = cl.name || '';
        document.getElementById('edit-cpf').value = cl.cpf_cnpj || cl.cpfCnpj || '';

        // Handling dates correctly for <input type="date"> (YYYY-MM-DD)
        const birthDate = cl.birth_date || cl.birthDate;
        if (birthDate) {
            try {
                document.getElementById('edit-birth').value = new Date(birthDate).toISOString().split('T')[0];
            } catch (e) { }
        }

        const maritalSelect = document.getElementById('edit-marital');
        const maritalVal = cl.marital_status || cl.maritalStatus;
        if (maritalVal && Array.from(maritalSelect.options).some(o => o.value === maritalVal)) {
            maritalSelect.value = maritalVal;
        }

        document.getElementById('edit-phone').value = cl.phone || '';
        document.getElementById('edit-email').value = cl.email || '';
        document.getElementById('edit-street').value = cl.street || '';
        document.getElementById('edit-number').value = cl.number || '';
        document.getElementById('edit-neighborhood').value = cl.neighborhood || '';
        document.getElementById('edit-city').value = cl.city || '';
        document.getElementById('edit-state').value = cl.state || '';
        document.getElementById('edit-occupation').value = cl.occupation || '';
        document.getElementById('edit-company').value = cl.company || '';
    }

    // --- Helpers Utilitários ---

    fillElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = (value && value !== 'null' && value.trim() !== '') ? value : '--';

            // Highlight visual pra campos vazios chamarem a atenção sutilmente
            if (el.textContent === '--') {
                el.classList.add('opacity-40');
            } else {
                el.classList.remove('opacity-40');
            }
        }
    }

    getInitials(name) {
        if (!name) return '--';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    formatCpfCnpj(val) {
        if (!val) return null;
        const numbers = val.replace(/\D/g, '');
        if (numbers.length === 11) {
            // CPF
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        } else if (numbers.length === 14) {
            // CNPJ
            return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        }
        return val;
    }

    formatPhone(val) {
        if (!val) return null;
        let numbers = val.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return val;
    }

    formatCep(val) {
        if (!val) return null;
        let numbers = val.replace(/\D/g, '');
        if (numbers.length === 8) {
            return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
        }
        return val;
    }
}
