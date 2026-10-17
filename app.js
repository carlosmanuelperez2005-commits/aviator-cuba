// SINTETIZADOR AUDIO & HÁPTICA
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

// SISTEMA DE PARTÍCULAS CANVAS
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

// APUESTAS EN VIVO DE OTROS JUGADORES (SIMULADOS)
let liveBets = [];

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

// CHAT SIMULADO
const fakeAuthors = ['CUB-382910', 'CUB-910283', 'CUB-120938', 'CUB-772819', 'CUB-549102'];
const fakeMessages = ["¡Asere, ese avión voló sabroso!", "Cobré a 2.50x, algo es algo 😂", "Aseguren ganancias mi gente 🔥", "¡Pura candela hoy el Aviator!"];

function initChatSimulation() {
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

// AUTENTICACIÓN Y SESIÓN
let isRegistering = false, currentUser = null;

function toggleAuthMode() {
    isRegistering = !isRegistering;
    document.getElementById('registerFields').style.display = isRegistering ? 'flex' : 'none';
    document.getElementById('authTitle').textContent = isRegistering ? '✈️ Aviator Cuba - Registro' : '✈️ Aviator Cuba - Login';
    document.getElementById('authSubmitBtn').textContent = isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión';
    document.getElementById('switchText').textContent = isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Regístrate aquí';
}

function handleAuth() {
    initAudio();
    const ci = document.getElementById('authCI').value.trim();
    if (ci.length !== 11) return alert('CI de 11 dígitos inválido.');
    let users = JSON.parse(localStorage.getItem('aviator_users') || '{}');

    if (isRegistering) {
        const name = document.getElementById('regName').value.trim(), phone = document.getElementById('regPhone').value.trim();
        if (!name || !phone) return alert('Completa todos los campos.');
        if (users[ci]) return alert('El CI ya existe.');
        users[ci] = { name, ci, phone, pageId: 'CUB-' + Math.floor(100000 + Math.random() * 900000), balance: 100.00 };
        localStorage.setItem('aviator_users', JSON.stringify(users));
    }

    if (!users[ci]) return alert('Usuario no encontrado.');
    currentUser = users[ci];
    localStorage.setItem('aviator_current_user', JSON.stringify(currentUser));
    loadUserSession();
}

function loadUserSession() {
    const saved = localStorage.getItem('aviator_current_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        document.getElementById('balance').textContent = currentUser.balance.toFixed(2);
        document.getElementById('userIdTag').textContent = `ID: ${currentUser.pageId} | ${currentUser.name}`;
        resizeCanvas(); startBgMusic(); initChatSimulation();
        if (!roundActive && !isPlaying && !isWaitingPeriod) startCountDown();
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
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
}

function saveUserBalance() {
    if (!currentUser) return;
    let users = JSON.parse(localStorage.getItem('aviator_users') || '{}');
    users[currentUser.ci] = currentUser;
    localStorage.setItem('aviator_users', JSON.stringify(users));
    localStorage.setItem('aviator_current_user', JSON.stringify(currentUser));
    document.getElementById('balance').textContent = currentUser.balance.toFixed(2);
}

window.addEventListener('load', () => { if (localStorage.getItem('aviator_current_user')) loadUserSession(); });
document.addEventListener('click', () => { initAudio(); }, { once: true });

// LÓGICA DE RONDA Y RENDER CANVAS
let currentMultiplier = 1.00, crashMultiplier = 1.00, isPlaying = false, roundActive = false, isWaitingPeriod = false;
let animationFrame = null, startTime = 0, rtpSetting = 0.97;
let casinoStats = { reserve: 1000.00, profit: 0.00, totalDeposited: 0.00, totalWithdrawn: 0.00 }, pendingWithdraws = [];
let bet1 = { active: false, cashed: false, queued: false, amount: 0 };
let bet2 = { active: false, cashed: false, queued: false, amount: 0 };

const multDisplay = document.getElementById('multDisplay'), statusDisplay = document.getElementById('statusDisplay');
const btn1 = document.getElementById('btn1'), btn2 = document.getElementById('btn2');
const bet1Input = document.getElementById('bet1Amount'), bet2Input = document.getElementById('bet2Amount');
const auto1Input = document.getElementById('auto1'), auto2Input = document.getElementById('auto2');
const historyContainer = document.getElementById('history'), canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
const floatingAvatar = document.getElementById('floatingAvatar');

function resizeCanvas() { if (canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; } }
window.addEventListener('resize', resizeCanvas);

function generateCrashPoint() {
    const e = Math.random();
    if (e < (1 - rtpSetting)) return 1.00;
    return Math.max(1.00, Math.floor((rtpSetting / (1 - e)) * 100) / 100);
}

function drawGraph(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const padding = 20, startX = padding, startY = canvas.height - padding;
    const endX = startX + (canvas.width - padding * 2) * Math.min(progress, 1);
    const endY = startY - (canvas.height - padding * 2) * Math.min(progress, 1);

    ctx.beginPath(); ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.strokeStyle = (bet1.cashed || bet2.cashed) ? '#00ff88' : '#ff334b'; ctx.lineWidth = 4; ctx.stroke();

    ctx.lineTo(endX, startY); ctx.lineTo(startX, startY);
    ctx.fillStyle = (bet1.cashed || bet2.cashed) ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 51, 75, 0.12)'; ctx.fill();

    if (roundActive) {
        floatingAvatar.style.display = 'block';
        floatingAvatar.style.left = endX + 'px'; floatingAvatar.style.top = endY + 'px';
        floatingAvatar.src = (bet1.cashed || bet2.cashed) ? 'win-icon.png' : 'icon-256.png';
        createParticles(endX - 10, endY + 10, 2);
    } else floatingAvatar.style.display = 'none';

    updateAndDrawParticles(ctx);
}

function handleBet(id) {
    initAudio(); triggerHaptic('short');
    const input = id === 1 ? bet1Input : bet2Input, btn = id === 1 ? btn1 : btn2, bObj = id === 1 ? bet1 : bet2;

    if (isWaitingPeriod && !bObj.active) {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0 || val > currentUser.balance) return alert('Saldo insuficiente.');
        bObj.amount = val; bObj.active = true; bObj.cashed = false; bObj.queued = false;
        currentUser.balance -= val; saveUserBalance(); casinoStats.profit += val;
        btn.textContent = 'REGISTRADO'; btn.className = 'btn-action btn-disabled'; input.disabled = true;
    } else if (roundActive && !bObj.active && !bObj.queued) {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0 || val > currentUser.balance) return alert('Saldo insuficiente.');
        bObj.amount = val; bObj.queued = true;
        currentUser.balance -= val; saveUserBalance();
        btn.textContent = 'EN ESPERA'; btn.className = 'btn-action btn-queued'; input.disabled = true;
    } else if (roundActive && bObj.active && !bObj.cashed) cashOut(id);
}

