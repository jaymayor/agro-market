// Home Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadFeaturedProducts();
    await loadPopularShops();
    
    // Setup infinite scroll
    setupInfiniteScroll();
});

// Setup infinite scroll for products
function setupInfiniteScroll() {
    const productsSection = document.querySelector('.section.bg-light');
    if (!productsSection) return;
    
    window.addEventListener('scroll', () => {
        if (isLoadingProducts || !hasMoreProducts) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        
        // Load more when 500px from bottom
        if (scrollPosition >= documentHeight - 500) {
            loadFeaturedProducts();
        }
    });
}

// Load categories
async function loadCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    // Demo categories - expanded to 20 categories
    const categories = [
        { id: 1, name: 'Mevalar', slug: 'mevalar', icon: 'fa-apple-alt', description: 'Toshkent, Farg\'ona, Samarqand mevalari' },
        { id: 2, name: 'Sabzavotlar', slug: 'sabzavotlar', icon: 'fa-carrot', description: 'Jizzax, Samarqand sabzavotlari' },
        { id: 3, name: 'Don mahsulotlari', slug: 'don', icon: 'fa-wheat-awn', description: 'Bug\'doy, g\'alla, makkajuxori' },
        { id: 4, name: 'Sut mahsulotlari', slug: 'sut', icon: 'fa-cheese', description: 'Sut, pishloq, qatiq, saryog\'' },
        { id: 5, name: "Go'sht", slug: 'gosht', icon: 'fa-drumstick-bite', description: 'Mol, qo\'y, tovuq go\'shti' },
        { id: 6, name: 'Asal', slug: 'asal', icon: 'fa-bee', description: 'Tabiiy asal va asal mahsulotlari' },
        { id: 7, name: 'Baliq', slug: 'baliq', icon: 'fa-fish', description: 'Chorvaq, To\'qtagul baliqlari' },
        { id: 8, name: 'Yog\'lar', slug: 'yoglar', icon: 'fa-bottle-droplet', description: 'Paxta yog\'i, zaytun yog\'i' },
        { id: 9, name: 'Ziravorlar', slug: 'ziravorlar', icon: 'fa-pepper-hot', description: 'Qora murch, zira, quritilgan o\'tlar' },
        { id: 10, name: 'Yong\'oq', slug: 'yongoq', icon: 'fa-cookie', description: 'Yong\'oq, bodom, pista' },
        { id: 11, name: 'Tuxum', slug: 'tuxum', icon: 'fa-egg', description: 'O\'rdak, tovuq tuxumlari' },
        { id: 12, name: 'Anor', slug: 'anor', icon: 'fa-lemon', description: 'Qizil anor, anor sharbati' },
        { id: 13, name: 'Qovun', slug: 'qovun', icon: 'fa-lemon', description: 'Shahrisabz, Denov qovunlari' },
        { id: 14, name: 'Pomidor', slug: 'pomidor', icon: 'fa-lemon', description: 'Qizil, sariq pomidorlar' },
        { id: 15, name: 'Bodring', slug: 'bodring', icon: 'fa-leaf', description: 'Yashil, oq bodringlar' },
        { id: 16, name: 'Piyez', slug: 'piyez', icon: 'fa-lemon', description: 'Qizil, oq piyezlar' },
        { id: 17, name: 'Kartoshka', slug: 'kartoshka', icon: 'fa-lemon', description: 'Navoiy, Jizzax kartoshkalari' },
        { id: 18, name: 'Sabzi', slug: 'sabzi', icon: 'fa-carrot', description: 'Jizzax, Samarqand sabzilari' },
        { id: 19, name: 'Lavlagi', slug: 'lavlagi', icon: 'fa-lemon', description: 'Qizil lavlagi' },
        { id: 20, name: 'Turp', slug: 'turp', icon: 'fa-lemon', description: 'Oq, qora turplar' },
    ];
    
    try {
        const response = await API.products.getCategories().catch(() => null);
        if (response && response.length > 0) {
            renderCategories(response);
        } else {
            renderCategories(categories);
        }
    } catch (error) {
        renderCategories(categories);
    }
}

