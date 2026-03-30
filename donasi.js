/**
 * DONASI.JS
 * Menangani logika program donasi, checkout, dan penyimpanan transaksi.
 */

// Inisialisasi dengan full debug — error tampil langsung di halaman
(function initDonasi() {
    function run() {
        const grid = document.getElementById("donasiGrid");
        
        // Debug Step 1: Grid ditemukan?
        if (!grid) {
            console.error('[DONASI] Grid #donasiGrid TIDAK ditemukan!');
            return;
        }
        
        // Debug Step 2: Tampilkan loading
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#C8A951;font-weight:600;font-size:1.1rem;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat program donasi...</div>';
        
        // Debug Step 3: Cek apakah SupaDB tersedia
        if (typeof SupaDB === 'undefined') {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#ff4444;font-weight:700;font-size:1.1rem;background:rgba(255,0,0,0.1);border-radius:12px;border:2px solid #ff4444;">❌ ERROR: SupaDB tidak tersedia.<br><small style="font-weight:400;">File supabase-db.js mungkin gagal dimuat.</small></div>';
            return;
        }
        
        // Debug Step 4: Cek apakah Supabase client tersedia
        if (!window._supabase) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#ff4444;font-weight:700;font-size:1.1rem;background:rgba(255,0,0,0.1);border-radius:12px;border:2px solid #ff4444;">❌ ERROR: Supabase client belum terhubung.<br><small style="font-weight:400;">Cek API Key di js/supabase.js</small></div>';
            return;
        }
        
        // Debug Step 5: Jalankan render
        renderDonasiPrograms().catch(err => {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#ff4444;font-weight:700;font-size:1.1rem;background:rgba(255,0,0,0.1);border-radius:12px;border:2px solid #ff4444;">❌ CRASH: ' + err.message + '<br><small style="font-weight:400;">' + err.stack + '</small></div>';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", run);
    } else {
        run();
    }
})();

// Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// Merender Daftar Program Donasi
async function renderDonasiPrograms() {
    const grid = document.getElementById("donasiGrid");
    if (!grid) return;

    let programs = [];
    try {
        programs = await SupaDB.fetchAll('donasi_programs');
        console.log('[Donasi] Raw data dari Supabase:', programs);
        
        // Filter: hanya tampilkan yang aktif
        // Support kedua format: kolom 'aktif' (boolean) atau 'status' (text)
        programs = programs.filter(p => {
            if (p.aktif === false) return false;      // kolom aktif = false → sembunyikan
            if (p.status === 'inactive') return false; // kolom status = 'inactive' → sembunyikan
            return true;                               // default tampilkan
        });
        
        console.log('[Donasi] Setelah filter aktif:', programs.length, 'program');
    } catch(err) {
        console.error("[Donasi] Gagal memuat program donasi:", err);
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-body, #333);">
                <i class="fa-solid fa-triangle-exclamation fa-3x" style="color:var(--gold, #e67e22); margin-bottom:16px; display:block;"></i>
                <p style="margin:0; font-size:1.1rem; font-weight:600;">Gagal memuat program donasi</p>
                <p style="margin-top:8px; font-size:0.9rem; color:var(--text-muted, #888);">${err.message}</p>
                <button onclick="renderDonasiPrograms()" style="margin-top:1rem; padding:0.5rem 1.5rem; border:2px solid var(--gold); background:var(--gold); color:#fff; border-radius:8px; cursor:pointer; font-weight:600;">
                    <i class="fa-solid fa-rotate-right"></i> Coba Lagi
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';

    if (programs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px 20px; color:var(--text-body, #333); background:rgba(255,255,255,0.05); border-radius:12px; border:1px dashed var(--gold, #C8A951);">
                <i class="fa-solid fa-box-open fa-3x" style="color:var(--gold, #C8A951); margin-bottom:16px; display:block;"></i>
                <p style="margin:0; font-size:1.2rem; font-weight:700; color:var(--gold, #C8A951);">Belum Ada Program Donasi</p>
                <p style="margin-top:10px; font-size:0.95rem; color:var(--text-muted, #aaa);">Program donasi belum tersedia saat ini.<br>Silakan cek kembali nanti.</p>
            </div>
        `;
        return;
    }

    programs.forEach(prog => {
        // Hitung persentase
        let percentage = (prog.collected / prog.target) * 100;
        if (percentage > 100) percentage = 100;
        if (isNaN(percentage) || !isFinite(percentage)) percentage = 0;

        const card = document.createElement("div");
        card.className = "donasi-card reveal";
        card.innerHTML = `
            <div class="donasi-poster">
                <img src="${prog.poster || 'assets/donasi-default.jpg'}" alt="${prog.title}" onerror="this.src='assets/donasi1.jpg'">
            </div>
            <div class="donasi-card-body">
                <div class="donasi-header">
                    <div class="donasi-icon"><i class="${prog.icon || 'fa-solid fa-heart'}"></i></div>
                    <h3 class="donasi-title">${prog.title}</h3>
                </div>
                <p class="donasi-desc">${prog.deskripsi || prog.description || ''}</p>
                
                <div class="donasi-progress-wrapper">
                    <div class="progress-info">
                        <span>Terkumpul: ${formatRupiah(prog.collected)}</span>
                        <span style="color:var(--text-muted); font-weight:500;">Target: ${formatRupiah(prog.target)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-percentage">${Math.round(percentage)}% Terpenuhi</span>
                </div>

                <button class="btn-donasi-card" onclick="openDonasiModal('${prog.id}', '${prog.title}')">
                    Donasi Sekarang <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        `;
        
        grid.appendChild(card);

        // Animasikan progress bar setelah render
        setTimeout(() => {
            const fill = card.querySelector('.progress-fill');
            if(fill) fill.style.width = percentage + "%";
        }, 100);
    });
}

// ==========================================
// LOGIKA MODAL POPUP & ALUR DONASI
// ==========================================
let currentDonasi = {
    programId: '',
    programTitle: '',
    nominalAsli: 0,
    kodeUnik: 0,
    totalTagihan: 0
};

// 1. Membuka Modal
function openDonasiModal(id, title) {
    currentDonasi.programId = id;
    currentDonasi.programTitle = title;
    
    document.getElementById("selectedProgramName").innerText = title;
    document.getElementById("programId").value = id;
    
    // Reset Form
    document.getElementById("donasiForm").reset();
    resetPresets();
    
    // Tampilkan Step 1
    goToStep(1);
    
    // Tampilkan Modal
    document.getElementById("donasiModal").classList.add("active");
    document.body.style.overflow = "hidden"; // Cegah scroll background
}

// Menutup Modal
function closeDonasiModal() {
    document.getElementById('donasiModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    // Reset semua form agar tidak ada data tersisa saat donasi berikutnya
    const donasiForm = document.getElementById('donasiForm');
    const uploadBuktiForm = document.getElementById('uploadBuktiForm');
    const imagePreview = document.getElementById('imagePreview');
    const filenameDisplay = document.getElementById('filenameDisplay');
    if (donasiForm) donasiForm.reset();
    if (uploadBuktiForm) uploadBuktiForm.reset();
    if (imagePreview) { imagePreview.src = ''; imagePreview.style.display = 'none'; }
    if (filenameDisplay) filenameDisplay.textContent = 'Klik untuk memilih foto (.jpg, .png)';
    resetPresets();
}

// Kembali ke Step 1 dari Step 2
function goBackToStep1() {
    goToStep(1);
}

// Preset Button Nominal
function setNominal(amount) {
    document.getElementById("nominalDonasi").value = amount;
    resetPresets();
    // Beri gaya aktif ke tombol yang diklik (mencari berdasarkan teks)
    const btns = document.querySelectorAll(".preset-btn");
    btns.forEach(btn => {
        let val = btn.innerText.replace(/\D/g, '') * 1000;
        if(val == amount) btn.classList.add("active");
    });
}

function resetPresets() {
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
}

// Navigasi Antar Step
function goToStep(step) {
    document.getElementById("step1").style.display = step === 1 ? "block" : "none";
    document.getElementById("step2").style.display = step === 2 ? "block" : "none";
    document.getElementById("step3").style.display = step === 3 ? "block" : "none";
    
    const titles = ["", "Form Donasi", "Pembayaran & Upload Bukti", "Status Donasi"];
    document.getElementById("modalTitle").innerText = titles[step];
}

// 2. Submit Form Data Donatur -> Lanjut ke Pembayaran
function handleDonasiSubmit(e) {
    e.preventDefault();
    
    const nominal = parseInt(document.getElementById("nominalDonasi").value);
    
    if (nominal < 10000) {
        alert("Mohon maaf, minimal donasi adalah Rp 10.000");
        return;
    }

    // Generate kode unik (1 - 999)
    const kodeUnik = Math.floor(Math.random() * 999) + 1;
    const totalTagihan = nominal + kodeUnik;

    currentDonasi.nominalAsli = nominal;
    currentDonasi.kodeUnik = kodeUnik;
    currentDonasi.totalTagihan = totalTagihan;

    // Update UI Step 2
    document.getElementById("tagihanNominal").innerText = formatRupiah(totalTagihan);
    
    goToStep(2);
}

// Handle Preview Image Bukti Transfer
function previewImage(input) {
    const preview = document.getElementById("imagePreview");
    const filenameDisplay = document.getElementById("filenameDisplay");
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = "block";
            filenameDisplay.innerText = input.files[0].name;
        }
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = "none";
        filenameDisplay.innerText = "Klik untuk memilih foto (.jpg, .png)";
    }
}

// 3. Submit Bukti Transfer -> Simpan ke Supabase DB & Storage
async function handleUploadSubmit(e) {
    e.preventDefault();
    
    const nama = document.getElementById("namaDonatur").value;
    const email = document.getElementById("emailDonatur").value;
    const fileInput = document.getElementById("inputBukti");
    
    if (!fileInput.files || !fileInput.files[0]) {
        alert("Silakan pilih file bukti transfer terlebih dahulu!");
        return;
    }

    try {
        const btn = document.querySelector('#uploadBuktiForm button[type="submit"]');
        if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...'; }

        // MENGGAMBARKAN SUPABASE STORAGE UNTUK BUKTI
        const buktiUrl = await SupaStorage.uploadImage('bukti-donasi', fileInput.files[0], 'bukti');

        // SIMPAN KE SUPABASE DB
        await SupaDB.insertItem('donasi_transactions', {
            nama: nama,
            email: email,
            program_id: currentDonasi.programId,
            nominal: currentDonasi.totalTagihan,
            bukti: buktiUrl,
            status: 'menunggu_verifikasi'
        });

        if(btn) { btn.disabled = false; btn.innerHTML = 'Kirim Bukti Donasi <i class="fa-solid fa-paper-plane"></i>'; }
        
        // Tampilkan Step 3 (Sukses)
        goToStep(3);
        
    } catch(err) {
        alert("Gagal mengirim bukti donasi: " + err.message);
        const btn = document.querySelector('#uploadBuktiForm button[type="submit"]');
        if(btn) { btn.disabled = false; btn.innerHTML = 'Kirim Bukti Donasi <i class="fa-solid fa-paper-plane"></i>'; }
    }
}
