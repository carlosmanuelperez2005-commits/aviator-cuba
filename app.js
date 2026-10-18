let audioCtx = null;
let musicEnabled = true;
let bgMusicInterval = null;

function triggerHaptic(type = 'short') {
    if ('vibrate' in navigator) {
        if (type === 'short') navigator.vibrate(40);
        else if (type === 'win') navigator.vibrate([30, 50, 60]);
        else if (type === 'crash') navigator.vibrate([100, 30, 100]);
    }
}

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (audioCtx) audioCtx.suspend();
        if (bgMusicInterval) clearInterval(bgMusicInterval);
    } else if (musicEnabled && audioCtx) {
        audioCtx.resume();
        startBgMusic();
    }
});

function playStartSFX() {
    if (!musicEnabled || document.hidden) return;
    initAudio();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.8);
}

function playWinSFX() {
    if (!musicEnabled || document.hidden) return;
    initAudio();
    triggerHaptic('win');
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08); osc.stop(audioCtx.currentTime + idx * 0.08 + 0.3);
    });
}

function playCrashSFX() {
    if (!musicEnabled || document.hidden) return;
    initAudio();
    triggerHaptic('crash');
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
}

const jazzChords = [[293.66, 349.23, 440.00, 523.25], [196.00, 246.94, 293.66, 349.23], [261.63, 329.63, 392.00, 493.88], [220.00, 277.18, 329.63, 392.00]];
const jazzBassLine = [146.83, 196.00, 130.81, 110.00];
let jazzStep = 0;

function playJazzBeat() {
    if (!musicEnabled || !audioCtx || document.hidden) return;
    const now = audioCtx.currentTime;
    const bassOsc = audioCtx.createOscillator(), bassGain = audioCtx.createGain();
    bassOsc.type = 'sine'; bassOsc.frequency.setValueAtTime(jazzBassLine[jazzStep % 4], now);
    bassGain.gain.setValueAtTime(0.25, now); bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    bassOsc.connect(bassGain); bassGain.connect(audioCtx.destination);
    bassOsc.start(now); bassOsc.stop(now + 0.5);

    jazzChords[jazzStep % 4].forEach(freq => {
        const chordOsc = audioCtx.createOscillator(), chordGain = audioCtx.createGain();
        chordOsc.type = 'triangle'; chordOsc.frequency.setValueAtTime(freq, now);
        chordGain.gain.setValueAtTime(0.08, now); chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        chordOsc.connect(chordGain); chordGain.connect(audioCtx.destination);
        chordOsc.start(now); chordOsc.stop(now + 0.45);
    });
    jazzStep = (jazzStep + 1) % 4;
}

function startBgMusic() { if (bgMusicInterval) clearInterval(bgMusicInterval); bgMusicInterval = setInterval(playJazzBeat, 550); }
function toggleMusic() {
    musicEnabled = !musicEnabled;
    const btn = document.getElementById('musicToggleBtn');
    if (musicEnabled) { btn.textContent = '🎷 Jazz: ON'; initAudio(); startBgMusic(); }
    else { btn.textContent = '🔇 Audio: OFF'; if (bgMusicInterval) clearInterval(bgMusicInterval); }
}

function showToast(text) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tabName === 'live') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('liveTabContent').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('myBetsTabContent').classList.add('active');
    }
}

let particles = [];
function createParticles(x, y, count = 2, isExplosion = false) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: isExplosion ? (Math.random() - 0.5) * 8 : -Math.random() * 2 - 1,
            vy: isExplosion ? (Math.random() - 0.5) * 8 : Math.random() * 1 - 0.5,
            size: isExplosion ? Math.random() * 6 + 3 : Math.random() * 3 + 2,
            color: isExplosion ? '#ef4444' : 'rgba(255,255,255,0.4)',
            life: 1.0
        });
    }
}

function updateAndDrawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}

let liveBets = [];
let myPersonalBets = [];

