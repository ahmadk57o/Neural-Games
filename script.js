

'use strict';


function getUsers()    { return JSON.parse(localStorage.getItem('ng_users')    || '[]'); }
function saveUsers(u)  { localStorage.setItem('ng_users', JSON.stringify(u)); }
function getHistory()  { return JSON.parse(localStorage.getItem('ng_history_' + currentUserEmail) || '[]'); }
function saveHistory(h){ localStorage.setItem('ng_history_' + currentUserEmail, JSON.stringify(h)); }
function getAllScores() { return JSON.parse(localStorage.getItem('ng_scores') || '{}'); }

function saveScore(game, score) {
  const all = getAllScores();
  const key = currentUserEmail;
  if (!all[key]) all[key] = { name: currentUserName, wordDraw:0, handSnake:0 };
  if (score > all[key][game]) all[key][game] = score;
  localStorage.setItem('ng_scores', JSON.stringify(all));
}

let currentUserEmail = null;
let currentUserName  = null;


function doSignUp() {
  const first   = document.getElementById('su-first').value.trim();
  const last    = document.getElementById('su-last').value.trim();
  const email   = document.getElementById('su-email').value.trim().toLowerCase();
  const pass    = document.getElementById('su-pass').value;
  const confirm = document.getElementById('su-confirm').value;
  const errEl   = document.getElementById('su-error');

  errEl.textContent = '';
  if (!first || !last)              return errEl.textContent = '❌ Enter first and last name.';
  if (!email || !email.includes('@')) return errEl.textContent = '❌ Enter a valid email.';
  if (pass.length < 6)             return errEl.textContent = '❌ Password must be at least 6 characters.';
  if (pass !== confirm)            return errEl.textContent = '❌ Passwords do not match.';

  const users = getUsers();
  if (users.find(u => u.email === email)) return errEl.textContent = '❌ Email already registered.';

  users.push({ first, last, email, pass });
  saveUsers(users);

  
  loginUser(email, first + ' ' + last);
}


function doSignIn() {
  const email = document.getElementById('si-email').value.trim().toLowerCase();
  const pass  = document.getElementById('si-pass').value;
  const errEl = document.getElementById('si-error');

  errEl.textContent = '';
  if (!email || !pass) return errEl.textContent = '❌ Enter email and password.';

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.pass === pass);
  if (!user) return errEl.textContent = '❌ Wrong email or password.';

  loginUser(email, user.first + ' ' + user.last);
}

function loginUser(email, name) {
  currentUserEmail = email;
  currentUserName  = name;

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('nav-name').textContent   = name;
  document.getElementById('dash-greeting').textContent =
    `Welcome back, ${name.split(' ')[0]}! Ready to play with your hands?`;

  document.getElementById('auth-page').classList.remove('active');
  document.getElementById('main-page').classList.add('active');

  renderDashboard();
}

function doLogout() {
  closeModal();
  currentUserEmail = null;
  currentUserName  = null;
  document.getElementById('main-page').classList.remove('active');
  document.getElementById('auth-page').classList.add('active');
  ['si-email','si-pass'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('si-error').textContent = '';
}

function switchTab(tab) {
  document.getElementById('tab-signin').className  = 'auth-tab' + (tab==='signin'?' active':'');
  document.getElementById('tab-signup').className  = 'auth-tab' + (tab==='signup'?' active':'');
  document.getElementById('form-signin').className = 'auth-form' + (tab==='signin'?' active':'');
  document.getElementById('form-signup').className = 'auth-form' + (tab==='signup'?' active':'');
}


['si-email','si-pass'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => { if(e.key==='Enter') doSignIn(); });
});


function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'leaderboard') renderLeaderboard();
}


