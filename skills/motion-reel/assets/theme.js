(() => {
    'use strict';

    // REEL THEME: choose light or dark for this reel. Query overrides make review screenshots repeatable.
    const DEFAULT_THEME = 'light';
    const dark = {
        bg: '#0d0d10',
        surface: '#131316',
        raised: '#18181c',
        sunken: '#08080a',
        hover: '#202024',
        active: '#28282e',
        dot: '#202024',
        border: 'rgba(255,255,255,0.07)',
        borderStrong: 'rgba(255,255,255,0.13)',
        text: '#ececf1',
        muted: '#9a9aa6',
        faint: '#5f5f6b',
        accent: '#155dfc',
        running: '#60a5fa',
        needs: '#fbbf24',
        idle: '#4ade80',
        error: '#ef4444',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#67e8f9',
        termBg: '#08080a',
        termFg: '#d6d6de',
        termDim: '#6b6b76',
        note: '#3b3416',
        skill: '#c084fc',
        markDark: '#1c2233',
        markLight: '#d9dee6'
    };

    const light = {
        ...dark,
        bg: '#f8f9fc', surface: '#ffffff', raised: '#ffffff', sunken: '#edf0f5',
        hover: '#e8ecf3', active: '#dce3ef', dot: '#d8deea',
        border: 'rgba(0,0,0,0.08)', borderStrong: 'rgba(0,0,0,0.16)',
        text: '#1c2333', muted: '#526079', faint: '#647087', accent: '#2457d6',
        running: '#2563eb', needs: '#936400', idle: '#19804b', error: '#c52a3a',
        red: '#c52a3a', green: '#19804b', yellow: '#936400', blue: '#2563eb',
        magenta: '#8743ba', cyan: '#087e96', note: '#fff2bf', skill: '#8743ba'
    };
    const requested = new URLSearchParams(location.search).get('theme');
    const mode = ['light', 'dark'].includes(requested) ? requested : DEFAULT_THEME;
    const pal = mode === 'dark' ? dark : light;
    const style = document.documentElement.style;
    document.documentElement.dataset.theme = mode;
    style.colorScheme = mode;
    for (const [name, value] of Object.entries(pal)) {
        style.setProperty('--' + name.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()), value);
    }
    style.setProperty('--amber', pal.yellow);
    window.ReelTheme = { mode, pal };
})();
