// ==========================================================================
// PURE BLACK COMPACT ENGINE (ASTRIX & ELARA)
// Features: Stealth Calculator PIN gate, Offline queue, Push notification
// ==========================================================================

const APP_CONFIG = {
  secretPin: '2411', // Elara's Birthday: 24/11
  defaultWebhook: 'https://ntfy.sh/astrix_elara_missyou',
  togetherDate: new Date('2023-01-01T00:00:00'),
  notes: [
    "Every time Roblox opens, it's never just a game—it's the place I met my favorite person.",
    "No amount of kilometers can weaken the signal between our frequencies.",
    "You are the quiet thought in between every chaotic second.",
    "Distance only teaches us that having you is worth waiting for.",
    "Astrix is always right here, even when the screen goes dark.",
    "Elara, Jupiter has 95 moons, but in my orbit there's only you.",
    "Every 2 AM call proved that home isn't a place, it's a voice.",
    "Happy 14th Birthday to the girl who stole my heart through a screen.",
    "My favorite notification is still just any word from you.",
    "One day the plane tickets will replace the Discord and Roblox calls."
  ]
};

// State
let calcInput = '';
let currentNoteIndex = 0;
let sentCount = parseInt(localStorage.getItem('elara_ping_count') || '0', 10);
let offlineQueue = JSON.parse(localStorage.getItem('elara_offline_queue') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  initDisguiseCalc();
  initMainApp();
  initNetworkSync();
  initServiceWorker();
});

// ==========================================================================
// 1. STEALTH DISGUISE CALCULATOR
// ==========================================================================
function initDisguiseCalc() {
  const display = document.getElementById('calcDisplay');
  const status = document.getElementById('calcStatus');
  const disguiseScreen = document.getElementById('disguise-screen');
  const secretApp = document.getElementById('secret-app');
  const buttons = document.querySelectorAll('.c-btn');

  // Check if session already unlocked
  if (sessionStorage.getItem('elara_unlocked') === 'true') {
    unlockVault();
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (navigator.vibrate) navigator.vibrate(10);

      if (val === 'C') {
        calcInput = '';
        display.textContent = '0';
      } else if (val === '±') {
        if (calcInput) {
          calcInput = calcInput.startsWith('-') ? calcInput.slice(1) : '-' + calcInput;
          display.textContent = calcInput || '0';
        }
      } else if (btn.id === 'calcEquals') {
        // Check secret pin or evaluate math
        if (calcInput === APP_CONFIG.secretPin) {
          unlockVault();
          calcInput = '';
          display.textContent = '0';
          return;
        }
        try {
          const sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
          const res = Function(`'use strict'; return (${sanitized})`)();
          calcInput = String(res);
          display.textContent = calcInput;
        } catch (e) {
          display.textContent = 'Error';
          calcInput = '';
        }
      } else {
        if (calcInput.length < 12) {
          calcInput += val;
          display.textContent = calcInput;
        }
      }

      // Stealth auto-unlock if typed precisely
      if (calcInput === APP_CONFIG.secretPin) {
        unlockVault();
        calcInput = '';
        display.textContent = '0';
      }
    });
  });

  function unlockVault() {
    sessionStorage.setItem('elara_unlocked', 'true');
    disguiseScreen.classList.add('hidden');
    secretApp.classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
  }

  // Quick lock handlers
  const lockAction = () => {
    sessionStorage.removeItem('elara_unlocked');
    secretApp.classList.add('hidden');
    disguiseScreen.classList.remove('hidden');
    calcInput = '';
    display.textContent = '0';
  };

  document.getElementById('quickLockBtn').addEventListener('click', lockAction);
  document.getElementById('lockNav').addEventListener('click', lockAction);
}

// ==========================================================================
// 2. MAIN VAULT LOGIC
// ==========================================================================
function initMainApp() {
  // Counters
  updateDaysCounter();
  
  // Sent Counter UI
  document.getElementById('sentCount').textContent = sentCount;

  // Notes
  updateNoteDisplay();
  document.getElementById('nextNote').addEventListener('click', () => {
    currentNoteIndex = (currentNoteIndex + 1) % APP_CONFIG.notes.length;
    updateNoteDisplay();
  });
  document.getElementById('prevNote').addEventListener('click', () => {
    currentNoteIndex = (currentNoteIndex - 1 + APP_CONFIG.notes.length) % APP_CONFIG.notes.length;
    updateNoteDisplay();
  });
  document.getElementById('randomNote').addEventListener('click', () => {
    currentNoteIndex = Math.floor(Math.random() * APP_CONFIG.notes.length);
    updateNoteDisplay();
  });

  // Letter Accordion
  const toggleLetter = document.getElementById('toggleLetter');
  const letterBody = document.getElementById('letterBody');
  const letterArrow = document.getElementById('letterArrow');
  toggleLetter.addEventListener('click', () => {
    const isHidden = letterBody.classList.toggle('hidden');
    letterArrow.classList.toggle('rotated', !isHidden);
  });

  // Webhook settings
  const toggleWebhook = document.getElementById('toggleWebhookBtn');
  const webhookSetup = document.getElementById('webhookSetup');
  const webhookInput = document.getElementById('webhookInput');
  const saveWebhookBtn = document.getElementById('saveWebhookBtn');

  webhookInput.value = localStorage.getItem('elara_webhook') || APP_CONFIG.defaultWebhook;

  toggleWebhook.addEventListener('click', () => {
    webhookSetup.classList.toggle('hidden');
  });

  saveWebhookBtn.addEventListener('click', () => {
    const val = webhookInput.value.trim() || APP_CONFIG.defaultWebhook;
    localStorage.setItem('elara_webhook', val);
    alert('Endpoint saved successfully.');
    webhookSetup.classList.add('hidden');
  });

  // MISS YOU DISPATCH BUTTON
  const pingBtn = document.getElementById('pingBtn');
  const quickPingNav = document.getElementById('quickPingNav');

  pingBtn.addEventListener('click', triggerMissPing);
  quickPingNav.addEventListener('click', triggerMissPing);
}

