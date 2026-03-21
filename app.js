// Data Storage System - Uses localStorage for persistence
class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('sambadh_users')) {
            localStorage.setItem('sambadh_users', JSON.stringify([]));
        }
        if (!localStorage.getItem('sambadh_customers')) {
            localStorage.setItem('sambadh_customers', JSON.stringify([]));
        }
        if (!localStorage.getItem('sambadh_current_user')) {
            localStorage.setItem('sambadh_current_user', null);
        }
        
        // Create admin account if it doesn't exist
        this.createAdminAccount();
    }

    createAdminAccount() {
        const users = this.getUsers();
        const adminExists = users.some(u => u.email === 'admin@sambadh.ai');
        
        if (!adminExists) {
            const admin = {
                id: this.generateId(),
                businessName: 'Sambadh Admin',
                businessType: 'admin',
                ownerName: 'Admin',
                mobile: '9999999999',
                email: 'admin@sambadh.ai',
                password: 'admin123', // In production, this should be hashed
                city: 'System',
                plan: 'admin',
                role: 'admin',
                createdAt: new Date().toISOString(),
                isActive: true,
                customers: [],
                stats: {
                    totalCustomers: 0,
                    monthlyGrowth: 0,
                    campaignsSent: 0,
                    retention: 0
                }
            };
            users.push(admin);
            localStorage.setItem('sambadh_users', JSON.stringify(users));
            console.log('Admin account created: admin@sambadh.ai / admin123');
        }
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('sambadh_users')) || [];
    }

    saveUsers(users) {
        localStorage.setItem('sambadh_users', JSON.stringify(users));
    }

    getCurrentUser() {
        const userId = localStorage.getItem('sambadh_current_user');
        if (!userId) return null;
        const users = this.getUsers();
        return users.find(u => u.id === userId);
    }

    setCurrentUser(userId) {
        localStorage.setItem('sambadh_current_user', userId);
    }

    clearCurrentUser() {
        localStorage.setItem('sambadh_current_user', null);
    }

    addUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            isActive: true,
            role: 'user',
            customers: [],
            stats: {
                totalCustomers: 0,
                monthlyGrowth: 0,
                campaignsSent: 0,
                retention: 0
            }
        };
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.saveUsers(users);
            return users[index];
        }
        return null;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filtered = users.filter(u => u.id !== userId);
        this.saveUsers(filtered);
    }

    authenticateUser(email, password) {
        const users = this.getUsers();
        return users.find(u => u.email === email && u.password === password);
    }

    emailExists(email) {
        const users = this.getUsers();
        return users.some(u => u.email === email);
    }

    // Customer management
    addCustomer(userId, customerData) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            const customer = {
                id: 'cust_' + Date.now(),
                ...customerData,
                createdAt: new Date().toISOString()
            };
            user.customers.push(customer);
            user.stats.totalCustomers = user.customers.length;
            this.saveUsers(users);
            return customer;
        }
        return null;
    }

    getCustomers(userId) {
        const user = this.getCurrentUser();
        return user ? user.customers : [];
    }
}

// Initialize data store
const db = new DataStore();

// UI State Management
let currentView = 'landing';
let selectedPlan = 'basic';

// Initialize app
function init() {
    checkAuth();
    
    // Add demo data for testing (only if no users exist except admin)
    const users = db.getUsers();
    if (users.length <= 1) {
        addDemoData();
    }
}

function addDemoData() {
    // Add a demo business
    const demoUser = {
        businessName: 'Style Studio Salon',
        businessType: 'salon',
        ownerName: 'Priya Sharma',
        mobile: '9876543210',
        email: 'demo@sambadh.ai',
        password: 'demo123',
        city: 'Jaipur',
        plan: 'pro'
    };
    
    const user = db.addUser(demoUser);
    
    // Add demo customers
    const demoCustomers = [
        { name: 'Rahul Kumar', phone: '9876543211', lastVisit: '2024-03-15', totalVisits: 5 },
        { name: 'Anita Singh', phone: '9876543212', lastVisit: '2024-03-18', totalVisits: 3 },
        { name: 'Vikram Patel', phone: '9876543213', lastVisit: '2024-03-20', totalVisits: 8 }
    ];
    
    demoCustomers.forEach(customer => {
        db.addCustomer(user.id, customer);
    });
    
    console.log('Demo data added. Login with demo@sambadh.ai / demo123');
}

function checkAuth() {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
        if (currentUser.role === 'admin') {
            showAdminDashboard();
        } else {
            showDashboard();
        }
    }
}

// Navigation
function showHome() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
    window.scrollTo(0, 0);
}

function showLogin() {
    document.getElementById('authModal').classList.add('active');
    switchToLogin();
}

