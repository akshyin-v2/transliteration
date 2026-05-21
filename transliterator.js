/**
 * Hindi Phonetic Transliterator — Developer Reference
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * This is a self-contained IIFE that exposes a single API: window.HindiTransliterator.attach(selector).
 * It intercepts keystrokes on designated input/textarea fields and maintains TWO parallel buffers:
 *
 *   1. field.dataset.hindiRaw  → the Roman keystrokes as typed by the user.
 *   2. field.value            → the rendered Devanagari output.
 *
 * The raw buffer is the source of truth.  Every keystroke appends to it, then syncField()
 * re-runs transliterateSegment(raw) and overwrites field.value with the result.  This
 * design keeps the mapping logic completely separate from the DOM, making it easy to
 * unit-test in Node if you stub the Unicode constants.
 *
 * CORE PARSER (transliterateSegment)
 * ----------------------------------
 * A left-to-right greedy trie scanner.  It walks three tries in priority order:
 *
 *   1. Consonant trie  — after a consonant, we try to consume another consonant FIRST.
 *                        This produces a conjunct (cluster) via the HALANT (्) mark.
 *                        e.g. k + r → क्र  (ka + halant + ra).
 *   2. Matra trie      — if no consonant matched, try a matra (vowel sign) after a consonant.
 *                        e.g. ki → क + ि = कि.
 *   3. Vowel trie      — at word start or after a vowel/space, try a full independent vowel.
 *                        e.g. a → अ.
 *
 * The "consonant-first after a consonant" rule is the Golden Rule of this engine.
 * It is what makes kri render as क्रि instead of क् रि.
 *
 * SPECIAL TOKENS
 * --------------
 * - SPLIT  (‌, ZWNJ):  inserted by ambiguity rewrites to force a fresh parse boundary.
 *                           e.g. kah → कः, but ambiguity rewrite k + a + ZWNJ + h → कह.
 * - OVERRIDE_RI (​, ZWSP):  forces the vowel sign ृ instead of the conjunct रि.
 *                                e.g. k + ZWSP → कृ (instead of क्रि).
 * - q (anusvara shortcut):  after any Devanagari output character, 'q' produces 'ं'.
 *                            This lets users skip the n-ambiguity chip bar entirely.
 *                            e.g. hiq → हिं.  If there is no preceding Devanagari char,
 *                            q falls through and is emitted literally.
 * - qq (visarga shortcut):  after any Devanagari output character, 'qq' produces 'ः'.
 *                            e.g. raamqq → रामः.
 *
 * AMBIGUITY SYSTEM
 * ----------------
 * AMBIGUITIES is an ordered array.  Each entry has:
 *   id      — human-readable key for debugging.
 *   test    — RegExp run against the RAW buffer.  If it matches, chips are shown.
 *   label   — function(raw) → string.  Renders the DEFAULT preview for the chip hint.
 *   options — array of { name, rewrite } objects.
 *             name:    the Hindi char shown on the chip (null = use preview).
 *             rewrite: function(raw) → new raw string.  null = keep default.
 *
 * When a user clicks a chip, the rewrite function mutates field.dataset.hindiRaw,
 * then syncField() re-renders the output.  Because the rewrite is stored in the raw
 * buffer (e.g. replacing trailing 'n' with 'nn' or 'q'), the ambiguity test will NO
 * LONGER MATCH on the next keystroke, so the chip bar disappears automatically.
 *
 * The array is ORDERED.  More specific tests (sh, th, dh) must come BEFORE single-char
 * tests (t, d, n) because 'sh' ends in 'h', not 'shh', so the 'h' test would never
 * match 'sh' anyway, but 'th' MUST come before 't' or /t$/ would fire on 'th' first.
 *
 * EVENT HANDLING STRATEGY
 * -----------------------
 * We listen on BOTH keydown and input:
 *
 *   keydown  — intercepts printable Roman characters, Backspace, and Space.
 *              We call e.preventDefault() so the native key never reaches the field.
 *              This is the primary fast-path for typing.
 *
 *   input    — catches ALL other mutations: pastes, drag-and-drop, IME composition,
 *              auto-fill, browser extensions, programmatic value changes.
 *              It diffs oldVisible vs newVisible and attempts to reconcile.
 *              If the user pasted Devanagari directly, we fall back to romanSuffix().
 *
 * Why two listeners?  Because some input methods (mobile virtual keyboards, speech-to-text,
 * password managers) do not fire keydown events.  The input listener is the safety net.
 *
 * BLUR / FOCUS / MOUSEDOWN GOTCHA
 * --------------------------------
 * Chip click uses 'mousedown', NOT 'click'.  Why?  Because clicking a chip blurs the
 * input field first.  If we used 'click', the blur handler would clear the chip bar
 * BEFORE the click handler runs, making the chip unclickable.  'mousedown' fires before
 * blur, so we e.preventDefault() on the chip to stop blur entirely, then after syncField()
 * we re-focus the input.
 *
 * DEVANAGARI CORRUPTION HEALING
 * -----------------------------
 * If the user pastes Devanagari into the raw buffer (e.g. via auto-fill or a buggy
 * IME), field.dataset.hindiRaw can contain Unicode ऀ-ॿ chars.  The keydown
 * handler detects this with /[ऀ-ॿ]/ and resets hindiRaw to romanSuffix(field.value),
 * effectively discarding the Devanagari contamination and resuming from the last Roman
 * keystrokes only.
 *
 * KNOWN LIMITATIONS
 * -----------------
 * - No explicit halant key exists.  Words ending in a pure consonant still carry the
 *   implicit 'a' vowel.  There is no way to type क् at the end of a word.
 * - The parser is strictly left-to-right greedy.  There is no backtracking or lookahead
 *   beyond the trie match length.
 * - Mobile long-press and swipe keyboards may bypass keydown entirely; the input
 *   listener handles these, but rapid multi-char inputs can occasionally desync.
 */
