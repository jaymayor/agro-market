// Main JavaScript - Shared utilities

// Format price
function formatPrice(price, currency = 'UZS') {
    const num = parseFloat(price);
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    }).format(num);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

// Truncate text
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Get category icon
function getCategoryIcon(name) {
    const icons = {
        'meva': 'fa-apple-alt',
        'sabzavot': 'fa-carrot',
        'don': 'fa-seedling',
        'sut': 'fa-cheese',
        'go\'sht': 'fa-drumstick-bite',
        'baliq': 'fa-fish',
        'asal': 'fa-bee',
        'yog': 'fa-oil-can',
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
        if (lowerName.includes(key)) return icon;
    }
    return 'fa-leaf';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : '#1E3A5F'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Handle search
function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        window.location.href = `/products/?search=${encodeURIComponent(query)}`;
    }
}

// Update auth section in header
function updateAuthSection() {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;
    
    const user = Store.getUser();
    
    if (Store.isAuthenticated() && user) {
        authSection.innerHTML = `
            <div class="user-menu">
                <button class="user-btn" onclick="toggleUserMenu()">
                    <i class="fas fa-user-circle"></i>
                    <span>${truncateText(user.username || user.phone, 15)}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="/profile/"><i class="fas fa-user"></i> Profil</a>
                    <a href="/orders/"><i class="fas fa-shopping-bag"></i> Buyurtmalarim</a>
                    ${user.role === 'seller' ? '<a href="/seller/"><i class="fas fa-store"></i> Do\'konim</a>' : ''}
                    <hr>
                    <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Chiqish</button>
                </div>
            </div>
        `;
    } else {
        authSection.innerHTML = `<a href="/login/" class="btn btn-primary">Kirish</a>`;
    }
}

// Toggle user menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Logout
async function logout() {
    try {
        await API.auth.logout();
    } catch (e) {
        console.error('Logout error:', e);
    }
    Store.clearAuth();
    window.location.href = '/';
}

// Click outside to close dropdowns
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthSection();
    Store.updateCartBadge();
});

// Add user menu styles
const userMenuStyle = document.createElement('style');
userMenuStyle.textContent = `
    .user-menu {
        position: relative;
    }
    .user-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--bg-light);
        border: 1px solid var(--border);
        border-radius: 24px;
        cursor: pointer;
        font-size: 14px;
        color: var(--text);
    }
    .user-btn i:first-child {
        font-size: 20px;
        color: var(--primary);
    }
    .user-btn i:last-child {
        font-size: 12px;
        color: var(--text-light);
    }
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        min-width: 200px;
        display: none;
        z-index: 100;
    }
    .user-dropdown.active {
        display: block;
    }
    .user-dropdown a,
    .user-dropdown button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: var(--text);
        text-decoration: none;
        font-size: 14px;
        width: 100%;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
    }
    .user-dropdown a:hover,
    .user-dropdown button:hover {
        background: var(--bg-light);
    }
    .user-dropdown hr {
        margin: 8px 0;
        border: none;
        border-top: 1px solid var(--border);
    }
    .user-dropdown button {
        color: var(--danger);
    }
`;
document.head.appendChild(userMenuStyle);
