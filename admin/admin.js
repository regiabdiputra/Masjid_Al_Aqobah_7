/**
 * Masjid Al Aqobah 7 Admin Panel Logic
 * Powered by Supabase
 */

// --- Authentication & Session Management (Supabase Auth) ---

const LOGIN_ATTEMPTS_KEY = 'aqobah7_login_attempts';
const LOCKOUT_TIME_KEY = 'aqobah7_lockout_time';

// Check Auth Guard (async)
async function checkAuth() {
    const isLoginPath = window.location.pathname.includes('login');
    const { data: { session } } = await window._supabase.auth.getSession();

    if (!session && !isLoginPath) {
        window.location.replace('login.html');
    } else if (session && isLoginPath) {
        window.location.replace('index.html');
    }
}

// Initial Auth Check
checkAuth();

// Login Logic (Only runs on login.html)
if (window.location.pathname.includes('login')) {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');

    // Toggle Password Visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                togglePasswordIcon.setAttribute('data-lucide', 'eye-off');
                togglePasswordIcon.style.color = 'var(--primary-green)';
            } else {
                togglePasswordIcon.setAttribute('data-lucide', 'eye');
                togglePasswordIcon.style.color = 'var(--text-muted)';
            }
            lucide.createIcons();
        });
    }

    // Clear any old lockout on page load
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIME_KEY);
    checkLockout();

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isLockedOut()) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            loginBtn.disabled = true;
            loginBtn.textContent = 'Memproses...';

            try {
                const { data, error } = await window._supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    handleFailedLogin(error.message);
                } else {
                    // Success
                    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
                    localStorage.removeItem(LOCKOUT_TIME_KEY);
                    window.location.replace('index.html');
                }
            } catch (err) {
                handleFailedLogin(err.message);
            }

            loginBtn.disabled = false;
            loginBtn.textContent = 'MASUK KE PANEL ADMIN';
        });
    }

    function handleFailedLogin(errorMsg) {
        let attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0');
        attempts++;
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString());

        if (attempts >= 3) {
            const lockoutUntil = new Date().getTime() + 30000;
            localStorage.setItem(LOCKOUT_TIME_KEY, lockoutUntil.toString());
            checkLockout();
        } else {
            showMessage(errorMsg || 'Email atau password salah. Silakan coba lagi.', 'error');
        }
    }

    function checkLockout() {
        if (isLockedOut()) {
            const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_TIME_KEY));
            const remaining = Math.ceil((lockoutUntil - new Date().getTime()) / 1000);
            
            showMessage(`Terlalu banyak percobaan. Coba lagi dalam ${remaining} detik.`, 'error');
            loginBtn.disabled = true;
            emailInput.disabled = true;
            passwordInput.disabled = true;

            const interval = setInterval(() => {
                const now = new Date().getTime();
                if (now >= lockoutUntil) {
                    clearInterval(interval);
                    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
                    localStorage.removeItem(LOCKOUT_TIME_KEY);
                    loginBtn.disabled = false;
                    emailInput.disabled = false;
                    passwordInput.disabled = false;
                    hideMessage();
                } else {
                    const rem = Math.ceil((lockoutUntil - now) / 1000);
                    showMessage(`Terlalu banyak percobaan. Coba lagi dalam ${rem} detik.`, 'error');
                }
            }, 1000);
        }
    }

    function isLockedOut() {
        const lockoutUntil = localStorage.getItem(LOCKOUT_TIME_KEY);
        if (!lockoutUntil) return false;
        if (new Date().getTime() < parseInt(lockoutUntil)) return true;
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_TIME_KEY);
        return false;
    }

    function showMessage(msg, type) {
        loginMessage.textContent = msg;
        loginMessage.className = `login-message ${type}`;
        loginMessage.classList.remove('hidden');
    }

    function hideMessage() {
        loginMessage.classList.add('hidden');
    }
}

