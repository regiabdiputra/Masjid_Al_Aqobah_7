/**
 * MASJID AL AQOBAH 7 — Main JavaScript
 */

// =============================================
// NAVBAR SCROLL BEHAVIOR
// =============================================
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const mobileDrawer = document.querySelector('.mobile-drawer');
const drawerOverlay = document.querySelector('.drawer-overlay');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
}, { passive: true });

// =============================================
// HAMBURGER MENU
// =============================================
function openDrawer() {
  hamburger?.classList.add('open');
  mobileDrawer?.classList.add('open');
  drawerOverlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  hamburger?.classList.remove('open');
  mobileDrawer?.classList.remove('open');
  drawerOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', () => {
  hamburger.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerOverlay?.addEventListener('click', closeDrawer);
document.querySelectorAll('.mobile-drawer .nav-link').forEach(link => {
  link.addEventListener('click', closeDrawer);
});

// =============================================
// HERO PARALLAX LOAD
// =============================================
window.addEventListener('load', () => {
  document.querySelector('.hero')?.classList.add('loaded');
});

// =============================================
// SCROLL REVEAL ANIMATION
// =============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// =============================================
// COUNTER ANIMATION
// =============================================
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  const step = (timestamp) => {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = eased * target;
    el.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  counterObserver.observe(el);
});

// =============================================
// PRAYER TIMES (Jakarta / Bekasi based)
// =============================================
const PRAYER_TIMES_DATA = {
  fajr:    { h: 4,  m: 28 },
  dhuhr:   { h: 12, m: 3  },
  asr:     { h: 15, m: 18 },
  maghrib: { h: 18, m: 8  },
  isha:    { h: 19, m: 19 }
};

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS = { fajr: 'Subuh', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' };

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(h, m) {
  return `${pad(h)}:${pad(m)}`;
}

function getNextPrayer(now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_NAMES) {
    const pt = PRAYER_TIMES_DATA[name];
    const pMinutes = pt.h * 60 + pt.m;
    if (currentMinutes < pMinutes) {
      return { name, ...pt, totalMinutes: pMinutes };
    }
  }
  // Next prayer is Fajr tomorrow
  return { name: 'fajr', ...PRAYER_TIMES_DATA.fajr, totalMinutes: PRAYER_TIMES_DATA.fajr.h * 60 + PRAYER_TIMES_DATA.fajr.m + 1440 };
}

function updatePrayerWidget() {
  const cards = document.querySelectorAll('.sholat-card');
  if (!cards.length) return;

  const now = new Date();
  const next = getNextPrayer(now);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const remainMins = next.totalMinutes - currentMins;
  const remainH = Math.floor(remainMins / 60);
  const remainM = remainMins % 60;
  const remainS = 60 - now.getSeconds();

  // Update cards active state
  cards.forEach(card => {
    const name = card.dataset.prayer;
    card.classList.toggle('active', name === next.name);
    const nextEl = card.querySelector('.sholat-next');
    if (nextEl) nextEl.textContent = name === next.name ? '◀ Berikutnya' : '';
  });

  // Countdown
  const timerEl = document.querySelector('.countdown-timer');
  if (timerEl) {
    timerEl.textContent = `${pad(remainH)}:${pad(remainM)}:${pad(60 - now.getSeconds())}`;
  }

  // Date
  const dateEl = document.querySelector('.sholat-date');
  if (dateEl) {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('id-ID', opts);
  }

  // Next prayer label
  const nextLabelEl = document.querySelector('.countdown-next-label');
  if (nextLabelEl) {
    nextLabelEl.textContent = `Menuju waktu ${PRAYER_LABELS[next.name]}`;
  }
}

// Populate prayer times
function initPrayerWidget() {
  const cards = document.querySelectorAll('.sholat-card[data-prayer]');
  cards.forEach(card => {
    const name = card.dataset.prayer;
    const timeEl = card.querySelector('.sholat-time');
    if (timeEl && PRAYER_TIMES_DATA[name]) {
      const { h, m } = PRAYER_TIMES_DATA[name];
      timeEl.textContent = formatTime(h, m);
    }
  });

  updatePrayerWidget();
  setInterval(updatePrayerWidget, 1000);
}

// =============================================
// FILTER TABS (Berita & Kegiatan pages)
// =============================================
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const group = tab.closest('.filter-tabs, .kegiatan-filter');
    group?.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // Simple filter by category
    const cat = tab.dataset.category;
    const container = document.querySelector('.berita-full-grid, .kegiatan-full-grid');
    if (!container) return;
    container.querySelectorAll('[data-category]').forEach(card => {
      card.style.display = (cat === 'semua' || card.dataset.category === cat) ? '' : 'none';
    });
  });
});

// =============================================
// ACTIVE NAV LINK
// =============================================
(function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isHome = (href === 'index.html' || href === './') && (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('Web'));
    const isMatch = !isHome && path.includes(href.replace('.html', ''));
    link.classList.toggle('active', isHome || isMatch);
  });
})();

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    initPrayerWidget();

    // Trigger reveal for elements already in view on load
    setTimeout(() => {
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) el.classList.add('visible');
        });
    }, 150);
    
    // DYNAMIC DATA LOADING FROM SUPABASE
    await loadDynamicData();

    const isIndex = document.querySelector('.hero') !== null;
    if (isIndex) {
        await initPopupIklan();
        await renderVideoTerkini();
        initKomentarForms();
        await renderKomentarList();
    }

    // THEME INITIALIZATION
    initTheme();
});

// =============================================
// THEME SWITCHER LOGIC
// =============================================
function initTheme() {
    const savedTheme = localStorage.getItem('aqobah7_theme') || 'default';
    if(savedTheme === 'mint') {
        document.body.classList.add('theme-mint');
    }
}

function toggleTheme() {
    const isMint = document.body.classList.toggle('theme-mint');
    localStorage.setItem('aqobah7_theme', isMint ? 'mint' : 'default');
    
    // Alert user briefly
    showThemeToast(isMint ? 'Tema Mint diaktifkan' : 'Tema Hijau Tua diaktifkan');
}

