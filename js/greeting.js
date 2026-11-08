/**
 * Diwali Personalized Greeting Card Manager
 * Handles URL parameter parsing, live card customization, share link generation,
 * WhatsApp direct sharing, and PNG card download via html2canvas.
 */

class GreetingCardManager {
  constructor() {
    this.toInput = document.getElementById('input-to');
    this.fromInput = document.getElementById('input-from');
    this.msgSelect = document.getElementById('select-msg');
    this.customMsgInput = document.getElementById('input-custom-msg');

    this.cardToEl = document.getElementById('card-to-display');
    this.cardFromEl = document.getElementById('card-from-display');
    this.cardMsgEl = document.getElementById('card-msg-display');
    this.cardContainer = document.getElementById('greeting-card-preview');

    this.personalizedHeroBanner = document.getElementById('personalized-hero-banner');
    this.shareToast = document.getElementById('share-toast');

    this.presetMessages = [
      "May the divine light of Diwali illuminate your life with health, wealth, and eternal joy.",
      "Wishing you and your family a dazzling and blessed Diwali filled with peace and sweet memories.",
      "May Goddess Lakshmi bless your home with boundless prosperity, radiance, and limitless happiness.",
      "Light a diya of love, blast a rocket of prosperity, and ignite a fountain of success this Deepavali!"
    ];

    this.init();
  }

  init() {
    this.loadFromUrlParams();
    this.bindEvents();
    this.updateCard();
  }

  loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    const fromParam = params.get('from');
    const msgParam = params.get('msg');

    if (toParam && this.toInput) {
      this.toInput.value = toParam.trim();
    }
    if (fromParam && this.fromInput) {
      this.fromInput.value = fromParam.trim();
    }
    if (msgParam) {
      const msgIndex = parseInt(msgParam, 10);
      if (!isNaN(msgIndex) && msgIndex >= 0 && msgIndex < this.presetMessages.length) {
        if (this.msgSelect) this.msgSelect.value = msgIndex;
      } else if (this.customMsgInput) {
        if (this.msgSelect) this.msgSelect.value = 'custom';
        this.customMsgInput.value = msgParam;
        this.customMsgInput.classList.remove('hidden');
      }
    }

    // If page was loaded with a personalized 'to' or 'from', show welcome alert in Hero!
    if ((toParam || fromParam) && this.personalizedHeroBanner) {
      const recipient = toParam ? `Dearest ${toParam}` : 'Dear Friend';
      const sender = fromParam ? `from ${fromParam}` : '';
      this.personalizedHeroBanner.innerHTML = `
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium shadow-lg backdrop-blur-md animate-fade-in">
          <span>✨</span>
          <span>A Special Diwali Blessing for <strong>${recipient}</strong> ${sender}</span>
          <span>✨</span>
        </div>
      `;
      this.personalizedHeroBanner.classList.remove('hidden');
    }
  }

  bindEvents() {
    const inputs = [this.toInput, this.fromInput, this.customMsgInput];
    inputs.forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.updateCard());
      }
    });

    if (this.msgSelect) {
      this.msgSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          if (this.customMsgInput) this.customMsgInput.classList.remove('hidden');
        } else {
          if (this.customMsgInput) this.customMsgInput.classList.add('hidden');
        }
        this.updateCard();
      });
    }

    // Share buttons
    const copyBtn = document.getElementById('btn-copy-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyShareLink());
    }

    const whatsappBtn = document.getElementById('btn-share-whatsapp');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', () => this.shareOnWhatsApp());
    }

    const downloadBtn = document.getElementById('btn-download-card');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadCardImage());
    }
  }

  getCurrentMessage() {
    if (this.msgSelect && this.msgSelect.value === 'custom') {
      return this.customMsgInput && this.customMsgInput.value.trim() 
        ? this.customMsgInput.value.trim() 
        : this.presetMessages[0];
    }
    const idx = parseInt(this.msgSelect?.value || '0', 10);
    return this.presetMessages[idx] || this.presetMessages[0];
  }

  updateCard() {
    const toName = this.toInput?.value.trim() || 'My Dear Friend';
    const fromName = this.fromInput?.value.trim() || 'Well Wisher';
    const message = this.getCurrentMessage();

    if (this.cardToEl) {
      this.cardToEl.textContent = `Dear ${toName},`;
    }
    if (this.cardFromEl) {
      this.cardFromEl.textContent = `Warm Wishes From: ${fromName}`;
    }
    if (this.cardMsgEl) {
      this.cardMsgEl.textContent = message;
    }
  }

  generateShareUrl() {
    const url = new URL(window.location.origin + window.location.pathname);
    const to = this.toInput?.value.trim();
    const from = this.fromInput?.value.trim();

    if (to) url.searchParams.set('to', to);
    if (from) url.searchParams.set('from', from);

    if (this.msgSelect?.value === 'custom') {
      const custom = this.customMsgInput?.value.trim();
      if (custom) url.searchParams.set('msg', custom);
    } else if (this.msgSelect) {
      url.searchParams.set('msg', this.msgSelect.value);
    }

    return url.toString();
  }

  async copyShareLink() {
    const shareUrl = this.generateShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      this.showToast('Copied festive link to clipboard! Ready to share.');
    } catch (err) {
      // Fallback prompt
      window.prompt('Copy this Diwali wish link:', shareUrl);
    }
  }

  shareOnWhatsApp() {
    const to = this.toInput?.value.trim() || 'Friend';
    const from = this.fromInput?.value.trim() || '';
    const shareUrl = this.generateShareUrl();

    let text = `✨ 🪔 *Shubh Deepavali & Happy Diwali!* 🪔 ✨\n\n`;
    text += `Dear ${to},\n${this.getCurrentMessage()}\n\n`;
    if (from) {
      text += `~ From: ${from}\n\n`;
    }
    text += `Open your personalized Diwali interactive greeting here:\n${shareUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  async downloadCardImage() {
    if (!this.cardContainer) return;

    const toName = (this.toInput?.value.trim() || 'Diwali').replace(/[^a-zA-Z0-9_-]/g, '_');
    this.showToast('Generating festive card image...');

    try {
      // Ensure html2canvas is available
      if (typeof html2canvas === 'undefined') {
        alert('Image generation utility loading, please try in a moment.');
        return;
      }

      const canvas = await html2canvas(this.cardContainer, {
        scale: 2, // High resolution retina capture
        backgroundColor: '#13091f',
        useCORS: true,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Diwali_Wish_For_${toName}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      this.showToast('Card downloaded successfully! 🪔');
    } catch (e) {
      console.error('Failed to download card:', e);
      this.showToast('Unable to export image. Please take a screenshot.');
    }
  }

  showToast(message) {
    if (!this.shareToast) return;
    this.shareToast.textContent = message;
    this.shareToast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
    this.shareToast.classList.add('opacity-100', 'translate-y-0');

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.shareToast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
      this.shareToast.classList.remove('opacity-100', 'translate-y-0');
    }, 2800);
  }
}

window.GreetingCardManager = GreetingCardManager;
