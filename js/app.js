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
    unit:  'tricalc.unit'
};

// Remove keys written by older versions of the app that we no longer persist.
try {
    ['tricalc.preset','tricalc.paceSwim','tricalc.speedBike',
     'tricalc.paceRun','tricalc.timeT1','tricalc.timeT2']
        .forEach(k => localStorage.removeItem(k));
} catch (e) {}

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
 * Formats a positive number of seconds as a zero-padded "MM:SS" pace string.
 * Rounds first so 119.7 becomes 02:00 instead of 01:59. Minutes are padded
 * (rather than rendered as "M:SS") so the displayed format matches the
 * masked-input format used by makeMaskedTimeInput — otherwise blurring after
 * a calc would visibly flicker between "01:30" and "1:30".
 */
function secondsToPace(totalSeconds) {
    const total = Math.round(totalSeconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const mDisplay = m < 10 ? '0' + m : m;
    const sDisplay = s < 10 ? '0' + s : s;
    return `${mDisplay}:${sDisplay}`;
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

// --- Masked time/pace inputs (no colon typing required) ---

/**
 * Right-to-left masked input for MM:SS and HH:MM:SS fields.
 *
 * Each digit the user types shifts in from the right, exactly like an
 * ATM or microwave time entry:
 *
 *   ""  → 1 → "00:01" → 3 → "00:13" → 0 → "01:30" → 7 → "13:07"
 *
 * Once the field is at maxDigits, additional keystrokes are dropped
 * (the user must backspace to make room). Backspace pops the rightmost
 * digit; the field stays in canonical zero-padded format throughout.
 *
 * Implementation notes:
 *
 *   - We store the user's typed digits separately on the element
 *     (`_typedDigits`) and re-render the visible value from that on
 *     every keystroke. The visible value is always padded to maxDigits.
 *   - On focus we resync `_typedDigits` from `input.value`, so external
 *     writes (calc functions, restoreState, preset changes) don't desync
 *     the digit state. Leading zeros are stripped during resync — they
 *     are padding, not user input, and shouldn't eat into the digit cap.
 *   - Selection-replace ("select all + type a digit") is handled via a
 *     beforeinput flag so the new digit replaces rather than appends.
 *   - The cursor is forced to the end on focus, click, and after every
 *     render — there's no notion of editing in the middle of a masked
 *     field.
 *   - We rely on InputEvent.data and inputType, both supported in modern
 *     iOS Safari and Chrome — soft keyboards do not fire keydown reliably.
 */
function makeMaskedTimeInput(input, format) {
    const maxDigits = format === 'hhmmss' ? 6 : 4;

    function render(digits) {
        if (!digits) return '';
        const padded = digits.padStart(maxDigits, '0');
        if (format === 'mmss') {
            return padded.slice(0, 2) + ':' + padded.slice(2, 4);
        }
        return padded.slice(0, 2) + ':' + padded.slice(2, 4) + ':' + padded.slice(4, 6);
    }

    // Strip the value down to its meaningful digits, dropping leading
    // zeros (which are display padding, not user-typed digits) so the
    // user has the full digit cap available after a calc-driven write.
    function digitsFromValue(val) {
        const raw = (val || '').replace(/\D/g, '');
        const trimmed = raw.replace(/^0+/, '');
        return trimmed.slice(-maxDigits);
    }

    function moveCaretToEnd() {
        const len = input.value.length;
        try { input.setSelectionRange(len, len); } catch (e) { /* no-op */ }
    }

    // Initialize from any pre-existing value (HTML default, restored
    // state, calc output)
    input._typedDigits = digitsFromValue(input.value);
    if (input._typedDigits) input.value = render(input._typedDigits);

    // Track non-collapsed selections so "select-all + type" replaces
    // rather than appends. The selection has already been collapsed by
    // the time `input` fires, so we have to capture it earlier.
    input.addEventListener('beforeinput', () => {
        if (input.selectionStart !== input.selectionEnd) {
            input._maskClearOnNext = true;
        }
    });

    input.addEventListener('input', (e) => {
        let digits = input._maskClearOnNext ? '' : (input._typedDigits || '');
        input._maskClearOnNext = false;

        if (e.inputType && e.inputType.indexOf('delete') === 0) {
            digits = digits.slice(0, -1);
        } else if (e.data) {
            // Append digit characters from e.data, dropping anything
            // past maxDigits. Non-digit chars (e.g. from a paste) are
            // skipped silently.
            for (const ch of e.data) {
                if (digits.length >= maxDigits) break;
                if (/\d/.test(ch)) digits += ch;
            }
        } else {
            // Some other inputType with no data (undo/redo, etc.) —
            // fall back to whatever digits are in the current value.
            digits = digitsFromValue(input.value);
        }

        input._typedDigits = digits;
        input.value = render(digits);
        moveCaretToEnd();
    });

    // External writes (calc, restoreState, preset change) bypass the
    // input event, so resync digit state whenever the user re-enters
    // the field.
    input.addEventListener('focus', () => {
        input._typedDigits = digitsFromValue(input.value);
        // Defer the caret move so it lands after the browser's own
        // focus-time cursor placement.
        requestAnimationFrame(moveCaretToEnd);
    });

    input.addEventListener('click', moveCaretToEnd);
}

// --- Core Logic: Calculations ---

function calculateSwimTime() {
    const dist = parseFloat(els.dist.swim.value) || 0;
    const paceSec = parseTimeString(els.pace.swim.value);

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
    const paceSec = parseTimeString(els.pace.run.value);

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
}

// --- Persistence ---

function persistState() {
    try {
        localStorage.setItem(LS.unit, currentUnit);
    } catch (e) { /* localStorage may be unavailable in private mode */ }
}

function restoreState() {
    let savedUnit;
    try {
        savedUnit = localStorage.getItem(LS.unit);
    } catch (e) { return false; }

    if (savedUnit === 'imperial') {
        currentUnit = 'imperial';
        els.unitToggle.checked = true;
        // Update labels/placeholders to imperial without re-converting numbers
        applyUnitLabels();
    }

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
    if (val === 'custom') return;

    const data = PRESETS[currentUnit][val];
    els.dist.swim.value = data.swim;
    els.dist.bike.value = data.bike;
    els.dist.run.value = data.run;

    // Trigger Recalculation of Times based on existing paces (if any)
    if (els.pace.swim.value) calculateSwimTime();
    if (els.pace.bike.value) calculateBikeTime();
    if (els.pace.run.value) calculateRunTime();
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
        const sec = parseTimeString(els.pace.swim.value);
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
        const sec = parseTimeString(els.pace.run.value);
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
    }

    persistState();
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
// Pace inputs use the right-to-left mask, so no on-blur reformatting
// is needed — the value is already in canonical MM:SS form. Bike speed
// is a plain decimal number, no mask.
addSmartListener(els.pace.swim, 'blur', calculateSwimTime);
addSmartListener(els.pace.bike, 'input', calculateBikeTime);
addSmartListener(els.pace.run, 'blur', calculateRunTime);

// 4. Time Inputs (Calculate Pace)
addSmartListener(els.time.swim, 'blur', calculateSwimPace);
addSmartListener(els.time.t1, 'blur', updateTotal);
addSmartListener(els.time.bike, 'blur', calculateBikeSpeed);
addSmartListener(els.time.t2, 'blur', updateTotal);
addSmartListener(els.time.run, 'blur', calculateRunPace);

// Enter key support for inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', (e) => {
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
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
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

// 4. Wire up the right-to-left masked input on every time/pace field.
//    Done last so the mask picks up whatever values restoreState +
//    handlePresetChange just wrote into them. Bike speed (els.pace.bike)
//    stays unmasked because it's a plain decimal, not a time format.
makeMaskedTimeInput(els.pace.swim, 'mmss');
makeMaskedTimeInput(els.pace.run,  'mmss');
makeMaskedTimeInput(els.time.swim, 'hhmmss');
makeMaskedTimeInput(els.time.t1,   'mmss');
makeMaskedTimeInput(els.time.bike, 'hhmmss');
makeMaskedTimeInput(els.time.t2,   'mmss');
makeMaskedTimeInput(els.time.run,  'hhmmss');
