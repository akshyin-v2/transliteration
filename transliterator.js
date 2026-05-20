/**
 * Hindi Phonetic Transliterator
 * Google Input Tools-style typing for Devanagari fields.
 *
 * Default parsing: consonant-first after a consonant (e.g. kri -> क्रि).
 * When ambiguity is detected, a small chip bar appears below the input
 * letting the user pick the alternate rendering case-by-case.
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
        t: 'ट', th: 'ठ', d: 'ड', dh: 'ढ', n: 'ण',
        tt: 'त', thh: 'थ', dd: 'द', dhh: 'ध', nn: 'न',
        p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म',
        y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
        sh: 'श', shh: 'ष', s: 'स', h: 'ह',
        ksh: 'क्ष', tr: 'त्र', gy: 'ज्ञ',
        x: 'क्ष', f: 'फ़', z: 'ज़'
    };

    const MATRAS = {
        a: '', aa: 'ा', i: 'ि', ee: 'ी',
        u: 'ु', oo: 'ू', e: 'े', ai: 'ै',
        o: 'ो', au: 'ौ', ri: 'ृ', am: 'ं', ah: 'ः'
    };

    const HALANT = '्';
    const OVERRIDE_RI = '\u200b'; // ZWSP — forces vowel sign ृ after a consonant
    const SPLIT = '\u200c';       // ZWNJ — breaks a multi-char matra so the next char is treated fresh

    const ENDERS = new Set([' ', '\n', '.', ',', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '/', '\\', '|', '-', '_', '=', '+', '*', '%', '@', '#', '$', '^', '&', '<', '>', '"', "'", '`', '~']);

    /* ---------- Ambiguity definitions ---------- */
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
                { name: 'ठ', rewrite: null },
                { name: 'थ', rewrite: function (raw) { return raw.slice(0, -2) + 'thh'; } }
            ]
        },
        {
            id: 'dh',
            test:  /dh$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'ढ', rewrite: null },
                { name: 'ध', rewrite: function (raw) { return raw.slice(0, -2) + 'dhh'; } }
            ]
        },
        {
            id: 't',
            test:  /([^t])t$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'ट', rewrite: null },
                { name: 'त', rewrite: function (raw) { return raw.slice(0, -1) + 'tt'; } }
            ]
        },
        {
            id: 'd',
            test:  /([^d])d$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'ड', rewrite: null },
                { name: 'द', rewrite: function (raw) { return raw.slice(0, -1) + 'dd'; } }
            ]
        },
        {
            id: 'n',
            test:  /([^n])n$/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: 'ण', rewrite: null },
                { name: 'न', rewrite: function (raw) { return raw.slice(0, -1) + 'nn'; } }
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
        {
            id: 'ah',
            test:  /[bcdfghjklmnpqrstvwxyz]ah/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: null, rewrite: null },
                { name: null, rewrite: function (raw) { return raw.replace(/([bcdfghjklmnpqrstvwxyz])ah/, '$1a' + SPLIT + 'h'); } }
            ]
        },
        {
            id: 'am',
            test:  /[bcdfghjklmnpqrstvwxyz]am/,
            label: function (raw) { return transliterateSegment(raw); },
            options: [
                { name: null, rewrite: null },
                { name: null, rewrite: function (raw) { return raw.replace(/([bcdfghjklmnpqrstvwxyz])am/, '$1a' + SPLIT + 'm'); } }
            ]
        }
    ];

    /* ---------- Trie helpers ---------- */
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

    /* ---------- Core transliteration ---------- */
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

    /* ---------- UI helpers ---------- */
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

    /* ---------- Field sync ---------- */
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

    /* ---------- Attach ---------- */
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
                /* If raw buffer was corrupted with actual Devanagari, heal it. */
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
            /* Ignore events fired while syncField is updating the value. */
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
