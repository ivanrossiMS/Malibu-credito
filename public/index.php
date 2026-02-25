<?php
/**
 * Malibu Crédito - Entry Point
 * Modern Local-First Loan Management System
 */

// Define basic constants
define('APP_PATH', __DIR__ . '/../app');
define('PUBLIC_PATH', __DIR__);

// Simple routing based on 'page' parameter
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
$viewPath = APP_PATH . "/views/{$page}.php";

// Auth check (simulated) - will be handled by JS, but PHP handles layout
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Malibu Crédito - Gestão de Empréstimos</title>
    <link rel="icon" type="image/png" href="assets/img/LOGO.png" />
    <link rel="manifest" href="manifest.json">
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            DEFAULT: '#0D9488',
                            light: '#14B8A6',
                            dark: '#0F766E'
                        },
                        secondary: '#0F172A',
                        accent: '#2DD4BF',
                        glass: {
                            DEFAULT: 'rgba(255, 255, 255, 0.7)',
                            dark: 'rgba(15, 23, 42, 0.8)'
                        },
                        finance: {
                            light: '#F8FAFC',
                            sidebar: '#0F172A' // Darker Sidebar
                        }
                    },
                    backgroundImage: {
                        'gradient-premium': 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                        'gradient-sidebar': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
                        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                    },
                    boxShadow: {
                        'premium': '0 10px 40px -10px rgba(13, 148, 136, 0.3)',
                        'soft': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
                    }
                }
            }
        }
    </script>
    
    <!-- Google Fonts: Inter & Outfit -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Icons: Lucide -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Charts: Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0D9488">
    
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
        }

        body { 
            font-family: 'Inter', sans-serif; 
            background-color: #f1f5f9;
        }
        h1, h2, h3, .font-heading { font-family: 'Outfit', sans-serif; }
        
        /* Glassmorphism utility */
        .glass {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .glass-dark {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Card refinements */
        .premium-card {
            background: white;
            border-radius: 2rem;
            border: 1px solid rgba(241, 245, 249, 1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-card:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-4px);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Animation */
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .gradient-text {
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen m-0 p-0 flex flex-col">
    
    <div id="app-container" class="hidden flex-1 flex flex-col w-full">
        <!-- Sidebar and Content will be injected here via JS/Components -->
        <?php include APP_PATH . '/views/layout.php'; ?>
    </div>

    <div id="auth-container" class="hidden">
        <!-- Auth views (Login, Registro) -->
    </div>

    <!-- Storage Service & Core Scripts -->
    <script type="module" src="assets/js/App.js"></script>
    
    <script>
        // Set page context for JS
        window.APP_CONFIG = {
            currentPage: '<?php echo $page; ?>'
        };
        
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>
