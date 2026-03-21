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
                password: 'admin123',
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
        return this.getUsers().find(u => u.id === userId);
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
            role: userData.role || 'owner', // ✅ updated
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
        this.saveUsers(users.filter(u => u.id !== userId));
    }

    authenticateUser(email, password) {
        return this.getUsers().find(u => u.email === email && u.password === password);
    }

    emailExists(email) {
        return this.getUsers().some(u => u.email === email);
    }

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

    getCustomers() {
        const user = this.getCurrentUser();
        return user ? user.customers : [];
    }
}

// ✅ BUSINESS TYPES
const BUSINESS_TYPES = [
    'salon','retail','restaurant','gym','clinic',
    'electronics','fashion','grocery','pharmacy','services'
];

// Initialize
const db = new DataStore();

// INIT
function init() {
    checkAuth();

    const users = db.getUsers();
    if (users.length <= 1) {
        addDemoData();
    }
}

// DEMO DATA
function addDemoData() {
    const demoUser = db.addUser({
        businessName: 'Style Studio Salon',
        businessType: 'salon',
        ownerName: 'Priya Sharma',
        mobile: '9876543210',
        email: 'demo@sambadh.ai',
        password: 'demo123',
        city: 'Jaipur',
        plan: 'pro'
    });

    const demoCustomers = [
        { name: 'Rahul Kumar', phone: '9876543211', lastVisit: '2024-03-15', totalVisits: 5 },
        { name: 'Anita Singh', phone: '9876543212', lastVisit: '2024-03-18', totalVisits: 3 },
        { name: 'Vikram Patel', phone: '9876543213', lastVisit: '2024-03-20', totalVisits: 8 }
    ];

    demoCustomers.forEach(c => db.addCustomer(demoUser.id, c));
}

// AUTH CHECK
function checkAuth() {
    const user = db.getCurrentUser();
    if (!user) return;

    if (user.role === 'admin') showAdminDashboard();
    else showDashboard();
}

// LOGIN
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = db.authenticateUser(email, password);

    if (!user) return alert('Invalid email or password');

    db.setCurrentUser(user.id);
    closeAuthModal();

    user.role === 'admin' ? showAdminDashboard() : showDashboard();
}

// SIGNUP
function handleSignup(e) {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value;

    if (db.emailExists(email)) {
        alert('Email already exists');
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

    // ✅ validation
    if (!BUSINESS_TYPES.includes(userData.businessType)) {
        alert('Invalid business type');
        return;
    }

    const user = db.addUser(userData);
    db.setCurrentUser(user.id);
    closeAuthModal();
    showDashboard();
}

// DASHBOARD
function showDashboard() {
    const user = db.getCurrentUser();
    if (!user) return;

    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');

    document.getElementById('dashboardBusinessName').textContent = user.businessName;
    document.getElementById('totalCustomers').textContent = user.stats.totalCustomers || 0;

    updateCustomersTable(user.customers);

    // ✅ NEW
    updateInsights(user);
}

// CUSTOMERS TABLE
function updateCustomersTable(customers) {
    const tbody = document.querySelector('#customersTable tbody');

    if (!customers.length) {
        tbody.innerHTML = `<tr><td colspan="5">No customers yet</td></tr>`;
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.lastVisit}</td>
            <td>${c.totalVisits}</td>
            <td>Active</td>
        </tr>
    `).join('');
}

// INSIGHTS
function updateInsights(user) {
    const repeat = user.customers.filter(c => c.totalVisits > 1).length;
    console.log("Repeat Customers:", repeat);
}

// REPORT ENGINE
function generateReport(userId) {
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) return null;

    return {
        totalCustomers: user.customers.length,
        avgVisits: user.customers.length
            ? user.customers.reduce((s, c) => s + (c.totalVisits || 0), 0) / user.customers.length
            : 0
    };
}

// LOGOUT
function logout() {
    db.clearCurrentUser();
    location.reload();
}

// INIT
document.addEventListener('DOMContentLoaded', init);

// EXPORT
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.logout = logout;