function renderDashboard() {
  const hist = getHistory();
  const played = hist.length;
  const wins   = hist.filter(h => h.result === 'win').length;
  const wr     = played > 0 ? Math.round(wins / played * 100) : 0;
  const hs     = played > 0 ? Math.max(...hist.map(h => h.score)) : 0;

  document.getElementById('stat-played').textContent = played;
  document.getElementById('stat-wins').textContent   = wins;
  document.getElementById('stat-wr').textContent     = wr + '%';
  document.getElementById('stat-hs').textContent     = hs.toLocaleString();

  const tbody   = document.getElementById('history-body');
  const table   = document.getElementById('history-table');
  const empty   = document.getElementById('history-empty');

  if (hist.length === 0) {
    empty.style.display = 'block';
    table.style.display = 'none';
  } else {
    empty.style.display = 'none';
    table.style.display = 'table';
    tbody.innerHTML = hist.slice().reverse().slice(0,10).map(h => `
      <tr>
        <td>${h.game}</td>
        <td style="color:var(--text2)">${h.date}</td>
        <td style="font-family:Orbitron,monospace;color:var(--accent)">${h.score.toLocaleString()}</td>
        <td><span class="badge ${h.result}">${h.result.toUpperCase()}</span></td>
      </tr>`).join('');
  }
}

function addHistory(game, score, result) {
  const hist = getHistory();
  hist.push({
    game, score, result,
    date: new Date().toLocaleDateString()
  });
  saveHistory(hist);
  saveScore(game === 'Hand Word Draw' ? 'wordDraw' : 'handSnake', score);
  renderDashboard();
}


