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
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            this.fallbackToLocalStorage();
            return;
        }
        try {
            this.db = firebase.firestore();
            this.auth = firebase.auth();
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

    async createUser(email, password, userData) {
        if (this.useLocalStorage) return this.createUserLocal(email, password, userData);
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await this.db.collection('users').doc(user.uid).set({
                ...userData, uid: user.uid, email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                role: email === 'admin@sambandh.ai' ? 'admin' : 'user',
                stats: { totalCustomers: 0, monthlyGrowth: 0, campaignsSent: 0, retention: 0 }
            });
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async loginUser(email, password) {
        if (this.useLocalStorage) return this.loginUserLocal(email, password);
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
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
            return { success: false, error: error.message };
        }
    }

    async loadUserData(uid) {
        if (this.useLocalStorage) return this.loadUserDataLocal(uid);
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') showAdminDashboard();
                else showDashboard();
            }
        } catch (error) { console.error(error); }
    }

    async getUserData(uid) {
        if (this.useLocalStorage) return this.getUserDataLocal(uid);
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (error) { return null; }
    }

    async getAllUsers() {
        if (this.useLocalStorage) return this.getAllUsersLocal();
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) { return []; }
    }

    async addCustomer(userId, customerData) {
        if (this.useLocalStorage) return this.addCustomerLocal(userId, customerData);
        try {
            const customerRef = await this.db.collection('customers').add({
                userId, ...customerData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            const userRef = this.db.collection('users').doc(userId);
            await userRef.update({ 'stats.totalCustomers': firebase.firestore.FieldValue.increment(1) });
            return { success: true, id: customerRef.id };
        } catch (error) { return { success: false, error: error.message }; }
    }

    async getCustomers(userId) {
        if (this.useLocalStorage) return this.getCustomersLocal(userId);
        try {
            const snapshot = await this.db.collection('customers')
                .where('userId', '==', userId).orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) { return []; }
    }

    // LocalStorage Fallback
    createUserLocal(email, password, userData) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        if (users.some(u => u.email === email)) return { success: false, error: 'Email already exists' };
        const newUser = {
            uid: 'user_' + Date.now(), email, password, ...userData,
            createdAt: new Date().toISOString(), isActive: true,
            role: email === 'admin@sambandh.ai' ? 'admin' : 'user',
            stats: { totalCustomers: 0, monthlyGrowth: 0, campaignsSent: 0, retention: 0 }
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
            return { success: true, user };
        }
        return { success: false, error: 'Invalid email or password' };
    }

    loadUserDataLocal(uid) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        const user = users.find(u => u.uid === uid);
        if (user) {
            if (user.role === 'admin') showAdminDashboard();
            else showDashboard();
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
        const newCustomer = { id: 'cust_' + Date.now(), userId, ...customerData, createdAt: new Date().toISOString() };
        customers.push(newCustomer);
        localStorage.setItem('sambandh_customers', JSON.stringify(customers));
        const userIndex = users.findIndex(u => u.uid === userId);
        if (userIndex !== -1) {
            users[userIndex].stats.totalCustomers = (users[userIndex].stats.totalCustomers || 0) + 1;
            localStorage.setItem('sambandh_users', JSON.stringify(users));
        }
        return { success: true, id: newCustomer.id };
    }

    getCustomersLocal(userId) {
        const customers = JSON.parse(localStorage.getItem('sambandh_customers') || '[]');
        if (userId === 'all') return customers;
        return customers.filter(c => c.userId === userId);
    }

    getCurrentUserId() {
        if (this.useLocalStorage) return localStorage.getItem('sambandh_current_user');
        return this.currentUser ? this.currentUser.uid : null;
    }

    updateUserStats(uid, stats) {
        const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
        const idx = users.findIndex(u => u.uid === uid);
        if (idx !== -1) {
            users[idx].stats = { ...users[idx].stats, ...stats };
            localStorage.setItem('sambandh_users', JSON.stringify(users));
        }
    }

    saveCampaign(userId, campaign) {
        const campaigns = JSON.parse(localStorage.getItem('sambandh_campaigns') || '[]');
        const newCampaign = { id: 'camp_' + Date.now(), userId, ...campaign, sentAt: new Date().toISOString() };
        campaigns.push(newCampaign);
        localStorage.setItem('sambandh_campaigns', JSON.stringify(campaigns));
        return newCampaign;
    }

    getCampaigns(userId) {
        const campaigns = JSON.parse(localStorage.getItem('sambandh_campaigns') || '[]');
        return campaigns.filter(c => c.userId === userId);
    }

    saveBooking(userId, booking) {
        const bookings = JSON.parse(localStorage.getItem('sambandh_bookings') || '[]');
        const newBooking = { id: 'book_' + Date.now(), userId, ...booking, createdAt: new Date().toISOString() };
        bookings.push(newBooking);
        localStorage.setItem('sambandh_bookings', JSON.stringify(bookings));
        return newBooking;
    }

    getBookings(userId) {
        const bookings = JSON.parse(localStorage.getItem('sambandh_bookings') || '[]');
        return bookings.filter(b => b.userId === userId);
    }

    deleteBooking(bookingId) {
        const bookings = JSON.parse(localStorage.getItem('sambandh_bookings') || '[]');
        const filtered = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('sambandh_bookings', JSON.stringify(filtered));
    }

    saveLoyaltyCard(userId, card) {
        const cards = JSON.parse(localStorage.getItem('sambandh_loyalty') || '[]');
        const existing = cards.findIndex(c => c.userId === userId && c.customerPhone === card.customerPhone);
        if (existing !== -1) {
            cards[existing] = { ...cards[existing], ...card, updatedAt: new Date().toISOString() };
        } else {
            cards.push({ id: 'loyal_' + Date.now(), userId, ...card, createdAt: new Date().toISOString() });
        }
        localStorage.setItem('sambandh_loyalty', JSON.stringify(cards));
    }

    getLoyaltyCards(userId) {
        const cards = JSON.parse(localStorage.getItem('sambandh_loyalty') || '[]');
        return cards.filter(c => c.userId === userId);
    }

    saveSettings(userId, settings) {
        const allSettings = JSON.parse(localStorage.getItem('sambandh_settings') || '{}');
        allSettings[userId] = { ...allSettings[userId], ...settings };
        localStorage.setItem('sambandh_settings', JSON.stringify(allSettings));
    }

    getSettings(userId) {
        const allSettings = JSON.parse(localStorage.getItem('sambandh_settings') || '{}');
        return allSettings[userId] || {};
    }
}

const fbManager = new FirebaseManager();

// ====================================
// UI STATE MANAGEMENT
// ====================================

let selectedPlan = 'pro';

function init() {
    checkAuth();
    createDemoDataIfNeeded();
    injectFeatureModals();
}