function generateLiveBets() {
    const fakeIDs = ['CUB-382910', 'CUB-910283', 'CUB-120938', 'CUB-772819', 'CUB-549102'];
    liveBets = fakeIDs.map(id => ({
        id,
        bet: Math.floor(Math.random() * 20) + 5,
        targetMult: (1.1 + Math.random() * 3.5).toFixed(2),
        cashed: false,
        win: 0
    }));

    if (currentUser && (bet1.active || bet2.active)) {
        liveBets.unshift({
            id: currentUser.pageId + ' (Tú)',
            bet: (bet1.active ? bet1.amount : 0) + (bet2.active ? bet2.amount : 0),
            targetMult: '-',
            cashed: bet1.cashed || bet2.cashed,
            win: 0
        });
    }
    renderLiveBets();
}

function updateLiveBets(mult) {
    liveBets.forEach(b => {
        if (!b.cashed && b.targetMult !== '-' && mult >= parseFloat(b.targetMult)) {
            b.cashed = true;
            b.win = (b.bet * parseFloat(b.targetMult)).toFixed(2);
            if (parseFloat(b.targetMult) >= 5.0) {
                showToast(`🔥 ${b.id} cobró a ${b.targetMult}x!`);
            }
        }
    });
    renderLiveBets();
}

function renderLiveBets() {
    const container = document.getElementById('liveBetsList');
    if (!container) return;
    container.innerHTML = '';
    liveBets.forEach(b => {
        const div = document.createElement('div');
        div.className = 'live-row';
        div.innerHTML = `
            <span class="live-user">${b.id}</span>
            <span class="live-mult">${b.cashed ? b.targetMult + 'x' : 'Jugando...'}</span>
            <span class="live-win">${b.cashed ? '+$' + (b.win || (b.bet * currentMultiplier).toFixed(2)) : '$' + b.bet}</span>
        `;
        container.appendChild(div);
    });
}

function renderMyBets() {
    const container = document.getElementById('myBetsList');
    if (!container) return;
    if (myPersonalBets.length === 0) {
        container.innerHTML = '<div style="font-size:10px; color:#64748b; text-align:center;">No tienes apuestas registradas aún.</div>';
        return;
    }
    container.innerHTML = '';
    myPersonalBets.slice(-6).reverse().forEach(bet => {
        const div = document.createElement('div');
        div.className = 'live-row';
        div.innerHTML = `
            <span class="live-user">$${bet.amount}</span>
            <span class="live-mult">${bet.cashed ? bet.mult + 'x' : 'Crash'}</span>
            <span class="live-win" style="color: ${bet.cashed ? '#00ff88' : '#ef4444'}">${bet.cashed ? '+$' + bet.profit.toFixed(2) : '-$' + bet.amount}</span>
        `;
        container.appendChild(div);
    });
}

let userAchievements = { riskTotal: false };

function checkAchievements(betAmount, multiplier, cashed) {
    if (cashed && betAmount >= 20 && multiplier >= 10.0 && !userAchievements.riskTotal) {
        userAchievements.riskTotal = true;
        currentUser.balance += 50.00;
        saveUserBalance();
        showToast('🏆 ¡LOGRO DESBLOQUEADO: Riesgo Total! +$50.00');
    }
}

function openAchievementsModal() {
    const container = document.getElementById('achievementsList');
    container.innerHTML = `
        <div style="background:#161f33; padding:10px; border-radius:8px; border:1px solid ${userAchievements.riskTotal ? '#00ff88' : '#2b3752'}">
            <div style="font-weight:bold; color:${userAchievements.riskTotal ? '#00ff88' : '#fff'}; font-size:12px;">🎯 Riesgo Total (Logro Especial)</div>
            <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Aposta $20 o más y retira en 10.00x o más.</div>
            <div style="font-size:10px; color:#eab308; margin-top:4px;">Recompensa: +$50.00 ${userAchievements.riskTotal ? '✅ (Completado)' : '🔒'}</div>
        </div>
    `;
    document.getElementById('achievementsModal').style.display = 'flex';
}

