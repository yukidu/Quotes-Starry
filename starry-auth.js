(() => {
  'use strict';

  const config = window.StarryConfig;
  const state = { authenticated: false, name: '', rank: '', displayName: '' };

  function applyGuest() {
    state.authenticated = false;
    state.name = '';
    state.rank = '';
    state.displayName = '';
  }

  function render() {
    const line = document.getElementById('welcomeLine');
    const message = document.getElementById('welcomeMsg');
    const button = document.getElementById('starryAuthBtn');
    if (!line || !message) return;

    line.style.display = 'flex';
    if (state.authenticated && state.displayName) {
      message.textContent = `歡迎你，${state.displayName}`;
      if (button) {
        button.textContent = 'Starry ID';
        button.onclick = () => { window.location.href = config.starryIdProfileUrl; };
      }
      return;
    }

    message.textContent = '歡迎你';
    if (button) {
      button.textContent = 'Starry ID 登入';
      button.onclick = () => { window.location.href = config.starryIdLoginUrl; };
    }
  }

  async function refresh() {
    applyGuest();
    render();
    try {
      const response = await fetch(config.starryIdentityUrl, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.authenticated && data.name) {
        const rank = String(data.approvedRank || data.rank || '').trim();
        const name = String(data.name || '').trim();
        state.authenticated = true;
        state.name = name;
        state.rank = rank;
        state.displayName = [name, rank].filter(Boolean).join(' ');
      }
    } catch (_) {
      applyGuest();
    }
    render();
    return { ...state };
  }

  function getDisplayName() {
    return state.authenticated ? state.displayName : '';
  }

  window.StarryIdentity = Object.freeze({ state, refresh, getDisplayName });
})();
