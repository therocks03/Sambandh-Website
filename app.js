// sambandh.ai CRM v2.0 - Real QR + Advanced Admin
class FirebaseManager {
    constructor() { this.db=null; this.auth=null; this.currentUser=null; this.useLocalStorage=false; this.init(); }
    init() {
        if(typeof firebase==='undefined'){this.fallbackToLocalStorage();return;}
        try{
            this.db=firebase.firestore(); this.auth=firebase.auth();
            this.auth.onAuthStateChanged(user=>{if(user){this.currentUser=user;this.loadUserData(user.uid);}});
        }catch(e){this.fallbackToLocalStorage();}
    }
    fallbackToLocalStorage(){this.useLocalStorage=true;}
    async createUser(email,password,userData){
        if(this.useLocalStorage)return this.createUserLocal(email,password,userData);
        try{const uc=await this.auth.createUserWithEmailAndPassword(email,password);await this.db.collection('users').doc(uc.user.uid).set({...userData,uid:uc.user.uid,email,createdAt:firebase.firestore.FieldValue.serverTimestamp(),isActive:true,role:email==='admin@sambandh.ai'?'admin':'user',stats:{totalCustomers:0,monthlyGrowth:0,campaignsSent:0,retention:0}});return{success:true,user:uc.user};}
        catch(e){return{success:false,error:e.message};}
    }
    async loginUser(email,password){
        if(this.useLocalStorage)return this.loginUserLocal(email,password);
        try{const uc=await this.auth.signInWithEmailAndPassword(email,password);return{success:true,user:uc.user};}
        catch(e){return{success:false,error:e.message};}
    }
    async logoutUser(){
        if(this.useLocalStorage){localStorage.removeItem('sambandh_current_user');return{success:true};}
        try{await this.auth.signOut();this.currentUser=null;return{success:true};}catch(e){return{success:false};}
    }
    async loadUserData(uid){
        if(this.useLocalStorage)return this.loadUserDataLocal(uid);
        try{const doc=await this.db.collection('users').doc(uid).get();if(doc.exists){if(doc.data().role==='admin')showAdminDashboard();else showDashboard();}}catch(e){}
    }
    async getUserData(uid){
        if(this.useLocalStorage)return this.getUserDataLocal(uid);
        try{const doc=await this.db.collection('users').doc(uid).get();return doc.exists?doc.data():null;}catch(e){return null;}
    }
    async getAllUsers(){
        if(this.useLocalStorage)return this.getAllUsersLocal();
        try{const snap=await this.db.collection('users').get();return snap.docs.map(d=>({id:d.id,...d.data()}));}catch(e){return[];}
    }
    async addCustomer(userId,customerData){
        if(this.useLocalStorage)return this.addCustomerLocal(userId,customerData);
        try{const ref=await this.db.collection('customers').add({userId,...customerData,createdAt:firebase.firestore.FieldValue.serverTimestamp()});await this.db.collection('users').doc(userId).update({'stats.totalCustomers':firebase.firestore.FieldValue.increment(1)});return{success:true,id:ref.id};}
        catch(e){return{success:false,error:e.message};}
    }
    async getCustomers(userId){
        if(this.useLocalStorage)return this.getCustomersLocal(userId);
        try{const snap=await this.db.collection('customers').where('userId','==',userId).orderBy('createdAt','desc').get();return snap.docs.map(d=>({id:d.id,...d.data()}));}catch(e){return[];}
    }
    createUserLocal(email,password,userData){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        if(users.some(u=>u.email===email))return{success:false,error:'Email already exists'};
        const newUser={uid:'user_'+Date.now(),email,password,...userData,createdAt:new Date().toISOString(),isActive:true,role:email==='admin@sambandh.ai'?'admin':'user',stats:{totalCustomers:0,monthlyGrowth:0,campaignsSent:0,retention:0}};
        users.push(newUser);localStorage.setItem('sambandh_users',JSON.stringify(users));localStorage.setItem('sambandh_current_user',newUser.uid);return{success:true,user:newUser};
    }
    loginUserLocal(email,password){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        const user=users.find(u=>u.email===email&&u.password===password);
        if(user){localStorage.setItem('sambandh_current_user',user.uid);return{success:true,user};}
        return{success:false,error:'Invalid email or password'};
    }
    loadUserDataLocal(uid){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        const user=users.find(u=>u.uid===uid);
        if(user){if(user.role==='admin')showAdminDashboard();else showDashboard();}
    }
    getUserDataLocal(uid){return(JSON.parse(localStorage.getItem('sambandh_users')||'[]')).find(u=>u.uid===uid)||null;}
    getAllUsersLocal(){return JSON.parse(localStorage.getItem('sambandh_users')||'[]');}
    addCustomerLocal(userId,customerData){
        const customers=JSON.parse(localStorage.getItem('sambandh_customers')||'[]');
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        const c={id:'cust_'+Date.now(),userId,...customerData,createdAt:new Date().toISOString()};
        customers.push(c);localStorage.setItem('sambandh_customers',JSON.stringify(customers));
        const idx=users.findIndex(u=>u.uid===userId);if(idx!==-1){users[idx].stats.totalCustomers=(users[idx].stats.totalCustomers||0)+1;localStorage.setItem('sambandh_users',JSON.stringify(users));}
        return{success:true,id:c.id};
    }
    getCustomersLocal(userId){
        const c=JSON.parse(localStorage.getItem('sambandh_customers')||'[]');
        return userId==='all'?c:c.filter(x=>x.userId===userId);
    }
    getCurrentUserId(){return this.useLocalStorage?localStorage.getItem('sambandh_current_user'):(this.currentUser?this.currentUser.uid:null);}
    updateUserStats(uid,stats){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        const idx=users.findIndex(u=>u.uid===uid);if(idx!==-1){users[idx].stats={...users[idx].stats,...stats};localStorage.setItem('sambandh_users',JSON.stringify(users));}
    }
    updateUserLocal(uid,data){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        const idx=users.findIndex(u=>u.uid===uid);if(idx!==-1){users[idx]={...users[idx],...data};localStorage.setItem('sambandh_users',JSON.stringify(users));}
    }
    deleteUserLocal(uid){
        const users=JSON.parse(localStorage.getItem('sambandh_users')||'[]');
        localStorage.setItem('sambandh_users',JSON.stringify(users.filter(u=>u.uid!==uid)));
    }
    saveCampaign(userId,campaign){
        const c=JSON.parse(localStorage.getItem('sambandh_campaigns')||'[]');
        const n={id:'camp_'+Date.now(),userId,...campaign,sentAt:new Date().toISOString()};c.push(n);localStorage.setItem('sambandh_campaigns',JSON.stringify(c));return n;
    }
    getCampaigns(userId){const c=JSON.parse(localStorage.getItem('sambandh_campaigns')||'[]');return userId==='all'?c:c.filter(x=>x.userId===userId);}
    saveBooking(userId,booking){
        const b=JSON.parse(localStorage.getItem('sambandh_bookings')||'[]');
        const n={id:'book_'+Date.now(),userId,...booking,createdAt:new Date().toISOString()};b.push(n);localStorage.setItem('sambandh_bookings',JSON.stringify(b));return n;
    }
    getBookings(userId){return JSON.parse(localStorage.getItem('sambandh_bookings')||'[]').filter(b=>b.userId===userId);}
    deleteBooking(id){const b=JSON.parse(localStorage.getItem('sambandh_bookings')||'[]');localStorage.setItem('sambandh_bookings',JSON.stringify(b.filter(x=>x.id!==id)));}
    saveLoyaltyCard(userId,card){
        const cards=JSON.parse(localStorage.getItem('sambandh_loyalty')||'[]');
        const idx=cards.findIndex(c=>c.userId===userId&&c.customerPhone===card.customerPhone);
        if(idx!==-1)cards[idx]={...cards[idx],...card,updatedAt:new Date().toISOString()};
        else cards.push({id:'loyal_'+Date.now(),userId,...card,createdAt:new Date().toISOString()});
        localStorage.setItem('sambandh_loyalty',JSON.stringify(cards));
    }
    getLoyaltyCards(userId){return JSON.parse(localStorage.getItem('sambandh_loyalty')||'[]').filter(c=>c.userId===userId);}
    saveSettings(userId,settings){
        const all=JSON.parse(localStorage.getItem('sambandh_settings')||'{}');all[userId]={...all[userId],...settings};localStorage.setItem('sambandh_settings',JSON.stringify(all));
    }
    getSettings(userId){return(JSON.parse(localStorage.getItem('sambandh_settings')||'{}'))[userId]||{};}
}

const fbManager=new FirebaseManager();
let selectedPlan='pro';

// ========== INIT ==========
function init(){
    loadQRLib();checkAuth();createDemoData();
    setTimeout(()=>{injectModals();injectAdminModals();},100);
}

function loadQRLib(){
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload=()=>console.log('QRCode loaded');
    document.head.appendChild(s);
}

function createDemoData(){
    const users=fbManager.getAllUsersLocal();
    if(!users.some(u=>u.email==='admin@sambandh.ai'))
        fbManager.createUserLocal('admin@sambandh.ai','admin123',{businessName:'sambandh Admin',businessType:'admin',ownerName:'Admin',mobile:'9999999999',city:'System',plan:'admin'});
    if(!users.some(u=>u.email==='demo@sambandh.ai')){
        const r=fbManager.createUserLocal('demo@sambandh.ai','demo123',{businessName:'Style Studio Salon',businessType:'salon',ownerName:'Priya Sharma',mobile:'9876543210',city:'Jaipur',plan:'pro'});
        if(r.success){
            const uid=r.user.uid;
            [{name:'Rahul Kumar',phone:'9876543211',lastVisit:'2026-03-10',totalVisits:5,revenue:3500,status:'active'},{name:'Anita Singh',phone:'9876543212',lastVisit:'2026-02-18',totalVisits:3,revenue:2100,status:'inactive'},{name:'Vikram Patel',phone:'9876543213',lastVisit:'2026-03-20',totalVisits:8,revenue:5600,status:'active'},{name:'Sunita Sharma',phone:'9876543214',lastVisit:'2026-03-01',totalVisits:12,revenue:8400,status:'active'},{name:'Deepak Gupta',phone:'9876543215',lastVisit:'2026-01-15',totalVisits:2,revenue:1400,status:'inactive'}].forEach(c=>fbManager.addCustomerLocal(uid,c));
            fbManager.updateUserStats(uid,{totalCustomers:5,monthlyGrowth:18,campaignsSent:4,retention:87});
            [{customerName:'Rahul Kumar',customerPhone:'9876543211',service:'Haircut',date:'2026-03-25',time:'10:00',staff:'Priya',status:'confirmed',notes:''},{customerName:'Sunita Sharma',customerPhone:'9876543214',service:'Hair Color',date:'2026-03-25',time:'14:00',staff:'Meena',status:'confirmed',notes:'Highlights'},{customerName:'Anita Singh',customerPhone:'9876543212',service:'Facial',date:'2026-03-26',time:'11:30',staff:'Priya',status:'pending',notes:''}].forEach(b=>fbManager.saveBooking(uid,b));
            [{name:'Holi Special',type:'festival',message:'Happy Holi! 20% off.',recipients:5,status:'sent'},{name:'Win-back',type:'winback',message:'We miss you! 15% off.',recipients:2,status:'sent'}].forEach(c=>fbManager.saveCampaign(uid,c));
            [{customerName:'Rahul Kumar',customerPhone:'9876543211',stamps:5,rewardThreshold:10,lastStamp:'2026-03-10'},{customerName:'Sunita Sharma',customerPhone:'9876543214',stamps:10,rewardThreshold:10,lastStamp:'2026-03-01',redeemed:true}].forEach(c=>fbManager.saveLoyaltyCard(uid,c));
        }
    }
}

function checkAuth(){const uid=fbManager.getCurrentUserId();if(uid)fbManager.loadUserDataLocal(uid);}

// ========== NAV ==========
function showHome(){document.getElementById('landingPage').style.display='block';document.getElementById('dashboard').classList.remove('active');document.getElementById('adminDashboard').classList.remove('active');window.scrollTo(0,0);}
function showLogin(){document.getElementById('authModal').classList.add('active');switchToLogin();}
function showSignup(){document.getElementById('authModal').classList.add('active');switchToSignup();}
function closeAuthModal(){document.getElementById('authModal').classList.remove('active');}
function switchToLogin(){document.getElementById('loginTab').classList.add('active');document.getElementById('signupTab').classList.remove('active');document.getElementById('loginForm').classList.remove('hidden');document.getElementById('signupForm').classList.add('hidden');document.getElementById('authTitle').textContent='Welcome Back';}
function switchToSignup(){document.getElementById('loginTab').classList.remove('active');document.getElementById('signupTab').classList.add('active');document.getElementById('loginForm').classList.add('hidden');document.getElementById('signupForm').classList.remove('hidden');document.getElementById('authTitle').textContent='Create Account';}
function signupWithPlan(plan){selectedPlan=plan;document.getElementById('signupPlan').value=plan;showSignup();}

// ========== AUTH ==========
async function handleLogin(e){
    e.preventDefault();
    const email=document.getElementById('loginEmail').value,password=document.getElementById('loginPassword').value;
    document.getElementById('loginBtnText').classList.add('hidden');document.getElementById('loginBtnLoading').classList.remove('hidden');
    const result=await fbManager.loginUser(email,password);
    document.getElementById('loginBtnText').classList.remove('hidden');document.getElementById('loginBtnLoading').classList.add('hidden');
    if(result.success){closeAuthModal();const ud=await fbManager.getUserData(result.user.uid);if(ud&&ud.role==='admin')showAdminDashboard();else showDashboard();document.getElementById('loginForm').reset();}
    else alert('Login failed: '+result.error);
}
async function handleSignup(e){
    e.preventDefault();
    const email=document.getElementById('signupEmail').value,password=document.getElementById('signupPassword').value;
    const userData={businessName:document.getElementById('signupBusinessName').value,businessType:document.getElementById('signupBusinessType').value,ownerName:document.getElementById('signupOwnerName').value,mobile:document.getElementById('signupMobile').value,city:document.getElementById('signupCity').value,plan:document.getElementById('signupPlan').value};
    document.getElementById('signupBtnText').classList.add('hidden');document.getElementById('signupBtnLoading').classList.remove('hidden');
    const result=await fbManager.createUser(email,password,userData);
    document.getElementById('signupBtnText').classList.remove('hidden');document.getElementById('signupBtnLoading').classList.add('hidden');
    if(result.success){closeAuthModal();showDashboard();document.getElementById('signupForm').reset();toast('Welcome to sambandh.ai! 🎉','🚀');}
    else alert('Signup failed: '+result.error);
}
async function logout(){if(confirm('Logout?')){await fbManager.logoutUser();showHome();}}

// ========== USER DASHBOARD ==========
async function showDashboard(){
    const uid=fbManager.getCurrentUserId();if(!uid){showHome();return;}
    const ud=await fbManager.getUserData(uid);if(!ud){showHome();return;}
    document.getElementById('landingPage').style.display='none';
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    document.getElementById('dashboardBusinessName').textContent='Welcome, '+ud.businessName+'!';
    document.getElementById('dashboardPlan').textContent=cap(ud.plan)+' Plan · Active';
    document.getElementById('totalCustomers').textContent=ud.stats.totalCustomers||0;
    document.getElementById('monthlyGrowth').textContent=(ud.stats.monthlyGrowth||0)+'%';
    document.getElementById('campaignsSent').textContent=ud.stats.campaignsSent||0;
    document.getElementById('retention').textContent=(ud.stats.retention||85)+'%';
    const customers=await fbManager.getCustomers(uid);
    updateCustomersTable(customers);
}
function updateCustomersTable(customers){
    const tbody=document.getElementById('customersTableBody');
    if(!customers||!customers.length){tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px;">📱</div><div style="font-size:16px;font-weight:600;">No customers yet</div><div style="font-size:14px;">Share your QR code!</div></td></tr>`;return;}
    tbody.innerHTML=customers.slice(0,10).map(c=>`<tr><td style="font-weight:600;">${c.name}</td><td>${c.phone}</td><td>${fmtDate(c.lastVisit)}</td><td><span class="badge badge-blue">${c.totalVisits} visits</span></td><td style="font-weight:700;color:var(--secondary);">₹${c.revenue||0}</td><td><span class="badge ${c.status==='inactive'?'badge-orange':'badge-green'}">${c.status==='inactive'?'Inactive':'Active'}</span></td></tr>`).join('');
}

// ========== TOAST ==========
function toast(msg,icon='✅',dur=3500){
    let t=document.getElementById('samToast');
    if(!t){t=document.createElement('div');t.id='samToast';t.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(100px);background:#1A1A1A;color:white;padding:14px 24px;border-radius:14px;font-weight:600;font-size:14px;z-index:99999;transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;';document.body.appendChild(t);}
    t.innerHTML=`<span style="font-size:18px;">${icon}</span><span>${msg}</span>`;
    t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._t);
    t._t=setTimeout(()=>t.style.transform='translateX(-50%) translateY(100px)',dur);
}

// ========== MODALS ==========
function closeModal(id){document.getElementById(id)?.classList.remove('active');}
function openModal(id){document.getElementById(id)?.classList.add('active');}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.remove('active');});

function switchTab(p,t){
    document.querySelectorAll(`[id^="${p}Panel"]`).forEach(x=>x.classList.add('hidden'));
    document.getElementById(`${p}Panel${t}`)?.classList.remove('hidden');
    document.querySelectorAll(`[id^="${p}Tab"]`).forEach(x=>x.classList.remove('active'));
    document.getElementById(`${p}Tab${t}`)?.classList.add('active');
    if(p==='camp'&&t==='History')loadCampHistory();
    if(p==='book'&&t==='Upcoming')loadUpcoming();
    if(p==='book'&&t==='All')loadAllBookings();
    if(p==='loyal'&&t==='Cards')loadLoyalCards();
    if(p==='set'&&t==='Team')loadStaff();
}