function updateDaysCounter() {
  const diffTime = Math.abs(new Date() - APP_CONFIG.togetherDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const el = document.getElementById('daysCounter');
  if (el) el.textContent = diffDays;
}

function updateNoteDisplay() {
  const quoteEl = document.getElementById('activeNote');
  const tracker = document.getElementById('noteTracker');
  quoteEl.textContent = `"${APP_CONFIG.notes[currentNoteIndex]}"`;
  tracker.textContent = `Note ${currentNoteIndex + 1} of ${APP_CONFIG.notes.length}`;
}

// ==========================================================================
// 3. PUSH NOTIFICATION & OFFLINE QUEUE
// ==========================================================================
async function triggerMissPing() {
  sentCount++;
  localStorage.setItem('elara_ping_count', sentCount);
  document.getElementById('sentCount').textContent = sentCount;

  if (navigator.vibrate) navigator.vibrate([20, 40, 20]);

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logEl = document.getElementById('lastPingText');
  logEl.textContent = `Pinging Astrix (${timestamp})...`;

  const payload = {
    event: 'miss_you',
    from: 'Elara (Elakshi)',
    to: 'Astrix (Ayushya)',
    time: new Date().toISOString(),
    count: sentCount
  };

  const endpoint = localStorage.getItem('elara_webhook') || APP_CONFIG.defaultWebhook;

  if (!navigator.onLine) {
    // Queue offline
    queueOfflinePing(payload);
    logEl.textContent = `Offline: Queued (#${sentCount}). Will auto-send once online!`;
    return;
  }

  try {
    await sendPushNotification(endpoint, payload);
    logEl.textContent = `Pulse delivered at ${timestamp} 🖤`;
  } catch (err) {
    console.warn('Dispatch failed, queueing offline:', err);
    queueOfflinePing(payload);
    logEl.textContent = `Signal cached. Auto-syncing when network reconnects.`;
  }
}

async function sendPushNotification(endpoint, payload) {
  // If using ntfy.sh (Zero-setup instant mobile push)
  if (endpoint.includes('ntfy.sh')) {
    return fetch(endpoint, {
      method: 'POST',
      body: `Elara is missing you right now! (Total: ${payload.count} times) 🖤\nTime: ${new Date().toLocaleTimeString()}`,
      headers: {
        'Title': 'Signal from Elara ♡',
        'Priority': 'urgent',
        'Tags': 'black_heart,satellite'
      }
    });
  }

  // If using Discord webhook
  if (endpoint.includes('discord.com')) {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **Elara is missing you!**\n> Sent from Elara's App (Count: ${payload.count})\nTime: ${payload.time}`
      })
    });
  }

  // Generic POST endpoint
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function queueOfflinePing(payload) {
  offlineQueue.push(payload);
  localStorage.setItem('elara_offline_queue', JSON.stringify(offlineQueue));
}

// Background Network Sync
function initNetworkSync() {
  const statusEl = document.getElementById('networkStatus');

  const updateStatus = () => {
    if (navigator.onLine) {
      statusEl.textContent = 'Online • Ready';
      statusEl.style.color = '#10b981';
      flushOfflineQueue();
    } else {
      statusEl.textContent = 'Offline • Queuing';
      statusEl.style.color = '#f59e0b';
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

async function flushOfflineQueue() {
  if (offlineQueue.length === 0) return;
  const endpoint = localStorage.getItem('elara_webhook') || APP_CONFIG.defaultWebhook;
  const pending = [...offlineQueue];
  
  for (const item of pending) {
    try {
      await sendPushNotification(endpoint, item);
      offlineQueue.shift();
      localStorage.setItem('elara_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      break;
    }
  }

  const logEl = document.getElementById('lastPingText');
  if (logEl) logEl.textContent = `Auto-flushed offline signals!`;
}

// Service worker for offline asset caching
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
