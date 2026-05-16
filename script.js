/**
 * VOIVO Manager - Core JavaScript
 * A high-fidelity replica of the VOIVO Manager React application
 */

// --- Data Store ---
class Store {
    constructor() {
        this.prefix = 'voivo_';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.prefix + 'businesses')) {
            localStorage.setItem(this.prefix + 'businesses', JSON.stringify([]));
        }
        if (!localStorage.getItem(this.prefix + 'products')) {
            // Add some mock products for demo
            localStorage.setItem(this.prefix + 'products', JSON.stringify([]));
        }
        if (!localStorage.getItem(this.prefix + 'sales')) {
            localStorage.setItem(this.prefix + 'sales', JSON.stringify([]));
        }
    }

    getAll(key) {
        return JSON.parse(localStorage.getItem(this.prefix + key)) || [];
    }

    saveAll(key, data) {
        localStorage.setItem(this.prefix + key, JSON.stringify(data));
    }

    add(key, item) {
        const data = this.getAll(key);
        item.id = Date.now();
        data.push(item);
        this.saveAll(key, data);
        return item;
    }

    update(key, id, updates) {
        const data = this.getAll(key);
        const index = data.findIndex(i => i.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.saveAll(key, data);
        }
    }

    delete(key, id) {
        const data = this.getAll(key);
        const filtered = data.filter(i => i.id !== id);
        this.saveAll(key, filtered);
    }

    getById(key, id) {
        return this.getAll(key).find(i => i.id === id);
    }
}

const db = new Store();