const fakeAuthors = ['CUB-382910', 'CUB-910283', 'CUB-120938', 'CUB-772819', 'CUB-549102'];
const fakeMessages = ["¡Asere, ese avión voló sabroso!", "Cobré a 2.50x, algo es algo 😂", "Aseguren ganancias mi gente 🔥", "¡Pura candela hoy el Aviator!"];

function initChatSimulation() {
    const box = document.getElementById('chatBox');
    if (!box || box.dataset.initialized) return;
    box.dataset.initialized = "true";
    addChatMessage('CUB-382910', '¡Buenas gente, listos para volar!');
    setInterval(() => {
        if (document.hidden) return;
        addChatMessage(fakeAuthors[Math.floor(Math.random() * fakeAuthors.length)], fakeMessages[Math.floor(Math.random() * fakeMessages.length)]);
    }, 8000);
}

function addChatMessage(author, message, isUser = false) {
    const box = document.getElementById('chatBox'); if (!box) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg' + (isUser ? ' user-msg' : '');
    msgDiv.innerHTML = `<span class="chat-author">${author}:</span> ${message}`;
    box.appendChild(msgDiv); box.scrollTop = box.scrollHeight;
}

function sendUserMessage() {
    const input = document.getElementById('chatInput'), text = input.value.trim();
    if (!text || !currentUser) return;
    addChatMessage(currentUser.pageId + ' (Tú)', text, true);
    input.value = '';
}

// PANEL DE ADMINISTRACIÓN (5 clics en el título Aviator)
let clickCount = 0;
let clickTimer = null;

function triggerAdminAccess() {
    clickCount++;
    if (clickCount === 1) {
        clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
    } else if (clickCount >= 5) {
        clearTimeout(clickTimer);
        clickCount = 0;
        const pin = prompt("Introduce el PIN de Administrador:");
        if (pin === "1234") {
            openAdminPanel();
        } else if (pin !== null) {
            alert("PIN incorrecto.");
        }
    }
}

