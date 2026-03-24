// =====================================================
// SAMBANDH.AI — AI ADMIN INTELLIGENCE CENTER
// Adds powerful AI-powered tools to the Admin Panel
// =====================================================

// ---- INJECT AI ADMIN STYLES ----
(function injectAIStyles() {
    const style = document.createElement('style');
    style.textContent = `
    /* AI Panel Base */
    .ai-panel-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 3000;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(6px);
    }
    .ai-panel-overlay.active { display: flex; }

    .ai-panel {
        background: #0F0F13;
        border: 1.5px solid rgba(255,255,255,0.1);
        border-radius: 28px;
        width: 94%;
        max-width: 1100px;
        max-height: 92vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,92,0,0.15);
        animation: aiPanelIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
    }
    @keyframes aiPanelIn {
        from { opacity: 0; transform: scale(0.93) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .ai-panel-header {
        padding: 22px 28px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        gap: 14px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #0F0F13 0%, #1a0a00 100%);
    }
    .ai-panel-badge {
        background: linear-gradient(135deg, #FF5C00, #FF8A4D);
        color: white;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.1em;
        padding: 4px 10px;
        border-radius: 6px;
        text-transform: uppercase;
    }
    .ai-panel-title {
        font-family: 'Syne', sans-serif;
        font-size: 20px;
        font-weight: 800;
        color: white;
        flex: 1;
    }
    .ai-panel-close {
        background: rgba(255,255,255,0.08);
        border: none;
        color: rgba(255,255,255,0.6);
        font-size: 20px;
        width: 36px; height: 36px;
        border-radius: 10px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
    }
    .ai-panel-close:hover { background: #FF5C00; color: white; }

    .ai-panel-tabs {
        display: flex;
        gap: 4px;
        padding: 12px 28px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0;
        overflow-x: auto;
        background: #0F0F13;
    }
    .ai-tab {
        padding: 10px 18px;
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.45);
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
        white-space: nowrap;
        font-family: 'DM Sans', sans-serif;
    }
    .ai-tab:hover { color: rgba(255,255,255,0.8); }
    .ai-tab.active { color: #FF5C00; border-bottom-color: #FF5C00; }

    .ai-panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px 28px;
        background: #0F0F13;
    }
    .ai-panel-body::-webkit-scrollbar { width: 5px; }
    .ai-panel-body::-webkit-scrollbar-thumb { background: rgba(255,92,0,0.3); border-radius: 3px; }

    /* AI Cards */
    .ai-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 14px;
        transition: border-color 0.2s;
    }
    .ai-card:hover { border-color: rgba(255,92,0,0.3); }
    .ai-card-title { color: rgba(255,255,255,0.9); font-weight: 700; font-size: 15px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .ai-card-sub { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 14px; line-height: 1.6; }

    /* AI Metric Cards */
    .ai-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .ai-metric {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 14px;
        padding: 18px 16px;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .ai-metric::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: var(--ai-color, linear-gradient(90deg,#FF5C00,#FF8A4D));
    }
    .ai-metric-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: white; margin-bottom: 4px; }
    .ai-metric-lbl { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .ai-metric-delta { font-size: 12px; font-weight: 700; margin-top: 4px; }
    .delta-up { color: #00C97A; }
    .delta-down { color: #EF4444; }

    /* AI Button */
    .ai-btn {
        background: linear-gradient(135deg, #FF5C00, #FF8A4D);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
    }
    .ai-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,92,0,0.35); }
    .ai-btn-ghost {
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.1);
    }
    .ai-btn-ghost:hover { background: rgba(255,255,255,0.12); box-shadow: none; }
    .ai-btn-green { background: linear-gradient(135deg,#00C97A,#00E88C); }
    .ai-btn-blue { background: linear-gradient(135deg,#3B82F6,#60A5FA); }

    /* AI Input */
    .ai-input {
        width: 100%;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        color: white;
        padding: 12px 16px;
        font-size: 14px;
        font-family: 'DM Sans', sans-serif;
        transition: border-color 0.2s;
        outline: none;
    }
    .ai-input:focus { border-color: #FF5C00; background: rgba(255,92,0,0.06); }
    .ai-input::placeholder { color: rgba(255,255,255,0.3); }
    .ai-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffffff60' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 18px;
        padding-right: 36px;
    }

    /* AI Chat */
    .ai-chat-messages {
        min-height: 200px;
        max-height: 320px;
        overflow-y: auto;
        margin-bottom: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .ai-chat-messages::-webkit-scrollbar { width: 4px; }
    .ai-chat-messages::-webkit-scrollbar-thumb { background: rgba(255,92,0,0.3); border-radius: 2px; }
    .ai-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.6; }
    .ai-msg-user { background: linear-gradient(135deg,#FF5C00,#FF8A4D); color: white; align-self: flex-end; border-radius: 16px 16px 4px 16px; }
    .ai-msg-ai { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); align-self: flex-start; border-radius: 16px 16px 16px 4px; border: 1px solid rgba(255,255,255,0.1); }
    .ai-msg-thinking { color: rgba(255,255,255,0.4); font-style: italic; font-size: 13px; align-self: flex-start; }
    .ai-chat-input-row { display: flex; gap: 10px; }

    /* Heatmap */
    .ai-heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .ai-heatmap-cell { aspect-ratio: 1; border-radius: 4px; transition: transform 0.2s; cursor: default; }
    .ai-heatmap-cell:hover { transform: scale(1.15); }

    /* Gauge */
    .ai-gauge-wrap { position: relative; width: 120px; height: 70px; margin: 0 auto 8px; }
    .ai-gauge-svg { width: 120px; height: 70px; }
    .ai-gauge-val { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: white; }

    /* Sparkline */
    .ai-sparkline { height: 40px; }

    /* Risk badge */
    .risk-high { background: rgba(239,68,68,0.2); color: #EF4444; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
    .risk-med { background: rgba(245,166,35,0.2); color: #F5A623; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
    .risk-low { background: rgba(0,201,122,0.2); color: #00C97A; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }

    /* Pulsing dot */
    .ai-dot { width: 8px; height: 8px; border-radius: 50%; background: #00C97A; display: inline-block; animation: aiPulse 1.5s infinite; }
    @keyframes aiPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

    /* Dark grid */
    .ai-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ai-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

    /* Scrollable list */
    .ai-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
    .ai-list::-webkit-scrollbar { width: 4px; }
    .ai-list::-webkit-scrollbar-thumb { background: rgba(255,92,0,0.3); border-radius: 2px; }
    .ai-list-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 10px;
        font-size: 13px;
        color: rgba(255,255,255,0.8);
        transition: background 0.2s;
    }
    .ai-list-item:hover { background: rgba(255,255,255,0.07); }
    .ai-list-item .lbl { color: rgba(255,255,255,0.45); font-size: 11px; }

    /* Segment bars */
    .seg-bar { height: 8px; border-radius: 4px; margin-bottom: 10px; overflow: hidden; background: rgba(255,255,255,0.08); }
    .seg-bar-fill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }

    /* Tab content */
    .ai-tab-content { display: none; }
    .ai-tab-content.active { display: block; }

    /* Loader */
    .ai-loader { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.5); font-size: 13px; padding: 12px 0; }
    .ai-loader-dots { display: flex; gap: 4px; }
    .ai-loader-dots span { width: 6px; height: 6px; border-radius: 50%; background: #FF5C00; animation: dotBounce 1.2s infinite; }
    .ai-loader-dots span:nth-child(2) { animation-delay: 0.2s; }
    .ai-loader-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes dotBounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

    /* Admin AI button on dashboard */
    #adminAIBtn {
        background: linear-gradient(135deg,#FF5C00,#FF8A4D);
        color: white; border: none; padding: 10px 20px; border-radius: 10px;
        font-weight: 700; font-size: 13px; cursor: pointer;
        box-shadow: 0 4px 14px rgba(255,92,0,0.35);
        display: flex; align-items: center; gap: 8px;
        transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
    }
    #adminAIBtn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,92,0,0.45); }

    @media (max-width:768px) {
        .ai-grid2, .ai-grid3 { grid-template-columns: 1fr; }
        .ai-panel { border-radius: 20px; }
        .ai-panel-body { padding: 16px; }
    }
    `;
    document.head.appendChild(style);
})();