// --- Utilities ---
const utils = {
    formatCurrency: (num) => '₹ ' + (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    
    numberToWords: (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_arr) return '';
            let str = '';
            str += (n_arr[1] != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
            str += (n_arr[2] != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
            str += (n_arr[3] != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
            str += (n_arr[4] != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
            str += (n_arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'Only ' : 'Only ';
            return str;
        };
        return inWords(Math.floor(num));
    },

    toast: (message, type = 'success') => {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast glass ${type}`;
        
        const icon = type === 'success' ? 'check-circle-2' : (type === 'error' ? 'alert-triangle' : 'bell');
        const iconClass = type === 'success' ? 'text-success' : (type === 'error' ? 'text-danger' : 'text-gold');
        
        toast.innerHTML = `
            <i data-lucide="${icon}" size="18" class="${iconClass}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// --- App Controller ---
class App {
    constructor() {
        this.activeTab = 'dashboard';
        this.currentBusiness = null;
        this.businesses = [];
        this.charts = {};
        this.cart = [];
        this.init();
    }

    async init() {
        this.businesses = db.getAll('businesses');
        if (this.businesses.length === 0) {
            this.showSetup();
        } else {
            this.currentBusiness = this.businesses[0];
            // Seed mock data if empty
            const products = db.getAll('products');
            if (products.length === 0) {
                this.seedMockData();
            }
            this.showApp();
            this.render();
        }
        this.bindEvents();
    }

    seedMockData() {
        const mockProducts = [
            { name: '5W-30 Premium Engine Oil', category: 'Engine Oil', hsnCode: '2710', purchasePrice: 450, sellingPrice: 650, mrp: 850, unit: 'Btl', stock: 125, gstRate: 18, businessId: this.currentBusiness.id },
            { name: 'Synthetic Gear Oil 1L', category: 'Gear Oil', hsnCode: '2710', purchasePrice: 320, sellingPrice: 480, mrp: 600, unit: 'Btl', stock: 85, gstRate: 18, businessId: this.currentBusiness.id },
            { name: 'Long Life Coolant Blue', category: 'Coolant', hsnCode: '3820', purchasePrice: 180, sellingPrice: 280, mrp: 350, unit: 'Can', stock: 45, gstRate: 18, businessId: this.currentBusiness.id },
            { name: 'High Temp Chassis Grease', category: 'Grease', hsnCode: '2710', purchasePrice: 150, sellingPrice: 220, mrp: 300, unit: 'Pkt', stock: 200, gstRate: 18, businessId: this.currentBusiness.id }
        ];
        mockProducts.forEach(p => db.add('products', p));
    }

    showSetup() {
        document.getElementById('setupContainer').classList.add('open');
        document.getElementById('app').style.display = 'none';
    }

    showApp() {
        document.getElementById('setupContainer').classList.remove('open');
        document.getElementById('app').style.display = 'flex';
        this.updateBusinessUI();
    }

    updateBusinessUI() {
        document.getElementById('currentBusinessName').textContent = this.currentBusiness.name;
        this.renderBusinessList();
    }

    bindEvents() {
        // Tab Switching
        document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Setup Form
        document.getElementById('setupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const biz = {
                name: document.getElementById('setupName').value,
                gstNumber: document.getElementById('setupGst').value,
                phone: document.getElementById('setupPhone').value,
                address: document.getElementById('setupAddress').value,
                state: 'West Bengal'
            };
            const newBiz = db.add('businesses', biz);
            this.businesses.push(newBiz);
            this.currentBusiness = newBiz;
            this.showApp();
            this.render();
            utils.toast('Business created successfully');
        });

        // Business Selector
        document.getElementById('businessSelector').addEventListener('click', () => {
            const dropdown = document.getElementById('businessDropdown');
            const arrow = document.getElementById('selectorArrow');
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        // Add Business from Dropdown
        document.getElementById('addBusinessBtn').addEventListener('click', () => {
            document.getElementById('businessDropdown').style.display = 'none';
            this.showSetup();
        });

        // Close Invoice
        document.getElementById('closeInvoiceBtn').addEventListener('click', () => {
            document.getElementById('invoiceOverlay').classList.remove('open');
        });

        // Print Invoice
        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });

        // Refresh Data
        document.getElementById('refreshBtn').addEventListener('click', () => {
            const btn = document.getElementById('refreshBtn');
            btn.classList.add('spinning');
            setTimeout(() => {
                btn.classList.remove('spinning');
                this.render();
                utils.toast('Data refreshed');
            }, 800);
        });

        // Modal Clicks
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) {
                this.closeModal();
            }
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-view').forEach(view => {
            view.style.display = view.id === `${tabId}View` ? 'block' : 'none';
        });
        document.getElementById('viewTitle').textContent = document.querySelector(`.nav-item[data-tab="${tabId}"] span`).textContent;
        this.render();
    }

    render() {
        switch (this.activeTab) {
            case 'dashboard': this.renderDashboard(); break;
            case 'inventory': this.renderInventory(); break;
            case 'billing': this.renderBilling(); break;
            case 'sales': this.renderSales(); break;
        }
        this.updateNotifications();
    }

    // --- Business Logic ---
    renderBusinessList() {
        const list = document.getElementById('businessList');
        list.innerHTML = this.businesses.map(b => `
            <div class="nav-item ${this.currentBusiness.id === b.id ? 'active' : ''}" style="margin-bottom: 4px; font-size: 13px;" onclick="app.switchBusiness(${b.id})">
                <i data-lucide="building-2" size="14"></i>
                <span>${b.name}</span>
            </div>
        `).join('');
        lucide.createIcons();
    }

    switchBusiness(id) {
        this.currentBusiness = this.businesses.find(b => b.id === id);
        this.updateBusinessUI();
        document.getElementById('businessDropdown').style.display = 'none';
        document.getElementById('selectorArrow').style.transform = 'rotate(0deg)';
        this.render();
    }

    // --- Dashboard ---
    renderDashboard() {
        const view = document.getElementById('dashboardView');
        const sales = db.getAll('sales').filter(s => s.businessId === this.currentBusiness.id);
        const products = db.getAll('products').filter(p => p.businessId === this.currentBusiness.id);
        const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);

        view.innerHTML = `
            <div class="dashboard-container">
                <div class="stats-grid">
                    <div class="stats-card glass featured">
                        <div class="stats-icon-container featured-icon">
                            <i data-lucide="indian-rupee" size="28"></i>
                        </div>
                        <div class="stats-info">
                            <span class="stats-title">Total Revenue</span>
                            <div class="stats-value-row">
                                <h2 class="stats-value">${utils.formatCurrency(totalRevenue)}</h2>
                                <span class="stats-trend trend-up"><i data-lucide="arrow-up-right" size="14"></i>12.5%</span>
                            </div>
                        </div>
                        <div class="featured-glow"></div>
                    </div>
                    <div class="stats-card glass">
                        <div class="stats-icon-container">
                            <i data-lucide="shopping-cart" size="24"></i>
                        </div>
                        <div class="stats-info">
                            <span class="stats-title">Total Sales</span>
                            <div class="stats-value-row">
                                <h2 class="stats-value">${sales.length}</h2>
                                <span class="stats-trend trend-up"><i data-lucide="arrow-up-right" size="14"></i>8.2%</span>
                            </div>
                        </div>
                    </div>
                    <div class="stats-card glass">
                        <div class="stats-icon-container">
                            <i data-lucide="package" size="24"></i>
                        </div>
                        <div class="stats-info">
                            <span class="stats-title">Stock Items</span>
                            <div class="stats-value-row">
                                <h2 class="stats-value">${products.reduce((acc, p) => acc + Number(p.stock), 0)}</h2>
                                <span class="stats-trend trend-down"><i data-lucide="arrow-down-right" size="14"></i>2.4%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Sales Performance</h3>
                            <span class="chart-subtitle">Monthly revenue overview</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="salesChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Inventory Distribution</h3>
                            <span class="chart-subtitle">Top product categories</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="inventoryChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-grid-bottom">
                    <div class="chart-container glass">
                         <div class="chart-header">
                            <h3>Stock vs Sales Efficiency</h3>
                            <span class="chart-subtitle">Correlation analysis by category</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="efficiencyChart"></canvas>
                        </div>
                    </div>
                    <div class="insights-card glass">
                         <div class="chart-header">
                            <h3>Inventory Insights</h3>
                            <span class="chart-subtitle">Actionable alerts</span>
                        </div>
                        <div class="insights-list">
                            <div class="insight-item warning">
                                <div class="insight-icon"><i data-lucide="alert-circle" size="18"></i></div>
                                <div class="insight-text">
                                    <strong>Low Stock Alert</strong>
                                    <span>Products are running low in specific categories.</span>
                                </div>
                            </div>
                            <div class="insight-item success">
                                <div class="insight-icon"><i data-lucide="trending-up" size="18"></i></div>
                                <div class="insight-text">
                                    <strong>High Efficiency</strong>
                                    <span>Engine Oil turnover is currently peak.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.initDashboardCharts(sales);
    }

    initDashboardCharts(sales) {
        const ctx1 = document.getElementById('salesChart')?.getContext('2d');
        const ctx2 = document.getElementById('inventoryChart')?.getContext('2d');
        const ctx3 = document.getElementById('efficiencyChart')?.getContext('2d');

        if (this.charts.sales) this.charts.sales.destroy();
        if (this.charts.inventory) this.charts.inventory.destroy();
        if (this.charts.efficiency) this.charts.efficiency.destroy();

        if (ctx1) {
            this.charts.sales = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        fill: true,
                        label: 'Sales Revenue',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#D4AF37',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        tension: 0.4
                    }]
                },
                options: this.getChartOptions()
            });
        }

        if (ctx2) {
            this.charts.inventory = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Engine Oil', 'Gear Oil', 'Coolant', 'Grease', 'Other'],
                    datasets: [{
                        data: [45, 20, 15, 12, 8],
                        backgroundColor: ['#D4AF37', '#00E5FF', '#A855F7', '#F97316', '#10B981'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: { ...this.getChartOptions(), cutout: '75%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#8B949E' } } } }
            });
        }

        if (ctx3) {
            this.charts.efficiency = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: ['Engine Oil', 'Gear Oil', 'Coolant', 'Grease', 'Other'],
                    datasets: [
                        { label: 'Sales Perf', data: [380, 150, 120, 250, 80], borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Stock Avail', data: [450, 200, 150, 300, 100], borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.1)', fill: true, tension: 0.4 }
                    ]
                },
                options: this.getChartOptions()
            });
        }
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8B949E' } },
                x: { grid: { display: false }, ticks: { color: '#8B949E' } }
            }
        };
    }

    // --- Inventory ---
    renderInventory() {
        const view = document.getElementById('inventoryView');
        const products = db.getAll('products').filter(p => p.businessId === this.currentBusiness.id);
        
        view.innerHTML = `
            <div class="inventory-container">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 700;">Product Inventory</h2>
                        <p style="color: var(--text-dim); font-size: 14px;">Manage your stock and pricing</p>
                    </div>
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <div class="form-group" style="width: 300px; margin-bottom: 0;">
                            <input type="text" id="inventorySearch" placeholder="Search products..." style="padding: 10px 16px;">
                        </div>
                        <button class="btn-primary" onclick="app.showAddProductModal()">
                            <i data-lucide="plus-circle" size="18"></i>
                            Add Product
                        </button>
                    </div>
                </div>

                <div class="data-table-container glass">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>HSN</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Unit</th>
                                <th>GST</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            ${this.getInventoryRows(products)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            const filtered = products.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
            document.getElementById('inventoryTableBody').innerHTML = this.getInventoryRows(filtered);
            lucide.createIcons();
        });
    }

    getInventoryRows(products) {
        if (products.length === 0) {
            return `<tr><td colspan="8" style="text-align: center; padding: 60px; color: var(--text-dim);">No products found</td></tr>`;
        }
        return products.map(p => `
            <tr>
                <td><span class="product-name">${p.name}</span></td>
                <td><span class="category-badge">${p.category}</span></td>
                <td>${p.hsnCode || '---'}</td>
                <td>${utils.formatCurrency(p.sellingPrice)}</td>
                <td><span class="stock-level ${p.stock < 10 ? 'stock-low' : 'stock-good'}">${p.stock}</span></td>
                <td>${p.unit}</td>
                <td>${p.gstRate}%</td>
                <td class="actions-cell">
                    <button class="icon-btn" onclick="app.showEditProductModal(${p.id})"><i data-lucide="edit-2" size="14"></i></button>
                    <button class="icon-btn delete" onclick="app.deleteProduct(${p.id})"><i data-lucide="trash-2" size="14"></i></button>
                </td>
            </tr>
        `).join('');
    }

    showAddProductModal(editId = null) {
        const product = editId ? db.getById('products', editId) : null;
        const modal = document.getElementById('modalContent');
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${editId ? 'Edit Product' : 'Add New Product'}</h3>
                <p>${editId ? 'Modify existing product details' : 'Add a new product to your inventory'}</p>
            </div>
            <form id="productForm" class="form-grid">
                <div class="form-group full-width">
                    <label>Product Name</label>
                    <input type="text" id="pName" value="${product?.name || ''}" required placeholder="e.g. 5W-30 Premium Engine Oil">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="pCategory">
                        <option ${product?.category === 'Engine Oil' ? 'selected' : ''}>Engine Oil</option>
                        <option ${product?.category === 'Gear Oil' ? 'selected' : ''}>Gear Oil</option>
                        <option ${product?.category === 'Coolant' ? 'selected' : ''}>Coolant</option>
                        <option ${product?.category === 'Brake Fluid' ? 'selected' : ''}>Brake Fluid</option>
                        <option ${product?.category === 'Grease' ? 'selected' : ''}>Grease</option>
                        <option ${product?.category === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>HSN Code</label>
                    <input type="text" id="pHsn" value="${product?.hsnCode || ''}" placeholder="2710">
                </div>
                <div class="form-group">
                    <label>Purchase Price</label>
                    <input type="number" id="pPurchase" value="${product?.purchasePrice || ''}" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Selling Price</label>
                    <input type="number" id="pSelling" value="${product?.sellingPrice || ''}" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>MRP</label>
                    <input type="number" id="pMrp" value="${product?.mrp || ''}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Unit</label>
                    <select id="pUnit">
                        <option ${product?.unit === 'Btl' ? 'selected' : ''}>Btl</option>
                        <option ${product?.unit === 'Can' ? 'selected' : ''}>Can</option>
                        <option ${product?.unit === 'Ltr' ? 'selected' : ''}>Ltr</option>
                        <option ${product?.unit === 'Nos' ? 'selected' : ''}>Nos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Stock</label>
                    <input type="number" id="pStock" value="${product?.stock || ''}" required>
                </div>
                <div class="form-group">
                    <label>GST Rate (%)</label>
                    <input type="number" id="pGst" value="${product?.gstRate || 18}" required>
                </div>
                <div class="modal-actions full-width">
                    <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Product</button>
                </div>
            </form>
        `;
        this.openModal();
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const pData = {
                businessId: this.currentBusiness.id,
                name: document.getElementById('pName').value,
                category: document.getElementById('pCategory').value,
                hsnCode: document.getElementById('pHsn').value,
                purchasePrice: Number(document.getElementById('pPurchase').value),
                sellingPrice: Number(document.getElementById('pSelling').value),
                mrp: Number(document.getElementById('pMrp').value),
                unit: document.getElementById('pUnit').value,
                stock: Number(document.getElementById('pStock').value),
                gstRate: Number(document.getElementById('pGst').value)
            };
            if (editId) {
                db.update('products', editId, pData);
                utils.toast('Product updated');
            } else {
                db.add('products', pData);
                utils.toast('Product added');
            }
            this.closeModal();
            this.render();
        });
    }

    showEditProductModal(id) { this.showAddProductModal(id); }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            db.delete('products', id);
            this.render();
            utils.toast('Product deleted', 'info');
        }
    }

    // --- Billing ---
    renderBilling() {
        const view = document.getElementById('billingView');
        const products = db.getAll('products').filter(p => p.businessId === this.currentBusiness.id);
        
        view.innerHTML = `
            <div class="billing-grid">
                <div class="billing-main">
                    <div class="pos-card glass">
                        <div class="pos-header">
                            <h3 class="pos-title"><i data-lucide="user" size="20"></i> Customer Details</h3>
                        </div>
                        <div class="customer-form">
                            <div class="form-group">
                                <label>Customer Name</label>
                                <input type="text" id="billCustName" placeholder="Enter customer name" required>
                            </div>
                            <div class="form-group">
                                <label>Phone Number</label>
                                <input type="text" id="billCustPhone" placeholder="Enter phone number">
                            </div>
                            <div class="form-group full">
                                <label>Address</label>
                                <input type="text" id="billCustAddress" placeholder="Enter address">
                            </div>
                        </div>
                    </div>

                    <div class="pos-card glass" style="flex: 1;">
                        <div class="pos-header">
                            <h3 class="pos-title"><i data-lucide="shopping-cart" size="20"></i> Cart Items</h3>
                        </div>
                        <div class="item-search-container">
                            <div class="form-group" style="margin-bottom: 0;">
                                <input type="text" id="itemSearch" placeholder="Search & add product..." style="padding-left: 48px;">
                                <i data-lucide="search" size="18" style="position: absolute; left: 16px; top: 38px; color: var(--text-dim);"></i>
                            </div>
                            <div id="itemResults" class="search-results" style="display: none;"></div>
                        </div>

                        <div style="flex: 1; overflow-y: auto;">
                            <table class="cart-table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Price</th>
                                        <th style="text-align: center;">Qty</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody id="cartTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="billing-sidebar">
                    <div class="summary-card glass">
                        <h3 class="pos-title" style="margin-bottom: 12px;">Order Summary</h3>
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span id="billSubtotal">₹ 0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>GST (Combined)</span>
                            <span id="billGst">₹ 0.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total Payable</span>
                            <span id="billGrandTotal" class="price">₹ 0.00</span>
                        </div>
                        <button class="btn-primary" onclick="app.checkout()" style="width: 100%; margin-top: 12px; height: 56px;">
                            <i data-lucide="check-circle" size="20"></i>
                            Generate Invoice
                        </button>
                    </div>
                    
                    <div class="glass" style="padding: 20px; border-radius: var(--radius-lg); flex: 1; opacity: 0.5; border: 1px dashed var(--border-subtle); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                         <i data-lucide="qr-code" size="48" style="margin-bottom: 16px;"></i>
                         <p style="font-size: 13px;">UPI QR Code will appear<br>on the generated invoice.</p>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this.cart = [];
        this.updateCartUI();

        const searchInput = document.getElementById('itemSearch');
        const results = document.getElementById('itemResults');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (!query) {
                results.style.display = 'none';
                return;
            }
            const filtered = products.filter(p => p.name.toLowerCase().includes(query));
            if (filtered.length === 0) {
                results.style.display = 'none';
                return;
            }
            results.innerHTML = filtered.map(p => `
                <div class="search-item" onclick="app.addToCart(${p.id})">
                    <div class="item-info">
                        <span style="font-weight: 600;">${p.name}</span>
                        <span style="font-size: 11px; color: var(--text-dim);">Stock: ${p.stock} ${p.unit}</span>
                    </div>
                    <span class="item-price">${utils.formatCurrency(p.sellingPrice)}</span>
                </div>
            `).join('');
            results.style.display = 'block';
        });

        document.addEventListener('click', (e) => {
            if (!results.contains(e.target) && e.target !== searchInput) {
                results.style.display = 'none';
            }
        });
    }

    addToCart(productId) {
        const product = db.getById('products', productId);
        const existing = this.cart.find(i => i.id === productId);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        document.getElementById('itemSearch').value = '';
        document.getElementById('itemResults').style.display = 'none';
        this.updateCartUI();
    }

    updateCartUI() {
        const body = document.getElementById('cartTableBody');
        if (!body) return;

        if (this.cart.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-dim);">No items in cart</td></tr>';
        } else {
            body.innerHTML = this.cart.map(item => `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${item.name}</div>
                        <div style="font-size: 11px; color: var(--text-dim);">HSN: ${item.hsnCode}</div>
                    </td>
                    <td>${utils.formatCurrency(item.sellingPrice)}</td>
                    <td style="text-align: center;">
                        <input type="number" value="${item.quantity}" min="1" class="qty-input" onchange="app.updateCartQty(${item.id}, this.value)" style="width: 60px; padding: 4px; border-radius: 6px;">
                    </td>
                    <td style="font-weight: 600;">${utils.formatCurrency(item.sellingPrice * item.quantity)}</td>
                    <td>
                        <button class="icon-btn delete" onclick="app.removeFromCart(${item.id})"><i data-lucide="trash-2" size="14"></i></button>
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        const subtotal = this.cart.reduce((acc, i) => acc + (i.sellingPrice * i.quantity), 0);
        const totalGst = this.cart.reduce((acc, i) => acc + ((i.sellingPrice * i.quantity * i.gstRate) / 100), 0);
        const grandTotal = subtotal + totalGst;

        document.getElementById('billSubtotal').textContent = utils.formatCurrency(subtotal);
        document.getElementById('billGst').textContent = utils.formatCurrency(totalGst);
        document.getElementById('billGrandTotal').textContent = utils.formatCurrency(grandTotal);
    }

    updateCartQty(id, qty) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity = Math.max(1, Number(qty));
            this.updateCartUI();
        }
    }

    removeFromCart(id) {
        this.cart = this.cart.filter(i => i.id !== id);
        this.updateCartUI();
    }

    checkout() {
        const name = document.getElementById('billCustName').value;
        if (!name) return utils.toast('Please enter customer name', 'error');
        if (this.cart.length === 0) return utils.toast('Please add items to cart', 'error');

        const subtotal = this.cart.reduce((acc, i) => acc + (i.sellingPrice * i.quantity), 0);
        const totalGst = this.cart.reduce((acc, i) => acc + ((i.sellingPrice * i.quantity * i.gstRate) / 100), 0);
        const grandTotal = subtotal + totalGst;

        const sale = {
            businessId: this.currentBusiness.id,
            date: new Date().toISOString(),
            invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
            customerName: name,
            customerPhone: document.getElementById('billCustPhone').value,
            customerAddress: document.getElementById('billCustAddress').value,
            items: this.cart,
            subtotal,
            totalGst,
            grandTotal
        };

        db.add('sales', sale);
        
        // Update stock
        this.cart.forEach(item => {
            const product = db.getById('products', item.id);
            if (product) {
                db.update('products', product.id, { stock: Number(product.stock) - item.quantity });
            }
        });

        utils.toast('Sale recorded successfully!');
        this.renderBilling(); // Reset
        this.showInvoice(sale);
    }

    // --- Sales History ---
    renderSales() {
        const view = document.getElementById('salesView');
        const sales = db.getAll('sales').filter(s => s.businessId === this.currentBusiness.id).reverse();
        
        view.innerHTML = `
            <div class="sales-container">
                 <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 700;">Sales History</h2>
                        <p style="color: var(--text-dim); font-size: 14px;">Track and manage your generated invoices</p>
                    </div>
                    <div class="form-group" style="width: 300px; margin-bottom: 0;">
                        <input type="text" id="salesSearch" placeholder="Search by invoice or customer..." style="padding: 10px 16px;">
                    </div>
                </div>

                <div class="data-table-container glass">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="salesTableBody">
                            ${this.getSalesRows(sales)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('salesSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = sales.filter(s => s.invoiceNumber.toLowerCase().includes(query) || s.customerName.toLowerCase().includes(query));
            document.getElementById('salesTableBody').innerHTML = this.getSalesRows(filtered);
            lucide.createIcons();
        });
    }

    getSalesRows(sales) {
        if (sales.length === 0) {
            return `<tr><td colspan="7" style="text-align: center; padding: 60px; color: var(--text-dim);">No sales found</td></tr>`;
        }
        return sales.map(s => `
            <tr>
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td><span class="font-mono">${s.invoiceNumber}</span></td>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${s.customerName}</span>
                        <span class="customer-phone">${s.customerPhone || '---'}</span>
                    </div>
                </td>
                <td>${s.items.length} items</td>
                <td><span class="total-amount">${utils.formatCurrency(s.grandTotal)}</span></td>
                <td><span class="status-badge">Paid</span></td>
                <td class="actions-cell">
                    <button class="icon-btn" onclick="app.showInvoiceById(${s.id})"><i data-lucide="eye" size="14"></i></button>
                    <button class="icon-btn" onclick="app.downloadInvoice(${s.id})"><i data-lucide="download" size="14"></i></button>
                </td>
            </tr>
        `).join('');
    }

    showInvoiceById(id) {
        const sale = db.getById('sales', id);
        if (sale) this.showInvoice(sale);
    }

    downloadInvoice(id) {
        this.showInvoiceById(id);
        setTimeout(() => window.print(), 500);
    }

    // --- Invoice Renderer ---
    showInvoice(sale) {
        const paper = document.getElementById('invoicePaper');
        const biz = this.currentBusiness;
        
        paper.innerHTML = `
            <div class="invoice-header">
                <div class="seller-details">
                    <h1 class="brand-name">${biz.name}</h1>
                    <p class="address">${biz.address || 'Address not provided'}</p>
                    <p class="contact">Phone: ${biz.phone || '---'}</p>
                    <p class="gst">GSTIN: ${biz.gstNumber || 'UNREGISTERED'}</p>
                    <p class="state">State: ${biz.state || 'West Bengal'}</p>
                </div>
                <div class="invoice-meta">
                    <div class="meta-row">
                        <span class="label">Invoice No:</span>
                        <span class="value">${sale.invoiceNumber}</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">Date:</span>
                        <span class="value">${new Date(sale.date).toLocaleDateString()}</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">Reverse Charge:</span>
                        <span class="value">No</span>
                    </div>
                    <div class="meta-row">
                        <span class="label">Transport Mode:</span>
                        <span class="value">By Road</span>
                    </div>
                </div>
            </div>

            <div class="billing-shipping-grid">
                <div class="info-box">
                    <h3 class="box-title">Order From: (Bill to)</h3>
                    <div class="box-content">
                        <p class="name">${sale.customerName}</p>
                        <p class="address">${sale.customerAddress || '---'}</p>
                        <p class="phone">Phone: ${sale.customerPhone || '---'}</p>
                    </div>
                </div>
                <div class="info-box">
                    <h3 class="box-title">Ship To: (Consignee)</h3>
                    <div class="box-content">
                        <p class="name">${sale.customerName}</p>
                        <p class="address">${sale.customerAddress || '---'}</p>
                        <p class="phone">Phone: ${sale.customerPhone || '---'}</p>
                    </div>
                </div>
            </div>

            <table class="main-invoice-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item Description</th>
                        <th>HSN</th>
                        <th>MRP</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Rate</th>
                        <th>GST</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map((item, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-weight: 700;">${item.name}</td>
                            <td>${item.hsnCode}</td>
                            <td>${item.mrp || item.sellingPrice}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit}</td>
                            <td>${item.sellingPrice.toFixed(2)}</td>
                            <td>${item.gstRate}%</td>
                            <td class="text-right">${((item.sellingPrice * item.quantity) * (1 + item.gstRate / 100)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    ${Array(Math.max(0, 8 - sale.items.length)).fill(0).map(() => `
                        <tr style="height: 24px;"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="4">Total Quantity</td>
                        <td>${sale.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                        <td colspan="3" class="text-right">Final Amount</td>
                        <td class="text-right">${sale.grandTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div class="footer-grid">
                <div class="left-footer">
                    <div class="amount-words">
                        <span class="label">Amount in Words:</span>
                        <span class="value">Rupees ${utils.numberToWords(sale.grandTotal)}</span>
                    </div>
                    <div class="bank-details">
                        <h4 class="title">Bank Details:</h4>
                        <p>Bank: ${biz.bankName || '---'}</p>
                        <p>A/C: ${biz.accNo || '---'}</p>
                        <p>IFSC: ${biz.ifsc || '---'}</p>
                    </div>
                    <div class="terms">
                        <h4 class="title">Terms & Conditions:</h4>
                        <p>1. Goods once sold will not be taken back.</p>
                        <p>2. Subject to jurisdiction of local court.</p>
                    </div>
                </div>
                <div class="right-footer">
                    <div class="tax-summary">
                        <div class="summary-row"><span>Sub Total</span><span>${sale.subtotal.toFixed(2)}</span></div>
                        <div class="summary-row"><span>CGST</span><span>${(sale.totalGst / 2).toFixed(2)}</span></div>
                        <div class="summary-row"><span>SGST</span><span>${(sale.totalGst / 2).toFixed(2)}</span></div>
                        <div class="summary-row total"><span>Grand Total</span><span>₹ ${sale.grandTotal.toFixed(2)}</span></div>
                    </div>
                    <div class="signature-area">
                        <div class="upi-info">
                            <span class="label">Scan to Pay</span>
                            <div class="qr-box">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=upi://pay?pa=${biz.upiId || 'voivo@upi'}&pn=${biz.name}&am=${sale.grandTotal}" alt="QR">
                            </div>
                        </div>
                        <div class="sign-box">
                            <p class="for-text">For ${biz.name}</p>
                            <div style="height: 40px;"></div>
                            <p class="sign-text">Authorised Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('invoiceOverlay').classList.add('open');
        lucide.createIcons();
    }

    // --- Notifications ---
    updateNotifications() {
        const products = db.getAll('products').filter(p => p.businessId === this.currentBusiness.id);
        const lowStock = products.filter(p => Number(p.stock) <= 5);
        const dot = document.getElementById('notifDot');
        const list = document.getElementById('notifList');
        
        if (lowStock.length > 0) {
            dot.style.display = 'block';
            list.innerHTML = lowStock.map(p => `
                <div class="insight-item warning" style="padding: 10px; border-radius: 8px;">
                    <i data-lucide="alert-triangle" size="14"></i>
                    <span style="font-size: 12px;">Low stock: <strong>${p.name}</strong> (${p.stock} left)</span>
                </div>
            `).join('');
        } else {
            dot.style.display = 'none';
            list.innerHTML = '<p style="text-align: center; color: var(--text-dim); font-size: 13px; padding: 20px;">No new alerts</p>';
        }
        lucide.createIcons();
        
        document.getElementById('notifBtn').onclick = () => {
            const dropdown = document.getElementById('notifDropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
    }

    // --- Modal Helpers ---
    openModal() { document.getElementById('modalOverlay').classList.add('open'); }
    closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
}

const app = new App();
