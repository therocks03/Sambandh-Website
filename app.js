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
            role: userData.role || 'owner',
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
                createdAt: new Date().toISOString(),
                tags: [],
                lastInteraction: '',
                preferences: []
            };
            user.customers.push(customer);
            user.stats.totalCustomers = user.customers.length;
            this.saveUsers(users);
            return customer;
        }
        return null;
    }
}

const BUSINESS_TYPES = ['salon','retail','restaurant','gym','clinic','electronics','fashion','grocery','pharmacy','services'];

const db = new DataStore();

function hasPermission(user, action) {
    const roles = {
        admin: ['all'],
        owner: ['all'],
        manager: ['view','edit','customers'],
        staff: ['view','customers']
    };
    return roles[user.role]?.includes('all') || roles[user.role]?.includes(action);
}

function generateReport(userId, type='summary') {
    const user = db.getUsers().find(u=>u.id===userId);
    if(!user) return null;
    const c = user.customers;

    if(type==='summary') return {
        totalCustomers: c.length,
        avgVisits: c.length ? c.reduce((s,x)=>s+(x.totalVisits||0),0)/c.length : 0
    };

    if(type==='retention') return c.filter(x=>x.totalVisits>2).length;

    if(type==='inactive') return c.filter(x=>{
        return (new Date()-new Date(x.lastVisit))/(1000*60*60*24)>30;
    });

    if(type==='topCustomers') return [...c].sort((a,b)=>b.totalVisits-a.totalVisits).slice(0,5);
}

function updateInsights(user){
    console.log('Insights', {
        repeat: user.customers.filter(c=>c.totalVisits>1).length
    });
}

function updateRecentActivity(user){
    console.log('Recent', user.customers.slice(-5));
}

function showDashboard(){
    const user = db.getCurrentUser();
    if(!user) return;

    document.getElementById('dashboardBusinessName').textContent = user.businessName;
    document.getElementById('totalCustomers').textContent = user.stats.totalCustomers || 0;

    updateInsights(user);
    updateRecentActivity(user);
}

function handleSignup(e){
    e.preventDefault();

    const userData = {
        businessName: signupBusinessName.value,
        businessType: signupBusinessType.value,
        ownerName: signupOwnerName.value,
        mobile: signupMobile.value,
        email: signupEmail.value,
        password: signupPassword.value,
        city: signupCity.value,
        plan: signupPlan.value
    };

    if(!BUSINESS_TYPES.includes(userData.businessType)){
        alert('Invalid business type');
        return;
    }

    const u = db.addUser(userData);
    db.setCurrentUser(u.id);
    showDashboard();
}

function exportData(){
    const data = {
        users: db.getUsers(),
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sambadh_export.json';
    a.click();
}

window.exportData = exportData;
document.addEventListener('DOMContentLoaded', ()=>{});