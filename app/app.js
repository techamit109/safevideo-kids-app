const defaultVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Start Your Journey', category: 'Music', image: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    { id: '1', title: 'Meet the Giant Pandas', category: 'Nature', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCodaOBHglXNJlJ_fUK_TTWuSgedGyMF1-ibZwEHR0sXGpMVWhAaLD7eXjkvLBRwgEWYf6OqUi5OWFGT4jVRmeU2bbMRzMr990XAg2pV0oiWtBoGrAcFixsuzRzwXCc7g-KwjlNDSNrdZJiamkR9MoOZ68LAOW94VpEw0_tXhtziFmxPIgQKCrKFi6lQOkAJ2rZivyKSwr09izG-Pvt3OCRFB3tvGxiG_jO6zzHTXx6G9PfnF-B5jwY-x0sVtxwC58XJnY1wAliZgmS' },
    { id: '3', title: 'Afternoon Lullabies Mix', category: 'Music', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6YzKTBd889lAw7KDr2a5p9tVFLHyU6vTdBhPPpcOxeDFmyY5TdZYQX3cHg6OnZUTMm8SCOf3bNNcH_HdghkbbmuxI-9RqKOB6o9utJqr7cFt3Osz3C3JG5KkjgxnCNqfTe70KZeb4-8hvdSLiRDX6lPE6uRzLs7RGletQH8se3V2aNQ5vcKQu-fMl_DCGIk3ru-8EPlmt910tqBSgC4IwNrb4DqcMl-gZHAB9xDHi0lSP2v-KDFFn_g8_bD5bZtEC3b7VKWIxlhT' },
];

let defaultDaySchedule = { limitMinutes: 120, timeSlots: [{start:'08:00', end:'19:30'}], isOffDay: false };
let defaultWeekSchedule = {
    'Sunday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Monday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Tuesday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Wednesday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Thursday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Friday': JSON.parse(JSON.stringify(defaultDaySchedule)),
    'Saturday': JSON.parse(JSON.stringify(defaultDaySchedule)),
};

let state = {
    mode: 'auth_init',
    currentScreen: 'dashboard',
    adminPin: null,
    gateOpen: false,
    activeVideo: null,
    activeKidId: null,
    videos: defaultVideos,
    kids: []
};

let player = null;
let activeVideoTimer = null;
window.adminActiveKidId = null;
window.adminActiveDay = 'Monday';

try {
    const stored = localStorage.getItem('safeVideoState_v3');
    if (stored) {
        Object.assign(state, JSON.parse(stored));
    } else {
        state.kids.push({
            id: 'kid_' + Date.now(),
            name: 'Toddler',
            avatar: '👦',
            allowedVideoIds: defaultVideos.map(v=>v.id),
            watchHistory: [],
            schedules: JSON.parse(JSON.stringify(defaultWeekSchedule)),
            lockMessage: "Time to take a break and play outside! ☀️"
        });
        localStorage.setItem('safeVideoState_v3', JSON.stringify(state));
    }
} catch(e) {}

if (!state.adminPin) state.mode = 'auth_init';
else if (state.mode === 'auth_init') state.mode = 'kid_select';

if (state.kids.length > 0 && !window.adminActiveKidId) {
    window.adminActiveKidId = state.kids[0].id;
}

function saveState() {
    localStorage.setItem('safeVideoState_v3', JSON.stringify(state));
}

window.startKidPlayer = function(videoId) {
    if (!window.YT || !window.YT.Player) {
        setTimeout(() => window.startKidPlayer(videoId), 500);
        return;
    }
    player = new YT.Player('yt-player', {
        height: '500', width: '100%', videoId: videoId,
        playerVars: { 'autoplay': 1, 'modestbranding': 1, 'rel': 0, 'controls': 0, 'disablekb': 1, 'fs': 0, 'iv_load_policy': 3 },
        events: { 'onStateChange': onPlayerStateChange }
    });
}

const iconPlay = `<svg height="48" width="48" viewBox="0 0 36 36"><path fill="var(--on-surface)" d="M 12,26 26,18 12,10 z"></path></svg>`;
const iconPause = `<svg height="48" width="48" viewBox="0 0 36 36"><path fill="var(--on-surface)" d="M 12,26 15,26 15,10 12,10 z M 21,26 24,26 24,10 21,10 z"></path></svg>`;

