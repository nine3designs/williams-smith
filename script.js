
  document.addEventListener('DOMContentLoaded', () => {
    // --- 0. MULTI-PAGE GATE — inner pages bounce to the envelope if not unlocked ---
    const isGatePage = !!document.getElementById('saveTheDateView');
    let preUnlocked = false;
    try { preUnlocked = localStorage.getItem('nv_wedding_unlocked') === 'true'; } catch (err) {}
    if (!isGatePage && !preUnlocked) { location.replace('index.html'); return; }
    if (!isGatePage) {
      document.body.classList.remove('locked');
      const gateSec = document.querySelector('.page-section');
      if (gateSec) gateSec.classList.add('active');
    }

    // --- DOM ELEMENTS ---
    const stage = document.getElementById('stage');
    const envelope = document.getElementById('envelope');
    const openFormBtn = document.getElementById('openFormBtn');
    const replayBtn = document.getElementById('replayBtn');
    const openPwModalBtn = document.getElementById('openPwModalBtn');

    const modalOverlay = document.getElementById('modalOverlay');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const detailsForm = document.getElementById('detailsForm');
    const submitBtn = document.getElementById('submitBtn');

    const pwModalOverlay = document.getElementById('pwModalOverlay');
    const closePwModalBtn = document.getElementById('closePwModalBtn');
    const passwordForm = document.getElementById('passwordForm');
    const sitePasswordInput = document.getElementById('sitePassword');
    const pwError = document.getElementById('pwError');

    const saveTheDateView = document.getElementById('saveTheDateView');
    const fullSiteView = document.getElementById('fullSiteView');

    // CONFIGURATION: guest password for early access
    const ACCESS_PASSWORD = 'natandvik';

    if (stage && envelope && replayBtn) {      // --- 1. ENVELOPE ANIMATION ---
    let isOpened = false;

    // Position the risen card so it always fits fully on screen
    function fitOpenedCard() {
      const cardEl = stage.querySelector('.card');
      const actsEl = stage.querySelector('.actions');
      if (!cardEl) return;
      const sRect = stage.getBoundingClientRect();
      const eRect = envelope.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(envelope).fontSize) || 16;
      const topPad = Math.max(64, sRect.height * 0.08);
      const avail = sRect.height - topPad - (actsEl ? actsEl.offsetHeight : 104) - 26;
      const w = Math.max(150, Math.min(330, sRect.width * 0.8, avail / 1.406));
      cardEl.style.width = w.toFixed(1) + 'px';
      const cardH = w * (984 / 700);
      const desiredTop = topPad + Math.max(0, (avail - cardH) / 2);
      const restBottom = (eRect.bottom - sRect.top) - 0.35 * em;
      stage.style.setProperty('--card-lift', (-(restBottom - cardH - desiredTop)).toFixed(1) + 'px');
    }

    function openEnvelope() {
      if (!isOpened) {
        fitOpenedCard();
        stage.classList.add('opened');
        envelope.classList.add('opened');
        isOpened = true;
      }
    }

    envelope.addEventListener('click', openEnvelope);
    envelope.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
    });

    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stage.classList.remove('opened');
      envelope.classList.remove('opened');
      isOpened = false;
    });

    window.addEventListener('resize', () => { if (isOpened) fitOpenedCard(); });
    }

    if (openFormBtn && closeFormBtn && modalOverlay && openPwModalBtn && closePwModalBtn && pwModalOverlay) {      // --- 2. MODAL CONTROLS ---
    openFormBtn.addEventListener('click', (e) => { e.stopPropagation(); modalOverlay.classList.add('active'); });
    closeFormBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));

    openPwModalBtn.addEventListener('click', (e) => { e.stopPropagation(); pwModalOverlay.classList.add('active'); });
    closePwModalBtn.addEventListener('click', () => {
      pwModalOverlay.classList.remove('active');
      pwError.style.display = 'none';
    });

    [modalOverlay, pwModalOverlay].forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          if (pwError) pwError.style.display = 'none';
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modalOverlay.classList.remove('active');
        pwModalOverlay.classList.remove('active');
        if (pwError) pwError.style.display = 'none';
      }
    });
    }

    if (isGatePage) {      // --- 3. UNLOCK FULL WEBSITE (choreographed reveal) ---
    const revealVeil = document.getElementById('revealVeil');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function unlockWebsite(fast = false) {
      if (document.body.classList.contains('unlocked')) return;
      document.body.classList.add('unlocked');
      try { localStorage.setItem('nv_wedding_unlocked', 'true'); } catch (err) { /* private mode */ }

      const reveal = () => {
        document.body.classList.remove('locked');
        saveTheDateView.style.display = 'none';
        fullSiteView.style.display = 'flex';
        window.scrollTo(0, 0);
        fullSiteView.classList.add('entering');
        setTimeout(() => fullSiteView.classList.remove('entering'), 1150);
      };

      if (fast || prefersReducedMotion) { reveal(); return; }
      stage.classList.add('farewell');
      revealVeil.classList.add('play');
      setTimeout(reveal, 1150);
      setTimeout(() => {
        revealVeil.classList.remove('play');
        stage.classList.remove('farewell');
      }, 2100);
    }

    let unlocked = false;
    try { unlocked = localStorage.getItem('nv_wedding_unlocked') === 'true'; } catch (err) {}
    if (unlocked) unlockWebsite(true);

    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const unlockBtn = passwordForm.querySelector('button[type="submit"]');
      if (sitePasswordInput.value.trim().toLowerCase() === ACCESS_PASSWORD) {
        pwError.style.display = 'none';
        sitePasswordInput.classList.remove('pw-shake');
        unlockBtn.disabled = true;
        const originalLabel = unlockBtn.textContent;
        unlockBtn.textContent = 'Unlocking\u2026';
        pwModalOverlay.classList.remove('active');
        setTimeout(() => {
          unlockWebsite();
          unlockBtn.disabled = false;
          unlockBtn.textContent = originalLabel;
          sitePasswordInput.value = '';
        }, 350);
      } else {
        pwError.style.display = 'block';
        sitePasswordInput.classList.remove('pw-shake');
        void sitePasswordInput.offsetWidth;
        sitePasswordInput.classList.add('pw-shake');
      }
    });
    }

    // --- 4. SAVE THE DATE DETAILS — database + spreadsheet + email ---
    const DETAILS_ENDPOINT = 'https://api.getjuno.com/api/v1/db/exposures/AYBCou2i705fizmEQc9dGBAMzu_ltx9DVUOYrE6jAvE7pnW8jdnXSdnNE2thuCzfTQ';

    async function postJson(url, payload) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    }

    // Live mirror: also posts straight into the Google Sheet (no-cors fire-and-forget)
    const SHEET_WEBAPP = 'https://script.google.com/macros/s/AKfycbxNsvc29aiCfJMy5sTI4FdfAicKPOE-d3rBNPREtm1RufRvcM5zmsDkXe39NmdushtS/exec';
    function postToSheet(tab, values) {
      const safe = values.map(v => (typeof v === 'string' && /^[+=]/.test(v) ? "'" + v : v));
      fetch(SHEET_WEBAPP, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ tab: tab, values: safe })
      }).catch(() => {});
    }

    if (detailsForm && submitBtn && modalOverlay) {      detailsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalBtnText = submitBtn.innerText;
      submitBtn.innerText = 'Sending…';
      submitBtn.disabled = true;

      const formData = new FormData(detailsForm);
      const stamp = new Date().toISOString();

      const stampUK = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      postToSheet('Save the Date Details', [formData.get('fullName'), formData.get('email'), formData.get('phone'), formData.get('address'), formData.get('inviteFormat'), stampUK]);

      try {
        const [dbWrite, mailResp] = await Promise.allSettled([
          postJson(DETAILS_ENDPOINT, {
            name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            invite_format: formData.get('inviteFormat'),
            submitted_at: stamp
          }),
          fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
        ]);
        let okMail = false;
        if (mailResp.status === 'fulfilled' && mailResp.value.ok) {
          try { const mailJson = await mailResp.value.json(); okMail = mailJson.success !== false; }
          catch (_) { okMail = true; }
        }
        const okDb = dbWrite.status === 'fulfilled' && dbWrite.value;

        if (okMail || okDb) {
          detailsForm.reset();
          modalOverlay.classList.remove('active');
          showToast('Thank you! Your address details have been sent.');
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        showToast('Submission failed. Please try again later.', true);
      } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
      }
    });
    }

    // Elegant toast instead of browser alert
    function showToast(message, isError = false) {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:max(1.2rem, env(safe-area-inset-bottom))',
        'transform:translateX(-50%) translateY(20px)', 'z-index:2000',
        'max-width:min(92vw, 420px)', 'padding:.9rem 1.2rem', 'text-align:center',
        'background:' + (isError ? '#5b3a35' : 'var(--blue-ink)'), 'color:#f4efe6',
        'font-size:.9rem', 'letter-spacing:.02em', 'border-radius:12px',
        'box-shadow:0 12px 30px rgba(30,45,55,.35)', 'opacity:0',
        'transition:opacity .35s ease, transform .35s ease', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(16px)';
        setTimeout(() => toast.remove(), 400);
      }, 3400);
    }

    // --- 5. NAVIGATION ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');

    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navbar.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        navbar.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // --- 5b. "The Wedding" dropdown — real pages now ---
    const weddingMenu = document.getElementById('weddingMenu');
    if (weddingMenu) {
      const weddingParentLink = weddingMenu.querySelector('.nav-parent');
      const desktopNav = window.matchMedia('(min-width: 64rem)');
      weddingParentLink.addEventListener('click', (e) => {
        // Mobile: first tap opens the submenu; tap again (or on desktop) goes to the page
        if (!desktopNav.matches && !weddingMenu.classList.contains('open')) {
          e.preventDefault();
          weddingMenu.classList.add('open');
          weddingParentLink.setAttribute('aria-expanded', 'true');
        }
      });
      desktopNav.addEventListener('change', () => {
        weddingMenu.classList.remove('open');
        weddingParentLink.setAttribute('aria-expanded', 'false');
      });
    }

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });

    if (document.getElementById('countdownDigits')) {      // --- 6. COUNTDOWN TIMER (5th June 2028, 1:30 PM) ---
    const weddingDate = new Date('June 5, 2028 13:30:00').getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = weddingDate - now;

      if (diff <= 0) {
        document.getElementById('countdownDigits').innerHTML = "<p style='font-size:1.1rem;margin:0;'>The Big Day is Here! 🎉</p>";
        return;
      }

      const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById('cdDays').textContent  = String(days).padStart(2, '0');
      document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
      document.getElementById('cdMins').textContent  = String(mins).padStart(2, '0');
      document.getElementById('cdSecs').textContent  = String(secs).padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
    }

    if (fullRsvpForm && dietarySelect) {      // --- 7. RSVP — database + spreadsheet + email ---
    const RSVP_ENDPOINT = 'https://api.getjuno.com/api/v1/db/exposures/AYtKhHtirUQBi955d7BK4geFlLkxSAYJXjfsbWjZZAiO1Oh-TvP-e4QhnK-UZH8jjg';
    const fullRsvpForm = document.getElementById('fullRsvpForm');
    const rsvpSubmitBtn = document.getElementById('rsvpSubmitBtn');
    const rsvpSuccess = document.getElementById('rsvpSuccess');
    const rsvpError = document.getElementById('rsvpError');

    const dietarySelect = document.getElementById('dietary');
    const dietaryOther = document.getElementById('dietaryOther');
    dietarySelect.addEventListener('change', () => {
      const other = dietarySelect.value === 'Other (please specify)';
      dietaryOther.style.display = other ? 'block' : 'none';
      if (!other) dietaryOther.value = '';
    });

    fullRsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const originalBtnText = rsvpSubmitBtn.innerText;
      rsvpSubmitBtn.innerText = 'Sending…';
      rsvpSubmitBtn.disabled = true;
      rsvpSuccess.style.display = 'none';
      rsvpError.style.display = 'none';

      const formData = new FormData(fullRsvpForm);
      const stamp = new Date().toISOString();

      const stampUK = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      postToSheet('RSVPs', [formData.get('name'), formData.get('email'), formData.get('attending'), formData.get('dietary'), formData.get('dietary_details'), formData.get('songRequest'), stampUK]);

      try {
        const [dbWrite, mailResp] = await Promise.allSettled([
          postJson(RSVP_ENDPOINT, {
            name: formData.get('name'),
            email: formData.get('email'),
            attending: formData.get('attending'),
            dietary: formData.get('dietary'),
            dietary_details: formData.get('dietary_details'),
            song_request: formData.get('songRequest'),
            submitted_at: stamp
          }),
          fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
        ]);
        let okMail = false;
        if (mailResp.status === 'fulfilled' && mailResp.value.ok) {
          try { const mailJson = await mailResp.value.json(); okMail = mailJson.success !== false; }
          catch (_) { okMail = true; }
        }
        const okDb = dbWrite.status === 'fulfilled' && dbWrite.value;

        if (okMail || okDb) {
          fullRsvpForm.reset();
          dietaryOther.style.display = 'none';
          rsvpSuccess.style.display = 'block';
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        rsvpError.style.display = 'block';
      } finally {
        rsvpSubmitBtn.innerText = originalBtnText;
        rsvpSubmitBtn.disabled = false;
      }
    });
    }

    // --- 8. FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-answer').style.maxHeight = '0px';
            other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : '0px';
      });
    });

    // --- 9. PHOTO DROPZONE PREVIEW ---
    const dropzone = document.getElementById('dropzone');
    const photoInput = document.getElementById('photoInput');
    const filePreviewList = document.getElementById('filePreviewList');

    if (dropzone && photoInput) {
      dropzone.addEventListener('click', () => photoInput.click());
      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); photoInput.click(); }
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--sage-deep)';
        dropzone.style.background = 'rgba(255,255,255,0.95)';
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
        if (e.dataTransfer.files.length) displayPreviews(e.dataTransfer.files);
      });

      photoInput.addEventListener('change', () => {
        if (photoInput.files.length) displayPreviews(photoInput.files);
      });

      function displayPreviews(files) {
        Array.from(files).forEach(file => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = document.createElement('img');
              img.src = e.target.result;
              img.alt = file.name;
              filePreviewList.appendChild(img);
            };
            reader.readAsDataURL(file);
          }
        });
      }
    }
  });
