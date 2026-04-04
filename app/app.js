const defaultVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Start Your Journey', category: 'Music', image: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', approved: true },
    { id: '1', title: 'Meet the Giant Pandas', category: 'Nature', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCodaOBHglXNJlJ_fUK_TTWuSgedGyMF1-ibZwEHR0sXGpMVWhAaLD7eXjkvLBRwgEWYf6OqUi5OWFGT4jVRmeU2bbMRzMr990XAg2pV0oiWtBoGrAcFixsuzRzwXCc7g-KwjlNDSNrdZJiamkR9MoOZ68LAOW94VpEw0_tXhtziFmxPIgQKCrKFi6lQOkAJ2rZivyKSwr09izG-Pvt3OCRFB3tvGxiG_jO6zzHTXx6G9PfnF-B5jwY-x0sVtxwC58XJnY1wAliZgmS', approved: true },
    { id: '3', title: 'Afternoon Lullabies Mix', category: 'Music', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6YzKTBd889lAw7KDr2a5p9tVFLHyU6vTdBhPPpcOxeDFmyY5TdZYQX3cHg6OnZUTMm8SCOf3bNNcH_HdghkbbmuxI-9RqKOB6o9utJqr7cFt3Osz3C3JG5KkjgxnCNqfTe70KZeb4-8hvdSLiRDX6lPE6uRzLs7RGletQH8se3V2aNQ5vcKQu-fMl_DCGIk3ru-8EPlmt910tqBSgC4IwNrb4DqcMl-gZHAB9xDHi0lSP2v-KDFFn_g8_bD5bZtEC3b7VKWIxlhT', approved: false },
];

let state = {
    mode: 'admin',
    currentScreen: 'dashboard',
    videos: defaultVideos,
    gateOpen: false,
    activeVideo: null,
    watchHistory: [],
    usageControls: {
        dailyLimitMinutes: 120, // 2 hours
        sleepStart: "19:30",
        sleepEnd: "08:00",
        lockoutMessage: "Time to take a break and play outside! ☀️"
    }
};

let player = null;
let activeVideoTimer = null;

// Auto-load state on start
try {
    const stored = localStorage.getItem('safeVideoState');
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.videos) state.videos = parsed.videos;
        if (parsed.watchHistory) state.watchHistory = parsed.watchHistory;
        if (parsed.usageControls) state.usageControls = parsed.usageControls;
    }
} catch(e) {}

function saveState() {
    localStorage.setItem('safeVideoState', JSON.stringify({ 
        videos: state.videos,
        watchHistory: state.watchHistory,
        usageControls: state.usageControls
    }));
}

function onYouTubeIframeAPIReady() {
    window.youtubeReady = true;
}

