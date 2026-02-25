const fs = require('fs');
const path = require('path');

/**
 * Compilador SPA para Netlify
 * Transforma a estrutura PHP (layout + views) em uma Single Page Application estática
 */

const DIST_PATH = path.resolve(__dirname, 'dist');
const PUBLIC_PATH = path.resolve(__dirname, 'public');
const ASSETS_PATH = path.resolve(__dirname, 'assets');
const VIEWS_PATH = path.resolve(__dirname, 'app', 'views');

function cleanPhpTags(content) {
    if (!content) return '';
    return content.replace(/<\?php[\s\S]*?\?>/g, '');
}

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        if (fs.lstatSync(fromPath).isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else {
            copyFolderSync(fromPath, toPath);
        }
    });
}

async function buildSPA() {
    console.log('Iniciando compilação SPA...');

    // 1. Limpar diretorio dist
    if (fs.existsSync(DIST_PATH)) {
        fs.rmSync(DIST_PATH, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_PATH);

    // 2. Copiar assets estáticos e arquivos da pasta public
    if (fs.existsSync(PUBLIC_PATH)) copyFolderSync(PUBLIC_PATH, DIST_PATH);
    if (fs.existsSync(ASSETS_PATH)) copyFolderSync(ASSETS_PATH, path.join(DIST_PATH, 'assets'));

    // 3. Ler o index.html gerado na pasta dist (copiado do public)
    const indexPath = path.join(DIST_PATH, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf-8');

    // 4. Ler e processar o layout.php
    const layoutPath = path.join(VIEWS_PATH, 'layout.php');
    let layoutContent = '';
    if (fs.existsSync(layoutPath)) {
        layoutContent = fs.readFileSync(layoutPath, 'utf-8');
        // Remover abertura do HTML no layout se ele tentar redefinir body/head
        layoutContent = layoutContent.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '');
        layoutContent = cleanPhpTags(layoutContent);
    }

    // 5. Injetar o Layout no index.html
    const appContainerRegex = /<div id="app-container"[^>]*>[\s\S]*?<\/div>\s*<div id="auth-container"/i;
    if (appContainerRegex.test(indexContent)) {
        indexContent = indexContent.replace(
            appContainerRegex,
            `<div id="app-container" class="hidden flex-1 flex flex-col w-full min-h-screen relative">${layoutContent}</div>\n    <div id="auth-container"`
        );
    }

    // 6. Processar todas as views e extrair como <template>
    let templatesHtml = '\n\    <!-- SPA Templates -->\n';

    if (fs.existsSync(VIEWS_PATH)) {
        const files = fs.readdirSync(VIEWS_PATH);
        for (const file of files) {
            if (file.endsWith('.php') && file !== 'layout.php') {
                const viewName = file.replace('.php', '');
                const viewContent = fs.readFileSync(path.join(VIEWS_PATH, file), 'utf-8');

                // Limpar PHP
                const cleanContent = cleanPhpTags(viewContent);

                templatesHtml += `    <template id="view-${viewName}">\n${cleanContent}\n    </template>\n`;
            }
        }
    }

    // 7. Injetar templates no final do body
    indexContent = indexContent.replace('</body>', `${templatesHtml}</body>`);

    // 8. Salvar index.html final
    fs.writeFileSync(indexPath, indexContent);
    console.log('Build SPA concluído com sucesso!');
}

buildSPA().catch(console.error);