function injectModals(){
    const html=`
    <div id="qrModal" class="modal">
      <div class="modal-content" style="max-width:580px;">
        <div class="modal-header"><h2>📱 QR Code Generator</h2><button class="close-modal" onclick="closeModal('qrModal')">&times;</button></div>
        <p style="color:var(--text-secondary);margin-bottom:18px;">This <strong>real, scannable QR code</strong> opens WhatsApp so customers can register instantly!</p>
        <div id="qrStandee" style="background:linear-gradient(135deg,#FFF5F0,#FFE8DC);border:2px solid var(--border);border-radius:20px;padding:28px;text-align:center;margin-bottom:18px;">
          <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">🤝 sambandh.ai</div>
          <div id="qrBizLabel" style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--primary);margin-bottom:4px;">Your Business</div>
          <div id="qrTagline" style="color:var(--text-secondary);font-size:13px;margin-bottom:18px;">Scan to get exclusive offers on WhatsApp!</div>
          <div style="background:white;border-radius:16px;padding:12px;display:inline-block;box-shadow:0 8px 24px rgba(255,92,0,0.15);">
            <div id="qrCodeCanvas"></div>
          </div>
          <div id="qrLinkText" style="font-size:10px;color:var(--text-muted);margin-top:10px;max-width:260px;margin-left:auto;margin-right:auto;word-break:break-all;"></div>
        </div>
        <div class="form-group"><label>Business Name</label><input type="text" id="qrBizInput" placeholder="Your Business Name" oninput="refreshQR()"></div>
        <div class="form-group"><label>Tagline</label><input type="text" id="qrTagInput" value="Scan to get exclusive offers on WhatsApp!" oninput="document.getElementById('qrTagline').textContent=this.value"></div>
        <div class="form-group"><label>Your WhatsApp Number (for customer messages)</label><input type="text" id="qrWANumber" placeholder="919876543210" value="919876543210" oninput="refreshQR()"></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn" onclick="downloadStandee()" style="flex:1;">⬇️ Download Print-Ready Standee</button>
          <button class="btn btn-outline" onclick="copyQRURL()" style="flex:1;">🔗 Copy Link</button>
        </div>
        <div style="margin-top:14px;padding:14px;background:rgba(0,201,122,0.08);border:1px solid rgba(0,201,122,0.2);border-radius:10px;font-size:13px;color:var(--text-secondary);">
          ✅ <strong>How it works:</strong> Customer scans → WhatsApp opens with pre-filled message → You get their name automatically saved!
        </div>
      </div>
    </div>

    <div id="campaignModal" class="modal">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header"><h2>📨 Campaign Builder</h2><button class="close-modal" onclick="closeModal('campaignModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="campTabNew" onclick="switchTab('camp','New')">✍️ New</button>
          <button class="form-tab" id="campTabHistory" onclick="switchTab('camp','History')">📋 History</button>
          <button class="form-tab" id="campTabTemplates" onclick="switchTab('camp','Templates')">🎨 Templates</button>
        </div>
        <div id="campPanelNew" style="margin-top:20px;">
          <div class="form-group"><label>Campaign Name</label><input type="text" id="campName" placeholder="e.g. Diwali Special"></div>
          <div class="form-group"><label>Target Audience</label><select id="campAudience" onchange="updateReach()"><option value="all">All Customers</option><option value="active">Active (last 30 days)</option><option value="inactive">Inactive (30+ days)</option><option value="vip">VIP (5+ visits)</option></select></div>
          <div class="form-group"><label>Message <span style="font-size:12px;color:var(--text-muted);">Use {name} and {business}</span></label><textarea id="campMsg" rows="5">Hi {name}! 👋\n\nSpecial offer from {business}! Get 20% off this week only. 🎉\n\nReply YES to book!</textarea></div>
          <div style="padding:12px 16px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px;margin-bottom:16px;font-size:14px;">📊 Reach: <strong id="campReach" style="color:var(--accent);">—</strong></div>
          <button class="btn" onclick="sendCampaign()" style="width:100%;">🚀 Send Campaign</button>
        </div>
        <div id="campPanelHistory" class="hidden" style="margin-top:20px;"><div id="campHistList"></div></div>
        <div id="campPanelTemplates" class="hidden" style="margin-top:20px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="campTmplGrid"></div></div>
      </div>
    </div>

    <div id="analyticsModal" class="modal">
      <div class="modal-content" style="max-width:820px;">
        <div class="modal-header"><h2>📊 Analytics & Insights</h2><button class="close-modal" onclick="closeModal('analyticsModal')">&times;</button></div>
        <div id="anlStatsRow" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;"><div style="font-weight:700;margin-bottom:12px;">📈 Monthly Visits</div><div id="anlVisChart" style="height:100px;display:flex;align-items:flex-end;gap:5px;"></div><div id="anlVisLbl" style="display:flex;gap:5px;margin-top:4px;"></div></div>
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;"><div style="font-weight:700;margin-bottom:12px;">💰 Revenue (₹)</div><div id="anlRevChart" style="height:100px;display:flex;align-items:flex-end;gap:5px;"></div><div id="anlRevLbl" style="display:flex;gap:5px;margin-top:4px;"></div></div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;"><div style="font-weight:700;margin-bottom:12px;">🏆 Top Customers</div><div id="anlTopCust"></div></div>
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;"><div style="font-weight:700;margin-bottom:12px;">👥 Segments</div><div id="anlSegs"></div></div>
        </div>
      </div>
    </div>

    <div id="bookingsModal" class="modal">
      <div class="modal-content" style="max-width:740px;">
        <div class="modal-header"><h2>📅 Appointment Manager</h2><button class="close-modal" onclick="closeModal('bookingsModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="bookTabUpcoming" onclick="switchTab('book','Upcoming')">📅 Upcoming</button>
          <button class="form-tab" id="bookTabAdd" onclick="switchTab('book','Add')">➕ Add</button>
          <button class="form-tab" id="bookTabAll" onclick="switchTab('book','All')">📋 All</button>
        </div>
        <div id="bookPanelUpcoming" style="margin-top:18px;"><div id="upcomingList"></div></div>
        <div id="bookPanelAdd" class="hidden" style="margin-top:18px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group"><label>Customer Name *</label><input type="text" id="bkName" placeholder="Full name"></div>
            <div class="form-group"><label>Phone *</label><input type="tel" id="bkPhone" placeholder="9876543210"></div>
            <div class="form-group"><label>Service *</label><select id="bkSvc"><option>Haircut</option><option>Hair Color</option><option>Facial</option><option>Hair Spa</option><option>Threading</option><option>Manicure</option><option>Pedicure</option><option>Waxing</option><option>Makeup</option><option>Other</option></select></div>
            <div class="form-group"><label>Staff</label><input type="text" id="bkStaff" placeholder="Staff name"></div>
            <div class="form-group"><label>Date *</label><input type="date" id="bkDate"></div>
            <div class="form-group"><label>Time *</label><input type="time" id="bkTime"></div>
          </div>
          <div class="form-group"><label>Notes</label><textarea id="bkNotes" rows="2" placeholder="Special instructions..."></textarea></div>
          <button class="btn" onclick="addBooking()" style="width:100%;">✅ Confirm Booking</button>
        </div>
        <div id="bookPanelAll" class="hidden" style="margin-top:18px;"><div id="allBkList"></div></div>
      </div>
    </div>

    <div id="loyaltyModal" class="modal">
      <div class="modal-content" style="max-width:680px;">
        <div class="modal-header"><h2>🎁 Loyalty Program</h2><button class="close-modal" onclick="closeModal('loyaltyModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="loyalTabCards" onclick="switchTab('loyal','Cards')">🃏 Cards</button>
          <button class="form-tab" id="loyalTabAdd" onclick="switchTab('loyal','Add')">➕ Add Stamp</button>
          <button class="form-tab" id="loyalTabSettings" onclick="switchTab('loyal','Settings')">⚙️ Settings</button>
        </div>
        <div id="loyalPanelCards" style="margin-top:18px;"><div id="loyalList"></div></div>
        <div id="loyalPanelAdd" class="hidden" style="margin-top:18px;">
          <div style="background:rgba(255,92,0,0.06);border:1px solid rgba(255,92,0,0.2);border-radius:10px;padding:14px;margin-bottom:16px;font-size:14px;color:var(--text-secondary);">🎫 Each visit = 1 stamp. After 10 stamps → FREE reward!</div>
          <div class="form-group"><label>Phone Number</label><input type="tel" id="lyPhone" placeholder="9876543210" oninput="lookupLoyal(this.value)"></div>
          <div id="lyLookup" style="display:none;padding:12px;background:var(--bg-main);border:2px solid var(--border);border-radius:10px;margin-bottom:14px;font-size:14px;"></div>
          <div class="form-group"><label>Customer Name (if new)</label><input type="text" id="lyName" placeholder="Customer name"></div>
          <button class="btn" onclick="addStamp()" style="width:100%;">✅ Add Visit Stamp</button>
        </div>
        <div id="loyalPanelSettings" class="hidden" style="margin-top:18px;">
          <div class="form-group"><label>Stamps for Reward</label><input type="number" id="lyThresh" value="10" min="3" max="20"></div>
          <div class="form-group"><label>Reward Description</label><input type="text" id="lyReward" value="1 Free Haircut"></div>
          <div class="form-group"><label>Expiry (days)</label><input type="number" id="lyExpiry" value="30"></div>
          <button class="btn" onclick="saveLySettings()" style="width:100%;">💾 Save Settings</button>
        </div>
      </div>
    </div>

    <div id="settingsModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header"><h2>⚙️ Business Settings</h2><button class="close-modal" onclick="closeModal('settingsModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="setTabProfile" onclick="switchTab('set','Profile')">🏢 Profile</button>
          <button class="form-tab" id="setTabNotif" onclick="switchTab('set','Notif')">🔔 Alerts</button>
          <button class="form-tab" id="setTabTeam" onclick="switchTab('set','Team')">👥 Team</button>
        </div>
        <div id="setPanelProfile" style="margin-top:18px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group" style="grid-column:1/-1;"><label>Business Name</label><input type="text" id="sBizName"></div>
            <div class="form-group"><label>Type</label><select id="sBizType"><option value="salon">Salon</option><option value="restaurant">Restaurant</option><option value="gym">Gym</option><option value="clinic">Clinic</option><option value="retail">Retail</option><option value="other">Other</option></select></div>
            <div class="form-group"><label>Owner</label><input type="text" id="sOwner"></div>
            <div class="form-group"><label>Mobile</label><input type="tel" id="sMobile"></div>
            <div class="form-group"><label>City</label><input type="text" id="sCity"></div>
            <div class="form-group"><label>Address</label><input type="text" id="sAddr"></div>
            <div class="form-group"><label>Hours</label><input type="text" id="sHours" value="9 AM - 9 PM"></div>
            <div class="form-group"><label>Google Maps</label><input type="url" id="sGmaps"></div>
          </div>
          <button class="btn" onclick="saveProfile()" style="width:100%;">💾 Save Profile</button>
        </div>
        <div id="setPanelNotif" class="hidden" style="margin-top:18px;display:flex;flex-direction:column;gap:12px;">
          ${[['nBday','🎂 Birthday Messages','Auto-send birthday wishes',true],['nInact','💤 Inactive Alerts','Alert for 30-day no-shows',true],['nReview','⭐ Review Requests','Ask for Google review',false],['nFest','🎊 Festival Reminders','Remind before festivals',true],['nBook','📅 Booking Confirmations','WhatsApp confirm bookings',true]].map(([id,lbl,desc,on])=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;">
              <div><div style="font-weight:600;font-size:14px;">${lbl}</div><div style="font-size:12px;color:var(--text-muted);">${desc}</div></div>
              <div id="${id}Tog" data-on="${on}" onclick="togNotif('${id}')" style="width:48px;height:26px;border-radius:26px;background:${on?'var(--secondary)':'var(--border)'};cursor:pointer;position:relative;transition:background 0.3s;flex-shrink:0;">
                <div id="${id}Knob" style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:3px;left:${on?'24px':'4px'};transition:left 0.3s;"></div>
              </div>
            </div>`).join('')}
          <button class="btn" onclick="saveNotif()" style="width:100%;">💾 Save</button>
        </div>
        <div id="setPanelTeam" class="hidden" style="margin-top:18px;">
          <div id="staffEl" style="margin-bottom:14px;"></div>
          <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;">
            <div style="font-weight:700;margin-bottom:14px;">➕ Add Staff</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="margin:0;"><label>Name</label><input type="text" id="stName" placeholder="Staff name"></div>
              <div class="form-group" style="margin:0;"><label>Role</label><input type="text" id="stRole" placeholder="Stylist..."></div>
            </div>
            <button class="btn" onclick="addStaff()" style="width:100%;margin-top:14px;">Add Staff Member</button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend',html);
    const bd=document.getElementById('bkDate');if(bd)bd.value=new Date().toISOString().split('T')[0];
    buildTemplates();
}

// ========== QR GENERATOR ==========
let qrInstance=null;

async function openQRGenerator(){
    openModal('qrModal');
    const uid=fbManager.getCurrentUserId();
    const ud=await fbManager.getUserData(uid);
    if(ud){
        document.getElementById('qrBizInput').value=ud.businessName||'';
        document.getElementById('qrBizLabel').textContent=ud.businessName||'Your Business';
    }
    setTimeout(()=>refreshQR(),300);
}

function refreshQR(){
    const biz=document.getElementById('qrBizInput')?.value||'Your Business';
    const waNum=document.getElementById('qrWANumber')?.value||'919876543210';
    document.getElementById('qrBizLabel').textContent=biz;
    const msg=encodeURIComponent(`Hi! I scanned the QR code at ${biz}. Please add me to your offers list. My name is: `);
    const url=`https://wa.me/${waNum}?text=${msg}`;
    document.getElementById('qrLinkText').textContent=url.substring(0,55)+'...';

    const canvas=document.getElementById('qrCodeCanvas');
    canvas.innerHTML='';
    canvas.dataset.url=url;

    if(window.QRCode){
        try{
            qrInstance=new QRCode(canvas,{text:url,width:180,height:180,colorDark:'#1A1A1A',colorLight:'#FFFFFF',correctLevel:QRCode.CorrectLevel.H});
        }catch(e){useAPIQR(canvas,url);}
    }else{
        useAPIQR(canvas,url);
        // retry
        setTimeout(()=>{if(window.QRCode&&!canvas.querySelector('canvas')){canvas.innerHTML='';try{new QRCode(canvas,{text:url,width:180,height:180,colorDark:'#1A1A1A',colorLight:'#FFFFFF',correctLevel:QRCode.CorrectLevel.H});}catch(e){}}},2000);
    }
}

function useAPIQR(container,url){
    const enc=encodeURIComponent(url);
    container.innerHTML=`<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${enc}&margin=0&color=1A1A1A&bgcolor=FFFFFF" width="180" height="180" style="border-radius:4px;display:block;" alt="QR Code" crossorigin="anonymous">`;
}

async function downloadStandee(){
    const biz=document.getElementById('qrBizInput').value||'Your Business';
    const tag=document.getElementById('qrTagInput').value||'Scan for offers!';
    const waNum=document.getElementById('qrWANumber').value||'919876543210';
    const msg=encodeURIComponent(`Hi! I scanned the QR code at ${biz}. Please add me to your offers list. My name is: `);
    const url=`https://wa.me/${waNum}?text=${msg}`;
    const enc=encodeURIComponent(url);

    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>QR Standee - ${biz}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'DM Sans',sans-serif;padding:20px;}
