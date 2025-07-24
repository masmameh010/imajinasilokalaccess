// Import fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, getDoc, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- KONFIGURASI (WAJIB DIISI) ---
const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA",
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA",
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA",
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA",
    appId: "GANTI_DENGAN_APP_ID_ANDA"
};

const ADMIN_EMAIL = "email.admin@gmail.com"; // GANTI DENGAN EMAIL ADMIN ANDA

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- State Aplikasi ---
let allPacksData = {};
let siteSettings = {};
let currentUser = null;
let currentPackId = null;

// --- Selektor DOM ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');
const addPackBtn = document.getElementById('add-pack-btn');
const settingsBtn = document.getElementById('settings-btn');
const packsContainer = document.getElementById('packs-container');
const loadingPacks = document.getElementById('loading-packs');
const mainMenu = document.getElementById('main-menu');
const mainHeader = document.getElementById('main-header');
const contentGallery = document.getElementById('content-gallery');

// --- Fungsi Helper ---
const showModal = (modalId) => document.getElementById(modalId).classList.remove('hidden');
const hideModal = (modalId) => document.getElementById(modalId).classList.add('hidden');
const setLoading = (button, isLoading, originalText = 'Simpan') => {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<div class="loader"></div> Processing...`;
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
    }
};

const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// --- Logika UI & Auth ---
const updateUiForAuthState = (user) => {
    currentUser = user;
    const isAdmin = user && user.email === ADMIN_EMAIL;
    loginBtn.classList.toggle('hidden', !!user);
    logoutBtn.classList.toggle('hidden', !user);
    addPackBtn.classList.toggle('hidden', !isAdmin);
    settingsBtn.classList.toggle('hidden', !isAdmin);
    
    if (user) {
        userStatus.textContent = `Login sebagai ${user.displayName}${isAdmin ? ' (Admin)' : ''}`;
        userStatus.classList.remove('hidden');
    } else {
        userStatus.classList.add('hidden');
    }
    renderPacks();
};

onAuthStateChanged(auth, updateUiForAuthState);
loginBtn.addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()));
logoutBtn.addEventListener('click', () => signOut(auth));

// --- Logika Firestore & Rendering ---
onSnapshot(doc(db, "settings", "siteConfig"), (doc) => {
    siteSettings = doc.exists() ? doc.data() : {};
    const logoContainer = document.getElementById('header-logo-container');
    if (siteSettings.logoUrl) {
        logoContainer.innerHTML = `<img src="${siteSettings.logoUrl}" alt="Logo" class="h-10">`;
    } else {
        logoContainer.innerHTML = 'Imajinasi Lokal';
    }
});

onSnapshot(collection(db, "packs"), (snapshot) => {
    loadingPacks.classList.add('hidden');
    allPacksData = {};
    snapshot.docs.forEach(doc => { allPacksData[doc.id] = { id: doc.id, ...doc.data() }; });
    renderPacks();
});

const renderPacks = () => {
    packsContainer.innerHTML = '';
    if (Object.keys(allPacksData).length === 0 && !loadingPacks.classList.contains('hidden')) {
        return; // Jangan render jika masih loading
    }
    if (Object.keys(allPacksData).length === 0) {
        packsContainer.innerHTML = '<p class="text-center col-span-full text-gray-400">Belum ada paket. Login sebagai admin untuk menambahkannya.</p>';
        return;
    }

    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
    for (const packId in allPacksData) {
        const pack = allPacksData[packId];
        const card = document.createElement('div');
        card.className = 'pack-card bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 hover:shadow-purple-500/20';
        card.dataset.packId = pack.id;
        
        const adminButtonHTML = isAdmin ? `<button data-edit-id="${pack.id}" class="admin-edit-btn admin-badge bg-yellow-500 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center">&hellip;</button>` : '';

        card.innerHTML = `
            <img src="${pack.thumbnail || 'https://placehold.co/600x400/1f2937/ffffff?text=No+Image'}" alt="Thumbnail ${pack.title}" class="w-full h-48 object-cover rounded-lg mb-4">
            <h2 class="text-2xl font-bold">${pack.title}</h2>
            ${adminButtonHTML}
        `;
        packsContainer.appendChild(card);
    }
};

// --- Event Listeners Halaman & Modal Biasa ---
packsContainer.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.admin-edit-btn');
    if (editBtn) {
        e.stopPropagation();
        openAdminModal(editBtn.dataset.editId);
        return;
    }
    
    const card = e.target.closest('.pack-card');
    if (card) {
        currentPackId = card.dataset.packId;
        document.getElementById('password-input').value = '';
        document.getElementById('password-error').classList.add('hidden');
        showModal('password-modal');
        document.getElementById('password-input').focus();
    }
});

document.getElementById('password-submit').addEventListener('click', () => {
    const passwordInput = document.getElementById('password-input');
    const pack = allPacksData[currentPackId];
    if (pack && passwordInput.value === pack.password) {
        hideModal('password-modal');
        showGallery(currentPackId);
    } else {
        document.getElementById('password-error').classList.remove('hidden');
    }
});

const showGallery = (packId) => {
    const pack = allPacksData[packId];
    document.querySelector('#gallery-title span').textContent = pack.title;
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    (pack.images || []).forEach(image => {
        const div = document.createElement('div');
        div.className = 'bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        div.innerHTML = `<img src="${image.src}" alt="Gambar" class="w-full h-full object-cover" data-prompt="${image.prompt}">`;
        galleryGrid.appendChild(div);
    });
    mainHeader.classList.add('hidden');
    mainMenu.classList.add('hidden');
    contentGallery.classList.remove('hidden');
};

document.getElementById('gallery-grid').addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
        document.getElementById('prompt-text').textContent = e.target.dataset.prompt;
        showModal('prompt-modal');
    }
});

document.getElementById('back-to-menu').addEventListener('click', () => {
    contentGallery.classList.add('hidden');
    mainHeader.classList.remove('hidden');
    mainMenu.classList.remove('hidden');
});

document.getElementById('password-cancel').addEventListener('click', () => hideModal('password-modal'));
document.getElementById('prompt-close').addEventListener('click', () => hideModal('prompt-modal'));
document.getElementById('prompt-copy').addEventListener('click', (e) => {
    const promptText = document.getElementById('prompt-text').textContent;
    navigator.clipboard.writeText(promptText).then(() => {
        const button = e.currentTarget;
        button.textContent = 'Disalin!';
        setTimeout(() => { button.textContent = 'Salin Prompt'; }, 2000);
    });
});

// --- Logika Modal Pengaturan Situs ---
settingsBtn.addEventListener('click', () => {
    document.getElementById('settings-logo-url').value = siteSettings.logoUrl || '';
    const preview = document.getElementById('settings-logo-preview');
    preview.src = siteSettings.logoUrl || '';
    preview.classList.toggle('hidden', !siteSettings.logoUrl);
    document.getElementById('settings-logo-file').value = '';
    showModal('settings-modal');
});

document.getElementById('settings-cancel').addEventListener('click', () => hideModal('settings-modal'));
document.getElementById('settings-save').addEventListener('click', async (e) => {
    const button = e.currentTarget;
    setLoading(button, true);
    const file = document.getElementById('settings-logo-file').files[0];
    let newLogoUrl = document.getElementById('settings-logo-url').value;

    try {
        if (file) {
            newLogoUrl = await uploadFile(file, `images/settings/logo_${Date.now()}`);
        }
        await setDoc(doc(db, "settings", "siteConfig"), { logoUrl: newLogoUrl });
        hideModal('settings-modal');
    } catch (error) {
        console.error("Gagal menyimpan pengaturan:", error);
        alert("Gagal menyimpan pengaturan.");
    } finally {
        setLoading(button, false);
    }
});

// --- Logika Modal Admin (dengan Upload) ---
addPackBtn.addEventListener('click', () => openAdminModal(null));
document.getElementById('admin-cancel-pack').addEventListener('click', () => hideModal('admin-pack-modal'));

const openAdminModal = (packId) => {
    currentPackId = packId;
    const modalTitle = document.getElementById('admin-modal-title');
    const packIdInput = document.getElementById('admin-pack-id');
    const titleInput = document.getElementById('admin-pack-title');
    const passwordInput = document.getElementById('admin-pack-password');
    const thumbUrlInput = document.getElementById('admin-pack-thumbnail-url');
    const thumbPreview = document.getElementById('admin-pack-thumbnail-preview');
    const thumbFileInput = document.getElementById('admin-pack-thumbnail-file');
    const deleteBtn = document.getElementById('admin-delete-pack');

    if (packId) { // Mode Edit
        const pack = allPacksData[packId];
        modalTitle.textContent = 'Edit Paket';
        packIdInput.value = pack.id;
        titleInput.value = pack.title;
        passwordInput.value = pack.password;
        thumbUrlInput.value = pack.thumbnail || '';
        thumbPreview.src = pack.thumbnail || '';
        thumbPreview.classList.toggle('hidden', !pack.thumbnail);
        deleteBtn.classList.remove('hidden');
        renderAdminImages(pack.images || []);
    } else { // Mode Tambah
        modalTitle.textContent = 'Tambah Paket Baru';
        packIdInput.value = '';
        titleInput.value = '';
        passwordInput.value = '';
        thumbUrlInput.value = '';
        thumbPreview.src = '';
        thumbPreview.classList.add('hidden');
        deleteBtn.classList.add('hidden');
        renderAdminImages([]);
    }
    thumbFileInput.value = '';
    showModal('admin-pack-modal');
};

const renderAdminImages = (images = []) => {
    const container = document.getElementById('admin-images-container');
    container.innerHTML = '';
    if (images.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Belum ada gambar di paket ini.</p>';
    }
    images.forEach((image, index) => {
        const div = document.createElement('div');
        div.className = 'bg-gray-700 p-4 rounded-lg';
        div.dataset.index = index;
        div.innerHTML = `
            <div class="flex items-start gap-4">
                <img src="${image.src || 'https://placehold.co/100x100/1f2937/ffffff?text=No+Img'}" class="admin-image-preview w-24 h-24 object-cover rounded-md">
                <div class="flex-grow space-y-2">
                    <input type="file" class="admin-image-file block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700">
                    <textarea class="admin-image-prompt bg-gray-600 w-full p-2 rounded-md" rows="2" placeholder="Prompt">${image.prompt || ''}</textarea>
                    <input type="hidden" class="admin-image-url" value="${image.src || ''}">
                </div>
                <button class="admin-remove-image bg-red-500 text-white rounded-full p-2 w-8 h-8 flex-shrink-0">&times;</button>
            </div>
        `;
        container.appendChild(div);
    });
};

document.getElementById('admin-images-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-remove-image')) {
        e.target.closest('.bg-gray-700').remove();
    }
});

document.getElementById('admin-add-image').addEventListener('click', () => {
    const container = document.getElementById('admin-images-container');
    if (container.querySelector('p')) { container.innerHTML = ''; }
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'bg-gray-700 p-4 rounded-lg';
    div.dataset.index = index;
    div.innerHTML = `
        <div class="flex items-start gap-4">
            <img src="https://placehold.co/100x100/1f2937/ffffff?text=New" class="admin-image-preview w-24 h-24 object-cover rounded-md">
            <div class="flex-grow space-y-2">
                <input type="file" class="admin-image-file block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700">
                <textarea class="admin-image-prompt bg-gray-600 w-full p-2 rounded-md" rows="2" placeholder="Prompt"></textarea>
                <input type="hidden" class="admin-image-url" value="">
            </div>
            <button class="admin-remove-image bg-red-500 text-white rounded-full p-2 w-8 h-8 flex-shrink-0">&times;</button>
        </div>
    `;
    container.appendChild(div);
});

document.getElementById('admin-save-pack').addEventListener('click', async (e) => {
    const button = e.currentTarget;
    setLoading(button, true);

    const packId = document.getElementById('admin-pack-id').value;
    let thumbnailUrl = document.getElementById('admin-pack-thumbnail-url').value;
    const thumbnailFile = document.getElementById('admin-pack-thumbnail-file').files[0];

    try {
        if (thumbnailFile) {
            thumbnailUrl = await uploadFile(thumbnailFile, `images/thumbnails/${packId || Date.now()}`);
        }

        const imageUploadPromises = [];
        document.querySelectorAll('#admin-images-container > div').forEach(div => {
            const fileInput = div.querySelector('.admin-image-file');
            const urlInput = div.querySelector('.admin-image-url');
            const promptInput = div.querySelector('.admin-image-prompt');
            
            if (fileInput.files[0]) {
                const uploadPromise = uploadFile(fileInput.files[0], `images/content/${packId || 'new'}_${Date.now()}`)
                    .then(newUrl => ({ src: newUrl, prompt: promptInput.value }));
                imageUploadPromises.push(uploadPromise);
            } else if (urlInput.value) {
                imageUploadPromises.push(Promise.resolve({ src: urlInput.value, prompt: promptInput.value }));
            }
        });

        const images = await Promise.all(imageUploadPromises);

        const packData = {
            title: document.getElementById('admin-pack-title').value,
            password: document.getElementById('admin-pack-password').value,
            thumbnail: thumbnailUrl,
            images: images
        };

        const docRef = packId ? doc(db, "packs", packId) : doc(collection(db, "packs"));
        await setDoc(docRef, packData);
        hideModal('admin-pack-modal');
    } catch (error) {
        console.error("Gagal menyimpan paket:", error);
        alert("Gagal menyimpan data.");
    } finally {
        setLoading(button, false);
    }
});

document.getElementById('admin-delete-pack').addEventListener('click', async () => {
    const packId = document.getElementById('admin-pack-id').value;
    if (packId && confirm('Apakah Anda yakin ingin menghapus paket ini secara permanen?')) {
        try {
            await deleteDoc(doc(db, "packs", packId));
            hideModal('admin-pack-modal');
        } catch (error) {
            console.error("Gagal menghapus paket:", error);
            alert("Gagal menghapus data.");
        }
    }
});
