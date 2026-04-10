// ============================================
// MEHIR HESAPLAMA - LEADERBOARD MODULE
// Supabase integration for scores
// ============================================

const Leaderboard = (() => {

  const SUPABASE_URL = 'https://kqlcslesnehzyczfjmle.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGNzbGVzbmVoenljemZqbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjQzNjksImV4cCI6MjA5MTQwMDM2OX0.HmOwWRDHW_3f36qfL5INR3RnvO1_zDkMOkwf9F6z6dI';

  let supabase = null;
  let lastRecordId = null;

  function init() {
    if (window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.warn('Supabase JS client not loaded');
    }
  }

  // Save a score to leaderboard
  async function saveScore(name, score, tier, gender) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([{ name, score, tier, gender }])
        .select()
        .single();

      if (error) {
        console.error('Leaderboard save error:', error);
        return null;
      }
      lastRecordId = data?.id || null;
      return data;
    } catch (e) {
      console.error('Leaderboard save exception:', e);
      return null;
    }
  }

  // Update profile (social links + email) for the last saved record
  async function updateProfile(profileData) {
    if (!supabase || !lastRecordId) return false;

    try {
      const { error } = await supabase
        .from('leaderboard')
        .update({
          email: profileData.email || null,
          instagram: profileData.instagram || null,
          twitter: profileData.twitter || null,
          tiktok: profileData.tiktok || null
        })
        .eq('id', lastRecordId);

      if (error) {
        console.error('Profile update error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Profile update exception:', e);
      return false;
    }
  }

  function getLastRecordId() {
    return lastRecordId;
  }

  // Get Top 10 scores
  async function getTop10() {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('name, score, tier, gender, instagram, twitter, tiktok')
        .order('score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Leaderboard top10 error:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Leaderboard top10 exception:', e);
      return [];
    }
  }

  // Get surrounding entries (5 above + user + 5 below)
  async function getSurrounding(userScore, userName) {
    if (!supabase) return { above: [], below: [], userRank: 0, totalCount: 0 };

    try {
      const { count: totalCount } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true });

      const { count: higherCount } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', userScore);

      const userRank = (higherCount || 0) + 1;

      const { data: above } = await supabase
        .from('leaderboard')
        .select('name, score, tier, gender, instagram, twitter, tiktok')
        .gt('score', userScore)
        .order('score', { ascending: true })
        .limit(5);

      const { data: below } = await supabase
        .from('leaderboard')
        .select('name, score, tier, gender, instagram, twitter, tiktok')
        .lt('score', userScore)
        .order('score', { ascending: false })
        .limit(5);

      return {
        above: (above || []).reverse(),
        below: below || [],
        userRank,
        totalCount: totalCount || 0
      };
    } catch (e) {
      console.error('Leaderboard surrounding exception:', e);
      return { above: [], below: [], userRank: 0, totalCount: 0 };
    }
  }

  // Build social links HTML
  function socialLinksHTML(entry) {
    let links = '';
    if (entry.instagram) links += `<a href="https://instagram.com/${entry.instagram}" target="_blank" class="lb-social" title="@${entry.instagram}">📷</a>`;
    if (entry.twitter) links += `<a href="https://x.com/${entry.twitter}" target="_blank" class="lb-social" title="@${entry.twitter}">𝕏</a>`;
    if (entry.tiktok) links += `<a href="https://tiktok.com/@${entry.tiktok}" target="_blank" class="lb-social" title="@${entry.tiktok}">🎵</a>`;
    return links;
  }

  // Build clickable name HTML based on social link count
  function nameHTML(entry) {
    const socials = [];
    if (entry.instagram) socials.push({ platform: '📷 Instagram', url: `https://instagram.com/${entry.instagram}`, user: entry.instagram });
    if (entry.twitter) socials.push({ platform: '𝕏 X', url: `https://x.com/${entry.twitter}`, user: entry.twitter });
    if (entry.tiktok) socials.push({ platform: '🎵 TikTok', url: `https://tiktok.com/@${entry.tiktok}`, user: entry.tiktok });

    const badges = socialLinksHTML(entry);
    const nameText = `👩 ${entry.name}`;

    if (socials.length === 0) {
      // No links — plain name
      return `<span class="lb-name">${nameText}</span>`;
    } else if (socials.length === 1) {
      // 1 link — name is a direct link
      return `<a href="${socials[0].url}" target="_blank" class="lb-name lb-name-link">${nameText} ${badges}</a>`;
    } else {
      // Multiple links — name opens a popup
      const dataLinks = encodeURIComponent(JSON.stringify(socials));
      return `<span class="lb-name lb-name-link" data-socials="${dataLinks}" onclick="Leaderboard.showSocialPopup(this, '${entry.name}')">${nameText} ${badges}</span>`;
    }
  }

  // Show social popup for users with multiple links
  function showSocialPopup(el, name) {
    // Remove any existing popup
    document.querySelectorAll('.social-popup-overlay').forEach(p => p.remove());

    const socials = JSON.parse(decodeURIComponent(el.dataset.socials));

    const overlay = document.createElement('div');
    overlay.className = 'social-popup-overlay';
    overlay.innerHTML = `
      <div class="social-popup">
        <div class="social-popup-header">
          <span>${name}</span>
          <button onclick="this.closest('.social-popup-overlay').remove()">✕</button>
        </div>
        ${socials.map(s => `
          <a href="${s.url}" target="_blank" class="social-popup-link">
            ${s.platform} <span class="social-popup-user">@${s.user}</span>
          </a>
        `).join('')}
      </div>
    `;

    // Close on overlay click (not popup itself)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  // Render leaderboard into a container
  function renderLeaderboard(containerId, top10, surrounding, currentUser) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tierEmojis = {
      'bronze': '🥉',
      'silver': '🥈',
      'gold': '🥇',
      'platinum': '💎',
      'diamond': '👑'
    };

    // ---- TOP 10 ----
    let html = `
      <div class="lb-section">
        <h3 class="lb-title">🏆 Top 10</h3>
        <div class="lb-table">
    `;

    top10.forEach((entry, i) => {
      const isUser = entry.name === currentUser.name && entry.score === currentUser.score;
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      html += `
        <div class="lb-row ${isUser ? 'lb-row-highlight' : ''}">
          <span class="lb-rank">${rankEmoji}</span>
          ${nameHTML(entry)}
          <span class="lb-score">${MehirCalculator.formatNumber(entry.score)}g</span>
          <span class="lb-tier">${tierEmojis[entry.tier] || ''}</span>
        </div>
      `;
    });

    html += '</div></div>';

    // ---- SURROUNDING ----
    if (surrounding.userRank > 0) {
      html += `
        <div class="lb-section">
          <h3 class="lb-title">📍 Senin Sıran: <span class="gold-text">${surrounding.userRank}.</span> / ${surrounding.totalCount}</h3>
          <div class="lb-table">
      `;

      surrounding.above.forEach((entry, i) => {
        const rank = surrounding.userRank - surrounding.above.length + i;
        html += `
          <div class="lb-row lb-row-dim">
            <span class="lb-rank">${rank}.</span>
            ${nameHTML(entry)}
            <span class="lb-score">${MehirCalculator.formatNumber(entry.score)}g</span>
            <span class="lb-tier">${tierEmojis[entry.tier] || ''}</span>
          </div>
        `;
      });

      html += `
        <div class="lb-row lb-row-highlight">
          <span class="lb-rank">${surrounding.userRank}.</span>
          <span class="lb-name">⭐ ${currentUser.name}</span>
          <span class="lb-score">${MehirCalculator.formatNumber(currentUser.score)}g</span>
          <span class="lb-tier">${tierEmojis[currentUser.tier] || ''}</span>
        </div>
      `;

      surrounding.below.forEach((entry, i) => {
        const rank = surrounding.userRank + 1 + i;
        html += `
          <div class="lb-row lb-row-dim">
            <span class="lb-rank">${rank}.</span>
            ${nameHTML(entry)}
            <span class="lb-score">${MehirCalculator.formatNumber(entry.score)}g</span>
            <span class="lb-tier">${tierEmojis[entry.tier] || ''}</span>
          </div>
        `;
      });

      html += '</div></div>';
    }

    container.innerHTML = html;
  }

  // Render compact leaderboard for landing page (Top 10 only)
  function renderLandingLeaderboard(containerId, top10) {
    const container = document.getElementById(containerId);
    if (!container || top10.length === 0) return;

    const tierEmojis = {
      'bronze': '🥉', 'silver': '🥈', 'gold': '🥇', 'platinum': '💎', 'diamond': '👑'
    };

    let html = `
      <div class="lb-section">
        <h3 class="lb-title">🏆 Leaderboard</h3>
        <div class="lb-table">
    `;

    top10.forEach((entry, i) => {
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      html += `
        <div class="lb-row">
          <span class="lb-rank">${rankEmoji}</span>
          ${nameHTML(entry)}
          <span class="lb-score">${MehirCalculator.formatNumber(entry.score)}g</span>
          <span class="lb-tier">${tierEmojis[entry.tier] || ''}</span>
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;
  }

  return { init, saveScore, updateProfile, getLastRecordId, getTop10, getSurrounding, renderLeaderboard, renderLandingLeaderboard, showSocialPopup };

})();
