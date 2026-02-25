const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_DIR = path.join(__dirname, 'app');
const DIST_DIR = path.join(__dirname, 'dist');

// Create dist if not exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// 1. Copy static assets from public/ and assets/ to dist/
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        // Exclude PHP files from static copy (like index.php)
        if (entry.name.endsWith('.php')) continue;

        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log("Copiando assets estáticos...");
copyDir(PUBLIC_DIR, DIST_DIR);
copyDir(path.join(__dirname, 'assets'), path.join(DIST_DIR, 'assets'));


// 2. Build HTML file injecting views (SPA approach)
console.log("Compilando index.html SPA...");

let indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.php'), 'utf8');
let layoutHtml = fs.readFileSync(path.join(APP_DIR, 'views', 'layout.php'), 'utf8');

// Strip generic PHP tags
layoutHtml = layoutHtml.replace(/<\?php[\s\S]*?\?>/g, (match) => {
    if (match.includes('include $viewPath')) return '<div id="module-content">{{VIEW_CONTENT}}</div>';
    return '';
});

// Since Netlify is pure frontend, we won't inject all views at once to keep it light, 
// OR we can inject the views dynamically via JS fetch.
// As the codebase expects instantaneous loading, we will create ONE big HTML with all views hidden in templates
// and JS will swap them, simulating the old server.js router.

const viewsDir = path.join(APP_DIR, 'views');
const viewFiles = fs.readdirSync(viewsDir).filter(f => f.endsWith('.php') && f !== 'layout.php');

let allViewsTemplate = '';

for (const file of viewFiles) {
    const pageName = file.replace('.php', '');
    let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
    // Strip php tags inside views
    content = content.replace(/<\?php[\s\S]*?\?>/g, '');
    allViewsTemplate += `<template id="view-${pageName}">\n${content}\n</template>\n`;
}

// Combine all into indexHtml
indexHtml = indexHtml.replace(/<\?php[\s\S]*?\?>/g, (match) => {
    if (match.includes("include APP_PATH . '/views/layout.php'")) return layoutHtml;
    // We remove the static page setter since SPA handles it
    return '';
});

// Replace the placeholder with templates
indexHtml = indexHtml.replace('<div id="module-content">{{VIEW_CONTENT}}</div>', `<div id="module-content"></div>\n${allViewsTemplate}`);

// Remove specific PHP inject text left behind
indexHtml = indexHtml.replace('<?php echo $page; ?>', 'dashboard');

// Save the main index.html
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
console.log("index.html gerado com", viewFiles.length, "views embarcadas.");

// 3. Make JS adaptable to this SPA routing inside App.js
// Note: You must also modify App.js to load the template instead of hitting the server node url.

console.log("Build finalizado. O diretório /dist está pronto para deploy no Netlify.");