function showSignup() {
    document.getElementById('authModal').classList.add('active');
    switchToSignup();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchToLogin() {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Welcome Back';
}

function switchToSignup() {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.add('active');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Create Account';
}

function signupWithPlan(plan) {
    selectedPlan = plan;
    document.getElementById('signupPlan').value = plan;
    showSignup();
}

// Authentication handlers
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = db.authenticateUser(email, password);
    
    if (user) {
        db.setCurrentUser(user.id);
        closeAuthModal();
        
        if (user.role === 'admin') {
            showAdminDashboard();
        } else {
            showDashboard();
        }
        
        // Reset form
        document.getElementById('loginForm').reset();
    } else {
        alert('Invalid email or password');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    
    // Check if email already exists
    if (db.emailExists(email)) {
        alert('Email already registered. Please login instead.');
        return;
    }
    
    const userData = {
        businessName: document.getElementById('signupBusinessName').value,
        businessType: document.getElementById('signupBusinessType').value,
        ownerName: document.getElementById('signupOwnerName').value,
        mobile: document.getElementById('signupMobile').value,
        email: email,
        password: document.getElementById('signupPassword').value,
        city: document.getElementById('signupCity').value,
        plan: document.getElementById('signupPlan').value
    };
    
    const newUser = db.addUser(userData);
    
    if (newUser) {
        alert('Account created successfully! Welcome to Sambadh.ai');
        db.setCurrentUser(newUser.id);
        closeAuthModal();
        showDashboard();
        
        // Reset form
        document.getElementById('signupForm').reset();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        db.clearCurrentUser();
        showHome();
    }
}

// Dashboard
function showDashboard() {
    const user = db.getCurrentUser();
    if (!user) {
        showHome();
        return;
    }
    
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    
    // Update dashboard data
    document.getElementById('dashboardBusinessName').textContent = user.businessName;
    document.getElementById('dashboardPlan').textContent = capitalizeFirstLetter(user.plan) + ' Plan · Active';
    
    // Update stats
    document.getElementById('totalCustomers').textContent = user.stats.totalCustomers || 0;
    document.getElementById('monthlyGrowth').textContent = (user.stats.monthlyGrowth || 0) + '%';
    document.getElementById('campaignsSent').textContent = user.stats.campaignsSent || 0;
    document.getElementById('retention').textContent = (user.stats.retention || 0) + '%';
    
    // Update customers table
    updateCustomersTable(user.customers);
}

function updateCustomersTable(customers) {
    const tbody = document.querySelector('#customersTable tbody');
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--muted); padding: 40px;">
                    No customers yet. Share your QR code to start collecting customer data!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.slice(0, 10).map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${formatDate(customer.lastVisit)}</td>
            <td>${customer.totalVisits}</td>
            <td><span class="badge badge-green">Active</span></td>
        </tr>
    `).join('');
}

// Admin Dashboard
function showAdminDashboard() {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'admin') {
        showHome();
        return;
    }
    
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    
    // Calculate admin stats
    const allUsers = db.getUsers();
    const businessUsers = allUsers.filter(u => u.role !== 'admin');
    const activeUsers = businessUsers.filter(u => u.isActive);
    
    // Calculate MRR
    const planPrices = { basic: 299, pro: 699, premium: 1299 };
    const mrr = activeUsers.reduce((sum, u) => sum + (planPrices[u.plan] || 0), 0);
    const arr = mrr * 12;
    
    document.getElementById('adminTotalUsers').textContent = businessUsers.length;
    document.getElementById('adminActiveUsers').textContent = activeUsers.length;
    document.getElementById('adminMRR').textContent = '₹' + formatNumber(mrr);
    document.getElementById('adminARR').textContent = '₹' + formatNumber(arr);
    
    // Update users table
    updateAdminUsersTable(businessUsers);
}

function updateAdminUsersTable(users) {
    const tbody = document.getElementById('adminUsersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--muted); padding: 40px;">
                    No users registered yet.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.businessName}</td>
            <td>${user.ownerName}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${getPlanColor(user.plan)}">${capitalizeFirstLetter(user.plan)}</span></td>
            <td>${user.city}</td>
            <td>${formatDate(user.createdAt)}</td>
        </tr>
    `).join('');
}

// Utility functions
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function formatNumber(num) {
    if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + ' L';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getPlanColor(plan) {
    const colors = {
        basic: 'blue',
        pro: 'orange',
        premium: 'green'
    };
    return colors[plan] || 'blue';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Export data function (for admin)
function exportData() {
    const data = {
        users: db.getUsers(),
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'sambadh_data_' + Date.now() + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Make functions available globally
window.showHome = showHome;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeAuthModal = closeAuthModal;
window.switchToLogin = switchToLogin;
window.switchToSignup = switchToSignup;
window.signupWithPlan = signupWithPlan;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.logout = logout;
window.exportData = exportData;
