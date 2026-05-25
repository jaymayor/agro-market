// Products Page JavaScript

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    currentFilters = {
        category: urlParams.get('category') || '',
        search: urlParams.get('search') || '',
        min_price: urlParams.get('min_price') || '',
        max_price: urlParams.get('max_price') || '',
        is_organic: urlParams.get('is_organic') || '',
        ordering: urlParams.get('ordering') || '-created_at',
    };
    
    // Set initial values
    if (currentFilters.search) {
        document.getElementById('searchInput').value = currentFilters.search;
    }
    if (currentFilters.min_price) {
        document.getElementById('minPrice').value = currentFilters.min_price;
    }
    if (currentFilters.max_price) {
        document.getElementById('maxPrice').value = currentFilters.max_price;
    }
    if (currentFilters.is_organic) {
        document.getElementById('organicFilter').checked = true;
    }
    document.getElementById('sortSelect').value = currentFilters.ordering;
    
    // Load data
    await loadCategories();
    await loadProducts();
    
    // Setup view toggle
    setupViewToggle();
});

// Load and render categories for filters
async function loadCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    
    try {
        const categories = await API.products.getCategories();
        if (categories && categories.length > 0) {
            container.innerHTML = categories.map(cat => `
                <label class="filter-option">
                    <input type="checkbox" value="${cat.slug}" 
                        ${currentFilters.category === cat.slug ? 'checked' : ''}
                        onchange="toggleCategory('${cat.slug}')">
                    <span>${cat.name}</span>
                </label>
            `).join('');
        }
    } catch (error) {
        console.log('Categories load error:', error);
    }
}

// Load products
async function loadProducts() {
    const container = document.getElementById('productsGrid');
    const countEl = document.getElementById('resultsCount');
    
    // Show loading skeleton
    container.innerHTML = Array(8).fill('<div class="product-card skeleton"></div>').join('');
    
    try {
        const params = {
            page: currentPage,
            ...currentFilters,
        };
        
        // Remove empty params
        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });
        
        const response = await API.products.getList(params);
        
        if (response && response.results) {
            renderProducts(response.results);
            totalPages = Math.ceil(response.count / 20);
            renderPagination();
            
            countEl.textContent = `${response.count} ta mahsulot topildi`;
        } else {
            // Demo products if API fails
            renderDemoProducts();
            countEl.textContent = 'Demo mahsulotlar';
        }
    } catch (error) {
        console.error('Products load error:', error);
        renderDemoProducts();
        countEl.textContent = 'Demo mahsulotlar';
    }
}

// Render products
function renderProducts(products) {
    const container = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Hech narsa topilmadi</h3>
                <p>Boshqa qidiruv so'zini kiriting yoki filtrlarni o'zgartiring</p>
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
                    ${hasDiscount ? `<span class="product-badge">-${Math.round((1 - price/oldPrice) * 100)}%</span>` : ''}
                    ${product.is_organic ? `<span class="product-badge organic"><i class="fas fa-leaf"></i></span>` : ''}
                    <button class="product-wishlist ${inWishlist ? 'active' : ''}" 
                            onclick="toggleProductWishlist('${product.id}', event)">
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
                        <button class="btn-add-cart" onclick="addToCartProduct('${product.id}', event)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Demo products
function renderDemoProducts() {
    const demoProducts = [
        {
            id: '1',
            name_uz: 'Olma (Golden)',
            slug: 'olma-golden',
            price: '15000',
            discount_price: '12000',
            unit: 'kg',
            is_organic: true,
            shop: { name: 'Yangi Bahor' },
        },
        {
            id: '2',
            name_uz: 'Sabzi',
            slug: 'sabzi',
            price: '5000',
            unit: 'kg',
            is_organic: false,
            shop: { name: 'Dehqon Bozori' },
        },
        {
            id: '3',
            name_uz: 'Qovun (Torpedo)',
            slug: 'qovun-torpedo',
            price: '8000',
            discount_price: '6000',
            unit: 'kg',
            is_organic: true,
            shop: { name: 'Xorazm Dehqon' },
        },
        {
            id: '4',
            name_uz: 'Kartoshka',
            slug: 'kartoshka',
            price: '4000',
            unit: 'kg',
            is_organic: false,
            shop: { name: 'Navoiy Dehqon' },
        },
    ];
    
    renderProducts(demoProducts);
}

// Render pagination
function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    let html = '';
    
    // Previous button
    html += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span>...</span>`;
        html += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle category filter
function toggleCategory(slug) {
    // Uncheck other categories
    document.querySelectorAll('#categoryFilters input').forEach(input => {
        if (input.value !== slug) input.checked = false;
    });
    
    currentFilters.category = slug;
    currentPage = 1;
    loadProducts();
}

// Apply filters
function applyFilters() {
    currentFilters.min_price = document.getElementById('minPrice').value;
    currentFilters.max_price = document.getElementById('maxPrice').value;
    currentFilters.is_organic = document.getElementById('organicFilter').checked ? 'true' : '';
    
    currentPage = 1;
    loadProducts();
}

// Reset filters
function resetFilters() {
    document.querySelectorAll('#categoryFilters input').forEach(input => input.checked = false);
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('organicFilter').checked = false;
    
    currentFilters = {
        category: '',
        search: '',
        min_price: '',
        max_price: '',
        is_organic: '',
        ordering: '-created_at',
    };
    
    currentPage = 1;
    loadProducts();
}

// Sort products
function sortProducts() {
    const ordering = document.getElementById('sortSelect').value;
    currentFilters.ordering = ordering;
    currentPage = 1;
    loadProducts();
}

// Setup view toggle
function setupViewToggle() {
    const buttons = document.querySelectorAll('.view-toggle button');
    const grid = document.getElementById('productsGrid');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            if (view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
        });
    });
}

// Toggle wishlist
function toggleProductWishlist(productId, event) {
    event.preventDefault();
    event.stopPropagation();
    
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

// Add to cart from products page
function addToCartProduct(productId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Find product in current products
    const card = event.currentTarget.closest('.product-card');
    const title = card.querySelector('.product-title').textContent;
    const priceText = card.querySelector('.product-price').textContent;
    const price = priceText.replace(/[^0-9]/g, '');
    const image = card.querySelector('img').src;
    
    const product = {
        id: productId,
        name_uz: title,
        price: price,
        slug: productId,
        images: [{ image: image }],
        shop: { name: card.querySelector('.product-shop').textContent.replace('fa-store', '').trim() },
        unit: 'kg'
    };
    
    Store.addToCart(product, 1);
    showToast('Savatga qo\'shildi!', 'success');
}