function showThemeToast(msg) {
    let toast = document.getElementById('theme-toast');
    if(!toast) {
        toast = document.createElement('div');
        toast.id = 'theme-toast';
        toast.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: var(--green-800); color: white; padding: 10px 20px;
            border-radius: 50px; font-size: 0.85rem; z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// =============================================
// DYNAMIC DATA FROM LOCALSTORAGE
// =============================================
const defaultHeroActivities = [
    { id: 1, title: "Kajian Rutin Ahad Subuh", date: "Setiap Ahad", image: "assets/kegiatan-1.jpg" },
    { id: 2, title: "Bank Beras 1 Canting", date: "Setiap Hari", image: "assets/kegiatan-2.jpg" },
    { id: 3, title: "Berbagi Sayur Gratis", date: "Jumat Pagi", image: "assets/kegiatan-3.jpg" },
    { id: 4, title: "Cuci Motor Seikhlasnya", date: "Sabtu - Ahad", image: "assets/kegiatan-4.jpg" },
    { id: 5, title: "Tahfidz Al-Qur'an Anak", date: "Senin - Kamis", image: "assets/kegiatan-5.jpg" }
];

async function renderKegiatanSlider() {
    const slider = document.getElementById('kegiatanSlider');
    const dotsWrap = document.getElementById('kegDots');
    if (!slider || !dotsWrap) return;

    let galleryItems = [];
    let realKeg = [];
    try {
        realKeg = await SupaDB.fetchAll('kegiatan_masjid');
    } catch(e) { console.error(e); }
    
    if (realKeg && realKeg.length > 0) {
        // Flatten all images from displayed activities (newest first)
        realKeg.filter(k => k.tampilkan).sort((a,b) => {
            const ta = a.tanggal_mulai || a.tanggalMulai || '';
            const tb = b.tanggal_mulai || b.tanggalMulai || '';
            return new Date(tb) - new Date(ta); 
        }).forEach(item => {
            const images = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
            images.forEach(imgUrl => {
                galleryItems.push({
                    id: item.id,
                    judul: item.judul || item.title,
                    kategori: item.kategori,
                    tanggal_mulai: item.tanggal_mulai || item.tanggalMulai,
                    waktu_mulai: item.waktu_mulai || item.waktuMulai || item.date || '',
                    imageUrl: imgUrl
                });
            });
        });
    }

    if (galleryItems.length === 0) {
        galleryItems = defaultHeroActivities.map(item => ({
            id: item.id,
            judul: item.title,
            tanggal_mulai: '',
            waktu_mulai: item.date,
            imageUrl: item.image
        }));
    }

    slider.innerHTML = galleryItems.map(item => {
        const tgl = item.tanggal_mulai;
        const waktu = item.waktu_mulai;
        return `
        <div class="k-slide clickable" data-keg-id="${item.id}" style="cursor:pointer;">
            <div style="padding: 0 4px; height: 100%;">
                <div style="position: relative; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; background:var(--green-900);">
                    <img src="${item.imageUrl}" alt="${escapeHtml(item.judul)}" loading="lazy"
                         onerror="this.style.opacity='0'" style="width:100%; height:100%; object-fit:cover; display:block;">
                    <div class="k-slide-overlay" style="position:absolute; bottom:0; padding:3rem 1rem 1rem; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); width:100%; color:white;">
                        <div class="k-slide-title" style="font-size:0.95rem; font-weight:700; margin-bottom:0.25rem; font-family:var(--font-heading); line-height:1.2;">
                            ${escapeHtml(item.judul)}
                        </div>
                        <div class="k-slide-date" style="font-size:0.75rem; color:var(--gold);">
                            <i class="fa-regular fa-clock"></i> ${waktu ? escapeHtml(waktu) : (tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'numeric',month:'short'}) : '')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Modal Interaction
    slider.querySelectorAll('.k-slide.clickable').forEach(slide => {
        slide.addEventListener('click', () => {
            const id = slide.dataset.kegId;
            let item = null;
            if (realKeg) item = realKeg.find(a => String(a.id) === String(id));
            
            if(!item) {
                const def = defaultHeroActivities.find(a => String(a.id) === String(id));
                if (def) {
                    openContentModal({
                        judul: def.title,
                        badge: 'Kegiatan',
                        tanggal: def.date,
                        isi: '',
                        foto: [def.image]
                    });
                }
                return;
            }
            const tgl = item.tanggal_mulai ? (new Date(item.tanggal_mulai).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) + ' ' + item.waktu_mulai) : item.date;
            openContentModal({
                judul: item.judul || item.title,
                badge: item.kategori || 'Kegiatan',
                tanggal: tgl,
                isi: item.deskripsi_lengkap || `<p>${escapeHtml(item.deskripsi_singkat || item.deskripsi || '')}</p><p><strong>Lokasi:</strong> ${escapeHtml(item.lokasi || 'Masjid Al Aqobah 7')}</p>`,
                foto: item.images || (item.image ? [item.image] : []),
                logo: item.logo || null
            });
        });
    });

    const totalItems = galleryItems.length;
    let current = 0;
    let timer = null;

    function getItemsPerView() {
        if(window.innerWidth <= 480) return 1;
        if(window.innerWidth <= 768) return 2;
        if(window.innerWidth <= 992) return 3;
        return 4; // Desktop
    }

    function updateDots() {
        const views = getItemsPerView();
        const maxIndex = Math.max(0, totalItems - views);
        let dotsHtml = '';
        for(let i=0; i<=maxIndex; i++) {
            dotsHtml += `<button class="k-dot${i === current ? ' active' : ''}" data-idx="${i}" aria-label="Slide ${i+1}"></button>`;
        }
        dotsWrap.innerHTML = dotsHtml;
        if (maxIndex === 0) {
            dotsWrap.style.display = 'none';
        } else {
            dotsWrap.style.display = 'flex';
        }
    }

    function goTo(idx) {
        const views = getItemsPerView();
        const maxIndex = Math.max(0, totalItems - views);
        
        if (idx > maxIndex) idx = 0;
        if (idx < 0) idx = maxIndex;
        
        current = idx;
        
        // Calculate translation. 1 item = 100 / totalItems % of track width.
        const translatePct = (current * (100 / totalItems));
        slider.style.transform = `translateX(-${translatePct}%)`;
        
        // update dots
        updateDots();
    }

    function startAuto() {
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), 5000);
    }
    function stopAuto() { clearInterval(timer); }

    document.getElementById('kegPrev')?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    document.getElementById('kegNext')?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    dotsWrap.addEventListener('click', e => {
        const dot = e.target.closest('.k-dot');
        if (dot) { stopAuto(); goTo(parseInt(dot.dataset.idx)); startAuto(); }
    });
    
    // Auto-update on resize
    window.addEventListener('resize', () => {
        goTo(current); // re-bound current if needed
    });

    updateDots();
    startAuto();
}

async function loadDynamicData() {
    const isIndex = document.querySelector('.hero') !== null;
    const isLayanan = window.location.pathname.includes('layanan');
    const isBerita = window.location.pathname.includes('berita');
    const isKegiatan = window.location.pathname.includes('kegiatan');
    
    // 1. Pengaturan Umum (Global)
    const pengaturan = await SupaDB.fetchConfig('pengaturan_umum');
    if (pengaturan) {
        // Navbar
        document.querySelectorAll('.navbar-brand-name').forEach(el => el.textContent = pengaturan.namaMasjid);
        // Footer
        document.querySelectorAll('.footer-name').forEach(el => el.textContent = pengaturan.namaMasjid);
        document.querySelectorAll('.footer-sub').forEach(el => el.textContent = pengaturan.alamat);
        
        // Contacts
        const waLinks = document.querySelectorAll('a[href^="https://wa.me"]');
        waLinks.forEach(link => {
            link.href = 'https://wa.me/' + pengaturan.telepon.replace(/\D/g, '');
            link.textContent = pengaturan.telepon;
        });
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            link.href = 'mailto:' + pengaturan.email;
            link.textContent = pengaturan.email;
        });
        
        // Socials
        if(pengaturan.sosmed) {
            document.querySelectorAll('a[aria-label*="YouTube"]').forEach(el => el.href = pengaturan.sosmed.yt || '#');
            document.querySelectorAll('a[aria-label*="Instagram"]').forEach(el => el.href = pengaturan.sosmed.ig || '#');
            document.querySelectorAll('a[aria-label*="Facebook"]').forEach(el => el.href = pengaturan.sosmed.fb || '#');
            document.querySelectorAll('a[aria-label*="WhatsApp"]').forEach(el => el.href = pengaturan.sosmed.tw || '#'); // Used twitter link for wa icon as fallback or just WA
        }
    }

    // 2. Beranda Config (Only on index)
    if (isIndex) {
        await renderKegiatanSlider();

        const beranda = await SupaDB.fetchConfig('beranda_config');
        if (beranda) {
            // Hero - admin saves flat fields: ayat, namaMasjid, tagline, cta1, cta2
            const arab = document.querySelector('.hero-arabic');
            if (arab && beranda.ayat) arab.textContent = beranda.ayat;
            
            const title = document.querySelector('.hero-title');
            if (title && beranda.namaMasjid) {
                // Autobreak 'Masjid Al Aqobah 7' into 2 lines elegantly
                title.innerHTML = beranda.namaMasjid.replace(/(Masjid)\s+/i, '$1<br>');
            }
            
            const tagline = document.querySelector('.hero-tagline');
            if (tagline && beranda.tagline) tagline.innerHTML = beranda.tagline;
            
            // Stats
            if (beranda.stats && beranda.stats.length > 0) {
                const statsGrid = document.querySelector('.stats-grid');
                if (statsGrid) {
                   const cards = statsGrid.querySelectorAll('.stat-card');
                   beranda.stats.forEach((st, i) => {
                       if(cards[i]) {
                           const numberEl = cards[i].querySelector('.stat-number');
                           const labelEl = cards[i].querySelector('.stat-label');
                           if(numberEl) {
                               numberEl.dataset.target = st.value.replace(/[^0-9.]/g, '');
                               const suffix = st.value.replace(/[0-9.]/g, '');
                               if(suffix) numberEl.dataset.suffix = suffix;
                           }
                           if(labelEl) labelEl.textContent = st.label;
                       }
                   });
                }
            }
            
            // Visi Misi - admin saves flat: visi (string), misi (array of {icon, text})
            if (beranda.visi) {
                const visiText = document.querySelectorAll('.visi-text');
                if(visiText.length > 0) {
                    // Use last .visi-text element for visi content
                    visiText[visiText.length > 1 ? 1 : 0].textContent = beranda.visi;
                }
            }
            
            if (beranda.misi && beranda.misi.length > 0) {
                const misiList = document.querySelector('.misi-list');
                if (misiList) {
                    misiList.innerHTML = beranda.misi.map(m => `
                        <li class="misi-item">
                          <div class="misi-icon"><i class="fa-solid fa-${m.icon || 'star'}" aria-hidden="true"></i></div>
                          <div class="misi-text">
                            <p style="font-weight: 500;">${m.text}</p>
                          </div>
                        </li>
                    `).join('');
                }
            }
        }
    }

    // 3. Layanan
    let layanan = [];
    try { layanan = await SupaDB.fetchAll('layanan_masyarakat'); } catch(e){}
    
    if (layanan && layanan.length > 0) {
        const activeLayanan = layanan.filter(l => l.status);

        // ---- Homepage layanan section ----
        if (isIndex) {
            // Try card grid container first (layanan-grid for icon style)
            let indexContainer = document.querySelector('.section[aria-labelledby="layanan-title"] .layanan-grid');
            if (indexContainer && activeLayanan.length > 0) {
                const displayLayanan = activeLayanan.slice(0, 6);
                const faIconMap = {
                    'wheat': 'fa-bowl-rice', 'carrot': 'fa-leaf', 'bike': 'fa-motorcycle',
                    'heart-handshake': 'fa-hand-holding-heart', 'book-open': 'fa-book-open-reader',
                    'cross': 'fa-plus-square', 'users': 'fa-people-group', 'child': 'fa-child',
                    'motorcycle': 'fa-motorcycle', 'book-open-reader': 'fa-book-open-reader',
                    'carrot': 'fa-leaf', 'star': 'fa-star'
                };
                indexContainer.innerHTML = displayLayanan.map((l, i) => {
                    const iconClass = faIconMap[l.icon] || 'fa-star';
                    const delay = (i % 3) + 1;
                    const hasDetail = !!(l.deskripsi_lengkap || (l.images && l.images.length > 0));
                    return `
                    <div class="layanan-card reveal reveal-delay-${delay}${hasDetail ? ' clickable' : ''}"
                        data-layanan-id="${l.id}" style="cursor:${hasDetail ? 'pointer' : 'default'}">
                      <div class="layanan-icon"><i class="fa-solid ${iconClass}" aria-hidden="true"></i></div>
                      <h3>${escapeHtml(l.judul || l.nama || '')}</h3>
                      <p>${escapeHtml(l.deskripsi_singkat || l.deskripsi || '')}</p>
                      ${hasDetail ? '<p style="font-size:0.78rem;color:var(--gold);margin-top:0.5rem;font-weight:600;"><i class="fa-solid fa-circle-info"></i> Klik untuk detail</p>' : ''}
                    </div>`;
                }).join('');
                // Bind click
                indexContainer.querySelectorAll('[data-layanan-id].clickable').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.layananId;
                        const item = layanan.find(l => String(l.id) === String(id));
                        if (!item) return;
                        openContentModal({
                            judul: item.judul || item.nama || '', badge: 'Layanan',
                            isi: item.deskripsi_lengkap || `<p>${escapeHtml(item.deskripsi_singkat || item.deskripsi || '')}</p>`,
                            foto: item.images || [], logo: item.logo || null
                        });
                    });
                });
                indexContainer.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
            }
        } else if (isLayanan) {
            // ---- layanan.html full page ----
            const pageGrid = document.getElementById('layananFullGrid');
            if (pageGrid) {
                // Remove loader
                const loader = document.getElementById('layananLoader');
                if (loader) loader.remove();

                if (activeLayanan.length === 0) {
                    pageGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                        <i class="fa-solid fa-box-open" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
                        <p style="font-size:1.1rem; font-weight:600;">Layanan Belum Tersedia</p>
                        <p style="font-size:0.9rem; margin-top:0.5rem;">Admin belum menambahkan layanan. Silakan cek kembali nanti.</p>
                    </div>`;
                    return;
                }

                const faIconMap = {
                    'wheat': 'fa-bowl-rice', 'carrot': 'fa-leaf', 'bike': 'fa-motorcycle',
                    'heart-handshake': 'fa-hand-holding-heart', 'book-open': 'fa-book-open-reader',
                    'cross': 'fa-plus-square', 'users': 'fa-people-group', 'child': 'fa-child',
                    'motorcycle': 'fa-motorcycle', 'star': 'fa-star', 'mosque': 'fa-mosque'
                };

                pageGrid.innerHTML = activeLayanan.map((l, i) => {
                    const iconClass = faIconMap[l.icon] || 'fa-hand-holding-heart';
                    const delay = (i % 3) + 1;
                    const hasImg = l.images && l.images.length > 0;
                    const thumb = hasImg ? l.images[0] : null;
                    const hasDetail = !!(l.deskripsi_lengkap || l.tujuan || l.manfaat || hasImg);
                    const shortDesc = l.deskripsi_singkat || l.deskripsi || '';
                    return `
                    <article class="layanan-full-card reveal reveal-delay-${delay}" data-layanan-id="${l.id}" role="listitem"
                             style="cursor:${hasDetail ? 'pointer' : 'default'}">
                      ${hasImg ? `
                      <div style="width:100%; aspect-ratio:16/9; border-radius:var(--radius-sm); overflow:hidden; margin-bottom:1.25rem;">
                        <img src="${thumb}" alt="${escapeHtml(l.judul || '')}" loading="lazy"
                             style="width:100%;height:100%;object-fit:cover; transition: transform 0.4s ease;"
                             onerror="this.parentElement.style.display='none'">
                      </div>` : ''}
                      <div class="layanan-full-icon">
                        <i class="fa-solid ${iconClass}" aria-hidden="true"></i>
                      </div>
                      <h3>${escapeHtml(l.judul || l.nama || '')}</h3>
                      ${shortDesc ? `<p>${escapeHtml(shortDesc)}</p>` : ''}
                      ${hasDetail ? `<a href="javascript:void(0)" class="layanan-cta-link">
                        Lihat Selengkapnya <i class="fa-solid fa-arrow-right"></i>
                      </a>` : ''}
                    </article>`;
                }).join('');

                // Bind click for rich detail modal
                pageGrid.querySelectorAll('[data-layanan-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.layananId;
                        const item = layanan.find(l => String(l.id) === String(id));
                        if (!item) return;

                        // Build modal body with all available detail
                        const imgArr = item.images || [];
                        let modalIsi = '';

                        // Image carousel (if multiple)
                        if (imgArr.length > 1) {
                            modalIsi += `<div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:1.25rem;">`;
                            imgArr.forEach(src => {
                                modalIsi += `<img src="${src}" style="flex-shrink:0;width:200px;height:130px;object-fit:cover;border-radius:8px;" loading="lazy">`;
                            });
                            modalIsi += `</div>`;
                        }

                        // Full description
                        if (item.deskripsi_lengkap) {
                            modalIsi += item.deskripsi_lengkap;
                        } else if (item.deskripsi_singkat || item.deskripsi) {
                            modalIsi += `<p>${escapeHtml(item.deskripsi_singkat || item.deskripsi)}</p>`;
                        }

                        // Extra info sections
                        if (item.tujuan) modalIsi += `<h4 style="margin:1rem 0 0.4rem;color:var(--green-800);"><i class="fa-solid fa-bullseye" style="color:var(--gold)"></i> Tujuan</h4><p>${escapeHtml(item.tujuan)}</p>`;
                        if (item.manfaat) modalIsi += `<h4 style="margin:1rem 0 0.4rem;color:var(--green-800);"><i class="fa-solid fa-star" style="color:var(--gold)"></i> Manfaat</h4><p>${escapeHtml(item.manfaat)}</p>`;
                        if (item.cara_ikut) modalIsi += `<h4 style="margin:1rem 0 0.4rem;color:var(--green-800);"><i class="fa-solid fa-hand-point-right" style="color:var(--gold)"></i> Cara Ikut</h4><p>${escapeHtml(item.cara_ikut)}</p>`;

                        openContentModal({
                            judul: item.judul || item.nama || '',
                            badge: 'Layanan',
                            isi: modalIsi || `<p>${escapeHtml(item.deskripsi_singkat || item.deskripsi || 'Tidak ada deskripsi lengkap.')}</p>`,
                            foto: imgArr.length === 1 ? imgArr : [],
                            logo: item.logo || null
                        });
                    });
                });
                pageGrid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
            }
        }
    }

    // 4. Berita
    let berita = [];
    try { berita = await SupaDB.fetchAll('berita'); } catch(e){}
    
    const beritaContainer = isIndex
        ? (document.getElementById('beritaGrid') || document.querySelector('.berita-grid'))
        : (isBerita ? document.querySelector('.berita-full-grid') : null);

    if (beritaContainer) {
        if (berita && berita.length > 0) {
            const pubBerita = berita.filter(b => b.status === 'Publikasi').sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
            
            // --- KONTEN UTAMA (FEATURED GRID) ---
            const kontenUtamaContainer = document.getElementById('kontenUtamaGrid');
            if (kontenUtamaContainer && isIndex) {
                // Fetch video_reels specifically for this section
                let videos = [];
                try { videos = await SupaDB.fetchConfig('video_reels') || []; } catch(e){}
                const pubVideos = videos.filter(v => v.aktif !== false);
                
                const featuredData = pubVideos[0];
                const sideDataList = pubVideos.slice(1, 4);

                if (featuredData) {
                    const fThumb = featuredData.thumbnail || '';
                    const hasFImg = !!fThumb;
                    
                    const featuredHTML = `
                        <a href="${featuredData.url || '#'}" target="_blank" rel="noopener" class="konten-featured">
                            <div class="konten-featured-img">
                                ${hasFImg ? `<img src="${fThumb}" alt="Video Thumbnail" loading="lazy" onerror="this.parentElement.style.display='none'">` : '<i class="fa-brands fa-instagram" style="color:var(--gold);font-size:4rem;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></i>'}
                            </div>
                            <div class="konten-overlay">
                                <span class="konten-label"><i class="fa-solid fa-play"></i> Reels</span>
                                <h3 class="konten-title-large">${escapeHtml(featuredData.caption || 'Video Terbaru')}</h3>
                                <div class="konten-meta">
                                    <i class="fa-brands fa-instagram"></i> @masjidal_aqobah7
                                </div>
                            </div>
                        </a>
                    `;

                    let sideHTML = '';
                    if (sideDataList.length > 0) {
                        sideHTML = `<div class="konten-side-list">` + sideDataList.map(v => {
                            const sThumb = v.thumbnail || '';
                            const hasSImg = !!sThumb;
                            return `
                                <a href="${v.url || '#'}" target="_blank" rel="noopener" class="konten-side-item">
                                    <div class="konten-side-img-wrap">
                                        ${hasSImg ? `<img src="${sThumb}" alt="Thumbnail" loading="lazy">` : '<i class="fa-brands fa-instagram" style="color:rgba(255,255,255,0.5);font-size:2rem;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></i>'}
                                        <span class="konten-side-label"><i class="fa-solid fa-play"></i> Video</span>
                                    </div>
                                    <div class="konten-side-info">
                                        <h4 class="konten-side-title">${escapeHtml(v.caption || 'Konten Video Instagram')}</h4>
                                        <div class="konten-side-date">
                                            <i class="fa-brands fa-instagram"></i> Masjid Al Aqobah 7
                                        </div>
                                    </div>
                                </a>
                            `;
                        }).join('') + `</div>`;
                    }

                    kontenUtamaContainer.innerHTML = featuredHTML + sideHTML;

                } else {
                    kontenUtamaContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888; padding:2rem 0;">Belum ada video video Instagram yang dipublikasikan saat ini.</p>';
                }
            }

            // --- STANDARD BERITA (LOWER SECTION) ---
            // If it's index, we already used top 4 for 'Konten Utama', maybe show next 3 for 'Berita Terkini' section or just show the same top 3. Let's show the standard top 3 for the 'Berita Terkini' (or slice from index 4 if we want unique).
            const displayBerita = isIndex ? pubBerita.slice(0, 3) : pubBerita;

            if (displayBerita.length > 0) {
                beritaContainer.innerHTML = displayBerita.map((b, i) => {
                    const delay = (i % 3) + 1;
                    // Admin saves: deskripsi_lengkap, deskripsi_singkat, images
                    const bodyHtml = b.deskripsi_lengkap || b.isi || '';
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = bodyHtml;
                    const plainText = tempDiv.textContent || '';
                    const excerpt = plainText.substring(0, 120) + (plainText.length > 120 ? '…' : '');
                    const imgArr = b.images || b.foto || [];
                    const thumbSrc = (imgArr.length > 0) ? imgArr[0] : (b.thumbnail || '');
                    const hasImg = !!thumbSrc;
                    const hasDetail = bodyHtml || imgArr.length > 0;
                    return `
                    <article class="berita-card reveal reveal-delay-${delay}${hasDetail ? ' clickable' : ''}${!hasImg ? ' no-image' : ''}"
                        data-berita-id="${b.id}" data-category="${b.kategori}" style="cursor:${hasDetail ? 'pointer' : 'default'}">
                      ${hasImg ? `
                      <div class="berita-thumb">
                        <img src="${thumbSrc}" alt="${escapeHtml(b.judul)}" loading="lazy"
                          onerror="this.parentElement.style.display='none'">
                        <div class="berita-thumb-watermark">${WATERMARK_SVG}</div>
                        <span class="berita-badge">${b.kategori}</span>
                      </div>` : ''}
                      <div class="berita-body">
                        ${!hasImg ? `<span class="berita-badge" style="position:static;display:inline-block;margin-bottom:0.75rem">${b.kategori}</span>` : ''}
                        <p class="berita-meta">
                          <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                          ${b.tanggal} &nbsp;·&nbsp;
                          <i class="fa-regular fa-user" aria-hidden="true"></i>
                          Admin
                        </p>
                        <h3>${escapeHtml(b.judul)}</h3>
                        <p>${escapeHtml(excerpt)}</p>
                        ${hasDetail ? '<span class="berita-read">Baca Selengkapnya <i class="fa-solid fa-arrow-right"></i></span>' : ''}
                      </div>
                    </article>
                    `;
                }).join('');

                // Bind click for modal
                beritaContainer.querySelectorAll('.berita-card.clickable').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.beritaId;
                        const item = berita.find(b => String(b.id) === String(id));
                        if (!item) return;
                        const tanggalFmt = new Date(item.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
                        const bodyContent = item.deskripsi_lengkap || item.isi || '';
                        const fallbackText = item.deskripsi_singkat || '';
                        openContentModal({
                            judul: item.judul,
                            badge: item.kategori,
                            tanggal: tanggalFmt,
                            isi: bodyContent || `<p>${escapeHtml(fallbackText)}</p>`,
                            foto: item.images || item.foto || [],
                            logo: item.logo || null
                        });
                    });
                });

                beritaContainer.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
            } else {
                beritaContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888; padding:2rem 0;">Belum ada berita yang dipublikasikan saat ini.</p>';
            }
        } else {
            beritaContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888; padding:2rem 0;">Belum ada berita yang dipublikasikan saat ini.</p>';
        }
    }

    // 5. Kegiatan
    let kegiatan = [];
    try { kegiatan = await SupaDB.fetchAll('kegiatan_masjid'); } catch(e){}
    const todayStr = new Date().toISOString().split('T')[0];

    // Helper: normalize field names (support both old and new admin formats)
    function normKeg(k) {
        return {
            ...k,
            tanggal_mulai: k.tanggal_mulai || k.tanggalMulai || '',
            waktu_mulai: k.waktu_mulai || k.waktuMulai || '',
            judul: k.judul || k.nama || '',
            deskripsi_singkat: k.deskripsi_singkat || k.deskripsi || '',
            deskripsi_lengkap: k.deskripsi_lengkap || k.deskripsiLengkap || k.isi || '',
            images: k.images || (k.foto ? k.foto : (k.thumbnail ? [k.thumbnail] : []))
        };
    }

    if (isIndex) {
        // --- Homepage kegiatan: card-grid style (same as kegiatan.html) ---
        const kegGrid = document.querySelector('.section[aria-labelledby="kegiatan-title"] #kegiatanTimeline, .section[aria-labelledby="kegiatan-title"] .kegiatan-timeline');
        if (kegGrid && kegiatan && kegiatan.length > 0) {
            const upcoming = kegiatan.map(normKeg)
                .filter(k => k.tampilkan && k.tanggal_mulai >= todayStr)
                .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai))
                .slice(0, 4);

            if (upcoming.length > 0) {
                kegGrid.innerHTML = upcoming.map((k, i) => {
                    const dateObj = new Date(k.tanggal_mulai);
                    const tanggalFmt = dateObj.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
                    const badgeCls = k.kategori === 'Kajian Rutin' ? 'badge-rutin' : 'badge-khusus';
                    const delay = (i % 3) + 1;
                    const hasImg = k.images && k.images.length > 0;
                    const thumb = hasImg ? k.images[0] : null;
                    return `
                    <article class="berita-card reveal reveal-delay-${delay} clickable" data-kegiatan-id="${k.id}" role="listitem">
                      <div class="berita-thumb">
                        ${thumb
                          ? `<img src="${thumb}" alt="${escapeHtml(k.judul)}" style="width:100%;height:100%;object-fit:cover;">`
                          : `<div style="background:var(--primary-gradient);height:100%;display:flex;align-items:center;justify-content:center">
                              <i class="fa-solid fa-calendar-days" style="font-size:3rem;color:var(--gold)" aria-hidden="true"></i>
                             </div>`}
                        <span class="berita-badge ${badgeCls}">${k.kategori}</span>
                      </div>
                      <div class="berita-body">
                        <p class="berita-meta"><i class="fa-regular fa-calendar"></i> ${tanggalFmt} &nbsp;·&nbsp; <i class="fa-regular fa-clock"></i> ${k.waktu_mulai} WIB</p>
                        <h3 style="margin-bottom:0.5rem;">${escapeHtml(k.judul)}</h3>
                        <p style="font-size:0.875rem;margin-bottom:0.5rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(k.lokasi || '')}</p>
                        <p>${escapeHtml(k.deskripsi_singkat)}</p>
                        <a href="javascript:void(0)" class="berita-read">Detail <i class="fa-solid fa-arrow-right"></i></a>
                      </div>
                    </article>`;
                }).join('');
                kegGrid.querySelectorAll('[data-kegiatan-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.kegiatanId;
                        const raw = kegiatan.find(k => String(k.id) === String(id));
                        if (!raw) return;
                        const item = normKeg(raw);
                        const tglFmt = new Date(item.tanggal_mulai).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) + ' — ' + item.waktu_mulai + ' WIB';
                        openContentModal({ judul: item.judul, badge: item.kategori, tanggal: tglFmt,
                            isi: item.deskripsi_lengkap || `<p>${escapeHtml(item.deskripsi_singkat)}</p><p><strong>Lokasi:</strong> ${escapeHtml(item.lokasi || '')}</p>`,
                            foto: item.images, logo: item.logo || null });
                    });
                });
                kegGrid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
            }
        }
    } else {
        // --- kegiatan.html: full card-grid replacing static fallback ---
        const kegFull = document.getElementById('kegiatanFullGrid');
        if (kegFull && kegiatan && kegiatan.length > 0) {
            const displayKeg = kegiatan.map(normKeg)
                .filter(k => k.tampilkan)
                .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai));

            if (displayKeg.length > 0) {
                // Remove static fallback, replace with dynamic content
                kegFull.innerHTML = displayKeg.map((k, i) => {
                    const dateObj = new Date(k.tanggal_mulai);
                    const tanggalFmt = dateObj.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
                    const badgeCls = k.kategori === 'Kajian Rutin' ? 'badge-rutin' : 'badge-khusus';
                    const delay = (i % 3) + 1;
                    const hasImg = k.images && k.images.length > 0;
                    const thumb = hasImg ? k.images[0] : null;
                    return `
                    <article class="berita-card reveal reveal-delay-${delay} clickable" data-kegiatan-id="${k.id}" data-category="${k.kategori}" role="listitem">
                      <div class="berita-thumb">
                        ${thumb
                          ? `<img src="${thumb}" alt="${escapeHtml(k.judul)}" style="width:100%;height:100%;object-fit:cover;">`
                          : `<div style="background:var(--primary-gradient);height:100%;display:flex;align-items:center;justify-content:center">
                              <i class="fa-solid fa-calendar-days" style="font-size:3rem;color:var(--gold)" aria-hidden="true"></i>
                             </div>`}
                        <span class="berita-badge ${badgeCls}">${k.kategori}</span>
                      </div>
                      <div class="berita-body">
                        <p class="berita-meta"><i class="fa-regular fa-calendar"></i> ${tanggalFmt} &nbsp;·&nbsp; <i class="fa-regular fa-clock"></i> ${k.waktu_mulai} WIB</p>
                        <h3 style="margin-bottom:0.5rem;">${escapeHtml(k.judul)}</h3>
                        <p style="margin-bottom:0.6rem;font-size:0.875rem;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(k.lokasi || '')}</p>
                        <p>${escapeHtml(k.deskripsi_singkat)}</p>
                        <a href="javascript:void(0)" class="berita-read">Baca Selengkapnya <i class="fa-solid fa-arrow-right"></i></a>
                      </div>
                    </article>`;
                }).join('');

                // Bind click for modal
                kegFull.querySelectorAll('[data-kegiatan-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.dataset.kegiatanId;
                        const raw = kegiatan.find(k => String(k.id) === String(id));
                        if (!raw) return;
                        const item = normKeg(raw);
                        const tglFmt = new Date(item.tanggal_mulai).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) + ' — ' + item.waktu_mulai + ' WIB';
                        openContentModal({ judul: item.judul, badge: item.kategori, tanggal: tglFmt,
                            isi: item.deskripsi_lengkap || `<p>${escapeHtml(item.deskripsi_singkat)}</p><p><strong>Lokasi:</strong> ${escapeHtml(item.lokasi || '')}</p>`,
                            foto: item.images, logo: item.logo || null });
                    });
                });
                kegFull.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
            }
        }
    }


    // 6. Copyright Year
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Shared watermark SVG string (mosque logo)
const WATERMARK_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C9 2 7 4 7 4H5v2l-3 1v14h4v-6h12v6h4V7l-3-1V4h-2S15 2 12 2zm0 2c2 0 3 1.5 3 1.5H9S10 4 12 4zM5 8l7-2 7 2v2H5V8zm1 4h12v1H6v-1z"/></svg>`;

