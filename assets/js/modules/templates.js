import templateService from '../TemplateService.js';

export default class TemplatesModule {
    async init() {
        this.renderTemplates();
        this.bindEvents();
    }

    async renderTemplates() {
        const container = document.getElementById('templates-grid');
        if (!container) return;

        const templates = await templateService.getAll();

        if (templates.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <i data-lucide="message-square-off" class="w-12 h-12 mx-auto mb-3 opacity-20"></i>
                    <p>Nenhum template criado ainda.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(t => `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all space-y-4">
                <div class="flex justify-between items-start">
                    <div class="bg-primary/10 p-2 rounded-xl text-primary">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editTemplate(${t.id})" class="p-2 text-slate-400 hover:text-primary transition-colors">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                        <button onclick="deleteTemplate(${t.id})" class="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900">${t.title}</h3>
                    <p class="text-sm text-slate-500 mt-2 line-clamp-3">${t.content}</p>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    bindEvents() {
        const addBtn = document.getElementById('add-template-btn');
        const modal = document.getElementById('template-modal');
        if (addBtn && modal) {
            addBtn.onclick = () => {
                document.getElementById('template-form').reset();
                document.getElementById('template-id').value = '';
                modal.classList.remove('hidden');
            };
        }

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => btn.closest('.fixed').classList.add('hidden');
        });

        const form = document.getElementById('template-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const data = {
                    id: document.getElementById('template-id').value ? parseInt(document.getElementById('template-id').value) : null,
                    title: document.getElementById('title').value,
                    content: document.getElementById('content').value
                };

                try {
                    await templateService.save(data);
                    modal.classList.add('hidden');
                    this.renderTemplates();
                } catch (error) {
                    alert(error.message);
                }
            };
        }

        window.editTemplate = async (id) => {
            const templates = await templateService.getAll();
            const t = templates.find(item => item.id === id);
            document.getElementById('template-id').value = t.id;
            document.getElementById('title').value = t.title;
            document.getElementById('content').value = t.content;
            modal.classList.remove('hidden');
        };

        window.deleteTemplate = async (id) => {
            if (confirm("Deseja excluir este template?")) {
                await templateService.delete(id);
                this.renderTemplates();
            }
        };
    }
}