function onPlayerStateChange(event) {
    let btn = document.getElementById('btn-play-pause');
    if (event.data == YT.PlayerState.PLAYING) {
        if(btn) btn.innerHTML = iconPause;
        if(!activeVideoTimer) {
            activeVideoTimer = setInterval(() => {
                let todayStr = new Date().toLocaleDateString();
                let kid = state.kids.find(k => k.id === state.activeKidId);
                let vid = state.videos.find(v => v.id === state.activeVideo);
                if (!kid || !vid) return;
                
                let record = kid.watchHistory.find(h => h.id === state.activeVideo && h.date === todayStr);
                if(!record) {
                    record = { id: state.activeVideo, title: vid.title, category: vid.category, image: vid.image, duration: 0, date: todayStr };
                    kid.watchHistory.push(record);
                }
                record.duration += 1;
                saveState();
            }, 1000);
        }
    } else {
        if(btn && (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.UNSTARTED || event.data == YT.PlayerState.CUED)) {
            btn.innerHTML = iconPlay;
        }
        clearInterval(activeVideoTimer);
        activeVideoTimer = null;
    }
    
    if (event.data == YT.PlayerState.ENDED) {
        window.navigate('kid', 'kidHome');
    }
}

setInterval(() => {
    if(state.mode !== 'kid' || !state.activeKidId) return;

    let now = new Date();
    let todayStr = now.toLocaleDateString();
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let currentDayStr = days[now.getDay()];
    let currentMin = now.getHours() * 60 + now.getMinutes();
    
    let kid = state.kids.find(k => k.id === state.activeKidId);
    if (!kid) return;

    let todaysSchedule = kid.schedules[currentDayStr];
    let isLocked = false;

    if (todaysSchedule.isOffDay) {
        isLocked = true;
    } else {
        let totalWatchedTodaySecs = kid.watchHistory.filter(h => h.date === todayStr).reduce((acc, h) => acc + h.duration, 0);
        let limitSecs = todaysSchedule.limitMinutes * 60;
        if (totalWatchedTodaySecs >= limitSecs) {
            isLocked = true;
        } else {
            let inSlot = false;
            if (!todaysSchedule.timeSlots || todaysSchedule.timeSlots.length === 0) {
                inSlot = true; 
            } else {
                for (let slot of todaysSchedule.timeSlots) {
                    let [sH, sM] = slot.start.split(':').map(Number);
                    let [eH, eM] = slot.end.split(':').map(Number);
                    let sMin = sH * 60 + sM;
                    let eMin = eH * 60 + eM;
                    if (currentMin >= sMin && currentMin < eMin) {
                        inSlot = true; break;
                    }
                }
            }
            if (!inSlot) isLocked = true;
        }
    }

    let lockoutEl = document.getElementById('lockout-modal-element');
    if (isLocked) {
        if(!lockoutEl) {
            if(player && typeof player.destroy === 'function') player.destroy();
            clearInterval(activeVideoTimer); activeVideoTimer = null;

            let div = document.createElement('div');
            div.id = 'lockout-modal-element';
            div.className = 'lockout-modal';
            div.innerHTML = `
                <h1 class="display-text">${kid.lockMessage}</h1>
                <button class="btn-kid-primary" onclick="state.gateOpen=true; window.render()">Parent Unlock PIN</button>
            `;
            document.body.appendChild(div);
        }
    } else {
        if(lockoutEl) lockoutEl.remove();
    }
}, 1000);

window.navigate = function(mode, screen) {
    if(player && typeof player.destroy === 'function') { player.destroy(); player = null; }
    clearInterval(activeVideoTimer); activeVideoTimer = null;

    if (state.mode === 'kid' && mode === 'admin') {
        state.gateOpen = true; 
        let lockoutEl = document.getElementById('lockout-modal-element');
        if (lockoutEl) lockoutEl.remove();
    } else {
        state.mode = mode; state.currentScreen = screen;
    }
    window.render();
}

