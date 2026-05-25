// Category Page JavaScript

let currentPage = 1;
let totalPages = 1;
let currentCategory = null;
let isLoadingProducts = false;
let hasMoreProducts = true;

document.addEventListener('DOMContentLoaded', async () => {
    // Get category slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category') || window.location.pathname.split('/').filter(Boolean).pop();
    
    if (categorySlug) {
        currentCategory = categorySlug;
        await loadCategoryInfo(categorySlug);
        await loadCategoryProducts(categorySlug);
        setupInfiniteScroll();
    } else {
        // If no category, redirect to categories page
        window.location.href = '/categories/';
    }
});

// Load category information
async function loadCategoryInfo(categorySlug) {
    try {
        const response = await API.products.getCategory(categorySlug);
        if (response) {
            displayCategoryInfo(response);
        } else {
            // Use demo category data
            const demoCategory = getDemoCategory(categorySlug);
            displayCategoryInfo(demoCategory);
        }
    } catch (error) {
        const demoCategory = getDemoCategory(categorySlug);
        displayCategoryInfo(demoCategory);
    }
}

// Get demo category data
function getDemoCategory(slug) {
    const categories = {
        'mevalar': {
            name: 'Mevalar',
            slug: 'mevalar',
            icon: 'fa-apple-alt',
            description: 'Toshkent, Farg\'ona, Samarqand viloyatlaridan eng sifatli, yangi mevalar. Olma, shaftoli, o\'rik, nashvati va boshqa mevalar.',
            product_count: 156,
            shop_count: 42
        },
        'sabzavotlar': {
            name: 'Sabzavotlar',
            slug: 'sabzavotlar',
            icon: 'fa-carrot',
            description: 'Mavsumiy sabzavotlar bevosita dehqonlardan. Sabzi, piyoz, pomidor, bodring, kartoshka va boshqalar.',
            product_count: 89,
            shop_count: 28
        },
        'don': {
            name: 'Don mahsulotlari',
            slug: 'don',
            icon: 'fa-seedling',
            description: 'Bug\'doy, g\'alla, makkajuxori, arpa va boshqa don mahsulotlari. O\'zbekistonning turli viloyatlaridan.',
            product_count: 67,
            shop_count: 19
        },
        'sut': {
            name: 'Sut mahsulotlari',
            slug: 'sut',
            icon: 'fa-cheese',
            description: 'Tabiiy sut, qatiq, pishloq, saryog\', kaymak va boshqa sut mahsulotlari. Fermer xo\'jaliklaridan.',
            product_count: 134,
            shop_count: 38
        },
        'gosht': {
            name: 'Go\'sht',
            slug: 'gosht',
            icon: 'fa-drumstick-bite',
            description: 'Mol, qo\'y, tovuq go\'shti. Sertifikatlangan fermer xo\'jaliklaridan toza go\'sht mahsulotlari.',
            product_count: 78,
            shop_count: 23
        },
        'asal': {
            name: 'Asal',
            slug: 'asal',
            icon: 'fa-bee',
            description: 'Tabiiy asal, asal quyasi, mum va boshqa asal mahsulotlari. O\'zbekistonning turli viloyatlaridan.',
            product_count: 45,
            shop_count: 15
        },
        'baliq': {
            name: 'Baliq',
            slug: 'baliq',
            icon: 'fa-fish',
            description: 'Chorvaq, To\'qtagul, Zarafshon daryolaridan yangi baliq. Laqqa baliq, sazan, amur va boshqalar.',
            product_count: 56,
            shop_count: 12
        },
        'yoglar': {
            name: 'Yog\'lar',
            slug: 'yoglar',
            icon: 'fa-oil-can',
            description: 'Paxta yog\'i, zaytun yog\'i, qovun yog\'i va boshqa tabiiy yog\'lar. Sifatli va sog\'lom mahsulotlar.',
            product_count: 34,
            shop_count: 11
        },
        'ziravorlar': {
            name: 'Ziravorlar',
            slug: 'ziravorlar',
            icon: 'fa-pepper-hot',
            description: 'Qora murch, zira, quritilgan o\'tlar, arpabodon va boshqa ziravorlar. O\'zbekiston oshxonasining lazzati.',
            product_count: 92,
            shop_count: 26
        },
        'yongoq': {
            name: 'Yong\'oq',
            slug: 'yongoq',
            icon: 'fa-seedling',
            description: 'Yong\'oq, bodom, pista, xurmo va boshqa mevalar. Farg\'ona vodiysi va Surxondaryo viloyatlaridan.',
            product_count: 61,
            shop_count: 18
        },
        'tuxum': {
            name: 'Tuxum',
            slug: 'tuxum',
            icon: 'fa-egg',
            description: 'O\'rdak, tovuq, g\'oz tuxumlari. Fermer xo\'jaliklaridan tabiiy va sifatli tuxumlar.',
            product_count: 48,
            shop_count: 16
        },
        'anor': {
            name: 'Anor',
            slug: 'anor',
            icon: 'fa-apple-alt',
            description: 'Qizil anor, anor sharbati, anor donasi. Shahrisabz, Denov, Qarshi viloyatlaridan eng yaxshi anorlar.',
            product_count: 29,
            shop_count: 8
        }
    };
    
    return categories[slug] || {
        name: 'Kategoriya',
        slug: slug,
        icon: 'fa-leaf',
        description: 'Bu kategoriya haqida ma\'lumot',
        product_count: 0,
        shop_count: 0
    };
}

