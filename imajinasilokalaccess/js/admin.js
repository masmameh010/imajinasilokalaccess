// Import fungsi logout dari auth.js (diasumsikan sudah di-set di window)
// Tidak perlu import Firebase lagi jika auth.js sudah di-load

// =================================================================================
// TODO: GANTI DENGAN PENGATURAN CLOUDINARY ANDA
// =================================================================================
const CLOUDINARY_CLOUD_NAME = "dlctestre";
const CLOUDINARY_UPLOAD_PRESET = "imajinasilokal";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// =================================================================================

// Elemen DOM
const imageUploadInput = document.getElementById('image-upload');
const uploadStatus = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');
const promptText = document.getElementById('prompt-text');
const addPromptBtn = document.getElementById('add-prompt-btn');
const currentPromptsList = document.getElementById('current-prompts-list');
const generateJsonBtn = document.getElementById('generate-json-btn');
const jsonOutputSection = document.getElementById('json-output-section');
const jsonFilename = document.getElementById('json-filename');
const promptsJsonOutput = document.getElementById('prompts-json-output');
const packsJsonOutput = document.getElementById('packs-json-output');
const packNameInput = document.getElementById('pack-name');
const packPasswordInput = document.getElementById('pack-password');


// State sementara
let currentPrompts = [];
let uploadedImageUrl = null;

// Fungsi untuk mereset form tambah prompt
const resetPromptForm = () => {
    imageUploadInput.value = '';
    promptText.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    uploadStatus.textContent = '';
    uploadedImageUrl = null;
    addPromptBtn.disabled = true;
};

// Fungsi untuk merender daftar prompt saat ini
const renderCurrentPrompts = () => {
    if (currentPrompts.length === 0) {
        currentPromptsList.innerHTML = '<p>Belum ada gambar yang ditambahkan ke pack ini.</p>';
        return;
    }
    currentPromptsList.innerHTML = '';
    currentPrompts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-4 bg-gray-100 p-2 rounded';
        div.innerHTML = `
            <img src="${item.imageUrl}" class="w-12 h-12 rounded object-cover">
            <p class="flex-grow truncate"><strong>${index + 1}:</strong> ${item.prompt}</p>
        `;
        currentPromptsList.appendChild(div);
    });
};

// Event listener untuk upload gambar
imageUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Mengupload gambar...';
    imagePreview.classList.add('hidden');
    addPromptBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload gagal');
        }

        const data = await response.json();
        uploadedImageUrl = data.secure_url;
        
        uploadStatus.textContent = 'Upload berhasil!';
        uploadStatus.style.color = 'green';
        imagePreview.src = uploadedImageUrl;
        imagePreview.classList.remove('hidden');
        addPromptBtn.disabled = false;

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        uploadStatus.textContent = 'Upload gagal. Coba lagi.';
        uploadStatus.style.color = 'red';
    }
});

// Event listener untuk tombol "Tambah ke Pack"
addPromptBtn.addEventListener('click', () => {
    const prompt = promptText.value.trim();
    if (!prompt || !uploadedImageUrl) {
        alert('Pastikan gambar sudah terupload dan prompt sudah diisi.');
        return;
    }

    currentPrompts.push({
        imageUrl: uploadedImageUrl,
        prompt: prompt
    });

    renderCurrentPrompts();
    resetPromptForm();
});

// Event listener untuk tombol "Hasilkan JSON"
generateJsonBtn.addEventListener('click', () => {
    const packName = packNameInput.value.trim();
    const packPassword = packPasswordInput.value.trim();

    if (!packName || !packPassword || currentPrompts.length === 0) {
        alert('Nama pack, password, dan minimal satu prompt harus diisi.');
        return;
    }

    // 1. Generate JSON untuk file prompts_[packname].json
    const promptsJsonString = JSON.stringify(currentPrompts, null, 2);
    jsonFilename.textContent = packName;
    promptsJsonOutput.textContent = promptsJsonString;

    // 2. Generate JSON untuk ditambahkan ke packs.json
    const newPackEntry = {
        name: packName,
        password: packPassword,
        dataFile: `/data/prompts_${packName}.json`
    };
    const packsJsonString = JSON.stringify(newPackEntry, null, 2);
    packsJsonOutput.textContent = packsJsonString;

    // Tampilkan output
    jsonOutputSection.classList.remove('hidden');
});


// Inisialisasi halaman
document.addEventListener('DOMContentLoaded', () => {
    resetPromptForm();
    renderCurrentPrompts();
});
