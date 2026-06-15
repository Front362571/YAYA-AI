var API = "http://127.0.0.1:5000";
var sessionId = buatSessionId();
var isLoading = false;
var sidebarOpen = true;

function buatSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function handleEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    document.getElementById('btn-send').disabled = el.value.trim().length === 0;
}

function isiPesan(t) {
    var i = document.getElementById('user-input');
    i.value = t; autoResize(i); i.focus();
}

// ===== TOGGLE SIDEBAR =====
function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    updateSidebar();
}

function updateSidebar() {
    var sb = document.getElementById('sidebar');
    var mb = document.getElementById('menu-btn');

    if (sidebarOpen) {
        sb.classList.remove('collapsed');
        mb.style.display = 'none';
    } else {
        sb.classList.add('collapsed');
        mb.style.display = 'flex';
    }
}

// ===== SESSIONS =====
function getTimeGroup(d) {
    var diff = Math.floor((new Date() - new Date(d)) / 86400000);
    if (diff === 0) return "Hari Ini";
    if (diff === 1) return "Kemarin";
    if (diff <= 7) return "7 Hari Terakhir";
    if (diff <= 30) return "30 Hari Terakhir";
    return "Lebih Lama";
}

function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function muatSessions() {
    try {
        var r = await fetch(API + "/api/sessions");
        var d = await r.json();
        var c = document.getElementById('sidebar-sessions');
        if (d.sessions.length === 0) {
            c.innerHTML = '<p style="font-size:13px;color:var(--text-tertiary);padding:16px;text-align:center">Belum ada percakapan</p>';
            return;
        }
        var g = {};
        for (var i = 0; i < d.sessions.length; i++) {
            var s = d.sessions[i];
            var gr = getTimeGroup(s.created_at);
            if (!g[gr]) g[gr] = [];
            g[gr].push(s);
        }
        var h = '';
        var go = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "30 Hari Terakhir", "Lebih Lama"];
        for (var x = 0; x < go.length; x++) {
            if (!g[go[x]]) continue;
            h += '<div class="session-group-label">' + go[x] + '</div>';
            var it = g[go[x]];
            for (var j = 0; j < it.length; j++) {
                var a = (it[j].session_id === sessionId) ? ' active' : '';
                h += '<div class="session-item' + a + '" onclick="muatSession(\'' + it[j].session_id + '\')">';
                h += '<span class="session-title" id="title_' + it[j].session_id + '">' + esc(it[j].title) + '</span>';
                h += '<div class="session-actions">';
                h += '<button class="session-btn" onclick="event.stopPropagation();renameChat(\'' + it[j].session_id + '\')">✏️</button>';
                h += '<button class="session-btn delete" onclick="event.stopPropagation();hapusChatById(\'' + it[j].session_id + '\')">🗑️</button>';
                h += '</div></div>';
            }
        }
        c.innerHTML = h;
    } catch (e) {
        console.log('Gagal muat sessions:', e);
    }
}

function renameChat(sid) {
    var t = document.getElementById('title_' + sid);
    if (!t) return;
    var ct = t.textContent.trim();
    t.innerHTML = '<input type="text" class="rename-input" value="' + esc(ct) + '" onkeydown="rnKey(event,\'' + sid + '\')" onblur="rnSave(\'' + sid + '\')" />';
    t.querySelector('input').focus();
    t.querySelector('input').select();
}

function rnKey(e, sid) {
    if (e.key === 'Enter') { e.preventDefault(); rnSave(sid); }
    if (e.key === 'Escape') muatSessions();
}

async function rnSave(sid) {
    var t = document.getElementById('title_' + sid);
    if (!t) return;
    var inp = t.querySelector('input');
    if (!inp) return;
    var nw = inp.value.trim();
    if (!nw) { muatSessions(); return; }
    try {
        var fd = new FormData();
        fd.append('title', nw);
        await fetch(API + "/api/session/" + sid + "/rename", { method: 'POST', body: fd });
    } catch (e) {}
    muatSessions();
}

async function hapusChatById(sid) {
    if (!confirm('Hapus percakapan ini?')) return;
    try { await fetch(API + "/api/session/" + sid, { method: 'DELETE' }); } catch (e) {}
    if (sid === sessionId) newChat(); else muatSessions();
}

