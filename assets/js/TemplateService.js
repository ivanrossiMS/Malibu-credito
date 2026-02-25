import storage from './StorageService.js';

class TemplateService {
    async init() {
        const templates = await this.getAll();
        if (templates.length === 0) {
            const defaults = [
                { title: 'Cobrança Atraso', content: 'Olá {nome_cliente}, lembramos que sua parcela de {valor_parcela} está vencida ({data_vencimento}). Regularize!' },
                { title: 'Atraso Leve (3 dias)', content: 'Olá {nome_cliente}, notamos que sua parcela de {valor_parcela} venceu há 3 dias. Houve algum problema com o pagamento?' },
                { title: 'Aviso Profissional (7 dias)', content: 'Prezado(a) {nome_cliente}, identificamos um atraso de 7 dias no seu contrato. Solicitamos a regularização imediata do valor de {valor_parcela}.' }
            ];
            for (const t of defaults) {
                await this.save(t);
            }
            console.log("Default templates created.");
        } else {
            // Migrar template existente caso seja o antigo padrao de vencimento
            const t1 = templates.find(t => t.title === 'Lembrete (Vence Hoje)' || t.content.includes("vence hoje"));
            if (t1) {
                t1.title = 'Cobrança Atraso';
                t1.content = 'Olá {nome_cliente}, lembramos que sua parcela de {valor_parcela} está vencida ({data_vencimento}). Regularize!';
                await this.save(t1);
                console.log("Template padrão de cobrança atualizado na base.");
            }
        }
    }

    async getAll() {
        return await storage.getAll('templates');
    }

    async save(template) {
        if (template.id) {
            return await storage.put('templates', template);
        } else {
            template.createdAt = new Date().toISOString();
            return await storage.add('templates', template);
        }
    }

    async delete(id) {
        return await storage.delete('templates', id);
    }

    // IA-like message generator logic
    generateMessage(template, placeholders) {
        let msg = template.content;
        for (const [key, value] of Object.entries(placeholders)) {
            msg = msg.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return msg;
    }
}

const templateService = new TemplateService();
export default templateService;
