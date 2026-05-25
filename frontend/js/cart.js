// Cart Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

// Render cart
function renderCart() {
    const cartItems = Store.getCart();
    const container = document.getElementById('cartLayout');
    
    if (!container) return;
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Savat bo'sh</h2>
                <p>Hali hech narsa tanlamadingiz. Mahsulotlarni ko'rib chiqing!</p>
                <a href="products.html" class="btn btn-primary">Mahsulotlarni ko'rish</a>
            </div>
        `;
        return;
    }
    
    const subtotal = Store.getCartTotal();
    const deliveryFee = subtotal > 100000 ? 0 : 15000;
    const total = subtotal + deliveryFee;
    
    container.innerHTML = `
        <div class="cart-items">
            ${cartItems.map(item => `
                <div class="cart-item" data-id="${item.product.id}">
                    <div class="cart-item-image">
                        <img src="${item.product.images && item.product.images[0] ? item.product.images[0].image : 'https://via.placeholder.com/100?text=Mahsulot'}" 
                             alt="${item.product.name_uz}"
                             onerror="this.src='https://via.placeholder.com/100?text=Mahsulot'">
                    </div>
                    <div class="cart-item-details">
                        <a href="product.html?slug=${item.product.slug}" class="cart-item-title">${item.product.name_uz}</a>
                        <div class="cart-item-shop">
                            <i class="fas fa-store"></i> ${item.product.shop?.name || 'Noma\'lum'}
                        </div>
                        <div class="cart-item-unit">1 ${item.product.unit || 'kg'}</div>
                        <div class="cart-item-price">${formatPrice(item.product.discount_price || item.product.price)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn-remove" onclick="removeFromCart('${item.product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <div class="quantity-control">
                            <button onclick="updateCartQuantity('${item.product.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="text" value="${item.quantity}" readonly>
                            <button onclick="updateCartQuantity('${item.product.id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="cart-summary">
            <h3>Buyurtma xulosa</h3>
            
            <div class="summary-row">
                <span>Mahsulotlar (${cartItems.length}):</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            
            <div class="summary-row">
                <span>Yetkazib berish:</span>
                <span>${deliveryFee === 0 ? 'Bepul' : formatPrice(deliveryFee)}</span>
            </div>
            
            ${deliveryFee > 0 ? `
                <div class="delivery-info">
                    <h4><i class="fas fa-truck"></i> Bepul yetkazib berish</h4>
                    <p>Yana ${formatPrice(100000 - subtotal)} xarid qilsangiz, yetkazib berish bepul!</p>
                </div>
            ` : ''}
            
            <div class="summary-row total">
                <span>Jami:</span>
                <span>${formatPrice(total)}</span>
            </div>
            
            <button class="btn btn-primary btn-checkout" onclick="goToCheckout()">
                Buyurtma berish
            </button>
            
            <a href="products.html" class="btn btn-outline btn-continue">
                Xaridni davom ettirish
            </a>
            
            <div class="promo-code">
                <input type="text" placeholder="Promokod" id="promoInput">
                <button onclick="applyPromo()">Qo'llash</button>
            </div>
        </div>
    `;
}

// Update quantity
function updateCartQuantity(productId, quantity) {
    Store.updateCartQuantity(productId, quantity);
    renderCart();
    Store.updateCartBadge();
}

// Remove from cart
function removeFromCart(productId) {
    if (confirm('Bu mahsulotni savatdan olib tashlamoqchimisiz?')) {
        Store.removeFromCart(productId);
        renderCart();
        Store.updateCartBadge();
        showToast('Savatdan olib tashlandi', 'success');
    }
}

// Apply promo code
function applyPromo() {
    const code = document.getElementById('promoInput').value.trim();
    if (!code) {
        showToast('Promokod kiriting', 'error');
        return;
    }
    
    // Demo promo codes
    const promoCodes = {
        'AGRO10': 0.1,
        'WELCOME': 0.15,
        'SUMMER': 0.2,
    };
    
    if (promoCodes[code]) {
        const discount = Store.getCartTotal() * promoCodes[code];
        showToast(`Promokod qo'llandi! Chegirma: ${formatPrice(discount)}`, 'success');
        // Store discount in session
        sessionStorage.setItem('promoDiscount', discount);
        renderCart();
    } else {
        showToast('Noto\'g\'ri promokod', 'error');
    }
}

// Go to checkout
function goToCheckout() {
    if (!Store.isAuthenticated()) {
        showToast('Buyurtma berish uchun tizimga kiring', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 1500);
        return;
    }
    
    window.location.href = 'checkout.html';
}
