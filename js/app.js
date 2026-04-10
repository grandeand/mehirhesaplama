// ============================================
// MEHIR HESAPLAMA - APP CONTROLLER
// Wizard management, animations, sharing
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- STATE ----
  let currentStep = 0;
  const totalSteps = 4;
  let selectedGender = null; // 'male' or 'female'
  let malePreferences = null; // onboard answers for male users
  let userName = ''; // name for leaderboard

  // Init Leaderboard (Supabase)
  Leaderboard.init();

  // ---- DOM REFS ----
  const screens = {
    landing: document.getElementById('screen-landing'),
    gender: document.getElementById('screen-gender'),
    name: document.getElementById('screen-name'),
    onboard: document.getElementById('screen-onboard'),
    wizard: document.getElementById('screen-wizard'),
    results: document.getElementById('screen-results')
  };

  const steps = document.querySelectorAll('.wizard-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const btnStart = document.getElementById('btn-start');
  const btnGenderFemale = document.getElementById('btn-gender-female');
  const btnGenderMale = document.getElementById('btn-gender-male');
  const btnNameNext = document.getElementById('btn-name-next');
  const inputUserName = document.getElementById('input-user-name');
  const inputPartnerName = document.getElementById('input-partner-name');
  const btnOnboardBack = document.getElementById('btn-onboard-back');
  const btnOnboardNext = document.getElementById('btn-onboard-next');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-prev');
  const btnRestart = document.getElementById('btn-restart');

  // ---- SPARKLES ----
  function createSparkles() {
    const container = document.querySelector('.sparkle-container');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.animationDuration = (5 + Math.random() * 10) + 's';
      sparkle.style.animationDelay = Math.random() * 10 + 's';
      sparkle.style.width = (2 + Math.random() * 3) + 'px';
      sparkle.style.height = sparkle.style.width;
      container.appendChild(sparkle);
    }
  }
  createSparkles();

  // ---- SCREEN MANAGEMENT ----
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ---- GENDER-BASED LABEL UPDATE ----
  function updateLabelsForGender(gender) {
    const key = gender === 'male' ? 'data-label-male' : 'data-label-female';
    document.querySelectorAll('[data-label-male]').forEach(el => {
      const label = el.getAttribute(key);
      if (label) el.textContent = label;
    });
  }

  // ---- STEP MANAGEMENT ----
  function showStep(stepIndex) {
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === stepIndex);
    });

    // Update progress
    progressSteps.forEach((p, i) => {
      p.classList.remove('active', 'completed');
      if (i < stepIndex) p.classList.add('completed');
      if (i === stepIndex) p.classList.add('active');
    });

    // Button states
    btnPrev.style.display = stepIndex === 0 ? 'none' : '';
    btnNext.textContent = stepIndex === totalSteps - 1 ? '✨ Hesapla' : 'Devam →';
    btnNext.classList.toggle('calculate-btn', stepIndex === totalSteps - 1);

    currentStep = stepIndex;
  }

  // ---- CHIP SELECTION ----
  document.querySelectorAll('.chip-group').forEach(group => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // ---- RANGE SLIDER VALUE DISPLAY ----
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const valueDisplay = slider.closest('.slider-container')?.querySelector('.slider-value');
    if (!valueDisplay) return;

    function update() {
      const suffix = slider.dataset.suffix || '';
      const prefix = slider.dataset.prefix || '';
      if (slider.id === 'slider-income') {
        const formatted = new Intl.NumberFormat('tr-TR').format(parseInt(slider.value));
        valueDisplay.textContent = formatted + ' ₺';
      } else {
        valueDisplay.textContent = prefix + slider.value + suffix;
      }

      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const val = parseFloat(slider.value);
      const pct = ((val - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(to right, #D4A843 0%, #D4A843 ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;

      valueDisplay.classList.add('bump');
      setTimeout(() => valueDisplay.classList.remove('bump'), 150);
    }

    slider.addEventListener('input', update);
    update();
  });

  // ---- NAME INPUT VALIDATION ----
  inputUserName?.addEventListener('input', () => {
    const val = inputUserName.value.trim();
    btnNameNext.disabled = val.length < 2;
  });

  // ---- BMI AUTO-CALCULATION ----
  const heightInput = document.getElementById('input-height');
  const weightInput = document.getElementById('input-weight');
  const bmiDisplay = document.getElementById('bmi-display');

  function updateBMI() {
    const h = parseFloat(heightInput?.value);
    const w = parseFloat(weightInput?.value);
    if (!h || !w || h < 100 || w < 30) {
      if (bmiDisplay) bmiDisplay.style.display = 'none';
      return;
    }

    const bmi = w / Math.pow(h / 100, 2);
    const bmiVal = document.getElementById('bmi-val');
    const bmiCat = document.getElementById('bmi-cat');

    if (bmiVal) bmiVal.textContent = bmi.toFixed(1);

    let category, className;
    if (bmi < 18.5) { category = 'Zayıf'; className = 'underweight'; }
    else if (bmi < 22) { category = 'İdeal ✨'; className = 'ideal'; }
    else if (bmi < 25) { category = 'Normal'; className = 'normal'; }
    else if (bmi < 30) { category = 'Kilolu'; className = 'overweight'; }
    else { category = 'Obez'; className = 'obese'; }

    if (bmiCat) {
      bmiCat.textContent = category;
      bmiCat.className = 'bmi-category ' + className;
    }

    if (bmiDisplay) bmiDisplay.style.display = 'flex';
  }

  heightInput?.addEventListener('input', updateBMI);
  weightInput?.addEventListener('input', updateBMI);

  // ---- FORM DATA COLLECTION ----
  function getSelectedChipValue(groupId) {
    const selected = document.querySelector(`#${groupId} .chip.selected`);
    return selected?.dataset.value || null;
  }

  function getFormData() {
    return {
      gender: selectedGender,
      preferences: malePreferences,

      // Physical
      age: parseInt(document.getElementById('slider-age')?.value) || 25,
      height: parseFloat(heightInput?.value) || 165,
      weight: parseFloat(weightInput?.value) || 60,
      faceRating: parseInt(document.getElementById('slider-face')?.value) || 5,
      breastSize: getSelectedChipValue('chips-breast') || 'ortalama',
      shoeSize: getSelectedChipValue('chips-shoe') || '36.5',
      hairColor: getSelectedChipValue('chips-hair') || 'koyu_kahve',
      eyeColor: getSelectedChipValue('chips-eye') || 'kahve',
      skinTone: getSelectedChipValue('chips-skin') || 'bugday',

      // Demographic
      virginity: getSelectedChipValue('chips-virginity') || 'evet',
      marriageHistory: getSelectedChipValue('chips-marriage') || 'ilk',
      children: parseInt(getSelectedChipValue('chips-children') || '0'),

      // Education
      education: getSelectedChipValue('chips-education') || 'lisans',
      occupation: getSelectedChipValue('chips-occupation') || 'calisan',
      income: parseInt(document.getElementById('slider-income')?.value) || 30000,

      // Character
      religion: parseInt(document.getElementById('slider-religion')?.value) || 5,
      housekeeping: parseInt(document.getElementById('slider-housekeeping')?.value) || 5,
      morals: parseInt(document.getElementById('slider-morals')?.value) || 5,
      sociality: parseInt(document.getElementById('slider-sociality')?.value) || 5,
      familyBackground: getSelectedChipValue('chips-family') || 'orta'
    };
  }

  // ---- COLLECT ONBOARD PREFERENCES ----
  function collectPreferences() {
    return {
      priority: getSelectedChipValue('chips-pref-priority') || 'fiziksel',
      bodyType: getSelectedChipValue('chips-pref-body') || 'farketmez',
      style: getSelectedChipValue('chips-pref-style') || 'farketmez',
      conservatism: getSelectedChipValue('chips-pref-conserv') || 'orta'
    };
  }

  // ---- VALIDATION ----
  function validateStep(stepIndex) {
    const step = steps[stepIndex];
    const chipGroups = step.querySelectorAll('.chip-group');
    for (const group of chipGroups) {
      if (!group.querySelector('.chip.selected')) {
        const first = group.querySelector('.chip');
        if (first) first.classList.add('selected');
      }
    }
    return true;
  }

  // ---- CONFETTI ----
  function launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#D4A843', '#F0D68A', '#9E7A2F', '#FFD700', '#C0C0C0', '#B9F2FF', '#6C3FA0'];

    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 1.5 + 's';
      piece.style.width = (4 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 10) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 5000);
  }

  // ---- SHOW RESULTS ----
  async function showResults(result) {
    showScreen('results');
    shareCanvas = null; // Reset share card for fresh generation

    // Tier badge
    const badge = document.getElementById('result-tier');
    badge.textContent = result.tier.emoji + ' ' + result.tier.name + ' Seviye';
    badge.className = 'result-tier-badge ' + result.tier.class;

    // Gram value with count-up animation
    const gramEl = document.getElementById('result-grams');
    animateNumber(gramEl, 0, result.totalGrams, 1500);

    // TL value
    const tlEl = document.getElementById('result-tl');
    tlEl.textContent = '≈ ' + MehirCalculator.formatTL(result.totalTL);

    // Comment
    document.getElementById('result-comment-text').textContent = result.comment;

    // Category bars
    setTimeout(() => {
      document.getElementById('bar-physical').style.width = result.categoryScores.physical + '%';
      document.getElementById('bar-demographic').style.width = result.categoryScores.demographic + '%';
      document.getElementById('bar-education').style.width = result.categoryScores.education + '%';
      document.getElementById('bar-character').style.width = result.categoryScores.character + '%';

      document.getElementById('val-physical').textContent = result.categoryScores.physical + '%';
      document.getElementById('val-demographic').textContent = result.categoryScores.demographic + '%';
      document.getElementById('val-education').textContent = result.categoryScores.education + '%';
      document.getElementById('val-character').textContent = result.categoryScores.character + '%';
    }, 200);

    // Confetti
    setTimeout(launchConfetti, 300);

    // Store for sharing
    window._lastResult = result;

    // ---- LEADERBOARD: Save & Display ----
    try {
      // Save to Supabase
      await Leaderboard.saveScore(userName, result.totalGrams, result.tier.class, selectedGender);

      // Fetch & render leaderboard
      const top10 = await Leaderboard.getTop10();
      const surrounding = await Leaderboard.getSurrounding(result.totalGrams, userName);

      Leaderboard.renderLeaderboard('leaderboard-container', top10, surrounding, {
        name: userName,
        score: result.totalGrams,
        tier: result.tier.class
      });
    } catch (e) {
      console.error('Leaderboard error:', e);
    }
  }

  // Count-up animation
  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    const formatter = MehirCalculator.formatNumber;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      el.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ---- SHARE (Image-based) ----
  let shareCanvas = null;

  function generateShareCard() {
    if (!window._lastResult || !shareCanvas) {
      shareCanvas = ShareCard.generate(window._lastResult, userName, selectedGender);
    }
    return shareCanvas;
  }

  // Main share button — uses Web Share API on mobile
  document.getElementById('share-native')?.addEventListener('click', async () => {
    const canvas = generateShareCard();
    const shared = await ShareCard.shareNative(canvas, window._lastResult, userName);
    if (!shared) {
      ShareCard.download(canvas, userName);
    }
  });

  // ---- PROFILE MODAL ----
  const profileModal = document.getElementById('profile-modal');

  document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    profileModal?.classList.remove('hidden');
  });

  document.getElementById('modal-close')?.addEventListener('click', () => {
    profileModal?.classList.add('hidden');
  });

  // Close modal on overlay click
  profileModal?.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.add('hidden');
  });

  // Save profile
  document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-profile');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Kaydediliyor...';
    btn.disabled = true;

    const profileData = {
      email: document.getElementById('input-email')?.value.trim() || '',
      instagram: document.getElementById('input-instagram')?.value.trim().replace('@', '') || '',
      twitter: document.getElementById('input-twitter')?.value.trim().replace('@', '') || '',
      tiktok: document.getElementById('input-tiktok')?.value.trim().replace('@', '') || ''
    };

    const success = await Leaderboard.updateProfile(profileData);

    if (success) {
      btn.textContent = '✅ Kaydedildi!';

      // Re-render leaderboard with updated social data
      try {
        const top10 = await Leaderboard.getTop10();
        const surrounding = await Leaderboard.getSurrounding(window._lastResult.totalGrams, userName);
        Leaderboard.renderLeaderboard('leaderboard-container', top10, surrounding, {
          name: userName,
          score: window._lastResult.totalGrams,
          tier: window._lastResult.tier.class
        });
      } catch (e) { console.error(e); }

      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        profileModal?.classList.add('hidden');
      }, 1500);
    } else {
      btn.textContent = '❌ Hata! Tekrar dene';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = originalText; }, 2000);
    }
  });

  // ---- EVENT HANDLERS ----

  // Landing → Gender
  btnStart.addEventListener('click', () => {
    showScreen('gender');
  });

  // Gender: Female → Name screen
  btnGenderFemale.addEventListener('click', () => {
    selectedGender = 'female';
    malePreferences = null;
    updateLabelsForGender('female');
    document.querySelectorAll('.male-only').forEach(el => el.classList.add('hidden'));

    // Reset "İnşallah" selection
    const insallah = document.querySelector('#chips-virginity [data-value="insallah"]');
    if (insallah && insallah.classList.contains('selected')) {
      insallah.classList.remove('selected');
      document.querySelector('#chips-virginity [data-value="evet"]').classList.add('selected');
    }

    showScreen('name');
  });

  // Name → Wizard (Female)
  btnNameNext.addEventListener('click', () => {
    const name = inputUserName.value.trim();
    if (name.length < 2) return;
    userName = name;
    showScreen('wizard');
    showStep(0);
  });

  // Enter key on name input
  inputUserName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnNameNext.disabled) {
      btnNameNext.click();
    }
  });

  // Gender: Male → Onboard
  btnGenderMale.addEventListener('click', () => {
    selectedGender = 'male';
    updateLabelsForGender('male');
    document.querySelectorAll('.male-only').forEach(el => el.classList.remove('hidden'));
    showScreen('onboard');
  });

  // Onboard: Back → Gender
  btnOnboardBack.addEventListener('click', () => {
    showScreen('gender');
  });

  // Onboard: Next → Wizard (collect preferences + partner name)
  btnOnboardNext.addEventListener('click', () => {
    const partnerName = inputPartnerName?.value.trim();
    if (!partnerName || partnerName.length < 2) {
      // Highlight the input
      inputPartnerName?.focus();
      inputPartnerName?.classList.add('input-error');
      setTimeout(() => inputPartnerName?.classList.remove('input-error'), 1500);
      return;
    }
    userName = partnerName;
    malePreferences = collectPreferences();
    showScreen('wizard');
    showStep(0);
  });

  btnNext.addEventListener('click', () => {
    validateStep(currentStep);

    if (currentStep < totalSteps - 1) {
      showStep(currentStep + 1);
      screens.wizard.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Calculate!
      const data = getFormData();
      const result = MehirCalculator.calculate(data);
      showResults(result);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  });

  btnRestart.addEventListener('click', () => {
    // Reset form
    document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('input[type="range"]').forEach(s => {
      s.value = s.defaultValue;
      s.dispatchEvent(new Event('input'));
    });
    document.querySelectorAll('.number-input').forEach(i => i.value = '');

    // Reset name inputs
    if (inputUserName) inputUserName.value = '';
    if (inputPartnerName) inputPartnerName.value = '';
    if (btnNameNext) btnNameNext.disabled = true;

    // Reset results bars
    document.querySelectorAll('.category-bar-fill').forEach(b => b.style.width = '0%');

    // Reset leaderboard
    const lbContainer = document.getElementById('leaderboard-container');
    if (lbContainer) lbContainer.innerHTML = '';

    selectedGender = null;
    malePreferences = null;
    userName = '';
    showScreen('landing');
    currentStep = 0;
    loadLandingLeaderboard();
  });

  // ---- LANDING LEADERBOARD ----
  async function loadLandingLeaderboard() {
    try {
      const top10 = await Leaderboard.getTop10();
      if (top10.length === 0) return;

      Leaderboard.renderLandingLeaderboard('landing-leaderboard-container', top10);
    } catch (e) {
      console.error('Landing leaderboard error:', e);
    }
  }

  // ---- INIT ----
  showScreen('landing');
  loadLandingLeaderboard();

});
