// Home Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadFeaturedProducts();
    await loadPopularShops();
});

// Load categories
async function loadCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    // Demo categories (replace with API call)
    const categories = [
        { id: 1, name: 'Mevalar', slug: 'mevalar', icon: 'fa-apple-alt' },
        { id: 2, name: 'Sabzavotlar', slug: 'sabzavotlar', icon: 'fa-carrot' },
        { id: 3, name: 'Don mahsulotlari', slug: 'don', icon: 'fa-seedling' },
        { id: 4, name: 'Sut mahsulotlari', slug: 'sut', icon: 'fa-cheese' },
        { id: 5, name: "Go'sht", slug: 'gosht', icon: 'fa-drumstick-bite' },
        { id: 6, name: 'Asal', slug: 'asal', icon: 'fa-bee' },
        { id: 7, name: 'Baliq', slug: 'baliq', icon: 'fa-fish' },
        { id: 8, name: 'Yog\'lar', slug: 'yoglar', icon: 'fa-oil-can' },
    ];
    
    try {
        // Try to fetch from API
        const response = await API.products.getCategories().catch(() => null);
        if (response && response.length > 0) {
            renderCategories(response);
        } else {
            renderCategories(categories);
        }
    } catch (error) {
        console.log('Using demo categories');
        renderCategories(categories);
    }
}

function renderCategories(categories) {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    container.innerHTML = categories.map(cat => `
        <a href="products.html?category=${cat.slug}" class="category-card">
            <div class="category-icon">
                <i class="fas ${cat.icon || getCategoryIcon(cat.name)}"></i>
            </div>
            <div class="category-name">${cat.name}</div>
        </a>
    `).join('');
}

// Load featured products
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Demo products
    const demoProducts = [
        {
            id: '1',
            name_uz: 'Olma (Golden)',
            slug: 'olma-golden',
            price: '15000',
            discount_price: '12000',
            unit: 'kg',
            rating: '4.5',
            is_organic: true,
            shop: { name: 'Yangi Bahor' },
            images: [{ image: '' }]
        },
        {
            id: '2',
            name_uz: 'Sabzi',
            slug: 'sabzi',
            price: '5000',
            unit: 'kg',
            rating: '4.8',
            is_organic: false,
            shop: { name: 'Dehqon Bozori' },
            images: [{ image: '' }]
        },
        {
            id: '3',
            name_uz: 'Qovun (Torpedo)',
            slug: 'qovun-torpedo',
            price: '8000',
            discount_price: '6000',
            unit: 'kg',
            rating: '4.7',
            is_organic: true,
            shop: { name: 'Xorazm Dehqon' },
            images: [{ image: '' }]
        },
        {
            id: '4',
            name_uz: 'Kartoshka (Navoiy)',
            slug: 'kartoshka-navoiy',
            price: '4000',
            unit: 'kg',
            rating: '4.3',
            is_organic: false,
            shop: { name: 'O\'zbekiston Dehqon' },
            images: [{ image: '' }]
        },
    ];
    
    try {
        const response = await API.products.getList({ page: 1 }).catch(() => null);
        if (response && response.results && response.results.length > 0) {
            renderProducts(response.results.slice(0, 4));
        } else {
            renderProducts(demoProducts);
        }
    } catch (error) {
        renderProducts(demoProducts);
    }
}

function renderProducts(products) {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);
        const price = hasDiscount ? product.discount_price : product.price;
        const oldPrice = hasDiscount ? product.price : null;
        const inWishlist = Store.isInWishlist(product.id);
        
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.images && product.images[0] ? product.images[0].image : 'https://via.placeholder.com/300x300?text=Mahsulot'}" 
                         alt="${product.name_uz}" 
                         onerror="this.src='https://via.placeholder.com/300x300?text=Mahsulot'">
                    ${hasDiscount ? `<span class="product-badge">-${Math.round((1 - price/oldPrice) * 100)}%</span>` : ''}
                    ${product.is_organic ? '<span class="product-badge organic"><i class="fas fa-leaf"></i> Organik</span>' : ''}
                    <button class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <a href="product.html?slug=${product.slug}" class="product-title">${product.name_uz}</a>
                    <div class="product-shop"><i class="fas fa-store"></i> ${product.shop?.name || 'Noma\'lum'}</div>
                    <div class="product-footer">
                        <div>
                            <div class="product-price">
                                ${formatPrice(price)}
                                ${oldPrice ? `<span class="old">${formatPrice(oldPrice)}</span>` : ''}
                            </div>
                            <div class="product-unit">1 ${product.unit}</div>
                        </div>
                        <button class="btn-add-cart" onclick="addToCartFromHome('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load popular shops