// =============================================
// FEATURE 1 — POP-UP IKLAN MODAL
// =============================================
function initPopupIklan() {
    // Note: To avoid making initPopupIklan fully async for the caller, we can wrap the inner body
    (async () => {
        const banners = await SupaDB.fetchConfig('banner_iklan') || [];
    const modal = document.getElementById('popupIklanModal');
    const closeBtn = document.getElementById('popupIklanClose');
    const closeBtnFull = document.getElementById('popupIklanCloseBtn');

    if (!modal) return;

    // Filter active banners
    const active = banners.filter(b => b.aktif !== false);
    if (!active.length) return;

    if (sessionStorage.getItem('aqobah7_popup_iklan_shown')) return;

    const container = document.getElementById('popupIklanContainer');
    if (!container) return;

    // Generate Slider HTML
    let sliderHtml = `<div class="popup-iklan-slider">
        <div class="popup-iklan-track" id="popupIklanTrack">
            ${active.map((b, i) => `
                <div class="popup-iklan-slide" data-index="${i}">
                    ${b.link ? `<a href="${b.link}" target="_blank" rel="noopener noreferrer" style="width:100%; height:100%; display:block;">` : ''}
                    <img src="${b.image}" alt="${escapeHtml(b.alt || 'Informasi Masjid')}" loading="eager">
                    ${b.link ? `</a>` : ''}
                </div>
            `).join('')}
        </div>
        ${active.length > 1 ? `
        <button class="popup-iklan-nav popup-iklan-prev" id="popupIklanPrev"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="popup-iklan-nav popup-iklan-next" id="popupIklanNext"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="popup-iklan-dots" id="popupIklanDots">
            ${active.map((_, i) => `<div class="popup-iklan-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
        </div>
        ` : ''}
    </div>`;
    
    container.innerHTML = sliderHtml;

    // Slider Logic
    if (active.length > 1) {
        let currentIdx = 0;
        const track = document.getElementById('popupIklanTrack');
        const dots = document.querySelectorAll('.popup-iklan-dot');
        let slideInterval;

        function goToSlide(idx) {
            currentIdx = (idx + active.length) % active.length;
            if(track) track.style.transform = `translateX(-${currentIdx * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
        }

        function startAutoSlide() {
            stopAutoSlide();
            slideInterval = setInterval(() => goToSlide(currentIdx + 1), 4000);
        }

        function stopAutoSlide() {
            if (slideInterval) clearInterval(slideInterval);
        }

        document.getElementById('popupIklanPrev')?.addEventListener('click', () => { goToSlide(currentIdx - 1); startAutoSlide(); });
        document.getElementById('popupIklanNext')?.addEventListener('click', () => { goToSlide(currentIdx + 1); startAutoSlide(); });
        dots.forEach(dot => dot.addEventListener('click', () => { goToSlide(parseInt(dot.dataset.index)); startAutoSlide(); }));
        
        const sliderEl = document.querySelector('.popup-iklan-slider');
        if (sliderEl) {
            sliderEl.addEventListener('mouseenter', stopAutoSlide);
            sliderEl.addEventListener('mouseleave', startAutoSlide);
        }
        startAutoSlide();
    }

    setTimeout(() => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Disable scroll
        sessionStorage.setItem('aqobah7_popup_iklan_shown', '1');
    }, 1500);

    // Close handlers
    const closePopup = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore scroll
    };
    closeBtn?.addEventListener('click', closePopup);
    closeBtnFull?.addEventListener('click', closePopup);
    modal.addEventListener('click', e => {
        if (e.target === modal) closePopup();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePopup();
    }, { once: true });
    })(); // end async IIFE
}