function renderCategories(categories) {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    container.innerHTML = categories.map(cat => `
        <div class="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:border-primary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="w-20 h-20 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <i class="fas ${cat.icon || 'fa-seedling'} text-3xl text-white"></i>
            </div>
            <div class="font-bold text-text-color mb-2 text-lg group-hover:text-primary transition-colors">${cat.name}</div>
            <div class="text-sm text-text-muted mb-4 line-clamp-2">${cat.description || 'Sifatli mahsulotlar'}</div>
            <div class="flex gap-2">
                <a href="/category/?category=${cat.slug}" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 no-underline">
                    <i class="fas fa-eye"></i> Ko'rish
                </a>
                <button class="w-12 h-12 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Load featured products with infinite scroll
let productsPage = 1;
let isLoadingProducts = false;
let hasMoreProducts = true;

async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    if (isLoadingProducts || !hasMoreProducts) return;
    
    isLoadingProducts = true;
    document.getElementById('loadingMore').style.display = 'flex';
    
    try {
        const response = await API.products.getList({ 
            page: productsPage,
            ordering: '-rating',
            is_active: true
        }).catch(() => null);
        
        if (response && response.results && response.results.length > 0) {
            if (productsPage === 1) {
                renderProducts(response.results);
            } else {
                appendProducts(response.results);
            }
            
            productsPage++;
            hasMoreProducts = response.next !== null;
        } else {
            // Load demo products if API fails
            if (productsPage === 1) {
                renderDemoProducts();
            }
            hasMoreProducts = false;
        }
    } catch (error) {
        if (productsPage === 1) {
            renderDemoProducts();
        }
        hasMoreProducts = false;
    } finally {
        isLoadingProducts = false;
        document.getElementById('loadingMore').style.display = 'none';
    }
}

// Append products to existing grid
function appendProducts(products) {
    const container = document.getElementById('featuredProducts');
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
                    <div class="text-sm text-text-muted mb-4 line-clamp-2">
                        ${product.description_uz ? product.description_uz.substring(0, 80) + '...' : 'Sifatli mahsulot'}
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 bg-gradient-to-r from-primary to-primary-hover text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2" onclick="addToCartFromHome('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Savatga
                        </button>
                        <button class="w-12 h-12 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all flex items-center justify-center" onclick="addToCartFromHome('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.insertAdjacentHTML('beforeend', productsHTML);
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
                    <div class="text-sm text-text-muted mb-4 line-clamp-2">
                        ${product.description_uz ? product.description_uz.substring(0, 80) + '...' : 'Sifatli mahsulot'}
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 bg-gradient-to-r from-primary to-primary-hover text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2" onclick="addToCartFromHome('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Savatga
                        </button>
                        <button class="w-12 h-12 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all flex items-center justify-center" onclick="addToCartFromHome('${product.id}')">
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
    
    // Demo products
    const demoProducts = [
        {
            id: '1',
            name_uz: 'Olma (Golden)',
            slug: 'olma-golden',
            price: '25000',
            discount_price: '22000',
            unit: 'kg',
            rating: '4.5',
            is_organic: true,
            shop: { name: 'Yangi Bahor' },
            description_uz: 'Toshkent viloyatidan yetishtirilgan sifatli Golden olmalari. Shirin, suvli va vitaminlarga boy.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/apple.png' }]
        },
        {
            id: '2',
            name_uz: 'Sabzi',
            slug: 'sabzi',
            price: '8000',
            unit: 'kg',
            rating: '4.8',
            is_organic: false,
            shop: { name: 'Dehqon Bozori' },
            description_uz: 'Jizzax viloyatidan yangi yig\'ilgan sabzilar. Toza, sifatli va uzoq saqlanadi.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/carrot.png' }]
        },
        {
            id: '3',
            name_uz: 'Qovun (Torpedo)',
            slug: 'qovun-torpedo',
            price: '12000',
            discount_price: '10000',
            unit: 'kg',
            rating: '4.7',
            is_organic: true,
            shop: { name: 'Xorazm Dehqon' },
            description_uz: 'Xorazm viloyatining mashhur Torpedo qovunlari. Juda shirin va xushbo\'y.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/melon.png' }]
        },
        {
            id: '4',
            name_uz: 'Kartoshka (Navoiy)',
            slug: 'kartoshka-navoiy',
            price: '6000',
            unit: 'kg',
            rating: '4.3',
            is_organic: false,
            shop: { name: 'O\'zbekiston Dehqon' },
            description_uz: 'Navoiy viloyatidan ekilgan sifatli kartoshka. Qovurish uchun juda yaxshi.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/potato.png' }]
        },
        {
            id: '5',
            name_uz: 'Pomidor',
            slug: 'pomidor',
            price: '9000',
            unit: 'kg',
            rating: '4.6',
            is_organic: true,
            shop: { name: 'Farg\'ona Dehqon' },
            description_uz: 'Farg\'ona vodiysidan qizil, etli pomidorlar. Salat va qayla uchun ideal.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/tomato.png' }]
        },
        {
            id: '6',
            name_uz: 'Bodring',
            slug: 'bodring',
            price: '7000',
            unit: 'kg',
            rating: '4.4',
            is_organic: false,
            shop: { name: 'Toshkent Dehqon' },
            description_uz: 'Toshkent viloyatidan yangi yig\'ilgan yashil bodringlar. Salat uchun a\'lo.',
            images: [{ image: '/static/dehqonchilik_mahsulotlari/images/products/cucumber.png' }]
        },
    ];
    
    try {
        const response = await API.shops.getList({ page: 1 }).catch(() => null);
        if (response && response.results && response.results.length > 0) {
            renderShops(response.results.slice(0, 3));
        } else {
            renderShops(demoProducts);
        }
    } catch (error) {
        renderShops(demoProducts);
        renderShops(demoShops);
    }
}

function renderShops(shops) {
    const container = document.getElementById('popularShops');
    if (!container) return;
    
    container.innerHTML = shops.map(shop => `
        <a href="/shop/${shop.slug}/" class="shop-card">
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

// Add to cart from home page
function addToCartFromHome(productId) {
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
    
    // Redirect to cart page
    setTimeout(() => {
        window.location.href = '/cart/';
    }, 1000);
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
    
    loadFeaturedProducts();
}