function openAdminPanel() {
    let modal = document.getElementById('adminModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 style="color: #3b82f6; margin-bottom: 10px;">🛠️ Panel de Administración</h3>
                <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 12px; margin-bottom: 12px;">
                    <div style="background:#161f33; padding:8px; border-radius:6px;">Reserva del Casino: <strong id="admReserve" style="color:#00ff88;">$1000.00</strong></div>
                    <div style="background:#161f33; padding:8px; border-radius:6px;">Ganancia Neta: <strong id="admProfit" style="color:#eab308;">$0.00</strong></div>
                    <div style="background:#161f33; padding:8px; border-radius:6px;">
                        <label style="display:block; margin-bottom:4px;">Ajustar RTP (%):</label>
                        <select id="rtpMode" onchange="changeRTP()" style="width:100%; padding:6px; background:#090d16; color:#fff; border:1px solid #2b3752; border-radius:4px;">
                            <option value="0.97">97% (Normal)</option>
                            <option value="0.90">90% (Moderado)</option>
                            <option value="0.80">80% (Difícil)</option>
                        </select>
                    </div>
                </div>
                <button onclick="closeModal('adminModal')" style="width: 100%; padding: 8px; background: #475569; color: white; border: none; border-radius: 6px; font-weight: bold;">Cerrar Panel</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('adminModal').style.display = 'flex';
}

function changeRTP() {
    const rtpSelect = document.getElementById('rtpMode');
    if (rtpSelect) {
        rtpSetting = parseFloat(rtpSelect.value);
        showToast(`⚙️ RTP actualizado al ${rtpSetting * 100}%`);
    }
}

// AUTENTICACIÓN Y VERIFICACIÓN POR CORREO (SIN CI, USANDO EMAIL)
let isRegistering = false, currentUser = null;
let pendingUserRegistration = null;
let generatedOTP = '';

function toggleAuthMode() {
    isRegistering = !isRegistering;
    const regFields = document.getElementById('registerFields');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('switchText');
    const authEmailInput = document.getElementById('authEmail');

    if (regFields) regFields.style.display = isRegistering ? 'flex' : 'none';
    if (authEmailInput) authEmailInput.style.display = isRegistering ? 'none' : 'block';
    if (authTitle) authTitle.textContent = isRegistering ? '✈️ Aviator Cuba - Registro' : '✈️ Aviator Cuba - Login';
    if (authBtn) authBtn.textContent = isRegistering ? 'Crear Cuenta y Verificar' : 'Iniciar Sesión';
    if (switchText) switchText.textContent = isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Regístrate aquí';
}

function handleAuth() {
    initAudio();
    let users = JSON.parse(localStorage.getItem('aviator_users') || '{}');

    if (isRegistering) {
        const nameInput = document.getElementById('regName');
        const emailInput = document.getElementById('regEmail');
        const phoneInput = document.getElementById('regPhone');
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (!name || !email || !phone) {
            alert('Por favor, completa todos los campos de registro (Nombre, Correo y Teléfono).');
            return;
        }

        if (users[email]) {
            alert('Este correo ya está registrado. Inicia sesión directamente.');
            isRegistering = false;
            toggleAuthMode();
            return;
        }

        // Generar código OTP de 6 dígitos
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        pendingUserRegistration = {
            name: name,
            email: email,
            phone: phone,
            pageId: 'CUB-' + Math.floor(100000 + Math.random() * 900000),
            balance: 100.00
        };

        showToast('📧 Enviando código a tu correo...');

        // Envío con EmailJS (Service ID: service_mz65zri, Template ID: template_9sgqbge)
        emailjs.send("service_mz65zri", "template_9sgqbge", {
            to_email: email,
            to_name: name,
            otp_code: generatedOTP
        }).then((response) => {
            console.log('Correo enviado con éxito!', response.status, response.text);
            showToast('✅ ¡Código enviado! Revisa tu bandeja de entrada.');
            document.getElementById('otpModal').style.display = 'flex';
        }, (error) => {
            console.log('Error al enviar correo:', error);
            alert('No se pudo enviar el correo automático. Tu código de verificación es: ' + generatedOTP);
            document.getElementById('otpModal').style.display = 'flex';
        });

        return;
    }

    // Modo Login con Correo
    const emailInput = document.getElementById('authEmail');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    if (!email) {
        alert('Por favor, introduce tu correo electrónico.');
        return;
    }

    if (!users[email]) {
        alert('Correo no encontrado. Regístrate primero.');
        return;
    }

    currentUser = users[email];
    localStorage.setItem('aviator_current_user', JSON.stringify(currentUser));
    loadUserSession();
}

function verifyOTPCode() {
    const userEntered = document.getElementById('otpInputCode').value.trim();
    
    if (userEntered === generatedOTP) {
        let users = JSON.parse(localStorage.getItem('aviator_users') || '{}');
        users[pendingUserRegistration.email] = pendingUserRegistration;
        localStorage.setItem('aviator_users', JSON.stringify(users));

        currentUser = pendingUserRegistration;
        localStorage.setItem('aviator_current_user', JSON.stringify(currentUser));
        
        closeModal('otpModal');
        alert('¡Correo verificado con éxito! Bienvenid@ a Aviator Cuba.');
        loadUserSession();
    } else {
        alert('Código incorrecto. Inténtalo de nuevo.');
    }
}

function updateProfileUI() {
    if (!currentUser) return;
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
    const initEl1 = document.getElementById('profileInitials');
    const initEl2 = document.getElementById('profileInitialsLarge');
    if (initEl1) initEl1.textContent = initial;
    if (initEl2) initEl2.textContent = initial;

    const profName = document.getElementById('profName');
    const profId = document.getElementById('profId');
    const profEmail = document.getElementById('profEmail');
    const profPhone = document.getElementById('profPhone');
    const profBalance = document.getElementById('profBalance');

    if (profName) profName.textContent = currentUser.name;
    if (profId) profId.textContent = `ID: ${currentUser.pageId}`;
    if (profEmail) profEmail.textContent = currentUser.email || 'No registrado';
    if (profPhone) profPhone.textContent = currentUser.phone;
    if (profBalance) profBalance.textContent = `$${currentUser.balance.toFixed(2)}`;
}

function openProfileModal() {
    updateProfileUI();
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'flex';
}

function openCubaDepositModalFromProfile() {
    closeModal('profileModal');
    openCubaDepositModal();
}

function openWithdrawModalFromProfile() {
    closeModal('profileModal');
    openWithdrawModal();
}

function loadUserSession() {
    const saved = localStorage.getItem('aviator_current_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        
        const authScreen = document.getElementById('authScreen');
        const gameScreen = document.getElementById('gameScreen');
        if (authScreen) authScreen.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'block';

        const balanceEl = document.getElementById('balance');
        if (balanceEl) balanceEl.textContent = currentUser.balance.toFixed(2);
        
        updateProfileUI();
        resizeCanvas(); 
        startBgMusic(); 
        initChatSimulation();

        if (!roundActive && !isPlaying && !isWaitingPeriod) {
            startCountDown();
        }
    }
}

function resetDemoBalance() {
    if (!currentUser) return;
    currentUser.balance = 100.00;
    saveUserBalance();
    triggerHaptic('short');
    alert('¡Saldo Demo reiniciado a $100.00!');
}

function logout() {
    localStorage.removeItem('aviator_current_user');
    currentUser = null;
    if (bgMusicInterval) clearInterval(bgMusicInterval);
    const gameScreen = document.getElementById('gameScreen');
    const authScreen = document.getElementById('authScreen');
    if (gameScreen) gameScreen.style.display = 'none';
    if (authScreen) authScreen.style.display = 'flex';
}

function saveUserBalance() {
    if (!currentUser) return;
    let users = JSON.parse(localStorage.getItem('aviator_users') || '{}');
    users[currentUser.email] = currentUser;
    localStorage.setItem('aviator_users', JSON.stringify(users));
    localStorage.setItem('aviator_current_user', JSON.stringify(currentUser));
    const balanceEl = document.getElementById('balance');
    if (balanceEl) balanceEl.textContent = currentUser.balance.toFixed(2);
    updateProfileUI();
}

window.addEventListener('load', () => { 
    if (localStorage.getItem('aviator_current_user')) {
        loadUserSession(); 
    }
});

document.addEventListener('click', () => { initAudio(); }, { once: true });

let currentMultiplier = 1.00, crashMultiplier = 1.00, isPlaying = false, roundActive = false, isWaitingPeriod = false;
let animationFrame = null, startTime = 0, rtpSetting = 0.97;
let bet1 = { active: false, cashed: false, queued: false, amount: 0 };
let bet2 = { active: false, cashed: false, queued: false, amount: 0 };

const multDisplay = document.getElementById('multDisplay'), statusDisplay = document.getElementById('statusDisplay');
const btn1 = document.getElementById('btn1'), btn2 = document.getElementById('btn2');
const bet1Input = document.getElementById('bet1Amount'), bet2Input = document.getElementById('bet2Amount');
const auto1Input = document.getElementById('auto1'), auto2Input = document.getElementById('auto2');
const historyContainer = document.getElementById('history'), canvas = document.getElementById('canvas'), ctx = canvas ? canvas.getContext('2d') : null;
const floatingAvatar = document.getElementById('floatingAvatar');

function resizeCanvas() { 
    if (canvas && canvas.parentElement) { 
        canvas.width = canvas.parentElement.clientWidth; 
        canvas.height = canvas.parentElement.clientHeight; 
    } 
}
window.addEventListener('resize', resizeCanvas);

function generateCrashPoint() {
    const e = Math.random();
    if (e < (1 - rtpSetting)) return 1.00;
    return Math.max(1.00, Math.floor((rtpSetting / (1 - e)) * 100) / 100);
}

function drawGraph(progress) {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const padding = 20, startX = padding, startY = canvas.height - padding;
    const endX = startX + (canvas.width - padding * 2) * Math.min(progress, 1);
    const endY = startY - (canvas.height - padding * 2) * Math.min(progress, 1);

    ctx.beginPath(); ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.strokeStyle = (bet1.cashed || bet2.cashed) ? '#00ff88' : '#ff334b'; ctx.lineWidth = 4; ctx.stroke();

    ctx.lineTo(endX, startY); ctx.lineTo(startX, startY);
    ctx.fillStyle = (bet1.cashed || bet2.cashed) ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 51, 75, 0.12)'; ctx.fill();

    if (roundActive && floatingAvatar) {
        floatingAvatar.style.display = 'block';
        floatingAvatar.style.left = endX + 'px'; floatingAvatar.style.top = endY + 'px';
        floatingAvatar.src = (bet1.cashed || bet2.cashed) ? 'win-icon.png' : 'icon-256.png';
        createParticles(endX - 10, endY + 10, 2);
    } else if (floatingAvatar) {
        floatingAvatar.style.display = 'none';
    }

    updateAndDrawParticles(ctx);
}