window.saveAdminSetup = function() {
    const p = document.getElementById('setup-pin').value;
    if(p.length !== 4) return alert('Enter exactly 4 digits');
    state.adminPin = p; state.mode = 'kid_select'; saveState(); window.render();
}

window.verifyGate = function() {
    const p = document.getElementById('verify-pin').value;
    if (p === state.adminPin) {
        state.gateOpen = false; state.mode = 'admin'; state.currentScreen = 'dashboard'; window.render();
    } else {
        document.getElementById('pin-error').innerText = "Incorrect PIN!";
    }
}

window.selectKid = function(id) {
    state.activeKidId = id; state.mode = 'kid'; state.currentScreen = 'kidHome'; window.render();
}

window.addKid = function() {
    const name = prompt("Enter child profile name:");
    if(!name) return;
    const newId = 'kid_' + Date.now();
    state.kids.push({
        id: newId, name: name, avatar: '👧',
        allowedVideoIds: [], watchHistory: [],
        schedules: JSON.parse(JSON.stringify(defaultWeekSchedule)),
        lockMessage: "Time to take a break and play outside! ☀️"
    });
    window.adminActiveKidId = newId; saveState(); window.render();
}

window.toggleApproval = function(videoId, kidId, checked) {
    let k = state.kids.find(k=>k.id===kidId);
    if(checked) {
        if(!k.allowedVideoIds.includes(videoId)) k.allowedVideoIds.push(videoId);
    } else {
        k.allowedVideoIds = k.allowedVideoIds.filter(id => id !== videoId);
    }
    saveState(); window.render();
}

window.deleteVideo = function(id) {
    state.videos = state.videos.filter(v => v.id !== id);
    state.kids.forEach(k => k.allowedVideoIds = k.allowedVideoIds.filter(vid => vid !== id));
    saveState(); window.render();
}