async function loadPopularShops() {
    const container = document.getElementById('popularShops');
    if (!container) return;
    
    // Demo shops
    const demoShops = [
        {
            id: '1',
            name: 'Yangi Bahor',
            slug: 'yangi-bahor',
            region: 'Toshkent',
            district: 'Yunusobod',
            rating: '4.9',
            total_sales: 1250,
            logo: '',
            is_verified: true,
        },
        {
            id: '2',
            name: 'Dehqon Bozori',
            slug: 'dehqon-bozori',
            region: 'Samarqand',
            district: 'Samarqand sh.',
            rating: '4.7',
            total_sales: 890,
            logo: '',
            is_verified: true,
        },
        {
            id: '3',
            name: 'Xorazm Dehqon',
            slug: 'xorazm-dehqon',
            region: 'Xorazm',
            district: 'Urganch',
            rating: '4.8',
            total_sales: 650,
            logo: '',
            is_verified: false,
        },
    ];
    
    try {
        const response = await API.shops.getList({ page: 1 }).catch(() => null);
        if (response && response.results && response.results.length > 0) {
            renderShops(response.results.slice(0, 3));
        } else {
            renderShops(demoShops);
        }
    } catch (error) {
        renderShops(demoShops);
    }
}

function renderShops(shops) {
    const container = document.getElementById('popularShops');
    if (!container) return;
    
    container.innerHTML = shops.map(shop => `
        <a href="shop.html?slug=${shop.slug}" class="shop-card">
            <div class="shop-banner">
                <div class="shop-logo">
                    <img src="${shop.logo || 'https://via.placeholder.com/80?text=Logo'}" 
                         alt="${shop.name}"
                         onerror="this.src='https://via.placeholder.com/80?text=Logo'">
                </div>
            </div>
            <div class="shop-info">
                <h3 class="shop-name">
                    ${shop.name}
                    ${shop.is_verified ? '<i class="fas fa-check-circle" style="color: var(--primary); margin-left: 8px;"></i>' : ''}
                </h3>
                <div class="shop-location">
                    <i class="fas fa-map-marker-alt"></i> ${shop.region}, ${shop.district}
                </div>
                <div class="shop-stats">
                    <span><i class="fas fa-star"></i> ${shop.rating}</span>
                    <span><i class="fas fa-shopping-bag"></i> ${shop.total_sales} sotuv</span>
                </div>
            </div>
        </a>
    `).join('');
}

// Add to cart from home
function addToCartFromHome(productId) {
    // Find product in featured products
    const productCard = document.querySelector(`[onclick="addToCartFromHome('${productId}')"]`)?.closest('.product-card');
    if (!productCard) return;
    
    const title = productCard.querySelector('.product-title').textContent;
    const priceText = productCard.querySelector('.product-price').textContent;
    const price = priceText.replace(/[^0-9]/g, '');
    const image = productCard.querySelector('img').src;
    
    const product = {
        id: productId,
        name_uz: title,
        price: price,
        slug: productId,
        images: [{ image: image }],
        shop: { name: 'Do\'kon' }
    };
    
    Store.addToCart(product, 1);
    showToast('Savatga qo\'shildi!', 'success');
}

// Toggle wishlist
function toggleWishlist(productId) {
    const isInWishlist = Store.isInWishlist(productId);
    
    if (isInWishlist) {
        Store.removeFromWishlist(productId);
        showToast('Sevimlilardan olib tashlandi', 'info');
    } else {
        Store.addToWishlist(productId);
        showToast('Sevimlilarga qo\'shildi!', 'success');
    }
    
    // Reload to update UI
    loadFeaturedProducts();
}