function handleBet(id) {
    initAudio(); 
    triggerHaptic('short');
    
    const input = id === 1 ? bet1Input : bet2Input;
    const btn = id === 1 ? btn1 : btn2;
    const bObj = id === 1 ? bet1 : bet2;

    if (isWaitingPeriod && !bObj.active && !bObj.queued) {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0 || val > currentUser.balance) return alert('Saldo insuficiente o monto inválido.');
        
        bObj.amount = val;
        bObj.active = true;
        bObj.cashed = false;
        bObj.queued = false;
        
        currentUser.balance -= val;
        saveUserBalance();

        if (btn) {
            btn.textContent = 'APUESTA REGISTRADA';
            btn.className = 'btn-action btn-disabled';
        }
        if (input) input.disabled = true;
    } 
    else if (roundActive && !bObj.active && !bObj.queued) {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0 || val > currentUser.balance) return alert('Saldo insuficiente o monto inválido.');
        
        bObj.amount = val;
        bObj.queued = true;
        bObj.active = false;
        bObj.cashed = false;
        
        currentUser.balance -= val;
        saveUserBalance();

        if (btn) {
            btn.textContent = 'EN ESPERA (PRÓX. RONDA)';
            btn.className = 'btn-action btn-queued';
        }
        if (input) input.disabled = true;
    } 
    else if (roundActive && bObj.active && !bObj.cashed) {
        cashOut(id);
    }
}