// =============================================
// FEATURE 2 — VIDEO TERKINI (Simplified Thumbnail Link)
// =============================================
async function renderVideoTerkini() {
    const videos = await SupaDB.fetchConfig('video_reels') || [];
    const section = document.getElementById('video-terkini');
    const grid = document.getElementById('videoGrid');
    if (!section || !grid) return;

    const active = videos.filter(v => v.aktif !== false);
    if (!active.length) return;
    section.style.display = 'block';

    grid.innerHTML = active.map(v => {
        const thumb = v.thumbnail || 'assets/kegiatan-default.jpg';
        return `
        <div class="video-card reveal">
            <a href="${escapeHtml(v.url || '#')}" ${v.url ? 'target="_blank" rel="noopener noreferrer"' : 'style="cursor:default" onclick="event.preventDefault()"'} class="video-thumb" style="display:block;width:100%;height:100%">
                <img src="${escapeHtml(thumb)}" alt="${escapeHtml(v.caption || 'Video Center')}" class="aspect-16-9" loading="lazy">
                ${v.url ? '<div class="video-play-overlay"><div class="video-play-btn"><i class="fa-solid fa-external-link-alt" style="margin-left:2px"></i></div></div>' : ''}
            </a>
            <div class="video-info" style="padding:1rem">
                <p style="font-weight:600;margin:0">${escapeHtml((v.caption || '').substring(0, 100))}${v.caption?.length > 100 ? '…' : ''}</p>
            </div>
        </div>`;
    }).join('');
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// =============================================
// UTILITY — XSS safe string
// =============================================
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = (str || '').trim();
    return div.innerHTML;
}