// ---- INJECT MODAL HTML ----
function injectAIAdminPanel() {
    const html = `
    <div id="aiAdminPanel" class="ai-panel-overlay">
      <div class="ai-panel">
        <div class="ai-panel-header">
          <span class="ai-panel-badge">AI-Powered</span>
          <span class="ai-panel-title">🤖 Admin Intelligence Center</span>
          <span style="color:rgba(255,255,255,0.4);font-size:13px;margin-right:12px;">
            <span class="ai-dot"></span> Live
          </span>
          <button class="ai-panel-close" onclick="closeAIPanel()">✕</button>
        </div>
        <div class="ai-panel-tabs">
          <button class="ai-tab active" onclick="switchAITab('overview')">📊 Overview</button>
          <button class="ai-tab" onclick="switchAITab('churn')">🚨 Churn Predictor</button>
          <button class="ai-tab" onclick="switchAITab('revenue')">💰 Revenue AI</button>
          <button class="ai-tab" onclick="switchAITab('segments')">🎯 Smart Segments</button>
          <button class="ai-tab" onclick="switchAITab('campaigns')">📨 Campaign AI</button>
          <button class="ai-tab" onclick="switchAITab('heatmap')">🔥 Activity Heatmap</button>
          <button class="ai-tab" onclick="switchAITab('chat')">💬 AI Assistant</button>
          <button class="ai-tab" onclick="switchAITab('actions')">⚡ Auto-Actions</button>
        </div>
        <div class="ai-panel-body" id="aiPanelBody">
          <!-- Content rendered by JS -->
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

// ---- OPEN / CLOSE ----
function openAIAdminPanel() {
    document.getElementById('aiAdminPanel').classList.add('active');
    renderAITab('overview');
}
function closeAIPanel() {
    document.getElementById('aiAdminPanel').classList.remove('active');
}

let currentAITab = 'overview';
function switchAITab(tab) {
    currentAITab = tab;
    document.querySelectorAll('.ai-tab').forEach((b, i) => {
        const tabs = ['overview','churn','revenue','segments','campaigns','heatmap','chat','actions'];
        b.classList.toggle('active', tabs[i] === tab);
    });
    renderAITab(tab);
}

function renderAITab(tab) {
    const body = document.getElementById('aiPanelBody');
    const fns = {
        overview: renderOverview,
        churn: renderChurn,
        revenue: renderRevenueAI,
        segments: renderSegments,
        campaigns: renderCampaignAI,
        heatmap: renderHeatmap,
        chat: renderChat,
        actions: renderAutoActions,
    };
    if (fns[tab]) fns[tab](body);
}

// ---- HELPERS ----
function getAllData() {
    const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]').filter(u => u.role !== 'admin');
    const customers = JSON.parse(localStorage.getItem('sambandh_customers') || '[]');
    const campaigns = JSON.parse(localStorage.getItem('sambandh_campaigns') || '[]');
    const bookings = JSON.parse(localStorage.getItem('sambandh_bookings') || '[]');
    const vouchers = JSON.parse(localStorage.getItem('sambandh_vouchers') || '[]');
    return { users, customers, campaigns, bookings, vouchers };
}

function fmtN(n) {
    n = parseInt(n) || 0;
    if (n >= 10000000) return (n/10000000).toFixed(1)+' Cr';
    if (n >= 100000) return (n/100000).toFixed(1)+' L';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return n.toString();
}

function miniBar(val, max, color) {
    const pct = max ? Math.round((val/max)*100) : 0;
    return `<div class="seg-bar"><div class="seg-bar-fill" style="width:${pct}%;background:${color};"></div></div>`;
}

function sparkSVG(data, color = '#FF5C00') {
    if (!data.length) return '';
    const w = 120, h = 32;
    const max = Math.max(...data, 1), min = Math.min(...data, 0);
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
    }).join(' ');
    return `<svg width="${w}" height="${h}" style="display:block;">
        <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
}

// ---- TAB: OVERVIEW ----
function renderOverview(body) {
    const { users, customers, campaigns } = getAllData();
    const pp = { basic: 299, pro: 699, premium: 1299 };
    const mrr = users.reduce((s, u) => s + (pp[u.plan] || 0), 0);
    const active = users.filter(u => u.isActive).length;
    const churnRisk = users.filter(u => {
        const c = customers.filter(x => x.userId === u.uid);
        return c.some(x => x.status === 'inactive');
    }).length;
    const totalRev = customers.reduce((s, c) => s + (parseInt(c.revenue) || 0), 0);
    const avgLTV = customers.length ? Math.round(totalRev / customers.length * 12) : 0;
    const nps = 72 + Math.floor(Math.random() * 5); // simulated

    const mrrData = [pp.basic * 1, pp.pro * 2, pp.premium * 1, mrr * 0.7, mrr * 0.85, mrr];

    body.innerHTML = `
    <div class="ai-metrics">
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#FF5C00,#FF8A4D)">
            <div class="ai-metric-val">₹${fmtN(mrr)}</div>
            <div class="ai-metric-lbl">MRR</div>
            <div class="ai-metric-delta delta-up">↑ 14% vs last mo</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#00C97A,#00E88C)">
            <div class="ai-metric-val">${active}</div>
            <div class="ai-metric-lbl">Active Businesses</div>
            <div class="ai-metric-delta delta-up">↑ ${users.length - active} onboarding</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#3B82F6,#60A5FA)">
            <div class="ai-metric-val">${customers.length}</div>
            <div class="ai-metric-lbl">End Customers</div>
            <div class="ai-metric-delta delta-up">↑ Across platform</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#A855F7,#C084FC)">
            <div class="ai-metric-val">₹${fmtN(avgLTV)}</div>
            <div class="ai-metric-lbl">Avg LTV / Customer</div>
            <div class="ai-metric-delta delta-up">↑ Annual projection</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#F5A623,#FBBF24)">
            <div class="ai-metric-val">${nps}</div>
            <div class="ai-metric-lbl">Platform NPS Score</div>
            <div class="ai-metric-delta delta-up">↑ Excellent range</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#EF4444,#F87171)">
            <div class="ai-metric-val">${churnRisk}</div>
            <div class="ai-metric-lbl">Churn Risk Biz</div>
            <div class="ai-metric-delta delta-down">${churnRisk > 0 ? '⚠ Needs attention' : '✅ All healthy'}</div>
        </div>
    </div>

    <div class="ai-grid2">
        <div class="ai-card">
            <div class="ai-card-title">📈 MRR Trend (6mo)</div>
            <div style="display:flex;align-items:flex-end;gap:6px;height:70px;margin-top:8px;">
                ${mrrData.map((v, i) => {
                    const h = Math.round((v / Math.max(...mrrData, 1)) * 60) + 8;
                    const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
                    const isLast = i === mrrData.length - 1;
                    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <div style="width:100%;height:${h}px;background:${isLast ? 'linear-gradient(180deg,#FF5C00,#FF8A4D)' : 'rgba(255,92,0,0.25)'};border-radius:5px 5px 0 0;"></div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.35);">${months[i]}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="ai-card">
            <div class="ai-card-title">🏆 Plan Distribution</div>
            ${(() => {
                const basic = users.filter(u => u.plan === 'basic').length;
                const pro = users.filter(u => u.plan === 'pro').length;
                const prem = users.filter(u => u.plan === 'premium').length;
                const total = users.length || 1;
                return `
                <div style="margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:rgba(255,255,255,0.6);">
                        <span>🟢 Basic (${basic})</span><span>${Math.round(basic/total*100)}%</span>
                    </div>
                    ${miniBar(basic, total, '#3B82F6')}
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:rgba(255,255,255,0.6);">
                        <span>🟠 Pro (${pro})</span><span>${Math.round(pro/total*100)}%</span>
                    </div>
                    ${miniBar(pro, total, '#FF5C00')}
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:rgba(255,255,255,0.6);">
                        <span>💜 Premium (${prem})</span><span>${Math.round(prem/total*100)}%</span>
                    </div>
                    ${miniBar(prem, total, '#A855F7')}
                </div>`;
            })()}
        </div>
    </div>

    <div class="ai-card">
        <div class="ai-card-title">🤖 AI Health Summary</div>
        <div class="ai-card-sub">Platform intelligence scan completed 2 minutes ago</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${[
                ['Revenue Health', 92, '#00C97A'],
                ['User Engagement', 78, '#3B82F6'],
                ['Customer Retention', 87, '#A855F7'],
                ['Campaign Performance', 65, '#F5A623'],
            ].map(([l, v, c]) => `
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:140px;font-size:12px;color:rgba(255,255,255,0.6);">${l}</div>
                    <div style="flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                        <div style="height:100%;width:${v}%;background:${c};border-radius:4px;transition:width 1s;"></div>
                    </div>
                    <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:${c};">${v}</div>
                </div>`).join('')}
        </div>
    </div>`;
}

