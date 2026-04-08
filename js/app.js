/* ================================================================
Triathlon Calculator Logic
================================================================
*/

// --- Constants & Config ---
const PRESETS = {
    metric: {
        super_sprint: { swim: 400, bike: 10, run: 2.5 },
        sprint: { swim: 750, bike: 20, run: 5 },
        olympic: { swim: 1500, bike: 40, run: 10 },
        t100: { swim: 2000, bike: 80, run: 18 },
        half: { swim: 1900, bike: 90, run: 21.1 },
        full: { swim: 3800, bike: 180, run: 42.2 }
    },
    imperial: {
        // Super Sprint / Sprint / Olympic / T100: official metric distances converted to imperial
        super_sprint: { swim: 437, bike: 6.21, run: 1.55 },
        sprint: { swim: 820, bike: 12.43, run: 3.11 },
        olympic: { swim: 1640, bike: 24.85, run: 6.21 },
        t100: { swim: 2187, bike: 49.71, run: 11.18 },
        // Half / Full Ironman: official imperial distances (1.2mi/56mi/13.1mi and 2.4mi/112mi/26.2mi)
        half: { swim: 2112, bike: 56, run: 13.1 },
        full: { swim: 4224, bike: 112, run: 26.2 }
    }
};

const DROPDOWN_TEXTS = {
    metric: {
        super_sprint: "Super Sprint: Swim 400m | Bike 10km | Run 2.5km",
        sprint: "Sprint: Swim 750m | Bike 20km | Run 5km",
        olympic: "Olympic: Swim 1500m | Bike 40km | Run 10km",
        t100: "T100: Swim 2000m | Bike 80km | Run 18km",
        half: "Half Ironman - 70.3: Swim 1900m | Bike 90km | Run 21.1km",
        full: "Full Ironman - 140.6: Swim 3800m | Bike 180km | Run 42.2km",
        custom: "Custom Distance"
    },
    imperial: {
        super_sprint: "Super Sprint: Swim 437y | Bike 6.21mi | Run 1.55mi",
        sprint: "Sprint: Swim 820y | Bike 12.43mi | Run 3.11mi",
        olympic: "Olympic: Swim 1640y | Bike 24.85mi | Run 6.21mi",
        t100: "T100: Swim 2187y | Bike 49.71mi | Run 11.18mi",
        half: "Half Ironman - 70.3: Swim 1.2mi/2112y | Bike 56mi | Run 13.1mi",
        full: "Full Ironman - 140.6: Swim 2.4mi/4224y | Bike 112mi | Run 26.2mi",
        custom: "Custom Distance"
    }
};

const LABELS = {
    metric: {
        swim: 'm', bike: 'km', run: 'km',
        swimPace: 'Pace (mm:ss/100m)', runPace: 'Pace (mm:ss/km)', bikeSpeed: 'Speed (km/h)',
        speedPlaceholder: 'Speed (km/h)',
        swimPacePlaceholder: 'mm:ss / 100m',
        runPacePlaceholder: 'mm:ss / km'
    },
    imperial: {
        swim: 'y', bike: 'mi', run: 'mi',
        swimPace: 'Pace (mm:ss/100y)', runPace: 'Pace (mm:ss/mi)', bikeSpeed: 'Speed (mph)',
        speedPlaceholder: 'Speed (mph)',
        swimPacePlaceholder: 'mm:ss / 100y',
        runPacePlaceholder: 'mm:ss / mi'
    }
};

// localStorage keys (namespaced so they don't collide with anything else)
const LS = {
    theme: 'tricalc.theme',
    unit: 'tricalc.unit',
    preset: 'tricalc.preset',
    paceSwim: 'tricalc.paceSwim',
    speedBike: 'tricalc.speedBike',
    paceRun: 'tricalc.paceRun',
    timeT1: 'tricalc.timeT1',
    timeT2: 'tricalc.timeT2'
};

let currentUnit = 'metric';