window.handleAddVideo = function() {
    const urlInput = document.getElementById('new-video-url').value;
    const titleInput = document.getElementById('new-video-title').value || 'Custom YouTube Video';
    const catInput = document.getElementById('new-video-category').value;
    if(!urlInput) return alert("URL is required!");
    const match = urlInput.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (!match || !match[1]) return alert('Invalid YouTube URL');
    const videoId = match[1];
    if (state.videos.find(v => v.id === videoId)) return alert('Already in library!');
    
    state.videos.unshift({ id: videoId, title: titleInput, category: catInput, image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` });
    
    const kidCheckboxes = document.querySelectorAll('.new-vid-kid-check:checked');
    Array.from(kidCheckboxes).forEach(c => {
        let k = state.kids.find(k=>k.id===c.value);
        if(k) k.allowedVideoIds.push(videoId);
    });
    
    saveState(); window.navigate('admin', 'dashboard');
}

// Admin Usage Scripts
window.updateKidLockMsg = function(val) {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    kid.lockMessage = val; saveState();
}
window.toggleOffDay = function(checked) {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    kid.schedules[window.adminActiveDay].isOffDay = checked; saveState(); window.render();
}
window.updateLimit = function(val) {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    kid.schedules[window.adminActiveDay].limitMinutes = Number(val); saveState();
}
window.addTimeSlot = function() {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    kid.schedules[window.adminActiveDay].timeSlots.push({start: '12:00', end:'13:00'}); saveState(); window.render();
}
window.removeTimeSlot = function(idx) {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    kid.schedules[window.adminActiveDay].timeSlots.splice(idx, 1); saveState(); window.render();
}
window.saveSlots = function() {
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    let sched = kid.schedules[window.adminActiveDay];
    
    let starts = document.querySelectorAll('.slot-start');
    let ends = document.querySelectorAll('.slot-end');
    sched.timeSlots = [];
    for(let i=0; i<starts.length; i++){
        sched.timeSlots.push({start: starts[i].value, end: ends[i].value});
    }
    saveState(); alert('Schedule Saved!');
}
window.applyScheduleToAllDays = function() {
    if(!confirm("Overwrite all days with this schedule?")) return;
    window.saveSlots(); // flush exact DOM state
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    let sched = JSON.parse(JSON.stringify(kid.schedules[window.adminActiveDay]));
    ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(d => {
        kid.schedules[d] = JSON.parse(JSON.stringify(sched));
    });
    saveState(); alert('Applied to entire week!'); window.render();
}

function renderAuthInit() {
    return `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;">
        <h1 class="display-text" style="font-size:3rem; margin-bottom:1rem; color:var(--primary);">Secure Your Hub</h1>
        <p style="margin-bottom:2rem; font-size:1.2rem;">Create a 4-digit Parent PIN to lock settings.</p>
        <input type="password" id="setup-pin" maxlength="4" style="font-size:3rem; width:200px; text-align:center; letter-spacing:15px; border-radius:var(--rounded); border:2px solid var(--primary); padding:1rem;">
        <button onclick="saveAdminSetup()" class="btn-admin-primary" style="margin-top:2rem; padding:1rem 3rem; font-size:1.2rem;">Set PIN</button>
    </div>`;
}

function renderParentalGate() {
    return `<div class="parental-gate-modal">
        <h1 class="display-text" style="margin-bottom:2rem;">Enter Admin PIN</h1>
        <input type="password" id="verify-pin" maxlength="4" style="font-size:3rem; width:200px; text-align:center; letter-spacing:15px; border-radius:var(--rounded); border:2px solid var(--primary); padding:1rem;">
        <div style="margin-top: 1rem; color: var(--error); font-size:1.2rem;" id="pin-error"></div>
        <div style="display:flex; gap:1rem; margin-top:2rem;">
            <button class="btn-admin-primary" onclick="verifyGate()" style="padding:1rem 2rem; font-size:1.2rem;">Unlock</button>
            <button style="background:none; text-decoration:underline; font-size:1.2rem; cursor:pointer;" onclick="state.gateOpen=false; window.render();">Cancel</button>
        </div>
    </div>`;
}

function renderKidSelect() {
    return `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:var(--surface);">
        <h1 class="display-text" style="margin-bottom:3rem; font-size:3rem; color:var(--on-surface);">Who's watching?</h1>
        <div style="display:flex; gap:3rem; flex-wrap:wrap; justify-content:center;">
            ${state.kids.map(k => `
                <div style="text-align:center; cursor:pointer;" onclick="selectKid('${k.id}')">
                    <div style="font-size:5rem; width:150px; height:150px; border-radius:30px; background:var(--primary-container); display:flex; align-items:center; justify-content:center; margin-bottom:1rem; box-shadow:0 8px 15px rgba(0,0,0,0.1);">${k.avatar}</div>
                    <h2 class="display-text" style="font-size:1.5rem; color:var(--on-surface);">${k.name}</h2>
                </div>
            `).join('')}
        </div>
        <button style="margin-top: 5rem; cursor:pointer;" class="btn-admin-secondary" onclick="state.gateOpen=true; window.render()">Manage Profiles / Add Videos</button>
    </div>`;
}

function renderAdminLayout(content) {
    return `
        <div class="admin-layout">
            <aside class="sidebar">
                <div class="sidebar-profile"><h2>Parental Control</h2><p>Admin Mode</p></div>
                <nav class="sidebar-nav">
                    <button class="nav-item ${state.currentScreen==='dashboard'?'active':''}" onclick="navigate('admin', 'dashboard')">Dashboard</button>
                    <button class="nav-item ${state.currentScreen==='history'?'active':''}" onclick="navigate('admin', 'history')">History</button>
                    <button class="nav-item ${state.currentScreen==='addVideo'?'active':''}" onclick="navigate('admin', 'addVideo')">Library</button>
                    <button class="nav-item ${state.currentScreen==='usage'?'active':''}" onclick="navigate('admin', 'usage')">Usage Controls</button>
                </nav>
                <button class="btn-switch-mode" onclick="state.mode='kid_select'; window.render();">Exit to Profile Select</button>
            </aside>
            <main class="main-content">
                <header class="top-bar glass-nav"><h1>SafeVideo Setup</h1></header>
                <section class="content-area" style="padding-top: 2rem;">${content}</section>
            </main>
        </div>
    `;
}

function renderAdminDashboard() {
    let todayStr = new Date().toLocaleDateString();
    let totalSecs = state.kids.reduce((sum, kid) => sum + kid.watchHistory.filter(h=>h.date===todayStr).reduce((a,b)=>a+b.duration, 0), 0);
    let hrs = Math.floor(totalSecs/3600); let mins = Math.floor((totalSecs%3600)/60);

    return `
        <div class="bento-cards">
            <div class="bento-card hero">
                <h2>Total Household Usage Today</h2><div class="badge">${hrs}h ${mins}m</div>
            </div>
            <div class="bento-card stat">
                <p>Managed Profiles</p><span class="stat-num">${state.kids.length}</span>
                <button class="btn-admin-primary" style="margin-top:1rem; padding:0.5rem;" onclick="addKid()">+ Add Kid</button>
            </div>
        </div>
        
        <div class="toolbar" style="margin-top:2rem;"><h2>Library Access Overview</h2></div>
        <div class="video-grid">
            ${state.videos.map(v => `
                <div class="video-card admin-card">
                    <img src="${v.image}" style="flex-shrink:0;">
                    <div class="card-info">
                        <h4>${v.title}</h4>
                        <div style="margin-bottom:0.5rem; display:flex; justify-content:space-between">
                            <span class="category-badge">${v.category}</span>
                            <button onclick="deleteVideo('${v.id}')" style="background:none; color:var(--error); text-decoration:underline; cursor:pointer;">Delete</button>
                        </div>
                        <div style="margin-top:1rem; border-top:1px solid var(--outline-variant); padding-top:0.5rem;">
                            <p style="font-size:0.8rem; font-weight:bold; margin-bottom:0.5rem; color:var(--outline);">Can watch:</p>
                            ${state.kids.map(kid => `
                                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; margin-bottom:0.3rem;">
                                    <input type="checkbox" ${kid.allowedVideoIds.includes(v.id) ? 'checked':''} onchange="toggleApproval('${v.id}','${kid.id}', this.checked)"> ${kid.name}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderAdminHistory() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <h2>Activity Logs</h2>
            <select class="admin-input" style="width:200px" onchange="window.adminActiveKidId=this.value; window.render()">
                ${state.kids.map(k => `<option value="${k.id}" ${k.id===window.adminActiveKidId?'selected':''}>${k.name}</option>`).join('')}
            </select>
        </div>
        ${(() => {
            let kid = state.kids.find(k=>k.id===window.adminActiveKidId);
            if(!kid || kid.watchHistory.length === 0) return '<p>No history recorded yet.</p>';
            return kid.watchHistory.slice().reverse().map(h => `
                <div class="history-card" style="margin-bottom:1rem;">
                    <img src="${h.image}">
                    <div>
                        <h4>${h.title}</h4>
                        <span class="category-badge">${h.category}</span>
                        <div class="history-meta"><span>Date: ${h.date}</span><span>Time Watched: ${Math.floor(h.duration/60)}m ${h.duration%60}s</span></div>
                    </div>
                </div>
            `).join('');
        })()}
    `;
}

function renderAdminUsageControls() {
    if(!window.adminActiveKidId && state.kids.length > 0) window.adminActiveKidId = state.kids[0].id;
    let kid = state.kids.find(k => k.id === window.adminActiveKidId);
    if (!kid) return '<p>Please add a child profile first.</p>';
    
    let sched = kid.schedules[window.adminActiveDay];
    
    let timeSlotsHtml = sched.timeSlots.map((ts, idx) => `
        <div style="display:flex; gap:1rem; align-items:center; margin-bottom:0.5rem;">
            <input type="time" class="admin-input slot-start" value="${ts.start}"> to
            <input type="time" class="admin-input slot-end" value="${ts.end}">
            <button onclick="removeTimeSlot(${idx})" style="color:var(--error); background:none; cursor:pointer;">Remove</button>
        </div>
    `).join('');

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
            <h2>Weekly Schedulers</h2>
            <select class="admin-input" style="width:200px" onchange="window.adminActiveKidId=this.value; window.render()">
                ${state.kids.map(k => `<option value="${k.id}" ${k.id===window.adminActiveKidId?'selected':''}>${k.name}</option>`).join('')}
            </select>
        </div>
        
        <div class="form-card" style="padding:1.5rem; background:var(--surface-container-low); margin-bottom:2rem; border-radius:var(--rounded);">
            <label style="font-weight:bold; display:block; margin-bottom:0.5rem;">Lockout Screen Message</label>
            <input type="text" class="admin-input" value="${kid.lockMessage}" oninput="updateKidLockMsg(this.value)">
        </div>

        <div style="display:flex; gap:0.5rem; margin-bottom:2rem; overflow-x:auto;">
            ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => `
                <button onclick="window.adminActiveDay='${day}'; window.render()" style="cursor:pointer; padding:0.5rem 1rem; border-radius:var(--rounded); border:1px solid var(--outline); background:${window.adminActiveDay===day?'var(--primary)':'transparent'}; color:${window.adminActiveDay===day?'var(--on-primary)':'inherit'}">${day}</button>
            `).join('')}
        </div>
        
        <div class="usage-group">
            <h3 style="margin-bottom: 1.5rem; color:var(--primary);">${window.adminActiveDay} Settings for ${kid.name}</h3>
            
            <label class="toggle hover:shadow-md cursor-pointer" style="margin-bottom:1.5rem; display:block;"><input type="checkbox" ${sched.isOffDay?'checked':''} onchange="toggleOffDay(this.checked)"> <span class="slider"></span> Complete Off Day (Screens locked all day)</label>
            
            ${sched.isOffDay ? `<p style="color:var(--error); font-weight:bold;">${kid.name} cannot watch videos on ${window.adminActiveDay}.</p>` : `
                <div style="margin-bottom:1.5rem;">
                    <label style="font-weight:bold; display:block; margin-bottom:0.5rem;">Max Minutes per Day</label>
                    <input type="number" id="sched-limit" class="admin-input" value="${sched.limitMinutes}" onchange="updateLimit(this.value)">
                </div>
                
                <div style="margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <label style="font-weight:bold;">Allowed Time Slots</label>
                        <button onclick="addTimeSlot()" class="btn-admin-primary" style="padding:0.2rem 0.5rem; font-size:0.8rem;">+ Add Slot</button>
                    </div>
                    <p style="color:var(--outline); font-size:0.9rem; margin-bottom:1rem;">They can only watch when both checking out within one of these slots AND still having minutes left in their daily budget.</p>
                    <div id="slots-container">${timeSlotsHtml}</div>
                </div>
            `}
        </div>
        
        <div style="display:flex; gap:1rem; margin-top:2rem;">
            <button class="btn-admin-primary" onclick="saveSlots()" style="flex:1; padding:1rem; font-size:1.1rem;">Save Setup for ${window.adminActiveDay}</button>
            <button class="btn-admin-secondary" onclick="applyScheduleToAllDays()" style="flex:1; padding:1rem; font-size:1.1rem;">Map Layout to All Days</button>
        </div>
    `;
}

function renderAdminAddVideo() {
    return `
        <div class="form-card" style="padding: 2rem; background: var(--surface-container-lowest); border-radius: var(--rounded-lg); max-width: 600px; margin: 0 auto;">
            <h2>Inject URL to Library</h2>
            <div style="margin:1.5rem 0;"><label>YouTube URL *</label><input type="text" id="new-video-url" class="admin-input"></div>
            <div style="margin:1.5rem 0;"><label>Custom Title</label><input type="text" id="new-video-title" class="admin-input"></div>
            <div style="margin:1.5rem 0;"><label>Category</label>
                <select id="new-video-category" class="admin-input"><option>Educational</option><option>Music</option><option>Entertainment</option></select>
            </div>
            <label style="font-weight:bold; display:block; margin-bottom:0.5rem;">Grant Access to Profiles:</label>
            <div style="display:flex; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap;">
                ${state.kids.map(k=>`<label style="cursor:pointer;"><input type="checkbox" class="new-vid-kid-check" value="${k.id}" checked> ${k.name}</label>`).join('')}
            </div>
            <button class="btn-admin-primary" style="width: 100%; padding:1rem; font-size:1.1rem;" onclick="handleAddVideo()">Add & Assign to Profiles</button>
        </div>
    `;
}

function renderKidLayout(content) {
    let kid = state.kids.find(k=>k.id===state.activeKidId);
    return `<div class="kid-layout">
        <header class="kid-header" style="justify-content:space-between; align-items:center; display:flex;">
            <div style="display:flex; align-items:center; gap:1rem;">
                <div style="font-size:2rem; background:var(--primary-container); border-radius:50%; width:50px; height:50px; display:flex; justify-content:center; align-items:center;">${kid.avatar}</div>
                <h1 class="display-text" style="color: var(--secondary); margin:0;">Hi, ${kid.name}!</h1>
            </div>
            <button class="btn-exit-kid" onclick="state.mode='kid_select'; window.render()">Exit Profile</button>
        </header>
        <main class="kid-main">${content}</main>
    </div>`;
}

function renderKidHome() {
    let kid = state.kids.find(k => k.id === state.activeKidId);
    if (!kid) return '';
    const available = state.videos.filter(v => kid.allowedVideoIds.includes(v.id));
    return `<h2 class="display-text" style="text-align: center; margin-bottom: 2rem;">Pick a video to play!</h2>
        <div class="video-grid-kid">
            ${available.map(v => `<div class="video-card kid-card" id="play-${v.id}" onclick="state.activeVideo = '${v.id}'; navigate('kid','kidPlayer')"><img src="${v.image}">
                    <div class="kid-card-footer"><h3>${v.title}</h3></div></div>`).join('')}
        </div>`;
}

function renderKidPlayer() {
    const v = state.videos.find(v => v.id === state.activeVideo);
    if(!v) return `<p>Video not found</p>`;
    setTimeout(() => { if (v.id.length === 11) window.startKidPlayer(v.id); }, 100);
    return `
        <button class="btn-back" onclick="navigate('kid','kidHome')">⬅ Back</button>
        <div class="player-container" style="position:relative; max-width: 900px; margin: 0 auto; min-height: 500px;">
            <div style="pointer-events: none; width:100%; height:500px; overflow:hidden; border-radius: var(--rounded-lg) var(--rounded-lg) 0 0; background:black;">
                ${v.id.length===11 ? `<div id="yt-player" style="width:100%; height:100%;"></div>` : `<img src="${v.image}" class="mock-player-img" style="width:100%; height:100%; object-fit:cover;">`}
            </div>
            <div class="player-controls" style="display:flex; justify-content:flex-start; align-items:center; gap:1.5rem; padding: 1.5rem 2rem;">
                <button id="btn-play-pause" onclick="window.toggleKidVideo()" style="background:transparent; border:none; padding:0; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Play / Pause">
                    ${iconPlay}
                </button>
                <h2 class="display-text" style="margin:0; font-size:1.5rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</h2>
            </div>
        </div>
    `;
}

window.toggleKidVideo = function() {
    if (!player || typeof player.getPlayerState !== 'function') return;
    let pState = player.getPlayerState();
    if (pState === YT.PlayerState.PLAYING) player.pauseVideo(); else player.playVideo();
}

window.render = function() {
    const appEl = document.getElementById('app');
    document.body.className = `${state.mode}-mode`;
    
    if (state.mode === 'auth_init') return appEl.innerHTML = renderAuthInit();
    if (state.gateOpen) return appEl.innerHTML = renderParentalGate();
    if (state.mode === 'kid_select') return appEl.innerHTML = renderKidSelect();
    
    if (state.mode === 'admin') {
        let content = renderAdminDashboard();
        if(state.currentScreen==='addVideo') content = renderAdminAddVideo();
        if(state.currentScreen==='history') content = renderAdminHistory();
        if(state.currentScreen==='usage') content = renderAdminUsageControls();
        appEl.innerHTML = renderAdminLayout(content);
    } else {
        appEl.innerHTML = renderKidLayout(state.currentScreen === 'kidHome' ? renderKidHome() : renderKidPlayer());
    }
}
window.onload = function() { window.render(); }