(function () {
    'use strict';

    /* ---------- Mappings ---------- */
    const VOWELS = {
        a: 'अ', aa: 'आ', i: 'इ', ee: 'ई',
        u: 'उ', oo: 'ऊ', e: 'ए', ai: 'ऐ',
        o: 'ओ', au: 'औ', ri: 'ऋ', am: 'ँ', ah: 'ः'
    };

    const CONSONANTS = {
        k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ng: 'ङ',
        ch: 'च', chh: 'छ', j: 'ज', jh: 'झ', ny: 'ञ',
        t: 'त', th: 'थ', d: 'द', dh: 'ध', n: 'न',
        tt: 'ट', thh: 'ठ', dd: 'ड', dhh: 'ढ', nn: 'ण',
        p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म',
        y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
        sh: 'श', shh: 'ष', s: 'स', h: 'ह',
        ksh: 'क्ष', tr: 'त्र', gy: 'ज्ञ',
        x: 'क्ष', f: 'फ़', z: 'ज़'
    };

    const MATRAS = {
        a: '', aa: 'ा', i: 'ि', ee: 'ी',
        u: 'ु', oo: 'ू', e: 'े', ai: 'ै',
        o: 'ो', au: 'ौ', ri: 'ृ'
    };

    const HALANT = '्';
    const OVERRIDE_RI = '\u200b'; // ZWSP — forces vowel sign ृ after a consonant
    const SPLIT = '\u200c';       // ZWNJ — breaks a multi-char matra so the next char is treated fresh

    const ENDERS = new Set([' ', '\n', '.', ',', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '/', '\\', '|', '-', '_', '=', '+', '*', '%', '@', '#', '$', '^', '&', '<', '>', '"', "'", '`', '~']);

    /* ---------- Ambiguity definitions ----------
     *
     * Each ambiguity solves a Roman-to-Devanagari collision where the same
     * Latin letters map to multiple Hindi characters.  The "test" regex runs on
     * the RAW buffer; if it matches, a chip bar is rendered.
     *
     * REWRITE FUNCTIONS:  These mutate the raw buffer so that on the NEXT sync,
     * the ambiguity test NO LONGER MATCHES, and the chip bar auto-dismisses.
     *   e.g.  raw = "hin"  → test /n$/ matches → show chips.
     *         user clicks "न" → rewrite to "hinn" → test /n$/ does NOT match
     *         (ends with "nn") → chips disappear.
     *
     * ORDER MATTERS:  Longer sequences (sh, th, dh) must precede shorter ones (t, d, n)
     * because a regex like /t$/ would match the tail of "th" if evaluated first.
     */
    const AMBIGUITIES = [
        {
            id: 'sh',
            test:  /sh$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'श', rewrite: null },
                { name: 'ष', rewrite: function (raw) { return raw.slice(0, -2) + 'shh'; } }
            ]
        },
        {
            id: 'th',
            test:  /th$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'थ', rewrite: null },
                { name: 'ठ', rewrite: function (raw) { return raw.slice(0, -2) + 'thh'; } }
            ]
        },
        {
            id: 'dh',
            test:  /dh$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'ध', rewrite: null },
                { name: 'ढ', rewrite: function (raw) { return raw.slice(0, -2) + 'dhh'; } }
            ]
        },
        {
            id: 't',
            test:  /(?:^|[^t])t$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'त', rewrite: null },
                { name: 'ट', rewrite: function (raw) { return raw.slice(0, -1) + 'tt'; } }
            ]
        },
        {
            id: 'd',
            test:  /(?:^|[^d])d$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'द', rewrite: null },
                { name: 'ड', rewrite: function (raw) { return raw.slice(0, -1) + 'dd'; } }
            ]
        },
        {
            id: 'n',
            test:  /(?:^|[^n])n$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'न', rewrite: null },
                { name: 'ण', rewrite: function (raw) { return raw.slice(0, -1) + 'nn'; } },
                { name: 'ं', rewrite: function (raw) { return raw.slice(0, -1) + 'q'; } }
            ]
        },
        {
            id: 'ri',
            test:  /[bcdfghjklmnpqrstvwxyz]ri$/,
            label: function (raw) {
                return transliterateSegment(raw);
            },
            options: [
                { name: null, rewrite: null },
                { name: 'ृ',  rewrite: function (raw) { return raw.slice(0, -2) + OVERRIDE_RI; } }
            ]
        },
    ];

    /* ---------- Trie helpers ----------
     *
     * We use tries instead of simple Object lookups because many Roman sequences
     * share prefixes (e.g. "sh" and "shh" both start with "sh").  The trie lets us
     * do a greedy longest-prefix match in a single left-to-right scan.
     *
     * buildTrie:  converts { key: value } → nested object tree where __val stores
     *             the Hindi char at the terminal node.
     * matchTrie:  walks the trie from `start` index in `chars`, tracking the deepest
     *             node that has a __val.  This gives us the LONGEST matching sequence
     *             (greedy), which is what we want for multi-char inputs like "chh".
     */
    function buildTrie(map) {
        const trie = {};
        for (const [key, val] of Object.entries(map)) {
            let node = trie;
            for (const ch of key) {
                if (!node[ch]) node[ch] = {};
                node = node[ch];
            }
            node.__val = val;
        }
        return trie;
    }

    const vowelTrie   = buildTrie(VOWELS);
    const consonantTrie = buildTrie(CONSONANTS);
    const matraTrie   = buildTrie(MATRAS);

    function matchTrie(trie, chars, start) {
        let node = trie;
        let lastVal = null;
        let lastIdx = start;
        for (let i = start; i < chars.length; i++) {
            const ch = chars[i];
            if (!node[ch]) break;
            node = node[ch];
            if (node.__val !== undefined) {
                lastVal = node.__val;
                lastIdx = i + 1;
            }
        }
        return lastVal !== null ? { val: lastVal, end: lastIdx } : null;
    }

    /* ---------- Core transliteration ----------
     *
     * This is the heart of the engine.  It takes a Roman string and returns Devanagari.
     *
     * STATE MACHINE:
     *   lastWasConsonant  →  determines whether the next char should be parsed as
     *                        a matra (vowel sign), a conjunct consonant, or a new
     *                        standalone consonant.
     *
     * PARSE ORDER PER ITERATION:
     *   1. Ender (space, punctuation)       → reset lastWasConsonant.
     *   2. Anusvara shortcut 'q'            → only if prev char is Devanagari.
     *   3. SPLIT token (ZWNJ)               → skip, it already did its job in raw.
     *   4. OVERRIDE_RI token (ZWSP)         → emit ृ matra if after consonant.
     *   5. Consonant after consonant        → conjunct (halant + consonant).
     *   6. Matra after consonant            → vowel sign.
     *   7. Vowel when !lastWasConsonant     → standalone vowel letter.
     *   8. Consonant when !lastWasConsonant → new consonant syllable start.
     *   9. Fallback                         → emit char literally (unmapped).
     */
    function transliterateSegment(roman) {
        const chars = Array.from(roman.toLowerCase());
        let out = '';
        let i = 0;
        let lastWasConsonant = false;

        while (i < chars.length) {
            const ch = chars[i];

            if (ENDERS.has(ch)) {
                out += ch;
                i++;
                lastWasConsonant = false;
                continue;
            }

            /* Visarga shortcut: qq after any Devanagari char produces ः */
            if (ch === 'q' && i + 1 < chars.length && chars[i + 1] === 'q' &&
                out.length > 0 &&
                /[ऀ-ॿ]/.test(out[out.length - 1])) {
                out += 'ः';
                i += 2;
                continue;
            }

            /* Anusvara shortcut: q after any Devanagari char produces ं */
            if (ch === 'q' &&
                (i + 1 >= chars.length || chars[i + 1] !== 'q') &&
                out.length > 0 &&
                /[ऀ-ॿ]/.test(out[out.length - 1])) {
                out += 'ं';
                i++;
                continue;
            }

            /* Split token: prevents multi-char matra from swallowing the next char. */
            if (ch === SPLIT) {
                i++;
                continue;
            }

            /* Explicit override token for vowel sign ृ (e.g. k + OVERRIDE_RI -> कृ). */
            if (lastWasConsonant && ch === OVERRIDE_RI) {
                out += MATRAS['ri'];
                i++;
                lastWasConsonant = false;
                continue;
            }

            /* After a consonant, try ANOTHER consonant first (conjunct). */
            if (lastWasConsonant) {
                const con = matchTrie(consonantTrie, chars, i);
                if (con) {
                    out += HALANT + con.val;
                    i = con.end;
                    lastWasConsonant = true;
                    continue;
                }
            }

            /* After a consonant, try matra (vowel sign). */
            if (lastWasConsonant) {
                const mat = matchTrie(matraTrie, chars, i);
                if (mat) {
                    out += mat.val;
                    i = mat.end;
                    lastWasConsonant = false;
                    continue;
                }
            }

            /* Stand-alone vowel (word start or after another vowel / ender). */
            if (!lastWasConsonant) {
                const vow = matchTrie(vowelTrie, chars, i);
                if (vow) {
                    out += vow.val;
                    i = vow.end;
                    continue;
                }
            }

            /* Consonant at word start or after a vowel/ender. */
            const con = matchTrie(consonantTrie, chars, i);
            if (con) {
                out += con.val;
                i = con.end;
                lastWasConsonant = true;
                continue;
            }

            out += ch;
            i++;
            lastWasConsonant = false;
        }

        return out;
    }

    /* ---------- UI helpers ----------
     *
     * All DOM nodes are created lazily (first attachField call injects styles,
     * first ambiguity creates the .translit-suggest div).  This keeps the
     * module self-contained — no external CSS file is required.
     *
     * CHIP BAR LIFECYCLE:
     *   - checkAmbiguity() runs on every syncField() call.
     *   - It walks AMBIGUITIES in order; the FIRST matching test wins.
     *   - showSuggestions() renders one chip per option.  Chip 0 gets .active
     *     to indicate it is the default that will be auto-selected if the user
     *     keeps typing.
     *   - Clicking a chip triggers opt.rewrite(raw), mutates hindiRaw, re-syncs,
     *     and clears the bar.
     *
     * WHY MOUSEDOWN INSTEAD OF CLICK:
     *   Clicking a chip blurs the input.  The blur handler (with 200 ms delay)
     *   would clear the chip bar.  If we used 'click', the bar would be gone
     *   before the click event reaches the chip.  'Mousedown' fires BEFORE blur,
     *   so we e.preventDefault() to suppress blur, apply the rewrite, then
     *   manually re-focus the input.
     */
    function injectStyles() {
        if (document.getElementById('translit-styles')) return;
        const style = document.createElement('style');
        style.id = 'translit-styles';
        style.textContent =
            '.translit-suggest{display:flex;gap:6px;margin-top:4px;font-size:.85rem;flex-wrap:wrap}' +
            '.translit-chip{padding:2px 8px;border:1px solid #ccc;border-radius:4px;' +
            'cursor:pointer;background:#fff;color:#333;user-select:none;line-height:1.4}' +
            '.translit-chip:hover{background:#f0f0f0;border-color:#999}' +
            '.translit-chip.active{background:#e3f2fd;border-color:#2196f3;color:#0d47a1}' +
            '.translit-chip .translit-hint{font-size:.75rem;color:#666;margin-left:4px}';
        document.head.appendChild(style);
    }

    function getSuggestBox(field) {
        let box = field.parentNode.querySelector('.translit-suggest');
        if (!box) {
            box = document.createElement('div');
            box.className = 'translit-suggest';
            field.parentNode.appendChild(box);
        }
        return box;
    }

    function clearSuggestions(field) {
        const box = field.parentNode.querySelector('.translit-suggest');
        if (box) box.innerHTML = '';
    }

    function showSuggestions(field, ambiguity, raw) {
        const box = getSuggestBox(field);
        box.innerHTML = '';

        ambiguity.options.forEach(function (opt, idx) {
            const chip = document.createElement('span');
            chip.className = 'translit-chip';
            if (idx === 0) chip.classList.add('active');

            let preview;
            if (opt.rewrite === null) {
                preview = ambiguity.label(raw);
            } else {
                const rewritten = opt.rewrite(raw);
                preview = transliterateSegment(rewritten);
            }

            // For the ri ambiguity, show the exact Hindi character difference
            let labelText = opt.name || preview;
            chip.textContent = labelText;

            const hint = document.createElement('span');
            hint.className = 'translit-hint';
            hint.textContent = '(' + preview + ')';
            chip.appendChild(hint);

            chip.addEventListener('mousedown', function (e) {
                e.preventDefault(); // prevent blur
                if (opt.rewrite) {
                    field.dataset.hindiRaw = opt.rewrite(field.dataset.hindiRaw || '');
                }
                // else keep default (null rewrite)
                syncField(field);
                clearSuggestions(field);
                field.focus();
            });

            box.appendChild(chip);
        });
    }

    function checkAmbiguity(field) {
        const raw = field.dataset.hindiRaw || '';
        for (let i = 0; i < AMBIGUITIES.length; i++) {
            const amb = AMBIGUITIES[i];
            if (amb.test.test(raw)) {
                showSuggestions(field, amb, raw);
                return;
            }
        }
        clearSuggestions(field);
    }

    /* ---------- Field sync ----------
     *
     * syncField is called after EVERY raw-buffer mutation.  It:
     *   1. Runs transliterateSegment() on the raw buffer.
     *   2. Overwrites field.value with the result.
     *   3. Sets the cursor to the END of the text (since the input is being
     *      completely rewritten, preserving caret position is not meaningful).
     *   4. Sets hindiSyncing=1 so the 'input' listener knows to ignore the
     *      programmatic value change we just made.
     *   5. Triggers checkAmbiguity() to show/hide the chip bar.
     *
     * The hindiLast dataset tracks the last known visible value so the input
     * listener can diff against it and detect external mutations (paste, IME, etc.).
     */
    function syncField(field) {
        const raw = field.dataset.hindiRaw || '';
        const converted = transliterateSegment(raw);
        field.dataset.hindiSyncing = '1';
        field.value = converted;
        field.dataset.hindiLast = converted;
        field.setSelectionRange(converted.length, converted.length);
        delete field.dataset.hindiSyncing;
        checkAmbiguity(field);
    }

    function isRoman(str) {
        return /^[a-zA-Z]+$/.test(str);
    }

    function romanSuffix(str) {
        const m = str.match(/[a-zA-Z]+$/);
        return m ? m[0].toLowerCase() : '';
    }

    /* ---------- Attach ----------
     *
     * Sets up a single input/textarea field for transliteration.  The field gets
     * a dataset.transliterate='hi' guard so attachField is idempotent.
     *
     * EVENT STRATEGY:
     *   keydown  — primary path for real-time typing.  We intercept:
     *              • Backspace  → pop one char from raw buffer.
     *              • Space      → append literal space to raw buffer.
     *              • a-z, A-Z   → append to raw buffer, then sync.
     *              All of these call e.preventDefault() so the browser never
     *              inserts the raw Latin letter into the visible field.
     *
     *   input    — safety net for non-keyboard input (paste, mobile auto-correct,
     *              speech-to-text, browser extensions).  We diff oldVisible vs
     *              newVisible and attempt to reconcile the raw buffer.
     *              If new text is shorter → backspace happened via non-keydown path.
     *              If new text is longer and Roman → append to raw buffer.
     *              If new text contains Devanagari → fall back to romanSuffix().
     *
     *   blur     → hides chip bar after a 200 ms delay (allows mousedown on chips).
     *   focus    → re-evaluates ambiguity in case the user left an ambiguous tail.
     */
    function attachField(field) {
        if (field.dataset.transliterate === 'hi') return;
        field.dataset.transliterate = 'hi';
        injectStyles();

        const initial = field.value || '';
        field.dataset.hindiRaw = initial;
        field.dataset.hindiLast = initial;

        field.addEventListener('keydown', function (e) {
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            if (e.key === 'Backspace') {
                e.preventDefault();
                const raw = field.dataset.hindiRaw || '';
                if (raw.length > 0) {
                    field.dataset.hindiRaw = raw.slice(0, -1);
                    syncField(field);
                }
                return;
            }

            if (e.key === ' ') {
                e.preventDefault();
                field.dataset.hindiRaw += ' ';
                syncField(field);
                return;
            }

            if (e.key.length === 1 && isRoman(e.key)) {
                e.preventDefault();
                /*
                 * DEVANAGARI CORRUPTION HEALING
                 * Some input methods (mobile keyboards with auto-correct, paste,
                 * browser extensions, IME composition) can inject Devanagari
                 * directly into field.value.  When the user then types a Roman
                 * letter, the input listener may have synced that Devanagari into
                 * hindiRaw.  If hindiRaw now contains Unicode ऀ-ॿ chars, our trie
                 * parser will fail on the next sync because it only understands
                 * a-z.  We detect this and reset hindiRaw to the trailing Roman
                 * characters of the current visible value, effectively resuming
                 * transliteration from the last known-safe position.
                 */
                const raw = field.dataset.hindiRaw || '';
                if (raw.length > 0 && /[ऀ-ॿ]/.test(raw)) {
                    field.dataset.hindiRaw = romanSuffix(field.value || '');
                }
                field.dataset.hindiRaw += e.key.toLowerCase();
                syncField(field);
                return;
            }
        });

        field.addEventListener('input', function (e) {
            /*
             * BYPASS:  syncField() sets field.value programmatically, which
             * triggers a native 'input' event.  We set hindiSyncing='1' right
             * before the assignment and delete it immediately after.  This
             * listener ignores any event fired during that window so we don't
             * enter an infinite sync loop.
             */
            if (field.dataset.hindiSyncing) return;

            const oldVisible = field.dataset.hindiLast || '';
            const newVisible = field.value;
            if (newVisible === oldVisible) return;

            const oldRaw = field.dataset.hindiRaw || '';

            if (newVisible.length > oldVisible.length) {
                const added = newVisible.slice(oldVisible.length);
                if (isRoman(added)) {
                    field.dataset.hindiRaw = oldRaw + added.toLowerCase();
                    syncField(field);
                    return;
                }
            }

            if (newVisible.length < oldVisible.length) {
                if (oldRaw.length > 0) {
                    field.dataset.hindiRaw = oldRaw.slice(0, -1);
                    syncField(field);
                    return;
                }
            }

            const suffix = romanSuffix(newVisible);
            if (suffix) {
                field.dataset.hindiRaw = suffix;
                syncField(field);
            } else if (newVisible.length > 0) {
                field.dataset.hindiRaw = newVisible;
                field.dataset.hindiLast = newVisible;
                checkAmbiguity(field);
            } else {
                field.dataset.hindiRaw = '';
                field.dataset.hindiLast = '';
                clearSuggestions(field);
            }
        });

        field.addEventListener('blur', function () {
            // Small delay so chip click (mousedown) fires before blur clears
            setTimeout(function () {
                if (document.activeElement !== field) {
                    clearSuggestions(field);
                }
            }, 200);
        });

        field.addEventListener('focus', function () {
            checkAmbiguity(field);
        });
    }

    window.HindiTransliterator = {
        attach: function (selector) {
            document.querySelectorAll(selector).forEach(attachField);
        }
    };
})();