function hapusChat() { hapusChatById(sessionId); }

function wHTML() {
    return '<div class="welcome-screen" id="welcome-screen">' +
        '<div class="welcome-logo"><img src="logo.png" class="welcome-logo-img" onerror="this.outerHTML=\'<div class=welcome-logo-fallback>Y</div>\'" /></div>' +
        '<h1 class="welcome-title">YAYA AI</h1>' +
        '<p class="welcome-subtitle">Asisten AI pribadi yang cerdas dan powerful</p>' +
        '<div class="welcome-grid">' +
        '<div class="welcome-card" onclick="isiPesan(\'Jelaskan tentang kecerdasan buatan\')"><div class="welcome-card-icon">💡</div><p>Jelaskan tentang kecerdasan buatan</p></div>' +
        '<div class="welcome-card" onclick="isiPesan(\'Buatkan kode Python web scraper\')"><div class="welcome-card-icon">💻</div><p>Buatkan kode Python web scraper</p></div>' +
        '<div class="welcome-card" onclick="isiPesan(\'Bagaimana cuaca di Jakarta?\')"><div class="welcome-card-icon">🌤️</div><p>Bagaimana cuaca di Jakarta?</p></div>' +
        '<div class="welcome-card" onclick="isiPesan(\'Cari berita terbaru tentang AI\')"><div class="welcome-card-icon">🔍</div><p>Cari berita terbaru tentang AI</p></div>' +
        '</div></div>';
}

function newChat() {
    sessionId = buatSessionId();
    document.getElementById('chat-messages').innerHTML = wHTML();
    document.getElementById('chat-title').textContent = 'YAYA AI';
    document.getElementById('upload-status').textContent = '';
    muatSessions();
}

async function muatSession(id) {
    sessionId = id;
    document.getElementById('chat-title').textContent = 'YAYA AI';
    try {
        var r = await fetch(API + "/api/history/" + id);
        var d = await r.json();
        var c = document.getElementById('chat-messages');
        c.innerHTML = '';
        for (var i = 0; i < d.history.length; i++) showMsg(d.history[i].role, d.history[i].content);
        scrollDown();
        muatSessions();
    } catch (e) {
        console.log('Gagal muat history:', e);
    }
}

// ===== UPLOAD DARI SIDEBAR =====
async function uploadFile() {
    var fi = document.getElementById('file-input');
    var st = document.getElementById('upload-status');
    if (!fi.files[0]) return;
    st.textContent = 'Mengupload...';
    var fd = new FormData();
    fd.append('file', fi.files[0]);
    try {
        var r = await fetch(API + "/api/upload/" + sessionId, { method: 'POST', body: fd });
        var d = await r.json();
        if (d.status === 'berhasil') {
            st.textContent = '✓ ' + d.pesan;
            st.style.color = 'var(--accent)';
            var w = document.getElementById('welcome-screen');
            if (w) w.remove();
            showMsg('assistant', '📄 ' + d.file + ' berhasil dimuat.');
        } else {
            st.textContent = '✗ ' + d.error;
            st.style.color = 'var(--danger)';
        }
    } catch (e) {
        st.textContent = '✗ Gagal upload';
        st.style.color = 'var(--danger)';
    }
    fi.value = '';
}

// ===== UPLOAD DARI TOMBOL CHAT =====
async function uploadFileChat(inputEl) {
    if (!inputEl.files[0]) return;

    var w = document.getElementById('welcome-screen');
    if (w) w.remove();

    var fileName = inputEl.files[0].name;
    showMsg('user', '📎 Upload: ' + fileName);

    var lh = '<div class="message-row assistant" id="upload-loading"><div class="message-inner">' +
        '<div class="msg-avatar ai-av"><img src="logo.png" onerror="this.outerHTML=\'<div class=ai-fallback>Y</div>\'" /></div>' +
        '<div class="msg-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>' +
        '</div></div>';
    document.getElementById('chat-messages').insertAdjacentHTML('beforeend', lh);
    scrollDown();

    var fd = new FormData();
    fd.append('file', inputEl.files[0]);

    try {
        var r = await fetch(API + "/api/upload/" + sessionId, { method: 'POST', body: fd });
        var d = await r.json();
        var le = document.getElementById('upload-loading');
        if (le) le.remove();

        if (d.status === 'berhasil') {
            showMsg('assistant', '✅ **' + d.file + '** berhasil dimuat. Silakan tanya apa saja tentang isinya.');
        } else {
            showMsg('assistant', '❌ Gagal upload: ' + d.error);
        }
    } catch (e) {
        var le2 = document.getElementById('upload-loading');
        if (le2) le2.remove();
        showMsg('assistant', '❌ Gagal upload file.');
    }

    inputEl.value = '';
}