window.startKidPlayer = function(videoId) {
    if (!window.youtubeReady) return;
    player = new YT.Player('yt-player', {
        height: '500',
        width: '100%',
        videoId: videoId,
        playerVars: { 'autoplay': 1, 'modestbranding': 1, 'rel': 0 },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        if(!activeVideoTimer) {
            activeVideoTimer = setInterval(() => {
                let todayStr = new Date().toLocaleDateString();
                let vid = state.videos.find(v => v.id === state.activeVideo);
                if (!vid) return;
                
                let record = state.watchHistory.find(h => h.id === state.activeVideo && h.date === todayStr);
                if(!record) {
                    record = { id: state.activeVideo, title: vid.title, category: vid.category, image: vid.image, duration: 0, date: todayStr };
                    state.watchHistory.push(record);
                }
                record.duration += 1;
                saveState();
            }, 1000);
        }
    } else {
        clearInterval(activeVideoTimer);
        activeVideoTimer = null;
    }
}

// Global Usage Monitoring Loop
setInterval(() => {
    if(state.mode !== 'kid') return; // Only lock children out

    let now = new Date();
    let todayStr = now.toLocaleDateString();
    
    // Check limit
    let totalWatchedTodaySecs = state.watchHistory.filter(h => h.date === todayStr).reduce((acc, h) => acc + h.duration, 0);
    let limitSecs = state.usageControls.dailyLimitMinutes * 60;
    let isLocked = (totalWatchedTodaySecs >= limitSecs);

    // Check sleep
    let currentMin = now.getHours() * 60 + now.getMinutes();
    let [sH, sM] = state.usageControls.sleepStart.split(':').map(Number);
    let [eH, eM] = state.usageControls.sleepEnd.split(':').map(Number);
    let startMin = sH * 60 + sM;
    let endMin = eH * 60 + eM;

    if (startMin > endMin) { // crosses midnight
        if (currentMin >= startMin || currentMin <= endMin) isLocked = true;
    } else {
        if (currentMin >= startMin && currentMin <= endMin) isLocked = true;
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
                <h1 class="display-text">${state.usageControls.lockoutMessage}</h1>
                <button class="btn-kid-primary" onclick="navigate('admin', 'dashboard')">Parent Unlock PIN</button>
            `;
            document.body.appendChild(div);
        }
    } else {
        if(lockoutEl) lockoutEl.remove();
    }
}, 1000);

window.navigate = function(mode, screen) {
    if(player && typeof player.destroy === 'function') {
        player.destroy();
        player = null;
    }
    clearInterval(activeVideoTimer);
    activeVideoTimer = null;

    if (state.mode === 'kid' && mode === 'admin') {
        state.gateOpen = true; 
        let lockoutEl = document.getElementById('lockout-modal-element');
        if (lockoutEl) lockoutEl.remove();
    } else {
        state.mode = mode;
        state.currentScreen = screen;
    }
    window.render();
}

window.solveGate = function(answer) {
    if (answer === 4) { 
        state.gateOpen = false;
        state.mode = 'admin';
        state.currentScreen = 'dashboard';
        window.render();
    } else {
        alert('Incorrect! Try again.');
    }
}

window.toggleApproval = function(id) {
    const video = state.videos.find(v => v.id === id);
    if(video) { video.approved = !video.approved; saveState(); window.render(); }
}
window.deleteVideo = function(id) {
    state.videos = state.videos.filter(v => v.id !== id); saveState(); window.render();
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
    state.videos.unshift({ id: videoId, title: titleInput, category: catInput, image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, approved: true });
    saveState();
    window.navigate('admin', 'dashboard');
}

window.updateUsage = function() {
    state.usageControls.dailyLimitMinutes = document.getElementById('daily-limit-input').value;
    state.usageControls.sleepStart = document.getElementById('sleep-start-input').value;
    state.usageControls.sleepEnd = document.getElementById('sleep-end-input').value;
    state.usageControls.lockoutMessage = document.getElementById('lockout-msg-input').value;
    saveState();
    alert('Controls Updated!');
}

function renderParentalGate() {
    return `
        <div class="parental-gate-modal">
            <h1 class="display-text" style="margin-bottom: 2rem;">Parental Area</h1>
            <h2 class="display-text" style="font-size: 3rem; margin: 2rem 0;">2 + 2 = ?</h2>
            <div style="display: flex; gap: 1rem;">
                <button class="btn-kid-primary" onclick="solveGate(3)">3</button>
                <button class="btn-kid-primary" onclick="solveGate(4)" id="gate-btn-correct">4</button>
                <button class="btn-kid-primary" onclick="solveGate(5)">5</button>
            </div>
            <button style="margin-top:2rem; background:none; text-decoration:underline" onclick="state.gateOpen=false; window.render();">Cancel</button>
        </div>
    `;
}

function renderAdminLayout(content) {
    return `
        <div class="admin-layout">
            <aside class="sidebar">
                <div class="sidebar-profile">
                    <h2>Parental Control</h2><p>Admin Mode</p>
                </div>
                <nav class="sidebar-nav">
                    <button class="nav-item ${state.currentScreen==='dashboard'?'active':''}" onclick="navigate('admin', 'dashboard')">Dashboard</button>
                    <button class="nav-item ${state.currentScreen==='history'?'active':''}" onclick="navigate('admin', 'history')">History</button>
                    <button class="nav-item ${state.currentScreen==='addVideo'?'active':''}" onclick="navigate('admin', 'addVideo')">Add Video</button>
                    <button class="nav-item ${state.currentScreen==='usage'?'active':''}" onclick="navigate('admin', 'usage')">Usage Controls</button>
                </nav>
                <button id="btn-switch-kid" class="btn-switch-mode" onclick="navigate('kid', 'kidHome')">Switch to Kid Mode</button>
            </aside>
            <main class="main-content">
                <header class="top-bar glass-nav"><h1>SafeVideo Admin</h1></header>
                <section class="content-area" style="padding-top: 2rem;">${content}</section>
            </main>
        </div>
    `;
}

function renderAdminDashboard() {
    let todayStr = new Date().toLocaleDateString();
    let totalSecs = state.watchHistory.filter(h=>h.date===todayStr).reduce((a,b)=>a+b.duration, 0);
    let hrs = Math.floor(totalSecs/3600); let mins = Math.floor((totalSecs%3600)/60);

    return `
        <div class="bento-cards">
            <div class="bento-card hero"><h2>Today's Usage</h2><div class="badge">${hrs}h ${mins}m Watched</div></div>
            <div class="bento-card stat"><p>Total Approved</p><span class="stat-num">${state.videos.filter(v=>v.approved).length}</span></div>
        </div>
        <div class="toolbar"><h2>Content Library</h2></div>
        <div class="video-grid">
            ${state.videos.map(v => `
                <div class="video-card admin-card">
                    <img src="${v.image}" style="flex-shrink:0;">
                    <div class="card-info">
                        <h4>${v.title}</h4>
                        <div style="margin-bottom:0.5rem; display:flex; justify-content:space-between">
                            <span class="category-badge">${v.category}</span>
                            <button onclick="deleteVideo('${v.id}')" style="background:none; color:var(--error); text-decoration:underline;">Delete</button>
                        </div>
                        <label class="toggle hover:shadow-md cursor-pointer"><input type="checkbox" ${v.approved ? 'checked':''} onchange="toggleApproval('${v.id}')"><span class="slider"></span></label>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderAdminHistory() {
    let todayStr = new Date().toLocaleDateString();
    let totalSecs = state.watchHistory.filter(h=>h.date===todayStr).reduce((a,b)=>a+b.duration, 0);
    let hrs = Math.floor(totalSecs/3600); let mins = Math.floor((totalSecs%3600)/60);

    return `
        <div class="bento-card hero" style="margin-bottom:2rem;">
            <h2>Total Watch Time Today</h2><div class="badge" style="font-size:2rem;">${hrs}h ${mins}m</div>
        </div>
        <h3>Recent Video Log</h3>
        <div style="margin-top: 1rem;">
            ${state.watchHistory.length === 0 ? '<p>No watch history yet.</p>' : ''}
            ${state.watchHistory.slice().reverse().map(h => `
                <div class="history-card">
                    <img src="${h.image}">
                    <div>
                        <h4>${h.title}</h4>
                        <span class="category-badge">${h.category}</span>
                        <div class="history-meta"><span>Date: ${h.date}</span><span>Duration: ${Math.floor(h.duration/60)}m ${h.duration%60}s</span></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderAdminUsageControls() {
    return `
        <h2 style="margin-bottom: 2rem;">Usage & Time Limits</h2>
        <div class="usage-group">
            <h3 style="margin-bottom:0.5rem;">Daily Limit (minutes)</h3>
            <p style="color:var(--outline); margin-bottom:1rem;">App locks when watched time exceeds limit.</p>
            <input type="number" class="admin-input" id="daily-limit-input" value="${state.usageControls.dailyLimitMinutes}">
        </div>
        <div class="usage-group">
            <h3 style="margin-bottom:0.5rem;">Sleep Timer (Lockout Window)</h3>
            <p style="color:var(--outline); margin-bottom:1rem;">App locks dynamically between Start and End time.</p>
            <div style="display:flex; gap:1rem;">
                <div style="flex:1;"><label>Start Time</label><input type="time" class="admin-input" id="sleep-start-input" value="${state.usageControls.sleepStart}"></div>
                <div style="flex:1;"><label>End Time</label><input type="time" class="admin-input" id="sleep-end-input" value="${state.usageControls.sleepEnd}"></div>
            </div>
        </div>
        <div class="usage-group">
            <h3 style="margin-bottom:0.5rem;">End-of-Session Message</h3>
            <p style="color:var(--outline); margin-bottom:1rem;">Displayed to the child when limits are reached.</p>
            <input type="text" class="admin-input" id="lockout-msg-input" value="${state.usageControls.lockoutMessage}">
        </div>
        <button class="btn-admin-primary" style="width:100%; padding:1rem; font-size:1.1rem;" onclick="updateUsage()">Save Controls</button>
    `;
}

function renderAdminAddVideo() {
    return `
        <div class="form-card" style="padding: 2rem; background: var(--surface-container-lowest); border-radius: var(--rounded-lg); max-width: 600px; margin: 0 auto;">
            <h2>Add Safe Video</h2>
            <div style="margin:1.5rem 0;"><label>YouTube URL *</label><input type="text" id="new-video-url" class="admin-input"></div>
            <div style="margin:1.5rem 0;"><label>Custom Title</label><input type="text" id="new-video-title" class="admin-input"></div>
            <div style="margin:1.5rem 0;"><label>Category</label>
                <select id="new-video-category" class="admin-input"><option>Educational</option><option>Music</option><option>Entertainment</option></select>
            </div>
            <button class="btn-admin-primary" style="width: 100%;" onclick="handleAddVideo()">Add to Library</button>
        </div>
    `;
}

function renderKidLayout(content) {
    return `<div class="kid-layout"><header class="kid-header"><h1 class="display-text" style="color: var(--secondary)">SafeVideo</h1><button id="btn-exit-kid" class="btn-exit-kid" onclick="navigate('admin', 'dashboard')">Exit Kids Mode</button></header><main class="kid-main">${content}</main></div>`;
}

function renderKidHome() {
    const approved = state.videos.filter(v => v.approved);
    return `<h2 class="display-text" style="text-align: center; margin-bottom: 2rem;">Pick a video!</h2>
        <div class="video-grid-kid">
            ${approved.map(v => `<div class="video-card kid-card" id="play-${v.id}" onclick="state.activeVideo = '${v.id}'; navigate('kid','kidPlayer')"><img src="${v.image}">
                    <div class="kid-card-footer"><h3>${v.title}</h3></div></div>`).join('')}
        </div>`;
}

function renderKidPlayer() {
    const v = state.videos.find(v => v.id === state.activeVideo);
    if(!v) return `<p>Video not found</p>`;
    setTimeout(() => { if (v.id.length === 11 && window.YT && window.YT.Player) { window.startKidPlayer(v.id); } }, 200);
    return `
        <button class="btn-back" onclick="navigate('kid','kidHome')" id="btn-back-home">⬅ Back to Home</button>
        <div class="player-container">
            ${v.id.length===11 ? `<div id="yt-player"></div>` : `<img src="${v.image}" class="mock-player-img">`}
            <div class="player-controls"><h2 class="display-text">${v.title}</h2></div>
        </div>
    `;
}

window.render = function() {
    const appEl = document.getElementById('app');
    document.body.className = `${state.mode}-mode`;
    if (state.gateOpen) return appEl.innerHTML = renderParentalGate();
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
