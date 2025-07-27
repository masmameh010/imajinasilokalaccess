// Import fungsi-fungsi yang diperlukan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// =================================================================================
// TODO: GANTI DENGAN KONFIGURASI FIREBASE PROYEK ANDA
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA_Fr2xD7_gerzJ4HY18DMSD0qmU3YED4E",
  authDomain: "imajinasilokalaccess-ca67a.firebaseapp.com",
  projectId: "imajinasilokalaccess-ca67a",
  storageBucket: "imajinasilokalaccess-ca67a.firebasestorage.app",
  messagingSenderId: "623350994424",
  appId: "1:623350994424:web:5d00ca650b63c5fef0320d",
  measurementId: "G-GZ9E5CKFW1"
};
// =================================================================================

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elemen DOM
const loginForm = document.getElementById('login-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');

// --- PENDETEKSI STATUS LOGIN ---
// Fungsi ini akan berjalan setiap kali status otentikasi berubah (login/logout)
// dan juga saat halaman pertama kali dimuat.
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Pengguna sudah login, tentukan halaman tujuan
    console.log('User logged in:', user.email);
    if (user.email === 'admin@lokal.com') {
      // Jika admin, arahkan ke halaman admin
      if (!window.location.pathname.includes('admin.html')) {
        window.location.href = '/admin.html';
      }
    } else {
      // Jika bukan admin, arahkan ke halaman packs
      if (!window.location.pathname.includes('packs.html') && !window.location.pathname.includes('viewer.html')) {
        window.location.href = '/packs.html';
      }
    }
  } else {
    // Pengguna belum login.
    // Jika mereka mencoba mengakses halaman yang dilindungi, arahkan kembali ke login.
    const protectedPages = ['/admin.html', '/packs.html', '/viewer.html'];
    if (protectedPages.some(page => window.location.pathname.includes(page))) {
        console.log('User not logged in, redirecting to index.');
        window.location.href = '/index.html';
    }
  }
});


// --- EVENT LISTENERS UNTUK LOGIN ---

// Login dengan Email/Password
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        errorMessageDiv.textContent = ''; // Hapus pesan error lama

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login berhasil, onAuthStateChanged akan menangani redirect
                console.log('Signed in with email:', userCredential.user);
            })
            .catch((error) => {
                console.error("Error signing in with email:", error);
                errorMessageDiv.textContent = 'Email atau password salah. Silakan coba lagi.';
            });
    });
}

// Login dengan Google
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        errorMessageDiv.textContent = ''; // Hapus pesan error lama
        signInWithPopup(auth, provider)
            .then((result) => {
                // Login berhasil, onAuthStateChanged akan menangani redirect
                console.log('Signed in with Google:', result.user);
            })
            .catch((error) => {
                console.error("Error with Google sign-in:", error);
                errorMessageDiv.textContent = 'Gagal login dengan Google. Silakan coba lagi.';
            });
    });
}

// --- FUNGSI LOGOUT (untuk digunakan di halaman lain) ---
window.logout = () => {
    signOut(auth).then(() => {
        console.log('User signed out.');
        // onAuthStateChanged akan menangani redirect ke halaman login
    }).catch((error) => {
        console.error('Sign out error', error);
    });
};