// =============================================
// FEATURE 3 — KOMENTAR PUBLIK FORMS
// =============================================
function initKomentarForms() {
    // Tab switching
    document.querySelectorAll('.ktab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ktab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.getElementById('formKomentar')?.classList.toggle('hidden', tab !== 'komentar');
            document.getElementById('formKritik')?.classList.toggle('hidden', tab !== 'kritik');
        });
    });

    // Char counters
    const cmtPesan = document.getElementById('cmtPesan');
    const cmtCount = document.getElementById('cmtCharCount');
    cmtPesan?.addEventListener('input', () => {
        cmtCount.textContent = `${cmtPesan.value.length} / 500`;
    });

    const ksPesan = document.getElementById('ksPesan');
    const ksCount = document.getElementById('ksCharCount');
    ksPesan?.addEventListener('input', () => {
        ksCount.textContent = `${ksPesan.value.length} / 1000`;
    });

    // Comment form submit
    document.getElementById('publicCommentForm')?.addEventListener('submit', e => {
        e.preventDefault();
        submitKomentar();
    });

    // Kritik form submit
    document.getElementById('publicKritikForm')?.addEventListener('submit', e => {
        e.preventDefault();
        submitKritikSaran();
    });
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function checkRateLimit(key, limitMs) {
    const last = parseInt(sessionStorage.getItem(key) || '0');
    const now = Date.now();
    if (now - last < limitMs) {
        const remaining = Math.ceil((limitMs - (now - last)) / 1000);
        return { ok: false, remaining };
    }
    sessionStorage.setItem(key, now.toString());
    return { ok: true };
}

