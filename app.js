// sambandh.ai CRM Application
// Firebase-powered customer relationship management system

// ====================================
// FIREBASE DATABASE MANAGER
// ====================================

class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            this.fallbackToLocalStorage();
            return;
        }

        try {
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // Listen to auth state changes
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.loadUserData(user.uid);
                }
            });
            
            console.log('✅ Firebase Manager initialized');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.log('⚠️ Using localStorage instead of Firebase');
        this.useLocalStorage = true;
    }

    // User Management
    async createUser(email, password, userData) {
        if (this.useLocalStorage) {
            return this.createUserLocal(email, password, userData);
        }

        try {
            // Create Firebase Auth user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save user data to Firestore
            await this.db.collection('users').doc(user.uid).set({
                ...userData,
                uid: user.uid,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                role: email === 'admin@sambandh.ai' ? 'admin' : 'user',
                stats: {
                    totalCustomers: 0,
                    monthlyGrowth: 0,
                    campaignsSent: 0,
                    retention: 0
                }
            });

            return { success: true, user: user };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async loginUser(email, password) {
        if (this.useLocalStorage) {
            return this.loginUserLocal(email, password);
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message };
        }
    }

    async logoutUser() {
        if (this.useLocalStorage) {
            localStorage.removeItem('sambandh_current_user');
            return { success: true };
        }

        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Error logging out:', error);
            return { success: false, error: error.message };
        }
    }

    async loadUserData(uid) {
        if (this.useLocalStorage) {
            return this.loadUserDataLocal(uid);
        }

        try {
            const doc = await this.db.collection('users').doc(uid).get();
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    showAdminDashboard();
                } else {
                    showDashboard();
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async getUserData(uid) {
        if (this.useLocalStorage) {
            return this.getUserDataLocal(uid);
        }

        try {
            const doc = await this.db.collection('users').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    async getAllUsers() {
        if (this.useLocalStorage) {
            return this.getAllUsersLocal();
        }

        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    // Customer Management
    async addCustomer(userId, customerData) {
        if (this.useLocalStorage) {
            return this.addCustomerLocal(userId, customerData);
        }

        try {
            const customerRef = await this.db.collection('customers').add({
                userId: userId,
                ...customerData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user stats
            const userRef = this.db.collection('users').doc(userId);
            await userRef.update({
                'stats.totalCustomers': firebase.firestore.FieldValue.increment(1)
            });

            return { success: true, id: customerRef.id };
        } catch (error) {
            console.error('Error adding customer:', error);
            return { success: false, error: error.message };
        }
    }

    async getCustomers(userId) {
        if (this.useLocalStorage) {
            return this.getCustomersLocal(userId);
        }

        try {
            const snapshot = await this.db.collection('customers')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting customers:', error);
            return [];
        }
    }

    // LocalStorage Fallback Methods
    createUserLocal(email, password, userData) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        
        if (users.some(u => u.email === email)) {
            return { success: false, error: 'Email already exists' };
        }

        const newUser = {
            uid: 'user_' + Date.now(),
            email: email,
            password: password, // In production, hash this!
            ...userData,
            createdAt: new Date().toISOString(),
            isActive: true,
            role: email === 'admin@sambandh.ai' ? 'admin' : 'user',
            stats: {
                totalCustomers: 0,
                monthlyGrowth: 0,
                campaignsSent: 0,
                retention: 0
            }
        };

        users.push(newUser);
        localStorage.setItem('sambandh_users', JSON.stringify(users));
        localStorage.setItem('sambandh_current_user', newUser.uid);
        
        return { success: true, user: newUser };
    }

    loginUserLocal(email, password) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('sambandh_current_user', user.uid);
            return { success: true, user: user };
        }
        
        return { success: false, error: 'Invalid email or password' };
    }

    loadUserDataLocal(uid) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        const user = users.find(u => u.uid === uid);
        
        if (user) {
            if (user.role === 'admin') {
                showAdminDashboard();
            } else {
                showDashboard();
            }
        }
    }

    getUserDataLocal(uid) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        return users.find(u => u.uid === uid) || null;
    }

    getAllUsersLocal() {
        return JSON.parse(localStorage.getItem('sambandh_users') || '[]');
    }

    addCustomerLocal(userId, customerData) {
        const customers = JSON.parse(localStorage.getItem('sambandh_customers') || '[]');
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        
        const newCustomer = {
            id: 'cust_' + Date.now(),
            userId: userId,
            ...customerData,
            createdAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        localStorage.setItem('sambandh_customers', JSON.stringify(customers));
        
        // Update user stats
        const userIndex = users.findIndex(u => u.uid === userId);
        if (userIndex !== -1) {
            users[userIndex].stats.totalCustomers = (users[userIndex].stats.totalCustomers || 0) + 1;
            localStorage.setItem('sambandh_users', JSON.stringify(users));
        }
        
        return { success: true, id: newCustomer.id };
    }

    getCustomersLocal(userId) {
        const customers = JSON.parse(localStorage.getItem('sambandh_customers') || '[]');
        return customers.filter(c => c.userId === userId);
    }

    getCurrentUserId() {
        if (this.useLocalStorage) {
            return localStorage.getItem('sambandh_current_user');
        }
        return this.currentUser ? this.currentUser.uid : null;
    }
}

// Initialize Firebase Manager
const fbManager = new FirebaseManager();

// ====================================
// UI STATE MANAGEMENT
// ====================================

let selectedPlan = 'pro';

// Initialize app
function init() {
    checkAuth();
    createDemoDataIfNeeded();
}

function createDemoDataIfNeeded() {
    const users = fbManager.getAllUsersLocal();
    
    // Create admin if doesn't exist
    if (!users.some(u => u.email === 'admin@sambandh.ai')) {
        fbManager.createUserLocal('admin@sambandh.ai', 'admin123', {
            businessName: 'sambandh Admin',
            businessType: 'admin',
            ownerName: 'Admin',
            mobile: '9999999999',
            city: 'System',
            plan: 'admin'
        });
        console.log('✅ Admin account created: admin@sambandh.ai / admin123');
    }
    
    // Create demo account if doesn't exist
    if (!users.some(u => u.email === 'demo@sambandh.ai')) {
        const result = fbManager.createUserLocal('demo@sambandh.ai', 'demo123', {
            businessName: 'Style Studio Salon',
            businessType: 'salon',
            ownerName: 'Priya Sharma',
            mobile: '9876543210',
            city: 'Jaipur',
            plan: 'pro'
        });
        
        if (result.success) {
            // Add demo customers
            const demoCustomers = [
                { name: 'Rahul Kumar', phone: '9876543211', lastVisit: '2024-03-15', totalVisits: 5, revenue: 3500 },
                { name: 'Anita Singh', phone: '9876543212', lastVisit: '2024-03-18', totalVisits: 3, revenue: 2100 },
                { name: 'Vikram Patel', phone: '9876543213', lastVisit: '2024-03-20', totalVisits: 8, revenue: 5600 }
            ];
            
            demoCustomers.forEach(customer => {
                fbManager.addCustomerLocal(result.user.uid, customer);
            });
            
            console.log('✅ Demo account created: demo@sambandh.ai / demo123');
        }
    }
}

function checkAuth() {
    const userId = fbManager.getCurrentUserId();
    if (userId) {
        fbManager.loadUserDataLocal(userId);
    }
}

// ====================================
// NAVIGATION FUNCTIONS
// ====================================

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

// ====================================
// AUTHENTICATION HANDLERS
// ====================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading
    document.getElementById('loginBtnText').classList.add('hidden');
    document.getElementById('loginBtnLoading').classList.remove('hidden');
    
    const result = await fbManager.loginUser(email, password);
    
    // Hide loading
    document.getElementById('loginBtnText').classList.remove('hidden');
    document.getElementById('loginBtnLoading').classList.add('hidden');
    
    if (result.success) {
        closeAuthModal();
        
        const userData = await fbManager.getUserData(result.user.uid);
        if (userData && userData.role === 'admin') {
            showAdminDashboard();
        } else {
            showDashboard();
        }
        
        document.getElementById('loginForm').reset();
    } else {
        alert('Login failed: ' + result.error);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const userData = {
        businessName: document.getElementById('signupBusinessName').value,
        businessType: document.getElementById('signupBusinessType').value,
        ownerName: document.getElementById('signupOwnerName').value,
        mobile: document.getElementById('signupMobile').value,
        city: document.getElementById('signupCity').value,
        plan: document.getElementById('signupPlan').value
    };
    
    // Show loading
    document.getElementById('signupBtnText').classList.add('hidden');
    document.getElementById('signupBtnLoading').classList.remove('hidden');
    
    const result = await fbManager.createUser(email, password, userData);
    
    // Hide loading
    document.getElementById('signupBtnText').classList.remove('hidden');
    document.getElementById('signupBtnLoading').classList.add('hidden');
    
    if (result.success) {
        alert('Account created successfully! Welcome to sambandh.ai 🎉');
        closeAuthModal();
        showDashboard();
        document.getElementById('signupForm').reset();
    } else {
        alert('Signup failed: ' + result.error);
    }
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        await fbManager.logoutUser();
        showHome();
    }
}

// ====================================
// DASHBOARD FUNCTIONS
// ====================================

async function showDashboard() {
    const userId = fbManager.getCurrentUserId();
    if (!userId) {
        showHome();
        return;
    }
    
    const userData = await fbManager.getUserData(userId);
    if (!userData) {
        showHome();
        return;
    }
    
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    
    // Update dashboard data
    document.getElementById('dashboardBusinessName').textContent = 'Welcome, ' + userData.businessName + '!';
    document.getElementById('dashboardPlan').textContent = capitalizeFirstLetter(userData.plan) + ' Plan · Active';
    
    // Update stats
    document.getElementById('totalCustomers').textContent = userData.stats.totalCustomers || 0;
    document.getElementById('monthlyGrowth').textContent = (userData.stats.monthlyGrowth || 0) + '%';
    document.getElementById('campaignsSent').textContent = userData.stats.campaignsSent || 0;
    document.getElementById('retention').textContent = (userData.stats.retention || 85) + '%';
    
    // Load and display customers
    const customers = await fbManager.getCustomers(userId);
    updateCustomersTable(customers);
}

function updateCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No customers yet</div>
                    <div style="font-size: 14px;">Share your QR code to start collecting customer data!</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.slice(0, 10).map(customer => `
        <tr>
            <td style="font-weight: 600; color: var(--text-primary);">${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${formatDate(customer.lastVisit)}</td>
            <td><span class="badge badge-blue">${customer.totalVisits} visits</span></td>
            <td style="font-weight: 700; color: var(--secondary);">₹${customer.revenue || 0}</td>
            <td><span class="badge badge-green">Active</span></td>
        </tr>
    `).join('');
}