function startCountDown() {
    isWaitingPeriod = true; 
    let timeLeft = 5;
    
    if (statusDisplay) {
        statusDisplay.textContent = `Siguiente ronda en ${timeLeft}s...`; 
        statusDisplay.className = 'status-text waiting';
    }
    if (multDisplay) {
        multDisplay.className = 'mult-text flying'; 
        multDisplay.textContent = '1.00x';
    }

    [bet1, bet2].forEach((b, i) => {
        const btn = i === 0 ? btn1 : btn2;
        const input = i === 0 ? bet1Input : bet2Input;
        
        if (b.queued) {
            b.active = true; 
            b.queued = false; 
            b.cashed = false;
            
            if (btn) {
                btn.textContent = 'APUESTA REGISTRADA'; 
                btn.className = 'btn-action btn-disabled';
            }
            if (input) input.disabled = true;
        }
    });

    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            if (statusDisplay) statusDisplay.textContent = `Siguiente ronda en ${timeLeft}s...`;
        } else { 
            clearInterval(countdownInterval); 
            isWaitingPeriod = false; 
            startGlobalGame(); 
        }
    }, 1000);
}

function startGlobalGame() {
    roundActive = true; isPlaying = true; currentMultiplier = 1.00; crashMultiplier = generateCrashPoint(); startTime = 0;
    generateLiveBets();
    playStartSFX(); 
    if (statusDisplay) {
        statusDisplay.textContent = '¡En vuelo!'; 
        statusDisplay.className = 'status-text flying';
    }

    if (bet1.active && btn1) { 
        btn1.textContent = 'COBRAR'; 
        btn1.className = 'btn-action btn-cash-1'; 
    } else if (!bet1.queued && btn1 && bet1Input) { 
        btn1.textContent = 'APOSTAR (PROX. RONDA)'; 
        btn1.className = 'btn-action btn-bet-1'; 
        bet1Input.disabled = false; 
    }

    if (bet2.active && btn2) { 
        btn2.textContent = 'COBRAR'; 
        btn2.className = 'btn-action btn-cash-2'; 
    } else if (!bet2.queued && btn2 && bet2Input) { 
        btn2.textContent = 'APOSTAR (PROX. RONDA)'; 
        btn2.className = 'btn-action btn-bet-2'; 
        bet2Input.disabled = false; 
    }

    animationFrame = requestAnimationFrame(gameLoop);
}