// --- Dashboard Logic (Only runs on index.html) ---
if (!window.location.pathname.includes('login')) {
    document.addEventListener('DOMContentLoaded', () => {
        initDashboardUI();
        initRouter();
        loadPage('dashboard'); // Default
    });

    function initDashboardUI() {
        // Logout function (Supabase signOut)
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await window._supabase.auth.signOut();
                window.location.replace('login.html');
            });
        }

        // Mobile Sidebar Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if(mobileMenuBtn && sidebar && sidebarOverlay) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.add('show');
                sidebarOverlay.classList.add('show');
            });

            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            });
        }
    }

    // --- Toast Notification System ---
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        lucide.createIcons({ root: toast });

        setTimeout(() => { toast.classList.add('show'); }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.remove(); }, 300);
        }, 3000);
    };

    // --- Simple Router ---
    function initRouter() {
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-page]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const sidebar = document.getElementById('sidebar');
                const sidebarOverlay = document.getElementById('sidebarOverlay');
                if (sidebar) sidebar.classList.remove('show');
                if (sidebarOverlay) sidebarOverlay.classList.remove('show');
                loadPage(page);
                window.location.hash = page;
            });
        });

        window.addEventListener('hashchange', () => {
            let hash = window.location.hash.replace('#', '') || 'dashboard';
            const link = document.querySelector(`.sidebar-nav .nav-link[data-page="${hash}"]`);
            if (link) { link.click(); } else { loadPage('dashboard'); }
        });
        
        if(window.location.hash) {
            let hash = window.location.hash.replace('#', '');
            const link = document.querySelector(`.sidebar-nav .nav-link[data-page="${hash}"]`);
            if(link) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                loadPage(hash);
            }
        }
    }

    function loadPage(page) {
        const container = document.getElementById('contentContainer');
        const pageTitle = document.getElementById('pageTitle');
        const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
        
        const titles = {
            'dashboard': 'Ringkasan Dashboard',
            'beranda': 'Kelola Beranda & Visi Misi',
            'layanan': 'Kelola Layanan Masyarakat',
            'berita': 'Kelola Berita',
            'kegiatan': 'Kelola Kegiatan Masjid',
            'komentar': 'Moderasi Komentar Publik',
            'kritik-saran': 'Inbox Kritik & Saran',
            'donasi-verifikasi': 'Verifikasi Transaksi Donasi',
            'donasi-program': 'Kelola Program Donasi',
            'pengaturan': 'Pengaturan Umum',
            'jadwal-rutin': 'Kelola Jadwal Rutin'
        };

        if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = titles[page] || 'Dashboard';

        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i data-lucide="loader-2" class="spin"></i> Memuat...</div>`;
        lucide.createIcons({root: container});

        // All render functions are now async
        setTimeout(async () => {
            try {
                switch(page) {
                    case 'dashboard': await renderDashboard(); break;
                    case 'beranda': await renderBeranda(); break;
                    case 'layanan': await renderLayanan(); break;
                    case 'berita': await renderBerita(); break;
                    case 'kegiatan': await renderKegiatan(); break;
                    case 'jadwal-rutin': await renderJadwalRutin(); break;
                    case 'komentar': await renderKomentar(); break;
                    case 'kritik-saran': await renderKritikSaran(); break;
                    case 'donasi-verifikasi': await renderDonasi('verifikasi'); break;
                    case 'donasi-program': await renderDonasi('program'); break;
                    case 'pengaturan': await renderPengaturan(); break;
                    default: await renderDashboard();
                }
            } catch (err) {
                console.error('Error rendering page:', err);
                container.innerHTML = `<div style="text-align:center;padding:40px;color:#e53e3e;"><p>Gagal memuat halaman: ${err.message}</p><button class="btn btn-outline" onclick="loadPage('${page}')">Coba Lagi</button></div>`;
            }
            lucide.createIcons();
            await updateNotificationBadges();
        }, 100);
    }
    
    // --- Supabase DB Helper (wraps SupaDB for admin) ---
    async function getDB(collection) {
        // Map old collection names to Supabase table names
        const tableMap = {
            'berita': 'berita',
            'kegiatan': 'kegiatan_masjid',
            'layanan': 'layanan_masyarakat',
            'donasi_transactions': 'donasi_transactions',
            'donasi_programs': 'donasi_programs',
            'komentar': 'komentar',
            'kritik_saran': 'kritik_saran',
            'beranda_config': null, // Use site_config
            'pengaturan_umum': null, // Use site_config
        };

        const table = tableMap[collection];
        
        try {
            if (table === null) {
                // Config collections
                return await SupaDB.fetchConfig(collection) || {};
            }
            
            if (table) {
                return await SupaDB.fetchAll(table);
            }
            
            // Fallback for unknown collections - try site_config
            return await SupaDB.fetchConfig(collection) || [];
        } catch (err) {
            console.warn(`[getDB] Gagal mengambil '${collection}':`, err.message);
            return table === null ? {} : [];
        }
    }

    async function saveConfig(key, data) {
        await SupaDB.saveConfig(key, data);
    }

    function getLastUpdated() {
        return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // --- Media Utils (Supabase Storage) ---
    // Legacy compressImage kept for preview purposes only
    function compressImageToDataUrl(file, maxWidth = 800, quality = 0.5) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    resolve(dataUrl);
                };
                img.onerror = () => reject(new Error('Gagal memuat gambar.'));
            };
            reader.onerror = error => reject(error);
        });
    }

    // Upload files to Supabase Storage and return URLs
    async function uploadFilesToStorage(files, bucket, prefix, previewContainer, maxFiles = 3) {
        return await SupaStorage.processAndUploadFiles(files, previewContainer, bucket, prefix, maxFiles);
    }

    // Upload single logo to storage
    async function uploadLogoToStorage(fileInput, bucket, prefix = 'logos') {
        return await SupaStorage.handleLogoUpload(fileInput, bucket, prefix);
    }

    // --- Legacy Image Utils (kept for preview rendering) ---
    // These functions are used for client-side preview before Supabase upload
    function compressImage(file, maxWidth = 800, quality = 0.5) {
        return compressImageToDataUrl(file, maxWidth, quality);
    }

    function processFiles(files, previewContainer, targetArray, maxFiles = 3) {
        targetArray.length = 0;
        if(previewContainer) previewContainer.innerHTML = '';
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const promises = [];
        let queued = 0;
        Array.from(files).forEach((file) => {
            if (queued >= maxFiles) return;
            if (!validTypes.includes(file.type)) {
                showToast(`Format file ${file.name} tidak didukung.`, 'error');
                return;
            }
            queued++;
            const promise = compressImage(file).then(dataUrl => {
                targetArray.push(dataUrl);
                if(previewContainer) {
                    previewContainer.innerHTML += `<img src="${dataUrl}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;">`;
                }
            }).catch(error => {
                showToast(`Gagal memproses file ${file.name}.`, 'error');
                console.error(error);
            });
            promises.push(promise);
        });
        return Promise.all(promises);
    }

    function handleImageUpload(fileInput, callback) {
        return new Promise(async (resolve) => {
            if (!fileInput.files || !fileInput.files[0]) return resolve(null);
            const file = fileInput.files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Format file tidak didukung.', 'error');
                fileInput.value = '';
                return resolve(null);
            }
            try {
                const dataUrl = await compressImage(file);
                callback(dataUrl);
                resolve(dataUrl);
            } catch (error) {
                showToast('Gagal memproses gambar.', 'error');
                resolve(null);
            }
        });
    }

    // --- Render Functions ---
    async function renderDashboard() {
        const container = document.getElementById('contentContainer');
        
        const berita = await getDB('berita');
        const kegiatan = await getDB('kegiatan');
        const layanan = await getDB('layanan');
        const lastUpdated = getLastUpdated();
        
        let allTransactions = [];
        let allPrograms = [];
        try { allTransactions = await SupaDB.fetchAll('donasi_transactions'); } catch(e) {}
        try { allPrograms = await SupaDB.fetchAll('donasi_programs'); } catch(e) {}

        // Get 5 latest berita
        const recentBerita = [...berita].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        
        // Get 5 upcoming kegiatan
        const today = new Date().toISOString().split('T')[0];
        const upcomingKegiatan = [...kegiatan]
            .filter(k => (k.tanggal_mulai || '') >= today)
            .sort((a,b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai))
            .slice(0, 5);

        const totalTerkumpul = allTransactions.filter(t => t.status === 'valid').reduce((acc, curr) => acc + (curr.nominal||0), 0);
        const menunggu = allTransactions.filter(t => t.status === 'menunggu_verifikasi').length;
        const kontributor = new Set(allTransactions.map(t => t.email || t.nama)).size;

        const todayDateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        let html = `
            <div style="margin-bottom: 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="margin-bottom: 4px;">Selamat datang, Admin! 👋</h3>
                    <p style="color: var(--text-muted); font-size: 13px;">${new Date().toLocaleDateString('id-ID', todayDateOptions)}</p>
                </div>
                <a href="../index.html" target="_blank" class="btn btn-outline btn-sm" style="gap:6px; font-size:13px;">
                    <i data-lucide="external-link" style="width:14px;height:14px;"></i> Lihat Website Publik
                </a>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card stat-card-green">
                    <div class="stat-icon"><i data-lucide="banknote"></i></div>
                    <div class="stat-info">
                        <div class="stat-value" style="font-size: 18px;">${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(totalTerkumpul)}</div>
                        <div class="stat-label">Dana Terverifikasi</div>
                    </div>
                </div>
                <div class="stat-card stat-card-gold">
                    <div class="stat-icon"><i data-lucide="clock"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${menunggu}</div>
                        <div class="stat-label">Perlu Diverifikasi ${menunggu > 0 ? '<span class="badge badge-warning" style="font-size:10px;">Perhatian</span>' : ''}</div>
                    </div>
                </div>
                <div class="stat-card stat-card-teal">
                    <div class="stat-icon"><i data-lucide="users"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${kontributor}</div>
                        <div class="stat-label">Total Kontributor</div>
                    </div>
                </div>
                <div class="stat-card stat-card-blue">
                    <div class="stat-icon"><i data-lucide="newspaper"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${berita.length}</div>
                        <div class="stat-label">Total Berita</div>
                    </div>
                </div>
                <div class="stat-card stat-card-purple">
                    <div class="stat-icon"><i data-lucide="calendar-days"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${kegiatan.length}</div>
                        <div class="stat-label">Total Kegiatan</div>
                    </div>
                </div>
                <div class="stat-card stat-card-gray">
                    <div class="stat-icon"><i data-lucide="heart-handshake"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${layanan.length}</div>
                        <div class="stat-label">Layanan Aktif</div>
                    </div>
                </div>
            </div>

            <!-- Donasi Programs Progress -->
            ${allPrograms.length > 0 ? `
            <div class="card" style="margin-bottom: 28px;">
                <div class="card-header">
                    <h4 class="card-title">📈 Progress Donasi Per Program</h4>
                    <a href="#donasi-program" class="btn btn-outline btn-sm" style="font-size:12px;">Kelola Program</a>
                </div>
                <div class="card-body">
                    <div style="display:grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap:20px;">
                        ${allPrograms.map(p => {
                            const pct = Math.min(100, Math.round(((p.collected||0) / p.target) * 100));
                            return `
                            <div style="background: var(--bg-light); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color);">
                                <h6 style="margin-bottom: 4px; font-size: 14px;">${p.title}</h6>
                                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                                    Terkumpul: <b style="color: var(--primary-green)">${new Intl.NumberFormat('id-ID',{notation:'compact'}).format(p.collected||0)}</b> / ${new Intl.NumberFormat('id-ID',{notation:'compact'}).format(p.target)}
                                </p>
                                <div class="progress-text"><span></span><span class="progress-percent">${pct}%</span></div>
                                <div class="progress-wrap"><div class="progress-bar ${pct >= 100 ? 'gold' : ''}" style="width: ${pct}%;"></div></div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>` : ''}

            <!-- Recent Tables -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
                <!-- Berita Terbaru -->
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">Berita Terbaru</h4>
                        <a href="#berita" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 12px; border-radius: 4px;">Lihat Semua</a>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="table">
                                <thead><tr><th>Judul</th><th>Tanggal</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${recentBerita.length > 0 ? recentBerita.map(b => `
                                        <tr>
                                            <td style="font-weight: 500;">${b.judul.substring(0, 40)}${b.judul.length > 40 ? '...' : ''}</td>
                                            <td>${b.tanggal}</td>
                                            <td><span class="badge ${b.status === 'Publikasi' ? 'badge-success' : 'badge-secondary'}">${b.status}</span></td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="3" style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada berita.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Kegiatan Mendatang -->
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">Kegiatan Mendatang</h4>
                        <a href="#kegiatan" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 12px; border-radius: 4px;">Lihat Semua</a>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="table">
                                <thead><tr><th>Nama Kegiatan</th><th>Jadwal</th><th>Status</th></tr></thead>
                                <tbody>
                                    ${upcomingKegiatan.length > 0 ? upcomingKegiatan.map(k => `
                                        <tr>
                                            <td style="font-weight: 500;">${k.judul}</td>
                                            <td>${k.tanggal_mulai} ${k.waktu_mulai}</td>
                                            <td><span class="badge badge-warning">${k.status}</span></td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="3" style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada kegiatan mendatang.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        // Make "Lihat Semua" buttons trigger router
        container.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = a.getAttribute('href').replace('#', '');
                const link = document.querySelector(`.sidebar-nav .nav-link[data-page="${hash}"]`);
                if(link) link.click();
            });
        });
    }

    async function renderBeranda() {
        const container = document.getElementById('contentContainer');
        const data = await getDB('beranda_config');
        
        let html = `
            <div class="card">
                <div class="card-header" style="border-bottom: none; padding-bottom: 0;">
                    <div style="display: flex; gap: 20px; border-bottom: 1px solid var(--border-color); width: 100%; overflow-x: auto;">
                        <button class="btn btn-outline" style="border:none; border-bottom: 2px solid var(--primary-green); border-radius: 0; padding: 12px 16px; font-weight: 600; color: var(--primary-green); white-space:nowrap;" id="tabHeroBtn">Hero Section</button>
                        <button class="btn btn-outline" style="border:none; border-bottom: 2px solid transparent; border-radius: 0; padding: 12px 16px; font-weight: 500; color: var(--text-muted); white-space:nowrap;" id="tabStatBtn">Statistik Masjid</button>
                        <button class="btn btn-outline" style="border:none; border-bottom: 2px solid transparent; border-radius: 0; padding: 12px 16px; font-weight: 500; color: var(--text-muted); white-space:nowrap;" id="tabVisiBtn">Visi & Misi</button>
                        <button class="btn btn-outline" style="border:none; border-bottom: 2px solid transparent; border-radius: 0; padding: 12px 16px; font-weight: 500; color: var(--text-muted); white-space:nowrap;" id="tabBannerBtn">Banner Iklan</button>
                        <button class="btn btn-outline" style="border:none; border-bottom: 2px solid transparent; border-radius: 0; padding: 12px 16px; font-weight: 500; color: var(--text-muted); white-space:nowrap;" id="tabVideoBtn">Video Instagram</button>
                    </div>
                </div>
                
                <!-- Tab Hero -->
                <div class="card-body" id="tabHero">
                    <form id="heroForm">
                        <div class="form-group">
                            <label>Teks Arab / Ayat</label>
                            <textarea class="form-control" id="h_ayat" rows="3">${data.ayat}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Nama Masjid</label>
                            <input type="text" class="form-control" id="h_nama" value="${data.namaMasjid}">
                        </div>
                        <div class="form-group">
                            <label>Tagline Utama</label>
                            <input type="text" class="form-control" id="h_tagline" value="${data.tagline}">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Teks Tombol CTA 1 (Aksi Utama)</label>
                                <input type="text" class="form-control" id="h_cta1" value="${data.cta1}">
                            </div>
                            <div class="form-group">
                                <label>Teks Tombol CTA 2 (Aksi Sekunder)</label>
                                <input type="text" class="form-control" id="h_cta2" value="${data.cta2}">
                            </div>
                        </div>
                        <div class="form-group" style="margin-top: 20px;">
                            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Simpan Perubahan Hero</button>
                        </div>
                    </form>
                </div>

                <!-- Tab Statistik -->
                <div class="card-body hidden" id="tabStat">
                    <form id="statForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            ${data.stats.map((s, i) => `
                                <div class="form-group" style="background: var(--bg-light); padding: 15px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                    <label>Statistik ${i+1}</label>
                                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                                        <input type="text" class="form-control" placeholder="Label (Mis: Jamaah Aktif)" id="s_label_${i}" value="${s.label}">
                                        <input type="text" class="form-control" placeholder="Nilai (Mis: 500+)" id="s_value_${i}" value="${s.value}" style="width: 150px;">
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="form-group" style="margin-top: 20px;">
                            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Simpan Statistik</button>
                        </div>
                    </form>
                </div>

                <!-- Tab Visi Misi -->
                <div class="card-body hidden" id="tabVisi">
                    <form id="visiForm">
                        <div class="form-group">
                            <label>Visi Masjid</label>
                            <textarea class="form-control" id="v_visi" rows="3">${data.visi}</textarea>
                        </div>
                        <div class="form-group" style="margin-top: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <label style="margin: 0;">Daftar Misi</label>
                                <button type="button" class="btn btn-outline btn-sm" id="btnTambahMisi" style="padding: 6px 12px; font-size: 13px;">+ Tambah Misi</button>
                            </div>
                            <div id="misiList" style="display: flex; flex-direction: column; gap: 10px;">
                                ${data.misi.map((m, i) => `
                                    <div class="misi-item" style="display: flex; gap: 10px; align-items: flex-start;">
                                        <select class="form-control misi-icon" style="width: 150px;">
                                            <option value="book-open" ${m.icon === 'book-open' ? 'selected' : ''}>Buku (Pendidikan)</option>
                                            <option value="heart-handshake" ${m.icon === 'heart-handshake' ? 'selected' : ''}>Hati (Sosial)</option>
                                            <option value="users" ${m.icon === 'users' ? 'selected' : ''}>Orang (Ukhuwah)</option>
                                            <option value="mosque" ${m.icon === 'mosque' ? 'selected' : ''}>Masjid (Ibadah)</option>
                                        </select>
                                        <input type="text" class="form-control misi-text" value="${m.text}">
                                        <button type="button" class="btn btn-danger btn-hapus-misi" style="padding: 10px;"><i data-lucide="trash-2"></i></button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-group" style="margin-top: 20px;">
                            <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Simpan Visi & Misi</button>
                        </div>
                    </form>
                </div>

                <!-- Tab Banner Iklan -->
                <div class="card-body hidden" id="tabBanner">
                    <div id="tabBannerContent"></div>
                </div>

                <!-- Tab Video Instagram -->
                <div class="card-body hidden" id="tabVideo">
                    <div id="tabVideoContent"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        // Tab Switching Logic
        const tabs = ['Hero', 'Stat', 'Visi', 'Banner', 'Video'];
        tabs.forEach(tab => {
            const btn = document.getElementById(`tab${tab}Btn`);
            if (!btn) return;
            const content = document.getElementById(`tab${tab}`);
            btn.addEventListener('click', () => {
                // reset all
                tabs.forEach(t => {
                    const b = document.getElementById(`tab${t}Btn`);
                    const c = document.getElementById(`tab${t}`);
                    if (!b || !c) return;
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--text-muted)';
                    b.style.fontWeight = '500';
                    c.classList.add('hidden');
                });
                // active
                btn.style.borderBottomColor = 'var(--primary-green)';
                btn.style.color = 'var(--primary-green)';
                btn.style.fontWeight = '600';
                if (content) content.classList.remove('hidden');
                // Lazy-load Banner/Video
                if (tab === 'Banner') renderAdminBanner();
                if (tab === 'Video') renderAdminVideo();
            });
        });

        // Form Submits
        document.getElementById('heroForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            data.ayat = document.getElementById('h_ayat').value;
            data.namaMasjid = document.getElementById('h_nama').value;
            data.tagline = document.getElementById('h_tagline').value;
            data.cta1 = document.getElementById('h_cta1').value;
            data.cta2 = document.getElementById('h_cta2').value;
            await saveConfig('beranda_config', data);
            showToast('Hero section berhasil disimpan!');
            renderBeranda();
        });

        document.getElementById('statForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            for(let i=0; i<4; i++) {
                data.stats[i].label = document.getElementById(`s_label_${i}`).value;
                data.stats[i].value = document.getElementById(`s_value_${i}`).value;
            }
            await saveConfig('beranda_config', data);
            showToast('Statistik berhasil disimpan!');
            renderBeranda();
        });

        // Visi Misi Dynamic List
        document.getElementById('btnTambahMisi').addEventListener('click', () => {
            const list = document.getElementById('misiList');
            const item = document.createElement('div');
            item.className = 'misi-item';
            item.style.cssText = 'display: flex; gap: 10px; align-items: flex-start;';
            item.innerHTML = `
                <select class="form-control misi-icon" style="width: 150px;">
                    <option value="book-open">Buku (Pendidikan)</option>
                    <option value="heart-handshake">Hati (Sosial)</option>
                    <option value="users">Orang (Ukhuwah)</option>
                    <option value="mosque">Masjid (Ibadah)</option>
                </select>
                <input type="text" class="form-control misi-text" placeholder="Masukkan misi baru">
                <button type="button" class="btn btn-danger btn-hapus-misi" style="padding: 10px;"><i data-lucide="trash-2"></i></button>
            `;
            list.appendChild(item);
            lucide.createIcons({root: item});
            bindHapusMisi();
        });

        function bindHapusMisi() {
            document.querySelectorAll('.btn-hapus-misi').forEach(btn => {
                btn.onclick = function() {
                    this.parentElement.remove();
                };
            });
        }
        bindHapusMisi();

        document.getElementById('visiForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            data.visi = document.getElementById('v_visi').value;
            
            const newMisi = [];
            document.querySelectorAll('.misi-item').forEach(item => {
                const icon = item.querySelector('.misi-icon').value;
                const text = item.querySelector('.misi-text').value;
                if(text.trim() !== '') {
                    newMisi.push({icon, text});
                }
            });
            data.misi = newMisi;
            
            await saveConfig('beranda_config', data);
            showToast('Visi & Misi berhasil disimpan!');
            renderBeranda();
        });



    }
    async function renderLayanan() {
        const container = document.getElementById('contentContainer');
        const data = await getDB('layanan');
        
        let html = `
            <div id="layananListView">
                <div class="card">
                    <div class="card-header" style="flex-direction: column; align-items: stretch; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 class="card-title">Layanan Masyarakat</h4>
                            <button class="btn btn-primary btn-sm" id="btnTambahLayanan" style="padding: 6px 14px; font-size: 13px;"><i data-lucide="plus"></i> Tambah Layanan</button>
                        </div>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="table" id="tableLayanan">
                                <thead>
                                    <tr>
                                        <th>Ikon</th>
                                        <th>Nama Layanan</th>
                                        <th>Deskripsi Singkat</th>
                                        <th>Status</th>
                                        <th style="text-align: right;">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.length > 0 ? data.map(l => `
                                        <tr>
                                            <td>
                                                <div style="width: 32px; height: 32px; background: rgba(201,168,76,0.1); color: var(--accent-gold); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                    <i data-lucide="${l.icon || 'star'}"></i>
                                                </div>
                                            </td>
                                            <td style="font-weight: 500;">${l.judul}</td>
                                            <td><span style="display: inline-block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.deskripsi_singkat}</span></td>
                                            <td><span class="badge ${l.status ? 'badge-success' : 'badge-secondary'}">${l.status ? 'Aktif' : 'Nonaktif'}</span></td>
                                            <td style="text-align: right;">
                                                <button class="btn btn-outline btn-sm btn-edit-layanan" data-id="${l.id}" style="padding: 4px 8px;"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                                                <button class="btn btn-outline btn-sm btn-hapus-layanan text-danger" data-id="${l.id}" style="padding: 4px 8px; border-color: transparent;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                            </td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="5" style="text-align:center; padding: 20px;">Belum ada layanan.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div id="layananFormView" class="hidden">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title" id="formLayananTitle">Tambah Layanan Baru</h4>
                        <button class="btn-icon" id="btnBackLayanan"><i data-lucide="arrow-left"></i></button>
                    </div>
                    <div class="card-body">
                        <form id="formLayanan">
                            <input type="hidden" id="l_id">
                            <div class="form-group">
                                <label>Ikon Layanan</label>
                                <select class="form-control" id="l_icon">
                                    <option value="wheat">Beras / Pangan (wheat)</option>
                                    <option value="carrot">Sayur / Makanan (carrot)</option>
                                    <option value="bike">Motor / Kendaraan (bike)</option>
                                    <option value="heart-handshake">Bantuan / Donasi (heart-handshake)</option>
                                    <option value="book-open">Pendidikan (book-open)</option>
                                    <option value="cross">Kesehatan (cross)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Nama Layanan</label>
                                <input type="text" class="form-control" id="l_judul" required maxlength="50">
                            </div>
                            <div class="form-group">
                                <label>Deskripsi Singkat</label>
                                <textarea class="form-control" id="l_deskripsi_singkat" rows="3" required maxlength="150"></textarea>
                                <div class="form-text">Maksimal 150 karakter.</div>
                            </div>
                            
                            <div class="form-group">
                                <label>Logo / Watermark (Opsional)</label>
                                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                                    <div style="width: 60px; height: 60px; border-radius: 8px; background: #ddd; overflow:hidden;">
                                        <img id="l_logo_preview" src="" style="width:100%; height:100%; object-fit:contain; display:none;">
                                    </div>
                                    <input type="file" id="l_logo_input" accept="image/jpeg, image/png, image/webp" style="display:none">
                                    <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('l_logo_input').click()">Pilih Logo</button>
                                </div>
                                <input type="hidden" id="l_logo_base64">
                            </div>

                            <div class="form-group">
                                <label>Deskripsi Lengkap / Detail</label>
                                <div id="l_editor-container" style="height: 300px; background: white; border-radius: 0 0 8px 8px;"></div>
                            </div>

                            <div class="form-group">
                                <label>Galeri Foto (Opsional, format JPG/PNG/WEBP, max 3 file)</label>
                                <input type="file" id="l_foto_input" accept="image/jpeg, image/png, image/webp" multiple class="form-control" style="margin-bottom:10px;">
                                <div id="l_foto_preview" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;"></div>
                                <div class="form-text">Pilih hingga 3 gambar. Gambar pertama akan jadi Thumbnail default.</div>
                            </div>

                            <div class="form-group">
                                <label>Status Aktif</label>
                                <select class="form-control" id="l_status">
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>

                            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
                                <button type="button" class="btn btn-secondary" id="btnCancelLayanan">Batal</button>
                                <button type="submit" class="btn btn-primary" id="btnSimpanLayanan"><i data-lucide="save"></i> Simpan Layanan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        const listView = document.getElementById('layananListView');
        const formView = document.getElementById('layananFormView');
        const form = document.getElementById('formLayanan');
        
        // Initialize Quill for Layanan deskripsi lengkap
        const layQuill = new Quill('#l_editor-container', {
            theme: 'snow',
            modules: { toolbar: [ [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean'] ] }
        });

        let currentFotosLayanan = [];

        document.getElementById('l_foto_input').addEventListener('change', async function(e) {
            const btnSimpan = document.getElementById('btnSimpanLayanan');
            if (btnSimpan) btnSimpan.disabled = true;
            try {
                const urls = await uploadFilesToStorage(e.target.files, 'layanan-images', 'layanan', document.getElementById('l_foto_preview'), 3);
                currentFotosLayanan = urls;
            } catch (err) {
                console.error(err);
            }
            if (btnSimpan) btnSimpan.disabled = false;
        });

        document.getElementById('l_logo_input').addEventListener('change', async function(e) {
            const btnSimpan = document.getElementById('btnSimpanLayanan');
            if (btnSimpan) btnSimpan.disabled = true;
            try {
                const url = await uploadLogoToStorage(this, 'layanan-images', 'logos');
                if (url) {
                    const prev = document.getElementById('l_logo_preview');
                    prev.src = url;
                    prev.style.display = 'block';
                    document.getElementById('l_logo_base64').value = url;
                }
            } catch (err) {
                console.error(err);
            }
            if (btnSimpan) btnSimpan.disabled = false;
        });

        function showForm(id = null) {
            form.reset();
            document.getElementById('l_id').value = '';
            document.getElementById('formLayananTitle').textContent = 'Tambah Layanan Baru';
            layQuill.root.innerHTML = '';
            currentFotosLayanan = [];
            document.getElementById('l_foto_preview').innerHTML = '';
            document.getElementById('l_logo_base64').value = '';
            document.getElementById('l_logo_preview').style.display = 'none';

            if (id) {
                const item = data.find(l => l.id == id);
                if (item) {
                    document.getElementById('formLayananTitle').textContent = 'Edit Layanan';
                    document.getElementById('l_id').value = item.id;
                    document.getElementById('l_icon').value = item.icon || 'heart-handshake';
                    document.getElementById('l_judul').value = item.judul;
                    document.getElementById('l_deskripsi_singkat').value = item.deskripsi_singkat;
                    layQuill.root.innerHTML = item.deskripsi_lengkap || '';
                    document.getElementById('l_status').value = item.status ? '1' : '0';
                    
                    if (item.logo) {
                        document.getElementById('l_logo_base64').value = item.logo;
                        document.getElementById('l_logo_preview').src = item.logo;
                        document.getElementById('l_logo_preview').style.display = 'block';
                    }

                    if (item.images && item.images.length > 0) {
                        currentFotosLayanan = [...item.images];
                        document.getElementById('l_foto_preview').innerHTML = currentFotosLayanan.map(f => `<img src="${f}" style="width:80px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #ccc;">`).join('');
                    }
                }
            }
            listView.classList.add('hidden');
            formView.classList.remove('hidden');
        }

        function hideForm() {
            formView.classList.add('hidden');
            listView.classList.remove('hidden');
        }

        document.getElementById('btnTambahLayanan').addEventListener('click', () => showForm());
        document.getElementById('btnBackLayanan').addEventListener('click', hideForm);
        document.getElementById('btnCancelLayanan').addEventListener('click', hideForm);

        document.querySelectorAll('.btn-edit-layanan').forEach(btn => {
            btn.addEventListener('click', (e) => showForm(btn.getAttribute('data-id')));
        });

        document.querySelectorAll('.btn-hapus-layanan').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
                    const id = btn.getAttribute('data-id');
                    try {
                        await SupaDB.deleteItem('layanan_masyarakat', id);
                        showToast('Layanan berhasil dihapus');
                        renderLayanan(); // re-render
                    } catch (err) {
                        showToast('Gagal menghapus layanan', 'error');
                        console.error(err);
                    }
                }
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('l_id').value;
            
            const btnSimpan = document.getElementById('btnSimpanLayanan');
            const originalText = btnSimpan.innerHTML;
            btnSimpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSimpan.disabled = true;

            const newItem = {
                judul: document.getElementById('l_judul').value,
                deskripsi_singkat: document.getElementById('l_deskripsi_singkat').value,
                deskripsi_lengkap: layQuill.root.innerHTML === '<p><br></p>' ? '' : layQuill.root.innerHTML,
                images: currentFotosLayanan || [],
                logo: document.getElementById('l_logo_base64').value || null,
                icon: document.getElementById('l_icon').value,
                status: document.getElementById('l_status').value === '1'
            };

            try {
                if (id) {
                    await SupaDB.updateItem('layanan_masyarakat', id, newItem);
                } else {
                    await SupaDB.insertItem('layanan_masyarakat', newItem);
                }
                showToast(id ? 'Layanan berhasil diperbarui!' : 'Layanan berhasil ditambahkan!');
                hideForm();
                renderLayanan();
            } catch (err) {
                showToast('Gagal menyimpan layanan', 'error');
                console.error(err);
            } finally {
                btnSimpan.disabled = false;
                btnSimpan.innerHTML = originalText;
            }
        });
    }
    async function renderBerita() {
        const container = document.getElementById('contentContainer');
        const data = await getDB('berita');
        
        let html = `
            <div id="beritaListView">
                <div class="card">
                    <div class="card-header" style="flex-direction: column; align-items: stretch; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4 class="card-title">Daftar Berita</h4>
                            <button class="btn btn-primary btn-sm" id="btnTulisBerita" style="padding: 6px 14px; font-size: 13px;"><i data-lucide="pen-tool"></i> Tulis Berita Baru</button>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" class="form-control" id="searchBerita" placeholder="Cari judul..." style="max-width: 250px;">
                            <select class="form-control" id="filterKategoriBerita" style="max-width: 150px;">
                                <option value="">Semua Kategori</option>
                                <option value="Umum">Umum</option>
                                <option value="Keislaman">Keislaman</option>
                                <option value="Kegiatan">Kegiatan</option>
                                <option value="Pengumuman">Pengumuman</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="table" id="tableBerita">
                                <thead>
                                    <tr>
                                        <th>Judul</th>
                                        <th>Kategori</th>
                                        <th>Tanggal Publikasi</th>
                                        <th>Status</th>
                                        <th style="text-align: right;">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Populated via JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div id="beritaFormView" class="hidden">
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title" id="formBeritaTitle">Tulis Berita Baru</h4>
                        <button class="btn-icon" id="btnBackBerita"><i data-lucide="arrow-left"></i></button>
                    </div>
                    <div class="card-body">
                        <form id="formBerita">
                            <input type="hidden" id="b_id">
                            
                            <div class="form-group">
                                <label>Judul Berita</label>
                                <input type="text" class="form-control" id="b_judul" style="font-size: 18px; font-weight: 600;" required>
                            </div>

                            <div class="form-group">
                                <label>Deskripsi Singkat (Preview)</label>
                                <textarea class="form-control" id="b_deskripsi_singkat" rows="2" maxlength="200" required placeholder="Teks singkat yang muncul di kartu berita..."></textarea>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Slug URL (Otomatis)</label>
                                    <input type="text" class="form-control" id="b_slug" required>
                                </div>
                                <div class="form-group">
                                    <label>Kategori</label>
                                    <select class="form-control" id="b_kategori" required>
                                        <option value="Umum">Umum</option>
                                        <option value="Keislaman">Keislaman</option>
                                        <option value="Kegiatan">Kegiatan</option>
                                        <option value="Pengumuman">Pengumuman</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Tanggal Publikasi</label>
                                    <input type="date" class="form-control" id="b_tanggal" required>
                                </div>
                                <div class="form-group">
                                    <label>Status Publikasi</label>
                                    <select class="form-control" id="b_status" required>
                                        <option value="Publikasi">Publikasi</option>
                                        <option value="Draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Berita Logo / Watermark (Opsional)</label>
                                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                                    <div style="width: 60px; height: 60px; border-radius: 8px; background: #ddd; overflow:hidden;">
                                        <img id="b_logo_preview" src="" style="width:100%; height:100%; object-fit:contain; display:none;">
                                    </div>
                                    <input type="file" id="b_logo_input" accept="image/jpeg, image/png, image/webp" style="display:none">
                                    <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('b_logo_input').click()">Pilih Logo</button>
                                </div>
                                <input type="hidden" id="b_logo_base64">
                            </div>

                            <div class="form-group">
                                <label>Isi Berita Lengkap</label>
                                <div id="editor-container" style="height: 300px; background: white; border-radius: 0 0 8px 8px;"></div>
                            </div>

                            <div class="form-group">
                                <label>Galeri Foto (Format JPG/PNG/WEBP, max 3 file)</label>
                                <input type="file" id="b_foto_input" accept="image/jpeg, image/png, image/webp" multiple class="form-control" style="margin-bottom:10px;">
                                <div id="b_foto_preview" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;"></div>
                                <div class="form-text">Gambar pertama akan dijadikan Thumbnail utama (Rasio otomatis 16:9).</div>
                            </div>

                            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
                                <button type="button" class="btn btn-secondary" id="btnCancelFormBerita">Batal</button>
                                <button type="submit" class="btn btn-primary" id="btnSimpanBerita"><i data-lucide="save"></i> Simpan Berita</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        // Initialize Quill
        const editorConfig = {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        };
        const quill = new Quill('#editor-container', editorConfig);

        const listView = document.getElementById('beritaListView');
        const formView = document.getElementById('beritaFormView');
        const searchInput = document.getElementById('searchBerita');
        const filterSelect = document.getElementById('filterKategoriBerita');
        const tbody = document.querySelector('#tableBerita tbody');

        function renderTable() {
            const search = searchInput.value.toLowerCase();
            const filter = filterSelect.value;

            const filtered = data.filter(b => {
                const matchSearch = b.judul.toLowerCase().includes(search);
                const matchFilter = filter ? b.kategori === filter : true;
                return matchSearch && matchFilter;
            }).sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Tidak ada berita ditemukan.</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(b => `
                <tr>
                    <td style="font-weight: 500;">
                        ${b.judul.substring(0, 50)}${b.judul.length > 50 ? '...' : ''}
                        <br><small style="color: var(--text-muted);">${b.slug}</small>
                    </td>
                    <td>${b.kategori}</td>
                    <td>${b.tanggal}</td>
                    <td><span class="badge ${b.status === 'Publikasi' ? 'badge-success' : 'badge-secondary'}">${b.status}</span></td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-sm btn-edit-berita" data-id="${b.id}" style="padding: 4px 8px;"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                        <button class="btn btn-outline btn-sm btn-hapus-berita text-danger" data-id="${b.id}" style="padding: 4px 8px; border-color: transparent;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                    </td>
                </tr>
            `).join('');

            lucide.createIcons({root: tbody});
            bindTableEvents();
        }

        function checkSlugStatus(slugStr) {
           return slugStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        document.getElementById('b_judul').addEventListener('input', function() {
            if(!document.getElementById('b_id').value) {
                document.getElementById('b_slug').value = checkSlugStatus(this.value);
            }
        });

        function bindTableEvents() {
            document.querySelectorAll('.btn-edit-berita').forEach(btn => {
                btn.onclick = (e) => showForm(btn.getAttribute('data-id'));
            });
            document.querySelectorAll('.btn-hapus-berita').forEach(btn => {
                btn.onclick = async (e) => {
                    if (confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
                        const id = btn.getAttribute('data-id');
                        try {
                            await SupaDB.deleteItem('berita', id);
                            showToast('Berita berhasil dihapus');
                            renderBerita(); // fully re-render
                        } catch (err) {
                            showToast('Gagal menghapus berita', 'error');
                            console.error(err);
                        }
                    }
                };
            });
        }

        let currentFotosBerita = [];
        let _beritaFileReadPromise = Promise.resolve();

        document.getElementById('b_foto_input').addEventListener('change', async function(e) {
            const submitBtn = document.getElementById('btnSimpanBerita');
            if(submitBtn) submitBtn.disabled = true;
            try {
                const urls = await uploadFilesToStorage(e.target.files, 'berita-images', 'berita', document.getElementById('b_foto_preview'), 3);
                currentFotosBerita = urls;
            } catch (err) {
                console.error(err);
            }
            if(submitBtn) submitBtn.disabled = false;
        });

        document.getElementById('b_logo_input').addEventListener('change', async function(e) {
            const submitBtn = document.getElementById('btnSimpanBerita');
            if(submitBtn) submitBtn.disabled = true;
            try {
                const url = await uploadLogoToStorage(this, 'berita-images', 'berita_logos');
                if (url) {
                    const prev = document.getElementById('b_logo_preview');
                    prev.src = url;
                    prev.style.display = 'block';
                    document.getElementById('b_logo_base64').value = url;
                }
            } catch (err) {
                console.error(err);
            }
            if(submitBtn) submitBtn.disabled = false;
        });

        function showForm(id = null) {
            document.getElementById('formBerita').reset();
            quill.root.innerHTML = '';
            document.getElementById('b_id').value = '';
            document.getElementById('formBeritaTitle').textContent = 'Tulis Berita Baru';
            document.getElementById('b_tanggal').value = new Date().toISOString().split('T')[0];
            currentFotosBerita = [];
            document.getElementById('b_foto_preview').innerHTML = '';

            document.getElementById('b_logo_base64').value = '';
            document.getElementById('b_logo_preview').style.display = 'none';

            if (id) {
                const item = data.find(b => b.id == id);
                if (item) {
                    document.getElementById('formBeritaTitle').textContent = 'Edit Berita';
                    document.getElementById('b_id').value = item.id;
                    document.getElementById('b_judul').value = item.judul;
                    document.getElementById('b_slug').value = item.slug;
                    document.getElementById('b_kategori').value = item.kategori;
                    document.getElementById('b_tanggal').value = item.tanggal;
                    document.getElementById('b_status').value = item.status;
                    document.getElementById('b_deskripsi_singkat').value = item.deskripsi_singkat || '';
                    quill.root.innerHTML = item.deskripsi_lengkap || '';
                    if (item.logo) {
                        document.getElementById('b_logo_base64').value = item.logo;
                        document.getElementById('b_logo_preview').src = item.logo;
                        document.getElementById('b_logo_preview').style.display = 'block';
                    }
                    if (item.images && item.images.length > 0) {
                        currentFotosBerita = [...item.images];
                        document.getElementById('b_foto_preview').innerHTML = currentFotosBerita.map(f => `<img src="${f}" style="width:80px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #ccc;">`).join('');
                    }
                }
            }
            listView.classList.add('hidden');
            formView.classList.remove('hidden');
        }

        function hideForm() {
            formView.classList.add('hidden');
            listView.classList.remove('hidden');
            renderTable();
        }

        searchInput.addEventListener('input', renderTable);
        filterSelect.addEventListener('change', renderTable);
        
        document.getElementById('btnTulisBerita').addEventListener('click', () => showForm());
        document.getElementById('btnBackBerita').addEventListener('click', hideForm);
        document.getElementById('btnCancelFormBerita').addEventListener('click', hideForm);

        document.getElementById('formBerita').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btnSimpanBerita') || e.submitter;
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }

            const id = document.getElementById('b_id').value;
            
            const newItem = {
                judul: document.getElementById('b_judul').value,
                slug: document.getElementById('b_slug').value,
                kategori: document.getElementById('b_kategori').value,
                tanggal: document.getElementById('b_tanggal').value,
                status: document.getElementById('b_status').value,
                deskripsi_singkat: document.getElementById('b_deskripsi_singkat').value,
                deskripsi_lengkap: quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML,
                images: currentFotosBerita || [],
                logo: document.getElementById('b_logo_base64').value || null
            };

            try {
                if (id) {
                    await SupaDB.updateItem('berita', id, newItem);
                } else {
                    await SupaDB.insertItem('berita', newItem);
                }
                showToast(id ? 'Berita berhasil diperbarui!' : 'Berita berhasil diterbitkan!');
                hideForm();
                renderBerita();
            } catch (err) {
                showToast('Gagal menyimpan berita', 'error');
                console.error(err);
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i data-lucide="save"></i> Simpan Berita'; }
            }
        });

        // initial render
        renderTable();
    }
    async function renderKegiatan() {
        const container = document.getElementById('contentContainer');
        const data = await getDB('kegiatan');
        
        let currentDate = new Date();
        let currentView = 'list'; // list or calendar

        function renderBase() {
            let html = `
                <div id="kegiatanListContainer">
                    <div class="card">
                        <div class="card-header" style="flex-direction: column; align-items: stretch; gap: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <h4 class="card-title">Jadwal & Kegiatan Masjid</h4>
                                    <span class="badge badge-primary">${data.length} Total</span>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <div style="display: flex; background: var(--bg-light); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
                                        <button class="btn btn-outline btn-sm ${currentView === 'list'?'btn-primary':''}" id="btnViewList" style="border: none; border-radius: 0; padding: 6px 12px;"><i data-lucide="list"></i></button>
                                        <button class="btn btn-outline btn-sm ${currentView === 'calendar'?'btn-primary':''}" id="btnViewCalendar" style="border: none; border-radius: 0; padding: 6px 12px;"><i data-lucide="calendar"></i></button>
                                    </div>
                                    <button class="btn btn-primary btn-sm" id="btnTambahKegiatan" style="padding: 6px 14px; font-size: 13px;"><i data-lucide="plus"></i> Tambah Kegiatan</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body" style="padding: 0;" id="kegiatanContentView">
                            <!-- Content goes here -->
                        </div>
                    </div>
                </div>

                <!-- Form Kegiatan View -->
                <div id="kegiatanFormView" class="hidden">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title" id="formKegiatanTitle">Tambah Kegiatan</h4>
                            <button class="btn-icon" id="btnBackKegiatan"><i data-lucide="arrow-left"></i></button>
                        </div>
                        <div class="card-body">
                            <form id="formKegiatan">
                                <input type="hidden" id="k_id">
                                <div class="form-group">
                                    <label>Judul Kegiatan</label>
                                    <input type="text" class="form-control" id="k_judul" required>
                                </div>
                                <div class="form-group">
                                    <label>Kategori</label>
                                    <select class="form-control" id="k_kategori" required>
                                        <option value="Kajian Rutin">Kajian Rutin</option>
                                        <option value="Event Khusus">Event Khusus</option>
                                        <option value="Ibadah">Ibadah</option>
                                        <option value="Sosial Kemasyarakatan">Sosial Kemasyarakatan</option>
                                        <option value="Pendidikan">Pendidikan</option>
                                    </select>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div class="form-group">
                                        <label>Tanggal Mulai</label>
                                        <input type="date" class="form-control" id="k_tanggal_mulai" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Waktu Mulai</label>
                                        <input type="time" class="form-control" id="k_waktu_mulai" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Lokasi / Tempat</label>
                                    <input type="text" class="form-control" id="k_lokasi" placeholder="Misal: Lantai Utama Masjid" required>
                                </div>
                                <div class="form-group">
                                    <label>Deskripsi Singkat (Preview)</label>
                                    <textarea class="form-control" id="k_deskripsi_singkat" rows="2" maxlength="200" required></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label>Kegiatan Logo / Watermark (Opsional)</label>
                                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                                        <div style="width: 60px; height: 60px; border-radius: 8px; background: #ddd; overflow:hidden;">
                                            <img id="k_logo_preview" src="" style="width:100%; height:100%; object-fit:contain; display:none;">
                                        </div>
                                        <input type="file" id="k_logo_input" accept="image/jpeg, image/png, image/webp" style="display:none">
                                        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('k_logo_input').click()">Pilih Logo</button>
                                    </div>
                                    <input type="hidden" id="k_logo_base64">
                                </div>

                                <div class="form-group">
                                    <label>Deskripsi Lengkap / Detail</label>
                                    <div id="k_editor-container" style="height: 300px; background: white; border-radius: 0 0 8px 8px;"></div>
                                </div>

                                <div class="form-group">
                                    <label>Galeri Foto (Opsional, format JPG/PNG/WEBP, max 3 file)</label>
                                    <input type="file" id="k_foto_input" accept="image/jpeg, image/png, image/webp" multiple class="form-control" style="margin-bottom:10px;">
                                    <div id="k_foto_preview" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;"></div>
                                    <div class="form-text">Gambar pertama akan dijadikan Thumbnail (Rasio otomatis 16:9).</div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div class="form-group">
                                        <label>Status</label>
                                        <select class="form-control" id="k_status" required>
                                            <option value="Akan Datang">Akan Datang</option>
                                            <option value="Berlangsung">Berlangsung</option>
                                            <option value="Selesai">Selesai</option>
                                            <option value="Dibatalkan">Dibatalkan</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Tampilkan di Website</label>
                                        <select class="form-control" id="k_tampilkan">
                                            <option value="1">Ya</option>
                                            <option value="0">Tidak</option>
                                        </select>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
                                    <button type="button" class="btn btn-secondary" id="btnCancelKegiatan">Batal</button>
                                    <button type="submit" class="btn btn-primary" id="btnSimpanKegiatan"><i data-lucide="save"></i> Simpan Kegiatan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = html;
            lucide.createIcons({root: container});

            const listView = document.getElementById('kegiatanListContainer');
            const formView = document.getElementById('kegiatanFormView');

            const kegQuill = new Quill('#k_editor-container', {
                theme: 'snow',
                modules: { toolbar: [ [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean'] ] }
            });

            let currentFotosKegiatan = [];
            let _kegiatanFileReadPromise = Promise.resolve();
            document.getElementById('k_foto_input').addEventListener('change', async function(e) {
                const submitBtn = document.getElementById('btnSimpanKegiatan');
                if(submitBtn) submitBtn.disabled = true;
                try {
                    const urls = await uploadFilesToStorage(e.target.files, 'kegiatan-images', 'kegiatan', document.getElementById('k_foto_preview'), 3);
                    currentFotosKegiatan = urls;
                } catch (err) {
                    console.error(err);
                }
                if(submitBtn) submitBtn.disabled = false;
            });

            document.getElementById('k_logo_input').addEventListener('change', async function(e) {
                const submitBtn = document.getElementById('btnSimpanKegiatan');
                if(submitBtn) submitBtn.disabled = true;
                try {
                    const url = await uploadLogoToStorage(this, 'kegiatan-images', 'kegiatan_logos');
                    if(url) {
                        const prev = document.getElementById('k_logo_preview');
                        prev.src = url;
                        prev.style.display = 'block';
                        document.getElementById('k_logo_base64').value = url;
                    }
                } catch (err) {
                    console.error(err);
                }
                if(submitBtn) submitBtn.disabled = false;
            });

            document.getElementById('btnViewList').addEventListener('click', () => { currentView = 'list'; renderBase(); });
            document.getElementById('btnViewCalendar').addEventListener('click', () => { currentView = 'calendar'; renderBase(); });
            
            document.getElementById('btnTambahKegiatan').addEventListener('click', () => showForm());
            document.getElementById('btnBackKegiatan').addEventListener('click', hideForm);
            document.getElementById('btnCancelKegiatan').addEventListener('click', hideForm);

            document.getElementById('formKegiatan').addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('k_id').value;
                
                const btnSimpan = document.getElementById('btnSimpanKegiatan');
                const originalText = btnSimpan.innerHTML;
                btnSimpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
                btnSimpan.disabled = true;

                const newItem = {
                    judul: document.getElementById('k_judul').value,
                    kategori: document.getElementById('k_kategori').value,
                    tanggal_mulai: document.getElementById('k_tanggal_mulai').value,
                    waktu_mulai: document.getElementById('k_waktu_mulai').value,
                    lokasi: document.getElementById('k_lokasi').value,
                    deskripsi_singkat: document.getElementById('k_deskripsi_singkat').value,
                    deskripsi_lengkap: kegQuill.root.innerHTML === '<p><br></p>' ? '' : kegQuill.root.innerHTML,
                    images: currentFotosKegiatan || [],
                    logo: document.getElementById('k_logo_base64').value || null,
                    status: document.getElementById('k_status').value,
                    tampilkan: document.getElementById('k_tampilkan').value === '1'
                };

                try {
                    if (id) {
                        await SupaDB.updateItem('kegiatan_masjid', id, newItem);
                    } else {
                        await SupaDB.insertItem('kegiatan_masjid', newItem);
                    }
                    showToast(id ? 'Kegiatan berhasil diperbarui' : 'Kegiatan berhasil disimpan');
                    hideForm();
                    renderKegiatan(); // full re-render
                } catch (e) {
                    console.error(e);
                    showToast('Gagal menyimpan kegiatan', 'error');
                } finally {
                    btnSimpan.disabled = false;
                    btnSimpan.innerHTML = originalText;
                }
            });

            function showForm(id = null) {
                document.getElementById('formKegiatan').reset();
                document.getElementById('k_id').value = '';
                document.getElementById('formKegiatanTitle').textContent = 'Tambah Kegiatan';
                document.getElementById('k_tanggal_mulai').value = new Date().toISOString().split('T')[0];
                document.getElementById('k_waktu_mulai').value = '08:00';
                kegQuill.root.innerHTML = '';
                currentFotosKegiatan = [];
                document.getElementById('k_foto_preview').innerHTML = '';
                document.getElementById('k_logo_base64').value = '';
                document.getElementById('k_logo_preview').style.display = 'none';

                if(id) {
                    const item = data.find(k => k.id == id);
                    if(item) {
                        document.getElementById('formKegiatanTitle').textContent = 'Edit Kegiatan';
                        document.getElementById('k_id').value = item.id;
                        document.getElementById('k_judul').value = item.judul;
                        document.getElementById('k_kategori').value = item.kategori;
                        document.getElementById('k_tanggal_mulai').value = item.tanggal_mulai;
                        document.getElementById('k_waktu_mulai').value = item.waktu_mulai;
                        document.getElementById('k_lokasi').value = item.lokasi;
                        document.getElementById('k_deskripsi_singkat').value = item.deskripsi_singkat || '';
                        kegQuill.root.innerHTML = item.deskripsi_lengkap || '';
                        document.getElementById('k_status').value = item.status;
                        document.getElementById('k_tampilkan').value = item.tampilkan ? '1' : '0';
                        
                        if (item.logo) {
                            document.getElementById('k_logo_base64').value = item.logo;
                            document.getElementById('k_logo_preview').src = item.logo;
                            document.getElementById('k_logo_preview').style.display = 'block';
                        }

                        if (item.images && item.images.length > 0) {
                            currentFotosKegiatan = [...item.images];
                            document.getElementById('k_foto_preview').innerHTML = currentFotosKegiatan.map(f => `<img src="${f}" style="width:80px;height:45px;object-fit:cover;border-radius:4px;border:1px solid #ccc;">`).join('');
                        }
                    }
                }
                listView.classList.add('hidden');
                formView.classList.remove('hidden');
            }

            function hideForm() {
                formView.classList.add('hidden');
                listView.classList.remove('hidden');
            }

            function updateView() {
                const content = document.getElementById('kegiatanContentView');
                if(currentView === 'list') {
                    renderListView(content);
                } else {
                    renderCalendarView(content);
                }
            }

            function renderListView(content) {
                // Sort selected items
                const sorted = [...data].sort((a,b) => new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai));
                content.innerHTML = `
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nama Kegiatan</th>
                                    <th>Tanggal & Waktu</th>
                                    <th>Lokasi</th>
                                    <th>Kategori</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sorted.length > 0 ? sorted.map(k => `
                                    <tr>
                                        <td style="font-weight: 500;">${k.judul}</td>
                                        <td>${k.tanggal_mulai} <small class="text-muted">${k.waktu_mulai}</small></td>
                                        <td>${k.lokasi}</td>
                                        <td><span class="badge badge-secondary">${k.kategori}</span></td>
                                        <td>
                                            <span class="badge ${k.status === 'Selesai' ? 'badge-success' : k.status === 'Dibatalkan' ? 'badge-danger' : 'badge-warning'}">
                                                ${k.status}
                                            </span>
                                        </td>
                                        <td style="text-align: right;">
                                            <button class="btn btn-outline btn-sm btn-edit-keg" data-id="${k.id}" style="padding: 4px 8px;"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                                            <button class="btn btn-outline btn-sm btn-hapus-keg text-danger" data-id="${k.id}" style="padding: 4px 8px; border-color: transparent;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" style="text-align:center; padding:20px;">Tidak ada kegiatan.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
                lucide.createIcons({root: content});
                bindKegiatanEvents();
            }

            function renderCalendarView(content) {
                const y = currentDate.getFullYear();
                const m = currentDate.getMonth();
                
                const firstDay = new Date(y, m, 1).getDay();
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                
                const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                
                let gridHTML = '';
                // Empty slots before first day
                for(let i=0; i<firstDay; i++) {
                    gridHTML += `<div class="calendar-cell empty"></div>`;
                }

                const today = new Date();
                for(let i=1; i<=daysInMonth; i++) {
                    const isToday = y === today.getFullYear() && m === today.getMonth() && i === today.getDate();
                    const currentDateStr = `${y}-${(m+1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                    
                    // Find events for this day
                    const dayEvents = data.filter(k => k.tanggal_mulai === currentDateStr);
                    
                    gridHTML += `
                        <div class="calendar-cell ${isToday ? 'today' : ''}">
                            <span class="calendar-date-num">${i}</span>
                            ${dayEvents.map(ev => `
                                <div class="calendar-event btn-edit-keg" data-id="${ev.id}" title="${ev.judul}">
                                    ${ev.waktu_mulai} ${ev.judul}
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                content.innerHTML = `
                    <div style="padding: 20px;">
                        <div class="calendar-container">
                            <div class="calendar-header">
                                <button class="btn btn-outline btn-sm" id="calPrev"><i data-lucide="chevron-left"></i></button>
                                <h4 style="margin:0;">${monthNames[m]} ${y}</h4>
                                <button class="btn btn-outline btn-sm" id="calNext"><i data-lucide="chevron-right"></i></button>
                            </div>
                            <div class="calendar-grid">
                                <div class="calendar-day-header">Min</div>
                                <div class="calendar-day-header">Sen</div>
                                <div class="calendar-day-header">Sel</div>
                                <div class="calendar-day-header">Rab</div>
                                <div class="calendar-day-header">Kam</div>
                                <div class="calendar-day-header">Jum</div>
                                <div class="calendar-day-header">Sab</div>
                            </div>
                            <div class="calendar-grid" style="border-bottom: none;">
                                ${gridHTML}
                            </div>
                        </div>
                    </div>
                `;
                lucide.createIcons({root: content});
                bindKegiatanEvents();

                document.getElementById('calPrev').addEventListener('click', () => {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    updateView();
                });
                document.getElementById('calNext').addEventListener('click', () => {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    updateView();
                });
            }

            function bindKegiatanEvents() {
                document.querySelectorAll('.btn-edit-keg').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        showForm(btn.getAttribute('data-id'));
                    };
                });
                document.querySelectorAll('.btn-hapus-keg').forEach(btn => {
                    btn.onclick = async (e) => {
                        if(confirm("Hapus kegiatan ini?")) {
                            const id = btn.getAttribute('data-id');
                            try {
                                await SupaDB.deleteItem('kegiatan_masjid', id);
                                showToast('Kegiatan dihapus');
                                renderKegiatan(); // fully re-render
                            } catch (err) {
                                showToast('Gagal menghapus kegiatan', 'error');
                                console.error(err);
                            }
                        }
                    };
                });
            }

            updateView();
        }

        renderBase();
    }
    async function renderPengaturan() {
        const container = document.getElementById('contentContainer');
        const data = await getDB('pengaturan_umum') || {};
        
        // Populate missing fields if any from previous versions
        data.sosmed = data.sosmed || {
            ig: 'https://instagram.com/',
            fb: 'https://facebook.com/',
            yt: 'https://youtube.com/',
            tw: 'https://twitter.com/'
        };
        data.logo = data.logo || '';
        data.favicon = data.favicon || '';

        let html = `
            <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                <!-- Pengaturan Umum -->
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">Pengaturan Umum Website</h4>
                    </div>
                    <div class="card-body">
                        <form id="formPengaturan">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Nama Masjid</label>
                                    <input type="text" class="form-control" id="p_nama" value="${data.namaMasjid}" required>
                                </div>
                                <div class="form-group">
                                    <label>Logo Masjid (URL)</label>
                                    <input type="url" class="form-control" id="p_logo" value="${data.logo}" placeholder="https://...">
                                    ${data.logo ? `<div style="margin-top: 10px;"><img src="${data.logo}" style="height: 40px; border-radius: 4px;" alt="Logo Preview"></div>` : ''}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Alamat Lengkap</label>
                                <textarea class="form-control" id="p_alamat" rows="2" required>${data.alamat}</textarea>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Nomor Telepon / WhatsApp</label>
                                    <input type="text" class="form-control" id="p_telepon" value="${data.telepon}" required>
                                </div>
                                <div class="form-group">
                                    <label>Email Resmi</label>
                                    <input type="email" class="form-control" id="p_email" value="${data.email}" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Link Google Maps Embed (iframe src URL)</label>
                                <input type="url" class="form-control" id="p_maps" value="${data.mapsUrl}">
                                ${data.mapsUrl ? `<div style="margin-top: 10px; width: 100%; max-width: 400px; height: 150px; background: #eee; border-radius: 8px; overflow: hidden;"><iframe src="${data.mapsUrl}" width="100%" height="150" style="border:0;" allowfullscreen="" loading="lazy"></iframe></div>` : ''}
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Jam Operasional Sekretariat</label>
                                    <input type="text" class="form-control" id="p_jam" value="${data.jamOperasional}">
                                </div>
                                <div class="form-group">
                                    <label>Teks Footer Copyright</label>
                                    <input type="text" class="form-control" id="p_copyright" value="${data.copyright}">
                                </div>
                            </div>

                            <h5 style="margin-top: 24px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Media Sosial</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label><i data-lucide="instagram" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Instagram URL</label>
                                    <input type="url" class="form-control" id="p_ig" value="${data.sosmed.ig}">
                                </div>
                                <div class="form-group">
                                    <label><i data-lucide="facebook" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Facebook URL</label>
                                    <input type="url" class="form-control" id="p_fb" value="${data.sosmed.fb}">
                                </div>
                                <div class="form-group">
                                    <label><i data-lucide="youtube" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> YouTube URL</label>
                                    <input type="url" class="form-control" id="p_yt" value="${data.sosmed.yt}">
                                </div>
                                <div class="form-group">
                                    <label><i data-lucide="twitter" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Twitter/X URL</label>
                                    <input type="url" class="form-control" id="p_tw" value="${data.sosmed.tw}">
                                </div>
                            </div>

                            <div class="form-group" style="margin-top: 24px;">
                                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Simpan Semua Pengaturan</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Ganti Password -->
                <div class="card" style="border-left: 4px solid var(--danger);">
                    <div class="card-header">
                        <h4 class="card-title text-danger" style="margin: 0; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="shield-alert"></i> Keamanan Akun (Ganti Password)
                        </h4>
                    </div>
                    <div class="card-body">
                        <form id="formPassword">
                            <div class="form-group">
                                <label>Password Saat Ini</label>
                                <input type="password" class="form-control" id="pw_lama" required>
                                <div class="form-text">Secara default: masjidberdampak2026</div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div class="form-group">
                                    <label>Password Baru</label>
                                    <input type="password" class="form-control" id="pw_baru" required minlength="8">
                                    <div class="form-text">Minimal 8 karakter.</div>
                                </div>
                                <div class="form-group">
                                    <label>Konfirmasi Password Baru</label>
                                    <input type="password" class="form-control" id="pw_baru2" required minlength="8">
                                </div>
                            </div>
                            <div class="form-group" style="margin-top: 16px;">
                                <button type="submit" class="btn btn-danger"><i data-lucide="key"></i> Perbarui Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        lucide.createIcons({root: container});

        document.getElementById('formPengaturan').addEventListener('submit', async (e) => {
            e.preventDefault();
            data.namaMasjid = document.getElementById('p_nama').value;
            data.logo = document.getElementById('p_logo').value;
            data.alamat = document.getElementById('p_alamat').value;
            data.telepon = document.getElementById('p_telepon').value;
            data.email = document.getElementById('p_email').value;
            data.mapsUrl = document.getElementById('p_maps').value;
            data.jamOperasional = document.getElementById('p_jam').value;
            data.copyright = document.getElementById('p_copyright').value;
            
            data.sosmed = {
                ig: document.getElementById('p_ig').value,
                fb: document.getElementById('p_fb').value,
                yt: document.getElementById('p_yt').value,
                tw: document.getElementById('p_tw').value
            };

            await saveConfig('pengaturan_umum', data);
            showToast('Pengaturan umum berhasil disimpan!');
            
            // Re-render to update logo preview if changed
            setTimeout(() => {
                if(window.location.hash.includes('pengaturan')) {
                    renderPengaturan();
                }
            }, 1000);
        });

        document.getElementById('formPassword').addEventListener('submit', async (e) => {
            e.preventDefault();
            const baru = document.getElementById('pw_baru').value;
            const baru2 = document.getElementById('pw_baru2').value;

            if (baru !== baru2) {
                showToast('Konfirmasi password baru tidak cocok!', 'error');
                return;
            }

            if (baru.length < 8) {
                showToast('Password minimal 8 karakter!', 'error');
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memperbarui...'; }

            try {
                const { error } = await window._supabase.auth.updateUser({ password: baru });
                if (error) throw error;
                showToast('Password berhasil diperbarui!');
                document.getElementById('formPassword').reset();
            } catch (err) {
                console.error(err);
                showToast('Gagal memperbarui password: ' + (err.message || 'Unknown error'), 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="key"></i> Perbarui Password'; lucide.createIcons({root: btn.parentElement}); }
            }
        });
    }

    async function renderDonasi(mode = 'verifikasi') {
        const container = document.getElementById('contentContainer');
        
        const transactions = await getDB('donasi_transactions') || [];
        const programs = await getDB('donasi_programs') || [];

        // Helper to get program title
        transactions.forEach(t => {
            const p = programs.find(prog => prog.id === t.program_id);
            t.programTitle = p ? p.title : 'Program Umum';
        });

        // --- Helper untuk sort terbaru ---
        const sortedTransactions = [...transactions].sort((a,b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal));

        // -------------------------------------------------------
        // VERIFIKASI MODE
        // -------------------------------------------------------
        if (mode === 'verifikasi') {
            const menunggu  = transactions.filter(t => t.status === 'menunggu_verifikasi').length;
            const valid     = transactions.filter(t => t.status === 'valid').length;
            const ditolak   = transactions.filter(t => t.status === 'ditolak').length;

            // Ambil filter aktif dari state atau default 'semua'
            const activeFilter = container.dataset.txFilter || 'semua';

            let displayTx = sortedTransactions;
            if (activeFilter === 'menunggu') displayTx = sortedTransactions.filter(t => t.status === 'menunggu_verifikasi');
            else if (activeFilter === 'valid') displayTx = sortedTransactions.filter(t => t.status === 'valid');
            else if (activeFilter === 'ditolak') displayTx = sortedTransactions.filter(t => t.status === 'ditolak');

            const totalTerkumpul = transactions.filter(t => t.status === 'valid').reduce((a,c) => a + (c.nominal||0), 0);

            const html = `
                <!-- Stats row -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); margin-bottom: 20px;">
                    <div class="stat-card stat-card-green">
                        <div class="stat-icon"><i data-lucide="banknote"></i></div>
                        <div class="stat-info">
                            <div class="stat-value" style="font-size:16px;">${new Intl.NumberFormat('id-ID',{notation:'compact',maximumFractionDigits:1}).format(totalTerkumpul)}</div>
                            <div class="stat-label">Total Terverifikasi</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-gold">
                        <div class="stat-icon"><i data-lucide="clock"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${menunggu}</div>
                            <div class="stat-label">Menunggu Verifikasi</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-teal">
                        <div class="stat-icon"><i data-lucide="check-circle"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${valid}</div>
                            <div class="stat-label">Telah Divalidasi</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-gray">
                        <div class="stat-icon"><i data-lucide="x-circle"></i></div>
                        <div class="stat-info">
                            <div class="stat-value">${ditolak}</div>
                            <div class="stat-label">Ditolak</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                            <h5 style="margin:0;">Laporan Transaksi Donasi Masuk</h5>
                            <button class="btn btn-outline-primary btn-sm" id="btnExportCSV" style="gap:6px;">
                                <i data-lucide="download" style="width:14px;height:14px;"></i> Ekspor CSV
                            </button>
                        </div>

                        <!-- Filter Tabs -->
                        <div class="filter-tabs">
                            <button class="filter-tab ${activeFilter==='semua'?'active':''}" data-filter="semua">
                                Semua <span class="tab-count">${transactions.length}</span>
                            </button>
                            <button class="filter-tab ${activeFilter==='menunggu'?'active':''}" data-filter="menunggu">
                                ⏳ Menunggu <span class="tab-count">${menunggu}</span>
                            </button>
                            <button class="filter-tab ${activeFilter==='valid'?'active':''}" data-filter="valid">
                                ✅ Valid <span class="tab-count">${valid}</span>
                            </button>
                            <button class="filter-tab ${activeFilter==='ditolak'?'active':''}" data-filter="ditolak">
                                ❌ Ditolak <span class="tab-count">${ditolak}</span>
                            </button>
                        </div>

                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tanggal</th>
                                        <th>Donatur</th>
                                        <th>Program</th>
                                        <th>Nominal</th>
                                        <th>Status</th>
                                        <th class="action-cell" style="text-align: right;">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${displayTx.length > 0 ? displayTx.map(t => {
                                        let badgeClass = 'badge-secondary'; let statusText = 'Menunggu';
                                        if(t.status === 'valid')   { badgeClass = 'badge-success'; statusText = '✅ Valid'; }
                                        if(t.status === 'ditolak') { badgeClass = 'badge-danger';  statusText = '❌ Ditolak'; }
                                        const shortId = (t.id || '').toString().slice(-8);
                                        return `
                                        <tr>
                                            <td><code title="${t.id}" style="font-size:11px; cursor:help; background:#f1f5f9; padding:2px 6px; border-radius:4px;">#${shortId}</code></td>
                                            <td>${new Date(t.created_at || t.tanggal).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}</td>
                                            <td style="font-weight: 500;">
                                                ${t.nama}<br>
                                                <small style="color:var(--text-muted); font-weight:normal;">${t.email||'-'}</small>
                                            </td>
                                            <td>${t.programTitle}</td>
                                            <td style="font-weight: 700; color: var(--green-800);">
                                                ${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(t.nominal)}
                                            </td>
                                            <td><span class="badge ${badgeClass}">${statusText}</span></td>
                                            <td class="action-cell" style="text-align: right;">
                                                <button class="btn btn-outline btn-sm btn-lihat-bukti" data-id="${t.id}" style="padding: 5px 10px;" title="Lihat Bukti & Verifikasi">
                                                    <i data-lucide="eye" style="width:14px;height:14px;"></i>
                                                </button>
                                            </td>
                                        </tr>`;
                                    }).join('') : `<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-muted);"><i data-lucide="inbox" style="width:32px;height:32px;display:block;margin:0 auto 8px;"></i> Tidak ada data untuk filter ini.</td></tr>`}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Modal Bukti -->
                <div id="modalBuktiDonasi" style="display: none; position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.4); z-index:1000; align-items:center; justify-content:center; backdrop-filter:blur(8px); padding:20px;">
                    <div class="card" style="width: 100%; max-width: 500px;">
                        <div class="card-header">
                            <h4 class="card-title">Verifikasi Bukti Transfer</h4>
                            <button class="btn-icon" id="btnCloseModalBukti"><i data-lucide="x"></i></button>
                        </div>
                        <div class="card-body" id="modalBuktiContent"></div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            lucide.createIcons({root: container});

            // Filter tabs events
            container.querySelectorAll('.filter-tab').forEach(tab => {
                tab.onclick = () => {
                    container.dataset.txFilter = tab.dataset.filter;
                    renderDonasi('verifikasi');
                };
            });

            const btnExport = document.getElementById('btnExportCSV');
            if(btnExport) btnExport.onclick = () => exportToCSV(transactions);

            document.querySelectorAll('.btn-lihat-bukti').forEach(btn => {
                btn.onclick = (e) => openModalBukti(btn.getAttribute('data-id'));
            });

            document.getElementById('btnCloseModalBukti').onclick = () => {
                document.getElementById('modalBuktiDonasi').style.display = 'none';
            };

        } else {
            // PROGRAM MODE
            const html = `
                <div class="card">
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h5 style="margin:0;">Daftar Program Donasi</h5>
                            <button class="btn btn-primary btn-sm" id="btnTambahDonasiProg" style="gap:6px;">
                                <i data-lucide="plus" style="width:14px;height:14px;"></i> Tambah Program
                            </button>
                        </div>
                        <div id="donasiProgList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px;"></div>
                    </div>
                </div>
            `;
            container.innerHTML = html;
            lucide.createIcons({root: container});
            document.getElementById('btnTambahDonasiProg').onclick = () => openProgModal();
            renderDonasiProgList(programs);
        }

        function openModalBukti(id) {
            const tx = transactions.find(t => t.id === id);
            if(!tx) return;
            const content = document.getElementById('modalBuktiContent');
            
            let actionButtons = tx.status === 'menunggu_verifikasi' ? `
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-outline btn-tolak-donasi text-danger" data-id="${tx.id}" style="flex:1;">Tolak</button>
                    <button class="btn btn-primary btn-valid-donasi" data-id="${tx.id}" style="flex:1;">Verifikasi Valid</button>
                </div>
            ` : `
                <div style="margin-top:20px; text-align:center; padding:10px; background:#F8FAFC; border-radius:8px; color:var(--text-muted); font-size:0.9rem;">
                    Transaksi ini sudah diproses: <strong>${tx.status.toUpperCase()}</strong>
                </div>
            `;

            content.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <table style="width:100%; font-size:0.9rem;">
                        <tr><td style="color:var(--text-muted); width:120px;">Donatur</td><td>: <strong>${tx.nama}</strong></td></tr>
                        <tr><td style="color:var(--text-muted);">Program</td><td>: ${tx.programTitle}</td></tr>
                        <tr><td style="color:var(--text-muted);">Nominal</td><td style="color:var(--green-700); font-size:1.1rem; font-weight:700;">: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits:0}).format(tx.nominal)}</td></tr>
                    </table>
                </div>
                <div style="text-align: center; border: 1px solid #E2E8F0; padding: 10px; border-radius: 8px; background: #F8FAFC;">
                    <img src="${tx.bukti}" alt="Bukti Transfer" style="max-width: 100%; max-height: 350px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                </div>
                ${actionButtons}
            `;

            document.getElementById('modalBuktiDonasi').style.display = 'flex';
            const btnV = content.querySelector('.btn-valid-donasi');
            if(btnV) btnV.onclick = () => handleVerifikasi(tx.id, 'valid');
            const btnT = content.querySelector('.btn-tolak-donasi');
            if(btnT) btnT.onclick = () => handleVerifikasi(tx.id, 'ditolak');
        }

        async function handleVerifikasi(id, newStatus) {
            if(!confirm(`Tetapkan status menjadi ${newStatus.toUpperCase()}?`)) return;
            try {
                const tx = transactions.find(t => t.id === id);
                if (tx) {
                    await SupaDB.updateItem('donasi_transactions', id, { status: newStatus });
                    if(newStatus === 'valid' && tx.program_id) {
                        const prog = programs.find(p => p.id === tx.program_id);
                        if (prog) {
                            const newCollected = parseInt(prog.collected || 0) + parseInt(tx.nominal || 0);
                            await SupaDB.updateItem('donasi_programs', prog.id, { collected: newCollected });
                        }
                    }
                    showToast(`Donasi berhasil diproses`);
                    document.getElementById('modalBuktiDonasi').style.display = 'none';
                    renderDonasi('verifikasi'); // re-fetch fresh data full render
                }
            } catch (err) {
                console.error(err);
                showToast('Gagal memproses donasi', 'error');
            }
        }

        function renderDonasiProgList(progs) {
            const list = document.getElementById('donasiProgList');
            if(!list) return;

            if (progs.length === 0) {
                list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                    <i data-lucide="package-open" style="width:40px;height:40px;display:block;margin:0 auto 12px;"></i>
                    <p>Belum ada program donasi. Klik "Tambah Program" untuk membuat program baru.</p>
                </div>`;
                lucide.createIcons({root: list});
                return;
            }

            list.innerHTML = progs.map(p => {
                const pct = Math.min(100, Math.round(((p.collected||0) / p.target) * 100));
                return `
                <div class="card" style="padding: 0; margin-bottom:0;">
                    <div style="aspect-ratio: 16/9; overflow: hidden; background: linear-gradient(135deg,#1B4332,#2D6A4F);">
                        <img src="${p.poster || '../assets/donasi1.jpg'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
                    </div>
                    <div style="padding: 16px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                            <h5 style="margin:0; font-size: 15px; line-height:1.3;">${p.title}</h5>
                        </div>
                        <div class="progress-text">
                            <span style="font-size:12px;">${new Intl.NumberFormat('id-ID').format(p.collected||0)} / ${new Intl.NumberFormat('id-ID').format(p.target)}</span>
                            <span class="progress-percent">${pct}%</span>
                        </div>
                        <div class="progress-wrap"><div class="progress-bar ${pct>=100?'gold':''}" style="width:${pct}%;"></div></div>
                        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top:14px;">
                            <button class="btn btn-outline btn-sm btn-edit-prog" data-id="${p.id}" style="padding: 5px 12px; gap:4px;"><i data-lucide="edit-2" style="width:13px;height:13px;"></i> Edit</button>
                            <button class="btn btn-outline btn-sm btn-hapus-prog text-danger" data-id="${p.id}" style="padding: 5px 10px;"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            lucide.createIcons({root: list});
            
            list.querySelectorAll('.btn-edit-prog').forEach(btn => {
                btn.onclick = () => openProgModal(btn.getAttribute('data-id'));
            });
            list.querySelectorAll('.btn-hapus-prog').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.getAttribute('data-id');
                    if(confirm('Hapus program donasi ini?')) {
                        try {
                            await SupaDB.deleteItem('donasi_programs', id);
                            showToast('Program berhasil dihapus');
                            renderDonasi('program'); // re-fetch fresh data
                        } catch (err) {
                            console.error(err);
                            showToast('Gagal menghapus program', 'error');
                        }
                    }
                };
            });
        }

        function openProgModal(id = null) {
            const p = id ? programs.find(item => item.id == id) : { title: '', description: '', icon: 'fa-solid fa-heart', target: 1000000, poster: '' };
            const modalHtml = `
                <div id="modalProgEdit" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); z-index: 1100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); padding: 20px;">
                    <div class="card" style="width: 100%; max-width: 500px; margin: 20px;">
                        <div class="card-header">
                            <h4 class="card-title">${id ? 'Edit Program' : 'Tambah Program'}</h4>
                            <button class="btn-icon" id="btnCloseProgModal"><i data-lucide="x"></i></button>
                        </div>
                        <div class="card-body">
                            <form id="progForm">
                                <div class="form-group"><label>Nama Program</label><input type="text" class="form-control" id="p_title" value="${p.title}" required></div>
                                <div class="form-group"><label>Deskripsi</label><textarea class="form-control" id="p_desc" rows="2" required>${p.description}</textarea></div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                                    <div class="form-group"><label>Target (IDR)</label><input type="number" class="form-control" id="p_target" value="${p.target}" required></div>
                                    <div class="form-group"><label>Ikon (FA)</label><input type="text" class="form-control" id="p_icon" value="${p.icon}"></div>
                                </div>
                                <div class="form-group">
                                    <label>Poster</label>
                                    <div style="display: flex; gap: 15px; align-items: center;">
                                        <img id="p_poster_preview" src="${p.poster || '../assets/donasi1.jpg'}" style="width:100px; aspect-ratio:16/9; border-radius:4px; object-fit:cover; border:1px solid #ccc;">
                                        <input type="file" id="p_file" accept="image/*" style="display:none">
                                        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('p_file').click()">Pilih Gambar</button>
                                    </div>
                                    <input type="hidden" id="p_poster_base64" value="${p.poster}">
                                </div>
                                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                                    <button type="button" class="btn btn-secondary" id="btnCancelProgEdit">Batal</button>
                                    <button type="submit" class="btn btn-primary">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            lucide.createIcons({root: document.getElementById('modalProgEdit')});
            const m = document.getElementById('modalProgEdit');
            document.getElementById('btnCloseProgModal').onclick = () => m.remove();
            document.getElementById('btnCancelProgEdit').onclick = () => m.remove();
            document.getElementById('p_file').onchange = async (e) => {
                const submitBtn = document.getElementById('btnSimpanProg');
                if(submitBtn) submitBtn.disabled = true;
                try {
                    const url = await uploadLogoToStorage(e.target, 'layanan-images', 'donasi_programs');
                    if (url) {
                        document.getElementById('p_poster_preview').src = url;
                        document.getElementById('p_poster_base64').value = url;
                    }
                } catch (err) {
                    console.error(err);
                }
                if(submitBtn) submitBtn.disabled = false;
            };
            
            document.getElementById('progForm').onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('btnSimpanProg');
                if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }
                
                const newItem = {
                    title: document.getElementById('p_title').value,
                    description: document.getElementById('p_desc').value,
                    icon: document.getElementById('p_icon').value,
                    target: parseInt(document.getElementById('p_target').value),
                    poster: document.getElementById('p_poster_base64').value
                };
                
                try {
                    if (id) {
                        await SupaDB.updateItem('donasi_programs', id, newItem);
                    } else {
                        newItem.collected = 0;
                        await SupaDB.insertItem('donasi_programs', newItem);
                    }
                    showToast('Program berhasil disimpan ✅');
                    m.remove(); 
                    renderDonasi('program'); // re-fetch fresh data full render
                } catch (err) {
                    console.error(err);
                    showToast('Gagal menyimpan program', 'error');
                } finally {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Simpan'; }
                }
            };
        }
    }

    function exportToCSV(data) {
        if (!data || data.length === 0) { showToast("Tidak ada data", "error"); return; }
        const headers = ["ID", "Tanggal", "Nama", "Email", "Program", "Nominal", "Status"];
        const csv = [headers.join(","), ...data.map(t => [t.id, new Date(t.tanggal).toLocaleDateString(), `"${t.nama}"`, t.email||"-", `"${t.programTitle}"`, t.nominal, t.status].join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `donasi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast("Laporan diunduh");
    }

    // =============================================
    // NOTIFICATION BADGES
    // =============================================
    async function updateNotificationBadges() {
        try {
            const komentar = await getDB('komentar') || [];
            const pending = komentar.filter(k => k.status === 'pending').length;
            const badge = document.getElementById('komentarBadge');
            if (badge) {
                badge.textContent = pending;
                badge.style.display = pending > 0 ? 'inline-flex' : 'none';
            }

            const kritik = await getDB('kritik_saran') || [];
            const unread = kritik.filter(k => !k.dibaca).length;
            const kbadge = document.getElementById('kritikBadge');
            if (kbadge) {
                kbadge.textContent = unread;
                kbadge.style.display = unread > 0 ? 'inline-flex' : 'none';
            }
        } catch (e) {
            console.error('Error loading badges:', e);
        }
    }

    // =============================================
    // RENDER KOMENTAR PUBLIK (Admin moderation)
    // =============================================
    async function renderKomentar() {
        const container = document.getElementById('contentContainer');
        let komentarData = await getDB('komentar') || [];
        const config = await getDB('komentar_config') || {};
        const autoPublish = config.autoPublish === true;

        const pending = komentarData.filter(k => k.status === 'pending').length;

        let html = `
        <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
                <h4 class="card-title">Pengaturan Moderasi Komentar</h4>
            </div>
            <div class="card-body" style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <label style="font-weight:600; font-size:14px;">Mode Publikasi:</label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="chkAutoPublish" ${autoPublish ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary-green);">
                        <span style="font-size:13px;">Auto-Publish (tanpa perlu moderasi)</span>
                    </label>
                </div>
                <button class="btn btn-primary btn-sm" id="btnSaveKomConfig">
                    <i data-lucide="save"></i> Simpan Pengaturan
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Daftar Komentar ${pending > 0 ? `<span class="badge badge-warning" style="margin-left:8px;">${pending} Menunggu</span>` : ''}</h4>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-outline btn-sm" id="btnFilterAll" style="font-size:12px;">Semua</button>
                    <button class="btn btn-outline btn-sm" id="btnFilterPending" style="font-size:12px;">Pending</button>
                    <button class="btn btn-outline btn-sm" id="btnFilterApproved" style="font-size:12px;">Approved</button>
                </div>
            </div>
            <div class="card-body" style="padding:0;" id="komListAdmin">
                <!-- Rendered by JS -->
            </div>
        </div>`;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        let currentFilter = 'all';

        async function renderKomTable() {
            komentarData = await getDB('komentar') || [];
            const filtered = komentarData.filter(k => {
                if (currentFilter === 'pending') return k.status === 'pending';
                if (currentFilter === 'approved') return k.status === 'approved';
                return true;
            }).sort((a,b) => new Date(b.waktu) - new Date(a.waktu));

            const listEl = document.getElementById('komListAdmin');
            if (!filtered.length) {
                listEl.innerHTML = `<p style="text-align:center;padding:30px;color:var(--text-muted);">Tidak ada komentar${currentFilter !== 'all' ? ' dengan filter ini' : ''}.</p>`;
                return;
            }

            listEl.innerHTML = `<div class="table-responsive"><table class="table">
                <thead><tr><th>Nama</th><th>Komentar</th><th>Waktu</th><th>Status</th><th style="text-align:right;">Aksi</th></tr></thead>
                <tbody>
                ${filtered.map(k => `
                    <tr>
                        <td><strong>${k.nama}</strong><br><small style="color:var(--text-muted);">${k.email}</small></td>
                        <td style="max-width:280px;"><div style="max-height:60px;overflow:hidden;font-size:13px;">${k.komentar}</div></td>
                        <td style="white-space:nowrap;font-size:12px;">${new Date(k.waktu).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                        <td><span class="badge ${k.status === 'approved' ? 'badge-success' : k.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${k.status}</span></td>
                        <td style="text-align:right;white-space:nowrap;">
                            ${k.status === 'pending' ? `<button class="btn btn-primary btn-sm btn-approve-kom" data-id="${k.id}" style="padding:3px 8px;font-size:11px;border-radius:4px;margin-right:4px;">✅ Approve</button>` : ''}
                            ${k.status === 'approved' ? `<button class="btn btn-outline btn-sm btn-reject-kom" data-id="${k.id}" style="padding:3px 8px;font-size:11px;border-radius:4px;margin-right:4px;">❌ Reject</button>` : ''}
                            <button class="btn btn-outline btn-sm text-danger btn-delete-kom" data-id="${k.id}" style="padding:3px 8px;font-size:11px;border-radius:4px;">🗑</button>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table></div>`;

            // Bind events
            listEl.querySelectorAll('.btn-approve-kom').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    await SupaDB.updateItem('komentar', id, { status: 'approved' });
                    showToast('Komentar disetujui & dipublikasikan!');
                    await renderKomTable();
                    updateNotificationBadges();
                };
            });
            listEl.querySelectorAll('.btn-reject-kom').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    await SupaDB.updateItem('komentar', id, { status: 'rejected' });
                    showToast('Komentar ditolak.');
                    await renderKomTable();
                    updateNotificationBadges();
                };
            });
            listEl.querySelectorAll('.btn-delete-kom').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('Hapus komentar ini secara permanen?')) return;
                    const id = btn.dataset.id;
                    await SupaDB.deleteItem('komentar', id);
                    showToast('Komentar dihapus.');
                    await renderKomTable();
                    updateNotificationBadges();
                };
            });
        }

        document.getElementById('btnFilterAll').onclick = () => { currentFilter = 'all'; renderKomTable(); };
        document.getElementById('btnFilterPending').onclick = () => { currentFilter = 'pending'; renderKomTable(); };
        document.getElementById('btnFilterApproved').onclick = () => { currentFilter = 'approved'; renderKomTable(); };
        document.getElementById('btnSaveKomConfig').onclick = async () => {
            const cfg = { autoPublish: document.getElementById('chkAutoPublish').checked };
            await saveConfig('komentar_config', cfg);
            showToast('Pengaturan moderasi disimpan!');
        };

        await renderKomTable();
    }

    // =============================================
    // RENDER KRITIK & SARAN (Admin inbox)
    // =============================================
    async function renderKritikSaran() {
        const container = document.getElementById('contentContainer');
        let listPesan = await getDB('kritik_saran') || [];
        let list = [...listPesan].sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

        async function markAllRead() {
            const unread = listPesan.filter(k => !k.dibaca);
            if(unread.length > 0) {
                // Bulk update or individual updates
                for (let k of unread) {
                    await SupaDB.updateItem('kritik_saran', k.id, { dibaca: true });
                }
            }
        }

        await markAllRead();
        updateNotificationBadges();

        let html = `
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Inbox Kritik & Saran <span style="font-size:13px;color:var(--text-muted);font-weight:500;">(${list.length} pesan)</span></h4>
                ${list.length ? `<button class="btn btn-outline btn-sm" id="btnExportKS" style="font-size:12px;"><i data-lucide="download"></i> Export CSV</button>` : ''}
            </div>
            <div class="card-body" style="padding:0;">
                ${list.length === 0 ? `<p style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada pesan kritik & saran.</p>` : `
                <div class="table-responsive"><table class="table">
                    <thead><tr><th>Nama</th><th>Pesan</th><th>Waktu</th><th style="text-align:right;">Aksi</th></tr></thead>
                    <tbody>
                    ${list.map(k => `
                        <tr style="${!k.dibaca ? 'background:rgba(45,106,79,0.04);' : ''}">
                            <td><strong>${k.nama}</strong><br><small style="color:var(--text-muted);">${k.email}</small></td>
                            <td style="max-width:350px;"><div style="font-size:13px;line-height:1.5;">${k.pesan.substring(0, 200)}${k.pesan.length > 200 ? '...' : ''}</div></td>
                            <td style="white-space:nowrap;font-size:12px;">${new Date(k.waktu).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                            <td style="text-align:right;">
                                <button class="btn btn-outline btn-sm btn-detail-ks" data-id="${k.id}" style="padding:3px 8px;font-size:11px;margin-right:4px;"><i data-lucide="eye"></i></button>
                                <button class="btn btn-outline btn-sm text-danger btn-delete-ks" data-id="${k.id}" style="padding:3px 8px;font-size:11px;">🗑</button>
                            </td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table></div>`}
            </div>
        </div>`;

        container.innerHTML = html;
        lucide.createIcons({root: container});

        container.querySelectorAll('.btn-detail-ks').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const item = list.find(k => String(k.id) === String(id));
                if (!item) return;
                const m = document.createElement('div');
                m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
                m.innerHTML = `
                <div class="card" style="max-width:520px;width:100%;">
                    <div class="card-header">
                        <h4 class="card-title">Detail Pesan dari ${item.nama}</h4>
                        <button class="btn-icon" id="closeModalKS"><i data-lucide="x"></i></button>
                    </div>
                    <div class="card-body">
                        <p style="font-size:12px;color:var(--text-muted);margin-bottom:4px;"><i data-lucide="mail" style="width:13px;height:13px;"></i> ${item.email}</p>
                        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;"><i data-lucide="clock" style="width:13px;height:13px;"></i> ${new Date(item.waktu).toLocaleString('id-ID')}</p>
                        <div style="background:var(--bg-light);border-radius:8px;padding:16px;font-size:14px;line-height:1.7;border-left:3px solid var(--primary-green);">${item.pesan}</div>
                    </div>
                </div>`;
                document.body.appendChild(m);
                lucide.createIcons({root: m});
                document.getElementById('closeModalKS').onclick = () => m.remove();
                m.addEventListener('click', e => { if (e.target === m) m.remove(); });
            };
        });

        container.querySelectorAll('.btn-delete-ks').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('Hapus pesan ini secara permanen?')) return;
                const id = btn.dataset.id;
                await SupaDB.deleteItem('kritik_saran', id);
                showToast('Pesan dihapus.');
                renderKritikSaran();
            };
        });

        document.getElementById('btnExportKS')?.addEventListener('click', () => {
            const rows = [['Nama','Email','Pesan','Waktu'],...list.map(k => [`"${k.nama}"`,k.email,`"${k.pesan}"`,k.waktu])];
            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'kritik_saran.csv'; a.click();
            showToast('CSV diunduh!');
        });
    }

    // =============================================
    // RENDER BANNER IKLAN (Admin) — embedded in renderBeranda tabs
    // Called as standalone page addition
    // =============================================
    async function renderAdminBanner() {
        const container = document.getElementById('tabBannerContent');
        if (!container) return;
        let banners = await getDB('banner_iklan') || [];

        async function refresh() {
            banners = await getDB('banner_iklan') || [];
            container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h5 style="margin:0;">Kelola Pop-up Iklan (Modal)</h5>
                <button class="btn btn-primary btn-sm" id="btnTambahBanner"><i data-lucide="plus"></i> Tambah Iklan</button>
            </div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Pop-up iklan akan muncul otomatis saat pengunjung pertama kali membuka beranda (1x per sesi). Jika ada lebih dari satu iklan aktif, hanya yang pertama yang akan muncul.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;" id="bannerGrid">
                ${banners.length ? banners.map(b => `
                <div class="card" style="padding:12px;">
                    <div style="height:130px;border-radius:8px;overflow:hidden;margin-bottom:10px;background:#ddd;">
                        <img src="${b.image}" alt="banner" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <p style="font-size:12px;color:var(--text-muted);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.alt || '—'}</p>
                    <p style="font-size:11px;color:var(--primary-green);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.link || 'Tanpa Link'}</p>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;flex:1;">
                            <input type="checkbox" class="chk-banner-aktif" data-id="${b.id}" ${b.aktif !== false ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--primary-green);">
                            Aktif
                        </label>
                        <button class="btn btn-outline btn-sm text-danger btn-del-banner" data-id="${b.id}" style="padding:3px 8px;font-size:11px;border-radius:4px;">Hapus</button>
                    </div>
                </div>`).join('') : '<p style="color:var(--text-muted);font-size:13px;">Belum ada banner. Tambah banner baru.</p>'}
            </div>`;
            lucide.createIcons({root: container});
            bindBannerEvents();
        }

        function bindBannerEvents() {
            container.querySelectorAll('.chk-banner-aktif').forEach(chk => {
                chk.onchange = async () => {
                    const id = chk.dataset.id;
                    const list = await getDB('banner_iklan') || [];
                    const idx = list.findIndex(b => b.id == id);
                    if (idx > -1) { list[idx].aktif = chk.checked; await saveConfig('banner_iklan', list); showToast('Status banner diperbarui.'); }
                };
            });
            container.querySelectorAll('.btn-del-banner').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('Hapus banner ini?')) return;
                    const id = btn.dataset.id;
                    const list = await getDB('banner_iklan') || [];
                    const updated = list.filter(b => b.id != id);
                    await saveConfig('banner_iklan', updated);
                    showToast('Banner dihapus.');
                    await refresh();
                };
            });
            document.getElementById('btnTambahBanner')?.addEventListener('click', () => openBannerModal());
        }
        await refresh();
    }

    function openBannerModal() {
        const m = document.createElement('div');
        m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
        m.innerHTML = `
        <div class="card" style="max-width:460px;width:100%;">
            <div class="card-header">
                <h4 class="card-title">Tambah Pop-up Iklan</h4>
                <button class="btn-icon" id="closeBannerModal"><i data-lucide="x"></i></button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>Gambar Iklan (Format 16:9 disarankan)</label>
                    <input type="file" id="b_file" accept="image/*" class="form-control" style="margin-bottom:10px;">
                    <div id="b_preview_wrap" style="height:150px;border-radius:8px;overflow:hidden;background:#ddd;margin-bottom:10px;display:none;">
                        <img id="b_preview" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                </div>
                <div class="form-group">
                    <label>Alt Text / Deskripsi Singkat</label>
                    <input type="text" id="b_alt" class="form-control" placeholder="Contoh: Promo Ramadhan 1447H">
                </div>
                <div class="form-group">
                    <label>Link Tujuan (Opsional)</label>
                    <input type="url" id="b_link" class="form-control" placeholder="https://...">
                    <div class="form-text">Klik pada iklan akan mengarah ke URL ini.</div>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button class="btn btn-secondary" id="cancelBannerModal">Batal</button>
                    <button class="btn btn-primary" id="saveBannerBtn">Simpan Banner</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(m);
        lucide.createIcons({root: m});

        const fileEl = document.getElementById('b_file');
        let bannerBase64 = '';
        fileEl.onchange = async () => {
            const submitBtn = document.getElementById('saveBannerBtn');
            if(submitBtn) submitBtn.disabled = true;
            try {
                const url = await uploadLogoToStorage(fileEl, 'banner-iklan', 'banner');
                if (url) {
                    bannerBase64 = url;
                    const prev = document.getElementById('b_preview');
                    prev.src = url;
                    document.getElementById('b_preview_wrap').style.display = 'block';
                }
            } catch (e) { console.error(e); }
            if(submitBtn) submitBtn.disabled = false;
        };
        
        document.getElementById('closeBannerModal').onclick = () => m.remove();
        document.getElementById('cancelBannerModal').onclick = () => m.remove();
        document.getElementById('saveBannerBtn').onclick = async () => {
            if (!bannerBase64) { showToast('Pilih gambar terlebih dahulu!', 'error'); return; }
            const submitBtn = document.getElementById('saveBannerBtn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }

            const list = await getDB('banner_iklan') || [];
            list.push({
                id: Date.now(),
                image: bannerBase64,
                alt: document.getElementById('b_alt').value.trim(),
                link: document.getElementById('b_link').value.trim(),
                aktif: true
            });
            
            try {
                await saveConfig('banner_iklan', list);
                showToast('Banner berhasil ditambahkan!');
                m.remove();
                await renderAdminBanner();
            } catch (err) {
                console.error(err);
                showToast('Gagal menambahkan banner', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Simpan Banner'; }
            }
        };
        m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    }

    // =============================================
    // RENDER VIDEO INSTAGRAM (Admin)
    // =============================================
    async function renderAdminVideo() {
        const container = document.getElementById('tabVideoContent');
        if (!container) return;
        let videos = await getDB('video_reels') || [];

        async function refresh() {
            videos = await getDB('video_reels') || [];
            container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h5 style="margin:0;">Kelola Video Instagram</h5>
                <button class="btn btn-primary btn-sm" id="btnTambahVideo"><i data-lucide="plus"></i> Tambah Video</button>
            </div>
            <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:var(--text-muted);">
                <strong>💡 Cara Input:</strong> Masukkan URL post/Reel Instagram yang bersifat publik. Thumbnail bisa diisi manual (URL gambar) atau dikosongkan.
            </div>
            ${videos.length ? `<div class="table-responsive"><table class="table">
                <thead><tr><th>Thumbnail</th><th>Caption</th><th>URL Instagram</th><th>Aktif</th><th style="text-align:right;">Aksi</th></tr></thead>
                <tbody>
                ${videos.map(v => `<tr>
                    <td>${v.thumbnail ? `<img src="${v.thumbnail}" style="width:60px;aspect-ratio:9/16;object-fit:cover;border-radius:6px;">` : '<span style="color:var(--text-muted);font-size:12px;">Tanpa Gambar</span>'}</td>
                    <td style="max-width:200px;font-size:12px;">${(v.caption||'').substring(0,80)}${(v.caption||'').length>80?'…':''}</td>
                    <td style="max-width:180px;"><a href="${v.url}" target="_blank" style="font-size:11px;color:var(--primary-green);word-break:break-all;">${v.url.substring(0,50)}…</a></td>
                    <td><input type="checkbox" class="chk-video-aktif" data-id="${v.id}" ${v.aktif!==false?'checked':''} style="width:16px;height:16px;accent-color:var(--primary-green);"></td>
                    <td style="text-align:right;"><button class="btn btn-outline btn-sm text-danger btn-del-video" data-id="${v.id}" style="padding:3px 8px;font-size:11px;">🗑</button></td>
                </tr>`).join('')}
                </tbody>
            </table></div>` : '<p style="color:var(--text-muted);font-size:13px;padding:16px 0;">Belum ada video. Tambah video baru.</p>'}`;
            lucide.createIcons({root: container});
            bindVideoEvents();
        }

        function bindVideoEvents() {
            container.querySelectorAll('.chk-video-aktif').forEach(chk => {
                chk.onchange = async () => {
                    const id = chk.dataset.id;
                    const list = await getDB('video_reels') || [];
                    const idx = list.findIndex(v => v.id == id);
                    if (idx > -1) { list[idx].aktif = chk.checked; await saveConfig('video_reels', list); showToast('Status video diperbarui.'); }
                };
            });
            container.querySelectorAll('.btn-del-video').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('Hapus video ini?')) return;
                    const id = btn.dataset.id;
                    const list = await getDB('video_reels') || [];
                    const updated = list.filter(v => v.id != id);
                    await saveConfig('video_reels', updated);
                    showToast('Video dihapus.');
                    await refresh();
                };
            });
            document.getElementById('btnTambahVideo')?.addEventListener('click', openVideoModal);
        }
        await refresh();
    }

    function openVideoModal() {
        const m = document.createElement('div');
        m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)';
        m.innerHTML = `
        <div class="card" style="max-width:480px;width:100%">
            <div class="card-header">
                <h4 class="card-title">Tambah Video Instagram</h4>
                <button class="btn-icon" id="closeVideoModal"><i data-lucide="x"></i></button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>URL Post / Reel Instagram *</label>
                    <input type="url" class="form-control" id="vUrl" placeholder="https://www.instagram.com/p/..." required>
                    <div class="form-text">Pastikan akun Instagram bersifat publik.</div>
                </div>
                <div class="form-group">
                    <label>Caption / Deskripsi (Opsional)</label>
                    <textarea class="form-control" id="vCaption" rows="3" placeholder="Deskripsi singkat video..." maxlength="300"></textarea>
                </div>
                <div class="form-group">
                    <label>Thumbnail Video (Format 9:16 / Portrait Reel)</label>
                    <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 10px;">
                        <div style="width: 100px; aspect-ratio: 9/16; border-radius: 8px; background: #ddd; overflow:hidden; border: 1px solid var(--border-color);">
                            <img id="v_preview" src="" style="width:100%; height:100%; object-fit:cover; display:none;">
                        </div>
                        <input type="file" id="v_file" accept="image/*" style="display:none">
                        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('v_file').click()">Pilih Gambar</button>
                    </div>
                    <input type="hidden" id="v_thumbnail_base64">
                    <div class="form-text">Gambar thumbnail sangat disarankan untuk performa loading yang baik.</div>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button class="btn btn-secondary" id="cancelVideoModal">Batal</button>
                    <button class="btn btn-primary" id="saveVideoBtn"><i data-lucide="save"></i> Simpan Video</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(m);
        lucide.createIcons({root: m});

        document.getElementById('closeVideoModal').onclick = () => m.remove();
        document.getElementById('cancelVideoModal').onclick = () => m.remove();
        
        const vFile = document.getElementById('v_file');
        vFile.onchange = async () => {
            const submitBtn = document.getElementById('saveVideoBtn');
            if(submitBtn) submitBtn.disabled = true;
            try {
                const url = await uploadLogoToStorage(vFile, 'berita-images', 'video_thumbnail');
                if (url) {
                    const prev = document.getElementById('v_preview');
                    prev.src = url;
                    prev.style.display = 'block';
                    document.getElementById('v_thumbnail_base64').value = url;
                }
            } catch (e) { console.error(e); }
            if(submitBtn) submitBtn.disabled = false;
        };

        document.getElementById('saveVideoBtn').onclick = async () => {
            const url = document.getElementById('vUrl').value.trim();
            if (!url) { showToast('Masukkan URL Video!', 'error'); return; }
            const submitBtn = document.getElementById('saveVideoBtn');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }
            
            const list = await getDB('video_reels') || [];
            list.push({
                id: Date.now(),
                url, 
                caption: document.getElementById('vCaption').value,
                thumbnail: document.getElementById('v_thumbnail_base64').value,
                aktif: true
            });
            
            try {
                await saveConfig('video_reels', list);
                showToast('Video berhasil ditambahkan! ✅');
                m.remove();
                await renderAdminVideo();
            } catch (err) {
                console.error(err);
                showToast('Gagal menyimpan video', 'error');
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i data-lucide="save"></i> Simpan Video'; }
            }
        };
        m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    }
}

// ==========================================
// RENDER JADWAL RUTIN
// ==========================================
async function renderJadwalRutin() {
    const container = document.getElementById('contentContainer');
    
    // Default jadwal
    const defaultJadwal = [
        { hari: 'Senin – Jumat', nama: 'TPA & Tahfiz Anak', waktu: '15:30 – 17:00 WIB', lokasi: 'Ruang Kelas TPA' },
        { hari: 'Selasa & Kamis', nama: 'Kajian Kitab Kuning', waktu: '20:00 – 21:30 WIB', lokasi: 'Aula Utama Masjid' },
        { hari: 'Rabu', nama: 'Bank Beras 1 Canting', waktu: '09:00 – 11:00 WIB', lokasi: 'Aula Lantai 2' },
        { hari: 'Kamis Malam', nama: 'Pengajian Yasin & Tahlil', waktu: '20:00 – 21:00 WIB', lokasi: 'Aula Utama Masjid' },
        { hari: 'Jumat', nama: 'Kajian Ahad Subuh', waktu: '05:00 – 06:30 WIB', lokasi: 'Aula Utama Masjid' },
        { hari: 'Sabtu', nama: 'Kajian Remaja GEMMA', waktu: '16:00 – 17:30 WIB', lokasi: 'Ruang Serba Guna' }
    ];

    let config = await SupaDB.fetchConfig('jadwal_rutin') || {};
    let data = config.items || defaultJadwal;

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    let html = `
        <div class="card">
            <div class="card-header" style="justify-content: space-between;">
                <div>
                    <h4 class="card-title">Jadwal Kegiatan Rutin</h4>
                    <p class="text-sm text-muted">Akan ditampilkan di halaman Kegiatan Masjid.</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showJadwalRutinForm()"><i data-lucide="plus"></i> Tambah Jadwal</button>
            </div>
            
            <div class="table-responsive">
                <table class="table" style="min-width: 600px;">
                    <thead>
                        <tr>
                            <th>Hari</th>
                            <th>Nama Kegiatan</th>
                            <th>Waktu</th>
                            <th>Lokasi</th>
                            <th align="center" width="120">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.length === 0 ? `<tr><td colspan="5" align="center" style="padding: 2rem; color: #666;">Belum ada jadwal rutin</td></tr>` : 
                        data.map((item, i) => `
                        <tr>
                            <td><span class="badge" style="background:#e8f5e9;color:#2e7d32">${escapeHtml(item.hari)}</span></td>
                            <td><strong>${escapeHtml(item.nama)}</strong></td>
                            <td>${escapeHtml(item.waktu)}</td>
                            <td>${escapeHtml(item.lokasi)}</td>
                            <td align="center">
                                <button class="btn-icon btn-sm text-primary" onclick="showJadwalRutinForm(${i})" title="Edit"><i data-lucide="edit-2"></i></button>
                                <button class="btn-icon btn-sm text-danger" onclick="deleteJadwalRutin(${i})" title="Hapus"><i data-lucide="trash-2"></i></button>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
    lucide.createIcons({root: container});

    // Global Functions for Jadwal Rutin
    window.showJadwalRutinForm = (index = -1) => {
        let item = index >= 0 ? data[index] : { hari: '', nama: '', waktu: '', lokasi: '' };
        
        const m = document.createElement('div');
        m.className = 'modal active';
        m.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>${index >= 0 ? 'Edit Jadwal Rutin' : 'Tambah Jadwal Rutin'}</h3>
                    <button class="btn-icon text-muted" onclick="this.closest('.modal').remove()"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <form id="jadwalRutinForm" onsubmit="saveJadwalRutin(event, ${index})">
                        <div class="form-group">
                            <label>Hari</label>
                            <input type="text" class="form-control" id="j_hari" value="${escapeHtml(item.hari)}" required placeholder="Misal: Senin - Jumat atau Setiap Ahad">
                        </div>
                        <div class="form-group">
                            <label>Nama Kegiatan</label>
                            <input type="text" class="form-control" id="j_nama" value="${escapeHtml(item.nama)}" required placeholder="Misal: Kajian Subuh">
                        </div>
                        <div class="form-group" style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label>Waktu</label>
                                <input type="text" class="form-control" id="j_waktu" value="${escapeHtml(item.waktu)}" required placeholder="Misal: 05:00 - 06:30 WIB">
                            </div>
                            <div>
                                <label>Lokasi</label>
                                <input type="text" class="form-control" id="j_lokasi" value="${escapeHtml(item.lokasi)}" required placeholder="Misal: Aula Utama">
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top: 20px;">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Batal</button>
                            <button type="submit" class="btn btn-primary" id="btnSaveJadwal"><i data-lucide="save"></i> Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(m);
        lucide.createIcons({root: m});
    };

    window.saveJadwalRutin = async (e, index) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveJadwal');
        btn.disabled = true;
        btn.innerHTML = 'Menyimpan...';

        const newItem = {
            hari: document.getElementById('j_hari').value,
            nama: document.getElementById('j_nama').value,
            waktu: document.getElementById('j_waktu').value,
            lokasi: document.getElementById('j_lokasi').value
        };

        let newData = [...data];
        if (index >= 0) {
            newData[index] = newItem;
        } else {
            newData.push(newItem);
        }

        try {
            await SupaDB.saveConfig('jadwal_rutin', { items: newData });
            showToast('Jadwal rutin berhasil disimpan! ✅');
            document.querySelector('.modal').remove();
            loadPage('jadwal-rutin');
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan jadwal: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Simpan';
        }
    };

    window.deleteJadwalRutin = async (index) => {
        if (!confirm('Hapus jadwal rutin ini?')) return;
        
        let newData = [...data];
        newData.splice(index, 1);
        
        try {
            showToast('Menghapus...', 'info');
            await SupaDB.saveConfig('jadwal_rutin', { items: newData });
            showToast('Jadwal berhasil dihapus! ✅');
            loadPage('jadwal-rutin');
        } catch (err) {
            console.error(err);
            showToast('Gagal menghapus jadwal: ' + err.message, 'error');
        }
    };
}