function showMsg(elId, msg, type) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = `komentar-msg ${type}`;
    el.innerHTML = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function submitKomentar() {
    const nama = document.getElementById('cmtNama')?.value.trim();
    const email = document.getElementById('cmtEmail')?.value.trim();
    const komentar = document.getElementById('cmtPesan')?.value.trim();
    const honeypot = document.getElementById('cmtHoneypot')?.value;

    // Honeypot check (bot trap)
    if (honeypot) return;

    // Validate
    if (!nama || nama.length < 2) return showMsg('cmtMsg', '❌ Masukkan nama lengkap (min. 2 karakter).', 'error');
    if (!validateEmail(email)) return showMsg('cmtMsg', '❌ Format email tidak valid.', 'error');
    if (!komentar || komentar.length < 5) return showMsg('cmtMsg', '❌ Komentar terlalu pendek (min. 5 karakter).', 'error');

    // Rate limit: 1 komentar per 5 menit
    const rate = checkRateLimit('aqobah7_cmt_last', 5 * 60 * 1000);
    if (!rate.ok) return showMsg('cmtMsg', `⏳ Mohon tunggu ${rate.remaining} detik sebelum berkomentar lagi.`, 'error');

    // Get moderation mode
    const adminConfig = await SupaDB.fetchConfig('komentar_config') || {};
    const autoPublish = adminConfig.autoPublish === true;

    try {
        const btn = document.getElementById('cmtSubmitBtn');
        if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; }
        
        await SupaDB.insertItem('komentar', {
            nama: sanitizeText(nama),
            email: email, // stored but never displayed publicly
            komentar: sanitizeText(komentar),
            status: autoPublish ? 'approved' : 'pending' // waktu set natively by Supabase
        });

        // Reset form
        document.getElementById('publicCommentForm').reset();
        document.getElementById('cmtCharCount').textContent = '0 / 500';

        if (autoPublish) {
            showMsg('cmtMsg', '✅ Komentar Anda berhasil dipublikasikan. Terima kasih!', 'success');
            await renderKomentarList();
        } else {
            showMsg('cmtMsg', '✅ Komentar Anda telah diterima dan sedang menunggu moderasi admin. Terima kasih!', 'success');
        }
        
        if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Komentar'; }
    } catch (err) {
        showMsg('cmtMsg', '❌ Gagal mengirim komentar: ' + err.message, 'error');
        const btn = document.getElementById('cmtSubmitBtn');
        if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Komentar'; }
    }
}