function cashOut(id) {
    const bObj = id === 1 ? bet1 : bet2, btn = id === 1 ? btn1 : btn2;
    if (!roundActive || !bObj.active || bObj.cashed) return;
    bObj.cashed = true; bObj.active = false;
    const winAmount = bObj.amount * currentMultiplier;
    currentUser.balance += winAmount; saveUserBalance(); playWinSFX();

    myPersonalBets.push({ amount: bObj.amount, mult: currentMultiplier, cashed: true, profit: winAmount - bObj.amount });
    renderMyBets();
    checkAchievements(bObj.amount, currentMultiplier, true);

    if (btn) {
        btn.textContent = `¡GANADO $${winAmount.toFixed(1)}!`; 
        btn.className = 'btn-action btn-disabled';
    }
    if (statusDisplay) {
        statusDisplay.textContent = `¡Apuesta ${id} cobrada en ${currentMultiplier.toFixed(2)}x!`; 
        statusDisplay.className = 'status-text cashed';
    }
}

function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    currentMultiplier = Math.floor((1.00 + Math.pow(elapsed, 1.8) * 0.15) * 100) / 100;

    updateLiveBets(currentMultiplier);

    const auto1 = auto1Input ? parseFloat(auto1Input.value) : 0;
    const auto2 = auto2Input ? parseFloat(auto2Input.value) : 0;
    if (bet1.active && !bet1.cashed && auto1 && currentMultiplier >= auto1) cashOut(1);
    if (bet2.active && !bet2.cashed && auto2 && currentMultiplier >= auto2) cashOut(2);

    if (currentMultiplier >= crashMultiplier) { endGame(elapsed); return; }
    if (multDisplay) multDisplay.textContent = currentMultiplier.toFixed(2) + 'x'; 
    drawGraph(elapsed / 8);
    animationFrame = requestAnimationFrame(gameLoop);
}