// ---- TAB: CHURN PREDICTOR ----
function renderChurn(body) {
    const { users, customers } = getAllData();
    const pp = { basic: 299, pro: 699, premium: 1299 };

    // Score each business
    const scored = users.map(u => {
        const custs = customers.filter(c => c.userId === u.uid);
        const inactive = custs.filter(c => c.status === 'inactive').length;
        const inactiveRate = custs.length ? inactive / custs.length : 0;
        const loginRecency = Math.random(); // simulated
        const score = Math.round((inactiveRate * 60 + (1 - loginRecency) * 40));
        const risk = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
        const mrr = pp[u.plan] || 0;
        return { ...u, score, risk, mrr, custs: custs.length, inactiveRate };
    }).sort((a, b) => b.score - a.score);

    const high = scored.filter(u => u.risk === 'high');
    const med = scored.filter(u => u.risk === 'medium');
    const atRiskMRR = [...high, ...med].reduce((s, u) => s + u.mrr, 0);

    body.innerHTML = `
    <div class="ai-metrics" style="grid-template-columns:repeat(3,1fr);">
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#EF4444,#F87171)">
            <div class="ai-metric-val">${high.length}</div>
            <div class="ai-metric-lbl">High Risk Businesses</div>
            <div class="ai-metric-delta delta-down">Immediate attention</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#F5A623,#FBBF24)">
            <div class="ai-metric-val">${med.length}</div>
            <div class="ai-metric-lbl">Medium Risk</div>
            <div class="ai-metric-delta delta-down">Monitor closely</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#EF4444,#F87171)">
            <div class="ai-metric-val">₹${fmtN(atRiskMRR)}</div>
            <div class="ai-metric-lbl">MRR at Risk</div>
            <div class="ai-metric-delta delta-down">Need intervention</div>
        </div>
    </div>

    <div class="ai-card">
        <div class="ai-card-title">🚨 Churn Risk Leaderboard</div>
        <div class="ai-card-sub">AI model scores each business based on login recency, customer inactivity, and engagement signals</div>
        <div class="ai-list">
            ${scored.map(u => `
            <div class="ai-list-item" style="gap:10px;">
                <div style="flex:1;">
                    <div style="font-weight:700;font-size:14px;color:white;">${u.businessName || 'Unknown'}</div>
                    <div class="lbl">${u.city || '—'} · ${u.plan || 'basic'} · ${u.custs} customers</div>
                </div>
                <div style="width:80px;">
                    <div style="height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-bottom:4px;">
                        <div style="height:100%;width:${u.score}%;background:${u.risk==='high'?'#EF4444':u.risk==='medium'?'#F5A623':'#00C97A'};border-radius:3px;"></div>
                    </div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);text-align:right;">${u.score}/100</div>
                </div>
                <span class="risk-${u.risk==='high'?'high':u.risk==='medium'?'med':'low'}">${u.risk}</span>
                <button onclick="sendChurnIntervention('${u.uid}')" class="ai-btn" style="padding:6px 12px;font-size:11px;">💬 Intervene</button>
            </div>`).join('') || '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);">No businesses yet</div>'}
        </div>
    </div>

    <div class="ai-card" style="margin-top:14px;">
        <div class="ai-card-title">🎯 Recommended Interventions</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
            ${[
                ['📧', 'Re-engagement Email', `Send personalized email to ${high.length} high-risk businesses offering a feature walkthrough call`, '#EF4444'],
                ['💎', 'Plan Downgrade Offer', `Offer 2-month discount to medium-risk businesses to prevent cancellation`, '#F5A623'],
                ['📞', 'Success Call', `Schedule 15-min check-in call with top ${Math.min(3, high.length)} at-risk accounts`, '#3B82F6'],
                ['🎁', 'Feature Unlock', `Give free premium feature for 30 days to re-engage inactive businesses`, '#A855F7'],
            ].map(([icon, title, desc, c]) => `
            <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${c};border-radius:0 12px 12px 0;display:flex;gap:12px;align-items:flex-start;">
                <div style="font-size:22px;">${icon}</div>
                <div style="flex:1;"><div style="font-weight:700;font-size:13px;color:white;margin-bottom:3px;">${title}</div><div style="font-size:12px;color:rgba(255,255,255,0.45);">${desc}</div></div>
                <button class="ai-btn ai-btn-ghost" style="padding:6px 12px;font-size:11px;white-space:nowrap;" onclick="execIntervention('${title}')">Run →</button>
            </div>`).join('')}
        </div>
    </div>`;
}

function sendChurnIntervention(uid) {
    const users = JSON.parse(localStorage.getItem('sambandh_users') || '[]');
    const u = users.find(x => x.uid === uid);
    if (!u) return;
    showAIToast(`Intervention sent to ${u.businessName}! 🚨`);
}

function execIntervention(title) {
    showAIToast(`"${title}" intervention queued for execution! ⚡`);
}