async function renderKomentarList() {
    const listEl = document.getElementById('komList');
    const countEl = document.getElementById('komCount');
    if (!listEl) return;

    let all = [];
    try { all = await SupaDB.fetchAll('komentar'); } catch(e){}
    const approved = all.filter(k => k.status === 'approved').sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

    if (countEl) countEl.textContent = `${approved.length} komentar`;

    if (!approved.length) {
        listEl.innerHTML = `
            <div class="komentar-empty">
                <i class="fa-regular fa-comment-dots"></i>
                <p>Belum ada komentar. Jadilah yang pertama!</p>
            </div>`;
        return;
    }

    listEl.innerHTML = approved.map(k => {
        const initial = (k.nama || '?').charAt(0).toUpperCase();
        const timeStr = new Date(k.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        return `
        <div class="komentar-item">
            <div class="komentar-meta">
                <div class="komentar-avatar">${initial}</div>
                <div>
                    <div class="komentar-author">${k.nama}</div>
                    <div class="komentar-time"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
                </div>
            </div>
            <div class="komentar-body">${k.komentar}</div>
        </div>`;
    }).join('');
}

// =============================================
// FEATURE 4 — KRITIK & SARAN (PRIVATE)
// =============================================
async function submitKritikSaran() {
    const nama = document.getElementById('ksNama')?.value.trim();
    const email = document.getElementById('ksEmail')?.value.trim();
    const pesan = document.getElementById('ksPesan')?.value.trim();
    const honeypot = document.getElementById('ksHoneypot')?.value;

    if (honeypot) return;
    if (!nama || nama.length < 2) return showMsg('ksMsg', '❌ Masukkan nama lengkap (min. 2 karakter).', 'error');
    if (!validateEmail(email)) return showMsg('ksMsg', '❌ Format email tidak valid.', 'error');
    if (!pesan || pesan.length < 10) return showMsg('ksMsg', '❌ Pesan terlalu pendek (min. 10 karakter).', 'error');

    const rate = checkRateLimit('aqobah7_ks_last', 10 * 60 * 1000);
    if (!rate.ok) return showMsg('ksMsg', `⏳ Mohon tunggu ${rate.remaining} detik sebelum mengirim lagi.`, 'error');

    try {
        const btn = document.getElementById('ksSubmitBtn');
        if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; }
        
        await SupaDB.insertItem('kritik_saran', {
            nama: sanitizeText(nama),
            email: email,
            pesan: sanitizeText(pesan),
            dibaca: false
        });

        document.getElementById('publicKritikForm').reset();
        document.getElementById('ksCharCount').textContent = '0 / 1000';
        showMsg('ksMsg', '✅ Pesan Anda telah diterima dengan aman. Kami akan mempertimbangkan masukan Anda. Terima kasih!', 'success');
        
        if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Kirim Secara Privat'; }
    } catch(err) {
        showMsg('ksMsg', '❌ Gagal mengirim pesan: ' + err.message, 'error');
        const btn = document.getElementById('ksSubmitBtn');
        if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Kirim Secara Privat'; }
    }
}

