const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8088;
const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_DIR = path.join(__dirname, 'app');

const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    const query = new URL(req.url, `http://localhost:${PORT}`).searchParams;

    // Default page
    if (url === '/') {
        renderPage(query.get('page') || 'dashboard', res);
        return;
    }

    // Serve static files from public/
    let filePath = path.join(PUBLIC_DIR, url);
    if (!fs.existsSync(filePath)) {
        // Fallback for missing public files: maybe it's in root?
        filePath = path.join(__dirname, url);
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };

        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

function renderPage(page, res) {
    // Read index.php as a template but handle it manually
    let indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.php'), 'utf8');
    let layoutHtml = fs.readFileSync(path.join(APP_DIR, 'views', 'layout.php'), 'utf8');

    // Mock the PHP inclusion
    const viewPath = path.join(APP_DIR, 'views', `${page}.php`);
    let viewHtml = fs.existsSync(viewPath) ? fs.readFileSync(viewPath, 'utf8') : '<h1>Page not found</h1>';

    // Remove PHP tags but keep the content (since it's mostly HTML)
    layoutHtml = layoutHtml.replace(/<\?php[\s\S]*?\?>/g, (match) => {
        // Basic logic replacement for $page and $viewPath
        if (match.includes('include $viewPath')) return '{{VIEW_CONTENT}}';
        return '';
    });

    indexHtml = indexHtml.replace(/<\?php[\s\S]*?\?>/g, (match) => {
        if (match.includes("include APP_PATH . '/views/layout.php'")) return layoutHtml;
        if (match.includes("echo $page")) return page;
        return '';
    });

    indexHtml = indexHtml.replace('{{VIEW_CONTENT}}', viewHtml);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml);
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Open your browser to test Malibu Crédito.`);
});