// ===== CHAT =====
async function kirimPesan() {
    if (isLoading) return;
    var inp = document.getElementById('user-input');
    var msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    inp.style.height = 'auto';
    document.getElementById('btn-send').disabled = true;
    isLoading = true;

    var w = document.getElementById('welcome-screen');
    if (w) w.remove();

    showMsg('user', msg);

    var lh = '<div class="message-row assistant" id="loading-row"><div class="message-inner">' +
        '<div class="msg-avatar ai-av"><img src="logo.png" onerror="this.outerHTML=\'<div class=ai-fallback>Y</div>\'" /></div>' +
        '<div class="msg-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>' +
        '</div></div>';
    document.getElementById('chat-messages').insertAdjacentHTML('beforeend', lh);
    scrollDown();

    var fd = new FormData();
    fd.append('session_id', sessionId);
    fd.append('pesan', msg);

    try {
        var res = await fetch(API + "/api/chat", { method: 'POST', body: fd });
        var le = document.getElementById('loading-row');
        if (le) le.remove();

        var bid = 'ai_' + Date.now();
        var ah = '<div class="message-row assistant" id="row_' + bid + '"><div class="message-inner">' +
            '<div class="msg-avatar ai-av"><img src="logo.png" onerror="this.outerHTML=\'<div class=ai-fallback>Y</div>\'" /></div>' +
            '<div class="msg-content" id="content_' + bid + '"></div></div></div>';
        document.getElementById('chat-messages').insertAdjacentHTML('beforeend', ah);

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var full = '';

        while (true) {
            var result = await reader.read();
            if (result.done) break;
            var lines = decoder.decode(result.value).split('\n');
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].indexOf('data: ') === 0) {
                    try {
                        var jd = JSON.parse(lines[i].substring(6));
                        if (jd.content) {
                            full += jd.content;
                            var ce = document.getElementById('content_' + bid);
                            if (ce) ce.innerHTML = fmt(full);
                            scrollDown();
                        }
                        if (jd.done) muatSessions();
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        var le2 = document.getElementById('loading-row');
        if (le2) le2.remove();
        showMsg('assistant', '❌ Gagal terhubung ke YAYA AI.');
    }

    isLoading = false;
    document.getElementById('btn-send').disabled = true;
    document.getElementById('user-input').focus();
}

function showMsg(role, content) {
    var c = document.getElementById('chat-messages');
    var av = (role === 'user')
        ? '<div class="msg-avatar user-av">U</div>'
        : '<div class="msg-avatar ai-av"><img src="logo.png" onerror="this.outerHTML=\'<div class=ai-fallback>Y</div>\'" /></div>';
    var h = '<div class="message-row ' + role + '"><div class="message-inner">' + av +
        '<div class="msg-content">' + fmt(content) + '</div></div></div>';
    c.insertAdjacentHTML('beforeend', h);
    scrollDown();
}

function fmt(t) {
    if (!t) return '';
    return t
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function scrollDown() {
    var c = document.getElementById('chat-messages');
    c.scrollTop = c.scrollHeight;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    var fiSidebar = document.getElementById('file-input');
    if (fiSidebar) {
        fiSidebar.addEventListener('change', function () {
            if (this.files[0]) uploadFile();
        });
    }

    var fiChat = document.getElementById('file-input-chat');
    if (fiChat) {
        fiChat.addEventListener('change', function () {
            if (this.files[0]) uploadFileChat(this);
        });
    }

    updateSidebar();
});

muatSessions();