function createDemoDataIfNeeded() {
    const users = fbManager.getAllUsersLocal();
    if (!users.some(u => u.email === 'admin@sambandh.ai')) {
        fbManager.createUserLocal('admin@sambandh.ai', 'admin123', {
            businessName: 'sambandh Admin', businessType: 'admin',
            ownerName: 'Admin', mobile: '9999999999', city: 'System', plan: 'admin'
        });
    }
    if (!users.some(u => u.email === 'demo@sambandh.ai')) {
        const result = fbManager.createUserLocal('demo@sambandh.ai', 'demo123', {
            businessName: 'Style Studio Salon', businessType: 'salon',
            ownerName: 'Priya Sharma', mobile: '9876543210', city: 'Jaipur', plan: 'pro'
        });
        if (result.success) {
            const demoCustomers = [
                { name: 'Rahul Kumar', phone: '9876543211', lastVisit: '2026-03-10', totalVisits: 5, revenue: 3500, birthday: '1990-08-15', status: 'active' },
                { name: 'Anita Singh', phone: '9876543212', lastVisit: '2026-02-18', totalVisits: 3, revenue: 2100, birthday: '1992-03-22', status: 'inactive' },
                { name: 'Vikram Patel', phone: '9876543213', lastVisit: '2026-03-20', totalVisits: 8, revenue: 5600, birthday: '1988-11-05', status: 'active' },
                { name: 'Sunita Sharma', phone: '9876543214', lastVisit: '2026-03-01', totalVisits: 12, revenue: 8400, birthday: '1995-06-18', status: 'active' },
                { name: 'Deepak Gupta', phone: '9876543215', lastVisit: '2026-01-15', totalVisits: 2, revenue: 1400, birthday: '1985-12-30', status: 'inactive' },
            ];
            demoCustomers.forEach(c => fbManager.addCustomerLocal(result.user.uid, c));
            fbManager.updateUserStats(result.user.uid, { totalCustomers: 5, monthlyGrowth: 18, campaignsSent: 4, retention: 87 });
            // Demo bookings
            [
                { customerName: 'Rahul Kumar', customerPhone: '9876543211', service: 'Haircut', date: '2026-03-25', time: '10:00', staff: 'Priya', status: 'confirmed', notes: '' },
                { customerName: 'Sunita Sharma', customerPhone: '9876543214', service: 'Hair Color', date: '2026-03-25', time: '14:00', staff: 'Meena', status: 'confirmed', notes: 'Highlights requested' },
                { customerName: 'Anita Singh', customerPhone: '9876543212', service: 'Facial', date: '2026-03-26', time: '11:30', staff: 'Priya', status: 'pending', notes: '' },
            ].forEach(b => fbManager.saveBooking(result.user.uid, b));
            // Demo campaigns
            [
                { name: 'Holi Special Offer', type: 'festival', message: 'Happy Holi! Enjoy 20% off all services this week. Book now!', recipients: 5, status: 'sent' },
                { name: 'Win-back Inactive', type: 'winback', message: 'We miss you! Come back and get 15% off your next visit.', recipients: 2, status: 'sent' },
            ].forEach(c => fbManager.saveCampaign(result.user.uid, c));
            // Demo loyalty cards
            [
                { customerName: 'Rahul Kumar', customerPhone: '9876543211', stamps: 5, rewardThreshold: 10, lastStamp: '2026-03-10' },
                { customerName: 'Sunita Sharma', customerPhone: '9876543214', stamps: 10, rewardThreshold: 10, lastStamp: '2026-03-01', redeemed: true },
            ].forEach(c => fbManager.saveLoyaltyCard(result.user.uid, c));
        }
    }
}

function checkAuth() {
    const userId = fbManager.getCurrentUserId();
    if (userId) fbManager.loadUserDataLocal(userId);
}

// ====================================
// NAVIGATION
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
// AUTH HANDLERS
// ====================================

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    document.getElementById('loginBtnText').classList.add('hidden');
    document.getElementById('loginBtnLoading').classList.remove('hidden');
    const result = await fbManager.loginUser(email, password);
    document.getElementById('loginBtnText').classList.remove('hidden');
    document.getElementById('loginBtnLoading').classList.add('hidden');
    if (result.success) {
        closeAuthModal();
        const userData = await fbManager.getUserData(result.user.uid);
        if (userData && userData.role === 'admin') showAdminDashboard();
        else showDashboard();
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
    document.getElementById('signupBtnText').classList.add('hidden');
    document.getElementById('signupBtnLoading').classList.remove('hidden');
    const result = await fbManager.createUser(email, password, userData);
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
// DASHBOARD
// ====================================

async function showDashboard() {
    const userId = fbManager.getCurrentUserId();
    if (!userId) { showHome(); return; }
    const userData = await fbManager.getUserData(userId);
    if (!userData) { showHome(); return; }
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('dashboardBusinessName').textContent = 'Welcome, ' + userData.businessName + '!';
    document.getElementById('dashboardPlan').textContent = capitalizeFirstLetter(userData.plan) + ' Plan · Active';
    document.getElementById('totalCustomers').textContent = userData.stats.totalCustomers || 0;
    document.getElementById('monthlyGrowth').textContent = (userData.stats.monthlyGrowth || 0) + '%';
    document.getElementById('campaignsSent').textContent = userData.stats.campaignsSent || 0;
    document.getElementById('retention').textContent = (userData.stats.retention || 85) + '%';
    const customers = await fbManager.getCustomers(userId);
    updateCustomersTable(customers);
}

function updateCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px;">📱</div><div style="font-size:16px;font-weight:600;margin-bottom:8px;">No customers yet</div><div style="font-size:14px;">Share your QR code to start collecting customer data!</div></td></tr>`;
        return;
    }
    tbody.innerHTML = customers.slice(0, 10).map(c => `
        <tr>
            <td style="font-weight:600;color:var(--text-primary);">${c.name}</td>
            <td>${c.phone}</td>
            <td>${formatDate(c.lastVisit)}</td>
            <td><span class="badge badge-blue">${c.totalVisits} visits</span></td>
            <td style="font-weight:700;color:var(--secondary);">₹${c.revenue || 0}</td>
            <td><span class="badge ${c.status === 'inactive' ? 'badge-orange' : 'badge-green'}">${c.status === 'inactive' ? 'Inactive' : 'Active'}</span></td>
        </tr>`).join('');
}

// ====================================
// ADMIN DASHBOARD
// ====================================

async function showAdminDashboard() {
    const userId = fbManager.getCurrentUserId();
    if (!userId) { showHome(); return; }
    const userData = await fbManager.getUserData(userId);
    if (!userData || userData.role !== 'admin') { showHome(); return; }
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    const allUsers = await fbManager.getAllUsers();
    const businessUsers = allUsers.filter(u => u.role !== 'admin');
    const activeUsers = businessUsers.filter(u => u.isActive);
    const planPrices = { basic: 299, pro: 699, premium: 1299 };
    const mrr = activeUsers.reduce((sum, u) => sum + (planPrices[u.plan] || 0), 0);
    document.getElementById('adminTotalUsers').textContent = businessUsers.length;
    document.getElementById('adminActiveUsers').textContent = activeUsers.length;
    document.getElementById('adminMRR').textContent = '₹' + formatNumber(mrr);
    document.getElementById('adminARR').textContent = '₹' + formatNumber(mrr * 12);
    updateAdminUsersTable(businessUsers);
}

