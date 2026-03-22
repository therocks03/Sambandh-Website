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