function endGame(elapsed) {
    roundActive = false; isPlaying = false; cancelAnimationFrame(animationFrame);
    const width = canvas ? canvas.width : 300;
    const height = canvas ? canvas.height : 200;
    const endX = 20 + (width - 40) * Math.min(elapsed / 8, 1);
    const endY = (height - 20) - (height - 40) * Math.min(elapsed / 8, 1);
    createParticles(endX, endY, 15, true);

    const playerLost = (bet1.active && !bet1.cashed) || (bet2.active && !bet2.cashed);
    if (playerLost) {
        if (bet1.active && !bet1.cashed) { myPersonalBets.push({ amount: bet1.amount, mult: 0, cashed: false, profit: 0 }); }
        if (bet2.active && !bet2.cashed) { myPersonalBets.push({ amount: bet2.amount, mult: 0, cashed: false, profit: 0 }); }
        renderMyBets();
        playCrashSFX();
    }

    if (multDisplay) {
        multDisplay.textContent = crashMultiplier.toFixed(2) + 'x'; 
        multDisplay.className = 'mult-text crashed';
    }
    if (statusDisplay) {
        statusDisplay.textContent = '¡FLEW AWAY (CRASH)!'; 
        statusDisplay.className = 'status-text crashed';
    }

    if (bet1.active && !bet1.cashed && btn1) { btn1.textContent = 'PERDIDO'; btn1.className = 'btn-action btn-disabled'; }
    if (bet2.active && !bet2.cashed && btn2) { btn2.textContent = 'PERDIDO'; btn2.className = 'btn-action btn-disabled'; }

    if (crashMultiplier >= 10) addChatMessage('SYSTEM', `🔥 ¡MULTIPLICADOR ALTO! El avión alcanzó los ${crashMultiplier.toFixed(2)}x`);
    addHistory(crashMultiplier);
    setTimeout(() => { resetRound(); startCountDown(); }, 2000);
}

function resetRound() {
    if (!bet1.queued && btn1 && bet1Input) { 
        bet1 = { active: false, cashed: false, queued: false, amount: 0 }; 
        btn1.textContent = 'APOSTAR 1'; 
        btn1.className = 'btn-action btn-bet-1'; 
        bet1Input.disabled = false; 
    }

    if (!bet2.queued && btn2 && bet2Input) { 
        bet2 = { active: false, cashed: false, queued: false, amount: 0 }; 
        btn2.textContent = 'APOSTAR 2'; 
        btn2.className = 'btn-action btn-bet-2'; 
        btn2Input.disabled = false; 
    }

    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height); 
    if (floatingAvatar) floatingAvatar.style.display = 'none';
}

function addHistory(mult) {
    if (!historyContainer) return;
    const item = document.createElement('div');
    item.className = 'history-item ' + (mult >= 10 ? 'win-high' : mult >= 2 ? 'win-low' : 'loss');
    item.textContent = mult.toFixed(2) + 'x';
    historyContainer.prepend(item);
    if (historyContainer.children.length > 8) historyContainer.removeChild(historyContainer.lastChild);
}

function openCubaDepositModal() { 
    const m = document.getElementById('cubaDepositModal');
    if (m) m.style.display = 'flex'; 
}

function openWithdrawModal() { 
    const m = document.getElementById('withdrawModal');
    if (m) m.style.display = 'flex'; 
}

function closeModal(id) { 
    const m = document.getElementById(id);
    if (m) m.style.display = 'none'; 
}

function processSmsDeposit() {
    const smsInput = document.getElementById('smsText');
    const smsText = smsInput ? smsInput.value : '';
    if (!smsText.trim()) return alert('Pega el SMS bancario.');
    const creditsToAdd = 100; 
    currentUser.balance += creditsToAdd; 
    saveUserBalance();
    alert(`¡Depósito Demo de +$${creditsToAdd} validado para ${currentUser.name}!`);
    if (smsInput) smsInput.value = ''; 
    closeModal('cubaDepositModal');
}

function submitWithdraw() {
    const cardInput = document.getElementById('withdrawCard');
    const amountInput = document.getElementById('withdrawAmount');
    const card = cardInput ? cardInput.value.trim() : '';
    const amount = amountInput ? parseFloat(amountInput.value) : 0;

    if (card.length < 15 || isNaN(amount) || amount > currentUser.balance || amount <= 0) return alert('Datos de tarjeta o monto inválidos.');
    currentUser.balance -= amount; 
    saveUserBalance();
    alert(`Retiro Demo enviado por $${amount.toFixed(2)}.`); 
    closeModal('withdrawModal');
}