// --- DOM Elements ---
const els = {
    unitToggle: document.getElementById('unitToggle'),
    presetSelect: document.getElementById('racePreset'),
    dist: {
        swim: document.getElementById('distSwim'),
        bike: document.getElementById('distBike'),
        run: document.getElementById('distRun')
    },
    labels: {
        swim: document.getElementById('labelDistSwim'),
        bike: document.getElementById('labelDistBike'),
        run: document.getElementById('labelDistRun'),
        swimPace: document.querySelector('#paceSwim').closest('.pace-wrapper'),
        runPace: document.querySelector('#paceRun').closest('.pace-wrapper'),
        bikeSpeed: document.getElementById('labelSpeedBikeWrapper')
    },
    pace: {
        swim: document.getElementById('paceSwim'),
        bike: document.getElementById('speedBike'),
        run: document.getElementById('paceRun')
    },
    time: {
        swim: document.getElementById('timeSwim'),
        t1: document.getElementById('timeT1'),
        bike: document.getElementById('timeBike'),
        t2: document.getElementById('timeT2'),
        run: document.getElementById('timeRun')
    },
    totalDisplay: document.getElementById('totalTimeDisplay'),
    themeToggle: document.getElementById('themeToggle')
};

// --- Helper Functions: Time Formatting ---

/**
 * Converts total seconds to HH:MM:SS string.
 * Rounds the total before splitting so that values like 3599.7 carry up
 * cleanly to 01:00:00 instead of being floor-truncated to 00:59:59.
 */
function secondsToHMS(totalSeconds) {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return "";

    totalSeconds = Math.round(totalSeconds);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hDisplay = h < 10 ? "0" + h : h;
    const mDisplay = m < 10 ? "0" + m : m;
    const sDisplay = s < 10 ? "0" + s : s;

    return `${hDisplay}:${mDisplay}:${sDisplay}`;
}

/**
 * Formats a positive number of seconds as "M:SS" pace string.
 * Rounds first so 119.7 becomes 2:00 instead of 1:59.
 */
