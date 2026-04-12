// ============================================
// MEHIR HESAPLAMA - CALCULATOR ENGINE
// All coefficients, formulas and tier logic
// ============================================

const MehirCalculator = (() => {

  const BASE_GOLD_GRAMS = 30;
  const MAX_GOLD_GRAMS = 1500;
  const MIN_GOLD_GRAMS = 30;

  // Gold price per gram (TL) - fetched dynamically, fallback to static
  let GOLD_PRICE_PER_GRAM = 6800;
  let _goldPricePromise = null;

  async function fetchGoldPrice() {
    try {
      const res = await fetch('https://finans.truncgil.com/today.json');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const price = data?.['gram-altin']?.Alış;
      if (price) {
        GOLD_PRICE_PER_GRAM = Math.round(parseFloat(price.replace(/\./g, '').replace(',', '.')));
      }
    } catch {
      // Keep fallback value
    }
  }

  function initGoldPrice() {
    if (!_goldPricePromise) {
      _goldPricePromise = fetchGoldPrice();
    }
    return _goldPricePromise;
  }

  // ---- COEFFICIENT TABLES ----

  // Age coefficient (peak at 18-22, declines)
  function getAgeCoeff(age) {
    if (age <= 18) return 1.3;
    if (age <= 22) return 1.5;
    if (age <= 25) return 1.4;
    if (age <= 27) return 1.3;
    if (age <= 30) return 1.1;
    if (age <= 32) return 1.0;
    if (age <= 35) return 0.85;
    if (age <= 38) return 0.7;
    if (age <= 42) return 0.6;
    if (age <= 50) return 0.5;
    return 0.4;
  }

  // BMI coefficient
  function getBMICoeff(bmi) {
    if (bmi < 16) return 0.5;
    if (bmi < 18.5) return 0.8;
    if (bmi < 22) return 1.4;    // Ideal
    if (bmi < 25) return 1.2;    // Normal
    if (bmi < 28) return 0.9;
    if (bmi < 32) return 0.7;
    return 0.5;
  }

  // Height coefficient for women (Turkey context)
  function getHeightCoeff(height) {
    if (height < 150) return 0.8;
    if (height < 155) return 0.9;
    if (height < 160) return 1.0;
    if (height < 165) return 1.15;
    if (height < 170) return 1.3;  // Sweet spot
    if (height < 175) return 1.2;
    if (height < 180) return 1.0;
    return 0.85;
  }

  // Face beauty self-rating (1-10) → coefficient
  function getFaceCoeff(rating) {
    // Maps 1-10 to 0.4-1.5
    return 0.4 + (rating - 1) * (1.1 / 9);
  }

  // Breast size coefficients
  const BREAST_COEFFS = {
    'tahta': 0.75,
    'kucuk': 0.95,
    'ortalama': 1.2,
    'buyuk': 1.15,
    'devasa': 1.0
  };

  // Shoe size coefficients
  const SHOE_COEFFS = {
    '35': 1.10,
    '36': 1.15,
    '36.5': 1.20, // Peak
    '37': 1.15,
    '38': 1.10,
    '39': 1.00,
    '40plus': 0.85
  };

  // Hair color coefficients (Turkey market preferences)
  const HAIR_COEFFS = {
    'siyah': 1.0,
    'koyu_kahve': 1.05,
    'kumral': 1.1,
    'sari': 1.15,
    'kizil': 1.1,
    'kestane': 1.05
  };

  // Eye color coefficients
  const EYE_COEFFS = {
    'kahve': 1.0,
    'ela': 1.1,
    'yesil': 1.2,
    'mavi': 1.15,
    'siyah': 0.95
  };

  // Skin tone coefficients (Turkey preferences)
  const SKIN_COEFFS = {
    'acik': 1.1,
    'bugday': 1.05,
    'esmer': 1.0,
    'koyu': 0.95
  };

  // Virginity coefficient
  const VIRGINITY_COEFFS = {
    'evet': 1.5,
    'insallah': 1.2,
    'hayir': 0.7
  };

  // Marriage history
  const MARRIAGE_COEFFS = {
    'ilk': 1.0,
    'ikinci': 0.6,
    'ucuncu_plus': 0.4
  };

  // Children from previous marriage
  function getChildrenCoeff(count) {
    if (count === 0) return 1.0;
    if (count === 1) return 0.8;
    if (count === 2) return 0.65;
    return 0.5;
  }

  // Education level
  const EDUCATION_COEFFS = {
    'ilkokul': 0.6,
    'ortaokul': 0.7,
    'lise': 0.85,
    'onlisans': 1.0,
    'lisans': 1.2,
    'yuksek_lisans': 1.35,
    'doktora': 1.5
  };

  // Occupation
  const OCCUPATION_COEFFS = {
    'calismayan': 0.8,
    'ogrenci': 0.9,
    'calisan': 1.0,
    'profesyonel': 1.2,
    'isveren': 1.3
  };

  // Income (monthly TL)
  function getIncomeCoeff(income) {
    if (income === 0) return 0.8;
    if (income < 20000) return 0.9;
    if (income < 40000) return 1.0;
    if (income < 70000) return 1.1;
    if (income < 100000) return 1.2;
    if (income < 200000) return 1.3;
    if (income < 350000) return 1.4;
    return 1.5;
  }

  // Slider-based ratings (1-10) → coefficient mapping
  function ratingToCoeff(rating, minCoeff, maxCoeff) {
    return minCoeff + (rating - 1) * ((maxCoeff - minCoeff) / 9);
  }

  // Family background
  const FAMILY_COEFFS = {
    'dusuk': 0.8,
    'orta': 1.0,
    'yuksek': 1.2,
    'cok_yuksek': 1.3
  };


  // ---- CATEGORY SCORE CALCULATIONS ----

  function calcPhysicalScore(data) {
    const ageScore = getAgeCoeff(data.age);

    // BMI from height and weight
    const heightM = data.height / 100;
    const bmi = data.weight / (heightM * heightM);
    const bmiScore = getBMICoeff(bmi);

    const heightScore = getHeightCoeff(data.height);
    const faceScore = getFaceCoeff(data.faceRating);
    const breastScore = BREAST_COEFFS[data.breastSize] || 1.0;
    const shoeScore = SHOE_COEFFS[data.shoeSize] || 1.0;
    const hairScore = HAIR_COEFFS[data.hairColor] || 1.0;
    const eyeScore = EYE_COEFFS[data.eyeColor] || 1.0;
    const skinScore = SKIN_COEFFS[data.skinTone] || 1.0;

    // Weighted average for physical category (updated with breast & shoe)
    const score = (
      ageScore * 0.20 +
      bmiScore * 0.15 +
      heightScore * 0.08 +
      faceScore * 0.22 +
      breastScore * 0.10 +
      shoeScore * 0.05 +
      hairScore * 0.07 +
      eyeScore * 0.07 +
      skinScore * 0.06
    );

    return { score, bmi, bmiScore, details: { ageScore, bmiScore, heightScore, faceScore, breastScore, shoeScore, hairScore, eyeScore, skinScore } };
  }

  function calcDemographicScore(data) {
    const virginityScore = VIRGINITY_COEFFS[data.virginity] || 1.0;
    const marriageScore = MARRIAGE_COEFFS[data.marriageHistory] || 1.0;
    const childrenScore = getChildrenCoeff(data.children);

    const score = (
      virginityScore * 0.50 +
      marriageScore * 0.30 +
      childrenScore * 0.20
    );

    return { score, hasTattoo: data.tattoo === 'var', details: { virginityScore, marriageScore, childrenScore } };
  }

  function calcEducationScore(data) {
    const eduScore = EDUCATION_COEFFS[data.education] || 1.0;
    const occScore = OCCUPATION_COEFFS[data.occupation] || 1.0;
    const incScore = getIncomeCoeff(data.income);

    const score = (
      eduScore * 0.50 +
      occScore * 0.25 +
      incScore * 0.25
    );

    return { score, details: { eduScore, occScore, incScore } };
  }

  function calcCharacterScore(data) {
    const religionScore = ratingToCoeff(data.religion, 0.8, 1.3);
    const housekeepingScore = ratingToCoeff(data.housekeeping, 0.8, 1.2);
    const moralScore = ratingToCoeff(data.morals, 0.8, 1.3);
    const socialScore = ratingToCoeff(data.sociality, 0.9, 1.1);
    const familyScore = FAMILY_COEFFS[data.familyBackground] || 1.0;

    const score = (
      religionScore * 0.20 +
      housekeepingScore * 0.20 +
      moralScore * 0.25 +
      socialScore * 0.10 +
      familyScore * 0.25
    );

    return { score, details: { religionScore, housekeepingScore, moralScore, socialScore, familyScore } };
  }

  // ---- TIER SYSTEM ----

  function getTier(grams) {
    if (grams >= 501)  return { name: 'Elmas', emoji: '👑', class: 'diamond' };
    if (grams >= 251)  return { name: 'Platin', emoji: '💎', class: 'platinum' };
    if (grams >= 101)  return { name: 'Altın', emoji: '🥇', class: 'gold' };
    if (grams >= 51)   return { name: 'Gümüş', emoji: '🥈', class: 'silver' };
    return { name: 'Bronz', emoji: '🥉', class: 'bronze' };
  }

  // ---- FUNNY COMMENTS ----

  function getComment(tier, grams, gender) {
    const isMale = gender === 'male';

    const comments = {
      bronze: isMale ? [
        "Dostum, bu kadın için fazla mehir istenmez. Rahat ol 😎",
        "Cüzdan dostu bir seçim! Ekonomik kriz dönemine uygun 💪",
        "Kuyumcuya sadece selamlama amaçlı girersin, alışveriş için değil 😄"
      ] : [
        "Fena değil, en azından asgari şartları sağlıyorsun! 😌",
        "Mütevazı ama kalıcı. Sadelik güzeldir! ✨",
        "Altın sayısı az ama kalp altın! 💛"
      ],
      silver: isMale ? [
        "İyi bir tercih! Ama biraz kuyumcuya yol gözükecek 💰",
        "Bu kız için biraz biriktirmen lazım. Ama değer! 🌟",
        "Orta segment güzellik, orta segment mehir. Adil! ⚖️"
      ] : [
        "Ortalamanın üstünde! Gümüş kalbiyle altın değerinde birisin 🌟",
        "Kuyumcu seni görünce gülümseyecek ama kasayı açmayacak 😄",
        "İyi bir başlangıç! Birkaç kurs ve spor ile altına çıkarsın 💪"
      ],
      gold: isMale ? [
        "Dikkat! Bu kız pahalıya patlar. Bankacınla konuş 🏦",
        "Ciddi bir mehir gerektirecek güzellik. Hazır ol! 💰",
        "Bu kadın altın seviye - cüzdanına altın doldur! 🏆"
      ] : [
        "Altın seviye! Kuyumcu seninle özel ilgilenmek isteyecek 🏆",
        "Bu mehirle düğün salonu bile seçici davranabilirsin! 💍",
        "Ciddi rakamlar! Ailesi bunu duyunca gözleri parlayacak ✨"
      ],
      platinum: isMale ? [
        "Kardeşim bu kız platin! Kredi çekmeye hazır ol 💳",
        "Bu mehri duyan baban 'oğlum vazgeç' diyecek ama sen pes etme 😂",
        "Evi, arabayı sat. Yeterse platin kız senin olur! 💎"
      ] : [
        "Platin seviye! Seni gören damat adayı kredi çekmeye koşacak 💎",
        "Bu rakamlarla evlilik programlarına çıkabilirsin, jüri olarak! 📺",
        "Banka müdürü tanışmak isteyecek... damat adayı adına 😂"
      ],
      diamond: isMale ? [
        "ELMAS KIZ! 👑 Bro, böbrek satmaya hazır mısın?",
        "Bu kız için Jeff Bezos bile düşünür. Sen ne yapacaksın? 🚀",
        "Mehir hesabını gören ailesi 'buyrun efendim' diyecek... damat adayından başka şart yok 👑",
        "Altın dükkanını toptan satın almak gerekebilir! 💎"
      ] : [
        "ELMAS SEVİYE! 👑 Sultanların mehrine rakip oluyorsun!",
        "Bu mehiri duyan damat adayı Bitcoin'e yatırım yapmaya başlayacak 🚀",
        "Tebrikler! Kuyumcu sana özel hat açacak. VIP müşteri statüsündesin! 💎",
        "Altın dükkanının sahibi seni görünce 'hoş geldiniz efendim' diyecek 👑"
      ]
    };

    const tierComments = comments[tier.class] || comments.bronze;
    return tierComments[Math.floor(Math.random() * tierComments.length)];
  }

  // ---- PREFERENCE PROFILE (Male Onboarding) ----

  // Build a multiplier profile from male preferences
  function buildPreferenceProfile(prefs) {
    if (!prefs) return null;

    const profile = {
      // Category weight modifiers (will be applied to base weights)
      categoryWeights: { physical: 0.35, demographic: 0.20, education: 0.25, character: 0.20 },
      // Individual coefficient boosters (multiplied on top of base coefficients)
      coeffBoosters: {}
    };

    // Q1: Priority — shift category weights
    switch (prefs.priority) {
      case 'fiziksel':
        profile.categoryWeights = { physical: 0.45, demographic: 0.15, education: 0.20, character: 0.20 };
        break;
      case 'egitim':
        profile.categoryWeights = { physical: 0.25, demographic: 0.15, education: 0.40, character: 0.20 };
        break;
      case 'din':
        profile.categoryWeights = { physical: 0.25, demographic: 0.20, education: 0.15, character: 0.40 };
        break;
      case 'aile':
        profile.categoryWeights = { physical: 0.25, demographic: 0.35, education: 0.20, character: 0.20 };
        break;
    }

    // Q2: Body type — BMI coefficient boosters
    switch (prefs.bodyType) {
      case 'ince':
        // Prefers low BMI: boost ideal/underweight, penalize overweight
        profile.coeffBoosters.bmiPreference = 'ince';
        break;
      case 'dolgun':
        // Prefers higher BMI: boost normal/overweight, penalize underweight
        profile.coeffBoosters.bmiPreference = 'dolgun';
        break;
      // 'farketmez' = no adjustments
    }

    // Q3: Appearance style — hair/skin/eye boosters
    switch (prefs.style) {
      case 'sarisin':
        profile.coeffBoosters.hairBoost = ['sari', 'kumral'];
        profile.coeffBoosters.skinBoost = ['acik'];
        profile.coeffBoosters.eyeBoost = ['mavi', 'yesil'];
        break;
      case 'esmer':
        profile.coeffBoosters.hairBoost = ['siyah', 'koyu_kahve'];
        profile.coeffBoosters.skinBoost = ['esmer', 'koyu'];
        profile.coeffBoosters.eyeBoost = ['kahve', 'siyah'];
        break;
      case 'egzotik':
        profile.coeffBoosters.hairBoost = ['kizil', 'kestane'];
        profile.coeffBoosters.skinBoost = ['bugday'];
        profile.coeffBoosters.eyeBoost = ['ela', 'yesil'];
        break;
      // 'farketmez' = no adjustments
    }

    // Q4: Conservatism — affects virginity and religion weights
    switch (prefs.conservatism) {
      case 'cok':
        profile.coeffBoosters.virginityMultiplier = 1.3;
        profile.coeffBoosters.religionMultiplier = 1.4;
        profile.coeffBoosters.educationDemote = 0.85;
        break;
      case 'modern':
        profile.coeffBoosters.virginityMultiplier = 0.6;
        profile.coeffBoosters.religionMultiplier = 0.7;
        profile.coeffBoosters.educationDemote = 1.2;
        break;
      // 'orta' = no adjustments
    }

    return profile;
  }

  // Apply preference boosters to individual coefficients
  function applyPreferenceBoosters(rawScore, data, profile) {
    if (!profile || !profile.coeffBoosters) return rawScore;
    let boosted = rawScore;

    // BMI preference adjustment
    if (profile.coeffBoosters.bmiPreference) {
      const heightM = data.height / 100;
      const bmi = data.weight / (heightM * heightM);
      if (profile.coeffBoosters.bmiPreference === 'ince') {
        // Bonus for low BMI, extra penalty for high
        if (bmi < 22) boosted *= 1.1;
        else if (bmi >= 28) boosted *= 0.85;
      } else if (profile.coeffBoosters.bmiPreference === 'dolgun') {
        // Bonus for higher BMI, penalty for too thin
        if (bmi >= 22 && bmi < 28) boosted *= 1.1;
        else if (bmi < 18.5) boosted *= 0.85;
      }
    }

    // Hair/skin/eye preference boosts
    const boostAmount = 1.15;
    if (profile.coeffBoosters.hairBoost && profile.coeffBoosters.hairBoost.includes(data.hairColor)) {
      boosted *= boostAmount;
    }
    if (profile.coeffBoosters.skinBoost && profile.coeffBoosters.skinBoost.includes(data.skinTone)) {
      boosted *= boostAmount;
    }
    if (profile.coeffBoosters.eyeBoost && profile.coeffBoosters.eyeBoost.includes(data.eyeColor)) {
      boosted *= boostAmount;
    }

    return boosted;
  }

  // Apply conservatism to demographic & character scores
  function applyConservatismBoosters(demoScore, charScore, profile) {
    if (!profile || !profile.coeffBoosters) return { demoScore, charScore };

    let adjDemo = demoScore;
    let adjChar = charScore;

    if (profile.coeffBoosters.virginityMultiplier) {
      adjDemo *= profile.coeffBoosters.virginityMultiplier;
    }
    if (profile.coeffBoosters.religionMultiplier) {
      adjChar *= profile.coeffBoosters.religionMultiplier;
    }
    if (profile.coeffBoosters.educationDemote) {
      // Noop here, educationDemote is applied in calculate()
    }

    return { demoScore: adjDemo, charScore: adjChar };
  }

  // ---- MAIN CALCULATION ----

  function calculate(formData) {
    const physical = calcPhysicalScore(formData);
    const demographic = calcDemographicScore(formData);
    const education = calcEducationScore(formData);
    const character = calcCharacterScore(formData);

    // Build preference profile if male
    const profile = formData.gender === 'male' ? buildPreferenceProfile(formData.preferences) : null;

    // Get category weights (default or preference-adjusted)
    const weights = profile ? profile.categoryWeights : { physical: 0.35, demographic: 0.20, education: 0.25, character: 0.20 };

    // Apply preference boosters to physical score
    let adjustedPhysical = profile ? applyPreferenceBoosters(physical.score, formData, profile) : physical.score;

    // Apply conservatism boosters
    let adjustedDemo = demographic.score;
    let adjustedChar = character.score;
    if (profile) {
      const adjusted = applyConservatismBoosters(demographic.score, character.score, profile);
      adjustedDemo = adjusted.demoScore;
      adjustedChar = adjusted.charScore;
    }

    // Apply education demote/promote from conservatism
    let adjustedEdu = education.score;
    if (profile && profile.coeffBoosters.educationDemote) {
      adjustedEdu *= profile.coeffBoosters.educationDemote;
    }

    // Tattoo effect: depends on conservatism level of the male viewer
    // For female users (no preferences), tattoo slightly lowers the score (traditional default)
    if (demographic.hasTattoo) {
      if (profile) {
        const conserv = formData.preferences?.conservatism;
        if (conserv === 'cok') {
          adjustedPhysical *= 0.80;
          adjustedChar *= 0.85;
        } else if (conserv === 'modern') {
          adjustedPhysical *= 1.10;
        }
        // 'orta' → no change
      } else {
        adjustedPhysical *= 0.92;
      }
    }

    // Combine scores with category weights
    const combinedScore = (
      adjustedPhysical * weights.physical +
      adjustedDemo * weights.demographic +
      adjustedEdu * weights.education +
      adjustedChar * weights.character
    );

    const multiplier = Math.pow(combinedScore, 3.5) * 6.67;

    let totalGrams = Math.round(BASE_GOLD_GRAMS * multiplier);
    totalGrams = Math.max(MIN_GOLD_GRAMS, Math.min(MAX_GOLD_GRAMS, totalGrams));

    const tier = getTier(totalGrams);
    const comment = getComment(tier, totalGrams, formData.gender || 'female');
    const totalTL = totalGrams * GOLD_PRICE_PER_GRAM;

    // Normalize category scores to 0-100 for display
    const maxPossibleScore = 1.5;
    const categoryScores = {
      physical: Math.min(100, Math.round((adjustedPhysical / maxPossibleScore) * 100)),
      demographic: Math.min(100, Math.round((adjustedDemo / maxPossibleScore) * 100)),
      education: Math.min(100, Math.round((adjustedEdu / maxPossibleScore) * 100)),
      character: Math.min(100, Math.round((adjustedChar / maxPossibleScore) * 100))
    };

    return {
      totalGrams,
      totalTL,
      tier,
      comment,
      combinedScore,
      multiplier,
      categoryScores,
      bmi: physical.bmi,
      details: {
        physical: physical.details,
        demographic: demographic.details,
        education: education.details,
        character: character.details
      }
    };
  }

  // Format TL currency
  function formatTL(amount) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format number with dots
  function formatNumber(num) {
    return new Intl.NumberFormat('tr-TR').format(num);
  }

  return {
    calculate,
    formatTL,
    formatNumber,
    get GOLD_PRICE_PER_GRAM() { return GOLD_PRICE_PER_GRAM; },
    BASE_GOLD_GRAMS,
    getBMICoeff,
    initGoldPrice
  };

})();
