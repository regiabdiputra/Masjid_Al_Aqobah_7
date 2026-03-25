/**
 * Supabase Database CRUD Abstraction Layer
 * Masjid Al Aqobah 7
 * 
 * Replaces localStorage getDB/saveDB with async Supabase queries.
 */

const SupaDB = {

    /**
     * Fetch all rows from a table
     * @param {string} table - Table name
     * @param {object} options - Optional { orderBy, ascending, filters }
     * @returns {Promise<Array>}
     */
    async fetchAll(table, options = {}) {
        if (!window._supabase) throw new Error("Koneksi ke sistem database (Supabase) gagal. Pastikan Anda telah mengonfigurasi API Key di js/supabase.js atau mematikan AdBlock.");

        let query = window._supabase.from(table).select('*');

        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? false });
        }

        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                query = query.eq(key, value);
            }
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            // PGRST205 = table not found — return empty instead of crashing
            if (error.code === 'PGRST205' || error.code === '42P01') {
                console.warn(`[SupaDB] Table '${table}' belum ada. Jalankan SQL schema di Supabase Dashboard.`);
                return [];
            }
            console.error(`[SupaDB] fetchAll(${table}) error:`, error);
            throw new Error(`Gagal mengambil data dari ${table}: ${error.message}`);
        }

        return data || [];
    },

    /**
     * Fetch a single row by ID
     * @param {string} table - Table name
     * @param {string} id - UUID
     * @returns {Promise<object|null>}
     */
    async fetchById(table, id) {
        if (!window._supabase) return null;

        const { data, error } = await window._supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`[SupaDB] fetchById(${table}, ${id}) error:`, error);
            return null;
        }

        return data;
    },

    /**
     * Insert a new row
     * @param {string} table - Table name
     * @param {object} item - Data object (id will be auto-generated if not provided)
     * @returns {Promise<object>} - Inserted row
     */
    async insertItem(table, item) {
        // Remove id if empty to let Supabase auto-generate UUID
        const data = { ...item };
        if (!data.id) delete data.id;
        
        // Set timestamps
        data.created_at = data.created_at || new Date().toISOString();
        data.updated_at = new Date().toISOString();

        if (!window._supabase) throw new Error("Koneksi ke sistem database terputus. Pastikan konfigurasi API Key sudah benar.");

        const { data: result, error } = await window._supabase
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error(`[SupaDB] insertItem(${table}) error:`, error);
            throw new Error(`Data gagal disimpan: ${error.message}`);
        }

        return result;
    },

    /**
     * Update an existing row by ID
     * @param {string} table - Table name
     * @param {string} id - UUID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} - Updated row
     */
    async updateItem(table, id, updates) {
        if (!window._supabase) throw new Error("Koneksi database terputus.");

        const data = { ...updates };
        data.updated_at = new Date().toISOString();
        // Don't send id in updates
        delete data.id;

        const { data: result, error } = await window._supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[SupaDB] updateItem(${table}, ${id}) error:`, error);
            throw new Error(`Data gagal diperbarui: ${error.message}`);
        }

        return result;
    },

    /**
     * Delete a row by ID
     * @param {string} table - Table name
     * @param {string} id - UUID
     * @returns {Promise<void>}
     */
    async deleteItem(table, id) {
        const { error } = await window._supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[SupaDB] deleteItem(${table}, ${id}) error:`, error);
            throw new Error(`Data gagal dihapus: ${error.message}`);
        }
    },

    /**
     * Fetch site_config by key
     * @param {string} key - Config key (e.g., 'beranda_config', 'pengaturan_umum')
     * @returns {Promise<object>} - The config value (JSON)
     */
    async fetchConfig(key) {
        if (!window._supabase) return null;

        const { data, error } = await window._supabase
            .from('site_config')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            // PGRST205 = table not found, PGRST116 = row not found — both okay
            if (error.code === 'PGRST205' || error.code === '42P01' || error.code === 'PGRST116') {
                console.warn(`[SupaDB] Config '${key}' belum ada. Jalankan SQL schema di Supabase Dashboard.`);
                return null;
            }
            console.error(`[SupaDB] fetchConfig(${key}) error:`, error);
            return null;
        }

        return data ? data.value : null;
    },

    /**
     * Save/update site_config by key (upsert)
     * @param {string} key - Config key
     * @param {object} value - Config value (JSON)
     * @returns {Promise<void>}
     */
    async saveConfig(key, value) {
        const { error } = await window._supabase
            .from('site_config')
            .upsert({
                key: key,
                value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error(`[SupaDB] saveConfig(${key}) error:`, error);
            throw new Error(`Konfigurasi gagal disimpan: ${error.message}`);
        }
    }
};

// Export globally
window.SupaDB = SupaDB;
