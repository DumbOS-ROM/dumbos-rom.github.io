(function () {
  const MODES = [
    {
      id: 'normal',
      name: 'Normal',
      pill: 'Mode: Normal',
      net: '4G',
      dnd: false,
      bw: false,
      banner: ''
    },
    {
      id: 'dnd',
      name: 'Focus (DND)',
      pill: 'Mode: Focus (DND)',
      net: '4G',
      dnd: true,
      bw: false,
      banner: 'Focus Mode Active • Chat alerts muted; priority calls allowed.'
    },
    {
      id: 'call-only',
      name: 'Calls & SMS',
      pill: 'Mode: Calls & SMS',
      net: '2G',
      dnd: false,
      bw: false,
      banner: 'Calls & SMS Mode • Wi-Fi and mobile data turned off.'
    },
    {
      id: 'night-bw',
      name: 'Night (B&W)',
      pill: 'Mode: Night (B&W)',
      net: '4G',
      dnd: true,
      bw: true,
      banner: 'Night B&W Mode • SurfaceFlinger grayscale + DND + Saver.'
    }
  ];

  const FAV_APPS = [
    { name: 'Phone', offlineOk: true, target: null },
    { name: 'Messages', offlineOk: true, target: null },
    { name: 'WhatsApp', offlineOk: false, target: null },
    { name: 'Camera', offlineOk: true, target: null },
    { name: 'Notes', offlineOk: true, target: null },
    { name: 'App Store', offlineOk: false, target: null },
    { name: 'Settings', offlineOk: true, target: 'settings' }
  ];

  const ALL_APPS = [
    'App Store (Aurora)',
    'Calculator',
    'Camera (Aperture)',
    'Clock',
    'Contacts',
    'Files',
    'Gallery',
    'Messages',
    'microG Settings',
    'Notes (Markor)',
    'Phone',
    'Settings',
    'WhatsApp'
  ];

  const DEFAULT_RECENTS = [
    { id: 1, name: 'WhatsApp', mb: 54, state: 'Active' },
    { id: 2, name: 'Notes (Markor)', mb: 14, state: 'Background' },
    { id: 3, name: 'Settings', mb: 28, state: 'Background' },
    { id: 4, name: 'Messages', mb: 19, state: 'Background' }
  ];

  let currentScreen = 'home';
  let prevScreen = 'home';
  let modeIdx = 0;
  let recents = DEFAULT_RECENTS.map((r) => ({ ...r }));
  let eggTaps = 0;

  let selectedBranch = 'lineage-21.0';
  let selectedTree = 'standard';

  function renderFavorites() {
    const container = document.getElementById('sim-fav-list');
    if (!container) return;
    const callOnly = modeIdx === 2;
    container.innerHTML = FAV_APPS.map((app) => {
      const offline = callOnly && !app.offlineOk;
      const cls = offline ? 'fav-item offline' : 'fav-item';
      const hint = offline ? 'offline' : 'open ->';
      return `<button type="button" class="${cls}" data-target="${app.target || ''}" data-app="${app.name}">
        <span>${app.name}</span>
        <span class="fav-hint">${hint}</span>
      </button>`;
    }).join('');

    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target) {
          setScreen(target);
        } else {
          const appName = btn.getAttribute('data-app');
          openSimulatedApp(appName);
        }
      });
    });
  }

  function renderDrawer(query) {
    const list = document.getElementById('sim-drawer-list');
    if (!list) return;
    const q = (query || '').trim().toLowerCase();
    const filtered = ALL_APPS.filter((a) => !q || a.toLowerCase().includes(q));
    if (filtered.length === 0) {
      list.innerHTML = '<div style="font-family:var(--font-mono);font-size:0.74rem;color:#666;padding:12px 0;">No matching apps</div>';
      return;
    }
    list.innerHTML = filtered
      .map(
        (name) =>
          `<button type="button" class="fav-item" style="font-size:0.92rem;padding:6px 0;" data-name="${name}">
            <span>${name}</span>
            <span class="fav-hint">launch</span>
          </button>`
      )
      .join('');

    list.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = btn.getAttribute('data-name');
        if (n === 'Settings') {
          setScreen('settings');
        } else {
          openSimulatedApp(n);
        }
      });
    });
  }

  function openSimulatedApp(appName) {
    const existing = recents.find((r) => r.name.startsWith(appName));
    if (!existing) {
      recents.unshift({ id: Date.now(), name: appName, mb: 22, state: 'Active' });
    }
    const toast = document.getElementById('sim-app-opened');
    const title = document.getElementById('sim-app-title');
    if (title) title.textContent = appName;
    if (toast) setScreen('app');
  }

  function renderRecents() {
    const list = document.getElementById('sim-recents-list');
    const ramEl = document.getElementById('sim-ram-label');
    const clearBtn = document.getElementById('sim-clear-all');
    if (!list) return;

    const usedByTasks = recents.reduce((acc, item) => acc + item.mb, 0);
    const freeMb = Math.min(1180, 740 + (115 - usedByTasks));
    if (ramEl) {
      ramEl.textContent = `RAM: ${freeMb} MB free / 1536 MB`;
    }

    if (recents.length === 0) {
      if (clearBtn) clearBtn.style.display = 'none';
      list.innerHTML = `
        <div style="margin:auto;text-align:center;padding:36px 0;">
          <div style="font-family:var(--font-mono);font-size:0.78rem;color:#666;margin-bottom:10px;">No recent apps</div>
          <button type="button" id="sim-restore-recents" class="p-pill">Restore sample apps</button>
        </div>`;
      const restore = document.getElementById('sim-restore-recents');
      if (restore) {
        restore.addEventListener('click', () => {
          recents = DEFAULT_RECENTS.map((r) => ({ ...r }));
          renderRecents();
        });
      }
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-block';
    list.innerHTML = recents
      .map(
        (item) => `
      <div class="p-card" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="min-width:0;cursor:pointer;flex:1;" data-open-id="${item.id}">
          <div style="font-size:0.86rem;color:#f0f0f0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:#777;margin-top:2px;">~${item.mb} MB  •  ${item.state}</div>
        </div>
        <button type="button" class="p-pill" data-close-id="${item.id}">Close</button>
      </div>`
      )
      .join('');

    list.querySelectorAll('[data-close-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-close-id'));
        recents = recents.filter((r) => r.id !== id);
        renderRecents();
      });
    });

    list.querySelectorAll('[data-open-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = Number(el.getAttribute('data-open-id'));
        const item = recents.find((r) => r.id === id);
        if (!item) return;
        if (item.name === 'Settings') {
          setScreen('settings');
        } else {
          openSimulatedApp(item.name);
        }
      });
    });
  }

  function applyMode(idx) {
    modeIdx = (idx + MODES.length) % MODES.length;
    const m = MODES[modeIdx];

    const lockPill = document.getElementById('sim-lock-mode');
    const homePill = document.getElementById('sim-home-mode');
    const aboutMode = document.getElementById('sim-about-mode');
    const netIcon = document.getElementById('sim-net-icon');
    const dndIcon = document.getElementById('sim-dnd-icon');
    const screenEl = document.getElementById('phone-screen');
    const lockBanner = document.getElementById('sim-lock-banner');
    const lockNotifs = document.getElementById('sim-lock-notifs');

    if (lockPill) lockPill.textContent = m.pill;
    if (homePill) homePill.textContent = m.pill;
    if (aboutMode) aboutMode.textContent = m.name;
    if (netIcon) netIcon.textContent = m.net;
    if (dndIcon) dndIcon.style.display = m.dnd ? 'inline' : 'none';
    if (screenEl) screenEl.classList.toggle('bw-mode', m.bw);

    if (lockBanner) {
      lockBanner.textContent = m.banner;
      lockBanner.style.display = m.banner ? 'block' : 'none';
    }
    if (lockNotifs) {
      lockNotifs.style.display = modeIdx === 1 ? 'none' : 'flex';
    }

    document.querySelectorAll('[data-mode-idx]').forEach((chip) => {
      chip.classList.toggle('active', Number(chip.getAttribute('data-mode-idx')) === modeIdx);
    });

    renderFavorites();
  }

  function setScreen(screen) {
    if (currentScreen !== screen) {
      prevScreen = currentScreen;
    }
    currentScreen = screen;

    document.querySelectorAll('.p-screen-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === `pane-${screen}`);
    });

    const tabMap = {
      boot: 'boot',
      lock: 'lock',
      home: 'home',
      drawer: 'home',
      app: 'home',
      recents: 'recents',
      settings: 'settings',
      about: 'about'
    };
    const activeTab = tabMap[screen] || 'home';
    document.querySelectorAll('[data-sim-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-sim-tab') === activeTab);
    });

    const statusLeft = document.getElementById('sim-status-left');
    if (statusLeft) {
      statusLeft.textContent = screen === 'lock' ? 'Carrier' : '22:15';
    }

    if (screen === 'recents') {
      renderRecents();
    }
    if (screen === 'drawer') {
      const input = document.getElementById('sim-drawer-search');
      if (input) input.value = '';
      renderDrawer('');
    }
  }

  function updateBuildCommands() {
    const pre = document.getElementById('build-commands');
    if (!pre) return;

    const useUl = selectedTree === 'ul' && selectedBranch !== 'lineage-22.2';
    const manifestFlag = useUl ? ' -m lineage-ul.xml' : '';
    const noteLine =
      selectedTree === 'ul' && selectedBranch === 'lineage-22.2'
        ? '# Note: lineage-22.2 uses unified default.xml (LineageOS-UL targets 20.0 & 21.0)\n'
        : '';

    pre.textContent = `${noteLine}# 1. Initialize DumbOS manifest (${selectedBranch})
repo init -u https://github.com/DumbOS-ROM/android.git -b ${selectedBranch}${manifestFlag} --git-lfs

# 2. Sync source tree
repo sync -c -j$(nproc --all) --force-sync --no-clone-bundle --no-tags

# 3. Inherit DumbOS in your device makefile (e.g. lineage_<codename>.mk)
#    $(call inherit-product, vendor/dumbos/config/common.mk)

# 4. Build flashable DumbOS OTA package
source build/envsetup.sh
brunch <device_codename>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-sim-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setScreen(btn.getAttribute('data-sim-tab')));
    });

    document.querySelectorAll('[data-mode-idx]').forEach((chip) => {
      chip.addEventListener('click', () => applyMode(Number(chip.getAttribute('data-mode-idx'))));
    });

    document.querySelectorAll('.js-cycle-mode').forEach((el) => {
      el.addEventListener('click', () => applyMode(modeIdx + 1));
    });

    const openDrawer = document.getElementById('sim-open-drawer');
    if (openDrawer) openDrawer.addEventListener('click', () => setScreen('drawer'));

    const closeDrawer = document.getElementById('sim-close-drawer');
    if (closeDrawer) closeDrawer.addEventListener('click', () => setScreen('home'));

    const lockBtn = document.getElementById('sim-lock-btn');
    if (lockBtn) lockBtn.addEventListener('click', () => setScreen('lock'));

    const unlockBtn = document.getElementById('sim-unlock-btn');
    if (unlockBtn) unlockBtn.addEventListener('click', () => setScreen('home'));

    const openAbout = document.getElementById('sim-open-about');
    if (openAbout) openAbout.addEventListener('click', () => setScreen('about'));

    const backToSettings = document.getElementById('sim-back-settings');
    if (backToSettings) backToSettings.addEventListener('click', () => setScreen('settings'));

    const clearAll = document.getElementById('sim-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', () => {
        recents = [];
        setScreen('home');
      });
    }

    const searchInput = document.getElementById('sim-drawer-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => renderDrawer(e.target.value));
    }

    const navBack = document.getElementById('sim-nav-back');
    if (navBack) {
      navBack.addEventListener('click', () => {
        if (currentScreen === 'about') setScreen('settings');
        else if (currentScreen !== 'home' && currentScreen !== 'lock') setScreen('home');
      });
    }

    const navHome = document.getElementById('sim-nav-home');
    if (navHome) navHome.addEventListener('click', () => setScreen('home'));

    const navRecents = document.getElementById('sim-nav-recents');
    if (navRecents) {
      navRecents.addEventListener('click', () => {
        setScreen(currentScreen === 'recents' ? prevScreen || 'home' : 'recents');
      });
    }

    const heroCard = document.getElementById('sim-about-hero-card');
    if (heroCard) {
      heroCard.addEventListener('click', () => {
        eggTaps += 1;
        const hint = document.getElementById('sim-egg-hint');
        if (!hint) return;
        if (eggTaps >= 3) {
          eggTaps = 0;
          hint.textContent = 'PLATLOGO EASTER EGG TRIGGERED';
          hint.style.color = '#ffffff';
          setTimeout(() => {
            hint.textContent = 'TAP 3X FOR SYSTEM EGG';
            hint.style.color = '#555555';
          }, 1800);
        } else {
          hint.textContent = `TAP ${3 - eggTaps} MORE FOR SYSTEM EGG`;
        }
      });
    }

    // Build configurator buttons
    document.querySelectorAll('[data-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedBranch = btn.getAttribute('data-branch');
        document.querySelectorAll('[data-branch]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        updateBuildCommands();
      });
    });

    document.querySelectorAll('[data-tree]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedTree = btn.getAttribute('data-tree');
        document.querySelectorAll('[data-tree]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        updateBuildCommands();
      });
    });

    const copyBtn = document.getElementById('copy-build-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const pre = document.getElementById('build-commands');
        if (!pre) return;
        navigator.clipboard.writeText(pre.textContent).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(() => {
            copyBtn.textContent = orig;
          }, 1600);
        });
      });
    }

    renderFavorites();
    renderDrawer('');
    renderRecents();
    applyMode(0);
    setScreen('home');
    updateBuildCommands();
  });
})();