// ====================================
// ADMIN DASHBOARD FUNCTIONS
// ====================================

async function showAdminDashboard() {
    const userId = fbManager.getCurrentUserId();
    if (!userId) {
        showHome();
        return;
    }
    
    const userData = await fbManager.getUserData(userId);
    if (!userData || userData.role !== 'admin') {
        showHome();
        return;
    }
    
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    
    // Load all users
    const allUsers = await fbManager.getAllUsers();
    const businessUsers = allUsers.filter(u => u.role !== 'admin');
    const activeUsers = businessUsers.filter(u => u.isActive);
    
    // Calculate MRR & ARR
    const planPrices = { basic: 299, pro: 699, premium: 1299 };
    const mrr = activeUsers.reduce((sum, u) => sum + (planPrices[u.plan] || 0), 0);
    const arr = mrr * 12;
    
    // Update admin stats
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
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No users registered yet</div>
                    <div style="font-size: 14px;">Users will appear here once they sign up</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td style="font-weight: 600; color: var(--text-primary);">${user.businessName}</td>
            <td>${user.ownerName}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${getPlanColor(user.plan)}">${capitalizeFirstLetter(user.plan)}</span></td>
            <td>${user.city}</td>
            <td><span class="badge badge-blue">${user.stats?.totalCustomers || 0}</span></td>
            <td>${formatDate(user.createdAt)}</td>
        </tr>
    `).join('');
}

// ====================================
// QUICK ACTION HANDLERS
// ====================================

function openQRGenerator() {
    alert('🎉 QR Code Generator\n\nThis feature will generate a unique QR code for your business that customers can scan to join your database.\n\nComing soon in the next update!');
}

function openCampaignBuilder() {
    alert('📨 Campaign Builder\n\nCreate and send WhatsApp campaigns to your customers with personalized offers and messages.\n\nComing soon in the next update!');
}

function openAnalytics() {
    alert('📊 Advanced Analytics\n\nView detailed reports on customer behavior, revenue trends, campaign performance, and more.\n\nComing soon in the next update!');
}

function openBookings() {
    alert('📅 Appointment Management\n\nManage customer bookings, send reminders, and track your schedule.\n\nComing soon in the next update!');
}

function openLoyalty() {
    alert('🎁 Loyalty Program\n\nCreate digital stamp cards, referral rewards, and exclusive offers for your regulars.\n\nComing soon in the next update!');
}

function openSettings() {
    alert('⚙️ Settings\n\nUpdate your business profile, preferences, and account settings.\n\nComing soon in the next update!');
}

function exportAllData() {
    const allUsers = fbManager.getAllUsersLocal();
    const allCustomers = fbManager.getCustomersLocal('all');
    
    const exportData = {
        users: allUsers,
        customers: allCustomers,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Admin'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'sambandh_data_' + Date.now() + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('✅ Data exported successfully!');
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
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
        premium: 'purple',
        admin: 'green'
    };
    return colors[plan] || 'blue';
}

// ====================================
// GLOBAL EXPORTS
// ====================================

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
window.openQRGenerator = openQRGenerator;
window.openCampaignBuilder = openCampaignBuilder;
window.openAnalytics = openAnalytics;
window.openBookings = openBookings;
window.openLoyalty = openLoyalty;
window.openSettings = openSettings;
window.exportAllData = exportAllData;

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

console.log('🚀 sambandh.ai CRM Application loaded successfully!');
