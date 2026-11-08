/**
 * Diwali Fireworks & Crackers Engine (v5)
 * Launches 3 rockets in sequence (t=0s, t=1s, t=3s) when triggered.
 * All sky rockets launch from behind the skyline and explode high in the sky above housing.
 * Integrates user's firework_explode.mp3 and fireworks-10-shoot.mp3.
 */

class FireworksEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.rockets = [];
    this.anars = [];
    this.chakris = [];
    this.isRunning = false;

    // Active mode: 'skyshot' | 'anar' | 'chakri' | 'sparkler'
    this.activeMode = 'skyshot';

    // Autonomous celebration state
    this.autoCelebrationInterval = null;
    this.autoRocketInterval = null;

    // Festive color palettes
    this.colorPalettes = [
      ['#FFD700', '#FFA500', '#FF4500', '#FFF8DC'], // Classic Gold & Ember
      ['#FF1493', '#FF69B4', '#9400D3', '#00FFFF'], // Royal Magenta & Cyan
      ['#00FF7F', '#7FFF00', '#32CD32', '#ADFF2F'], // Emerald & Lime
      ['#FF3366', '#FF9933', '#FFFF33', '#33CCFF'], // Vibrant Rangoli
      ['#E0AAFF', '#C77DFF', '#9D4EDD', '#7B2CBF']  // Divine Purple
    ];

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.bindEvents();
    this.startLoop();
  }

  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setMode(mode) {
    this.activeMode = mode;
  }

  getHorizonY() {
    const floor = document.getElementById('terrace-floor-container');
    if (floor) {
      const rect = floor.getBoundingClientRect();
      if (rect.top > 0) return rect.top;
    }
    return this.height * 0.54;
  }

  bindEvents() {
    const handleTrigger = (x, y) => {
      window.festiveAudio.ensureContext();
      const horizonY = this.getHorizonY();

      if (this.activeMode === 'sparkler') {
        this.addSparklerSparks(x, y, 22);
        window.festiveAudio.playSparklerCrackle();
        return;
      }

      // Check whether user clicked on the Terrace Floor (y >= horizonY) or in the Sky (y < horizonY)
      if (y >= horizonY) {
        if (this.activeMode === 'anar') {
          this.placeAnar(x, y);
          return;
        }
        if (this.activeMode === 'chakri') {
          this.placeChakri(x, y);
          return;
        }
        // If skyshot mode clicked on the floor: launch 3-rocket volley into upper sky
        const skyTargetX = x;
        const skyTargetY = this.height * 0.12 + Math.random() * (this.height * 0.18);
        this.launchRocketVolley(skyTargetX, skyTargetY);
      } else {
        // Clicked in the sky: blast in the sky above the housing (3-rocket volley)
        const skyTargetY = Math.min(y, horizonY - 45);
        this.launchRocketVolley(x, skyTargetY);
      }
    };

    // Global pointerdown captures clicks anywhere on page except buttons / dropdown / diyas
    window.addEventListener('pointerdown', (e) => {
      const isInteractive = e.target && e.target.closest && e.target.closest('button, input, select, textarea, a, .diya-slot, #cracker-dropdown, .header-icon-btn');
      if (isInteractive) return;

      handleTrigger(e.clientX, e.clientY);
    });

    // Pointer move for sparkler mode
    window.addEventListener('pointermove', (e) => {
      if (this.activeMode === 'sparkler') {
        const isInteractive = e.target && e.target.closest && e.target.closest('button, #cracker-dropdown, .diya-slot, .header-icon-btn');
        if (!isInteractive) {
          this.addSparklerSparks(e.clientX, e.clientY, 4);
          window.festiveAudio.playSparklerCrackle();
        }
      }
    });
  }

  // 1. 3-ROCKET VOLLEY (t=0s, t=1s, t=3s)
  launchRocketVolley(targetX, targetY) {
    // Rocket 1 (immediate at 0s)
    this.launchRocket(targetX, targetY);

    // Rocket 2 (~1s later)
    setTimeout(() => {
      const spreadX = targetX + (Math.random() * 100 - 50);
      const spreadY = targetY + (Math.random() * 40 - 20);
      this.launchRocket(spreadX, spreadY);
    }, 1000);

    // Rocket 3 (~2s after second, i.e. 3s total)
    setTimeout(() => {
      const spreadX = targetX + (Math.random() * 140 - 70);
      const spreadY = targetY + (Math.random() * 50 - 25);
      this.launchRocket(spreadX, spreadY);
    }, 3000);
  }

  // Single Rocket Launch from horizon up into sky above housing
  launchRocket(targetX, targetY) {
    const horizonY = this.getHorizonY();
    const startX = targetX + (Math.random() * 40 - 20);
    const startY = horizonY + 15;

    // Ensure burst height is above the buildings
    const burstY = Math.min(targetY, horizonY - 45);

    const dx = targetX - startX;
    const dy = burstY - startY; // negative since moving up
    const distance = Math.hypot(dx, dy);
    const speed = 11 + Math.random() * 3;

    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;

    const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];

    this.rockets.push({
      x: startX,
      y: startY,
      vx: vx,
      vy: vy,
      targetX: targetX,
      targetY: burstY,
      color: palette[0],
      palette: palette
    });

    window.festiveAudio.playRocketLaunch();
  }

  // Explode Rocket into colorful floral bursts in the sky (Plays firework_explode.mp3)
  createExplosion(x, y, palette) {
    const particleCount = 85 + Math.floor(Math.random() * 35);
    const ringShape = Math.random() > 0.65;

    for (let i = 0; i < particleCount; i++) {
      let vx, vy, speed;
      const angle = (Math.PI * 2 * i) / particleCount;

      if (ringShape) {
        speed = 4.0 + Math.random() * 1.5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else {
        speed = 2.0 + Math.random() * 5.5;
        const randomAngle = Math.random() * Math.PI * 2;
        vx = Math.cos(randomAngle) * speed;
        vy = Math.sin(randomAngle) * speed;
      }

      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        color: color,
        alpha: 1,
        size: 2.2 + Math.random() * 1.8,
        decay: 0.012 + Math.random() * 0.012,
        gravity: 0.045,
        friction: 0.97,
        twinkle: Math.random() > 0.4
      });
    }

    this.createGlowFlash(x, y, palette[0]);
    window.festiveAudio.playFireworkBurst();
  }

  createGlowFlash(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      isFlash: true,
      radius: 120,
      color: color,
      alpha: 0.35,
      decay: 0.05
    });
  }

  // 2. ANAR (FOUNTAIN) on the terrace floor
  placeAnar(x, y) {
    const duration = 3.2;
    const anar = {
      x: x,
      y: y,
      startTime: performance.now(),
      duration: duration * 1000,
      baseRadius: 16,
      palette: ['#FFFFFF', '#FFD700', '#FF8C00', '#FF4500', '#FFFAFA']
    };

    this.anars.push(anar);
    window.festiveAudio.playAnarSound(duration);
  }

  updateAnars(now) {
    for (let i = this.anars.length - 1; i >= 0; i--) {
      const anar = this.anars[i];
      const elapsed = now - anar.startTime;
      const progress = elapsed / anar.duration;

      if (progress >= 1) {
        this.anars.splice(i, 1);
        continue;
      }

      let intensity = 1.0;
      if (progress < 0.25) intensity = progress / 0.25;
      else if (progress > 0.75) intensity = (1 - progress) / 0.25;

      const sparkCount = Math.floor((10 + Math.random() * 8) * intensity);

      for (let s = 0; s < sparkCount; s++) {
        const spread = (Math.random() - 0.5) * 0.7;
        const speed = (9 + Math.random() * 9) * intensity;
        const angle = -Math.PI / 2 + spread;

        const color = anar.palette[Math.floor(Math.random() * anar.palette.length)];
        this.particles.push({
          x: anar.x + (Math.random() * 6 - 3),
          y: anar.y - 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          alpha: 1,
          size: 1.8 + Math.random() * 2.2,
          decay: 0.025 + Math.random() * 0.02,
          gravity: 0.22,
          friction: 0.985
        });
      }
    }
  }

  // 3. CHAKRI (GROUND SPINNER) on the terrace floor
  placeChakri(x, y) {
    const duration = 3.5;
    const chakri = {
      x: x,
      y: y,
      startTime: performance.now(),
      duration: duration * 1000,
      angle: 0,
      spinSpeed: 0.35,
      radius: 18,
      palette: ['#00FFFF', '#FF1493', '#FFD700', '#FF4500', '#FFFFFF']
    };

    this.chakris.push(chakri);
    window.festiveAudio.playChakriSound(duration);
  }

  updateChakris(now) {
    for (let i = this.chakris.length - 1; i >= 0; i--) {
      const chakri = this.chakris[i];
      const elapsed = now - chakri.startTime;
      const progress = elapsed / chakri.duration;

      if (progress >= 1) {
        this.chakris.splice(i, 1);
        continue;
      }

      chakri.angle += chakri.spinSpeed;
      let intensity = 1.0;
      if (progress > 0.75) intensity = (1 - progress) / 0.25;

      const arms = 3;
      for (let a = 0; a < arms; a++) {
        const armAngle = chakri.angle + (Math.PI * 2 * a) / arms;
        const spawnX = chakri.x + Math.cos(armAngle) * chakri.radius;
        const spawnY = chakri.y + Math.sin(armAngle) * (chakri.radius * 0.4);

        const tangentAngle = armAngle + Math.PI / 2;
        const speed = (5.5 + Math.random() * 5.0) * intensity;

        const color = chakri.palette[Math.floor(Math.random() * chakri.palette.length)];
        this.particles.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(tangentAngle) * speed + (Math.random() * 2 - 1),
          vy: Math.sin(tangentAngle) * speed * 0.45 + (Math.random() * 2 - 1),
          color: color,
          alpha: 1,
          size: 2.0 + Math.random() * 2,
          decay: 0.03 + Math.random() * 0.02,
          gravity: 0.06,
          friction: 0.96
        });
      }
    }
  }

  // 4. PHULJHADI (SPARKLER)
  addSparklerSparks(x, y, count = 10) {
    const palette = ['#FFF8DC', '#FFD700', '#FFA500', '#FFFFFF', '#FF6347'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.5;
      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x: x + (Math.random() * 6 - 3),
        y: y + (Math.random() * 6 - 3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 1,
        size: 1.5 + Math.random() * 2,
        decay: 0.03 + Math.random() * 0.04,
        gravity: 0.08,
        friction: 0.95,
        twinkle: true
      });
    }
  }

  // GRAND FINALE BARRAGE (Celebration)
  launchBarrage(count = 7) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const x = this.width * 0.15 + Math.random() * (this.width * 0.7);
        const y = this.height * 0.10 + Math.random() * (this.height * 0.22);
        this.launchRocket(x, y);
      }, i * 320);
    }
  }

  // 5. AUTONOMOUS FLOOR CELEBRATION (Spontaneous Anars & Chakris on Terrace Floor)
  startAutonomousCelebration() {
    this.stopAutonomousCelebration();
    const horizonY = this.getHorizonY();

    // Spontaneous floor crackers every 4 to 6 seconds
    const triggerNextFloorCracker = () => {
      let x;
      const side = Math.random() > 0.5 ? 'left' : 'right';
      if (side === 'left') {
        x = this.width * 0.08 + Math.random() * (this.width * 0.28);
      } else {
        x = this.width * 0.64 + Math.random() * (this.width * 0.28);
      }
      const y = horizonY + 30 + Math.random() * (this.height - horizonY - 60);

      // Randomly choose between Anar (60%) and Chakri (40%)
      if (Math.random() > 0.4) {
        this.placeAnar(x, y);
      } else {
        this.placeChakri(x, y);
      }

      const nextDelay = 4000 + Math.random() * 2500;
      this.autoCelebrationInterval = setTimeout(triggerNextFloorCracker, nextDelay);
    };

    this.autoCelebrationInterval = setTimeout(triggerNextFloorCracker, 2000);

    // Occasional sky rockets every 9 to 13 seconds
    const triggerNextSkyRocket = () => {
      const x = this.width * 0.2 + Math.random() * (this.width * 0.6);
      const y = this.height * 0.10 + Math.random() * (this.height * 0.20);
      this.launchRocket(x, y);

      const nextDelay = 8500 + Math.random() * 4500;
      this.autoRocketInterval = setTimeout(triggerNextSkyRocket, nextDelay);
    };

    this.autoRocketInterval = setTimeout(triggerNextSkyRocket, 5000);
  }

  stopAutonomousCelebration() {
    if (this.autoCelebrationInterval) {
      clearTimeout(this.autoCelebrationInterval);
      this.autoCelebrationInterval = null;
    }
    if (this.autoRocketInterval) {
      clearTimeout(this.autoRocketInterval);
      this.autoRocketInterval = null;
    }
  }

  clearAll() {
    this.particles = [];
    this.rockets = [];
    this.anars = [];
    this.chakris = [];
    this.stopAutonomousCelebration();
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  startLoop() {
    this.isRunning = true;
    const animate = (now) => {
      if (!this.isRunning) return;
      this.render(now);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  render(now) {
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'lighter';

    // Update & draw Anars
    this.updateAnars(now);
    for (const anar of this.anars) {
      this.drawAnarBase(anar);
    }

    // Update & draw Chakris
    this.updateChakris(now);
    for (const chakri of this.chakris) {
      this.drawChakriBase(chakri);
    }

    // Update & draw Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;

      this.particles.push({
        x: r.x + (Math.random() * 4 - 2),
        y: r.y + (Math.random() * 4 - 2),
        vx: -r.vx * 0.1 + (Math.random() * 2 - 1),
        vy: -r.vy * 0.1 + (Math.random() * 2 - 1),
        color: '#FFA500',
        alpha: 0.85,
        size: 2.2,
        decay: 0.05,
        gravity: 0.02,
        friction: 0.96
      });

      // Rocket reached target height in the sky above the housing
      if (r.y <= r.targetY) {
        this.createExplosion(r.targetX, r.targetY, r.palette);
        this.rockets.splice(i, 1);
      }
    }

    // Update & draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.isFlash) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 230, 150, ${Math.max(0, p.alpha)})`;
        this.ctx.fill();
        p.alpha -= p.decay;
        if (p.alpha <= 0) this.particles.splice(i, 1);
        continue;
      }

      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      let drawAlpha = p.alpha;
      if (p.twinkle && Math.random() < 0.3) {
        drawAlpha *= 0.3;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, drawAlpha);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawAnarBase(anar) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(anar.x - 12, anar.y);
    this.ctx.lineTo(anar.x + 12, anar.y);
    this.ctx.lineTo(anar.x + 4, anar.y - 16);
    this.ctx.lineTo(anar.x - 4, anar.y - 16);
    this.ctx.closePath();
    this.ctx.fillStyle = '#b7410e';
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(anar.x, anar.y - 16, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawChakriBase(chakri) {
    this.ctx.save();
    this.ctx.translate(chakri.x, chakri.y);
    this.ctx.scale(1, 0.45);
    this.ctx.rotate(chakri.angle);

    this.ctx.beginPath();
    this.ctx.arc(0, 0, chakri.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#c0392b';
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      this.ctx.moveTo(0, 0);
      this.ctx.quadraticCurveTo(
        Math.cos(a) * 10,
        Math.sin(a) * 10,
        Math.cos(a + 0.8) * chakri.radius,
        Math.sin(a + 0.8) * chakri.radius
      );
    }
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ff6b6b';
    this.ctx.shadowBlur = 12;
    this.ctx.fill();

    this.ctx.restore();
  }
}

window.FireworksEngine = FireworksEngine;