function updateAdminUsersTable(users) {
    const tbody = document.getElementById('adminUsersTableBody');
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px;">👥</div><div style="font-size:16px;font-weight:600;margin-bottom:8px;">No users registered yet</div></td></tr>`;
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td style="font-weight:600;color:var(--text-primary);">${u.businessName}</td>
            <td>${u.ownerName}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-${getPlanColor(u.plan)}">${capitalizeFirstLetter(u.plan)}</span></td>
            <td>${u.city}</td>
            <td><span class="badge badge-blue">${u.stats?.totalCustomers || 0}</span></td>
            <td>${formatDate(u.createdAt)}</td>
        </tr>`).join('');
}

// ====================================
// FEATURE MODALS INJECTION
// ====================================

function injectFeatureModals() {
    const modalsHTML = `

    <!-- ========== QR GENERATOR MODAL ========== -->
    <div id="qrModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header">
          <h2>📱 QR Code Generator</h2>
          <button class="close-modal" onclick="closeModal('qrModal')">&times;</button>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:24px;">Print this QR code at your counter. Customers scan it to join your database and receive WhatsApp offers.</p>
        <div id="qrPreview" style="background:linear-gradient(135deg,#FFF5F0,#FFE8DC);border:2px solid var(--border);border-radius:20px;padding:32px;text-align:center;margin-bottom:24px;">
          <div id="qrBusinessLabel" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--primary);margin-bottom:4px;">Style Studio Salon</div>
          <div style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">Scan to get exclusive offers on WhatsApp!</div>
          <div id="qrCodeDisplay" style="display:inline-block;background:white;padding:16px;border-radius:16px;box-shadow:0 8px 24px rgba(255,92,0,0.15);">
            <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
              <!-- QR Code SVG Pattern -->
              <rect width="180" height="180" fill="white"/>
              <!-- Corner squares -->
              <rect x="10" y="10" width="50" height="50" fill="none" stroke="#1A1A1A" stroke-width="5"/>
              <rect x="20" y="20" width="30" height="30" fill="#1A1A1A"/>
              <rect x="120" y="10" width="50" height="50" fill="none" stroke="#1A1A1A" stroke-width="5"/>
              <rect x="130" y="20" width="30" height="30" fill="#1A1A1A"/>
              <rect x="10" y="120" width="50" height="50" fill="none" stroke="#1A1A1A" stroke-width="5"/>
              <rect x="20" y="130" width="30" height="30" fill="#1A1A1A"/>
              <!-- Data dots -->
              <rect x="70" y="10" width="10" height="10" fill="#1A1A1A"/>
              <rect x="90" y="10" width="10" height="10" fill="#1A1A1A"/>
              <rect x="100" y="20" width="10" height="10" fill="#1A1A1A"/>
              <rect x="70" y="30" width="10" height="10" fill="#1A1A1A"/>
              <rect x="90" y="40" width="10" height="10" fill="#1A1A1A"/>
              <rect x="80" y="50" width="10" height="10" fill="#1A1A1A"/>
              <rect x="10" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="30" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="50" y="80" width="10" height="10" fill="#1A1A1A"/>
              <rect x="70" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="90" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="110" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="130" y="70" width="10" height="10" fill="#1A1A1A"/>
              <rect x="150" y="80" width="10" height="10" fill="#1A1A1A"/>
              <rect x="80" y="80" width="10" height="10" fill="#1A1A1A"/>
              <rect x="100" y="90" width="10" height="10" fill="#1A1A1A"/>
              <rect x="70" y="100" width="10" height="10" fill="#1A1A1A"/>
              <rect x="90" y="110" width="10" height="10" fill="#1A1A1A"/>
              <rect x="110" y="100" width="10" height="10" fill="#1A1A1A"/>
              <rect x="130" y="110" width="10" height="10" fill="#1A1A1A"/>
              <rect x="150" y="100" width="10" height="10" fill="#1A1A1A"/>
              <rect x="70" y="120" width="10" height="10" fill="#1A1A1A"/>
              <rect x="80" y="130" width="10" height="10" fill="#1A1A1A"/>
              <rect x="100" y="140" width="10" height="10" fill="#1A1A1A"/>
              <rect x="70" y="150" width="10" height="10" fill="#1A1A1A"/>
              <rect x="110" y="150" width="10" height="10" fill="#1A1A1A"/>
              <rect x="130" y="130" width="10" height="10" fill="#1A1A1A"/>
              <rect x="150" y="150" width="10" height="10" fill="#1A1A1A"/>
              <rect x="160" y="130" width="10" height="10" fill="#1A1A1A"/>
              <!-- Sambandh logo area -->
              <rect x="77" y="77" width="26" height="26" rx="4" fill="white"/>
              <rect x="80" y="80" width="20" height="20" rx="3" fill="#FF5C00"/>
              <text x="90" y="93" text-anchor="middle" fill="white" font-size="10" font-weight="bold">S</text>
            </svg>
          </div>
          <div id="qrUrl" style="font-size:11px;color:var(--text-muted);margin-top:12px;">sambandh.ai/join/style-studio-jaipur</div>
        </div>
        <div class="form-group">
          <label>Customize Business Name on QR Standee</label>
          <input type="text" id="qrBusinessNameInput" placeholder="Your Business Name" oninput="updateQRLabel(this.value)">
        </div>
        <div class="form-group">
          <label>Welcome Message for Customers</label>
          <input type="text" id="qrWelcomeMsg" placeholder="Scan to get exclusive offers on WhatsApp!" value="Scan to get exclusive offers on WhatsApp!">
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn" onclick="downloadQR()" style="flex:1;">⬇️ Download QR (Print-Ready)</button>
          <button class="btn btn-outline" onclick="shareQRLink()" style="flex:1;">🔗 Copy QR Link</button>
        </div>
        <div style="margin-top:16px;padding:16px;background:rgba(0,201,122,0.08);border:1px solid rgba(0,201,122,0.2);border-radius:12px;">
          <div style="font-weight:700;color:var(--secondary);margin-bottom:6px;">💡 Pro Tip</div>
          <div style="font-size:13px;color:var(--text-secondary);">Print this A5 size and place it at your billing counter, reception, and near the entrance. Customers who scan get automatically added to your database.</div>
        </div>
      </div>
    </div>

    <!-- ========== CAMPAIGN BUILDER MODAL ========== -->
    <div id="campaignModal" class="modal">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header">
          <h2>📨 Send Campaign</h2>
          <button class="close-modal" onclick="closeModal('campaignModal')">&times;</button>
        </div>
        <!-- Campaign tabs -->
        <div class="form-tabs" style="margin-bottom:24px;">
          <button class="form-tab active" onclick="switchCampaignTab('new',this)">New Campaign</button>
          <button class="form-tab" onclick="switchCampaignTab('history',this)">Sent History</button>
          <button class="form-tab" onclick="switchCampaignTab('templates',this)">Templates</button>
        </div>

        <!-- New Campaign -->
        <div id="campaignTabNew">
          <div class="form-group">
            <label>Campaign Name</label>
            <input type="text" id="campName" placeholder="e.g. Diwali Special Offer">
          </div>
          <div class="form-group">
            <label>Target Audience</label>
            <select id="campAudience">
              <option value="all">All Customers (everyone)</option>
              <option value="active">Active Customers (visited in last 30 days)</option>
              <option value="inactive">Inactive Customers (no visit in 30+ days)</option>
              <option value="vip">VIP Customers (5+ visits)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="campMessage" rows="4" placeholder="Type your WhatsApp message here... Use {name} for customer name, {business} for your business name.">Hi {name}! 👋 

This is {business}. We have a special offer for you today! 

Come visit us and get 20% off on all services. Valid till this Sunday only!