function startCountDown() {
    isWaitingPeriod = true; let timeLeft = 5;
    statusDisplay.textContent = `Siguiente ronda en ${timeLeft}s...`; statusDisplay.className = 'status-text waiting';
    multDisplay.className = 'mult-text flying'; multDisplay.textContent = '1.00x';

    [bet1, bet2].forEach((b, i) => {
        if (b.queued) {
            b.active = true; b.queued = false; b.cashed = false;
            const btn = i === 0 ? btn1 : btn2; btn.textContent = 'REGISTRADO'; btn.className = 'btn-action btn-disabled';
            casinoStats.profit += b.amount;
        }
    });

    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) statusDisplay.textContent = `Siguiente ronda en ${timeLeft}s...`;
        else { clearInterval(countdownInterval); isWaitingPeriod = false; startGlobalGame(); }
    }, 1000);
}

function startGlobalGame() {
    roundActive = true; isPlaying = true; currentMultiplier = 1.00; crashMultiplier = generateCrashPoint(); startTime = 0;
    
    generateLiveBets(); // <--- Generar la lista de apuestas de los demás jugadores al despegar

    playStartSFX(); statusDisplay.textContent = '¡En vuelo!'; multDisplay.className = 'mult-text flying';

    if (bet1.active) { btn1.textContent = 'COBRAR'; btn1.className = 'btn-action btn-cash-1'; }
    else if (!bet1.queued) { btn1.textContent = 'APOSTAR (PROX. RONDA)'; btn1.className = 'btn-action btn-bet-1'; bet1Input.disabled = false; }

    if (bet2.active) { btn2.textContent = 'COBRAR'; btn2.className = 'btn-action btn-cash-2'; }
    else if (!bet2.queued) { btn2.textContent = 'APOSTAR (PROX. RONDA)'; btn2.className = 'btn-action btn-bet-2'; bet2Input.disabled = false; }

    animationFrame = requestAnimationFrame(gameLoop);
}

function cashOut(id) {
    const bObj = id === 1 ? bet1 : bet2, btn = id === 1 ? btn1 : btn2;
    if (!roundActive || !bObj.active || bObj.cashed) return;
    bObj.cashed = true; bObj.active = false;
    const winAmount = bObj.amount * currentMultiplier;
    currentUser.balance += winAmount; saveUserBalance(); playWinSFX();
    casinoStats.profit -= (winAmount - bObj.amount);
    btn.textContent = `¡GANADO $${winAmount.toFixed(1)}!`; btn.className = 'btn-action btn-disabled';
    statusDisplay.textContent = `¡Apuesta ${id} cobrada en ${currentMultiplier.toFixed(2)}x!`; statusDisplay.className = 'status-text cashed';
}

