/**
 * Main Application Orchestrator (v5)
 * Bulletproof bootstrap with instant readyState check, explicit .onclick bindings,
 * firecracker dropdown toggle, audio mute/unmute, and diya shrine management.
 */

function initApp() {
  // 1. Initialize Canvas Fireworks Engine
  const canvas = document.getElementById('fireworks-canvas');
  if (canvas) {
    window.fireworks = new window.FireworksEngine(canvas);
  }

  // 2. Initialize Geometric Rangoli Diya Shrine
  window.diyaShrine = new window.DiyaShrineManager({
    rangoliId: 'terrace-rangoli-art',
    skyHintId: 'sky-interaction-hint',
    skyCelebrationId: 'sky-celebration-banner'
  });

  // 3. Audio Mute / Unmute Toggle Button
  const audioToggleBtn = document.getElementById('btn-audio-toggle');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundMuted = document.getElementById('icon-sound-muted');

  function handleAudioToggle(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    window.festiveAudio.ensureContext();
    const isMuted = window.festiveAudio.toggleMute();

    if (iconSoundOn && iconSoundMuted) {
      iconSoundOn.style.display = isMuted ? 'none' : 'block';
      iconSoundMuted.style.display = isMuted ? 'block' : 'none';
    }
    if (audioToggleBtn) {
      if (isMuted) audioToggleBtn.classList.add('is-muted');
      else audioToggleBtn.classList.remove('is-muted');
    }
    showSubtleToast(isMuted ? 'Sound Muted' : 'Sound On');
  }

  if (audioToggleBtn) {
    audioToggleBtn.onclick = handleAudioToggle;
  }

  // 4. Diya Reset / Replay Button
  const resetBtn = document.getElementById('btn-reset-diyas');
  function handleReset(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (window.diyaShrine) {
      window.diyaShrine.resetAll();
    }
    showSubtleToast('Diyas Reset');
  }

  if (resetBtn) {
    resetBtn.onclick = handleReset;
  }

  // 5. Firecracker Dropdown Menu Selector
  const crackerMenuBtn = document.getElementById('btn-cracker-menu');
  const crackerDropdown = document.getElementById('cracker-dropdown');
  const currentCrackerIcon = document.getElementById('current-cracker-icon');

  const crackerModes = {
    skyshot: { icon: '🚀', label: 'Sky Rocket' },
    anar: { icon: '🌋', label: 'Anar' },
    chakri: { icon: '🌀', label: 'Chakri' },
    sparkler: { icon: '✨', label: 'Phuljhadi' }
  };

  function toggleCrackerMenu(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!crackerDropdown) return;
    const isShowing = crackerDropdown.classList.contains('is-open');
    if (isShowing) {
      crackerDropdown.classList.remove('is-open');
      crackerDropdown.style.display = 'none';
    } else {
      crackerDropdown.classList.add('is-open');
      crackerDropdown.style.display = 'flex';
    }
  }

  if (crackerMenuBtn) {
    crackerMenuBtn.onclick = toggleCrackerMenu;
  }

  // Close dropdown when clicking outside
  document.addEventListener('pointerdown', (e) => {
    if (crackerDropdown && crackerMenuBtn) {
      if (!crackerDropdown.contains(e.target) && !crackerMenuBtn.contains(e.target)) {
        crackerDropdown.classList.remove('is-open');
        crackerDropdown.style.display = 'none';
      }
    }
  });

  // Handle mode item selection
  if (crackerDropdown) {
    const modeItems = crackerDropdown.querySelectorAll('[data-cracker-select]');
    modeItems.forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        const mode = item.dataset.crackerSelect;
        if (window.fireworks && crackerModes[mode]) {
          window.fireworks.setMode(mode);
          if (currentCrackerIcon) {
            currentCrackerIcon.textContent = crackerModes[mode].icon;
          }
          showSubtleToast(`Selected: ${crackerModes[mode].label}`);
        }
        crackerDropdown.classList.remove('is-open');
        crackerDropdown.style.display = 'none';
      };
    });
  }

  // 6. Resume AudioContext on first user interaction
  const resumeAudioOnFirstClick = () => {
    window.festiveAudio.ensureContext();
    window.removeEventListener('pointerdown', resumeAudioOnFirstClick);
    window.removeEventListener('keydown', resumeAudioOnFirstClick);
  };
  window.addEventListener('pointerdown', resumeAudioOnFirstClick);
  window.addEventListener('keydown', resumeAudioOnFirstClick);

  // 7. Parse URL Query Parameters for Personalized Sky Blessing (?to=Name)
  const params = new URLSearchParams(window.location.search);
  const toParam = params.get('to');
  const skyPersonalizedEl = document.getElementById('sky-personalized-msg');
  if (toParam && skyPersonalizedEl) {
    const cleanName = toParam.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    skyPersonalizedEl.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-medium shadow-md backdrop-blur-sm">
        ✨ A Special Wish for <strong>${cleanName}</strong> ✨
      </span>
    `;
    skyPersonalizedEl.classList.remove('hidden');
  }

  // 8. Generate Ambient Floating Sky Lanterns
  createAmbientLanterns(6);
}

// Helper for unobtrusive toast feedback (horizontally centered)
function showSubtleToast(msg, duration = 2400) {
  const toast = document.getElementById('subtle-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translate(-50%, 0)';

  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -8px)';
  }, duration);
}
window.showSubtleToast = showSubtleToast;

// Helper to spawn floating background sky lanterns
function createAmbientLanterns(count = 5) {
  const container = document.getElementById('ambient-lanterns-container');
  if (!container) return;

  for (let i = 0; i < count; i++) {
    const lantern = document.createElement('div');
    const size = 24 + Math.random() * 16;
    const left = 6 + Math.random() * 88;
    const duration = 20 + Math.random() * 12;
    const delay = Math.random() * 10;

    lantern.className = 'ambient-lantern absolute pointer-events-none';
    lantern.style.width = `${size}px`;
    lantern.style.height = `${size * 1.3}px`;
    lantern.style.left = `${left}%`;
    lantern.style.bottom = '-50px';
    lantern.style.animation = `floatUpLantern ${duration}s linear infinite`;
    lantern.style.animationDelay = `${delay}s`;
    lantern.style.opacity = '0.7';

    lantern.innerHTML = `
      <div class="relative w-full h-full flex flex-col items-center justify-center">
        <div class="w-full h-full rounded-md bg-gradient-to-t from-amber-600 via-orange-500 to-amber-300 opacity-80 shadow-[0_0_16px_rgba(255,165,0,0.8)] filter blur-[0.5px]"></div>
        <div class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping"></div>
      </div>
    `;

    container.appendChild(lantern);
  }
}

// Execution guard: Run immediately if DOM ready, else wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