See you soon! 🎉</textarea>
          </div>
          <div id="campAudiencePreview" style="padding:14px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:12px;margin-bottom:20px;font-size:14px;color:var(--text-secondary);">
            📊 Estimated reach: <strong id="campReachCount" style="color:var(--accent);">Loading...</strong>
          </div>
          <button class="btn" onclick="sendCampaign()" style="width:100%;">🚀 Send WhatsApp Campaign Now</button>
        </div>

        <!-- History -->
        <div id="campaignTabHistory" class="hidden">
          <div id="campaignHistoryList"></div>
        </div>

        <!-- Templates -->
        <div id="campaignTabTemplates" class="hidden">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;" id="templateGrid">
            ${[
              { icon:'🎊', name:'Festival Offer', msg:'Happy {festival}! 🎉 Visit {business} this week and enjoy 20% off on all services. Limited time only!' },
              { icon:'🎂', name:'Birthday Wishes', msg:'Happy Birthday {name}! 🎂 As our special customer, enjoy a FREE add-on service on your next visit. Valid for 7 days!' },
              { icon:'💔', name:'Win Back Inactive', msg:'Hi {name}, we miss you at {business}! 😊 It\'s been a while. Come back and enjoy 15% off your next visit.' },
              { icon:'⭐', name:'Review Request', msg:'Hi {name}! How was your recent visit to {business}? We\'d love to hear your feedback. Rate us on Google: [link]' },
              { icon:'🎁', name:'Loyalty Reward', msg:'Congratulations {name}! 🎁 You\'ve earned a FREE service at {business}. Come redeem it anytime this week!' },
              { icon:'📢', name:'New Service', msg:'Hi {name}! We just launched new services at {business}. Come check them out — first visit discount of 25% just for you!' },
            ].map(t => `
              <div onclick="useTemplate('${t.msg.replace(/'/g,"\\'")}','${t.name}')" style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:18px;cursor:pointer;transition:all 0.3s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
                <div style="font-size:28px;margin-bottom:8px;">${t.icon}</div>
                <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${t.name}</div>
                <div style="font-size:12px;color:var(--text-muted);line-height:1.5;">${t.msg.substring(0,60)}...</div>
                <div style="margin-top:10px;font-size:12px;color:var(--primary);font-weight:600;">Use this template →</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- ========== ANALYTICS MODAL ========== -->
    <div id="analyticsModal" class="modal">
      <div class="modal-content" style="max-width:780px;">
        <div class="modal-header">
          <h2>📊 Analytics & Insights</h2>
          <button class="close-modal" onclick="closeModal('analyticsModal')">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;" id="analyticsStatsGrid"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
          <!-- Monthly Visits Chart -->
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:16px;">📈 Monthly Customer Visits</div>
            <div id="visitsChart" style="height:120px;display:flex;align-items:flex-end;gap:6px;"></div>
            <div id="visitsChartLabels" style="display:flex;gap:6px;margin-top:6px;"></div>
          </div>
          <!-- Revenue Chart -->
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:16px;">💰 Revenue Trend</div>
            <div id="revenueChart" style="height:120px;display:flex;align-items:flex-end;gap:6px;"></div>
            <div id="revenueChartLabels" style="display:flex;gap:6px;margin-top:6px;"></div>
          </div>
        </div>
        <!-- Customer Segments -->
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;margin-bottom:20px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:16px;">👥 Customer Segments</div>
          <div id="segmentsGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"></div>
        </div>
        <!-- Top Customers -->
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;">
          <div style="font-weight:700;font-size:15px;margin-bottom:16px;">🏆 Top Customers by Revenue</div>
          <div id="topCustomersList"></div>
        </div>
      </div>
    </div>

    <!-- ========== BOOKINGS MODAL ========== -->
    <div id="bookingsModal" class="modal">
      <div class="modal-content" style="max-width:760px;">
        <div class="modal-header">
          <h2>📅 Manage Bookings</h2>
          <button class="close-modal" onclick="closeModal('bookingsModal')">&times;</button>
        </div>
        <div class="form-tabs" style="margin-bottom:24px;">
          <button class="form-tab active" onclick="switchBookingTab('upcoming',this)">Upcoming</button>
          <button class="form-tab" onclick="switchBookingTab('add',this)">Add Booking</button>
          <button class="form-tab" onclick="switchBookingTab('all',this)">All Bookings</button>
        </div>
        <!-- Upcoming -->
        <div id="bookingTabUpcoming">
          <div id="upcomingBookingsList"></div>
        </div>
        <!-- Add Booking -->
        <div id="bookingTabAdd" class="hidden">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Customer Name *</label>
              <input type="text" id="bookCustName" placeholder="Customer full name">
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input type="tel" id="bookCustPhone" placeholder="9876543210">
            </div>
            <div class="form-group">
              <label>Service *</label>
              <select id="bookService">
                <option value="Haircut">Haircut</option>
                <option value="Hair Color">Hair Color</option>
                <option value="Facial">Facial</option>
                <option value="Hair Spa">Hair Spa</option>
                <option value="Threading">Threading</option>
                <option value="Manicure">Manicure</option>
                <option value="Pedicure">Pedicure</option>
                <option value="Waxing">Waxing</option>
                <option value="Makeup">Makeup</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Staff Member</label>
              <input type="text" id="bookStaff" placeholder="Staff name">
            </div>
            <div class="form-group">
              <label>Date *</label>
              <input type="date" id="bookDate">
            </div>
            <div class="form-group">
              <label>Time *</label>
              <input type="time" id="bookTime">
            </div>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="bookNotes" rows="2" placeholder="Any special instructions..."></textarea>
          </div>
          <button class="btn" onclick="addBooking()" style="width:100%;">✅ Confirm Booking</button>
        </div>
        <!-- All bookings -->
        <div id="bookingTabAll" class="hidden">
          <div id="allBookingsList"></div>
        </div>
      </div>
    </div>

    <!-- ========== LOYALTY MODAL ========== -->
    <div id="loyaltyModal" class="modal">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header">
          <h2>🎁 Loyalty Program</h2>
          <button class="close-modal" onclick="closeModal('loyaltyModal')">&times;</button>
        </div>
        <div class="form-tabs" style="margin-bottom:24px;">
          <button class="form-tab active" onclick="switchLoyaltyTab('cards',this)">Loyalty Cards</button>
          <button class="form-tab" onclick="switchLoyaltyTab('add',this)">Add Stamp</button>
          <button class="form-tab" onclick="switchLoyaltyTab('settings',this)">Program Settings</button>
        </div>
        <!-- Cards -->
        <div id="loyaltyTabCards">
          <div id="loyaltyCardsList"></div>
        </div>
        <!-- Add stamp -->
        <div id="loyaltyTabAdd" class="hidden">
          <div style="background:linear-gradient(135deg,rgba(255,92,0,0.08),rgba(255,138,77,0.05));border:2px solid rgba(255,92,0,0.2);border-radius:16px;padding:24px;margin-bottom:20px;">
            <div style="font-weight:700;font-size:16px;margin-bottom:4px;">Add Visit Stamp</div>
            <div style="font-size:13px;color:var(--text-secondary);">Add a stamp when a customer visits. After 10 stamps, they earn a free service!</div>
          </div>
          <div class="form-group">
            <label>Customer Phone Number</label>
            <input type="tel" id="loyaltyPhone" placeholder="9876543210" oninput="lookupLoyaltyCustomer(this.value)">
          </div>
          <div id="loyaltyCustomerPreview" style="display:none;padding:16px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;margin-bottom:16px;"></div>
          <div class="form-group">
            <label>Customer Name (if new)</label>
            <input type="text" id="loyaltyName" placeholder="Customer name">
          </div>
          <button class="btn" onclick="addLoyaltyStamp()" style="width:100%;">✅ Add Visit Stamp</button>
        </div>
        <!-- Settings -->
        <div id="loyaltyTabSettings" class="hidden">
          <div style="display:grid;gap:16px;">
            <div class="form-group">
              <label>Stamps Required for Free Reward</label>
              <input type="number" id="loyaltyThreshold" value="10" min="3" max="20">
            </div>
            <div class="form-group">
              <label>Reward Description</label>
              <input type="text" id="loyaltyReward" value="1 Free Haircut" placeholder="e.g. 1 Free Haircut, 30% Discount">
            </div>
            <div class="form-group">
              <label>Expiry (days after earning)</label>
              <input type="number" id="loyaltyExpiry" value="30" min="7" max="365">
            </div>
            <button class="btn" onclick="saveLoyaltySettings()" style="width:100%;">💾 Save Program Settings</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== SETTINGS MODAL ========== -->
    <div id="settingsModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header">
          <h2>⚙️ Settings</h2>
          <button class="close-modal" onclick="closeModal('settingsModal')">&times;</button>
        </div>
        <div class="form-tabs" style="margin-bottom:24px;">
          <button class="form-tab active" onclick="switchSettingsTab('profile',this)">Business Profile</button>
          <button class="form-tab" onclick="switchSettingsTab('notifications',this)">Notifications</button>
          <button class="form-tab" onclick="switchSettingsTab('team',this)">Team / Staff</button>
        </div>
        <!-- Profile -->
        <div id="settingsTabProfile">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group" style="grid-column:1/-1;">
              <label>Business Name</label>
              <input type="text" id="settingsBizName" placeholder="Your Business Name">
            </div>
            <div class="form-group">
              <label>Business Type</label>
              <select id="settingsBizType">
                <option value="salon">Salon / Beauty Parlor</option>
                <option value="restaurant">Restaurant / Cafe</option>
                <option value="gym">Gym / Fitness Center</option>
                <option value="clinic">Clinic / Spa</option>
                <option value="retail">Retail Shop</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Owner Name</label>
              <input type="text" id="settingsOwnerName" placeholder="Owner full name">
            </div>
            <div class="form-group">
              <label>Mobile Number</label>
              <input type="tel" id="settingsMobile" placeholder="9876543210">
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" id="settingsCity" placeholder="Jaipur">
            </div>
            <div class="form-group">
              <label>Address</label>
              <input type="text" id="settingsAddress" placeholder="Shop address">
            </div>
            <div class="form-group">
              <label>Google Maps Link</label>
              <input type="url" id="settingsGmaps" placeholder="https://maps.google.com/...">
            </div>
            <div class="form-group">
              <label>Working Hours</label>
              <input type="text" id="settingsHours" placeholder="e.g. 9 AM - 9 PM">
            </div>
          </div>
          <button class="btn" onclick="saveProfileSettings()" style="width:100%;">💾 Save Business Profile</button>
        </div>
        <!-- Notifications -->
        <div id="settingsTabNotifications" class="hidden">
          <div style="display:flex;flex-direction:column;gap:16px;">
            ${[
              { id:'notifBirthday', label:'Birthday Auto-Messages', desc:'Automatically send birthday wishes to customers', def:true },
              { id:'notifInactive', label:'Inactive Customer Alerts', desc:'Alert when customers haven\'t visited in 30 days', def:true },
              { id:'notifReview', label:'Google Review Requests', desc:'Auto-send review request after each visit', def:false },
              { id:'notifFestival', label:'Festival Campaign Reminders', desc:'Remind you before upcoming festivals to send campaigns', def:true },
              { id:'notifBooking', label:'Booking Confirmations', desc:'Send WhatsApp confirmation for every new booking', def:true },
            ].map(n => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;">
                <div>
                  <div style="font-weight:700;font-size:14px;">${n.label}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${n.desc}</div>
                </div>
                <label style="position:relative;display:inline-block;width:48px;height:26px;flex-shrink:0;">
                  <input type="checkbox" id="${n.id}" ${n.def ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                  <span onclick="toggleSwitch('${n.id}')" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${n.def ? 'var(--secondary)' : 'var(--border)'};border-radius:26px;transition:0.3s;" id="${n.id}Span">
                    <span style="position:absolute;height:20px;width:20px;left:${n.def ? '24px' : '4px'};bottom:3px;background:white;border-radius:50%;transition:0.3s;" id="${n.id}Knob"></span>
                  </span>
                </label>
              </div>`).join('')}
            <button class="btn" onclick="saveNotificationSettings()" style="width:100%;">💾 Save Notification Settings</button>
          </div>
        </div>
        <!-- Team -->
        <div id="settingsTabTeam" class="hidden">
          <div id="staffList" style="margin-bottom:20px;"></div>
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:16px;">➕ Add Staff Member</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label>Name</label>
                <input type="text" id="staffName" placeholder="Staff member name">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label>Role</label>
                <input type="text" id="staffRole" placeholder="e.g. Stylist, Receptionist">
              </div>
            </div>
            <button class="btn" onclick="addStaffMember()" style="width:100%;margin-top:16px;">Add Staff</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== TOAST NOTIFICATION ========== -->
    <div id="toastNotification" style="position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);background:#1A1A1A;color:white;padding:14px 24px;border-radius:12px;font-weight:600;font-size:14px;z-index:9999;transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;max-width:400px;">
      <span id="toastIcon">✅</span>
      <span id="toastMessage">Saved!</span>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalsHTML);

    // Set today as default booking date
    const today = new Date().toISOString().split('T')[0];
    const bookDateEl = document.getElementById('bookDate');
    if (bookDateEl) bookDateEl.value = today;
}