// Display category information
function displayCategoryInfo(category) {
    document.getElementById('categoryTitle').textContent = category.name;
    document.getElementById('categoryDescription').textContent = category.description;
    document.getElementById('categoryIcon').className = `fas ${category.icon}`;
    document.getElementById('productCount').textContent = `${category.product_count} mahsulot`;
    document.getElementById('shopCount').textContent = `${category.shop_count} do'kon`;
    
    // Update page title
    document.title = `${category.name} - Agro Market`;
}

// Load category products
async function loadCategoryProducts(categorySlug) {
    if (isLoadingProducts || !hasMoreProducts) return;
    
    isLoadingProducts = true;
    document.getElementById('loadingMore').style.display = 'flex';
    
    try {
        const response = await API.products.getList({
            page: currentPage,
            category: categorySlug,
            ordering: document.getElementById('sortSelect')?.value || '-created_at'
        });
        
        if (response && response.results && response.results.length > 0) {
            if (currentPage === 1) {
                renderProducts(response.results);
            } else {
                appendProducts(response.results);
            }
            
            currentPage++;
            hasMoreProducts = response.next !== null;
        } else {
            // Load demo products
            if (currentPage === 1) {
                renderDemoProducts(categorySlug);
            }
            hasMoreProducts = false;
        }
    } catch (error) {
        if (currentPage === 1) {
            renderDemoProducts(categorySlug);
        }
        hasMoreProducts = false;
    } finally {
        isLoadingProducts = false;
        document.getElementById('loadingMore').style.display = 'none';
    }
}