function secondsToPace(totalSeconds) {
    const total = Math.round(totalSeconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
}

/**
 * Parses HH:MM:SS, MM:SS, or just SS string into total seconds
 */
function parseTimeString(str) {
    if (!str) return 0;
    str = String(str).replace(/[^\d:]/g, '');
    const parts = str.split(':').map(Number);

    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
}

/**
 * Parses "MM:SS" strictly for pace inputs, returning seconds
 */
function parsePaceString(str) {
    return parseTimeString(str);
}

// --- Auto-format helpers (so phone users never have to type a colon) ---

/**
 * Normalize a pace-like string (M:SS or MM:SS) on blur.
 *
 *   "530"   -> "5:30"     (last 2 digits = seconds, rest = minutes)
 *   "45"    -> "0:45"
 *   "5:3"   -> "5:03"     (zero-pad seconds)
 *   "5:30"  -> "5:30"     (already valid, untouched)
 *
 * Inputs already containing a colon are treated as user-typed and just
 * normalized via parsePaceString -> secondsToPace so we don't surprise
 * desktop users who typed it the "right" way.
 */
function formatPaceOnBlur(input) {
    const raw = input.value.trim();
    if (!raw) return;

    if (raw.includes(':')) {
        const sec = parsePaceString(raw);
        if (sec > 0) input.value = secondsToPace(sec);
        return;
    }

    const digits = raw.replace(/\D/g, '');
    if (!digits) { input.value = ''; return; }

    let totalSec;
    if (digits.length <= 2) {
        totalSec = parseInt(digits, 10);
    } else {
        const seconds = parseInt(digits.slice(-2), 10);
        const minutes = parseInt(digits.slice(0, -2), 10);
        totalSec = minutes * 60 + seconds;
    }
    input.value = secondsToPace(totalSec);
}

/**
 * Normalize a time-like string (HH:MM:SS / MM:SS) on blur.
 *
 *   "12030" -> "1:20:30"  (last 2 = seconds, next 2 = minutes, rest = hours)
 *   "4500"  -> "45:00"
 *   "30"    -> "0:30"
 *   "1:5:9" -> "1:05:09"  (zero-pad)
 *
 * Always renders MM:SS for sub-hour values, HH:MM:SS otherwise. The
 * downstream parseTimeString accepts both, so calc logic is unaffected.
 */
function formatTimeOnBlur(input) {
    const raw = input.value.trim();
    if (!raw) return;

    let totalSec;
    if (raw.includes(':')) {
        totalSec = parseTimeString(raw);
    } else {
        const digits = raw.replace(/\D/g, '');
        if (!digits) { input.value = ''; return; }

        if (digits.length <= 2) {
            totalSec = parseInt(digits, 10);
        } else if (digits.length <= 4) {
            const seconds = parseInt(digits.slice(-2), 10);
            const minutes = parseInt(digits.slice(0, -2), 10);
            totalSec = minutes * 60 + seconds;
        } else {
            const seconds = parseInt(digits.slice(-2), 10);
            const minutes = parseInt(digits.slice(-4, -2), 10);
            const hours = parseInt(digits.slice(0, -4), 10);
            totalSec = hours * 3600 + minutes * 60 + seconds;
        }
    }

    if (totalSec <= 0) { input.value = ''; return; }

    // Sub-hour values render as MM:SS for compactness; otherwise HH:MM:SS.
    if (totalSec < 3600) {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        input.value = `${m}:${s < 10 ? '0' + s : s}`;
    } else {
        input.value = secondsToHMS(totalSec);
    }
}

// --- Core Logic: Calculations ---

function calculateSwimTime() {
    const dist = parseFloat(els.dist.swim.value) || 0;
    const paceSec = parsePaceString(els.pace.swim.value);

    if (dist > 0 && paceSec > 0) {
        const totalSec = (dist / 100) * paceSec;
        els.time.swim.value = secondsToHMS(totalSec);
    }
    updateTotal();
}

function calculateSwimPace() {
    const dist = parseFloat(els.dist.swim.value) || 0;
    const timeSec = parseTimeString(els.time.swim.value);

    if (dist > 0 && timeSec > 0) {
        const paceSec = (timeSec * 100) / dist;
        els.pace.swim.value = secondsToPace(paceSec);
    }
    updateTotal();
}

function calculateBikeTime() {
    const dist = parseFloat(els.dist.bike.value) || 0;
    const speed = parseFloat(els.pace.bike.value) || 0;

    if (dist > 0 && speed > 0) {
        const timeHours = dist / speed;
        const timeSec = timeHours * 3600;
        els.time.bike.value = secondsToHMS(timeSec);
    }
    updateTotal();
}

function calculateBikeSpeed() {
    const dist = parseFloat(els.dist.bike.value) || 0;
    const timeSec = parseTimeString(els.time.bike.value);

    if (dist > 0 && timeSec > 0) {
        const timeHours = timeSec / 3600;
        const speed = dist / timeHours;
        els.pace.bike.value = speed.toFixed(1);
    }
    updateTotal();
}

function calculateRunTime() {
    const dist = parseFloat(els.dist.run.value) || 0;
    const paceSec = parsePaceString(els.pace.run.value);

    if (dist > 0 && paceSec > 0) {
        const totalSec = dist * paceSec;
        els.time.run.value = secondsToHMS(totalSec);
    }
    updateTotal();
}

function calculateRunPace() {
    const dist = parseFloat(els.dist.run.value) || 0;
    const timeSec = parseTimeString(els.time.run.value);

    if (dist > 0 && timeSec > 0) {
        const paceSec = timeSec / dist;
        els.pace.run.value = secondsToPace(paceSec);
    }
    updateTotal();
}

function updateTotal() {
    const tSwim = parseTimeString(els.time.swim.value);
    const tT1 = parseTimeString(els.time.t1.value);
    const tBike = parseTimeString(els.time.bike.value);
    const tT2 = parseTimeString(els.time.t2.value);
    const tRun = parseTimeString(els.time.run.value);

    const total = tSwim + tT1 + tBike + tT2 + tRun;
    els.totalDisplay.textContent = secondsToHMS(total) || "00:00:00";

    persistState();
}

// --- Persistence ---

function persistState() {
    try {
        localStorage.setItem(LS.unit, currentUnit);
        localStorage.setItem(LS.preset, els.presetSelect.value);
        localStorage.setItem(LS.paceSwim, els.pace.swim.value || '');
        localStorage.setItem(LS.speedBike, els.pace.bike.value || '');
        localStorage.setItem(LS.paceRun, els.pace.run.value || '');
        localStorage.setItem(LS.timeT1, els.time.t1.value || '');
        localStorage.setItem(LS.timeT2, els.time.t2.value || '');
    } catch (e) { /* localStorage may be unavailable in private mode */ }
}

function restoreState() {
    let savedUnit, savedPreset, savedSwim, savedBike, savedRun, savedT1, savedT2;
    try {
        savedUnit = localStorage.getItem(LS.unit);
        savedPreset = localStorage.getItem(LS.preset);
        savedSwim = localStorage.getItem(LS.paceSwim);
        savedBike = localStorage.getItem(LS.speedBike);
        savedRun = localStorage.getItem(LS.paceRun);
        savedT1 = localStorage.getItem(LS.timeT1);
        savedT2 = localStorage.getItem(LS.timeT2);
    } catch (e) { return false; }

    if (savedUnit === 'imperial') {
        currentUnit = 'imperial';
        els.unitToggle.checked = true;
        // Update labels/placeholders to imperial without re-converting numbers
        applyUnitLabels();
    }

    if (savedPreset) {
        els.presetSelect.value = savedPreset;
    }

    if (savedSwim) els.pace.swim.value = savedSwim;
    if (savedBike) els.pace.bike.value = savedBike;
    if (savedRun)  els.pace.run.value  = savedRun;
    if (savedT1)   els.time.t1.value   = savedT1;
    if (savedT2)   els.time.t2.value   = savedT2;

    return true;
}

// --- Event Handlers ---

function updateDropdownLabels() {
    const options = els.presetSelect.options;
    for (let i = 0; i < options.length; i++) {
        const val = options[i].value;
        if (DROPDOWN_TEXTS[currentUnit][val]) {
            options[i].textContent = DROPDOWN_TEXTS[currentUnit][val];
        }
    }
}

function applyUnitLabels() {
    els.labels.swim.textContent = LABELS[currentUnit].swim;
    els.labels.bike.textContent = LABELS[currentUnit].bike;
    els.labels.run.textContent = LABELS[currentUnit].run;

    els.labels.swimPace.setAttribute('data-label', LABELS[currentUnit].swimPace);
    els.labels.runPace.setAttribute('data-label', LABELS[currentUnit].runPace);
    els.labels.bikeSpeed.setAttribute('data-label', LABELS[currentUnit].bikeSpeed);

    els.pace.bike.placeholder = LABELS[currentUnit].speedPlaceholder;
    els.pace.swim.placeholder = LABELS[currentUnit].swimPacePlaceholder;
    els.pace.run.placeholder = LABELS[currentUnit].runPacePlaceholder;

    updateDropdownLabels();
}

function handlePresetChange() {
    const val = els.presetSelect.value;
    if (val === 'custom') { persistState(); return; }

    const data = PRESETS[currentUnit][val];
    els.dist.swim.value = data.swim;
    els.dist.bike.value = data.bike;
    els.dist.run.value = data.run;

    // Trigger Recalculation of Times based on existing paces (if any)
    if (els.pace.swim.value) calculateSwimTime();
    if (els.pace.bike.value) calculateBikeTime();
    if (els.pace.run.value) calculateRunTime();

    persistState();
}

/**
 * Converts the values currently in the pace/speed inputs from one unit
 * system to the other so that toggling units preserves the user's
 * physical pace/speed (a 5:00/km runner becomes an 8:03/mi runner).
 *
 * Conversion factors:
 *   Swim: 100y = 91.44m, so sec/100y = sec/100m × 0.9144
 *   Run:  1mi = 1.609344km, so sec/mi = sec/km × 1.609344
 *   Bike: 1mph = 1.609344km/h, so mph = km/h × 0.621371
 */
function convertPacesAndSpeeds(fromUnit, toUnit) {
    if (fromUnit === toUnit) return;
    const toImperial = (toUnit === 'imperial');

    if (els.pace.swim.value) {
        const sec = parsePaceString(els.pace.swim.value);
        if (sec > 0) {
            const newSec = toImperial ? sec * 0.9144 : sec / 0.9144;
            els.pace.swim.value = secondsToPace(newSec);
        }
    }

    if (els.pace.bike.value) {
        const speed = parseFloat(els.pace.bike.value);
        if (speed > 0) {
            const newSpeed = toImperial ? speed * 0.621371 : speed * 1.609344;
            els.pace.bike.value = newSpeed.toFixed(1);
        }
    }

    if (els.pace.run.value) {
        const sec = parsePaceString(els.pace.run.value);
        if (sec > 0) {
            const newSec = toImperial ? sec * 1.609344 : sec / 1.609344;
            els.pace.run.value = secondsToPace(newSec);
        }
    }
}

function handleUnitToggle() {
    const newUnit = els.unitToggle.checked ? 'imperial' : 'metric';
    if (newUnit === currentUnit) return;

    if (els.presetSelect.value !== 'custom') {
        convertPacesAndSpeeds(currentUnit, newUnit);
    }

    currentUnit = newUnit;
    applyUnitLabels();

    if (els.presetSelect.value !== 'custom') {
        handlePresetChange();
    } else {
        persistState();
    }
}

/**
 * Smart Listener: Prevents rounding drift by only recalculating if the value
 * was actually changed by the user. This fixes the issue where tabbing
 * through fields triggers unnecessary recalculations based on rounded values.
 */
function addSmartListener(element, eventType, handler) {
    element.addEventListener('focus', (e) => {
        e.target.dataset.originalValue = e.target.value;
    });

    element.addEventListener(eventType, (e) => {
        if (e.target.value !== e.target.dataset.originalValue) {
            handler();
            e.target.dataset.originalValue = e.target.value;
        }
    });
}

// --- Attach Listeners ---

// 1. Controls
els.unitToggle.addEventListener('change', handleUnitToggle);
els.presetSelect.addEventListener('change', handlePresetChange);

// 2. Distance Inputs (Recalculate Time, keep Pace)
addSmartListener(els.dist.swim, 'input', () => { els.presetSelect.value = 'custom'; calculateSwimTime(); });
addSmartListener(els.dist.bike, 'input', () => { els.presetSelect.value = 'custom'; calculateBikeTime(); });
addSmartListener(els.dist.run, 'input', () => { els.presetSelect.value = 'custom'; calculateRunTime(); });

// 3. Pace/Speed Inputs (Calculate Time)
// Auto-format pace text inputs on blur, then calculate.
els.pace.swim.addEventListener('blur', () => formatPaceOnBlur(els.pace.swim));
els.pace.run.addEventListener('blur', () => formatPaceOnBlur(els.pace.run));
addSmartListener(els.pace.swim, 'blur', calculateSwimTime);
addSmartListener(els.pace.bike, 'input', calculateBikeTime);
addSmartListener(els.pace.run, 'blur', calculateRunTime);

// 4. Time Inputs (Calculate Pace)
// Auto-format time text inputs on blur, then calculate.
[els.time.swim, els.time.t1, els.time.bike, els.time.t2, els.time.run].forEach(input => {
    input.addEventListener('blur', () => formatTimeOnBlur(input));
});
addSmartListener(els.time.swim, 'blur', calculateSwimPace);
addSmartListener(els.time.t1, 'blur', updateTotal);
addSmartListener(els.time.bike, 'blur', calculateBikeSpeed);
addSmartListener(els.time.t2, 'blur', updateTotal);
addSmartListener(els.time.run, 'blur', calculateRunPace);

// Enter key support for inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') input.blur();
    });
});