// ====================================
// TOAST NOTIFICATION
// ====================================

function showToast(message, icon = '✅', duration = 3000) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastIcon').textContent = icon;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(80px)'; }, duration);
}

// ====================================
// MODAL HELPERS
// ====================================

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

// Close modals on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ====================================
// 1. QR GENERATOR
// ====================================

async function openQRGenerator() {
    openModal('qrModal');
    const userId = fbManager.getCurrentUserId();
    const userData = await fbManager.getUserData(userId);
    if (userData) {
        document.getElementById('qrBusinessLabel').textContent = userData.businessName;
        document.getElementById('qrBusinessNameInput').value = userData.businessName;
        document.getElementById('qrUrl').textContent = `sambandh.ai/join/${userData.businessName.toLowerCase().replace(/\s+/g,'-')}-${userData.city.toLowerCase()}`;
    }
}

function updateQRLabel(val) {
    document.getElementById('qrBusinessLabel').textContent = val || 'Your Business';
}

function downloadQR() {
    const preview = document.getElementById('qrPreview');
    // Create a canvas to "export" the QR
    const svg = preview.querySelector('svg');
    const bizName = document.getElementById('qrBusinessLabel').textContent;
    const welcomeMsg = document.getElementById('qrWelcomeMsg').value;

    // Create printable HTML
    const printContent = `<!DOCTYPE html>
<html><head><title>QR Code - ${bizName}</title>
<style>
  body{font-family:sans-serif;text-align:center;padding:40px;background:#FFF5F0;}
  .container{background:white;border-radius:24px;padding:40px;max-width:400px;margin:0 auto;box-shadow:0 8px 32px rgba(255,92,0,0.1);}
  h2{color:#FF5C00;font-size:28px;margin-bottom:8px;}
  p{color:#6B7280;font-size:14px;margin-bottom:24px;}
  svg{width:200px;height:200px;}
  .url{font-size:11px;color:#9CA3AF;margin-top:12px;}
  @media print{body{background:white;}}
</style></head><body>
<div class="container">
  <h2>${bizName}</h2>
  <p>${welcomeMsg}</p>
  ${svg.outerHTML}
  <div class="url">${document.getElementById('qrUrl').textContent}</div>
</div></body></html>`;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bizName.replace(/\s+/g,'-')}-QR-Code.html`;
    a.click();
    showToast('QR Code downloaded! Open the file and print.', '🖨️');
}

function shareQRLink() {
    const link = document.getElementById('qrUrl').textContent;
    const fullLink = 'https://' + link;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullLink);
        showToast('QR link copied to clipboard!', '🔗');
    } else {
        prompt('Copy this link:', fullLink);
    }
}

// ====================================
// 2. CAMPAIGN BUILDER
// ====================================

async function openCampaignBuilder() {
    openModal('campaignModal');
    updateCampaignReach();
    loadCampaignHistory();
}

function switchCampaignTab(tab, btn) {
    ['new','history','templates'].forEach(t => {
        document.getElementById('campaignTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('hidden');
    });
    document.querySelectorAll('#campaignModal .form-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('campaignTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    btn.classList.add('active');
    if (tab === 'history') loadCampaignHistory();
}

async function updateCampaignReach() {
    const userId = fbManager.getCurrentUserId();
    const customers = fbManager.getCustomersLocal(userId);
    const audience = document.getElementById('campAudience')?.value || 'all';
    let count = customers.length;
    if (audience === 'active') count = customers.filter(c => c.status !== 'inactive').length;
    else if (audience === 'inactive') count = customers.filter(c => c.status === 'inactive').length;
    else if (audience === 'vip') count = customers.filter(c => c.totalVisits >= 5).length;
    const el = document.getElementById('campReachCount');
    if (el) el.textContent = count + ' customers via WhatsApp';
}

document.addEventListener('change', (e) => {
    if (e.target.id === 'campAudience') updateCampaignReach();
});

async function sendCampaign() {
    const name = document.getElementById('campName').value.trim();
    const message = document.getElementById('campMessage').value.trim();
    const audience = document.getElementById('campAudience').value;

    if (!name) { showToast('Please enter a campaign name', '⚠️'); return; }
    if (!message) { showToast('Please write a message', '⚠️'); return; }

    const userId = fbManager.getCurrentUserId();
    const userData = await fbManager.getUserData(userId);
    const customers = fbManager.getCustomersLocal(userId);

    let targets = customers;
    if (audience === 'active') targets = customers.filter(c => c.status !== 'inactive');
    else if (audience === 'inactive') targets = customers.filter(c => c.status === 'inactive');
    else if (audience === 'vip') targets = customers.filter(c => c.totalVisits >= 5);

    // Save campaign
    const campaign = fbManager.saveCampaign(userId, {
        name, message, audience, recipients: targets.length, status: 'sent',
        type: 'custom'
    });

    // Update stats
    const currStats = (await fbManager.getUserData(userId))?.stats || {};
    fbManager.updateUserStats(userId, {
        campaignsSent: (currStats.campaignsSent || 0) + 1
    });

    // Simulate sending with a preview
    const preview = targets.slice(0, 3).map(c =>
        message.replace('{name}', c.name).replace('{business}', userData?.businessName || 'Your Business')
    ).join('\n\n---\n\n');

    showToast(`Campaign "${name}" sent to ${targets.length} customers! 🚀`, '📨');
    document.getElementById('campName').value = '';
    document.getElementById('campMessage').value = '';

    // Show preview dialog
    setTimeout(() => {
        if (confirm(`✅ Campaign sent to ${targets.length} customers!\n\nPreview of messages sent:\n\n${preview}\n\nNote: In production, these go via WhatsApp Business API.`)) {}
    }, 500);

    // Refresh dashboard
    showDashboard();
}

function loadCampaignHistory() {
    const userId = fbManager.getCurrentUserId();
    const campaigns = fbManager.getCampaigns(userId);
    const container = document.getElementById('campaignHistoryList');
    if (!container) return;
    if (campaigns.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">📭</div><div>No campaigns sent yet</div></div>`;
        return;
    }
    container.innerHTML = campaigns.reverse().map(c => `
        <div style="padding:18px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-weight:700;font-size:15px;">${c.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${formatDate(c.sentAt)} · ${c.audience || 'All'} customers</div>
                </div>
                <span class="badge badge-green">${c.recipients || 0} sent</span>
            </div>
            <div style="margin-top:10px;font-size:13px;color:var(--text-secondary);background:white;padding:10px 14px;border-radius:8px;border:1px solid var(--border-light);">${(c.message || '').substring(0,120)}${c.message?.length > 120 ? '...' : ''}</div>
        </div>`).join('');
}