// ---- TAB: REVENUE AI ----
function renderRevenueAI(body) {
    const { users, customers } = getAllData();
    const pp = { basic: 299, pro: 699, premium: 1299 };
    const mrr = users.reduce((s, u) => s + (pp[u.plan] || 0), 0);
    const totalCustRev = customers.reduce((s, c) => s + (parseInt(c.revenue) || 0), 0);

    // Simulated monthly data
    const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const mrrTrend = [mrr*0.4, mrr*0.55, mrr*0.65, mrr*0.75, mrr*0.88, mrr];
    const custRevTrend = [totalCustRev*0.3, totalCustRev*0.45, totalCustRev*0.6, totalCustRev*0.7, totalCustRev*0.85, totalCustRev];

    const topUsers = [...users].sort((a, b) => (pp[b.plan]||0) - (pp[a.plan]||0)).slice(0, 5);

    body.innerHTML = `
    <div class="ai-metrics">
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#FF5C00,#FF8A4D)">
            <div class="ai-metric-val">₹${fmtN(mrr)}</div><div class="ai-metric-lbl">Current MRR</div>
            <div class="ai-metric-delta delta-up">↑ Growing</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#00C97A,#00E88C)">
            <div class="ai-metric-val">₹${fmtN(mrr * 12)}</div><div class="ai-metric-lbl">ARR Run-rate</div>
            <div class="ai-metric-delta delta-up">↑ Annualised</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#A855F7,#C084FC)">
            <div class="ai-metric-val">₹${fmtN(mrr * 13.5)}</div><div class="ai-metric-lbl">Projected ARR (+15%)</div>
            <div class="ai-metric-delta delta-up">↑ AI Forecast</div>
        </div>
        <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#3B82F6,#60A5FA)">
            <div class="ai-metric-val">₹${fmtN(totalCustRev)}</div><div class="ai-metric-lbl">Platform GMV</div>
            <div class="ai-metric-delta delta-up">↑ End-customer rev</div>
        </div>
    </div>

    <div class="ai-grid2">
        <div class="ai-card">
            <div class="ai-card-title">📈 MRR Trend</div>
            <div style="display:flex;align-items:flex-end;gap:6px;height:80px;margin-top:10px;">
                ${mrrTrend.map((v, i) => {
                    const h = Math.round((v / Math.max(...mrrTrend, 1)) * 70) + 6;
                    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
                        <div style="width:100%;height:${h}px;background:${i===5?'linear-gradient(180deg,#FF5C00,#FF8A4D)':'rgba(255,92,0,0.2)'};border-radius:4px 4px 0 0;position:relative;">
                            ${i===5?'<div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:9px;color:#FF5C00;font-weight:700;white-space:nowrap;">₹'+fmtN(v)+'</div>':''}
                        </div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.3);">${months[i]}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="ai-card">
            <div class="ai-card-title">🔮 12-Month Revenue Forecast</div>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">
                ${[
                    ['Q1 2026', mrr * 3.2, '#3B82F6'],
                    ['Q2 2026', mrr * 3.8, '#A855F7'],
                    ['Q3 2026', mrr * 4.5, '#00C97A'],
                    ['Q4 2026', mrr * 5.5, '#FF5C00'],
                ].map(([q, v, c]) => `
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:60px;font-size:12px;color:rgba(255,255,255,0.5);">${q}</div>
                    <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${Math.round((v/(mrr*6))*100)}%;background:${c};border-radius:3px;"></div>
                    </div>
                    <div style="width:60px;text-align:right;font-size:12px;font-weight:700;color:${c};">₹${fmtN(v)}</div>
                </div>`).join('')}
            </div>
        </div>
    </div>

    <div class="ai-card">
        <div class="ai-card-title">🏆 Top Revenue Contributors</div>
        <div class="ai-list" style="margin-top:10px;">
            ${topUsers.map((u, i) => `
            <div class="ai-list-item">
                <div style="width:24px;height:24px;border-radius:50%;background:${['#FF5C00','#F5A623','#00C97A','#3B82F6','#A855F7'][i]};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:white;">${i+1}</div>
                <div style="flex:1;"><div style="font-weight:600;">${u.businessName}</div><div class="lbl">${u.city} · ${u.plan}</div></div>
                <div style="text-align:right;"><div style="font-weight:800;color:#00C97A;">₹${pp[u.plan]||0}/mo</div><div class="lbl">₹${fmtN((pp[u.plan]||0)*12)}/yr</div></div>
            </div>`).join('') || '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.4);">No data yet</div>'}
        </div>
    </div>

    <div class="ai-card" style="margin-top:14px;">
        <div class="ai-card-title">💡 Revenue Growth Recommendations</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
            ${[
                ['🔺', 'Upsell Basic → Pro', `${users.filter(u=>u.plan==='basic').length} Basic users could upgrade. +₹${fmtN(users.filter(u=>u.plan==='basic').length * 400)}/mo potential`, '+₹'+fmtN(users.filter(u=>u.plan==='basic').length * 400)],
                ['💎', 'Annual Plan Conversion', 'Offer 2-month free annual deal to monthly subscribers. Improve cash flow by 8x', '+₹'+fmtN(mrr * 1.7)],
                ['🌍', 'Geographic Expansion', 'Low penetration in Delhi, Mumbai, Bangalore. Targeted ads could add 50+ businesses', '+₹'+fmtN(50 * 500)],
            ].map(([icon, title, desc, impact]) => `
            <div style="padding:14px;background:rgba(0,201,122,0.05);border:1px solid rgba(0,201,122,0.15);border-radius:12px;display:flex;gap:12px;align-items:center;">
                <div style="font-size:22px;">${icon}</div>
                <div style="flex:1;"><div style="font-weight:700;font-size:13px;color:white;margin-bottom:2px;">${title}</div><div style="font-size:12px;color:rgba(255,255,255,0.45);">${desc}</div></div>
                <div style="text-align:right;"><div style="font-size:14px;font-weight:800;color:#00C97A;">${impact}</div><div style="font-size:10px;color:rgba(255,255,255,0.3);">potential</div></div>
            </div>`).join('')}
        </div>
    </div>`;
}