// Render products
function renderProducts(products) {
    const container = document.getElementById('categoryProducts');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Hech narsa topilmadi</h3>
                <p>Bu kategoriyada hali mahsulotlar yo'q</p>
            </div>
        `;
        return;
    }
    
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
                    ${hasDiscount ? '<span class="product-badge">-' + Math.round((1 - price/oldPrice) * 100) + '%</span>' : ''}
                    ${product.is_organic ? '<span class="product-badge organic"><i class="fas fa-leaf"></i> Organik</span>' : ''}
                    <button class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <a href="/product/${product.slug}/" class="product-title">${product.name_uz}</a>
                    <div class="product-shop"><i class="fas fa-store"></i> ${product.shop?.name || 'Noma\'lum'}</div>
                    <div class="product-footer">
                        <div>
                            <div class="product-price">
                                ${formatPrice(price)}
                                ${oldPrice ? '<span class="old">' + formatPrice(oldPrice) + '</span>' : ''}
                            </div>
                            <div class="product-unit">1 ${product.unit}</div>
                        </div>
                        <button class="btn-add-cart" onclick="addToCartFromCategory('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Append products to existing grid
function appendProducts(products) {
    const container = document.getElementById('categoryProducts');
    if (!container || !products) return;
    
    const productsHTML = products.map(product => {
        const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);
        const price = hasDiscount ? product.discount_price : product.price;
        const oldPrice = hasDiscount ? product.price : null;
        const inWishlist = Store.isInWishlist(product.id);
        
        return `
            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <div class="relative">
                    <img src="${product.images && product.images[0] ? product.images[0].image : 'https://picsum.photos/seed/${product.id}/300/300.jpg'}" 
                         alt="${product.name_uz}" 
                         class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                         onerror="this.src='https://picsum.photos/seed/${product.id}/300/300.jpg'">
                    ${hasDiscount ? '<span class="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">-' + Math.round((1 - price/oldPrice) * 100) + '%</span>' : ''}
                    ${product.is_organic ? '<span class="absolute top-3 right-14 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"><i class="fas fa-leaf mr-1"></i>Organik</span>' : ''}
                    <button class="absolute top-3 right-3 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-lg ${inWishlist ? 'text-red-500' : ''}" onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                    <div class="absolute bottom-3 left-3 flex gap-2">
                        <span class="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 shadow">
                            <i class="fas fa-star text-yellow-400 mr-1"></i>${product.rating || '4.5'}
                        </span>
                        <span class="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 shadow">
                            <i class="fas fa-shopping-bag text-primary mr-1"></i>${product.sales_count || '0'}
                        </span>
                    </div>
                </div>
                <div class="p-5 flex flex-col">
                    <a href="/product/${product.slug}/" class="font-semibold text-text-color mb-2 hover:text-primary transition-colors no-underline line-clamp-2 text-lg">${product.name_uz}</a>
                    <div class="text-sm text-text-muted mb-3 flex items-center">
                        <i class="fas fa-store text-primary mr-2"></i> ${product.shop?.name || 'Noma\'lum'}
                    </div>
                    <div class="flex items-baseline gap-2 mb-3">
                        <span class="text-2xl font-bold text-primary">${formatPrice(price)}</span>
                        ${oldPrice ? '<span class="text-sm text-text-muted line-through">' + formatPrice(oldPrice) + '</span>' : ''}
                    </div>
                    <div class="text-sm text-text-muted mb-4">1 ${product.unit}</div>
                    <div class="flex gap-2">
                        <button class="flex-1 bg-gradient-to-r from-primary to-primary-hover text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2" onclick="addToCartFromCategory('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Savatga
                        </button>
                        <button class="w-12 h-12 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all flex items-center justify-center" onclick="addToCartFromCategory('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.insertAdjacentHTML('beforeend', productsHTML);
}

// Render demo products
function renderDemoProducts(categorySlug) {
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
            name_uz: 'Kartoshka',
            slug: 'kartoshka',
            price: '4000',
            unit: 'kg',
            rating: '4.3',
            is_organic: false,
            shop: { name: 'Navoiy Dehqon' },
            images: [{ image: '' }]
        },
        {
            id: '5',
            name_uz: 'Pomidor',
            slug: 'pomidor',
            price: '6000',
            unit: 'kg',
            rating: '4.6',
            is_organic: true,
            shop: { name: 'Farg\'ona Dehqon' },
            images: [{ image: '' }]
        },
        {
            id: '6',
            name_uz: 'Bodring',
            slug: 'bodring',
            price: '4500',
            unit: 'kg',
            rating: '4.4',
            is_organic: false,
            shop: { name: 'Toshkent Dehqon' },
            images: [{ image: '' }]
        },
    ];
    
    renderProducts(demoProducts);
}

// Setup infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoadingProducts || !hasMoreProducts) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        
        // Load more when 500px from bottom
        if (scrollPosition >= documentHeight - 500) {
            loadCategoryProducts(currentCategory);
        }
    });
}

// Sort products
function sortProducts() {
    currentPage = 1;
    hasMoreProducts = true;
    loadCategoryProducts(currentCategory);
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
    
    // Update UI
    const btn = event.currentTarget;
    btn.classList.toggle('active');
}

// Add to cart from category page
function addToCartFromCategory(productId) {
    const productCard = event.currentTarget.closest('.product-card');
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