function useTemplate(msg, name) {
    document.getElementById('campMessage').value = msg;
    document.getElementById('campName').value = name;
    // Switch to new tab
    const newTabBtn = document.querySelector('#campaignModal .form-tab');
    switchCampaignTab('new', newTabBtn);
    showToast(`Template "${name}" loaded!`, '📋');
}

// ====================================
// 3. ANALYTICS
// ====================================

async function openAnalytics() {
    openModal('analyticsModal');
    const userId = fbManager.getCurrentUserId();
    const userData = await fbManager.getUserData(userId);
    const customers = fbManager.getCustomersLocal(userId);
    const campaigns = fbManager.getCampaigns(userId);

    const totalRevenue = customers.reduce((sum, c) => sum + (parseInt(c.revenue) || 0), 0);
    const activeCustomers = customers.filter(c => c.status !== 'inactive').length;
    const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
    const avgRevenue = customers.length ? Math.round(totalRevenue / customers.length) : 0;

    // Stats grid
    document.getElementById('analyticsStatsGrid').innerHTML = [
        { icon:'👥', label:'Total Customers', value: customers.length, color:'var(--primary)' },
        { icon:'💰', label:'Total Revenue', value: '₹' + formatNumber(totalRevenue), color:'var(--secondary)' },
        { icon:'📊', label:'Avg. Revenue/Customer', value: '₹' + avgRevenue, color:'var(--accent)' },
        { icon:'📨', label:'Campaigns Sent', value: campaigns.length, color:'var(--purple)' },
    ].map(s => `
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:18px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">${s.icon}</div>
            <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${s.color};">${s.value}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${s.label}</div>
        </div>`).join('');

    // Monthly visits bar chart (simulated data)
    const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const visitsData = [8, 12, 15, 11, 18, customers.length];
    const revenueData = [5600, 8400, 10500, 7700, 12600, totalRevenue];
    const maxV = Math.max(...visitsData);
    const maxR = Math.max(...revenueData);

    document.getElementById('visitsChart').innerHTML = visitsData.map((v, i) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="width:100%;background:linear-gradient(180deg,var(--primary),var(--primary-light));border-radius:6px 6px 0 0;height:${Math.round((v/maxV)*100)}px;min-height:4px;"></div>
            <div style="font-size:10px;color:var(--text-muted);font-weight:600;">${v}</div>
        </div>`).join('');
    document.getElementById('visitsChartLabels').innerHTML = months.map(m =>
        `<div style="flex:1;text-align:center;font-size:10px;color:var(--text-muted);">${m}</div>`).join('');

    document.getElementById('revenueChart').innerHTML = revenueData.map((v, i) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="width:100%;background:linear-gradient(180deg,var(--secondary),#00E88C);border-radius:6px 6px 0 0;height:${Math.round((v/maxR)*100)}px;min-height:4px;"></div>
            <div style="font-size:9px;color:var(--text-muted);font-weight:600;">₹${formatNumber(v)}</div>
        </div>`).join('');
    document.getElementById('revenueChartLabels').innerHTML = months.map(m =>
        `<div style="flex:1;text-align:center;font-size:10px;color:var(--text-muted);">${m}</div>`).join('');

    // Segments
    const vip = customers.filter(c => c.totalVisits >= 5).length;
    const regular = customers.filter(c => c.totalVisits >= 2 && c.totalVisits < 5).length;
    const newCusts = customers.filter(c => c.totalVisits < 2).length;
    document.getElementById('segmentsGrid').innerHTML = [
        { label:'VIP (5+ visits)', count: vip, color:'var(--purple)', icon:'👑' },
        { label:'Regular (2-4 visits)', count: regular, color:'var(--accent)', icon:'🔄' },
        { label:'New (1 visit)', count: newCusts, color:'var(--secondary)', icon:'🆕' },
        { label:'Active', count: activeCustomers, color:'var(--secondary)', icon:'✅' },
        { label:'Inactive (30+ days)', count: inactiveCustomers, color:'#EF4444', icon:'💤' },
        { label:'Total Campaigns', count: campaigns.length, color:'var(--primary)', icon:'📨' },
    ].map(s => `
        <div style="padding:14px;background:white;border:2px solid var(--border);border-radius:12px;text-align:center;">
            <div style="font-size:24px;">${s.icon}</div>
            <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${s.color};">${s.count}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${s.label}</div>
        </div>`).join('');

    // Top customers
    const sorted = [...customers].sort((a,b) => (b.revenue||0) - (a.revenue||0)).slice(0, 5);
    document.getElementById('topCustomersList').innerHTML = sorted.length ? sorted.map((c, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light);">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-light));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;">${i+1}</div>
                <div>
                    <div style="font-weight:600;">${c.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${c.totalVisits} visits</div>
                </div>
            </div>
            <div style="font-weight:700;color:var(--secondary);">₹${c.revenue || 0}</div>
        </div>`).join('') : '<div style="text-align:center;color:var(--text-muted);padding:20px;">No customer data yet</div>';
}

// ====================================
// 4. BOOKINGS
// ====================================

async function openBookings() {
    openModal('bookingsModal');
    loadUpcomingBookings();
    loadAllBookings();
}

function switchBookingTab(tab, btn) {
    ['upcoming','add','all'].forEach(t => {
        document.getElementById('bookingTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('hidden');
    });
    document.querySelectorAll('#bookingsModal .form-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('bookingTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    btn.classList.add('active');
}

function loadUpcomingBookings() {
    const userId = fbManager.getCurrentUserId();
    const bookings = fbManager.getBookings(userId);
    const today = new Date().toISOString().split('T')[0];
    const upcoming = bookings.filter(b => b.date >= today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    const container = document.getElementById('upcomingBookingsList');
    if (!container) return;
    if (upcoming.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">📅</div><div style="font-weight:600;margin-bottom:8px;">No upcoming bookings</div><div style="font-size:14px;">Add a booking to get started!</div></div>`;
        return;
    }
    container.innerHTML = upcoming.map(b => `
        <div style="padding:18px;background:var(--bg-main);border:2px solid var(--border);border-radius:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:48px;height:48px;background:var(--gradient-primary);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;">
                    <div style="font-size:11px;font-weight:700;">${new Date(b.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                    <div style="font-size:12px;">${b.time}</div>
                </div>
                <div>
                    <div style="font-weight:700;">${b.customerName}</div>
                    <div style="font-size:13px;color:var(--text-secondary);">${b.service}${b.staff ? ' · ' + b.staff : ''}</div>
                    ${b.notes ? `<div style="font-size:12px;color:var(--text-muted);">${b.notes}</div>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <span class="badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-orange'}">${b.status}</span>
                <button onclick="deleteBooking('${b.id}')" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">Delete</button>
            </div>
        </div>`).join('');
}

function loadAllBookings() {
    const userId = fbManager.getCurrentUserId();
    const bookings = fbManager.getBookings(userId).sort((a,b) => b.createdAt?.localeCompare(a.createdAt));
    const container = document.getElementById('allBookingsList');
    if (!container) return;
    if (bookings.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">No bookings yet</div>`;
        return;
    }
    container.innerHTML = bookings.map(b => `
        <div style="padding:14px 18px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
                <div style="font-weight:600;">${b.customerName} — ${b.service}</div>
                <div style="font-size:12px;color:var(--text-muted);">${b.date} at ${b.time}${b.staff ? ' · ' + b.staff : ''}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <span class="badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-orange'}">${b.status}</span>
                <button onclick="deleteBooking('${b.id}')" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">✕</button>
            </div>
        </div>`).join('');
}

function addBooking() {
    const name = document.getElementById('bookCustName').value.trim();
    const phone = document.getElementById('bookCustPhone').value.trim();
    const service = document.getElementById('bookService').value;
    const staff = document.getElementById('bookStaff').value.trim();
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;
    const notes = document.getElementById('bookNotes').value.trim();

    if (!name || !phone || !date || !time) {
        showToast('Please fill all required fields', '⚠️');
        return;
    }

    const userId = fbManager.getCurrentUserId();
    fbManager.saveBooking(userId, { customerName: name, customerPhone: phone, service, staff, date, time, notes, status: 'confirmed' });

    showToast(`Booking confirmed for ${name} on ${date}!`, '📅');
    document.getElementById('bookCustName').value = '';
    document.getElementById('bookCustPhone').value = '';
    document.getElementById('bookStaff').value = '';
    document.getElementById('bookNotes').value = '';
    loadUpcomingBookings();
    loadAllBookings();
    // Switch to upcoming tab
    const upcomingBtn = document.querySelector('#bookingsModal .form-tab');
    switchBookingTab('upcoming', upcomingBtn);
}

function deleteBooking(id) {
    if (confirm('Delete this booking?')) {
        fbManager.deleteBooking(id);
        showToast('Booking deleted', '🗑️');
        loadUpcomingBookings();
        loadAllBookings();
    }
}

// ====================================
// 5. LOYALTY PROGRAM
// ====================================

async function openLoyalty() {
    openModal('loyaltyModal');
    loadLoyaltyCards();
}

function switchLoyaltyTab(tab, btn) {
    ['cards','add','settings'].forEach(t => {
        document.getElementById('loyaltyTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('hidden');
    });
    document.querySelectorAll('#loyaltyModal .form-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('loyaltyTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    btn.classList.add('active');
}

function loadLoyaltyCards() {
    const userId = fbManager.getCurrentUserId();
    const cards = fbManager.getLoyaltyCards(userId);
    const container = document.getElementById('loyaltyCardsList');
    if (!container) return;
    if (cards.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:48px;margin-bottom:16px;">🎁</div><div style="font-weight:600;margin-bottom:8px;">No loyalty cards yet</div><div style="font-size:14px;">Add stamps when customers visit!</div></div>`;
        return;
    }
    container.innerHTML = cards.map(c => {
        const threshold = c.rewardThreshold || 10;
        const stamps = Math.min(c.stamps || 0, threshold);
        const pct = Math.round((stamps / threshold) * 100);
        return `
        <div style="padding:20px;background:${c.redeemed ? 'rgba(0,201,122,0.06)' : 'var(--bg-main)'};border:2px solid ${c.redeemed ? 'var(--secondary)' : 'var(--border)'};border-radius:16px;margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div>
                    <div style="font-weight:700;font-size:16px;">${c.customerName}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${c.customerPhone}</div>
                </div>
                <div style="text-align:right;">
                    ${c.redeemed ? '<span class="badge badge-green">Reward Earned! 🎉</span>' : `<span class="badge badge-blue">${stamps}/${threshold} stamps</span>`}
                </div>
            </div>
            <!-- Stamp progress -->
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                ${Array.from({length: threshold}, (_, i) => `
                    <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${i < stamps ? 'var(--primary)' : 'var(--border)'};background:${i < stamps ? 'var(--gradient-primary)' : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:12px;">
                        ${i < stamps ? '✓' : ''}
                    </div>`).join('')}
            </div>
            <div style="height:6px;background:var(--border);border-radius:100px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:var(--gradient-primary);border-radius:100px;transition:width 1s;"></div>
            </div>
            ${!c.redeemed && stamps >= threshold ? `<div style="margin-top:12px;padding:10px;background:rgba(0,201,122,0.1);border-radius:8px;text-align:center;font-weight:700;color:var(--secondary);">🎉 Free reward ready to redeem!</div>` : ''}
        </div>`}).join('');
}

function lookupLoyaltyCustomer(phone) {
    if (phone.length < 10) { document.getElementById('loyaltyCustomerPreview').style.display = 'none'; return; }
    const userId = fbManager.getCurrentUserId();
    const cards = fbManager.getLoyaltyCards(userId);
    const existing = cards.find(c => c.customerPhone === phone);
    const preview = document.getElementById('loyaltyCustomerPreview');
    if (existing) {
        preview.style.display = 'block';
        preview.innerHTML = `<div style="font-weight:600;color:var(--primary);">Customer Found: ${existing.customerName}</div><div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">Current stamps: ${existing.stamps}/${existing.rewardThreshold || 10}</div>`;
        document.getElementById('loyaltyName').value = existing.customerName;
    } else {
        preview.style.display = 'block';
        preview.innerHTML = `<div style="font-size:13px;color:var(--text-muted);">New customer — enter their name below</div>`;
    }
}

function addLoyaltyStamp() {
    const phone = document.getElementById('loyaltyPhone').value.trim();
    const name = document.getElementById('loyaltyName').value.trim();

    if (!phone || phone.length < 10) { showToast('Please enter a valid phone number', '⚠️'); return; }

    const userId = fbManager.getCurrentUserId();
    const cards = fbManager.getLoyaltyCards(userId);
    const existing = cards.find(c => c.customerPhone === phone);
    const threshold = 10;

    const newStamps = (existing?.stamps || 0) + 1;
    fbManager.saveLoyaltyCard(userId, {
        customerName: name || existing?.customerName || 'Customer',
        customerPhone: phone,
        stamps: newStamps,
        rewardThreshold: existing?.rewardThreshold || threshold,
        lastStamp: new Date().toISOString().split('T')[0],
        redeemed: newStamps >= threshold ? (existing?.redeemed || false) : false
    });

    if (newStamps >= threshold) {
        showToast(`🎉 ${name || 'Customer'} earned their FREE reward!`, '🏆', 5000);
    } else {
        showToast(`Stamp added! ${name || 'Customer'} has ${newStamps}/${threshold} stamps`, '✅');
    }

    document.getElementById('loyaltyPhone').value = '';
    document.getElementById('loyaltyName').value = '';
    document.getElementById('loyaltyCustomerPreview').style.display = 'none';
    loadLoyaltyCards();
}

function saveLoyaltySettings() {
    const threshold = document.getElementById('loyaltyThreshold').value;
    const reward = document.getElementById('loyaltyReward').value;
    const expiry = document.getElementById('loyaltyExpiry').value;
    const userId = fbManager.getCurrentUserId();
    fbManager.saveSettings(userId, { loyaltyThreshold: threshold, loyaltyReward: reward, loyaltyExpiry: expiry });
    showToast('Loyalty program settings saved!', '💾');
}

// ====================================
// 6. SETTINGS
// ====================================

async function openSettings() {
    openModal('settingsModal');
    const userId = fbManager.getCurrentUserId();
    const userData = await fbManager.getUserData(userId);
    const savedSettings = fbManager.getSettings(userId);
    if (userData) {
        document.getElementById('settingsBizName').value = savedSettings.businessName || userData.businessName || '';
        document.getElementById('settingsBizType').value = savedSettings.businessType || userData.businessType || 'salon';
        document.getElementById('settingsOwnerName').value = savedSettings.ownerName || userData.ownerName || '';
        document.getElementById('settingsMobile').value = savedSettings.mobile || userData.mobile || '';
        document.getElementById('settingsCity').value = savedSettings.city || userData.city || '';
        document.getElementById('settingsAddress').value = savedSettings.address || '';
        document.getElementById('settingsGmaps').value = savedSettings.gmaps || '';
        document.getElementById('settingsHours').value = savedSettings.hours || '9 AM - 9 PM';
    }
    loadStaffList();
}

function switchSettingsTab(tab, btn) {
    ['profile','notifications','team'].forEach(t => {
        document.getElementById('settingsTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('hidden');
    });
    document.querySelectorAll('#settingsModal .form-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('settingsTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    btn.classList.add('active');
    if (tab === 'team') loadStaffList();
}

function saveProfileSettings() {
    const userId = fbManager.getCurrentUserId();
    fbManager.saveSettings(userId, {
        businessName: document.getElementById('settingsBizName').value,
        businessType: document.getElementById('settingsBizType').value,
        ownerName: document.getElementById('settingsOwnerName').value,
        mobile: document.getElementById('settingsMobile').value,
        city: document.getElementById('settingsCity').value,
        address: document.getElementById('settingsAddress').value,
        gmaps: document.getElementById('settingsGmaps').value,
        hours: document.getElementById('settingsHours').value,
    });
    showToast('Business profile saved!', '💾');
}

function toggleSwitch(id) {
    const checkbox = document.getElementById(id);
    const span = document.getElementById(id + 'Span');
    const knob = document.getElementById(id + 'Knob');
    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
        span.style.background = 'var(--secondary)';
        knob.style.left = '24px';
    } else {
        span.style.background = 'var(--border)';
        knob.style.left = '4px';
    }
}

function saveNotificationSettings() {
    const userId = fbManager.getCurrentUserId();
    const settings = {};
    ['notifBirthday','notifInactive','notifReview','notifFestival','notifBooking'].forEach(id => {
        const el = document.getElementById(id);
        if (el) settings[id] = el.checked;
    });
    fbManager.saveSettings(userId, settings);
    showToast('Notification settings saved!', '🔔');
}

function loadStaffList() {
    const userId = fbManager.getCurrentUserId();
    const settings = fbManager.getSettings(userId);
    const staff = settings.staff || [];
    const container = document.getElementById('staffList');
    if (!container) return;
    if (staff.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);background:var(--bg-main);border-radius:12px;margin-bottom:16px;font-size:14px;">No staff added yet</div>`;
        return;
    }
    container.innerHTML = `<div style="margin-bottom:16px;">${staff.map((s, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;margin-bottom:8px;">
            <div>
                <span style="font-weight:600;">${s.name}</span>
                <span style="font-size:12px;color:var(--text-muted);margin-left:8px;">${s.role}</span>
            </div>
            <button onclick="removeStaff(${i})" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">Remove</button>
        </div>`).join('')}</div>`;
}

function addStaffMember() {
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value.trim();
    if (!name) { showToast('Please enter staff name', '⚠️'); return; }
    const userId = fbManager.getCurrentUserId();
    const settings = fbManager.getSettings(userId);
    const staff = settings.staff || [];
    staff.push({ name, role: role || 'Staff' });
    fbManager.saveSettings(userId, { staff });
    document.getElementById('staffName').value = '';
    document.getElementById('staffRole').value = '';
    loadStaffList();
    showToast(`${name} added to your team!`, '👤');
}

function removeStaff(index) {
    const userId = fbManager.getCurrentUserId();
    const settings = fbManager.getSettings(userId);
    const staff = settings.staff || [];
    staff.splice(index, 1);
    fbManager.saveSettings(userId, { staff });
    loadStaffList();
    showToast('Staff member removed', '🗑️');
}

// ====================================
// ADMIN FUNCTIONS
// ====================================

async function showAdminDashboard() {
    const userId = fbManager.getCurrentUserId();
    if (!userId) { showHome(); return; }
    const userData = await fbManager.getUserData(userId);
    if (!userData || userData.role !== 'admin') { showHome(); return; }
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    const allUsers = await fbManager.getAllUsers();
    const businessUsers = allUsers.filter(u => u.role !== 'admin');
    const activeUsers = businessUsers.filter(u => u.isActive);
    const planPrices = { basic: 299, pro: 699, premium: 1299 };
    const mrr = activeUsers.reduce((sum, u) => sum + (planPrices[u.plan] || 0), 0);
    document.getElementById('adminTotalUsers').textContent = businessUsers.length;
    document.getElementById('adminActiveUsers').textContent = activeUsers.length;
    document.getElementById('adminMRR').textContent = '₹' + formatNumber(mrr);
    document.getElementById('adminARR').textContent = '₹' + formatNumber(mrr * 12);
    updateAdminUsersTable(businessUsers);
}

function exportAllData() {
    const allUsers = fbManager.getAllUsersLocal();
    const allCustomers = fbManager.getCustomersLocal('all');
    const exportData = { users: allUsers, customers: allCustomers, exportedAt: new Date().toISOString() };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const a = document.createElement('a');
    a.setAttribute('href', dataUri);
    a.setAttribute('download', 'sambandh_data_' + Date.now() + '.json');
    a.click();
    showToast('Data exported successfully!', '📥');
}

// ====================================
// UTILITIES
// ====================================

function capitalizeFirstLetter(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function formatDate(d) {
    if (!d) return 'N/A';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
}

function formatNumber(num) {
    if (num >= 10000000) return (num/10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num/100000).toFixed(2) + ' L';
    if (num >= 1000) return (num/1000).toFixed(1) + 'K';
    return num.toString();
}

function getPlanColor(plan) {
    return { basic:'blue', pro:'orange', premium:'purple', admin:'green' }[plan] || 'blue';
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
window.closeModal = closeModal;
window.updateQRLabel = updateQRLabel;
window.downloadQR = downloadQR;
window.shareQRLink = shareQRLink;
window.switchCampaignTab = switchCampaignTab;
window.sendCampaign = sendCampaign;
window.useTemplate = useTemplate;
window.switchBookingTab = switchBookingTab;
window.addBooking = addBooking;
window.deleteBooking = deleteBooking;
window.switchLoyaltyTab = switchLoyaltyTab;
window.addLoyaltyStamp = addLoyaltyStamp;
window.lookupLoyaltyCustomer = lookupLoyaltyCustomer;
window.saveLoyaltySettings = saveLoyaltySettings;
window.switchSettingsTab = switchSettingsTab;
window.saveProfileSettings = saveProfileSettings;
window.toggleSwitch = toggleSwitch;
window.saveNotificationSettings = saveNotificationSettings;
window.addStaffMember = addStaffMember;
window.removeStaff = removeStaff;

document.addEventListener('DOMContentLoaded', init);
console.log('🚀 sambandh.ai CRM Application loaded successfully!');
