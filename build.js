const fs = require('fs');
const path = require('path');

/**
 * Script de build básico para evitar erros no Netlify.
 * O Netlify não suporta PHP nativamente, então este script apenas prepara os arquivos estáticos.
 */

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }
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

const distPath = path.resolve(__dirname, 'dist');

// Limpar pasta dist
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath);

// Copiar arquivos públicos e assets
const publicPath = path.resolve(__dirname, 'public');
const assetsPath = path.resolve(__dirname, 'assets');

if (fs.existsSync(publicPath)) {
    console.log('Copiando arquivos de public...');
    copyFolderSync(publicPath, distPath);
}

if (fs.existsSync(assetsPath)) {
    console.log('Copiando arquivos de assets...');
    copyFolderSync(assetsPath, path.join(distPath, 'assets'));
}

console.log('Build concluído com sucesso.');
