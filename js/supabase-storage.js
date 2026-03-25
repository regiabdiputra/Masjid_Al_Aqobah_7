/**
 * Supabase Storage Utilities
 * Masjid Al Aqobah 7
 * 
 * Replaces base64 image encoding with Supabase Storage uploads.
 * All images are compressed client-side before uploading.
 */

const SupaStorage = {

    /**
     * Compress an image file using canvas
     * @param {File} file - Image file
     * @param {number} maxWidth - Max width in pixels
     * @param {number} quality - Compression quality (0-1)
     * @returns {Promise<Blob>} - Compressed image as Blob
     */
    compressImage(file, maxWidth = 800, quality = 0.7) {
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

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Gagal mengkompresi gambar.'));
                            }
                        },
                        'image/webp',
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Gagal memuat gambar (file korup atau tidak didukung).'));
            };
            reader.onerror = error => reject(error);
        });
    },

    /**
     * Generate a unique file path for storage
     * @param {string} prefix - Path prefix (e.g., 'kegiatan')
     * @param {string} originalName - Original file name
     * @returns {string} - Unique path like "kegiatan/1711234567890_photo.webp"
     */
    generatePath(prefix, originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const safeName = originalName
            .replace(/\.[^.]+$/, '') // Remove extension
            .replace(/[^a-zA-Z0-9_-]/g, '_') // Sanitize
            .substring(0, 30);
        return `${prefix}/${timestamp}_${random}_${safeName}.webp`;
    },

    /**
     * Upload a single image file to Supabase Storage
     * @param {string} bucket - Bucket name (e.g., 'kegiatan-images')
     * @param {File} file - Image file to upload
     * @param {string} prefix - Path prefix within bucket
     * @returns {Promise<string>} - Public URL of uploaded image
     */
    async uploadImage(bucket, file, prefix = '') {
        // Compress first
        const blob = await this.compressImage(file);
        const path = this.generatePath(prefix, file.name);

        const { data, error } = await window._supabase.storage
            .from(bucket)
            .upload(path, blob, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`[SupaStorage] upload error:`, error);
            throw new Error(`Upload ke server gagal: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = window._supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    },

    /**
     * Upload a logo image (smaller compression)
     * @param {string} bucket - Bucket name
     * @param {File} file - Logo file
     * @param {string} prefix - Path prefix
     * @returns {Promise<string>} - Public URL
     */
    async uploadLogo(bucket, file, prefix = 'logos') {
        const blob = await this.compressImage(file, 400, 0.8);
        const path = this.generatePath(prefix, file.name);

        const { data, error } = await window._supabase.storage
            .from(bucket)
            .upload(path, blob, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`[SupaStorage] uploadLogo error:`, error);
            throw new Error(`Upload logo gagal: ${error.message}`);
        }

        const { data: urlData } = window._supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    },

    /**
     * Delete an image from Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} publicUrl - Full public URL of the file
     * @returns {Promise<void>}
     */
    async deleteImage(bucket, publicUrl) {
        if (!publicUrl || !publicUrl.includes('/storage/v1/object/public/')) return;

        try {
            // Extract path from public URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.webp
            const urlParts = publicUrl.split(`/storage/v1/object/public/${bucket}/`);
            if (urlParts.length < 2) return;

            const path = decodeURIComponent(urlParts[1]);
            
            const { error } = await window._supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                console.warn(`[SupaStorage] deleteImage warning:`, error);
                // Don't throw — deletion failure shouldn't block other operations
            }
        } catch (e) {
            console.warn(`[SupaStorage] deleteImage failed silently:`, e);
        }
    },

    /**
     * Delete multiple images from storage
     * @param {string} bucket - Bucket name 
     * @param {string[]} urls - Array of public URLs
     */
    async deleteImages(bucket, urls) {
        if (!urls || urls.length === 0) return;
        const promises = urls.map(url => this.deleteImage(bucket, url));
        await Promise.allSettled(promises);
    },

    /**
     * Process and upload multiple files (replaces processFiles)
     * @param {FileList} files - Files from input
     * @param {HTMLElement} previewContainer - Container for preview thumbs
     * @param {string} bucket - Storage bucket
     * @param {string} prefix - Path prefix
     * @param {number} maxFiles - Max number of files
     * @returns {Promise<string[]>} - Array of public URLs
     */
    async processAndUploadFiles(files, previewContainer, bucket, prefix, maxFiles = 3) {
        if (previewContainer) previewContainer.innerHTML = '';

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const urls = [];
        let queued = 0;

        for (const file of Array.from(files)) {
            if (queued >= maxFiles) break;

            if (!validTypes.includes(file.type)) {
                if (window.showToast) {
                    window.showToast(`Format file ${file.name} tidak didukung (harus JPG/PNG/WEBP).`, 'error');
                }
                continue;
            }

            queued++;

            try {
                // Show loading preview
                if (previewContainer) {
                    const loadingDiv = document.createElement('div');
                    loadingDiv.style.cssText = 'width:80px;height:60px;border-radius:4px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;background:#f0f0f0;font-size:11px;color:#888;';
                    loadingDiv.textContent = 'Uploading...';
                    loadingDiv.id = `upload-preview-${queued}`;
                    previewContainer.appendChild(loadingDiv);
                }

                const url = await this.uploadImage(bucket, file, prefix);
                urls.push(url);

                // Replace loading with actual preview
                if (previewContainer) {
                    const loadingDiv = document.getElementById(`upload-preview-${queued}`);
                    if (loadingDiv) {
                        loadingDiv.outerHTML = `<img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;">`;
                    }
                }
            } catch (error) {
                if (window.showToast) {
                    window.showToast(`Gagal mengupload file ${file.name}: ${error.message}`, 'error');
                }
                console.error(error);
                // Remove loading indicator
                if (previewContainer) {
                    const loadingDiv = document.getElementById(`upload-preview-${queued}`);
                    if (loadingDiv) loadingDiv.remove();
                }
            }
        }

        return urls;
    },

    /**
     * Upload a single logo file (replaces handleImageUpload for logos)
     * @param {HTMLInputElement} fileInput - File input element
     * @param {string} bucket - Storage bucket
     * @param {string} prefix - Path prefix
     * @param {function} callback - Callback with URL
     * @returns {Promise<string|null>} - Public URL or null
     */
    async handleLogoUpload(fileInput, bucket, prefix = 'logos', callback) {
        if (!fileInput.files || !fileInput.files[0]) return null;

        const file = fileInput.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            if (window.showToast) {
                window.showToast('Format file tidak didukung (harus JPG/PNG/WEBP).', 'error');
            }
            fileInput.value = '';
            return null;
        }

        try {
            const url = await this.uploadLogo(bucket, file, prefix);
            if (callback) callback(url);
            return url;
        } catch (error) {
            if (window.showToast) {
                window.showToast('Gagal mengupload logo.', 'error');
            }
            console.error(error);
            return null;
        }
    }
};

// Export globally
window.SupaStorage = SupaStorage;