function renderLeaderboard() {
  const all = getAllScores();
  const players = Object.entries(all).map(([email, data]) => ({ email, ...data }));

  const rankCls = ['g1','g2','g3'];

  ['wordDraw','handSnake'].forEach((key, i) => {
    const id = i === 0 ? 'lb-worddraw' : 'lb-handsnake';
    const el = document.getElementById(id);
    const sorted = [...players].sort((a,b) => (b[key]||0) - (a[key]||0));

    if (sorted.length === 0 || sorted.every(p => !p[key])) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text2);font-size:14px">
        🎮 No scores yet — be the first to play!</div>`;
      return;
    }

    el.innerHTML = sorted.slice(0, 10).map((p, idx) => `
      <div class="lb-row">
        <div class="lb-rank ${rankCls[idx]||''}">#${idx+1}</div>
        <div class="lb-name">
          ${p.name || p.email}
          ${p.email === currentUserEmail ? `<span style="font-size:11px;color:var(--accent)"> [YOU]</span>` : ''}
        </div>
        <div class="lb-score">${(p[key]||0).toLocaleString()}</div>
      </div>`).join('');
  });
}


let activeGameCleanup = null;

function openGame(id) {
  document.getElementById('modal-overlay').classList.add('open');
  if (id === 'worddraw')  renderWordDrawGame();
  if (id === 'handsnake') renderHandSnakeGame();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  if (activeGameCleanup) { activeGameCleanup(); activeGameCleanup = null; }
  document.getElementById('modal-body').innerHTML = '';
}


function createHandTracker(videoEl, overlayCanvas, onResults) {
  let handsInstance = null;
  let cameraInstance = null;
  let stream = null;

  const ctx = overlayCanvas.getContext('2d');

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      });
      videoEl.srcObject = stream;
      await new Promise(r => { videoEl.onloadedmetadata = () => { videoEl.play(); r(); }; });

      overlayCanvas.width  = 480;
      overlayCanvas.height = 360;

      
      handsInstance = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      handsInstance.onResults(results => {
        ctx.clearRect(0, 0, 480, 360);
        if (results.multiHandLandmarks?.length) {
          drawConnectors(ctx, results.multiHandLandmarks[0], HAND_CONNECTIONS,
            { color: 'rgba(0,212,255,0.5)', lineWidth: 2 });
          drawLandmarks(ctx, results.multiHandLandmarks[0],
            { color: 'rgba(123,47,255,0.9)', lineWidth: 1, radius: 4 });
        }
        onResults(results);
      });

      cameraInstance = new Camera(videoEl, {
        onFrame: async () => { await handsInstance.send({ image: videoEl }); },
        width: 480, height: 360
      });
      cameraInstance.start();
      return true;
    } catch(e) {
      console.error('Camera error:', e);
      return false;
    }
  }

  function stop() {
    cameraInstance?.stop();
    handsInstance?.close();
    if (stream) stream.getTracks().forEach(t => t.stop());
  }

  return { start, stop };
}


function getIndexTip(landmarks, canvasW, canvasH) {
  const tip = landmarks[8]; 
  return {
    x: (1 - tip.x) * canvasW,
    y: tip.y * canvasH
  };
}


function detectHandDirection(landmarks) {
  const wrist  = landmarks[0];
  const middle = landmarks[9]; 
  const dx = middle.x - wrist.x;
  const dy = middle.y - wrist.y;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 0.08 && ady < 0.08) return null; 
  if (ady > adx) return dy < 0 ? 'UP' : 'DOWN';
  return dx < 0 ? 'RIGHT' : 'LEFT'; 
}


function countFingers(lm) {
  const tips = [8,12,16,20];
  const pips = [6,10,14,18];
  let count = 0;
  tips.forEach((tip, i) => { if (lm[tip].y < lm[pips[i]].y) count++; });
  return count;
}


function renderWordDrawGame() {
  const body = document.getElementById('modal-body');

  const WORDS = [
    { word:'CIRCLE',   hint:'Draw a round loop' },
    { word:'STAR',     hint:'Draw a 5-pointed star' },
    { word:'WAVE',     hint:'Draw a wavy line' },
    { word:'ZIGZAG',   hint:'Draw Z-shape sharp lines' },
    { word:'HEART',    hint:'Draw a heart shape' },
    { word:'TRIANGLE', hint:'Draw 3 sides' },
    { word:'CROSS',    hint:'Draw a + sign' },
    { word:'SPIRAL',   hint:'Draw a spiral inward' },
    { word:'ARROW',    hint:'Draw an arrow →' },
    { word:'INFINITY', hint:'Draw ∞ figure-eight' },
  ];

  let score = 0, round = 0, totalRounds = 5, timerInterval = null;
  let timeLeft = 15, drawing = false;
  let lastFX = null, lastFY = null;
  let currentWord = null;
  let tracker = null;
  let gameRunning = false;

  body.innerHTML = `
    <div class="game-modal-title">✋ HAND WORD DRAW</div>
    <div class="game-modal-sub">INDEX FINGER = PEN · DRAW THE WORD SHOWN · ${totalRounds} ROUNDS</div>
    <div class="game-status-bar">
      <div class="gs-item"><div class="gs-label">ROUND</div><div class="gs-value" id="wd-round">0/${totalRounds}</div></div>
      <div class="gs-item"><div class="gs-label">SCORE</div><div class="gs-value" id="wd-score">0</div></div>
      <div class="gs-item"><div class="gs-label">TIME</div><div class="gs-value" id="wd-time">15</div></div>
      <div class="gs-item"><div class="gs-label">STATUS</div><div class="gs-value" id="wd-status" style="font-size:12px">READY</div></div>
    </div>

    <div class="game-layout">
      <!-- Camera feed -->
      <div class="cam-side">
        <video id="wd-video" autoplay playsinline muted style="width:480px;height:360px;border-radius:12px;border:2px solid var(--border);object-fit:cover;transform:scaleX(-1);display:block;"></video>
        <canvas id="wd-overlay" class="overlay" style="position:absolute;top:0;left:0;width:480px;height:360px;border-radius:12px;pointer-events:none;"></canvas>
        <div class="cam-status" id="wd-cam-status">⏳ Starting camera...</div>
      </div>

      <!-- Controls + canvas -->
      <div class="game-side">

        <!-- Word card -->
        <div class="word-card" id="wd-word-card">
          <div class="word-label">DRAW THIS WORD</div>
          <div class="word-display" id="wd-word">---</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px" id="wd-hint">Press START to begin</div>
          <div class="word-timer-bar"><div class="word-timer-fill" id="wd-timer-fill" style="width:100%"></div></div>
        </div>

        <!-- Drawing canvas -->
        <canvas id="wd-draw-canvas" width="300" height="220"
          style="background:#050a12;border:2px solid var(--border);border-radius:12px;display:block;width:300px;height:220px;"></canvas>

        <!-- Gesture hints -->
        <div class="instructions" style="margin-top:10px">
          ☝️ <strong>1 finger</strong> = Draw on canvas<br>
          ✌️ <strong>2 fingers</strong> = Pause / lift pen<br>
          🖐 <strong>Open hand</strong> = Clear canvas
        </div>

        <!-- Vote / control buttons -->
        <div id="wd-controls">
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-game primary-game" id="wd-start-btn" onclick="wdStart()">▶ START GAME</button>
            <button class="btn-game" onclick="wdClearCanvas()">🗑 CLEAR</button>
          </div>
          <div class="votes-row" id="wd-vote-row" style="display:none">
            <button class="vote-btn yes" onclick="wdVote(true)">✅ YES — I drew it!</button>
            <button class="vote-btn no"  onclick="wdVote(false)">❌ NO — I failed</button>
          </div>
        </div>

      </div>
    </div>`;

  
  const drawCanvas = document.getElementById('wd-draw-canvas');
  const drawCtx    = drawCanvas.getContext('2d');
  drawCtx.fillStyle = '#050a12';
  drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawCtx.strokeStyle = '#00d4ff';
  drawCtx.lineWidth   = 6;
  drawCtx.lineCap     = 'round';
  drawCtx.lineJoin    = 'round';

  function wdClearCanvas() {
    drawCtx.fillStyle = '#050a12';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    lastFX = null; lastFY = null;
  }
  window.wdClearCanvas = wdClearCanvas;

  
  const videoEl  = document.getElementById('wd-video');
  const overlay  = document.getElementById('wd-overlay');
  const camSt    = document.getElementById('wd-cam-status');

  tracker = createHandTracker(videoEl, overlay, onHandFrame);

  tracker.start().then(ok => {
    camSt.textContent  = ok ? '✋ Hand tracking active' : '❌ Camera error — check permissions';
    camSt.className    = 'cam-status ' + (ok ? 'ok' : 'error');
  });

  function onHandFrame(results) {
    if (!gameRunning || !results.multiHandLandmarks?.length) {
      lastFX = null; lastFY = null; return;
    }
    const lm = results.multiHandLandmarks[0];
    const fingers = countFingers(lm);

    
    if (fingers >= 4) { wdClearCanvas(); return; }

    
    if (fingers === 2) { lastFX = null; lastFY = null; return; }

    
    if (fingers === 1) {
      
      const tip = lm[8];
      const fx  = (1 - tip.x) * drawCanvas.width;
      const fy  = tip.y * drawCanvas.height;

      if (lastFX !== null) {
        drawCtx.beginPath();
        drawCtx.moveTo(lastFX, lastFY);
        drawCtx.lineTo(fx, fy);
        drawCtx.stroke();
      }
      lastFX = fx; lastFY = fy;

      
      const overCtx = overlay.getContext('2d');
      const cx = (1 - tip.x) * 480;
      const cy = tip.y * 360;
      overCtx.beginPath();
      overCtx.arc(cx, cy, 14, 0, Math.PI * 2);
      overCtx.fillStyle = 'rgba(0,212,255,0.5)';
      overCtx.fill();
      overCtx.strokeStyle = '#fff';
      overCtx.lineWidth = 2;
      overCtx.stroke();
    } else {
      lastFX = null; lastFY = null;
    }
  }

  function getRandomWord() {
    const remaining = WORDS.filter(w => !usedWords.has(w.word));
    if (remaining.length === 0) { usedWords.clear(); return WORDS[0]; }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    usedWords.add(pick.word);
    return pick;
  }
  const usedWords = new Set();

  function wdNextRound() {
    if (round >= totalRounds) { wdEndGame(); return; }
    round++;
    currentWord = getRandomWord();
    timeLeft    = 15;
    drawing     = true;
    wdClearCanvas();

    document.getElementById('wd-round').textContent   = `${round}/${totalRounds}`;
    document.getElementById('wd-word').textContent    = currentWord.word;
    document.getElementById('wd-hint').textContent    = currentWord.hint;
    document.getElementById('wd-status').textContent  = 'DRAWING';
    document.getElementById('wd-vote-row').style.display = 'none';
    document.getElementById('wd-start-btn').style.display = 'none';
    document.getElementById('wd-time').textContent = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById('wd-time').textContent = timeLeft;
      document.getElementById('wd-timer-fill').style.width = (timeLeft / 15 * 100) + '%';
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        wdAskVote();
      }
    }, 1000);
  }

  function wdAskVote() {
    drawing = false;
    document.getElementById('wd-status').textContent = 'DID YOU DO IT?';
    document.getElementById('wd-vote-row').style.display = 'flex';
    gameRunning = false;
    lastFX = null; lastFY = null;
  }

  window.wdVote = function(success) {
    if (success) {
      score += timeLeft > 0 ? (timeLeft * 10 + 50) : 50;
      document.getElementById('wd-score').textContent = score;
    }
    document.getElementById('wd-vote-row').style.display = 'none';
    gameRunning = true;
    setTimeout(wdNextRound, 800);
  };

  window.wdStart = function() {
    gameRunning = true;
    document.getElementById('wd-start-btn').style.display = 'none';
    wdNextRound();
  };

  function wdEndGame() {
    gameRunning = false;
    clearInterval(timerInterval);
    const result = score >= 200 ? 'win' : 'loss';
    addHistory('Hand Word Draw', score, result);

    document.getElementById('modal-body').innerHTML = `
      <div class="game-modal-title">✋ GAME OVER!</div>
      <div style="text-align:center;padding:48px 20px">
        <div style="font-size:72px;margin-bottom:16px">${score>=300?'🏆':score>=150?'🎯':'🤖'}</div>
        <div style="font-family:Orbitron,monospace;font-size:52px;font-weight:900;color:var(--accent)">
          ${score}
        </div>
        <div style="color:var(--text2);margin-top:8px;font-size:16px">Points earned across ${totalRounds} rounds</div>
        <div style="margin-top:16px;font-size:18px;font-weight:700;
          color:${result==='win'?'var(--green)':'var(--accent3)'}">
          ${result==='win'?'🎉 Great drawing skills!':'📝 Keep practising!'}
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:28px">
          <button class="btn-primary" style="width:auto;padding:12px 32px"
            onclick="openGame('worddraw')">PLAY AGAIN</button>
          <button class="btn-game" onclick="closeModal()">BACK TO MENU</button>
        </div>
      </div>`;
  }

  activeGameCleanup = () => {
    clearInterval(timerInterval);
    tracker?.stop();
    gameRunning = false;
  };
}


function renderHandSnakeGame() {
  const body = document.getElementById('modal-body');

  body.innerHTML = `
    <div class="game-modal-title">🐍 HAND SNAKE</div>
    <div class="game-modal-sub">MOVE YOUR HAND → CONTROL THE SNAKE · EAT FOOD · AVOID WALLS</div>
    <div class="game-status-bar">
      <div class="gs-item"><div class="gs-label">SCORE</div><div class="gs-value" id="hs-score">0</div></div>
      <div class="gs-item"><div class="gs-label">LENGTH</div><div class="gs-value" id="hs-len">3</div></div>
      <div class="gs-item"><div class="gs-label">DIRECTION</div><div class="gs-value" id="hs-dir" style="font-size:22px">→</div></div>
      <div class="gs-item"><div class="gs-label">STATUS</div><div class="gs-value" id="hs-status" style="font-size:12px">READY</div></div>
    </div>

    <div class="game-layout">
      <!-- Camera -->
      <div class="cam-side">
        <video id="hs-video" autoplay playsinline muted
          style="width:480px;height:360px;border-radius:12px;border:2px solid var(--border);
                 object-fit:cover;transform:scaleX(-1);display:block;"></video>
        <canvas id="hs-overlay" style="position:absolute;top:0;left:0;width:480px;height:360px;
          border-radius:12px;pointer-events:none;"></canvas>
        <div class="cam-status" id="hs-cam-status">⏳ Starting camera...</div>
      </div>

      <!-- Snake game + controls -->
      <div class="game-side" style="display:flex;flex-direction:column;align-items:center">

        <canvas id="hs-canvas" width="320" height="320"
          style="background:#050a12;border:2px solid var(--border);border-radius:12px;display:block;"></canvas>

        <!-- Direction indicator grid -->
        <div style="margin-top:10px;text-align:center">
          <div style="font-size:11px;letter-spacing:2px;color:var(--text2);margin-bottom:6px">DETECTED DIRECTION</div>
          <div class="direction-indicator">
            <div></div>
            <div class="dir-cell" id="dir-UP">↑</div>
            <div></div>
            <div class="dir-cell" id="dir-LEFT">←</div>
            <div class="dir-cell" style="font-size:12px;color:var(--text2)">·</div>
            <div class="dir-cell" id="dir-RIGHT">→</div>
            <div></div>
            <div class="dir-cell" id="dir-DOWN">↓</div>
            <div></div>
          </div>
        </div>

        <div class="instructions" style="margin-top:10px;width:100%">
          ⬆️ <strong>Tilt hand UP</strong> = snake goes up<br>
          ⬇️ <strong>Tilt hand DOWN</strong> = snake goes down<br>
          ⬅️ <strong>Tilt hand LEFT</strong> = snake goes left<br>
          ➡️ <strong>Tilt hand RIGHT</strong> = snake goes right<br>
          🖐 <strong>Open hand still</strong> = pause
        </div>

        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn-game primary-game" id="hs-start-btn" onclick="hsStart()">▶ START GAME</button>
          <button class="btn-game" onclick="closeModal()">QUIT</button>
        </div>
      </div>
    </div>`;

  
  const CELL = 16, COLS = 20, ROWS = 20;
  const gameCanvas = document.getElementById('hs-canvas');
  const gctx       = gameCanvas.getContext('2d');

  let snake, food, dir, nextDir, score, running, gameOver;
  let gameInterval = null;
  let tracker = null;
  let currentDetectedDir = null;

  function initSnake() {
    snake    = [{ x:10,y:10 }, { x:9,y:10 }, { x:8,y:10 }];
    dir      = { x:1, y:0 };
    nextDir  = { x:1, y:0 };
    score    = 0;
    running  = false;
    gameOver = false;
    placeFood();
    drawSnakeGame();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    } while (snake.some(s => s.x===food.x && s.y===food.y));
  }

  function drawSnakeGame() {
    gctx.fillStyle = '#050a12';
    gctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    
    gctx.fillStyle = 'rgba(0,212,255,0.04)';
    for (let x=0; x<COLS; x++)
      for (let y=0; y<ROWS; y++)
        gctx.fillRect(x*CELL+7, y*CELL+7, 2, 2);

    
    gctx.fillStyle   = '#ff3e7f';
    gctx.shadowColor = '#ff3e7f';
    gctx.shadowBlur  = 12;
    gctx.fillRect(food.x*CELL+2, food.y*CELL+2, CELL-4, CELL-4);
    gctx.shadowBlur  = 0;

    
    snake.forEach((s, i) => {
      gctx.fillStyle = i===0 ? '#00d4ff' : `rgba(0,${140+Math.floor(i*2)},255,${0.9-i*0.02})`;
      if (i===0) { gctx.shadowColor='#00d4ff'; gctx.shadowBlur=10; }
      gctx.fillRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2);
      gctx.shadowBlur = 0;
    });

    
    gctx.fillStyle = 'rgba(0,212,255,0.7)';
    gctx.font      = '11px Orbitron,monospace';
    gctx.fillText('SCORE: ' + score, 8, 16);

    if (gameOver) {
      gctx.fillStyle = 'rgba(5,10,18,0.75)';
      gctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
      gctx.fillStyle = '#ff3e7f';
      gctx.font      = '18px Orbitron,monospace';
      gctx.textAlign = 'center';
      gctx.fillText('GAME OVER', gameCanvas.width/2, gameCanvas.height/2 - 10);
      gctx.fillStyle = '#00d4ff';
      gctx.font      = '14px Orbitron,monospace';
      gctx.fillText('Score: ' + score, gameCanvas.width/2, gameCanvas.height/2 + 16);
      gctx.textAlign = 'left';
    }
  }

  function tick() {
    if (!running || gameOver) return;

    
    dir = { ...nextDir };

    const head = {
      x: (snake[0].x + dir.x + COLS) % COLS,
      y: (snake[0].y + dir.y + ROWS) % ROWS
    };

    
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endSnake(); return;
    }
    
    if (snake.some(s => s.x===head.x && s.y===head.y)) { endSnake(); return; }

    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score += 10;
      document.getElementById('hs-score').textContent = score;
      document.getElementById('hs-len').textContent   = snake.length;
      placeFood();
    } else {
      snake.pop();
    }
    drawSnakeGame();
  }

  function endSnake() {
    running  = false;
    gameOver = true;
    clearInterval(gameInterval);
    drawSnakeGame();
    document.getElementById('hs-status').textContent = 'GAME OVER';

    addHistory('Hand Snake', score, score >= 50 ? 'win' : 'loss');

    setTimeout(() => {
      document.getElementById('modal-body').innerHTML = `
        <div class="game-modal-title">🐍 GAME OVER!</div>
        <div style="text-align:center;padding:48px 20px">
          <div style="font-size:72px;margin-bottom:16px">${score>=100?'🏆':score>=50?'🎯':'💀'}</div>
          <div style="font-family:Orbitron,monospace;font-size:52px;font-weight:900;color:var(--accent)">
            ${score}
          </div>
          <div style="color:var(--text2);margin-top:8px;font-size:16px">
            Snake length: ${snake.length} segments
          </div>
          <div style="margin-top:16px;font-size:18px;font-weight:700;
            color:${score>=50?'var(--green)':'var(--accent3)'}">
            ${score>=100?'🎉 Snake Master!':score>=50?'👍 Good reflexes!':'🐍 Keep practising!'}
          </div>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:28px">
            <button class="btn-primary" style="width:auto;padding:12px 32px"
              onclick="openGame('handsnake')">PLAY AGAIN</button>
            <button class="btn-game" onclick="closeModal()">BACK TO MENU</button>
          </div>
        </div>`;
    }, 1800);
  }

  
  const DIRS = { UP:'↑', DOWN:'↓', LEFT:'←', RIGHT:'→' };
  function highlightDir(d) {
    ['UP','DOWN','LEFT','RIGHT'].forEach(k => {
      const el = document.getElementById('dir-'+k);
      if (el) el.classList.toggle('active', k===d);
    });
    const arrow = d ? DIRS[d] : '·';
    document.getElementById('hs-dir').textContent = arrow;
  }

  
  function onHandFrame(results) {
    if (!results.multiHandLandmarks?.length) {
      currentDetectedDir = null;
      highlightDir(null);
      return;
    }
    const lm = results.multiHandLandmarks[0];
    const d  = detectHandDirection(lm);
    currentDetectedDir = d;
    highlightDir(d);

    if (d && running && !gameOver) {
      const map = {
        UP:    { x:0,  y:-1 },
        DOWN:  { x:0,  y:1  },
        LEFT:  { x:-1, y:0  },
        RIGHT: { x:1,  y:0  },
      };
      const newDir = map[d];
      
      if (newDir.x !== -dir.x || newDir.y !== -dir.y) {
        nextDir = newDir;
      }
    }
  }

  
  const videoEl = document.getElementById('hs-video');
  const overlay = document.getElementById('hs-overlay');
  const camSt   = document.getElementById('hs-cam-status');

  tracker = createHandTracker(videoEl, overlay, onHandFrame);
  tracker.start().then(ok => {
    camSt.textContent = ok ? '✋ Hand controls active' : '❌ Camera error — check permissions';
    camSt.className   = 'cam-status ' + (ok ? 'ok' : 'error');
  });

  
  window.hsStart = function() {
    document.getElementById('hs-start-btn').textContent = 'RESTART';
    clearInterval(gameInterval);
    initSnake();
    running = true;
    document.getElementById('hs-status').textContent = 'RUNNING';
    gameInterval = setInterval(tick, 180);
  };

  initSnake();

  activeGameCleanup = () => {
    clearInterval(gameInterval);
    tracker?.stop();
    running = false;
  };
}


document.addEventListener('keydown', e => {
  const el = document.getElementById('hs-status');
  if (!el) return;
  const map = {
    ArrowUp:   { x:0,y:-1 }, w:{ x:0,y:-1 },
    ArrowDown: { x:0,y:1  }, s:{ x:0,y:1  },
    ArrowLeft: { x:-1,y:0 }, a:{ x:-1,y:0 },
    ArrowRight:{ x:1,y:0  }, d:{ x:1,y:0  },
  };
  
});