function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    currentMultiplier = Math.floor((1.00 + Math.pow(elapsed, 1.8) * 0.15) * 100) / 100;

    updateLiveBets(currentMultiplier); // <--- Actualizar ganancias de los demás jugadores en vivo durante el vuelo

    const auto1 = parseFloat(auto1Input.value), auto2 = parseFloat(auto2Input.value);
    if (bet1.active && !bet1.cashed && auto1 && currentMultiplier >= auto1) cashOut(1);
    if (bet2.active && !bet2.cashed && auto2 && currentMultiplier >= auto2) cashOut(2);

    if (currentMultiplier >= crashMultiplier) { endGame(elapsed); return; }
    multDisplay.textContent = currentMultiplier.toFixed(2) + 'x'; drawGraph(elapsed / 8);
    animationFrame = requestAnimationFrame(gameLoop);
}

function endGame(elapsed) {
    roundActive = false; isPlaying = false; cancelAnimationFrame(animationFrame);
    const endX = 20 + (canvas.width - 40) * Math.min(elapsed / 8, 1);
    const endY = (canvas.height - 20) - (canvas.height - 40) * Math.min(elapsed / 8, 1);
    createParticles(endX, endY, 15, true);

    const playerLost = (bet1.active && !bet1.cashed) || (bet2.active && !bet2.cashed);
    if (playerLost) playCrashSFX();

    multDisplay.textContent = crashMultiplier.toFixed(2) + 'x'; multDisplay.className = 'mult-text crashed';
    statusDisplay.textContent = '¡FLEW AWAY (CRASH)!'; statusDisplay.className = 'status-text crashed';

    if (bet1.active && !bet1.cashed) { btn1.textContent = 'PERDIDO'; btn1.className = 'btn-action btn-disabled'; }
    if (bet2.active && !bet2.cashed) { btn2.textContent = 'PERDIDO'; btn2.className = 'btn-action btn-disabled'; }

    if (crashMultiplier >= 10) addChatMessage('SYSTEM', `🔥 ¡MULTIPLICADOR ALTO! El avión alcanzó los ${crashMultiplier.toFixed(2)}x`);
    addHistory(crashMultiplier);
    setTimeout(() => { resetRound(); startCountDown(); }, 2000);
}

function resetRound() {
    if (!bet1.queued) { bet1 = { active: false, cashed: false, queued: false, amount: 0 }; btn1.textContent = 'APOSTAR 1'; btn1.className = 'btn-action btn-bet-1'; bet1Input.disabled = false; }
    if (!bet2.queued) { bet2 = { active: false, cashed: false, queued: false, amount: 0 }; btn2.textContent = 'APOSTAR 2'; btn2.className = 'btn-action btn-bet-2'; bet2Input.disabled = false; }
    ctx.clearRect(0, 0, canvas.width, canvas.height); floatingAvatar.style.display = 'none';
}

function addHistory(mult) {
    const item = document.createElement('div');
    item.className = 'history-item ' + (mult >= 10 ? 'win-high' : mult >= 2 ? 'win-low' : 'loss');
    item.textContent = mult.toFixed(2) + 'x';
    historyContainer.prepend(item);
    if (historyContainer.children.length > 8) historyContainer.removeChild(historyContainer.lastChild);
}

function openCubaDepositModal() { document.getElementById('cubaDepositModal').style.display = 'flex'; }
function openWithdrawModal() { document.getElementById('withdrawModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function processSmsDeposit() {
    const smsText = document.getElementById('smsText').value;
    if (!smsText.trim()) return alert('Pega el SMS bancario.');
    const creditsToAdd = 100; currentUser.balance += creditsToAdd; saveUserBalance();
    alert(`¡Depósito Demo de +$${creditsToAdd} validado para ${currentUser.name}!`);
    document.getElementById('smsText').value = ''; closeModal('cubaDepositModal');
}

function submitWithdraw() {
    const card = document.getElementById('withdrawCard').value.trim(), amount = parseFloat(document.getElementById('withdrawAmount').value);
    if (card.length < 15 || isNaN(amount) || amount > currentUser.balance || amount <= 0) return alert('Datos inválidos.');
    currentUser.balance -= amount; saveUserBalance();
    alert(`Retiro Demo enviado por $${amount.toFixed(2)}.`); closeModal('withdrawModal');
}

let clickCount = 0, clickTimer = null;
function triggerAdminAccess() {
    clickCount++;
    if (clickCount === 1) clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
    else if (clickCount >= 5) {
        clearTimeout(clickTimer); clickCount = 0;
        if (prompt("PIN Admin:") === "1234") openAdminPanel();
    }
}

function openAdminPanel() {
    document.getElementById('admReserve').textContent = `$${casinoStats.reserve.toFixed(2)}`;
    document.getElementById('admProfit').textContent = `$${casinoStats.profit.toFixed(2)}`;
    document.getElementById('admDeposits').textContent = `$${casinoStats.totalDeposited.toFixed(2)}`;
    document.getElementById('admWithdraws').textContent = `$${casinoStats.totalWithdrawn.toFixed(2)}`;
    document.getElementById('adminModal').style.display = 'flex';
}

function changeRTP() { rtpSetting = parseFloat(document.getElementById('rtpMode').value); }