// =============================================
// FEATURE 5 — CONTENT MODAL (Berita & Layanan)
// =============================================
function openContentModal({ judul, badge, tanggal, isi, foto = [], logo = '' }) {
    // Close any existing
    document.getElementById('contentModalOverlay')?.remove();

    const hasPhotos = foto && foto.length > 0;
    let carouselHtml = '';
    if (hasPhotos) {
        carouselHtml = `
        <div class="modal-carousel">
            <div class="modal-carousel-track" id="mcTrack">
                ${foto.map((f, i) => `
                <div class="modal-carousel-slide">
                    <img src="${f}" alt="${escapeHtml(judul)} foto ${i+1}" loading="lazy">
                    <div class="modal-carousel-watermark">${WATERMARK_SVG}</div>
                </div>`).join('')}
            </div>
            ${foto.length > 1 ? `
            <button class="modal-carousel-btn modal-carousel-prev" id="mcPrev" aria-label="Foto sebelumnya"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="modal-carousel-btn modal-carousel-next" id="mcNext" aria-label="Foto berikutnya"><i class="fa-solid fa-chevron-right"></i></button>
            <div class="modal-carousel-counter" id="mcCounter">1 / ${foto.length}</div>` : ''}
        </div>
        ${foto.length > 1 ? `<div class="modal-carousel-dots" id="mcDots">${foto.map((_,i) => `<button class="modal-carousel-dot${i===0?' active':''}" data-idx="${i}" aria-label="Foto ${i+1}"></button>`).join('')}</div>` : ''}`;
    }

    const tanggalHtml = tanggal ? `<span class="content-modal-date"><i class="fa-regular fa-calendar"></i> ${tanggal}</span>` : '';
    const badgeHtml = badge ? `<span class="content-modal-badge">${badge}</span>` : '';
    const logoHtml = logo ? `<img src="${logo}" alt="${escapeHtml(judul)} Logo" class="content-modal-logo" style="max-height: 40px; width:auto; border-radius: 4px; object-fit: contain;">` : '';

    const html = `
    <div class="content-modal-overlay" id="contentModalOverlay" role="dialog" aria-modal="true" aria-labelledby="cModalTitle">
        <div class="content-modal-box">
            <div class="content-modal-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap: 15px;">
                    ${logoHtml}
                    <h3 id="cModalTitle" style="margin:0;">${escapeHtml(judul)}</h3>
                </div>
                <button class="content-modal-close" id="cModalClose" aria-label="Tutup" style="margin-left:10px;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="content-modal-body">
                ${badgeHtml || tanggalHtml ? `<div class="content-modal-meta">${badgeHtml}${tanggalHtml}</div>` : ''}
                <div class="content-modal-text">${isi}</div>
                ${carouselHtml}
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    document.body.style.overflow = 'hidden';

    // Close handlers
    document.getElementById('cModalClose').onclick = closeContentModal;
    document.getElementById('contentModalOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('contentModalOverlay')) closeContentModal();
    });
    document.addEventListener('keydown', handleModalKey);

    // Carousel logic
    if (hasPhotos && foto.length > 1) {
        let mcCurrent = 0;
        const track = document.getElementById('mcTrack');
        const counter = document.getElementById('mcCounter');
        const dots = document.querySelectorAll('#mcDots .modal-carousel-dot');

        function mcGoTo(idx) {
            mcCurrent = (idx + foto.length) % foto.length;
            track.style.transform = `translateX(-${mcCurrent * 100}%)`;
            if (counter) counter.textContent = `${mcCurrent + 1} / ${foto.length}`;
            dots.forEach((d, i) => d.classList.toggle('active', i === mcCurrent));
        }
        document.getElementById('mcPrev')?.addEventListener('click', () => mcGoTo(mcCurrent - 1));
        document.getElementById('mcNext')?.addEventListener('click', () => mcGoTo(mcCurrent + 1));
        dots.forEach(d => d.addEventListener('click', () => mcGoTo(parseInt(d.dataset.idx))));
    }
}

function closeContentModal() {
    document.getElementById('contentModalOverlay')?.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKey);
}

function handleModalKey(e) {
    if (e.key === 'Escape') closeContentModal();
}