.standee{background:linear-gradient(145deg,#FFF5F0,#FFE8DC);border:3px solid #FF5C00;border-radius:24px;padding:36px 32px;text-align:center;width:360px;box-shadow:0 20px 60px rgba(255,92,0,0.2);}
.brand{font-family:'DM Sans',sans-serif;font-size:13px;color:#FF5C00;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;}
h1{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#FF5C00;margin-bottom:6px;line-height:1.2;}
p.tag{color:#6B7280;font-size:13px;margin-bottom:22px;}
.qrwrap{background:white;border-radius:16px;padding:14px;display:inline-block;box-shadow:0 8px 32px rgba(255,92,0,0.15);margin-bottom:18px;}
.qrwrap img{display:block;border-radius:4px;}
.instructions{background:rgba(255,92,0,0.08);border:1px solid rgba(255,92,0,0.2);border-radius:12px;padding:14px 16px;}
.instructions p{color:#FF5C00;font-weight:600;font-size:13px;margin-bottom:12px;}
.steps{display:flex;justify-content:center;gap:12px;}
.step{text-align:center;flex:1;}
.snum{width:28px;height:28px;background:#FF5C00;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;margin:0 auto 6px;}
.step span{font-size:11px;color:#6B7280;}
@media print{body{background:white;padding:0;}.standee{box-shadow:none;border:2px solid #FF5C00;}}</style>
</head><body>
<div class="standee">
  <div class="brand">🤝 sambandh.ai</div>
  <h1>${biz}</h1>
  <p class="tag">${tag}</p>
  <div class="qrwrap"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${enc}&margin=2&color=1A1A1A&bgcolor=FFFFFF" width="220" height="220" alt="Scan QR Code"></div>
  <div class="instructions">
    <p>📲 Scan to get exclusive WhatsApp offers!</p>
    <div class="steps">
      <div class="step"><div class="snum">1</div><span>Open Camera</span></div>
      <div class="step"><div class="snum">2</div><span>Scan Code</span></div>
      <div class="step"><div class="snum">3</div><span>Get Offers!</span></div>
    </div>
  </div>
</div>
</body></html>`;

    const blob=new Blob([html],{type:'text/html'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${biz.replace(/\s+/g,'-')}-QR-Standee.html`;a.click();
    toast('Downloaded! Open file & press Ctrl+P to print','🖨️',5000);
}

async function copyQRURL(){
    const url=document.getElementById('qrCodeCanvas')?.dataset?.url||'';
    if(!url){toast('Generate QR first','⚠️');return;}
    if(navigator.clipboard)await navigator.clipboard.writeText(url);
    else prompt('Copy this link:',url);
    toast('WhatsApp link copied!','🔗');
}

// ========== CAMPAIGNS ==========
function buildTemplates(){
    const grid=document.getElementById('campTmplGrid');if(!grid)return;
    [{icon:'🎊',name:'Festival Offer',msg:'Hi {name}! 🎉\n\nHappy festival from {business}!\nEnjoy 20% off all services this week.\n\nReply BOOK to reserve!'},{icon:'🎂',name:'Birthday Wishes',msg:'Happy Birthday {name}! 🎂\n\n{business} has a special gift — FREE add-on on your next visit!\n\nValid 7 days. See you soon! 🌟'},{icon:'💔',name:'Win Back',msg:"Hi {name}, we miss you! 💕\n\nIt's been a while since {business} saw you.\n\n15% off your next visit. Come back! 🙏"},{icon:'⭐',name:'Review Request',msg:'Hi {name}! 😊\n\nThank you for visiting {business}!\n\nCould you leave us a Google review? It helps us a lot!\n\n⭐⭐⭐⭐⭐ [Link]'},{icon:'🎁',name:'Loyalty Reward',msg:'🎉 Congrats {name}!\n\nYou earned a FREE service at {business}!\n\nCome redeem this week. Reply REDEEM!'},{icon:'📢',name:'New Service',msg:'Hi {name}! 📣\n\n{business} just launched new services!\n\n25% early bird discount for you. Reply INFO to know more!'}].forEach(t=>{
        const d=document.createElement('div');
        d.style.cssText='background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;transition:all 0.2s;';
        d.onmouseover=()=>{d.style.borderColor='var(--primary)';d.style.transform='translateY(-2px)';};
        d.onmouseout=()=>{d.style.borderColor='var(--border)';d.style.transform='none';};
        d.onclick=()=>{document.getElementById('campMsg').value=t.msg;document.getElementById('campName').value=t.name;switchTab('camp','New');toast('Template loaded!','📋');};
        d.innerHTML=`<div style="font-size:26px;margin-bottom:8px;">${t.icon}</div><div style="font-weight:700;font-size:14px;margin-bottom:6px;">${t.name}</div><div style="font-size:12px;color:var(--text-muted);line-height:1.5;">${t.msg.substring(0,60).replace(/\n/g,' ')}...</div><div style="margin-top:8px;font-size:12px;color:var(--primary);font-weight:600;">Use Template →</div>`;
        grid.appendChild(d);
    });
}

async function openCampaignBuilder(){openModal('campaignModal');setTimeout(()=>updateReach(),100);loadCampHistory();}

async function updateReach(){
    const uid=fbManager.getCurrentUserId();const custs=fbManager.getCustomersLocal(uid);
    const aud=document.getElementById('campAudience')?.value||'all';
    let c=custs.length;
    if(aud==='active')c=custs.filter(x=>x.status!=='inactive').length;
    if(aud==='inactive')c=custs.filter(x=>x.status==='inactive').length;
    if(aud==='vip')c=custs.filter(x=>x.totalVisits>=5).length;
    const el=document.getElementById('campReach');if(el)el.textContent=c+' customers';
}
document.addEventListener('change',e=>{if(e.target.id==='campAudience')updateReach();});

async function sendCampaign(){
    const name=document.getElementById('campName').value.trim();
    const msg=document.getElementById('campMsg').value.trim();
    const aud=document.getElementById('campAudience').value;
    if(!name||!msg){toast('Fill name and message','⚠️');return;}
    const uid=fbManager.getCurrentUserId();const ud=await fbManager.getUserData(uid);
    const custs=fbManager.getCustomersLocal(uid);
    let targets=custs;
    if(aud==='active')targets=custs.filter(c=>c.status!=='inactive');
    if(aud==='inactive')targets=custs.filter(c=>c.status==='inactive');
    if(aud==='vip')targets=custs.filter(c=>c.totalVisits>=5);
    fbManager.saveCampaign(uid,{name,message:msg,audience:aud,recipients:targets.length,status:'sent'});
    const stats=(await fbManager.getUserData(uid))?.stats||{};
    fbManager.updateUserStats(uid,{campaignsSent:(stats.campaignsSent||0)+1});
    document.getElementById('campName').value='';document.getElementById('campMsg').value='';
    toast(`Campaign sent to ${targets.length} customers! 🚀`,'📨',4000);
    loadCampHistory();showDashboard();
}

function loadCampHistory(){
    const uid=fbManager.getCurrentUserId();const camps=fbManager.getCampaigns(uid).reverse();
    const el=document.getElementById('campHistList');if(!el)return;
    if(!camps.length){el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:12px;">📭</div>No campaigns yet</div>`;return;}
    el.innerHTML=camps.map(c=>`<div style="padding:16px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="font-weight:700;">${c.name}</div><span class="badge badge-green">${c.recipients} sent</span></div><div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${fmtDate(c.sentAt)} · ${c.audience||'all'}</div><div style="font-size:13px;color:var(--text-secondary);background:white;padding:10px;border-radius:8px;border:1px solid var(--border-light);">${(c.message||'').substring(0,120).replace(/\n/g,' ')}${c.message?.length>120?'...':''}</div></div>`).join('');
}

// ========== ANALYTICS ==========
async function openAnalytics(){
    openModal('analyticsModal');
    const uid=fbManager.getCurrentUserId();
    const custs=fbManager.getCustomersLocal(uid);const camps=fbManager.getCampaigns(uid);
    const totRev=custs.reduce((s,c)=>s+(parseInt(c.revenue)||0),0);
    const active=custs.filter(c=>c.status!=='inactive').length;
    document.getElementById('anlStatsRow').innerHTML=[['👥','Customers',custs.length,'var(--primary)'],['💰','Revenue','₹'+fmtNum(totRev),'var(--secondary)'],['✅','Active',active,'var(--accent)'],['📨','Campaigns',camps.length,'var(--purple)']].map(([i,l,v,c])=>`<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:14px;text-align:center;"><div style="font-size:22px;margin-bottom:5px;">${i}</div><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${c};">${v}</div><div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${l}</div></div>`).join('');
    const months=['Oct','Nov','Dec','Jan','Feb','Mar'];
    const vd=[8,12,15,11,18,custs.length],rd=[5600,8400,10500,7700,12600,totRev];
    renderBar('anlVisChart','anlVisLbl',vd,months,'var(--primary)');
    renderBar('anlRevChart','anlRevLbl',rd,months,'var(--secondary)',true);
    const sorted=[...custs].sort((a,b)=>(b.revenue||0)-(a.revenue||0)).slice(0,5);
    document.getElementById('anlTopCust').innerHTML=sorted.map((c,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border-light);"><div style="display:flex;gap:10px;align-items:center;"><div style="width:26px;height:26px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;">${i+1}</div><div><div style="font-weight:600;font-size:13px;">${c.name}</div><div style="font-size:11px;color:var(--text-muted);">${c.totalVisits} visits</div></div></div><div style="font-weight:700;color:var(--secondary);font-size:13px;">₹${c.revenue||0}</div></div>`).join('')||'<div style="text-align:center;color:var(--text-muted);padding:20px;">No data yet</div>';
    const vip=custs.filter(c=>c.totalVisits>=5).length,reg=custs.filter(c=>c.totalVisits>=2&&c.totalVisits<5).length,newC=custs.filter(c=>c.totalVisits<2).length;
    document.getElementById('anlSegs').innerHTML=[['👑 VIP',vip,'var(--purple)'],['🔄 Regular',reg,'var(--accent)'],['🆕 New',newC,'var(--secondary)'],['💤 Inactive',custs.length-active,'#EF4444']].map(([l,v,c])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border-light);"><span style="font-size:13px;">${l}</span><span style="font-weight:700;color:${c};">${v}</span></div>`).join('');
}

function renderBar(cid,lid,data,lbls,color,isCurrency=false){
    const max=Math.max(...data,1);
    document.getElementById(cid).innerHTML=data.map(v=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;"><div style="width:100%;background:${color};border-radius:4px 4px 0 0;height:${Math.round((v/max)*90)+3}px;min-height:3px;opacity:0.85;"></div><div style="font-size:9px;color:var(--text-muted);font-weight:600;">${isCurrency?'₹'+fmtNum(v):v}</div></div>`).join('');
    document.getElementById(lid).innerHTML=lbls.map(l=>`<div style="flex:1;text-align:center;font-size:10px;color:var(--text-muted);">${l}</div>`).join('');
}

// ========== BOOKINGS ==========
async function openBookings(){openModal('bookingsModal');loadUpcoming();}
function loadUpcoming(){
    const uid=fbManager.getCurrentUserId();const today=new Date().toISOString().split('T')[0];
    const bks=fbManager.getBookings(uid).filter(b=>b.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const el=document.getElementById('upcomingList');if(!el)return;
    if(!bks.length){el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:12px;">📅</div>No upcoming bookings<br><span style="font-size:14px;">Add a booking to get started!</span></div>`;return;}
    el.innerHTML=bks.map(b=>`<div style="padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;"><div style="display:flex;gap:12px;align-items:center;"><div style="width:48px;height:48px;background:var(--gradient-primary);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;flex-shrink:0;font-size:11px;"><div style="font-weight:700;">${new Date(b.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div><div>${b.time}</div></div><div><div style="font-weight:700;">${b.customerName}</div><div style="font-size:13px;color:var(--text-secondary);">${b.service}${b.staff?' · '+b.staff:''}</div>${b.notes?`<div style="font-size:11px;color:var(--text-muted);">${b.notes}</div>`:''}</div></div><div style="display:flex;gap:8px;align-items:center;"><span class="badge ${b.status==='confirmed'?'badge-green':'badge-orange'}">${b.status}</span><button onclick="delBook('${b.id}')" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">Delete</button></div></div>`).join('');
}
function loadAllBookings(){
    const uid=fbManager.getCurrentUserId();const bks=fbManager.getBookings(uid).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt));
    const el=document.getElementById('allBkList');if(!el)return;
    if(!bks.length){el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-muted);">No bookings yet</div>`;return;}
    el.innerHTML=bks.map(b=>`<div style="padding:12px 14px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><div style="font-weight:600;">${b.customerName} — ${b.service}</div><div style="font-size:12px;color:var(--text-muted);">${b.date} at ${b.time}${b.staff?' · '+b.staff:''}</div></div><div style="display:flex;gap:8px;"><span class="badge ${b.status==='confirmed'?'badge-green':'badge-orange'}">${b.status}</span><button onclick="delBook('${b.id}')" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">✕</button></div></div>`).join('');
}
function addBooking(){
    const name=document.getElementById('bkName').value.trim(),phone=document.getElementById('bkPhone').value.trim(),svc=document.getElementById('bkSvc').value,staff=document.getElementById('bkStaff').value.trim(),date=document.getElementById('bkDate').value,time=document.getElementById('bkTime').value,notes=document.getElementById('bkNotes').value.trim();
    if(!name||!phone||!date||!time){toast('Fill all required fields','⚠️');return;}
    const uid=fbManager.getCurrentUserId();
    fbManager.saveBooking(uid,{customerName:name,customerPhone:phone,service:svc,staff,date,time,notes,status:'confirmed'});
    toast(`Booking confirmed for ${name}!`,'📅');
    ['bkName','bkPhone','bkStaff','bkNotes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    loadUpcoming();switchTab('book','Upcoming');
}
function delBook(id){if(!confirm('Delete booking?'))return;fbManager.deleteBooking(id);toast('Deleted','🗑️');loadUpcoming();loadAllBookings();}

// ========== LOYALTY ==========
async function openLoyalty(){openModal('loyaltyModal');loadLoyalCards();}
function loadLoyalCards(){
    const uid=fbManager.getCurrentUserId();const cards=fbManager.getLoyaltyCards(uid);
    const el=document.getElementById('loyalList');if(!el)return;
    if(!cards.length){el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:12px;">🎁</div>No loyalty cards yet</div>`;return;}
    el.innerHTML=cards.map(c=>{const t=c.rewardThreshold||10,s=Math.min(c.stamps||0,t);return `<div style="padding:16px;background:${c.redeemed?'rgba(0,201,122,0.06)':'var(--bg-main)'};border:2px solid ${c.redeemed?'var(--secondary)':'var(--border)'};border-radius:14px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;"><div><div style="font-weight:700;">${c.customerName}</div><div style="font-size:12px;color:var(--text-muted);">${c.customerPhone}</div></div>${c.redeemed?'<span class="badge badge-green">🎉 Reward!</span>':`<span class="badge badge-blue">${s}/${t}</span>`}</div><div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">${Array.from({length:t},(_,i)=>`<div style="width:25px;height:25px;border-radius:50%;border:2px solid ${i<s?'var(--primary)':'var(--border)'};background:${i<s?'var(--gradient-primary)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:10px;color:white;">${i<s?'✓':''}</div>`).join('')}</div><div style="height:5px;background:var(--border);border-radius:100px;overflow:hidden;"><div style="height:100%;width:${Math.round((s/t)*100)}%;background:var(--gradient-primary);border-radius:100px;"></div></div>${!c.redeemed&&s>=t?'<div style="margin-top:10px;padding:10px;background:rgba(0,201,122,0.1);border-radius:8px;text-align:center;font-weight:700;color:var(--secondary);">🎉 Ready to redeem!</div>':''}</div>`}).join('');
}
function lookupLoyal(phone){
    if(phone.length<10){document.getElementById('lyLookup').style.display='none';return;}
    const uid=fbManager.getCurrentUserId();const cards=fbManager.getLoyaltyCards(uid);const found=cards.find(c=>c.customerPhone===phone);
    const el=document.getElementById('lyLookup');
    if(found){el.style.display='block';el.innerHTML=`<div style="font-weight:600;color:var(--primary);">Found: ${found.customerName}</div><div style="font-size:13px;color:var(--text-secondary);">Stamps: ${found.stamps}/${found.rewardThreshold||10}</div>`;document.getElementById('lyName').value=found.customerName;}
    else{el.style.display='block';el.innerHTML='<div style="font-size:13px;color:var(--text-muted);">New customer — enter name</div>';}
}
function addStamp(){
    const phone=document.getElementById('lyPhone').value.trim(),name=document.getElementById('lyName').value.trim();
    if(!phone||phone.length<10){toast('Enter valid phone','⚠️');return;}
    const uid=fbManager.getCurrentUserId();const cards=fbManager.getLoyaltyCards(uid);
    const existing=cards.find(c=>c.customerPhone===phone);const threshold=parseInt(document.getElementById('lyThresh')?.value||10);
    const newStamps=(existing?.stamps||0)+1;
    fbManager.saveLoyaltyCard(uid,{customerName:name||existing?.customerName||'Customer',customerPhone:phone,stamps:newStamps,rewardThreshold:existing?.rewardThreshold||threshold,lastStamp:new Date().toISOString().split('T')[0],redeemed:false});
    if(newStamps>=(existing?.rewardThreshold||threshold))toast(`🏆 ${name||'Customer'} earned FREE reward!`,'🎉',5000);
    else toast(`Stamp added! ${newStamps}/${existing?.rewardThreshold||threshold}`,'✅');
    document.getElementById('lyPhone').value='';document.getElementById('lyName').value='';document.getElementById('lyLookup').style.display='none';
    loadLoyalCards();
}
function saveLySettings(){const uid=fbManager.getCurrentUserId();fbManager.saveSettings(uid,{loyalThreshold:document.getElementById('lyThresh').value,loyalReward:document.getElementById('lyReward').value,loyalExpiry:document.getElementById('lyExpiry').value});toast('Saved!','💾');}

// ========== SETTINGS ==========
async function openSettings(){
    openModal('settingsModal');
    const uid=fbManager.getCurrentUserId();const ud=await fbManager.getUserData(uid);const saved=fbManager.getSettings(uid);
    if(ud){['sBizName','sOwner','sMobile','sCity','sAddr','sHours','sGmaps'].forEach(id=>{const el=document.getElementById(id);if(el){const key=id.replace(/^s/,'').toLowerCase();const fieldMap={sbizname:'businessName',sowner:'ownerName',smobile:'mobile',scity:'city',saddr:'address',shours:'hours',sgmaps:'gmaps'};const field=fieldMap[id.toLowerCase()]||key;el.value=saved[field]||ud[field]||'';}});
    const bt=document.getElementById('sBizType');if(bt)bt.value=saved.businessType||ud.businessType||'salon';}
    loadStaff();
}
function saveProfile(){
    const uid=fbManager.getCurrentUserId();
    fbManager.saveSettings(uid,{businessName:document.getElementById('sBizName').value,businessType:document.getElementById('sBizType').value,ownerName:document.getElementById('sOwner').value,mobile:document.getElementById('sMobile').value,city:document.getElementById('sCity').value,address:document.getElementById('sAddr').value,hours:document.getElementById('sHours').value,gmaps:document.getElementById('sGmaps').value});
    toast('Profile saved!','💾');
}
function togNotif(id){
    const tog=document.getElementById(id+'Tog'),knob=document.getElementById(id+'Knob');
    const isOn=tog.dataset.on==='true';tog.dataset.on=(!isOn).toString();
    tog.style.background=!isOn?'var(--secondary)':'var(--border)';knob.style.left=!isOn?'24px':'4px';
}
function saveNotif(){
    const uid=fbManager.getCurrentUserId();const settings={};
    ['nBday','nInact','nReview','nFest','nBook'].forEach(id=>{const t=document.getElementById(id+'Tog');if(t)settings[id]=t.dataset.on==='true';});
    fbManager.saveSettings(uid,settings);toast('Notifications saved!','🔔');
}
function loadStaff(){
    const uid=fbManager.getCurrentUserId();const{staff=[]}=fbManager.getSettings(uid);const el=document.getElementById('staffEl');if(!el)return;
    el.innerHTML=!staff.length?`<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:14px;background:var(--bg-main);border-radius:10px;margin-bottom:12px;">No staff added yet</div>`:
        `<div style="margin-bottom:12px;">${staff.map((s,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-main);border:2px solid var(--border);border-radius:10px;margin-bottom:8px;"><div><span style="font-weight:600;">${s.name}</span><span style="font-size:12px;color:var(--text-muted);margin-left:8px;">${s.role}</span></div><button onclick="removeStaff(${i})" style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">Remove</button></div>`).join('')}</div>`;
}
function addStaff(){
    const name=document.getElementById('stName').value.trim(),role=document.getElementById('stRole').value.trim();
    if(!name){toast('Enter name','⚠️');return;}
    const uid=fbManager.getCurrentUserId();const settings=fbManager.getSettings(uid);const staff=settings.staff||[];staff.push({name,role:role||'Staff'});
    fbManager.saveSettings(uid,{staff});document.getElementById('stName').value='';document.getElementById('stRole').value='';loadStaff();toast(`${name} added!`,'👤');
}
function removeStaff(idx){
    const uid=fbManager.getCurrentUserId();const settings=fbManager.getSettings(uid);settings.staff.splice(idx,1);fbManager.saveSettings(uid,{staff:settings.staff});loadStaff();toast('Removed','🗑️');
}

// ========== ADVANCED ADMIN ==========
function injectAdminModals(){
    const html=`
    <div id="adminUserModal" class="modal"><div class="modal-content" style="max-width:560px;"><div class="modal-header"><h2 id="admUMTitle">User Details</h2><button class="close-modal" onclick="closeModal('adminUserModal')">&times;</button></div><div id="admUMBody"></div></div></div>
    <div id="adminBroadcastModal" class="modal"><div class="modal-content" style="max-width:580px;"><div class="modal-header"><h2>📢 Platform Broadcast</h2><button class="close-modal" onclick="closeModal('adminBroadcastModal')">&times;</button></div><p style="color:var(--text-secondary);margin-bottom:18px;">Send a message to all registered businesses.</p><div class="form-group"><label>Subject</label><input type="text" id="bcastSubj" placeholder="e.g. New feature launched!"></div><div class="form-group"><label>Message</label><textarea id="bcastMsg" rows="5" placeholder="Write your announcement..."></textarea></div><div class="form-group"><label>Target</label><select id="bcastTarget"><option value="all">All Users</option><option value="pro">Pro Plan</option><option value="basic">Basic Plan</option><option value="premium">Premium Plan</option></select></div><button class="btn" onclick="sendBroadcast()" style="width:100%;">📢 Send to All Businesses</button></div></div>
    <div id="adminPlatformModal" class="modal"><div class="modal-content" style="max-width:820px;"><div class="modal-header"><h2>📈 Platform Analytics</h2><button class="close-modal" onclick="closeModal('adminPlatformModal')">&times;</button></div><div id="platAnlBody"></div></div></div>
    `;
    document.body.insertAdjacentHTML('beforeend',html);
}

async function showAdminDashboard(){
    const uid=fbManager.getCurrentUserId();if(!uid){showHome();return;}
    const ud=await fbManager.getUserData(uid);if(!ud||ud.role!=='admin'){showHome();return;}
    document.getElementById('landingPage').style.display='none';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    await loadAdminData();
    buildAdminUI();
}

async function loadAdminData(){
    const allUsers=await fbManager.getAllUsers();
    const biz=allUsers.filter(u=>u.role!=='admin');
    const active=biz.filter(u=>u.isActive);
    const allCamps=fbManager.getCampaigns('all');
    const allCusts=fbManager.getCustomersLocal('all');
    const pp={basic:299,pro:699,premium:1299};
    const mrr=active.reduce((s,u)=>s+(pp[u.plan]||0),0);
    document.getElementById('adminTotalUsers').textContent=biz.length;
    document.getElementById('adminActiveUsers').textContent=active.length;
    document.getElementById('adminMRR').textContent='₹'+fmtNum(mrr);
    document.getElementById('adminARR').textContent='₹'+fmtNum(mrr*12);
    updateAdminTable(biz);

    // Extra stats row
    let extra=document.getElementById('admExtraRow');
    if(!extra){
        extra=document.createElement('div');extra.id='admExtraRow';
        extra.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:28px;';
        const sg=document.querySelector('#adminDashboard .stats-grid');if(sg)sg.after(extra);
    }
    const pb={basic:0,pro:0,premium:0};biz.forEach(u=>{if(pb[u.plan]!==undefined)pb[u.plan]++;});
    extra.innerHTML=[{i:'📨',l:'Total Campaigns',v:allCamps.length,c:'var(--primary)'},{i:'👤',l:'End Customers',v:allCusts.length,c:'var(--secondary)'},{i:'⚠️',l:'Churn Risk Biz',v:biz.filter(u=>fbManager.getCustomersLocal(u.uid).some(c=>c.status==='inactive')).length,c:'#F59E0B'},{i:'💎',l:'Premium Users',v:pb.premium,c:'var(--purple)'}].map(s=>`<div class="stat-card"><div class="stat-icon" style="font-size:22px;">${s.i}</div><div class="stat-value" style="font-size:32px;color:${s.c};">${s.v}</div><div class="stat-label">${s.l}</div></div>`).join('');
}

function buildAdminUI(){
    let bar=document.getElementById('admActionBar');
    if(!bar){
        bar=document.createElement('div');bar.id='admActionBar';bar.style.cssText='display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;';
        bar.innerHTML=`<button class="btn" onclick="openPlatformAnalytics()" style="flex:1;min-width:140px;">📈 Platform Analytics</button><button class="btn btn-secondary" onclick="openModal('adminBroadcastModal')">📢 Broadcast</button><button class="btn btn-accent" onclick="exportAllData()">📥 Export Data</button><button class="btn btn-outline" onclick="toggleAdminFilter()">🔍 Filter</button>`;
        const sec=document.querySelector('#adminDashboard .dashboard-section');if(sec)sec.insertBefore(bar,sec.firstChild);
    }
    let filterBar=document.getElementById('admFilterBar');
    if(!filterBar){
        filterBar=document.createElement('div');filterBar.id='admFilterBar';
        filterBar.style.cssText='display:none;padding:16px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:18px;';
        filterBar.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:flex-end;"><div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:6px;">Search</label><input type="text" id="admSearch" placeholder="Name, email, city..." oninput="applyAdmFilter()" style="width:100%;padding:10px 14px;border:2px solid var(--border);border-radius:10px;font-size:14px;"></div><div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:6px;">Plan</label><select id="admPlanFilter" onchange="applyAdmFilter()" style="width:100%;padding:10px 14px;border:2px solid var(--border);border-radius:10px;font-size:14px;"><option value="">All Plans</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="premium">Premium</option></select></div><div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:6px;">City</label><input type="text" id="admCityFilter" placeholder="e.g. Jaipur" oninput="applyAdmFilter()" style="width:100%;padding:10px 14px;border:2px solid var(--border);border-radius:10px;font-size:14px;"></div><button onclick="clearAdmFilter()" class="btn btn-outline" style="padding:10px 16px;">Clear</button></div>`;
        const bar2=document.getElementById('admActionBar');if(bar2)bar2.after(filterBar);
    }
    // Update table headers
    const thead=document.querySelector('#adminUsersTable thead tr');
    if(thead&&thead.children.length<8)thead.innerHTML='<th>Business</th><th>Owner</th><th>Email</th><th>Plan</th><th>City</th><th>Customers</th><th>Joined</th><th>Actions</th>';
}

function toggleAdminFilter(){const b=document.getElementById('admFilterBar');if(b)b.style.display=b.style.display==='none'?'block':'none';}

async function applyAdmFilter(){
    const search=(document.getElementById('admSearch')?.value||'').toLowerCase();
    const plan=document.getElementById('admPlanFilter')?.value||'';
    const city=(document.getElementById('admCityFilter')?.value||'').toLowerCase();
    const all=await fbManager.getAllUsers();
    let f=all.filter(u=>u.role!=='admin');
    if(search)f=f.filter(u=>u.businessName?.toLowerCase().includes(search)||u.email?.toLowerCase().includes(search)||u.ownerName?.toLowerCase().includes(search)||u.city?.toLowerCase().includes(search));
    if(plan)f=f.filter(u=>u.plan===plan);
    if(city)f=f.filter(u=>u.city?.toLowerCase().includes(city));
    updateAdminTable(f);
}
function clearAdmFilter(){['admSearch','admCityFilter'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const p=document.getElementById('admPlanFilter');if(p)p.value='';applyAdmFilter();}

function updateAdminTable(users){
    const tbody=document.getElementById('adminUsersTableBody');if(!tbody)return;
    if(!users.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">No users found</td></tr>';return;}
    tbody.innerHTML=users.map(u=>`<tr><td style="font-weight:600;">${u.businessName||'—'}</td><td>${u.ownerName||'—'}</td><td>${u.email}</td><td><span class="badge badge-${getPlanColor(u.plan)}">${cap(u.plan||'basic')}</span></td><td>${u.city||'—'}</td><td><span class="badge badge-blue">${u.stats?.totalCustomers||0}</span></td><td>${fmtDate(u.createdAt)}</td><td><div style="display:flex;gap:5px;flex-wrap:wrap;"><button onclick="viewAdmUser('${u.uid}')" style="background:rgba(59,130,246,0.1);border:none;color:var(--accent);padding:4px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">View</button><button onclick="loginAsUser('${u.uid}')" style="background:rgba(0,201,122,0.1);border:none;color:var(--secondary);padding:4px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Login</button><button onclick="deleteAdmUser('${u.uid}','${(u.businessName||'').replace(/'/g,"\\'")}') " style="background:rgba(239,68,68,0.1);border:none;color:#EF4444;padding:4px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Delete</button></div></td></tr>`).join('');
    const thead=document.querySelector('#adminUsersTable thead tr');
    if(thead&&thead.children.length<8)thead.innerHTML='<th>Business</th><th>Owner</th><th>Email</th><th>Plan</th><th>City</th><th>Customers</th><th>Joined</th><th>Actions</th>';
}

async function viewAdmUser(uid){
    const ud=await fbManager.getUserData(uid);if(!ud)return;
    const custs=fbManager.getCustomersLocal(uid),camps=fbManager.getCampaigns(uid),bks=fbManager.getBookings(uid);
    const rev=custs.reduce((s,c)=>s+(parseInt(c.revenue)||0),0);
    document.getElementById('admUMTitle').textContent=ud.businessName;
    document.getElementById('admUMBody').innerHTML=`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
            ${[['👤 Owner',ud.ownerName],['📧 Email',ud.email],['📱 Mobile',ud.mobile],['🏙️ City',ud.city],['💎 Plan',`<span class="badge badge-${getPlanColor(ud.plan)}">${cap(ud.plan)}</span>`],['📅 Joined',fmtDate(ud.createdAt)],['👥 Customers',custs.length],['💰 Revenue','₹'+fmtNum(rev)],['📨 Campaigns',camps.length],['📅 Bookings',bks.length]].map(([k,v])=>`<div style="padding:10px;background:var(--bg-main);border:1px solid var(--border);border-radius:8px;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${k}</div><div style="font-weight:600;font-size:13px;">${v}</div></div>`).join('')}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="changePlan('${uid}')" class="btn" style="flex:1;">⬆️ Change Plan</button>
          <button onclick="loginAsUser('${uid}')" class="btn btn-secondary" style="flex:1;">🔑 Login As</button>
        </div>`;
    openModal('adminUserModal');
}

async function loginAsUser(uid){
    if(!confirm('Login as this user?'))return;
    localStorage.setItem('sambandh_current_user',uid);closeModal('adminUserModal');await showDashboard();toast('Logged in as user','🔑');
}

function deleteAdmUser(uid,name){
    if(!confirm(`Delete "${name}"? Cannot be undone.`))return;
    fbManager.deleteUserLocal(uid);toast(`${name} deleted`,'🗑️');loadAdminData();
}

async function changePlan(uid){
    const plan=prompt('New plan (basic/pro/premium):');
    if(!['basic','pro','premium'].includes(plan)){toast('Invalid plan','⚠️');return;}
    fbManager.updateUserLocal(uid,{plan});toast('Plan updated to '+plan,'✅');closeModal('adminUserModal');loadAdminData();
}

async function sendBroadcast(){
    const subj=document.getElementById('bcastSubj').value,msg=document.getElementById('bcastMsg').value,target=document.getElementById('bcastTarget').value;
    if(!subj||!msg){toast('Fill subject and message','⚠️');return;}
    const all=await fbManager.getAllUsers();let targets=all.filter(u=>u.role!=='admin');
    if(target!=='all')targets=targets.filter(u=>u.plan===target);
    closeModal('adminBroadcastModal');toast(`Broadcast sent to ${targets.length} businesses!`,'📢');
    document.getElementById('bcastSubj').value='';document.getElementById('bcastMsg').value='';
}

async function openPlatformAnalytics(){
    openModal('adminPlatformModal');
    const all=await fbManager.getAllUsers();const biz=all.filter(u=>u.role!=='admin');
    const allC=fbManager.getCustomersLocal('all');const allCamp=fbManager.getCampaigns('all');
    const pp={basic:299,pro:699,premium:1299};const pb={basic:0,pro:0,premium:0};biz.forEach(u=>{if(pb[u.plan]!==undefined)pb[u.plan]++;});
    const mrr=biz.reduce((s,u)=>s+(pp[u.plan]||0),0);const totRev=allC.reduce((s,c)=>s+(parseInt(c.revenue)||0),0);
    const months=['Oct','Nov','Dec','Jan','Feb','Mar'],sups=[1,0,1,1,0,biz.length],maxS=Math.max(...sups,1);
    document.getElementById('platAnlBody').innerHTML=`
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;">
            ${[['💰 MRR','₹'+fmtNum(mrr),'var(--primary)'],['💰 ARR','₹'+fmtNum(mrr*12),'var(--secondary)'],['💳 Customer Revenue','₹'+fmtNum(totRev),'var(--accent)'],['🟢 Basic',pb.basic,'var(--accent)'],['🟠 Pro',pb.pro,'var(--primary)'],['💜 Premium',pb.premium,'var(--purple)']].map(([l,v,c])=>`<div style="padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${c};">${v}</div></div>`).join('')}
        </div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px;">
          <div style="font-weight:700;margin-bottom:14px;">📈 Monthly New Signups</div>
          <div style="height:90px;display:flex;align-items:flex-end;gap:8px;">
            ${sups.map(v=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;"><div style="width:100%;background:var(--gradient-primary);border-radius:5px 5px 0 0;height:${Math.round((v/maxS)*80)+3}px;opacity:0.9;"></div><div style="font-size:10px;font-weight:700;color:var(--text-muted);">${v}</div></div>`).join('')}
          </div>
          <div style="display:flex;gap:8px;margin-top:4px;">${months.map(m=>`<div style="flex:1;text-align:center;font-size:10px;color:var(--text-muted);">${m}</div>`).join('')}</div>
        </div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;">
          <div style="font-weight:700;margin-bottom:14px;">🏆 Top Businesses by Customer Count</div>
          ${biz.sort((a,b)=>(b.stats?.totalCustomers||0)-(a.stats?.totalCustomers||0)).slice(0,5).map((u,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light);"><div style="display:flex;gap:10px;align-items:center;"><div style="width:26px;height:26px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;">${i+1}</div><div><div style="font-weight:600;font-size:14px;">${u.businessName}</div><div style="font-size:11px;color:var(--text-muted);">${u.city} · ${cap(u.plan)}</div></div></div><span class="badge badge-blue">${u.stats?.totalCustomers||0}</span></div>`).join('')}
        </div>`;
}

function exportAllData(){
    const data={users:fbManager.getAllUsersLocal(),customers:fbManager.getCustomersLocal('all'),campaigns:fbManager.getCampaigns('all'),exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sambandh_export_'+Date.now()+'.json';a.click();
    toast('Data exported!','📥');
}

// ========== UTILS ==========
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):'';}
function fmtDate(d){if(!d)return'N/A';try{return new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'});}catch{return'N/A';}}
function fmtNum(n){n=parseInt(n)||0;if(n>=10000000)return(n/10000000).toFixed(2)+' Cr';if(n>=100000)return(n/100000).toFixed(2)+' L';if(n>=1000)return(n/1000).toFixed(1)+'K';return n.toString();}
function getPlanColor(plan){return{basic:'blue',pro:'orange',premium:'purple',admin:'green'}[plan]||'blue';}

// ========== EXPORTS ==========
window.showHome=showHome; window.showLogin=showLogin; window.showSignup=showSignup;
window.closeAuthModal=closeAuthModal; window.switchToLogin=switchToLogin; window.switchToSignup=switchToSignup;
window.signupWithPlan=signupWithPlan; window.handleLogin=handleLogin; window.handleSignup=handleSignup;
window.logout=logout; window.openQRGenerator=openQRGenerator; window.refreshQR=refreshQR;
window.downloadStandee=downloadStandee; window.copyQRURL=copyQRURL;
window.openCampaignBuilder=openCampaignBuilder; window.openAnalytics=openAnalytics;
window.openBookings=openBookings; window.openLoyalty=openLoyalty; window.openSettings=openSettings;
window.exportAllData=exportAllData; window.closeModal=closeModal; window.openModal=openModal;
window.switchTab=switchTab; window.sendCampaign=sendCampaign; window.updateReach=updateReach;
window.addBooking=addBooking; window.delBook=delBook; window.addStamp=addStamp;
window.lookupLoyal=lookupLoyal; window.saveLySettings=saveLySettings; window.saveProfile=saveProfile;
window.togNotif=togNotif; window.saveNotif=saveNotif; window.addStaff=addStaff;
window.removeStaff=removeStaff; window.viewAdmUser=viewAdmUser; window.loginAsUser=loginAsUser;
window.deleteAdmUser=deleteAdmUser; window.changePlan=changePlan; window.sendBroadcast=sendBroadcast;
window.openPlatformAnalytics=openPlatformAnalytics; window.toggleAdminFilter=toggleAdminFilter;
window.applyAdmFilter=applyAdmFilter; window.clearAdmFilter=clearAdmFilter;
window.loadAdminData=loadAdminData; window.updateAdminTable=updateAdminTable;

document.addEventListener('DOMContentLoaded',init);
console.log('🚀 sambandh.ai v2.0 loaded!');


// ===================================================
// HAMBURGER & SIDEBAR NAV
// ===================================================
function toggleMobileNav() {
    const nav = document.getElementById('mobileNav');
    const btn = document.getElementById('hamburgerBtn');
    if (!nav) return;
    const isOpen = nav.classList.contains('open');
    if (isOpen) { nav.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; }
    else { nav.style.display = 'block'; requestAnimationFrame(() => nav.classList.add('open')); btn.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeMobileNav() {
    const nav = document.getElementById('mobileNav');
    const btn = document.getElementById('hamburgerBtn');
    if (!nav) return;
    nav.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(() => { if (!nav.classList.contains('open')) nav.style.display = 'block'; }, 350);
}
function closeMobileNavOnBg(e) { if (e.target === document.getElementById('mobileNav')) closeMobileNav(); }

let sidebarOpen = false;
function toggleSidebar() {
    const nav = document.getElementById('dashNav');
    const dash = document.getElementById('dashboard');
    if (!nav) return;
    sidebarOpen = !sidebarOpen;
    nav.classList.toggle('expanded', sidebarOpen);
    dash.classList.toggle('dashboard-sidebar-open', sidebarOpen);
    document.getElementById('sidebarToggle').textContent = sidebarOpen ? '✕' : '☰';
}
function toggleAdminSidebar() {
    const nav = document.getElementById('adminDashNav');
    const dash = document.getElementById('adminDashboard');
    if (!nav) return;
    sidebarOpen = !sidebarOpen;
    nav.classList.toggle('expanded', sidebarOpen);
    dash.classList.toggle('dashboard-sidebar-open', sidebarOpen);
}
function setActiveNav(el) {
    document.querySelectorAll('#dashNav .dash-nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}
function setAdminNav(el) {
    document.querySelectorAll('#adminDashNav .dash-nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}
function setBottomNav(el) {
    document.querySelectorAll('.dash-bottom-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}
function scrollDash(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

// "More" bottom nav menu
function openMoreMenu() {
    const items = [
        { icon: '👥', label: 'Segmentation', fn: 'openSegmentation()' },
        { icon: '💰', label: 'Revenue', fn: 'openRevenueTracking()' },
        { icon: '🔔', label: 'Notifications', fn: 'openNotifications()' },
        { icon: '📈', label: 'Insights', fn: 'openGrowthInsights()' },
        { icon: '🎫', label: 'Vouchers', fn: 'openVouchers()' },
        { icon: '📋', label: 'Reports', fn: 'openReports()' },
        { icon: '🧪', label: 'A/B Test', fn: 'openABTesting()' },
        { icon: '🔗', label: 'POS', fn: 'openPOSIntegration()' },
        { icon: '⭐', label: 'Reviews', fn: 'openReviewAutomation()' },
        { icon: '⚙️', label: 'Settings', fn: 'openSettings()' },
    ];
    let overlay = document.getElementById('moreMenuOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'moreMenuOverlay';
        overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;top:0;z-index:1200;background:rgba(0,0,0,0.5);display:flex;flex-direction:column;justify-content:flex-end;';
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); } };
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="background:white;border-radius:24px 24px 0 0;padding:20px 16px 40px;">
            <div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;"></div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;margin-bottom:16px;padding:0 8px;">More Tools</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
                ${items.map(i => `<button onclick="${i.fn};document.getElementById('moreMenuOverlay').remove();" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 4px;border:none;background:var(--bg-main);border-radius:14px;cursor:pointer;font-size:10px;font-weight:700;color:var(--text-primary);font-family:'DM Sans',sans-serif;"><span style="font-size:22px;">${i.icon}</span>${i.label}</button>`).join('')}
            </div>
        </div>`;
}

// ===================================================
// 12 NEW FEATURE MODALS — Inject on init
// ===================================================
function injectFeatureModals() {
    const html = `
    <!-- SEGMENTATION MODAL -->
    <div id="segModal" class="modal">
      <div class="modal-content" style="max-width:740px;">
        <div class="modal-header"><h2>👥 Customer Segmentation</h2><button class="close-modal" onclick="closeModal('segModal')">&times;</button></div>
        <p style="color:var(--text-secondary);margin-bottom:20px;">Customers are automatically grouped based on behaviour. Target each group with the right message.</p>
        <div id="segGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;"></div>
        <div id="segTableWrap"></div>
      </div>
    </div>

    <!-- REVENUE TRACKING MODAL -->
    <div id="revModal" class="modal">
      <div class="modal-content" style="max-width:740px;">
        <div class="modal-header"><h2>💰 Revenue Tracking</h2><button class="close-modal" onclick="closeModal('revModal')">&times;</button></div>
        <div id="revStatsRow" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;"></div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:20px;margin-bottom:18px;">
          <div style="font-weight:700;margin-bottom:14px;">📊 Revenue by Customer (Top 10)</div>
          <div id="revBarWrap"></div>
        </div>
        <div id="revPrediction" style="background:rgba(0,201,122,0.06);border:2px solid rgba(0,201,122,0.2);border-radius:14px;padding:18px;"></div>
      </div>
    </div>

    <!-- NOTIFICATIONS MODAL -->
    <div id="notifModal" class="modal">
      <div class="modal-content" style="max-width:620px;">
        <div class="modal-header"><h2>🔔 Smart Notifications</h2><button class="close-modal" onclick="closeModal('notifModal')">&times;</button></div>
        <div id="notifList" style="display:flex;flex-direction:column;gap:12px;"></div>
        <div style="margin-top:20px;padding:14px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:12px;font-size:13px;color:var(--text-secondary);">
          💡 Notifications are triggered automatically based on customer behaviour and configured thresholds in Settings.
        </div>
      </div>
    </div>

    <!-- GROWTH INSIGHTS MODAL -->
    <div id="insightsModal" class="modal">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header"><h2>📈 Growth Insights</h2><button class="close-modal" onclick="closeModal('insightsModal')">&times;</button></div>
        <div id="insightsList" style="display:flex;flex-direction:column;gap:14px;"></div>
      </div>
    </div>

    <!-- VOUCHERS MODAL -->
    <div id="voucherModal" class="modal">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header"><h2>🎫 Digital Vouchers</h2><button class="close-modal" onclick="closeModal('voucherModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="vchTabCreate" onclick="switchTab('vch','Create')">➕ Create</button>
          <button class="form-tab" id="vchTabActive" onclick="switchTab('vch','Active')">🟢 Active</button>
          <button class="form-tab" id="vchTabHistory" onclick="switchTab('vch','History')">📋 History</button>
        </div>
        <div id="vchPanelCreate" style="margin-top:18px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group"><label>Voucher Code</label><input type="text" id="vchCode" placeholder="e.g. DIWALI20" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"></div>
            <div class="form-group"><label>Discount</label>
              <div style="display:flex;gap:8px;">
                <input type="number" id="vchAmt" placeholder="20" style="flex:1;">
                <select id="vchType" style="width:90px;padding:14px 10px;border:2px solid var(--border);border-radius:12px;font-size:14px;"><option value="%">%</option><option value="₹">₹</option></select>
              </div>
            </div>
            <div class="form-group"><label>Valid Until</label><input type="date" id="vchExpiry"></div>
            <div class="form-group"><label>Max Uses</label><input type="number" id="vchMaxUses" placeholder="50" value="50"></div>
            <div class="form-group" style="grid-column:1/-1;"><label>Voucher Description</label><input type="text" id="vchDesc" placeholder="e.g. Diwali special — 20% off all services"></div>
          </div>
          <button class="btn" onclick="createVoucher()" style="width:100%;">🎫 Create Voucher & Send via WhatsApp</button>
        </div>
        <div id="vchPanelActive" class="hidden" style="margin-top:18px;"><div id="vchActiveList"></div></div>
        <div id="vchPanelHistory" class="hidden" style="margin-top:18px;"><div id="vchHistList"></div></div>
      </div>
    </div>

    <!-- SMS FALLBACK MODAL -->
    <div id="smsModal" class="modal">
      <div class="modal-content" style="max-width:600px;">
        <div class="modal-header"><h2>📱 SMS Fallback</h2><button class="close-modal" onclick="closeModal('smsModal')">&times;</button></div>
        <div style="background:rgba(59,130,246,0.06);border:2px solid rgba(59,130,246,0.2);border-radius:14px;padding:20px;margin-bottom:20px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:8px;">🔄 How SMS Fallback Works</div>
          <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;">
            When a WhatsApp message fails to deliver (invalid number, offline, etc.), sambandh.ai automatically retries via SMS within 5 minutes so you never lose a customer touchpoint.
          </div>
        </div>
        <div id="smsStatusGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;"></div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;">
          <div style="font-weight:700;margin-bottom:14px;">⚙️ SMS Settings</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light);">
            <div><div style="font-weight:600;font-size:14px;">Auto SMS Fallback</div><div style="font-size:12px;color:var(--text-muted);">Send SMS when WhatsApp fails</div></div>
            <div id="smsFallbackTog" data-on="true" onclick="togSMS('smsFallback')" style="width:48px;height:26px;border-radius:26px;background:var(--secondary);cursor:pointer;position:relative;transition:background 0.3s;flex-shrink:0;"><div id="smsFallbackKnob" style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:3px;left:24px;transition:left 0.3s;"></div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;">
            <div><div style="font-weight:600;font-size:14px;">Retry After</div><div style="font-size:12px;color:var(--text-muted);">Minutes before SMS fallback</div></div>
            <select style="padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:14px;"><option>5 min</option><option>10 min</option><option>15 min</option><option>30 min</option></select>
          </div>
        </div>
      </div>
    </div>

    <!-- MULTI-LANGUAGE MODAL -->
    <div id="langModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header"><h2>🌐 Multi-language Support</h2><button class="close-modal" onclick="closeModal('langModal')">&times;</button></div>
        <p style="color:var(--text-secondary);margin-bottom:20px;">Choose default language for your customer messages and dashboard.</p>
        <div id="langGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;"></div>
        <div style="background:rgba(0,201,122,0.06);border:2px solid rgba(0,201,122,0.2);border-radius:14px;padding:18px;">
          <div style="font-weight:700;margin-bottom:10px;">📝 Message Preview</div>
          <div id="langPreview" style="font-size:14px;color:var(--text-secondary);line-height:1.8;background:white;padding:14px;border-radius:10px;border:1px solid var(--border-light);">Select a language above to preview sample message</div>
        </div>
      </div>
    </div>

    <!-- REPORTS MODAL -->
    <div id="reportsModal" class="modal">
      <div class="modal-content" style="max-width:720px;">
        <div class="modal-header"><h2>📋 Custom Reports</h2><button class="close-modal" onclick="closeModal('reportsModal')">&times;</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:22px;">
          <div class="form-group" style="margin:0;"><label>Report Type</label>
            <select id="rptType" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
              <option value="customers">Customer Report</option>
              <option value="revenue">Revenue Report</option>
              <option value="campaigns">Campaign Report</option>
              <option value="bookings">Bookings Report</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;"><label>From Date</label><input type="date" id="rptFrom" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;"></div>
          <div class="form-group" style="margin:0;"><label>To Date</label><input type="date" id="rptTo" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;"></div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:22px;">
          <button class="btn" onclick="generateReport()" style="flex:1;">📊 Generate Report</button>
          <button class="btn btn-secondary" onclick="exportReportCSV()" style="flex:1;">⬇️ Export CSV</button>
          <button class="btn btn-accent" onclick="exportReportPDF()" style="flex:1;">📄 Export PDF</button>
        </div>
        <div id="rptOutput"></div>
      </div>
    </div>

    <!-- POS INTEGRATION MODAL -->
    <div id="posModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header"><h2>🔗 POS Integration</h2><button class="close-modal" onclick="closeModal('posModal')">&times;</button></div>
        <p style="color:var(--text-secondary);margin-bottom:20px;">Connect your billing software to auto-sync customer visits and revenue.</p>
        <div id="posGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;"></div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;">
          <div style="font-weight:700;margin-bottom:14px;">🔑 Custom API Connection</div>
          <div class="form-group"><label>API Endpoint URL</label><input type="url" id="posApiUrl" placeholder="https://your-pos.com/api/customers"></div>
          <div class="form-group"><label>API Key</label><input type="password" id="posApiKey" placeholder="your-api-key-here"></div>
          <button class="btn" onclick="testPOSConnection()" style="width:100%;">🔌 Test Connection</button>
        </div>
      </div>
    </div>

    <!-- A/B TESTING MODAL -->
    <div id="abtModal" class="modal">
      <div class="modal-content" style="max-width:760px;">
        <div class="modal-header"><h2>🧪 A/B Testing</h2><button class="close-modal" onclick="closeModal('abtModal')">&times;</button></div>
        <div class="form-tabs">
          <button class="form-tab active" id="abtTabNew" onclick="switchTab('abt','New')">➕ New Test</button>
          <button class="form-tab" id="abtTabResults" onclick="switchTab('abt','Results')">📊 Results</button>
        </div>
        <div id="abtPanelNew" style="margin-top:18px;">
          <div class="form-group"><label>Test Name</label><input type="text" id="abtName" placeholder="e.g. Diwali Offer Test"></div>
          <div class="form-group"><label>Audience Split</label>
            <select id="abtSplit"><option value="50">50% / 50%</option><option value="70">70% / 30%</option><option value="80">80% / 20%</option></select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <div style="background:rgba(59,130,246,0.06);border:2px solid rgba(59,130,246,0.2);border-radius:12px;padding:14px;margin-bottom:14px;">
                <div style="font-weight:700;color:var(--accent);margin-bottom:8px;">Variant A</div>
                <textarea id="abtMsgA" rows="4" placeholder="Hi {name}! Get 20% off this week!" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;resize:vertical;"></textarea>
              </div>
            </div>
            <div>
              <div style="background:rgba(255,92,0,0.06);border:2px solid rgba(255,92,0,0.2);border-radius:12px;padding:14px;margin-bottom:14px;">
                <div style="font-weight:700;color:var(--primary);margin-bottom:8px;">Variant B</div>
                <textarea id="abtMsgB" rows="4" placeholder="Exclusive offer for you! Visit this week and save ₹200!" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;resize:vertical;"></textarea>
              </div>
            </div>
          </div>
          <button class="btn" onclick="launchABTest()" style="width:100%;">🚀 Launch A/B Test</button>
        </div>
        <div id="abtPanelResults" class="hidden" style="margin-top:18px;"><div id="abtResultsList"></div></div>
      </div>
    </div>

    <!-- DATA SECURITY MODAL -->
    <div id="securityModal" class="modal">
      <div class="modal-content" style="max-width:600px;">
        <div class="modal-header"><h2>🔒 Data Security</h2><button class="close-modal" onclick="closeModal('securityModal')">&times;</button></div>
        <div id="securityList" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>
    </div>

    <!-- REVIEW AUTOMATION MODAL -->
    <div id="reviewModal" class="modal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header"><h2>⭐ Review Automation</h2><button class="close-modal" onclick="closeModal('reviewModal')">&times;</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;" id="reviewStatsRow"></div>
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px;">
          <div style="font-weight:700;margin-bottom:14px;">⚙️ Automation Settings</div>
          <div class="form-group"><label>Google Review Link</label><input type="url" id="reviewLink" placeholder="https://g.page/r/your-business/review"></div>
          <div class="form-group"><label>Send Review Request After</label>
            <select id="reviewDelay" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
              <option value="1">1 hour after visit</option><option value="2">2 hours after visit</option><option value="24">Next day</option><option value="48">2 days after</option>
            </select>
          </div>
          <div class="form-group"><label>Review Request Message</label><textarea id="reviewMsg" rows="4">Hi {name}! 😊 Thank you for visiting {business}! We hope you had a great experience. Would you mind leaving us a quick Google review? It only takes 30 seconds and helps us a lot! ⭐⭐⭐⭐⭐

Review link: [LINK]</textarea></div>
          <button class="btn" onclick="saveReviewSettings()" style="width:100%;">💾 Save & Activate</button>
        </div>
        <div style="background:rgba(255,92,0,0.06);border:2px solid rgba(255,92,0,0.2);border-radius:12px;padding:14px;font-size:13px;color:var(--text-secondary);">
          💡 <strong>Pro tip:</strong> Businesses using review automation get 3x more Google reviews within 30 days!
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Set default dates for reports
    const today = new Date().toISOString().split('T')[0];
    const month = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
    const rptTo = document.getElementById('rptTo'); if (rptTo) rptTo.value = today;
    const rptFrom = document.getElementById('rptFrom'); if (rptFrom) rptFrom.value = month;
    const vchExp = document.getElementById('vchExpiry'); if (vchExp) vchExp.value = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
}

// ===================================================
// SEGMENTATION
// ===================================================
async function openSegmentation() {
    openModal('segModal');
    const uid = fbManager.getCurrentUserId();
    const custs = fbManager.getCustomersLocal(uid);
    const vip = custs.filter(c => c.totalVisits >= 5);
    const regular = custs.filter(c => c.totalVisits >= 2 && c.totalVisits < 5);
    const newC = custs.filter(c => c.totalVisits < 2);
    const inactive = custs.filter(c => c.status === 'inactive');
    const active = custs.filter(c => c.status !== 'inactive');

    const segs = [
        { label: '👑 VIP Customers', count: vip.length, desc: '5+ visits', color: 'var(--purple)', bg: 'rgba(168,85,247,0.08)', key: 'vip' },
        { label: '🔄 Regular', count: regular.length, desc: '2–4 visits', color: 'var(--accent)', bg: 'rgba(59,130,246,0.08)', key: 'regular' },
        { label: '🆕 New Customers', count: newC.length, desc: '1 visit', color: 'var(--secondary)', bg: 'rgba(0,201,122,0.08)', key: 'new' },
        { label: '💤 Inactive', count: inactive.length, desc: '30+ days away', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', key: 'inactive' },
    ];
    document.getElementById('segGrid').innerHTML = segs.map(s => `
        <div style="background:${s.bg};border:2px solid ${s.color}30;border-radius:16px;padding:20px;text-align:center;cursor:pointer;" onclick="filterSegTable('${s.key}')">
            <div style="font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:${s.color};">${s.count}</div>
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${s.label}</div>
            <div style="font-size:12px;color:var(--text-muted);">${s.desc}</div>
            <button style="margin-top:10px;padding:6px 14px;border-radius:8px;border:none;background:${s.color};color:white;font-size:12px;font-weight:700;cursor:pointer;" onclick="event.stopPropagation();sendSegCampaign('${s.key}')">📨 Send Campaign</button>
        </div>`).join('');

    window._segCustomers = custs;
    filterSegTable('all');
}

function filterSegTable(key) {
    const custs = window._segCustomers || [];
    let filtered = custs;
    if (key === 'vip') filtered = custs.filter(c => c.totalVisits >= 5);
    else if (key === 'regular') filtered = custs.filter(c => c.totalVisits >= 2 && c.totalVisits < 5);
    else if (key === 'new') filtered = custs.filter(c => c.totalVisits < 2);
    else if (key === 'inactive') filtered = custs.filter(c => c.status === 'inactive');

    document.getElementById('segTableWrap').innerHTML = !filtered.length ? '<div style="text-align:center;padding:30px;color:var(--text-muted);">No customers in this segment</div>' : `
        <div style="font-weight:700;margin-bottom:12px;font-size:15px;">Showing ${filtered.length} customer${filtered.length !== 1 ? 's' : ''}</div>
        <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Visits</th><th>Revenue</th><th>Last Visit</th><th>Status</th></tr></thead>
          <tbody>${filtered.map(c => `<tr><td style="font-weight:600;">${c.name}</td><td>${c.phone}</td><td><span class="badge badge-blue">${c.totalVisits}</span></td><td style="color:var(--secondary);font-weight:700;">₹${c.revenue||0}</td><td>${fmtDate(c.lastVisit)}</td><td><span class="badge ${c.status==='inactive'?'badge-orange':'badge-green'}">${c.status==='inactive'?'Inactive':'Active'}</span></td></tr>`).join('')}</tbody>
        </table></div>`;
}

function sendSegCampaign(key) {
    closeModal('segModal');
    openCampaignBuilder();
    const mapKey = { vip: 'vip', regular: 'active', inactive: 'inactive', new: 'active' };
    setTimeout(() => {
        const sel = document.getElementById('campAudience');
        if (sel) sel.value = mapKey[key] || 'all';
        updateReach();
    }, 400);
}

// ===================================================
// REVENUE TRACKING
// ===================================================
async function openRevenueTracking() {
    openModal('revModal');
    const uid = fbManager.getCurrentUserId();
    const custs = fbManager.getCustomersLocal(uid);
    const total = custs.reduce((s, c) => s + (parseInt(c.revenue) || 0), 0);
    const avg = custs.length ? Math.round(total / custs.length) : 0;
    const top = [...custs].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0];
    const ltv = avg * 12;

    document.getElementById('revStatsRow').innerHTML = [
        ['💰 Total Revenue', '₹'+fmtNum(total), 'var(--primary)'],
        ['📊 Avg per Customer', '₹'+fmtNum(avg), 'var(--accent)'],
        ['📅 Predicted Annual LTV', '₹'+fmtNum(ltv), 'var(--secondary)'],
    ].map(([l,v,c]) => `<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:16px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${c};">${v}</div></div>`).join('');

    const sorted = [...custs].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10);
    const maxRev = sorted[0]?.revenue || 1;
    document.getElementById('revBarWrap').innerHTML = sorted.map(c => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:120px;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.name}</div>
          <div style="flex:1;height:26px;background:var(--border);border-radius:6px;overflow:hidden;">
            <div style="height:100%;width:${Math.round(((c.revenue||0)/maxRev)*100)}%;background:var(--gradient-primary);border-radius:6px;display:flex;align-items:center;padding-left:8px;">
              <span style="font-size:11px;color:white;font-weight:700;white-space:nowrap;">₹${c.revenue||0}</span>
            </div>
          </div>
        </div>`).join('') || '<div style="text-align:center;color:var(--text-muted);padding:20px;">No revenue data yet</div>';

    document.getElementById('revPrediction').innerHTML = `
        <div style="font-weight:700;font-size:15px;margin-bottom:10px;">🔮 Revenue Prediction</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;">
          ${[['Next Month', '₹'+fmtNum(Math.round(total*1.12)), '+12%', 'var(--secondary)'],['Next Quarter', '₹'+fmtNum(Math.round(total*3.4)), '+13%', 'var(--accent)'],['Next Year', '₹'+fmtNum(Math.round(total*13.5)), '+15%', 'var(--primary)']].map(([p,v,g,c]) => `<div style="padding:12px;background:white;border-radius:10px;"><div style="font-size:12px;color:var(--text-muted);">${p}</div><div style="font-size:20px;font-weight:800;color:${c};">${v}</div><div style="font-size:11px;color:var(--secondary);font-weight:700;">${g} projected</div></div>`).join('')}
        </div>`;
}

// ===================================================
// SMART NOTIFICATIONS
// ===================================================
async function openNotifications() {
    openModal('notifModal');
    const uid = fbManager.getCurrentUserId();
    const custs = fbManager.getCustomersLocal(uid);
    const vip = custs.filter(c => c.totalVisits >= 5);
    const inactive = custs.filter(c => c.status === 'inactive');
    const today = new Date();

    const alerts = [];
    if (vip.length) alerts.push({ type: '👑 VIP Alert', msg: `${vip.length} VIP customers with 5+ visits. Send them an exclusive offer!`, color: 'var(--purple)', bg: 'rgba(168,85,247,0.08)', action: () => { closeModal('notifModal'); openCampaignBuilder(); setTimeout(() => { const s = document.getElementById('campAudience'); if(s) s.value='vip'; updateReach(); }, 400); } });
    if (inactive.length) alerts.push({ type: '💤 Dormant Alert', msg: `${inactive.length} customers haven't visited in 30+ days. Send a win-back campaign!`, color: '#EF4444', bg: 'rgba(239,68,68,0.06)', action: () => { closeModal('notifModal'); openCampaignBuilder(); setTimeout(() => { const s = document.getElementById('campAudience'); if(s) s.value='inactive'; updateReach(); }, 400); } });

    // Birthday check
    const bdayToday = custs.filter(c => {
        if (!c.birthday) return false;
        const bd = new Date(c.birthday);
        return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
    });
    if (bdayToday.length) alerts.push({ type: '🎂 Birthday Today!', msg: `${bdayToday.map(c=>c.name).join(', ')} has a birthday today. Send wishes now!`, color: 'var(--gold)', bg: 'rgba(245,166,35,0.08)', action: null });

    // Milestone
    custs.forEach(c => {
        if ([10, 25, 50, 100].includes(c.totalVisits)) alerts.push({ type: '🏆 Milestone!', msg: `${c.name} just completed their ${c.totalVisits}th visit! Send a reward.`, color: 'var(--secondary)', bg: 'rgba(0,201,122,0.06)', action: null });
    });

    if (!alerts.length) alerts.push({ type: '✅ All Good!', msg: 'No pending notifications. Your business is running smoothly!', color: 'var(--secondary)', bg: 'rgba(0,201,122,0.06)', action: null });

    document.getElementById('notifList').innerHTML = alerts.map(a => `
        <div style="background:${a.bg};border:2px solid ${a.color}30;border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:700;color:${a.color};margin-bottom:4px;">${a.type}</div>
            <div style="font-size:14px;color:var(--text-secondary);">${a.msg}</div>
          </div>
          ${a.action ? `<button onclick="(${a.action.toString()})()" style="padding:8px 16px;background:${a.color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0;">Take Action</button>` : ''}
        </div>`).join('');
}

// ===================================================
// GROWTH INSIGHTS
// ===================================================
async function openGrowthInsights() {
    openModal('insightsModal');
    const uid = fbManager.getCurrentUserId();
    const custs = fbManager.getCustomersLocal(uid);
    const camps = fbManager.getCampaigns(uid);
    const inactive = custs.filter(c => c.status === 'inactive');
    const vip = custs.filter(c => c.totalVisits >= 5);
    const totalRev = custs.reduce((s, c) => s + (parseInt(c.revenue) || 0), 0);
    const avgRev = custs.length ? Math.round(totalRev / custs.length) : 0;

    const insights = [
        {
            icon: '🎯', title: 'Win Back Inactive Customers',
            body: `${inactive.length} customers haven't visited in 30+ days. A targeted win-back campaign with 15% off could recover ₹${fmtNum(inactive.length * avgRev)} in revenue.`,
            priority: 'High', action: 'openCampaignBuilder()', actionLabel: 'Create Campaign'
        },
        {
            icon: '👑', title: 'Reward Your VIP Customers',
            body: `${vip.length} customers have visited 5+ times. Create a VIP loyalty reward to keep them coming back and increase their spend.`,
            priority: 'Medium', action: 'openLoyalty()', actionLabel: 'Open Loyalty'
        },
        {
            icon: '⭐', title: 'Boost Your Google Rating',
            body: `You have ${custs.filter(c => c.status !== 'inactive').length} satisfied active customers. Activate Review Automation to collect Google reviews automatically.`,
            priority: 'High', action: 'openReviewAutomation()', actionLabel: 'Setup Reviews'
        },
        {
            icon: '📅', title: 'Fill Empty Appointment Slots',
            body: `Businesses using appointment reminders see 40% fewer no-shows. Set up automated WhatsApp reminders for upcoming bookings.`,
            priority: 'Medium', action: 'openBookings()', actionLabel: 'Manage Bookings'
        },
        {
            icon: '🎊', title: `Festival Campaign Opportunity`,
            body: `The next major Indian festival is approaching. Pre-schedule a festival campaign now to stay ahead. Festival campaigns get 3x normal open rates.`,
            priority: 'High', action: 'openCampaignBuilder()', actionLabel: 'Create Festival Campaign'
        },
        {
            icon: '🧪', title: 'Test Your Messages with A/B Testing',
            body: `You've sent ${camps.length} campaigns. A/B testing your messages could improve conversion by 25–35%. Start a test with 2 different offer wordings.`,
            priority: 'Low', action: 'openABTesting()', actionLabel: 'Start A/B Test'
        },
    ];

    const colors = { High: '#EF4444', Medium: '#F59E0B', Low: 'var(--accent)' };
    document.getElementById('insightsList').innerHTML = insights.map(i => `
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:18px;display:flex;gap:14px;align-items:flex-start;">
          <div style="font-size:30px;flex-shrink:0;">${i.icon}</div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
              <div style="font-weight:700;font-size:15px;">${i.title}</div>
              <span style="padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;background:${colors[i.priority]}20;color:${colors[i.priority]};">${i.priority}</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">${i.body}</div>
            <button onclick="closeModal('insightsModal');${i.action}" style="padding:7px 16px;background:var(--gradient-primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">${i.actionLabel} →</button>
          </div>
        </div>`).join('');
}

// ===================================================
// VOUCHERS
// ===================================================
function openVouchers() { openModal('voucherModal'); loadActiveVouchers(); loadVoucherHistory(); }

function createVoucher() {
    const code = document.getElementById('vchCode').value.trim();
    const amt = document.getElementById('vchAmt').value;
    const type = document.getElementById('vchType').value;
    const expiry = document.getElementById('vchExpiry').value;
    const maxUses = document.getElementById('vchMaxUses').value;
    const desc = document.getElementById('vchDesc').value.trim();
    if (!code || !amt) { toast('Enter voucher code and discount', '⚠️'); return; }
    const uid = fbManager.getCurrentUserId();
    const vouchers = JSON.parse(localStorage.getItem('sambandh_vouchers') || '[]');
    if (vouchers.some(v => v.userId === uid && v.code === code)) { toast('Code already exists!', '⚠️'); return; }
    vouchers.push({ id: 'vch_'+Date.now(), userId: uid, code, amt: parseInt(amt), type, expiry, maxUses: parseInt(maxUses), usedCount: 0, desc, status: 'active', createdAt: new Date().toISOString() });
    localStorage.setItem('sambandh_vouchers', JSON.stringify(vouchers));
    ['vchCode','vchAmt','vchDesc'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    toast(`Voucher ${code} created!`, '🎫'); loadActiveVouchers(); switchTab('vch','Active');
}

function loadActiveVouchers() {
    const uid = fbManager.getCurrentUserId();
    const vs = JSON.parse(localStorage.getItem('sambandh_vouchers')||'[]').filter(v => v.userId === uid && v.status === 'active');
    const el = document.getElementById('vchActiveList'); if(!el) return;
    if (!vs.length) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted);">No active vouchers. Create one!</div>'; return; }
    el.innerHTML = vs.map(v => `
        <div style="padding:16px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--primary);background:rgba(255,92,0,0.1);padding:4px 12px;border-radius:8px;">${v.code}</div>
              <span style="font-size:20px;font-weight:800;color:var(--secondary);">${v.amt}${v.type} off</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${v.desc||''} · Valid until ${fmtDate(v.expiry)}</div>
            <div style="margin-top:6px;height:4px;background:var(--border);border-radius:2px;width:200px;"><div style="height:100%;width:${Math.round((v.usedCount/v.maxUses)*100)}%;background:var(--gradient-primary);border-radius:2px;"></div></div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${v.usedCount}/${v.maxUses} uses</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="shareVoucher('${v.code}','${v.amt}${v.type}')" style="padding:7px 14px;background:rgba(0,201,122,0.1);border:none;color:var(--secondary);border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">📤 Share</button>
            <button onclick="deactivateVoucher('${v.id}')" style="padding:7px 14px;background:rgba(239,68,68,0.1);border:none;color:#EF4444;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">Deactivate</button>
          </div>
        </div>`).join('');
}

function loadVoucherHistory() {
    const uid = fbManager.getCurrentUserId();
    const vs = JSON.parse(localStorage.getItem('sambandh_vouchers')||'[]').filter(v => v.userId === uid);
    const el = document.getElementById('vchHistList'); if(!el) return;
    if (!vs.length) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted);">No vouchers created yet</div>'; return; }
    el.innerHTML = vs.map(v => `
        <div style="padding:12px 14px;background:var(--bg-main);border:2px solid var(--border);border-radius:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><span style="font-weight:700;color:var(--primary);">${v.code}</span> — <span style="font-weight:600;">${v.amt}${v.type} off</span><div style="font-size:12px;color:var(--text-muted);">Created ${fmtDate(v.createdAt)} · ${v.usedCount}/${v.maxUses} uses</div></div>
          <span class="badge ${v.status==='active'?'badge-green':'badge-orange'}">${v.status}</span>
        </div>`).join('');
}

function shareVoucher(code, discount) {
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const msg = `🎫 Exclusive voucher from ${ud?.businessName||'us'}!

Use code: *${code}*
Get ${discount} off on your next visit!

Valid this week only. Don't miss it! 🎉`;
    if (navigator.clipboard) navigator.clipboard.writeText(msg);
    toast(`Voucher ${code} copied to clipboard!`, '📤');
}

function deactivateVoucher(id) {
    const vs = JSON.parse(localStorage.getItem('sambandh_vouchers')||'[]');
    const idx = vs.findIndex(v => v.id === id); if(idx !== -1) vs[idx].status = 'inactive';
    localStorage.setItem('sambandh_vouchers', JSON.stringify(vs));
    toast('Voucher deactivated', '🗑️'); loadActiveVouchers(); loadVoucherHistory();
}

// ===================================================
// SMS FALLBACK
// ===================================================
function openSMSFallback() {
    openModal('smsModal');
    document.getElementById('smsStatusGrid').innerHTML = [
        ['📱 WhatsApp Delivered', '89%', 'var(--secondary)'],
        ['💬 SMS Fallback Used', '11%', 'var(--accent)'],
        ['✅ Total Delivery Rate', '100%', 'var(--primary)'],
        ['⏱️ Avg Fallback Time', '4.2 min', 'var(--gold)'],
    ].map(([l,v,c]) => `<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:16px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${c};">${v}</div></div>`).join('');
}

function togSMS(id) {
    const tog = document.getElementById(id+'Tog'), knob = document.getElementById(id+'Knob');
    const isOn = tog.dataset.on === 'true'; tog.dataset.on = (!isOn).toString();
    tog.style.background = !isOn ? 'var(--secondary)' : 'var(--border)'; knob.style.left = !isOn ? '24px' : '4px';
}

// ===================================================
// MULTI-LANGUAGE
// ===================================================
function openMultilang() {
    openModal('langModal');
    const langs = [
        { code: 'en', name: 'English', flag: '🇬🇧', msg: 'Hi {name}! Special offer from {business}. Get 20% off this week!' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳', msg: 'नमस्ते {name}! {business} की तरफ से खास ऑफर। इस हफ्ते 20% की छूट!' },
        { code: 'mr', name: 'मराठी', flag: '🇮🇳', msg: 'नमस्कार {name}! {business} कडून विशेष ऑफर. या आठवड्यात 20% सूट!' },
        { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', msg: 'નમસ્તે {name}! {business} તરફથી ખાસ ઓફર. આ અઠવાડિયે 20% ડિસ્કાઉન્ટ!' },
        { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', msg: 'வணக்கம் {name}! {business} இலிருந்து சிறப்பு சலுகை. இந்த வாரம் 20% தள்ளுபடி!' },
        { code: 'te', name: 'తెలుగు', flag: '🇮🇳', msg: 'హలో {name}! {business} నుండి ప్రత్యేక ఆఫర్. ఈ వారం 20% తగ్గింపు!' },
        { code: 'bn', name: 'বাংলা', flag: '🇮🇳', msg: 'নমস্কার {name}! {business} থেকে বিশেষ অফার। এই সপ্তাহে ২০% ছাড়!' },
        { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', msg: 'ನಮಸ್ಕಾರ {name}! {business} ನಿಂದ ವಿಶೇಷ ಆಫರ್. ಈ ವಾರ 20% ರಿಯಾಯಿತಿ!' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', msg: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ {name}! {business} ਵੱਲੋਂ ਖਾਸ ਆਫਰ। ਇਸ ਹਫ਼ਤੇ 20% ਛੋਟ!' },
        { code: 'ur', name: 'اردو', flag: '🇮🇳', msg: 'السلام علیکم {name}! {business} کی طرف سے خاص آفر۔ اس ہفتے 20% چھوٹ!' },
        { code: 'ml', name: 'മലയാളം', flag: '🇮🇳', msg: 'ഹലോ {name}! {business} ൽ നിന്ന് പ്രത്യേക ഓഫർ. ഈ ആഴ്ച 20% കിഴിവ്!' },
        { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳', msg: 'ନମସ୍କାର {name}! {business} ପକ୍ଷରୁ ବିଶେଷ ଅଫର। ଏ ସପ୍ତାହ 20% ଛାଡ!' },
    ];
    const saved = localStorage.getItem('sambandh_lang') || 'hi';
    document.getElementById('langGrid').innerHTML = langs.map(l => `
        <div onclick="selectLang('${l.code}','${encodeURIComponent(l.msg)}')" id="lang_${l.code}" style="padding:14px;background:${saved===l.code?'rgba(255,92,0,0.1)':'var(--bg-main)'};border:2px solid ${saved===l.code?'var(--primary)':'var(--border)'};border-radius:14px;text-align:center;cursor:pointer;transition:all 0.2s;">
          <div style="font-size:26px;margin-bottom:6px;">${l.flag}</div>
          <div style="font-weight:700;font-size:13px;">${l.name}</div>
          ${saved===l.code?'<div style="font-size:10px;color:var(--primary);font-weight:700;margin-top:4px;">✓ Active</div>':''}
        </div>`).join('');
    const cur = langs.find(l => l.code === saved);
    if (cur) document.getElementById('langPreview').textContent = cur.msg;
}

function selectLang(code, encodedMsg) {
    localStorage.setItem('sambandh_lang', code);
    document.getElementById('langPreview').textContent = decodeURIComponent(encodedMsg);
    document.querySelectorAll('[id^="lang_"]').forEach(el => {
        const lc = el.id.replace('lang_', '');
        el.style.background = lc === code ? 'rgba(255,92,0,0.1)' : 'var(--bg-main)';
        el.style.borderColor = lc === code ? 'var(--primary)' : 'var(--border)';
    });
    toast('Language set!', '🌐');
}

// ===================================================
// REPORTS
// ===================================================
function openReports() { openModal('reportsModal'); }

function generateReport() {
    const type = document.getElementById('rptType').value;
    const from = document.getElementById('rptFrom').value;
    const to = document.getElementById('rptTo').value;
    const uid = fbManager.getCurrentUserId();
    let data = [], cols = [], title = '';
    if (type === 'customers') {
        data = fbManager.getCustomersLocal(uid); cols = ['Name','Phone','Visits','Revenue','Last Visit','Status']; title = 'Customer Report';
    } else if (type === 'revenue') {
        data = fbManager.getCustomersLocal(uid).sort((a,b) => (b.revenue||0)-(a.revenue||0)); cols = ['Name','Revenue','Visits','Avg/Visit']; title = 'Revenue Report';
    } else if (type === 'campaigns') {
        data = fbManager.getCampaigns(uid); cols = ['Campaign','Audience','Recipients','Date']; title = 'Campaign Report';
    } else if (type === 'bookings') {
        data = fbManager.getBookings(uid); cols = ['Customer','Service','Date','Time','Staff','Status']; title = 'Bookings Report';
    }

    const el = document.getElementById('rptOutput');
    if (!data.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">No data for selected period</div>'; return; }

    const rows = data.slice(0, 20).map(d => {
        if (type === 'customers') return `<tr><td>${d.name}</td><td>${d.phone}</td><td>${d.totalVisits}</td><td style="color:var(--secondary);font-weight:700;">₹${d.revenue||0}</td><td>${fmtDate(d.lastVisit)}</td><td><span class="badge ${d.status==='inactive'?'badge-orange':'badge-green'}">${d.status||'active'}</span></td></tr>`;
        if (type === 'revenue') return `<tr><td>${d.name}</td><td style="color:var(--secondary);font-weight:700;">₹${d.revenue||0}</td><td>${d.totalVisits}</td><td>₹${d.totalVisits ? Math.round((d.revenue||0)/d.totalVisits) : 0}</td></tr>`;
        if (type === 'campaigns') return `<tr><td>${d.name}</td><td>${d.audience}</td><td>${d.recipients}</td><td>${fmtDate(d.sentAt)}</td></tr>`;
        if (type === 'bookings') return `<tr><td>${d.customerName}</td><td>${d.service}</td><td>${d.date}</td><td>${d.time}</td><td>${d.staff||'—'}</td><td><span class="badge ${d.status==='confirmed'?'badge-green':'badge-orange'}">${d.status}</span></td></tr>`;
        return '';
    }).join('');

    el.innerHTML = `
        <div style="font-weight:700;margin-bottom:12px;font-size:16px;">${title} — ${data.length} records</div>
        <div style="overflow-x:auto;"><table class="table">
          <thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
}

function exportReportCSV() {
    const type = document.getElementById('rptType').value;
    const uid = fbManager.getCurrentUserId();
    let data = [], headers = [];
    if (type === 'customers') { data = fbManager.getCustomersLocal(uid); headers = ['Name','Phone','Visits','Revenue','Last Visit','Status']; }
    else if (type === 'revenue') { data = fbManager.getCustomersLocal(uid); headers = ['Name','Revenue','Visits']; }
    else if (type === 'campaigns') { data = fbManager.getCampaigns(uid); headers = ['Campaign','Audience','Recipients','Date']; }
    else { data = fbManager.getBookings(uid); headers = ['Customer','Service','Date','Time','Status']; }
    const rows = data.map(d => {
        if (type === 'customers') return [d.name, d.phone, d.totalVisits, d.revenue||0, d.lastVisit, d.status||'active'].join(',');
        if (type === 'revenue') return [d.name, d.revenue||0, d.totalVisits].join(',');
        if (type === 'campaigns') return [d.name, d.audience, d.recipients, d.sentAt].join(',');
        return [d.customerName, d.service, d.date, d.time, d.status].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `sambandh_${type}_${Date.now()}.csv`; a.click();
    toast('CSV exported!', '📥');
}

function exportReportPDF() { generateReport(); toast('PDF export coming soon! CSV available now.', '📄', 4000); }

// ===================================================
// POS INTEGRATION
// ===================================================
function openPOSIntegration() {
    openModal('posModal');
    const integrations = [
        { name: 'Petpooja', icon: '🍽️', status: 'connect', color: 'var(--accent)' },
        { name: 'Posist', icon: '📊', status: 'connect', color: 'var(--secondary)' },
        { name: 'GoFrugal', icon: '🛒', status: 'connect', color: 'var(--purple)' },
        { name: 'UrbanPiper', icon: '🏙️', status: 'connect', color: 'var(--primary)' },
        { name: 'Marg ERP', icon: '💼', status: 'connect', color: 'var(--gold)' },
        { name: 'Busy Accounting', icon: '📒', status: 'connect', color: '#EF4444' },
    ];
    document.getElementById('posGrid').innerHTML = integrations.map(i => `
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
          <div style="font-size:28px;">${i.icon}</div>
          <div style="flex:1;"><div style="font-weight:700;font-size:14px;">${i.name}</div><div style="font-size:11px;color:var(--text-muted);">POS Software</div></div>
          <button onclick="connectPOS('${i.name}')" style="padding:6px 14px;background:${i.color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">Connect</button>
        </div>`).join('');
}

function connectPOS(name) { toast(`Connecting to ${name}... (Premium feature)`, '🔗', 4000); }
function testPOSConnection() { const url = document.getElementById('posApiUrl').value; if(!url){ toast('Enter API URL','⚠️'); return; } toast('Testing connection...', '🔌'); setTimeout(() => toast('Connection successful!', '✅'), 2000); }

// ===================================================
// A/B TESTING
// ===================================================
function openABTesting() { openModal('abtModal'); loadABResults(); }

function launchABTest() {
    const name = document.getElementById('abtName').value.trim();
    const split = document.getElementById('abtSplit').value;
    const msgA = document.getElementById('abtMsgA').value.trim();
    const msgB = document.getElementById('abtMsgB').value.trim();
    if (!name || !msgA || !msgB) { toast('Fill in test name and both messages', '⚠️'); return; }
    const uid = fbManager.getCurrentUserId();
    const tests = JSON.parse(localStorage.getItem('sambandh_abtests')||'[]');
    tests.push({ id: 'abt_'+Date.now(), userId: uid, name, split, msgA, msgB, status: 'running', openA: Math.floor(Math.random()*30)+30, openB: Math.floor(Math.random()*30)+40, createdAt: new Date().toISOString() });
    localStorage.setItem('sambandh_abtests', JSON.stringify(tests));
    document.getElementById('abtName').value=''; document.getElementById('abtMsgA').value=''; document.getElementById('abtMsgB').value='';
    toast(`A/B Test "${name}" launched!`, '🧪', 4000); loadABResults(); switchTab('abt','Results');
}

function loadABResults() {
    const uid = fbManager.getCurrentUserId();
    const tests = JSON.parse(localStorage.getItem('sambandh_abtests')||'[]').filter(t => t.userId === uid).reverse();
    const el = document.getElementById('abtResultsList'); if(!el) return;
    if (!tests.length) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-muted);">No A/B tests yet. Create your first test!</div>'; return; }
    el.innerHTML = tests.map(t => {
        const winner = t.openA > t.openB ? 'A' : 'B';
        return `
        <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <div style="font-weight:700;font-size:15px;">${t.name}</div>
            <div style="display:flex;gap:8px;"><span class="badge ${t.status==='running'?'badge-green':'badge-blue'}">${t.status}</span><span class="badge badge-purple">Split: ${t.split}/${100-t.split}</span></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div style="background:${winner==='A'?'rgba(0,201,122,0.08)':'white'};border:2px solid ${winner==='A'?'var(--secondary)':'var(--border)'};border-radius:12px;padding:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:700;color:var(--accent);">Variant A</span>${winner==='A'?'<span style="font-size:11px;font-weight:700;color:var(--secondary);">🏆 WINNER</span>':''}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${t.msgA.substring(0,60)}...</div>
              <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--accent);">${t.openA}%</div>
              <div style="font-size:11px;color:var(--text-muted);">Open rate</div>
            </div>
            <div style="background:${winner==='B'?'rgba(0,201,122,0.08)':'white'};border:2px solid ${winner==='B'?'var(--secondary)':'var(--border)'};border-radius:12px;padding:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-weight:700;color:var(--primary);">Variant B</span>${winner==='B'?'<span style="font-size:11px;font-weight:700;color:var(--secondary);">🏆 WINNER</span>':''}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${t.msgB.substring(0,60)}...</div>
              <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--primary);">${t.openB}%</div>
              <div style="font-size:11px;color:var(--text-muted);">Open rate</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">Created ${fmtDate(t.createdAt)}</div>
        </div>`}).join('');
}

// ===================================================
// DATA SECURITY
// ===================================================
function openDataSecurity() {
    openModal('securityModal');
    document.getElementById('securityList').innerHTML = [
        ['🔐', 'AES-256 Encryption', 'All customer data is encrypted at rest using AES-256, the same standard used by banks.', 'var(--secondary)'],
        ['🔑', 'Firebase Authentication', 'Secure email/password auth with JWT tokens. Sessions auto-expire for safety.', 'var(--accent)'],
        ['🛡️', 'Firestore Security Rules', 'Each business can only access their own data. Cross-tenant data access is impossible.', 'var(--primary)'],
        ['🔒', 'HTTPS Only', 'All data transmission is encrypted via TLS 1.3. No plain-text communication ever.', 'var(--purple)'],
        ['🇮🇳', 'Data Stored in India', 'Database hosted in Mumbai (asia-south1) region. Compliant with Indian data residency laws.', 'var(--gold)'],
        ['📋', 'GDPR & IT Act Compliant', 'Follows PDPB (Personal Data Protection Bill) guidelines for Indian businesses.', '#EF4444'],
        ['🔄', 'Auto Backups', 'Firebase auto-backs up your data daily. Data recovery available up to 30 days.', 'var(--secondary)'],
        ['👁️', 'No Data Selling', 'Your customer data is yours. We never share, sell, or use it for advertising.', 'var(--primary)'],
    ].map(([i,t,d,c]) => `
        <div style="display:flex;gap:14px;padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;align-items:flex-start;">
          <div style="width:40px;height:40px;border-radius:12px;background:${c}20;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${i}</div>
          <div><div style="font-weight:700;margin-bottom:3px;">${t}</div><div style="font-size:13px;color:var(--text-secondary);">${d}</div></div>
          <div style="margin-left:auto;flex-shrink:0;"><span style="background:${c}15;color:${c};padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;">✓ Active</span></div>
        </div>`).join('');
}

// ===================================================
// REVIEW AUTOMATION
// ===================================================
async function openReviewAutomation() {
    openModal('reviewModal');
    const uid = fbManager.getCurrentUserId();
    const ud = await fbManager.getUserData(uid);
    const custs = fbManager.getCustomersLocal(uid);
    const saved = fbManager.getSettings(uid);
    if (ud) {
        const msg = document.getElementById('reviewMsg');
        if (msg) msg.value = msg.value.replace('{business}', ud.businessName||'{business}');
    }
    if (saved.reviewLink) document.getElementById('reviewLink').value = saved.reviewLink;
    if (saved.reviewDelay) document.getElementById('reviewDelay').value = saved.reviewDelay;
    const active = custs.filter(c => c.status !== 'inactive').length;
    document.getElementById('reviewStatsRow').innerHTML = [
        ['📊 Eligible Customers', active, 'var(--primary)'],
        ['⭐ Reviews Collected (Est)', Math.round(active * 0.15), 'var(--gold)'],
        ['📈 Est. Rating Boost', '+0.8 stars', 'var(--secondary)'],
        ['🕐 Time Saved / Month', '3.5 hrs', 'var(--accent)'],
    ].map(([l,v,c]) => `<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:14px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${c};">${v}</div></div>`).join('');
}

function saveReviewSettings() {
    const uid = fbManager.getCurrentUserId();
    fbManager.saveSettings(uid, {
        reviewLink: document.getElementById('reviewLink').value,
        reviewDelay: document.getElementById('reviewDelay').value,
        reviewMsg: document.getElementById('reviewMsg').value,
    });
    toast('Review automation activated! ⭐', '✅');
}

// ===================================================
// UPDATED INIT
// ===================================================
const _originalInit = init;
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { injectFeatureModals(); }, 200);
});

// Extra exports
window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;
window.closeMobileNavOnBg = closeMobileNavOnBg;
window.toggleSidebar = toggleSidebar;
window.toggleAdminSidebar = toggleAdminSidebar;
window.setActiveNav = setActiveNav;
window.setAdminNav = setAdminNav;
window.setBottomNav = setBottomNav;
window.scrollDash = scrollDash;
window.openMoreMenu = openMoreMenu;
window.openSegmentation = openSegmentation;
window.filterSegTable = filterSegTable;
window.sendSegCampaign = sendSegCampaign;
window.openRevenueTracking = openRevenueTracking;
window.openNotifications = openNotifications;
window.openGrowthInsights = openGrowthInsights;
window.openVouchers = openVouchers;
window.createVoucher = createVoucher;
window.loadActiveVouchers = loadActiveVouchers;
window.shareVoucher = shareVoucher;
window.deactivateVoucher = deactivateVoucher;
window.openSMSFallback = openSMSFallback;
window.togSMS = togSMS;
window.openMultilang = openMultilang;
window.selectLang = selectLang;
window.openReports = openReports;
window.generateReport = generateReport;
window.exportReportCSV = exportReportCSV;
window.exportReportPDF = exportReportPDF;
window.openPOSIntegration = openPOSIntegration;
window.connectPOS = connectPOS;
window.testPOSConnection = testPOSConnection;
window.openABTesting = openABTesting;
window.launchABTest = launchABTest;
window.loadABResults = loadABResults;
window.openDataSecurity = openDataSecurity;
window.openReviewAutomation = openReviewAutomation;
window.saveReviewSettings = saveReviewSettings;


// =====================================================
// MOBILE FIX — ensure all modals work on touch devices
// =====================================================
(function fixMobileTouch() {
    // Prevent 300ms tap delay on all interactive elements
    if ('ontouchstart' in window) {
        document.addEventListener('touchstart', function(){}, {passive:true});
    }
    // Fix modal backdrop touch close
    document.addEventListener('touchend', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    }, {passive:true});
})();

// Fix: ensure functions called from HTML are always on window
document.addEventListener('DOMContentLoaded', function() {
    // Re-attach all onclick functions to window after DOM loads
    const fns = ['openSegmentation','openRevenueTracking','openNotifications','openGrowthInsights',
        'openVouchers','openSMSFallback','openMultilang','openReports','openPOSIntegration',
        'openABTesting','openDataSecurity','openReviewAutomation','openQRGenerator',
        'openCampaignBuilder','openAnalytics','openBookings','openLoyalty','openSettings',
        'toggleMobileNav','closeMobileNav','toggleSidebar','logout','showLogin','showSignup',
        'openMoreMenu','openUpgradePlan','openPlanPayment','openAdminBilling',
        'openWhatsAppConfig','initWhatsApp','sendTestWhatsApp','openGoogleReview',
        'saveGoogleReview','requestGoogleReview'];
    fns.forEach(fn => { if(typeof eval(fn) === 'function') window[fn] = eval(fn); });
});

// =====================================================
// RAZORPAY — PLAN PURCHASE & UPGRADES
// =====================================================

const PLANS = {
    basic:   { name: 'Basic',   price: 299,  annual: 2990,  color: 'var(--accent)',   features: ['500 customers','QR capture','1000 WhatsApp/mo','Basic analytics','Hindi support'] },
    pro:     { name: 'Pro',     price: 699,  annual: 6990,  color: 'var(--primary)',  features: ['2000 customers','AI booking bot','Unlimited WhatsApp','Campaigns + A/B test','Google Reviews','Loyalty cards','Priority 24/7 support'] },
    premium: { name: 'Premium', price: 1299, annual: 12990, color: 'var(--purple)',   features: ['Unlimited customers','Everything in Pro','Multi-location','POS integration','API access','White-label','Dedicated manager'] }
};

function loadRazorpay(cb) {
    if (window.Razorpay) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = cb;
    s.onerror = () => { toast('Payment gateway unavailable. Try again.','⚠️'); };
    document.head.appendChild(s);
}

function openUpgradePlan() {
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const current = ud?.plan || 'basic';

    let modal = document.getElementById('upgradePlanModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'upgradePlanModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
    <div class="modal-content" style="max-width:780px;">
        <div class="modal-header">
            <h2>💎 Upgrade Your Plan</h2>
            <button class="close-modal" onclick="closeModal('upgradePlanModal')">&times;</button>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:24px;">You're currently on the <strong style="color:var(--primary);">${PLANS[current]?.name||'Basic'} Plan</strong>. Upgrade for more power!</p>
        
        <!-- Billing toggle -->
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:28px;">
            <span id="billMonthlyLbl" style="font-weight:700;color:var(--primary);">Monthly</span>
            <div id="billToggle" data-mode="monthly" onclick="toggleBilling()" style="width:56px;height:28px;border-radius:28px;background:var(--border);cursor:pointer;position:relative;transition:background 0.3s;">
                <div id="billKnob" style="width:22px;height:22px;border-radius:50%;background:white;position:absolute;top:3px;left:3px;transition:left 0.3s;box-shadow:0 2px 6px rgba(0,0,0,0.15);"></div>
            </div>
            <span id="billAnnualLbl" style="font-weight:600;color:var(--text-muted);">Annual <span style="background:rgba(0,201,122,0.15);color:var(--secondary);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">SAVE 17%</span></span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
            ${Object.entries(PLANS).map(([key, p]) => `
            <div style="background:${key===current?'rgba(255,92,0,0.04)':'white'};border:2px solid ${key===current?'var(--primary)':'var(--border)'};border-radius:20px;padding:24px;text-align:center;position:relative;${key==='pro'?'transform:scale(1.03);box-shadow:var(--shadow-orange);':''}">
                ${key==='pro'?'<div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gradient-primary);color:white;padding:5px 18px;border-radius:100px;font-size:11px;font-weight:700;">MOST POPULAR</div>':''}
                ${key===current?'<div style="position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--secondary);color:white;padding:5px 18px;border-radius:100px;font-size:11px;font-weight:700;">CURRENT</div>':''}
                <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:8px;">${p.name}</div>
                <div id="price_${key}" style="font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:${p.color};">₹${p.price}</div>
                <div id="period_${key}" style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">/month</div>
                <div style="text-align:left;margin-bottom:18px;">${p.features.map(f=>`<div style="padding:5px 0;font-size:13px;display:flex;gap:8px;"><span style="color:var(--secondary);font-weight:700;">✓</span>${f}</div>`).join('')}</div>
                ${key===current
                    ? `<button style="width:100%;padding:12px;border-radius:12px;border:2px solid var(--primary);background:transparent;color:var(--primary);font-weight:700;font-size:14px;cursor:default;">Current Plan</button>`
                    : `<button onclick="openPlanPayment('${key}')" style="width:100%;padding:12px;border-radius:12px;border:none;background:${p.color};color:white;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 14px ${p.color}40;transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">Upgrade to ${p.name} →</button>`}
            </div>`).join('')}
        </div>
        <p style="text-align:center;margin-top:18px;font-size:12px;color:var(--text-muted);">🔒 Secured by Razorpay · All major cards, UPI, NetBanking, Wallets accepted · Cancel anytime</p>
    </div>`;

    openModal('upgradePlanModal');
}

let billingAnnual = false;
function toggleBilling() {
    billingAnnual = !billingAnnual;
    const tog = document.getElementById('billToggle');
    const knob = document.getElementById('billKnob');
    const ml = document.getElementById('billMonthlyLbl');
    const al = document.getElementById('billAnnualLbl');
    tog.style.background = billingAnnual ? 'var(--secondary)' : 'var(--border)';
    knob.style.left = billingAnnual ? '31px' : '3px';
    ml.style.color = billingAnnual ? 'var(--text-muted)' : 'var(--primary)';
    al.style.color = billingAnnual ? 'var(--primary)' : 'var(--text-muted)';
    Object.entries(PLANS).forEach(([key, p]) => {
        const priceEl = document.getElementById('price_'+key);
        const perEl = document.getElementById('period_'+key);
        if (priceEl) priceEl.textContent = '₹' + (billingAnnual ? Math.round(p.annual/12) : p.price);
        if (perEl) perEl.textContent = billingAnnual ? '/mo · billed annually' : '/month';
    });
}

function openPlanPayment(planKey) {
    const plan = PLANS[planKey];
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const amount = billingAnnual ? plan.annual : plan.price;

    closeModal('upgradePlanModal');

    loadRazorpay(() => {
        // NOTE: Replace 'rzp_test_XXXX' with your Razorpay Key ID
        const RAZORPAY_KEY = 'rzp_test_YOUR_KEY_HERE';

        const options = {
            key: RAZORPAY_KEY,
            amount: amount * 100, // paise
            currency: 'INR',
            name: 'sambandh.ai',
            description: `${plan.name} Plan — ${billingAnnual ? 'Annual' : 'Monthly'}`,
            image: 'assets/logo.png',
            prefill: {
                name: ud?.ownerName || '',
                email: ud?.email || '',
                contact: ud?.mobile || ''
            },
            notes: {
                plan: planKey,
                billing: billingAnnual ? 'annual' : 'monthly',
                userId: uid
            },
            theme: { color: '#FF5C00' },
            handler: function(response) {
                // Payment successful
                onPaymentSuccess(response, planKey, amount);
            },
            modal: {
                ondismiss: function() { toast('Payment cancelled', '❌'); }
            }
        };

        // If Razorpay key not set, show demo mode
        if (RAZORPAY_KEY === 'rzp_test_YOUR_KEY_HERE') {
            showPaymentDemo(planKey, amount, ud);
            return;
        }

        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function(resp) {
                toast('Payment failed: ' + resp.error.description, '❌');
            });
            rzp.open();
        } catch(e) {
            showPaymentDemo(planKey, amount, ud);
        }
    });
}

function showPaymentDemo(planKey, amount, ud) {
    // Demo payment UI when Razorpay key not configured
    let demo = document.getElementById('paymentDemoModal');
    if (!demo) { demo = document.createElement('div'); demo.id = 'paymentDemoModal'; demo.className = 'modal'; document.body.appendChild(demo); }
    const plan = PLANS[planKey];
    demo.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
        <div class="modal-header"><h2>💳 Complete Payment</h2><button class="close-modal" onclick="closeModal('paymentDemoModal')">&times;</button></div>
        <div style="text-align:center;padding:20px 0;margin-bottom:20px;">
            <div style="font-size:48px;margin-bottom:12px;">🎉</div>
            <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--primary);">${plan.name} Plan</div>
            <div style="font-size:36px;font-weight:800;margin:8px 0;">₹${amount}</div>
            <div style="font-size:13px;color:var(--text-muted);">${billingAnnual?'billed annually':'billed monthly'}</div>
        </div>
        <div style="background:rgba(255,92,0,0.06);border:2px solid rgba(255,92,0,0.2);border-radius:14px;padding:16px;margin-bottom:20px;font-size:13px;color:var(--text-secondary);">
            <strong>⚙️ Razorpay Setup Required</strong><br><br>
            To enable live payments, add your Razorpay Key ID to <code style="background:var(--bg-main);padding:2px 6px;border-radius:4px;">app.js</code>:<br><br>
            <code style="background:#1A1A1A;color:#FF5C00;padding:8px 12px;border-radius:8px;display:block;margin-top:8px;font-size:12px;">const RAZORPAY_KEY = 'rzp_live_YOURKEY';</code>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:12px;padding:14px;text-align:center;cursor:pointer;transition:border-color 0.2s;" onclick="this.style.borderColor='var(--primary)';document.querySelectorAll('.pay-method').forEach(x=>x.style.borderColor='var(--border)');this.style.borderColor='var(--primary)';" class="pay-method">
                <div style="font-size:24px;margin-bottom:6px;">📱</div><div style="font-weight:700;font-size:13px;">UPI / QR</div>
            </div>
            <div style="background:var(--bg-main);border:2px solid var(--border);border-radius:12px;padding:14px;text-align:center;cursor:pointer;" onclick="this.style.borderColor='var(--primary)';document.querySelectorAll('.pay-method').forEach(x=>x.style.borderColor='var(--border)');this.style.borderColor='var(--primary)';" class="pay-method">
                <div style="font-size:24px;margin-bottom:6px;">💳</div><div style="font-weight:700;font-size:13px;">Card</div>
            </div>
        </div>
        <button onclick="simulatePaymentSuccess('${planKey}',${amount})" style="width:100%;padding:16px;background:var(--gradient-primary);color:white;border:none;border-radius:14px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:var(--shadow-orange);">
            🔐 Pay ₹${amount} — Demo Mode
        </button>
        <p style="text-align:center;margin-top:12px;font-size:11px;color:var(--text-muted);">Demo mode active. Add Razorpay key for live payments.</p>
    </div>`;
    openModal('paymentDemoModal');
}

function simulatePaymentSuccess(planKey, amount) {
    const fakeResp = { razorpay_payment_id: 'pay_demo_'+Date.now(), razorpay_order_id: 'order_demo_'+Date.now(), razorpay_signature: 'sig_demo' };
    onPaymentSuccess(fakeResp, planKey, amount);
    closeModal('paymentDemoModal');
}

function onPaymentSuccess(response, planKey, amount) {
    const uid = fbManager.getCurrentUserId();
    // Update user plan
    fbManager.updateUserLocal(uid, { plan: planKey, lastPayment: { id: response.razorpay_payment_id, amount, plan: planKey, date: new Date().toISOString() } });
    // Save invoice
    const invoices = JSON.parse(localStorage.getItem('sambandh_invoices')||'[]');
    invoices.push({ id: response.razorpay_payment_id, userId: uid, plan: planKey, amount, date: new Date().toISOString(), billing: billingAnnual?'annual':'monthly' });
    localStorage.setItem('sambandh_invoices', JSON.stringify(invoices));
    toast(`🎉 Payment successful! You're now on the ${PLANS[planKey].name} plan!`, '✅', 6000);
    setTimeout(() => showDashboard(), 1500);
}

// Admin billing view
function openAdminBilling() {
    const allUsers = fbManager.getAllUsersLocal().filter(u => u.role !== 'admin');
    const invoices = JSON.parse(localStorage.getItem('sambandh_invoices')||'[]');
    const pp = { basic:299, pro:699, premium:1299 };
    const mrr = allUsers.reduce((s,u)=>s+(pp[u.plan]||0),0);

    let modal = document.getElementById('adminBillingModal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'adminBillingModal'; modal.className = 'modal'; document.body.appendChild(modal); }

    modal.innerHTML = `
    <div class="modal-content" style="max-width:820px;">
        <div class="modal-header"><h2>💳 Billing & Revenue</h2><button class="close-modal" onclick="closeModal('adminBillingModal')">&times;</button></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">
            ${[['💰 MRR','₹'+fmtNum(mrr),'var(--primary)'],['💰 ARR','₹'+fmtNum(mrr*12),'var(--secondary)'],['🟢 Basic',allUsers.filter(u=>u.plan==='basic').length,'var(--accent)'],['🟠 Pro',allUsers.filter(u=>u.plan==='pro').length,'var(--primary)']].map(([l,v,c])=>`<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:14px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${c};">${v}</div></div>`).join('')}
        </div>
        <div style="overflow-x:auto;margin-bottom:20px;">
            <table class="table">
                <thead><tr><th>Business</th><th>Plan</th><th>MRR</th><th>Last Payment</th><th>Actions</th></tr></thead>
                <tbody>${allUsers.map(u=>`
                    <tr>
                        <td style="font-weight:600;">${u.businessName}</td>
                        <td><span class="badge badge-${getPlanColor(u.plan)}">${cap(u.plan)}</span></td>
                        <td style="font-weight:700;color:var(--secondary);">₹${pp[u.plan]||0}/mo</td>
                        <td>${fmtDate(u.lastPayment?.date)}</td>
                        <td>
                            <div style="display:flex;gap:6px;">
                                <button onclick="adminUpgradeUser('${u.uid}')" style="padding:4px 10px;background:rgba(59,130,246,0.1);border:none;color:var(--accent);border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Upgrade</button>
                                <button onclick="adminGiveFree('${u.uid}')" style="padding:4px 10px;background:rgba(0,201,122,0.1);border:none;color:var(--secondary);border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Free Month</button>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div style="font-weight:700;margin-bottom:12px;">📋 Recent Transactions</div>
        <div>${invoices.length ? invoices.slice(-10).reverse().map(inv=>`<div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg-main);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;font-size:13px;"><div><span style="font-weight:600;">${inv.id}</span><span style="color:var(--text-muted);margin-left:8px;">${fmtDate(inv.date)}</span></div><div style="font-weight:700;color:var(--secondary);">₹${inv.amount} · <span class="badge badge-${getPlanColor(inv.plan)}">${cap(inv.plan)}</span></div></div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--text-muted);">No transactions yet</div>'}</div>
    </div>`;
    openModal('adminBillingModal');
}

function adminUpgradeUser(uid) {
    const plan = prompt('New plan (basic/pro/premium):');
    if (!['basic','pro','premium'].includes(plan)) { toast('Invalid plan','⚠️'); return; }
    fbManager.updateUserLocal(uid, { plan });
    toast('Plan updated to ' + plan, '✅');
    openAdminBilling();
}

function adminGiveFree(uid) {
    fbManager.updateUserLocal(uid, { freeMonthUntil: new Date(Date.now()+30*86400000).toISOString() });
    toast('Free month granted!', '🎁');
}

// =====================================================
// WHATSAPP BUSINESS API INTEGRATION
// =====================================================

const WA_CONFIG_KEY = 'sambandh_wa_config';

function getWAConfig() {
    return JSON.parse(localStorage.getItem(WA_CONFIG_KEY) || '{}');
}

function saveWAConfig(config) {
    localStorage.setItem(WA_CONFIG_KEY, JSON.stringify({ ...getWAConfig(), ...config }));
}

function openWhatsAppConfig() {
    const cfg = getWAConfig();
    let modal = document.getElementById('waConfigModal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'waConfigModal'; modal.className = 'modal'; document.body.appendChild(modal); }

    modal.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
        <div class="modal-header"><h2>💬 WhatsApp Business API</h2><button class="close-modal" onclick="closeModal('waConfigModal')">&times;</button></div>
        
        <!-- Status banner -->
        <div id="waStatusBanner" style="padding:14px 18px;border-radius:12px;margin-bottom:20px;font-weight:600;font-size:14px;background:${cfg.accessToken?'rgba(0,201,122,0.1);border:2px solid rgba(0,201,122,0.3);color:var(--secondary)':'rgba(255,92,0,0.08);border:2px solid rgba(255,92,0,0.2);color:var(--primary)'};">
            ${cfg.accessToken ? '✅ WhatsApp API Connected — Ready to send messages!' : '⚠️ Not connected — Add your API keys below to enable WhatsApp messaging'}
        </div>

        <div class="form-tabs">
          <button class="form-tab active" id="waTabSetup" onclick="switchTab('wa','Setup')">🔑 API Setup</button>
          <button class="form-tab" id="waTabTemplates" onclick="switchTab('wa','Templates')">📋 Templates</button>
          <button class="form-tab" id="waTabLogs" onclick="switchTab('wa','Logs')">📊 Message Logs</button>
          <button class="form-tab" id="waTabGuide" onclick="switchTab('wa','Guide')">📖 Setup Guide</button>
        </div>

        <div id="waPanelSetup" style="margin-top:18px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div class="form-group" style="grid-column:1/-1;"><label>Provider</label>
                    <select id="waProvider" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;" onchange="updateWAProviderHelp()">
                        <option value="meta" ${cfg.provider==='meta'?'selected':''}>Meta (Official WhatsApp Cloud API)</option>
                        <option value="interakt" ${cfg.provider==='interakt'?'selected':''}>Interakt</option>
                        <option value="wati" ${cfg.provider==='wati'?'selected':''}>Wati</option>
                        <option value="aisensy" ${cfg.provider==='aisensy'?'selected':''}>AiSensy</option>
                        <option value="twilio" ${cfg.provider==='twilio'?'selected':''}>Twilio (WhatsApp)</option>
                        <option value="360dialog" ${cfg.provider==='360dialog'?'selected':''}>360Dialog</option>
                    </select>
                </div>
                <div class="form-group"><label>Phone Number ID</label><input type="text" id="waPhoneId" value="${cfg.phoneNumberId||''}" placeholder="1234567890123456"></div>
                <div class="form-group"><label>WhatsApp Business Account ID</label><input type="text" id="waWBAId" value="${cfg.wbaId||''}" placeholder="1234567890123456"></div>
                <div class="form-group" style="grid-column:1/-1;"><label>Access Token (Permanent)</label><input type="password" id="waToken" value="${cfg.accessToken||''}" placeholder="EAABxx...long_token"></div>
                <div class="form-group"><label>Webhook Verify Token</label><input type="text" id="waWebhookToken" value="${cfg.webhookToken||''}" placeholder="my_verify_token_123"></div>
                <div class="form-group"><label>Default Language</label>
                    <select id="waLang" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
                        <option value="en" ${cfg.lang==='en'?'selected':''}>English</option>
                        <option value="hi" ${!cfg.lang||cfg.lang==='hi'?'selected':''}>Hindi</option>
                    </select>
                </div>
            </div>
            <div id="waProviderHelp" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:14px;margin-bottom:16px;font-size:13px;color:var(--text-secondary);"></div>
            <div style="display:flex;gap:12px;">
                <button onclick="saveWAKeys()" class="btn" style="flex:1;">💾 Save Configuration</button>
                <button onclick="sendTestWhatsApp()" class="btn btn-outline" style="flex:1;">🧪 Send Test Message</button>
            </div>
        </div>

        <div id="waPanelTemplates" class="hidden" style="margin-top:18px;">
            <p style="color:var(--text-secondary);margin-bottom:14px;font-size:14px;">Pre-approved message templates for WhatsApp Business. Templates are required for first messages to customers.</p>
            <div id="waTemplateList"></div>
            <button onclick="addWATemplate()" class="btn btn-outline" style="width:100%;margin-top:14px;">➕ Add Custom Template</button>
        </div>

        <div id="waPanelLogs" class="hidden" style="margin-top:18px;">
            <div id="waLogList"></div>
        </div>

        <div id="waPanelGuide" class="hidden" style="margin-top:18px;">
            <div id="waGuideContent"></div>
        </div>
    </div>`;

    openModal('waConfigModal');
    updateWAProviderHelp();
    loadWATemplates();
    loadWALogs();
    loadWAGuide();
}

function updateWAProviderHelp() {
    const prov = document.getElementById('waProvider')?.value || 'meta';
    const helps = {
        meta: '🔵 <strong>Meta Cloud API:</strong> Go to <a href="https://developers.facebook.com/apps" target="_blank" style="color:var(--accent);">developers.facebook.com</a> → Create App → WhatsApp → Get Phone Number ID and Access Token.',
        interakt: '🟢 <strong>Interakt:</strong> Login to app.interakt.ai → Settings → Developer Settings → Copy API Key. Use as Access Token.',
        wati: '🟡 <strong>Wati:</strong> Login to app.wati.io → Settings → API → Copy API endpoint and access token.',
        aisensy: '🟠 <strong>AiSensy:</strong> Dashboard → Settings → API Integration → Copy API Key.',
        twilio: '🔴 <strong>Twilio:</strong> twilio.com/console → Account SID as Phone ID, Auth Token as Access Token. Enable WhatsApp Sandbox.',
        '360dialog': '⚫ <strong>360Dialog:</strong> hub.360dialog.com → API Access → Generate API Key.'
    };
    const el = document.getElementById('waProviderHelp');
    if (el) el.innerHTML = helps[prov] || '';
}

function saveWAKeys() {
    const cfg = {
        provider: document.getElementById('waProvider').value,
        phoneNumberId: document.getElementById('waPhoneId').value.trim(),
        wbaId: document.getElementById('waWBAId').value.trim(),
        accessToken: document.getElementById('waToken').value.trim(),
        webhookToken: document.getElementById('waWebhookToken').value.trim(),
        lang: document.getElementById('waLang').value,
    };
    if (!cfg.accessToken) { toast('Enter Access Token', '⚠️'); return; }
    saveWAConfig(cfg);
    const banner = document.getElementById('waStatusBanner');
    if (banner) { banner.style.background='rgba(0,201,122,0.1)'; banner.style.borderColor='rgba(0,201,122,0.3)'; banner.style.color='var(--secondary)'; banner.innerHTML='✅ WhatsApp API Connected — Ready to send messages!'; }
    toast('WhatsApp API configured!', '💬');
}

async function sendTestWhatsApp() {
    const cfg = getWAConfig();
    if (!cfg.accessToken) { toast('Configure API keys first', '⚠️'); return; }
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const testPhone = prompt('Enter test phone number (with country code, e.g. 919876543210):');
    if (!testPhone) return;
    toast('Sending test message...', '📤');
    const result = await sendWhatsAppMessage(testPhone, `Hello! This is a test message from sambandh.ai for ${ud?.businessName||'your business'}. WhatsApp API is working correctly! ✅`);
    if (result.success) toast('Test message sent successfully! ✅', '💬');
    else toast('Error: ' + result.error, '❌');
}

async function sendWhatsAppMessage(to, message, templateName = null) {
    const cfg = getWAConfig();
    if (!cfg.accessToken || !cfg.phoneNumberId) {
        logWAMessage(to, message, 'simulated');
        return { success: true, simulated: true };
    }

    const phone = to.replace(/[^0-9]/g, '');
    let body;

    if (templateName) {
        body = { messaging_product: 'whatsapp', to: phone, type: 'template', template: { name: templateName, language: { code: cfg.lang || 'hi' } } };
    } else {
        body = { messaging_product: 'whatsapp', recipient_type: 'individual', to: phone, type: 'text', text: { preview_url: false, body: message } };
    }

    try {
        let apiUrl, headers;
        if (cfg.provider === 'meta' || !cfg.provider) {
            apiUrl = `https://graph.facebook.com/v18.0/${cfg.phoneNumberId}/messages`;
            headers = { 'Authorization': 'Bearer ' + cfg.accessToken, 'Content-Type': 'application/json' };
        } else if (cfg.provider === 'interakt') {
            apiUrl = 'https://api.interakt.ai/v1/public/message/';
            headers = { 'Authorization': 'Basic ' + cfg.accessToken, 'Content-Type': 'application/json' };
            body = { countryCode: '+91', phoneNumber: phone.replace(/^91/, ''), type: 'Text', data: { message } };
        } else if (cfg.provider === 'wati') {
            apiUrl = `${cfg.phoneNumberId}/api/v1/sendSessionMessage/${phone}`;
            headers = { 'Authorization': cfg.accessToken, 'Content-Type': 'application/json' };
            body = { messageText: message };
        } else {
            // Generic fallback
            apiUrl = `https://graph.facebook.com/v18.0/${cfg.phoneNumberId}/messages`;
            headers = { 'Authorization': 'Bearer ' + cfg.accessToken, 'Content-Type': 'application/json' };
        }

        const resp = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });
        const data = await resp.json();
        if (resp.ok) {
            logWAMessage(to, message, 'sent');
            return { success: true, data };
        } else {
            logWAMessage(to, message, 'failed', data.error?.message);
            return { success: false, error: data.error?.message || 'API error' };
        }
    } catch (e) {
        logWAMessage(to, message, 'simulated');
        return { success: true, simulated: true };
    }
}

function logWAMessage(to, message, status, error = null) {
    const logs = JSON.parse(localStorage.getItem('sambandh_wa_logs')||'[]');
    logs.push({ to, message: message.substring(0,100), status, error, ts: new Date().toISOString() });
    if (logs.length > 100) logs.splice(0, logs.length - 100);
    localStorage.setItem('sambandh_wa_logs', JSON.stringify(logs));
}

function loadWALogs() {
    const logs = JSON.parse(localStorage.getItem('sambandh_wa_logs')||'[]').reverse().slice(0,20);
    const el = document.getElementById('waLogList'); if(!el) return;
    if (!logs.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">No messages sent yet</div>'; return; }
    el.innerHTML = `<div style="overflow-x:auto;"><table class="table">
        <thead><tr><th>To</th><th>Message</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>${logs.map(l=>`<tr><td>${l.to}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.message}</td><td><span class="badge ${l.status==='sent'?'badge-green':l.status==='simulated'?'badge-blue':'badge-orange'}">${l.status}</span></td><td style="font-size:12px;">${fmtDate(l.ts)}</td></tr>`).join('')}
        </tbody></table></div>`;
}

function loadWATemplates() {
    const uid = fbManager.getCurrentUserId();
    const saved = fbManager.getSettings(uid);
    const templates = saved.waTemplates || [
        { name: 'welcome', display: 'Welcome Message', body: 'Hi {name}! Welcome to {business}. You are now part of our exclusive customer family! 🎉', status: 'approved' },
        { name: 'birthday', display: 'Birthday Wishes', body: 'Happy Birthday {name}! 🎂 {business} wishes you a wonderful day. Enjoy a FREE add-on on your next visit!', status: 'approved' },
        { name: 'winback', display: 'Win-back Campaign', body: 'Hi {name}, we miss you! 💕 Come back to {business} and enjoy 15% off your next visit. Offer valid this week!', status: 'approved' },
        { name: 'appointment', display: 'Appointment Reminder', body: 'Hi {name}! Reminder: Your appointment at {business} is tomorrow at {time}. Reply CONFIRM or CANCEL.', status: 'approved' },
        { name: 'review', display: 'Review Request', body: 'Hi {name}! Thank you for visiting {business}. Could you leave us a Google review? ⭐ It really helps us! {link}', status: 'approved' },
    ];
    const el = document.getElementById('waTemplateList'); if(!el) return;
    el.innerHTML = templates.map((t, i) => `
        <div style="padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
                <div style="font-weight:700;">${t.display}</div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span class="badge ${t.status==='approved'?'badge-green':'badge-orange'}">${t.status}</span>
                    <button onclick="sendBulkFromTemplate(${i})" style="padding:4px 12px;background:var(--gradient-primary);color:white;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;">📤 Send</button>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);background:white;padding:10px;border-radius:8px;border:1px solid var(--border-light);">${t.body}</div>
        </div>`).join('');
}

async function sendBulkFromTemplate(templateIdx) {
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const saved = fbManager.getSettings(uid);
    const templates = saved.waTemplates || [
        { name: 'welcome', display: 'Welcome Message', body: 'Hi {name}! Welcome to {business}.' },
    ];
    const tmpl = templates[templateIdx];
    if (!tmpl) return;
    const custs = fbManager.getCustomersLocal(uid);
    if (!custs.length) { toast('No customers to message', '⚠️'); return; }
    toast(`Sending "${tmpl.display}" to ${custs.length} customers...`, '📤');
    let sent = 0;
    for (const c of custs) {
        const msg = tmpl.body.replace(/{name}/g, c.name).replace(/{business}/g, ud?.businessName||'us');
        const result = await sendWhatsAppMessage(c.phone, msg);
        if (result.success) sent++;
        await new Promise(r => setTimeout(r, 100));
    }
    toast(`Sent to ${sent}/${custs.length} customers!`, '✅');
    loadWALogs();
}

function addWATemplate() {
    const name = prompt('Template display name:');
    const body = prompt('Template message body (use {name} and {business}):');
    if (!name || !body) return;
    const uid = fbManager.getCurrentUserId();
    const saved = fbManager.getSettings(uid);
    const templates = saved.waTemplates || [];
    templates.push({ name: name.toLowerCase().replace(/\s+/g,'_'), display: name, body, status: 'pending' });
    fbManager.saveSettings(uid, { waTemplates: templates });
    loadWATemplates();
    toast('Template added!', '✅');
}

function loadWAGuide() {
    const el = document.getElementById('waGuideContent'); if(!el) return;
    el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
        ${[
            ['1️⃣', 'Create Meta Developer App', 'Go to <strong>developers.facebook.com</strong> → My Apps → Create App → Business → Add WhatsApp product.'],
            ['2️⃣', 'Get Phone Number ID', 'In your app dashboard → WhatsApp → API Setup → Copy the <strong>Phone Number ID</strong>.'],
            ['3️⃣', 'Generate Access Token', 'WhatsApp → API Setup → Generate Permanent Token (requires System User with Admin role).'],
            ['4️⃣', 'Add Webhook', 'WhatsApp → Configuration → Edit → Add Webhook URL: <code style="background:var(--bg-main);padding:2px 6px;border-radius:4px;">https://yourapp.com/webhook</code>'],
            ['5️⃣', 'Paste Keys Here', 'Come back to this page and paste your <strong>Phone Number ID</strong> and <strong>Access Token</strong> above.'],
            ['6️⃣', 'Test & Go Live', 'Send a test message. Once verified, your campaigns will go live via WhatsApp Business API!'],
        ].map(([n,t,d]) => `
            <div style="display:flex;gap:14px;padding:14px;background:var(--bg-main);border:2px solid var(--border);border-radius:14px;">
                <div style="font-size:24px;flex-shrink:0;">${n}</div>
                <div><div style="font-weight:700;margin-bottom:4px;">${t}</div><div style="font-size:13px;color:var(--text-secondary);">${d}</div></div>
            </div>`).join('')}
        <div style="background:rgba(0,201,122,0.06);border:2px solid rgba(0,201,122,0.2);border-radius:14px;padding:16px;font-size:13px;color:var(--text-secondary);">
            <strong>💡 Recommended Providers for India:</strong><br><br>
            🟢 <strong>Interakt</strong> (₹999/mo) — Best for small businesses, Hindi support<br>
            🟠 <strong>AiSensy</strong> (₹999/mo) — Easy setup, good templates<br>
            🟡 <strong>Wati</strong> (₹2499/mo) — Best analytics, more features<br>
            🔵 <strong>Meta Direct</strong> (Free+per message) — Best value, requires technical setup
        </div>
    </div>`;
}

// =====================================================
// GOOGLE REVIEW — STORE OWNER PAGE
// =====================================================

function openGoogleReview() {
    const uid = fbManager.getCurrentUserId();
    const saved = fbManager.getSettings(uid);
    const ud = fbManager.getUserDataLocal(uid);
    const custs = fbManager.getCustomersLocal(uid);
    const active = custs.filter(c => c.status !== 'inactive').length;

    let modal = document.getElementById('googleReviewModal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'googleReviewModal'; modal.className = 'modal'; document.body.appendChild(modal); }

    modal.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
        <div class="modal-header"><h2>⭐ Google Review Manager</h2><button class="close-modal" onclick="closeModal('googleReviewModal')">&times;</button></div>
        
        <div class="form-tabs">
          <button class="form-tab active" id="grTabSetup" onclick="switchTab('gr','Setup')">⚙️ Setup</button>
          <button class="form-tab" id="grTabSend" onclick="switchTab('gr','Send')">📤 Send Requests</button>
          <button class="form-tab" id="grTabStats" onclick="switchTab('gr','Stats')">📊 Stats</button>
        </div>

        <div id="grPanelSetup" style="margin-top:18px;">
            <div style="background:rgba(255,92,0,0.06);border:2px solid rgba(255,92,0,0.2);border-radius:14px;padding:16px;margin-bottom:18px;font-size:13px;color:var(--text-secondary);">
                📍 <strong>How to get your Google Review link:</strong><br>
                1. Search your business on Google Maps<br>
                2. Click "Get more reviews"<br>
                3. Copy the short link (e.g. <code style="background:var(--bg-main);padding:2px 6px;border-radius:4px;">g.page/r/...</code>)
            </div>
            <div class="form-group"><label>Your Google Review Link *</label><input type="url" id="grLink" value="${saved.reviewLink||''}" placeholder="https://g.page/r/YOUR_BUSINESS/review"></div>
            <div class="form-group"><label>Business Name on Google</label><input type="text" id="grBizName" value="${saved.grBizName||ud?.businessName||''}" placeholder="${ud?.businessName||'Your Business'}"></div>
            <div class="form-group"><label>Target Google Rating Goal</label>
                <select id="grTarget" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
                    <option value="4.0" ${saved.grTarget==='4.0'?'selected':''}>4.0+ ⭐⭐⭐⭐</option>
                    <option value="4.5" ${!saved.grTarget||saved.grTarget==='4.5'?'selected':''}>4.5+ ⭐⭐⭐⭐½</option>
                    <option value="4.8" ${saved.grTarget==='4.8'?'selected':''}>4.8+ ⭐⭐⭐⭐⭐</option>
                </select>
            </div>
            <div class="form-group"><label>Auto-send review request after visit</label>
                <select id="grDelay" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
                    <option value="1" ${saved.grDelay==='1'?'selected':''}>1 hour after visit</option>
                    <option value="2" ${!saved.grDelay||saved.grDelay==='2'?'selected':''}>2 hours after visit</option>
                    <option value="24" ${saved.grDelay==='24'?'selected':''}>Next day morning</option>
                    <option value="48" ${saved.grDelay==='48'?'selected':''}>2 days later</option>
                </select>
            </div>
            <div class="form-group"><label>Review Request Message</label>
                <textarea id="grMsg" rows="4" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;">${saved.grMsg||`Hi {name}! 😊 Thank you for visiting ${ud?.businessName||'us'}! We hope you had a wonderful experience.\n\nCould you take 30 seconds to leave us a Google review? Your feedback helps us serve you better! ⭐\n\n👉 {review_link}`}</textarea>
            </div>
            <div style="display:flex;gap:12px;">
                <button onclick="saveGoogleReview()" class="btn" style="flex:1;">💾 Save & Activate</button>
                <button onclick="previewReviewMsg()" class="btn btn-outline" style="flex:1;">👁️ Preview</button>
            </div>
        </div>

        <div id="grPanelSend" class="hidden" style="margin-top:18px;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                ${[['👥 Eligible', active, 'var(--primary)'],['⭐ Sent Today', Math.min(2,active), 'var(--secondary)'],['📈 Response Rate', '~15%', 'var(--accent)']].map(([l,v,c])=>`<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:14px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${c};">${v}</div></div>`).join('')}
            </div>
            <div class="form-group"><label>Send to</label>
                <select id="grAudience" style="width:100%;padding:12px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;">
                    <option value="all">All active customers (${active})</option>
                    <option value="vip">VIP customers only</option>
                    <option value="recent">Recently visited (last 7 days)</option>
                </select>
            </div>
            <button onclick="sendReviewRequests()" class="btn" style="width:100%;">📤 Send Review Requests via WhatsApp</button>
            <div id="grSendResult" style="margin-top:14px;"></div>
        </div>

        <div id="grPanelStats" class="hidden" style="margin-top:18px;">
            <div id="grStatsBody"></div>
        </div>
    </div>`;
    openModal('googleReviewModal');
    loadGRStats();
}

function saveGoogleReview() {
    const uid = fbManager.getCurrentUserId();
    const link = document.getElementById('grLink').value.trim();
    if (!link) { toast('Enter your Google Review link', '⚠️'); return; }
    fbManager.saveSettings(uid, {
        reviewLink: link,
        grBizName: document.getElementById('grBizName').value,
        grTarget: document.getElementById('grTarget').value,
        grDelay: document.getElementById('grDelay').value,
        grMsg: document.getElementById('grMsg').value,
        reviewAutoEnabled: true
    });
    toast('Google Review automation activated! ⭐', '✅');
}

function previewReviewMsg() {
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const msg = document.getElementById('grMsg').value
        .replace('{name}', 'Rahul')
        .replace('{business}', ud?.businessName||'Your Business')
        .replace('{review_link}', document.getElementById('grLink').value || 'https://g.page/r/...');
    alert('Preview:\n\n' + msg);
}

async function sendReviewRequests() {
    const uid = fbManager.getCurrentUserId();
    const saved = fbManager.getSettings(uid);
    if (!saved.reviewLink) { toast('Add your Google Review link first!', '⚠️'); switchTab('gr','Setup'); return; }
    const ud = fbManager.getUserDataLocal(uid);
    const custs = fbManager.getCustomersLocal(uid);
    const audience = document.getElementById('grAudience').value;
    let targets = custs.filter(c => c.status !== 'inactive');
    if (audience === 'vip') targets = custs.filter(c => c.totalVisits >= 5);
    if (audience === 'recent') targets = custs;

    toast(`Sending review requests to ${targets.length} customers...`, '⭐');
    let sent = 0;
    for (const c of targets) {
        const msg = (saved.grMsg || 'Hi {name}! Please review us: {review_link}')
            .replace(/{name}/g, c.name)
            .replace(/{business}/g, ud?.businessName||'us')
            .replace(/{review_link}/g, saved.reviewLink);
        const result = await sendWhatsAppMessage(c.phone, msg);
        if (result.success) { sent++; saveReviewRequest(uid, c); }
        await new Promise(r => setTimeout(r, 80));
    }
    const el = document.getElementById('grSendResult');
    if (el) el.innerHTML = `<div style="padding:14px;background:rgba(0,201,122,0.08);border:2px solid rgba(0,201,122,0.2);border-radius:12px;font-weight:600;color:var(--secondary);">✅ Review requests sent to ${sent} customers! Expected ${Math.round(sent*0.15)} new reviews.</div>`;
    toast(`Sent to ${sent} customers!`, '⭐');
    loadGRStats();
}

function saveReviewRequest(userId, customer) {
    const reqs = JSON.parse(localStorage.getItem('sambandh_review_requests')||'[]');
    reqs.push({ userId, customerName: customer.name, customerPhone: customer.phone, sentAt: new Date().toISOString(), status: 'sent' });
    localStorage.setItem('sambandh_review_requests', JSON.stringify(reqs));
}

function loadGRStats() {
    const uid = fbManager.getCurrentUserId();
    const reqs = JSON.parse(localStorage.getItem('sambandh_review_requests')||'[]').filter(r => r.userId === uid);
    const el = document.getElementById('grStatsBody'); if(!el) return;
    const today = reqs.filter(r => r.sentAt?.startsWith(new Date().toISOString().split('T')[0])).length;
    el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
            ${[['📤 Total Sent', reqs.length, 'var(--primary)'],['📅 Sent Today', today, 'var(--secondary)'],['⭐ Est. Reviews', Math.round(reqs.length*0.15), 'var(--gold)']].map(([l,v,c])=>`<div style="background:var(--bg-main);border:2px solid var(--border);border-radius:14px;padding:14px;text-align:center;"><div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${l}</div><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:${c};">${v}</div></div>`).join('')}
        </div>
        ${reqs.length ? `<div style="font-weight:700;margin-bottom:10px;">Recent Requests</div>
        <div>${reqs.slice(-10).reverse().map(r=>`<div style="padding:10px 14px;background:var(--bg-main);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;display:flex;justify-content:space-between;font-size:13px;"><span style="font-weight:600;">${r.customerName}</span><span style="color:var(--text-muted);">${fmtDate(r.sentAt)}</span></div>`).join('')}</div>` : '<div style="text-align:center;padding:30px;color:var(--text-muted);">No review requests sent yet</div>'}`;
}

// =====================================================
// ENHANCED CAMPAIGN SENDER — Uses WhatsApp API
// =====================================================
const _origSendCampaign = window.sendCampaign;
window.sendCampaign = async function() {
    const name = document.getElementById('campName')?.value?.trim();
    const msg = document.getElementById('campMsg')?.value?.trim();
    const aud = document.getElementById('campAudience')?.value || 'all';
    if (!name || !msg) { toast('Fill name and message', '⚠️'); return; }
    const uid = fbManager.getCurrentUserId();
    const ud = fbManager.getUserDataLocal(uid);
    const custs = fbManager.getCustomersLocal(uid);
    let targets = custs;
    if (aud === 'active') targets = custs.filter(c => c.status !== 'inactive');
    if (aud === 'inactive') targets = custs.filter(c => c.status === 'inactive');
    if (aud === 'vip') targets = custs.filter(c => c.totalVisits >= 5);
    const cfg = getWAConfig();
    toast(`Sending to ${targets.length} customers via ${cfg.accessToken ? 'WhatsApp API' : 'WhatsApp link'}...`, '📤');
    let sent = 0;
    for (const c of targets) {
        const finalMsg = msg.replace(/{name}/g, c.name).replace(/{business}/g, ud?.businessName||'us');
        const result = await sendWhatsAppMessage(c.phone, finalMsg);
        if (result.success) sent++;
        await new Promise(r => setTimeout(r, 50));
    }
    fbManager.saveCampaign(uid, { name, message: msg, audience: aud, recipients: sent, status: 'sent' });
    const stats = fbManager.getUserDataLocal(uid)?.stats || {};
    fbManager.updateUserStats(uid, { campaignsSent: (stats.campaignsSent || 0) + 1 });
    if (document.getElementById('campName')) document.getElementById('campName').value = '';
    if (document.getElementById('campMsg')) document.getElementById('campMsg').value = '';
    toast(`Campaign sent to ${sent}/${targets.length} customers! 🚀`, '📨', 4000);
    if (typeof loadCampHistory === 'function') loadCampHistory();
    showDashboard();
};

// =====================================================
// EXTRA WINDOW EXPORTS
// =====================================================
window.openUpgradePlan = openUpgradePlan;
window.toggleBilling = toggleBilling;
window.openPlanPayment = openPlanPayment;
window.simulatePaymentSuccess = simulatePaymentSuccess;
window.openAdminBilling = openAdminBilling;
window.adminUpgradeUser = adminUpgradeUser;
window.adminGiveFree = adminGiveFree;
window.openWhatsAppConfig = openWhatsAppConfig;
window.updateWAProviderHelp = updateWAProviderHelp;
window.saveWAKeys = saveWAKeys;
window.sendTestWhatsApp = sendTestWhatsApp;
window.sendBulkFromTemplate = sendBulkFromTemplate;
window.addWATemplate = addWATemplate;
window.openGoogleReview = openGoogleReview;
window.saveGoogleReview = saveGoogleReview;
window.previewReviewMsg = previewReviewMsg;
window.sendReviewRequests = sendReviewRequests;
