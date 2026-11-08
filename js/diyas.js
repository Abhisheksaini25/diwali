/**
 * Geometric Rangoli Diya Manager (v6 — Fixed)
 * Controls the 5 unlit clay diyas, gradual revelation of the hidden Rangoli,
 * and immediate dramatic celebration upon lighting all 5 diyas.
 *
 * FIXED: Use setAttribute('class', ...) for SVG elements instead of .className
 *        (SVG .className is an SVGAnimatedString, not a plain string)
 * FIXED: Preserve Tailwind utility classes on the SVG element
 * FIXED: Added error guards around audio calls
 */

class DiyaShrineManager {
  constructor(options = {}) {
    this.rangoliArt = document.getElementById(options.rangoliId || 'terrace-rangoli-art');
    this.skyHint = document.getElementById(options.skyHintId || 'sky-interaction-hint');
    this.skyCelebration = document.getElementById(options.skyCelebrationId || 'sky-celebration-banner');
    this.totalDiyas = 5;
    this.litCount = 0;
    this.diyas = [];

    // The Tailwind utility classes that must always remain on the rangoli SVG
    this.rangoliBaseClasses = 'rangoli-graphic w-full h-full pointer-events-none select-none';

    this.init();
  }

  init() {
    const diyaElements = document.querySelectorAll('.diya-slot');
    this.diyas = [];
    this.litCount = 0;

    diyaElements.forEach((el, idx) => {
      const diyaState = { element: el, isLit: false };

      // Use onclick for maximum reliability under file:/// protocol
      el.onclick = (e) => {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        this.lightDiya(idx);
      };

      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.lightDiya(idx);
        }
      };

      this.diyas.push(diyaState);
    });

    // Ensure all diyas start fully unlit (no flame visible)
    this.diyas.forEach(diya => {
      diya.element.classList.remove('is-lit');
      const flame = diya.element.querySelector('.diya-flame-wrapper');
      if (flame) {
        flame.style.display = 'none';
        flame.style.opacity = '0';
        flame.style.transform = 'scale(0.3)';
      }
    });

    this.updateRangoliVisualState();
  }

  lightDiya(index) {
    const diya = this.diyas[index];
    if (!diya || diya.isLit) return;

    // Fun validation: Diyas can only be lit with Phuljhadi (sparkler)!
    const activeMode = (window.fireworks && window.fireworks.activeMode) || 'skyshot';
    if (activeMode !== 'sparkler') {
      const modeLabels = {
        skyshot: 'a sky rocket 🚀',
        anar: 'an anar 🌋',
        chakri: 'a chakri 🌀'
      };
      const crackerName = modeLabels[activeMode] || 'that';
      const funnyMsg = `C'mon, who lights a diya with ${crackerName}?!`;

      if (typeof window.showSubtleToast === 'function') {
        window.showSubtleToast(funnyMsg, 2800);
      }

      // Playful wiggle on the diya to visually indicate it can't be lit with this
      if (diya.element) {
        diya.element.classList.remove('diya-shake');
        void diya.element.offsetWidth; // trigger reflow
        diya.element.classList.add('diya-shake');
        setTimeout(() => {
          if (diya.element) diya.element.classList.remove('diya-shake');
        }, 500);
      }
      return;
    }

    // Safely ensure audio context
    try {
      if (window.festiveAudio) window.festiveAudio.ensureContext();
    } catch (e) { /* audio init failed, continue silently */ }

    diya.isLit = true;
    this.litCount++;

    // 1. Reveal animated flame on this diya
    diya.element.classList.add('is-lit');
    const flame = diya.element.querySelector('.diya-flame-wrapper');
    if (flame) {
      flame.style.display = 'flex';
      flame.style.opacity = '1';
      flame.style.transform = 'scale(1)';
    }

    // 2. Play sacred chime
    try {
      if (window.festiveAudio) window.festiveAudio.playDiyaChime();
    } catch (e) { /* chime failed, continue */ }

    // 3. Sparkle around diya
    this.spawnDiyaSparkle(diya.element);

    // 4. Update Rangoli gradual emergence from darkness
    this.updateRangoliVisualState();

    // 5. Check if all 5 are lit!
    if (this.litCount >= this.totalDiyas) {
      setTimeout(() => this.triggerAllLitCelebration(), 300);
    }
  }

  /**
   * Sets classes on the SVG rangoli element using setAttribute
   * to properly handle SVGAnimatedString (not .className)
   */
  setRangoliClasses(stateClass) {
    if (!this.rangoliArt) return;
    const classes = stateClass
      ? this.rangoliBaseClasses + ' ' + stateClass
      : this.rangoliBaseClasses;
    this.rangoliArt.setAttribute('class', classes);
  }

  updateRangoliVisualState() {
    if (!this.rangoliArt) return;

    if (this.litCount === 0) {
      // Completely dark and invisible before any diyas are lit
      this.setRangoliClasses('rangoli-unlit');
      this.rangoliArt.style.opacity = '0';
      this.rangoliArt.style.filter = 'brightness(0)';
    } else if (this.litCount < this.totalDiyas) {
      // Gradually reveal as each diya lights up
      this.setRangoliClasses('');
      const progress = this.litCount / this.totalDiyas;
      const opacity = 0.25 + progress * 0.65;
      const brightness = 0.35 + progress * 0.65;
      this.rangoliArt.style.opacity = String(opacity);
      this.rangoliArt.style.filter = `brightness(${brightness}) saturate(1.2) drop-shadow(0 0 15px rgba(255,180,0,0.5))`;
    } else {
      // 5 lit: Radiant full bloom!
      this.setRangoliClasses('rangoli-lit');
      this.rangoliArt.style.opacity = '1';
      this.rangoliArt.style.filter = 'brightness(1.4) contrast(1.15) saturate(1.5) drop-shadow(0 0 45px #ffb703) drop-shadow(0 0 90px #ff3d00)';
    }
  }

  spawnDiyaSparkle(element) {
    try {
      const rect = element.getBoundingClientRect();
      if (window.fireworks) {
        window.fireworks.addSparklerSparks(rect.left + rect.width / 2, rect.top + 10, 16);
      }
    } catch (e) { /* sparkle failed, non-critical */ }
  }

  triggerAllLitCelebration() {
    // 1. Sky Banner updates
    if (this.skyHint) {
      this.skyHint.style.opacity = '0';
      this.skyHint.style.pointerEvents = 'none';
    }
    if (this.skyCelebration) {
      this.skyCelebration.style.opacity = '1';
      this.skyCelebration.style.transform = 'translateY(0)';
    }

    // 2. Play celebration sound, explode sound & Happy Diwali audio
    try {
      if (window.festiveAudio) {
        window.festiveAudio.playCelebrationFanfare();
        window.festiveAudio.playFireworkBurst();
        window.festiveAudio.playHappyDiwaliSong();
      }
    } catch (e) {}

    // 3. Immediate Multiple Fireworks Explosions across the sky!
    if (window.fireworks) {
      try {
        const fw = window.fireworks;
        const w = fw.width;
        const h = fw.height;

        // Triple starburst in the sky (Left, Center, Right)
        fw.createExplosion(w * 0.25, h * 0.16, fw.colorPalettes[0]);
        setTimeout(() => {
          fw.createExplosion(w * 0.50, h * 0.12, fw.colorPalettes[1]);
          try { if (window.festiveAudio) window.festiveAudio.playFireworkBurst(); } catch(e) {}
        }, 200);
        setTimeout(() => {
          fw.createExplosion(w * 0.75, h * 0.18, fw.colorPalettes[3]);
          try { if (window.festiveAudio) window.festiveAudio.playFireworkBurst(); } catch(e) {}
        }, 400);

        // Launch multi-rocket barrage
        fw.launchBarrage(8);

        // 4. Immediately trigger floor crackers (Anar + Chakri) on terrace floor!
        const horizonY = fw.getHorizonY();
        setTimeout(() => {
          fw.placeAnar(w * 0.20, horizonY + 50);
          fw.placeChakri(w * 0.80, horizonY + 55);
        }, 800);

        // 5. Start ongoing autonomous celebration loop
        setTimeout(() => {
          fw.startAutonomousCelebration();
        }, 2500);
      } catch (e) {
        console.warn('[Diwali] Celebration fireworks error:', e);
      }
    }
  }

  resetAll() {
    this.litCount = 0;
    this.diyas.forEach(diya => {
      diya.isLit = false;
      diya.element.classList.remove('is-lit');
      const flame = diya.element.querySelector('.diya-flame-wrapper');
      if (flame) {
        flame.style.display = 'none';
        flame.style.opacity = '0';
        flame.style.transform = 'scale(0.3)';
      }
    });

    // Make Rangoli completely dark again
    this.updateRangoliVisualState();

    if (this.skyHint) {
      this.skyHint.style.opacity = '1';
      this.skyHint.style.pointerEvents = 'auto';
    }
    if (this.skyCelebration) {
      this.skyCelebration.style.opacity = '0';
      this.skyCelebration.style.transform = 'translateY(16px)';
    }

    if (window.fireworks) {
      window.fireworks.clearAll();
    }

    // Stop Happy Diwali song if playing
    try {
      if (window.festiveAudio) {
        window.festiveAudio.stopHappyDiwaliSong();
      }
    } catch (e) {}
  }
}

window.DiyaShrineManager = DiyaShrineManager;
