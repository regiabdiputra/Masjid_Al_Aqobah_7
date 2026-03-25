/**
 * Supabase Client Configuration
 * Masjid Al Aqobah 7
 * 
 * PENTING: Ganti SUPABASE_URL dan SUPABASE_ANON_KEY
 * dengan kredensial dari project Supabase Anda.
 * Dapatkan di: Supabase Dashboard > Settings > API
 */

const SUPABASE_URL = 'https://mishtcdcqtitriphasbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pc2h0Y2RjcXRpdHJpcGhhc2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDE1MDMsImV4cCI6MjA4OTkxNzUwM30.DXjef6EGEodVtFpI48zIbPYU_koInnXo-PuIPKKnF4s';

// Pastikan library Supabase dari CDN termuat
if (typeof window.supabase === 'undefined') {
    console.error('[Supabase] Gagal memuat SDK dari CDN. Periksa koneksi internet Anda atau blokir iklan.');
    window._supabase = null; // Tandai gagal
} else {
    try {
        // Initialize Supabase Client
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Export for use in other scripts
        window._supabase = supabase;
    } catch (err) {
        console.error('[Supabase] Gagal inisialisasi client:', err.message);
        window._supabase = null;
    }
}