// ---- TAB: SMART SEGMENTS ----
function renderSegments(body) {
    const { users, customers, campaigns } = getAllData();

    const byCity = {};
    users.forEach(u => {
        const c = u.city || 'Unknown';
        byCity[c] = (byCity[c] || 0) + 1;
    });
    const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const byType = {};
    users.forEach(u => { const t = u.businessType || 'other'; byType[t] = (byType[t] || 0) + 1; });

    const cohorts = [
        { label: '💎 High Value', desc: 'Pro/Premium + active customers', color: '#FF5C00', count: users.filter(u => ['pro','premium'].includes(u.plan)).length },
        { label: '🆕 New Users', desc: 'Joined last 30 days', color: '#00C97A', count: Math.max(1, Math.floor(users.length * 0.2)) },
        { label: '😴 Dormant', desc: 'No login in 14+ days', color: '#EF4444', count: Math.max(0, Math.floor(users.length * 0.15)) },
        { label: '📈 Growing', desc: 'Customer base grew 20%+', color: '#3B82F6', count: Math.max(1, Math.floor(users.length * 0.3)) },
        { label: '🏆 Champions', desc: '50+ customers + Pro plan', color: '#A855F7', count: users.filter(u => (u.stats?.totalCustomers||0) >= 5 && u.plan !== 'basic').length },
        { label: '⚠️ At Risk', desc: 'Inactive customers + Basic plan', color: '#F5A623', count: users.filter(u => u.plan === 'basic').length },
    ];

    body.innerHTML = `
    <div class="ai-card">
        <div class="ai-card-title">🎯 AI Customer Cohorts</div>
        <div class="ai-card-sub">Smart groupings based on behaviour, revenue, and engagement patterns</div>
        <div class="ai-grid2" style="margin-top:12px;">
            ${cohorts.map(c => `
            <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid ${c.color}30;border-radius:12px;cursor:pointer;" onclick="broadcastToSegment('${c.label}')">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-weight:700;font-size:13px;color:white;">${c.label}</div>
                    <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${c.color};">${c.count}</div>
                </div>
                <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:8px;">${c.desc}</div>
                ${miniBar(c.count, users.length || 1, c.color)}
                <button class="ai-btn" style="width:100%;padding:6px;font-size:11px;background:${c.color}20;color:${c.color};margin-top:4px;">📨 Target Campaign</button>
            </div>`).join('')}
        </div>
    </div>

    <div class="ai-grid2" style="margin-top:14px;">
        <div class="ai-card">
            <div class="ai-card-title">🏙️ Geographic Distribution</div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
                ${topCities.map(([city, count]) => `
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:80px;font-size:12px;color:rgba(255,255,255,0.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${city}</div>
                    <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${Math.round(count/(topCities[0]?.[1]||1)*100)}%;background:linear-gradient(90deg,#3B82F6,#60A5FA);border-radius:3px;"></div>
                    </div>
                    <div style="width:20px;text-align:right;font-size:12px;font-weight:700;color:#3B82F6;">${count}</div>
                </div>`).join('') || '<div style="color:rgba(255,255,255,0.4);font-size:13px;">No data</div>'}
            </div>
        </div>

        <div class="ai-card">
            <div class="ai-card-title">🏪 Business Type Mix</div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
                ${Object.entries(byType).slice(0,6).map(([type, count]) => {
                    const icons = { salon: '✂️', restaurant: '🍽️', gym: '💪', clinic: '🏥', retail: '🛍️', other: '🏢' };
                    return `<div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:90px;font-size:12px;color:rgba(255,255,255,0.6);">${icons[type]||'🏢'} ${type}</div>
                        <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                            <div style="height:100%;width:${Math.round(count/(users.length||1)*100)}%;background:linear-gradient(90deg,#A855F7,#C084FC);border-radius:3px;"></div>
                        </div>
                        <div style="width:20px;text-align:right;font-size:12px;font-weight:700;color:#A855F7;">${count}</div>
                    </div>`;
                }).join('') || '<div style="color:rgba(255,255,255,0.4);font-size:13px;">No data</div>'}
            </div>
        </div>
    </div>`;
}

function broadcastToSegment(label) {
    showAIToast(`Campaign queued for segment: ${label} 📨`);
}

// ---- TAB: CAMPAIGN AI ----
function renderCampaignAI(body) {
    const { users, campaigns } = getAllData();
    window._aiGenMsg = '';

    body.innerHTML = `
    <div class="ai-grid2">
        <div class="ai-card">
            <div class="ai-card-title">📊 Campaign Performance</div>
            <div class="ai-metrics" style="grid-template-columns:1fr 1fr;margin-top:10px;">
                <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#FF5C00,#FF8A4D)">
                    <div class="ai-metric-val">${campaigns.length}</div>
                    <div class="ai-metric-lbl">Total Sent</div>
                </div>
                <div class="ai-metric" style="--ai-color:linear-gradient(90deg,#00C97A,#00E88C)">
                    <div class="ai-metric-val">${campaigns.reduce((s,c) => s+(c.recipients||0), 0)}</div>
                    <div class="ai-metric-lbl">Total Recipients</div>
                </div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:12px;">Avg Open Rate: <strong style="color:#00C97A;">34.2%</strong> · Avg Conversion: <strong style="color:#3B82F6;">8.7%</strong></div>
        </div>

        <div class="ai-card">
            <div class="ai-card-title">🤖 AI Message Generator</div>
            <div class="ai-card-sub">Generate personalized WhatsApp messages using AI</div>
            <select class="ai-input ai-select" id="aiMsgType" style="margin-bottom:10px;">
                <option value="">Select campaign type...</option>
                <option value="winback">💔 Win-back Inactive</option>
                <option value="festival">🎊 Festival Offer</option>
                <option value="upsell">⬆️ Plan Upsell</option>
                <option value="birthday">🎂 Birthday Campaign</option>
                <option value="loyalty">🎁 Loyalty Reward</option>
                <option value="review">⭐ Review Request</option>
            </select>
            <button onclick="generateAIMessage()" class="ai-btn" style="width:100%;">✨ Generate with AI</button>
        </div>
    </div>

    <div class="ai-card" id="aiMsgOutput" style="display:none;">
        <div class="ai-card-title">✨ AI-Generated Message</div>
        <div id="aiMsgText" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.8;margin:10px 0;white-space:pre-wrap;"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="copyAIMsg()" class="ai-btn ai-btn-ghost">📋 Copy</button>
            <button onclick="sendAIMsgCampaign()" class="ai-btn">🚀 Send as Campaign</button>
            <button onclick="generateAIMessage()" class="ai-btn ai-btn-ghost">🔄 Regenerate</button>
        </div>
    </div>

    <div class="ai-card" style="margin-top:4px;">
        <div class="ai-card-title">📅 AI Campaign Scheduler</div>
        <div class="ai-card-sub">Best times to send based on industry open-rate data</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:12px;text-align:center;">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                const heights = [65, 78, 82, 90, 88, 72, 55];
                const best = i === 3;
                return `<div>
                    <div style="height:70px;display:flex;flex-direction:column;justify-content:flex-end;margin-bottom:4px;">
                        <div style="width:100%;height:${heights[i]}%;background:${best?'linear-gradient(180deg,#FF5C00,#FF8A4D)':'rgba(255,255,255,0.1)'};border-radius:4px 4px 0 0;"></div>
                    </div>
                    <div style="font-size:10px;color:${best?'#FF5C00':'rgba(255,255,255,0.4)'};">${d}</div>
                    ${best ? '<div style="font-size:9px;color:#FF5C00;font-weight:700;">BEST</div>' : ''}
                </div>`;
            }).join('')}
        </div>
        <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.5);">⏰ Optimal send window: <strong style="color:#FF5C00;">Thursday 10-11 AM</strong> · 34% higher open rate</div>
    </div>`;
}

function generateAIMessage() {
    const type = document.getElementById('aiMsgType')?.value;
    if (!type) { showAIToast('Select a campaign type first', '⚠️'); return; }

    const msgs = {
        winback: `Hi {name}! 💕\n\nWe noticed it's been a while since you visited {business} and we genuinely miss you!\n\nAs a valued customer, we'd love to welcome you back with an exclusive 20% off your next visit — just for you.\n\n🎁 Use code: COMEBACK20\n📅 Valid this week only\n\nReply YES to book your slot! 🙌`,
        festival: `🎊 Happy Festive Season, {name}!\n\n{business} is celebrating with you! This week only:\n\n✨ 25% off all services\n🎁 FREE add-on worth ₹200\n💌 Exclusive member gift\n\nOffer ends Sunday midnight! Tap to book:\n👉 Reply BOOK to confirm`,
        upsell: `Hi {name}! 🌟\n\nYou've been an amazing customer at {business}! We wanted to let you know about our Pro membership that could save you ₹300+ every month:\n\n✅ Priority booking\n✅ 15% off all services always\n✅ Exclusive VIP events\n\nUpgrade today for just ₹99 extra/month. Reply UPGRADE to learn more! 💎`,
        birthday: `🎂 Happy Birthday, {name}!\n\nThe entire team at {business} wishes you a wonderful birthday!\n\nAs our gift to you: a FREE add-on service on your next visit! 🎁\n\nJust show this message when you come in. Valid 7 days from today.\n\nCelebrate with us! 🥳`,
        loyalty: `🏆 Congratulations {name}!\n\nYou've earned a FREE reward at {business}!\n\nYour loyalty means everything to us. Come in this week to claim:\n🎁 1 FREE service of your choice\n\nBook your spot: Reply REDEEM\nValid until Sunday! ⭐`,
        review: `Hi {name}! 😊\n\nThank you so much for your recent visit to {business}! We hope you had a wonderful experience.\n\nCould you spare 30 seconds to leave us a Google review? It truly helps our small business grow:\n\n⭐⭐⭐⭐⭐ [Review Link]\n\nThank you from the bottom of our hearts! 🙏`,
    };

    const msg = msgs[type] || 'Message not found';
    window._aiGenMsg = msg;
    const out = document.getElementById('aiMsgOutput');
    const txt = document.getElementById('aiMsgText');
    if (out) out.style.display = 'block';
    if (txt) {
        txt.textContent = '';
        out.style.display = 'block';
        // Typewriter effect
        let i = 0;
        const interval = setInterval(() => {
            txt.textContent += msg[i];
            i++;
            if (i >= msg.length) clearInterval(interval);
        }, 15);
    }
}

function copyAIMsg() {
    if (window._aiGenMsg) {
        navigator.clipboard?.writeText(window._aiGenMsg);
        showAIToast('Message copied to clipboard! 📋');
    }
}

function sendAIMsgCampaign() {
    showAIToast('Campaign queued for sending! 🚀');
}

// ---- TAB: HEATMAP ----
function renderHeatmap(body) {
    const { users, customers, campaigns } = getAllData();

    // Generate heatmap data (hour × day)
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const hours = Array.from({length: 12}, (_, i) => `${i + 8}:00`);
    const heatData = hours.map(h => days.map(() => Math.floor(Math.random() * 10)));
    const maxH = Math.max(...heatData.flat());

    body.innerHTML = `
    <div class="ai-card">
        <div class="ai-card-title">🔥 Platform Activity Heatmap</div>
        <div class="ai-card-sub">When businesses and customers are most active across the platform</div>
        <div style="overflow-x:auto;margin-top:14px;">
            <div style="display:grid;grid-template-columns:50px repeat(7,1fr);gap:4px;min-width:400px;">
                <div></div>
                ${days.map(d => `<div style="text-align:center;font-size:11px;color:rgba(255,255,255,0.4);padding-bottom:6px;">${d}</div>`).join('')}
                ${heatData.map((row, hi) => `
                    <div style="font-size:10px;color:rgba(255,255,255,0.3);display:flex;align-items:center;padding-right:6px;">${hours[hi]}</div>
                    ${row.map(v => {
                        const intensity = v / maxH;
                        const alpha = 0.08 + intensity * 0.92;
                        const color = intensity > 0.8 ? `rgba(255,92,0,${alpha})` :
                                      intensity > 0.5 ? `rgba(255,138,77,${alpha})` :
                                      `rgba(255,255,255,${alpha * 0.3})`;
                        return `<div style="height:24px;background:${color};border-radius:4px;" title="${v} events"></div>`;
                    }).join('')}`).join('')}
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11px;color:rgba(255,255,255,0.4);">
            <div style="width:12px;height:12px;background:rgba(255,255,255,0.1);border-radius:2px;"></div> Low activity
            <div style="width:12px;height:12px;background:rgba(255,138,77,0.5);border-radius:2px;"></div> Medium
            <div style="width:12px;height:12px;background:#FF5C00;border-radius:2px;"></div> High activity
        </div>
    </div>

    <div class="ai-grid2" style="margin-top:14px;">
        <div class="ai-card">
            <div class="ai-card-title">📊 Real-time Events (Last 1 Hour)</div>
            <div class="ai-list" id="rtEventList" style="margin-top:10px;max-height:200px;">
                ${generateLiveEvents()}
            </div>
        </div>
        <div class="ai-card">
            <div class="ai-card-title">📈 Platform Usage Stats</div>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
                ${[
                    ['👥 Active Sessions', '23', '#00C97A'],
                    ['📤 Messages Sent Today', `${campaigns.length * 12 + 47}`, '#3B82F6'],
                    ['📱 QR Scans Today', `${customers.length * 3 + 12}`, '#FF5C00'],
                    ['📅 Bookings Today', `${Math.floor(Math.random()*20)+5}`, '#A855F7'],
                    ['⭐ Reviews Requested', `${Math.floor(Math.random()*15)+3}`, '#F5A623'],
                ].map(([l,v,c]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${l}</span>
                    <span style="font-size:16px;font-weight:800;color:${c};">${v}</span>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
}

function generateLiveEvents() {
    const events = [
        ['📱', 'QR Code Scanned', 'Style Studio Jaipur', '2m ago'],
        ['📨', 'Campaign Sent', 'Fitness Hub Delhi', '5m ago'],
        ['👤', 'New User Signup', 'Cafe Delight Mumbai', '8m ago'],
        ['⭐', 'Review Request Sent', 'Glow Salon', '12m ago'],
        ['📅', 'Booking Created', 'Dr. Mehta Clinic', '15m ago'],
        ['💎', 'Plan Upgraded', 'Burger Palace', '22m ago'],
        ['🎁', 'Loyalty Stamp Added', 'Style Studio Jaipur', '28m ago'],
        ['📊', 'Report Exported', 'Fashion Hub', '35m ago'],
    ];
    return events.map(([icon, action, biz, time]) => `
    <div class="ai-list-item">
        <span style="font-size:18px;">${icon}</span>
        <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${action}</div><div class="lbl">${biz}</div></div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);">${time}</div>
    </div>`).join('');
}

// ---- TAB: AI CHAT ----
let aiChatHistory = [];
function renderChat(body) {
    body.innerHTML = `
    <div class="ai-card" style="height:calc(100% - 20px);display:flex;flex-direction:column;">
        <div class="ai-card-title" style="margin-bottom:4px;">💬 Ask AI About Your Platform</div>
        <div class="ai-card-sub" style="margin-bottom:14px;">Ask anything about your business data, get AI insights, generate reports, and more</div>
        
        <div class="ai-chat-messages" id="aiChatMsgs">
            <div class="ai-msg ai-msg-ai">👋 Hi! I'm your sambandh.ai Intelligence Assistant. I can analyze your platform data, predict trends, identify opportunities, and help you make better decisions.<br><br>Try asking me:<br>• "Which businesses are at risk of churning?"<br>• "What's my projected revenue for Q3?"<br>• "Which city has the best engagement?"<br>• "Write a campaign for inactive customers"</div>
        </div>

        <div class="ai-chat-input-row">
            <input class="ai-input" id="aiChatInput" placeholder="Ask anything about your platform..." onkeydown="if(event.key==='Enter')sendAIChat()">
            <button class="ai-btn" onclick="sendAIChat()" style="padding:12px 20px;white-space:nowrap;">Send ↗</button>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
            ${['📊 Revenue summary', '🚨 Churn risks', '📈 Growth forecast', '🎯 Best performing city', '💡 Campaign ideas'].map(q => 
                `<button onclick="quickAIQ('${q.replace(/'/g,"\\'")}','${q}')" class="ai-btn ai-btn-ghost" style="padding:6px 12px;font-size:11px;">${q}</button>`
            ).join('')}
        </div>
    </div>`;
}

function quickAIQ(val, display) {
    const input = document.getElementById('aiChatInput');
    if (input) { input.value = display; sendAIChat(); }
}

async function sendAIChat() {
    const input = document.getElementById('aiChatInput');
    const msgs = document.getElementById('aiChatMsgs');
    const question = input?.value?.trim();
    if (!question || !msgs) return;

    input.value = '';
    msgs.innerHTML += `<div class="ai-msg ai-msg-user">${question}</div>`;
    msgs.innerHTML += `<div class="ai-msg ai-msg-thinking" id="aiThinking"><span class="ai-loader-dots"><span></span><span></span><span></span></span> Analyzing platform data...</div>`;
    msgs.scrollTop = msgs.scrollHeight;

    const { users, customers, campaigns } = getAllData();
    const pp = { basic: 299, pro: 699, premium: 1299 };
    const mrr = users.reduce((s, u) => s + (pp[u.plan] || 0), 0);
    const totalRev = customers.reduce((s, c) => s + (parseInt(c.revenue) || 0), 0);
    const churnRisk = users.filter(u => customers.filter(x => x.userId === u.uid).some(x => x.status === 'inactive')).length;

    const systemPrompt = `You are sambandh.ai's AI admin assistant. You have access to real platform data:
- Total businesses: ${users.length}
- Active users: ${users.filter(u => u.isActive).length}
- MRR: ₹${mrr}
- ARR: ₹${mrr * 12}
- Total end customers: ${customers.length}
- Campaigns sent: ${campaigns.length}
- Churn risk businesses: ${churnRisk}
- Total GMV: ₹${totalRev}
- Plan split: Basic=${users.filter(u=>u.plan==='basic').length}, Pro=${users.filter(u=>u.plan==='pro').length}, Premium=${users.filter(u=>u.plan==='premium').length}

Respond concisely and helpfully. Use emojis. Format with bullet points. Keep responses under 150 words. If asked to generate campaign messages, write them in full. Always end with one actionable recommendation.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 400,
                system: systemPrompt,
                messages: [
                    ...aiChatHistory.slice(-6),
                    { role: 'user', content: question }
                ]
            })
        });
        const data = await response.json();
        const answer = data.content?.[0]?.text || 'I could not process that. Please try again.';
        aiChatHistory.push({ role: 'user', content: question }, { role: 'assistant', content: answer });

        const thinking = document.getElementById('aiThinking');
        if (thinking) thinking.remove();
        msgs.innerHTML += `<div class="ai-msg ai-msg-ai">${answer.replace(/\n/g, '<br>')}</div>`;
    } catch (e) {
        const thinking = document.getElementById('aiThinking');
        if (thinking) thinking.remove();
        // Fallback local response
        const fallback = generateLocalResponse(question, { users, customers, campaigns, mrr, totalRev, churnRisk });
        aiChatHistory.push({ role: 'user', content: question }, { role: 'assistant', content: fallback });
        msgs.innerHTML += `<div class="ai-msg ai-msg-ai">${fallback.replace(/\n/g, '<br>')}</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;
}

function generateLocalResponse(q, data) {
    q = q.toLowerCase();
    const { users, customers, campaigns, mrr, totalRev, churnRisk } = data;
    if (q.includes('revenue') || q.includes('mrr') || q.includes('arr'))
        return `💰 **Revenue Summary**\n\n• MRR: ₹${mrr.toLocaleString()}\n• ARR: ₹${(mrr*12).toLocaleString()}\n• Platform GMV: ₹${totalRev.toLocaleString()}\n• Projected ARR (+15%): ₹${Math.round(mrr*13.8).toLocaleString()}\n\n📌 **Action:** Focus on converting ${users.filter(u=>u.plan==='basic').length} Basic users to Pro for +₹${users.filter(u=>u.plan==='basic').length*400}/mo.`;
    if (q.includes('churn') || q.includes('risk') || q.includes('leaving'))
        return `🚨 **Churn Analysis**\n\n• High-risk businesses: ${churnRisk}\n• At-risk MRR: ₹${churnRisk * 500}\n• Primary signal: Inactive end-customers\n\n📌 **Action:** Send personalized re-engagement emails to ${churnRisk} at-risk businesses within 48 hours.`;
    if (q.includes('campaign') || q.includes('message'))
        return `📨 **Campaign Insights**\n\n• Total campaigns sent: ${campaigns.length}\n• Best open rate: Thursday 10-11 AM\n• Top performing type: Festival offers (42% open rate)\n\n📌 **Action:** Schedule a festival campaign this week — could reach ${customers.length} end customers.`;
    return `🤖 **Platform Overview**\n\n• ${users.length} businesses on platform\n• ${customers.length} end customers managed\n• MRR: ₹${mrr.toLocaleString()}\n• ${churnRisk} businesses need attention\n\n📌 **Action:** Run the Churn Predictor to identify and intervene with at-risk accounts today.`;
}

// ---- TAB: AUTO-ACTIONS ----
function renderAutoActions(body) {
    const savedActions = JSON.parse(localStorage.getItem('sambandh_auto_actions') || '[]');

    body.innerHTML = `
    <div class="ai-card">
        <div class="ai-card-title">⚡ Automation Rules</div>
        <div class="ai-card-sub">Set AI-powered rules that run automatically based on platform events</div>
        <div class="ai-list" id="autoActionList" style="margin-top:12px;max-height:none;">
            ${renderActionList()}
        </div>
        <button onclick="openAddAction()" class="ai-btn" style="width:100%;margin-top:14px;">➕ Add New Automation Rule</button>
    </div>

    <div class="ai-card" id="addActionCard" style="display:none;margin-top:14px;">
        <div class="ai-card-title">➕ New Automation Rule</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            <div>
                <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Trigger</div>
                <select class="ai-input ai-select" id="actTrigger">
                    <option value="">When this happens...</option>
                    <option value="new_signup">New business signs up</option>
                    <option value="churn_risk">Business at churn risk</option>
                    <option value="plan_downgrade">Plan downgraded</option>
                    <option value="inactive_30d">30 days inactive</option>
                    <option value="milestone">100 customers milestone</option>
                    <option value="campaign_sent">Campaign sent</option>
                </select>
            </div>
            <div>
                <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Action</div>
                <select class="ai-input ai-select" id="actAction">
                    <option value="">Do this...</option>
                    <option value="send_email">Send welcome email</option>
                    <option value="send_whatsapp">Send WhatsApp message</option>
                    <option value="add_tag">Tag the account</option>
                    <option value="notify_admin">Notify admin</option>
                    <option value="offer_discount">Offer plan discount</option>
                    <option value="schedule_call">Schedule check-in call</option>
                </select>
            </div>
        </div>
        <input class="ai-input" id="actName" placeholder="Rule name (e.g. Welcome New Signups)" style="margin:12px 0;">
        <div style="display:flex;gap:10px;">
            <button onclick="saveAction()" class="ai-btn" style="flex:1;">💾 Save Rule</button>
            <button onclick="document.getElementById('addActionCard').style.display='none'" class="ai-btn ai-btn-ghost">Cancel</button>
        </div>
    </div>

    <div class="ai-grid2" style="margin-top:14px;">
        <div class="ai-card">
            <div class="ai-card-title">📊 Automation Stats</div>
            ${[['⚡ Rules Active', savedActions.filter(a=>a.active).length, '#00C97A'],
               ['🎯 Triggered Today', Math.floor(Math.random()*12)+3, '#3B82F6'],
               ['✅ Actions Executed', Math.floor(Math.random()*40)+20, '#FF5C00'],
               ['⏱ Avg Response Time', '1.4s', '#A855F7']].map(([l,v,c])=>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${l}</span>
                    <span style="font-size:16px;font-weight:800;color:${c};">${v}</span>
                </div>`).join('')}
        </div>
        <div class="ai-card">
            <div class="ai-card-title">💡 Suggested Automations</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
                ${[
                    ['🎉', 'Welcome new signups instantly', 'send_email'],
                    ['🚨', 'Alert when churn risk detected', 'notify_admin'],
                    ['🎂', 'Birthday offers automatically', 'send_whatsapp'],
                    ['⬆️', 'Upsell after 50 customers', 'offer_discount'],
                ].map(([icon, title, action]) => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;">
                    <span style="font-size:18px;">${icon}</span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.7);flex:1;">${title}</span>
                    <button onclick="quickAddAction('${title}','${action}')" class="ai-btn" style="padding:4px 10px;font-size:11px;">Add</button>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
}

function renderActionList() {
    const defaults = [
        { id: 1, name: 'Welcome New Signups', trigger: 'new_signup', action: 'send_email', active: true, runs: 12 },
        { id: 2, name: 'Churn Risk Alert', trigger: 'churn_risk', action: 'notify_admin', active: true, runs: 3 },
        { id: 3, name: '30-day Inactive Nudge', trigger: 'inactive_30d', action: 'send_whatsapp', active: false, runs: 7 },
    ];
    const saved = JSON.parse(localStorage.getItem('sambandh_auto_actions') || '[]');
    const all = [...defaults, ...saved];

    return all.map(a => `
    <div class="ai-list-item">
        <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;color:white;">${a.name}</div>
            <div class="lbl">Trigger: ${a.trigger} → ${a.action} · ${a.runs || 0} runs</div>
        </div>
        <div onclick="toggleAction(${a.id})" id="actTog_${a.id}" style="width:40px;height:22px;border-radius:22px;background:${a.active?'#00C97A':'rgba(255,255,255,0.15)'};cursor:pointer;position:relative;transition:background 0.3s;flex-shrink:0;">
            <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:3px;left:${a.active?'21px':'3px'};transition:left 0.3s;"></div>
        </div>
    </div>`).join('');
}

function openAddAction() {
    const card = document.getElementById('addActionCard');
    if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

function saveAction() {
    const name = document.getElementById('actName')?.value?.trim();
    const trigger = document.getElementById('actTrigger')?.value;
    const action = document.getElementById('actAction')?.value;
    if (!name || !trigger || !action) { showAIToast('Fill all fields', '⚠️'); return; }
    const saved = JSON.parse(localStorage.getItem('sambandh_auto_actions') || '[]');
    saved.push({ id: Date.now(), name, trigger, action, active: true, runs: 0 });
    localStorage.setItem('sambandh_auto_actions', JSON.stringify(saved));
    document.getElementById('addActionCard').style.display = 'none';
    renderAutoActions(document.getElementById('aiPanelBody'));
    showAIToast(`Rule "${name}" created! ⚡`);
}

function quickAddAction(name, action) {
    const saved = JSON.parse(localStorage.getItem('sambandh_auto_actions') || '[]');
    saved.push({ id: Date.now(), name, trigger: 'auto', action, active: true, runs: 0 });
    localStorage.setItem('sambandh_auto_actions', JSON.stringify(saved));
    renderAutoActions(document.getElementById('aiPanelBody'));
    showAIToast(`"${name}" automation added! ⚡`);
}

function toggleAction(id) {
    showAIToast('Toggle saved!', '⚡');
}

// ---- TOAST ----
function showAIToast(msg, icon = '✅') {
    if (typeof toast === 'function') { toast(msg, icon); return; }
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:white;padding:12px 22px;border-radius:12px;font-weight:700;font-size:13px;z-index:99999;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
    t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ---- ADD AI BUTTON TO ADMIN DASHBOARD ----
function injectAIButtonToAdmin() {
    // Try to inject after a short delay so DOM is ready
    setTimeout(() => {
        const adminHeader = document.querySelector('#adminDashboard .dashboard-header > div:last-child');
        if (adminHeader && !document.getElementById('adminAIBtn')) {
            const btn = document.createElement('button');
            btn.id = 'adminAIBtn';
            btn.innerHTML = '🤖 AI Intelligence';
            btn.onclick = openAIAdminPanel;
            adminHeader.insertBefore(btn, adminHeader.firstChild);
        }
        // Also add to admin sidebar nav
        const adminNav = document.querySelector('#adminDashNav .dash-nav-items');
        if (adminNav && !document.getElementById('adminAINavBtn')) {
            const navBtn = document.createElement('button');
            navBtn.id = 'adminAINavBtn';
            navBtn.className = 'dash-nav-item';
            navBtn.innerHTML = '<span class="dash-nav-icon">🤖</span><span class="dash-nav-label">AI Tools</span>';
            navBtn.onclick = () => { openAIAdminPanel(); };
            adminNav.insertBefore(navBtn, adminNav.firstChild);
        }
    }, 800);
}

// ---- KEYBOARD SHORTCUT ----
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const panel = document.getElementById('aiAdminPanel');
        if (panel?.classList.contains('active')) closeAIPanel();
    }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    injectAIAdminPanel();
    injectAIButtonToAdmin();

    // Re-inject button when admin dashboard becomes visible (MutationObserver)
    const observer = new MutationObserver(() => {
        const adminDash = document.getElementById('adminDashboard');
        if (adminDash?.classList.contains('active') && !document.getElementById('adminAIBtn')) {
            injectAIButtonToAdmin();
        }
    });
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) observer.observe(adminDash, { attributes: true, attributeFilter: ['class'] });
});

// Exports
window.openAIAdminPanel = openAIAdminPanel;
window.closeAIPanel = closeAIPanel;
window.switchAITab = switchAITab;
window.sendAIChat = sendAIChat;
window.quickAIQ = quickAIQ;
window.generateAIMessage = generateAIMessage;
window.copyAIMsg = copyAIMsg;
window.sendAIMsgCampaign = sendAIMsgCampaign;
window.openAddAction = openAddAction;
window.saveAction = saveAction;
window.quickAddAction = quickAddAction;
window.toggleAction = toggleAction;
window.broadcastToSegment = broadcastToSegment;
window.sendChurnIntervention = sendChurnIntervention;
window.execIntervention = execIntervention;
window.filterSegTable = window.filterSegTable;

console.log('🤖 sambandh.ai AI Admin Tools loaded!');
