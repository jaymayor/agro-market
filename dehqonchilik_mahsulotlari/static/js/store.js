// Local Storage Store
const Store = {
    // Auth
    getAuth: () => {
        const auth = localStorage.getItem('auth');
        return auth ? JSON.parse(auth) : null;
    },
    
    setAuth: (user, accessToken, refreshToken) => {
        const auth = { user, accessToken, refreshToken, isAuthenticated: true };
        localStorage.setItem('auth', JSON.stringify(auth));
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    },
    
    clearAuth: () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },
    
    updateUser: (userData) => {
        const auth = Store.getAuth();
        if (auth) {
            auth.user = { ...auth.user, ...userData };
            localStorage.setItem('auth', JSON.stringify(auth));
        }
    },
    
    isAuthenticated: () => {
        const auth = Store.getAuth();
        return auth && auth.isAuthenticated;
    },
    
    getUser: () => {
        const auth = Store.getAuth();
        return auth ? auth.user : null;
    },
    
    getToken: () => {
        return localStorage.getItem('access_token');
    },
    
    // Cart
    getCart: () => {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },
    
    setCart: (items) => {
        localStorage.setItem('cart', JSON.stringify(items));
        Store.updateCartBadge();
    },
    
    addToCart: (product, quantity = 1) => {
        const cart = Store.getCart();
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ product, quantity });
        }
        
        Store.setCart(cart);
    },
    
    removeFromCart: (productId) => {
        const cart = Store.getCart().filter(item => item.product.id !== productId);
        Store.setCart(cart);
    },
    
    updateCartQuantity: (productId, quantity) => {
        const cart = Store.getCart();
        const item = cart.find(item => item.product.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                Store.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                Store.setCart(cart);
            }
        }
    },
    
    clearCart: () => {
        localStorage.removeItem('cart');
        Store.updateCartBadge();
    },
    
    getCartTotal: () => {
        return Store.getCart().reduce((total, item) => {
            const price = parseFloat(item.product.discount_price || item.product.price);
            return total + (price * item.quantity);
        }, 0);
    },
    
    getCartCount: () => {
        return Store.getCart().reduce((count, item) => count + item.quantity, 0);
    },
    
    updateCartBadge: () => {
        const badge = document.getElementById('cartCount');
        if (badge) {
            badge.textContent = Store.getCartCount();
            badge.style.display = Store.getCartCount() > 0 ? 'flex' : 'none';
        }
    },
    
    // Wishlist
    getWishlist: () => {
        const wishlist = localStorage.getItem('wishlist');
        return wishlist ? JSON.parse(wishlist) : [];
    },
    
    addToWishlist: (productId) => {
        const wishlist = Store.getWishlist();
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    },
    
    removeFromWishlist: (productId) => {
        const wishlist = Store.getWishlist().filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    },
    
    isInWishlist: (productId) => {
        return Store.getWishlist().includes(productId);
    },
    
    // Recent views
    addRecentView: (product) => {
        let recent = Store.getRecentViews();
        recent = recent.filter(p => p.id !== product.id);
        recent.unshift(product);
        recent = recent.slice(0, 10);
        localStorage.setItem('recentViews', JSON.stringify(recent));
    },
    
    getRecentViews: () => {
        const recent = localStorage.getItem('recentViews');
        return recent ? JSON.parse(recent) : [];
    }
};
