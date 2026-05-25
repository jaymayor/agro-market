// Auth JavaScript

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.classList.remove('fa-eye');
        btn.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        btn.classList.remove('fa-eye-slash');
        btn.classList.add('fa-eye');
    }
}

// Login form handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Check if already logged in
    if (Store.isAuthenticated() && window.location.pathname.includes('login')) {
        window.location.href = 'index.html';
    }
});

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const spinner = submitBtn.querySelector('.fa-spinner');
    const btnText = submitBtn.querySelector('span');
    
    // Validate phone
    if (!phone.match(/^\+998[0-9]{9}$/)) {
        showToast('Telefon raqam formati noto\'g\'ri. +998XXXXXXXXX', 'error');
        return;
    }
    
    // Show loading
    submitBtn.disabled = true;
    btnText.textContent = 'Kirish...';
    spinner.style.display = 'inline-block';
    
    try {
        const data = await API.auth.login(phone, password);
        
        if (data && data.access) {
            showToast('Tizimga muvaffaqiyatli kirdingiz!', 'success');
            
            // Redirect based on role
            const user = data.user;
            if (user.role === 'seller') {
                window.location.href = 'seller.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login yoki parol xato', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Kirish';
        spinner.style.display = 'none';
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const phone = document.getElementById('phone').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.querySelector('.role-card.selected')?.dataset.role || 'buyer';
    
    // Validation
    if (!phone.match(/^\+998[0-9]{9}$/)) {
        showToast('Telefon raqam formati noto\'g\'ri', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Parollar mos kelmadi', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ro\'yxatdan o\'tish...';
        
        const data = await API.auth.register({
            phone,
            username: username || phone,
            password,
            role
        });
        
        if (data) {
            showToast('Ro\'yxatdan o\'tish muvaffaqiyatli! Endi kiring.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast(error.message || 'Ro\'yxatdan o\'tishda xatolik', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ro\'yxatdan o\'tish';
    }
}

// Select role
function selectRole(role, element) {
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    element.dataset.role = role;
}

// Login with Telegram
function loginWithTelegram() {
    showToast('Tez orada mavjud bo\'ladi', 'info');
}

// Send OTP
async function sendOTP() {
    const phone = document.getElementById('phone').value.trim();
    
    if (!phone.match(/^\+998[0-9]{9}$/)) {
        showToast('Telefon raqam formati noto\'g\'ri', 'error');
        return;
    }
    
    try {
        await API.auth.sendOTP(phone);
        showToast('Tasdiqlash kodi yuborildi!', 'success');
    } catch (error) {
        showToast(error.message || 'Kod yuborishda xatolik', 'error');
    }
}

// Verify OTP
async function verifyOTP() {
    const phone = document.getElementById('phone').value.trim();
    const code = Array.from(document.querySelectorAll('.otp-input'))
        .map(input => input.value)
        .join('');
    
    if (code.length !== 6) {
        showToast('6 xonali kodni kiriting', 'error');
        return;
    }
    
    try {
        await API.auth.verifyOTP(phone, code);
        showToast('Telefon raqam tasdiqlandi!', 'success');
    } catch (error) {
        showToast(error.message || 'Kod noto\'g\'ri', 'error');
    }
}

// Auto-focus OTP inputs
function setupOtpInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// Forgot password
async function forgotPassword() {
    const phone = document.getElementById('phone').value.trim();
    
    if (!phone) {
        showToast('Telefon raqamingizni kiriting', 'error');
        return;
    }
    
    try {
        await API.auth.sendOTP(phone);
        showToast('Parol tiklash kodi yuborildi', 'success');
        // Show reset form
    } catch (error) {
        showToast(error.message || 'Xatolik yuz berdi', 'error');
    }
}