// --- UI Extras ---

/**
 * Theme handling.
 *
 * The pre-paint inline script in <head> already set data-theme on <html>
 * to avoid a flash. Here we mirror that to <body> (so [data-theme="light"]
 * selectors that target body still work), set the icon to match, and
 * persist on click.
 */
function getStoredTheme() {
    try { return localStorage.getItem(LS.theme); } catch (e) { return null; }
}

function setTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    } else {
        document.body.removeAttribute('data-theme');
    }
    // Show the icon for the theme you'd switch TO (sun = currently light, click for dark)
    const useEl = els.themeToggle.querySelector('use');
    if (useEl) useEl.setAttribute('href', theme === 'light' ? '#i-moon' : '#i-sun');

    if (persist) {
        try { localStorage.setItem(LS.theme, theme); } catch (e) {}
    }
}

(function initTheme() {
    const stored = getStoredTheme();
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = stored || (prefersLight ? 'light' : 'dark');
    setTheme(initial, false);
})();

els.themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setTheme(current === 'light' ? 'dark' : 'light', true);
});

// --- Initialize ---

// 1. Restore unit + saved paces (if any) BEFORE applying preset distances,
//    so handlePresetChange can recompute times from the saved paces.
const restored = restoreState();

// 2. Always apply current-unit labels (covers metric default + imperial restore)
applyUnitLabels();

// 3. Fill distances for the current preset and recompute times
handlePresetChange();
