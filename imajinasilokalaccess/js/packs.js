document.addEventListener('DOMContentLoaded', async () => {
    const packsContainer = document.getElementById('packs-container');
    const loadingMessage = document.getElementById('loading-packs');
    
    // Elemen Modal
    const modal = document.getElementById('password-modal');
    const modalTitle = document.getElementById('modal-title');
    const passwordInput = document.getElementById('password-input');
    const passwordError = document.getElementById('password-error');
    const submitPasswordBtn = document.getElementById('submit-password-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let packsData = [];
    let selectedPack = null;

    // Fungsi untuk menampilkan modal
    const showModal = (pack) => {
        selectedPack = pack;
        modalTitle.textContent = `Password untuk ${pack.name.replace(/_/g, ' ').toUpperCase()}`;
        passwordInput.value = '';
        passwordError.textContent = '';
        modal.classList.remove('hidden');
        passwordInput.focus();
    };

    // Fungsi untuk menyembunyikan modal
    const hideModal = () => {
        modal.classList.add('hidden');
        selectedPack = null;
    };

    // Event listener untuk tombol di modal
    closeModalBtn.addEventListener('click', hideModal);
    submitPasswordBtn.addEventListener('click', () => {
        const enteredPassword = passwordInput.value;
        if (enteredPassword === selectedPack.password) {
            // Password benar, arahkan ke viewer
            window.location.href = `/viewer.html?pack=${selectedPack.name}`;
        } else {
            // Password salah
            passwordError.textContent = 'Password salah. Coba lagi.';
        }
    });
    
    // Ambil dan tampilkan data pack
    try {
        const response = await fetch('/data/packs.json');
        if (!response.ok) {
            throw new Error('Gagal memuat packs.json. Pastikan file ada di folder /data/.');
        }
        packsData = await response.json();
        loadingMessage.style.display = 'none';

        if (packsData.length === 0) {
            packsContainer.innerHTML = '<p class="text-gray-500">Belum ada pack yang tersedia.</p>';
            return;
        }

        packsData.forEach(pack => {
            const packElement = document.createElement('div');
            packElement.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300';
            packElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 class="font-bold text-gray-800">${pack.name.replace(/_/g, ' ').toUpperCase()}</h3>
            `;
            packElement.addEventListener('click', () => showModal(pack));
            packsContainer.appendChild(packElement);
        });

    } catch (error) {
        console.error(error);
        loadingMessage.textContent = error.message;
        loadingMessage.style.color = 'red';
    }
});
