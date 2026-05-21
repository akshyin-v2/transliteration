# How Hindi Transliteration Works

This guide explains the mechanics of the transliteration engine so you can type accurately and know what to do when the output does not match your intention.

---

## The Parsing Engine

The library reads your keystrokes **left-to-right** using a greedy trie-based parser. It categorizes every sequence into one of three buckets:

1. **Vowels** — typed at the start of a word or after another vowel/space.
2. **Consonants** — typed at the start of a word or after a vowel/space.
3. **Matras (vowel signs)** — typed **after a consonant** to modify that consonant's sound.

### The Golden Rule

> **After a consonant, the parser always tries to form a conjunct (cluster) first.**

This means if you type a consonant and immediately follow it with another consonant, the engine assumes you want a combined letter (e.g., `k` + `r` → `क्र`) rather than two separate syllables (`क` + `र`).

---

## 1. The Dental Default — When You Need Retroflex

The engine uses **dental** consonants as the default for ambiguous Roman sequences:

| Roman | Default output | Retroflex alternate | How to get retroflex |
|-------|----------------|---------------------|----------------------|
| `n` | **न** (dental) | **ण** (retroflex) | Use `nn` |
| `t` | **त** (dental) | **ट** (retroflex) | Use `tt` |
| `th` | **थ** (dental) | **ठ** (retroflex) | Use `thh` |
| `d` | **द** (dental) | **ड** (retroflex) | Use `dd` |
| `dh` | **ध** (dental) | **ढ** (retroflex) | Use `dhh` |
| `sh` | **श** (palatal) | **ष** (retroflex) | Use `shh` |

In standard Hindi, the **dental** set (`न`, `त`, `थ`, `द`, `ध`) is used in ~80% of common words, so these are the defaults. The retroflex set (`ण`, `ट`, `ठ`, `ड`, `ढ`) appears mainly in Sanskrit tatsamas, loanwords, and specific contexts.

---

## 2. Word-by-Word Recipe Book

Below are exact keystrokes for common Hindi words.

### Everyday Greetings & Words

| Hindi | Keystrokes | Why it works |
|-------|------------|--------------|
| नमस्ते | `namaste` | `n` → `न`, `t` → `त` (dental defaults) |
| हिंदी | `hiqdee` | `hiq` → `हिं`, `d` + `ee` → `दी` |
| हिंदुस्तान | `hiqdustaan` | `hiq` → `हिं`, rest is direct |
| भाषा | `bhaashhaa` | `shh` → `ष` (retroflex needed here) |
| बहुत | `bahut` | Direct |
| सुंदर | `suqdar` | `suq` → `सुं`, then `dar` → `दर` |
| है | `hai` | `ai` matra after `h` → `ै` |
| से | `se` | Direct |
| प्रेम | `prem` | Direct |
| राज | `raaj` | Direct |
| लोक | `lok` | Direct |
| सूरज | `sooraj` | Direct |
| प्यार | `pyaar` | Direct |
| काम | `kaam` | Direct |
| मार्ग | `maarg` | Direct |
| काल | `kaal` | Direct |
| विश्व | `vishva` | Direct |
| सत्य | `satya` | `t` → `त`, `y` → `्य` conjunct |
| मनुष्य | `manushhya` | `shh` → `ष` (retroflex), `y` → `्य` |
| ज्ञान | `gyaan` | `gy` → `ज्ञ`, direct |
| क्षत्रिय | `kshatriya` | `ksh` → `क्ष`, direct |
| पशु | `pashu` | Direct |
| वचन | `vachan` | Direct |
| गांव | `gaaqv` | `gaaq` → `गां`, `v` → `व` |
| आम | `aam` | Direct |
| अम | `a‌m` | Use SPLIT before `m` to prevent matra |
| काव्य | `kaavya` | Direct |
| सागर | `saagar` | Direct |
| मानव | `maanav` | Direct |
| समय | `samaya` | Extra `a` forces syllable break |

### People, Places, Deities

| Hindi | Keystrokes | Why it works |
|-------|------------|--------------|
| भारत | `bhaarat` | Direct (`t` → dental `त`) |
| देश | `desha` | Direct |
| दीपक | `deepak` | Direct |
| तारा | `taaraa` | Direct |
| दान | `daana` | Direct |
| ध्यान | `dhyaan` | `dh` + `y` → `ध्य` conjunct |
| संसार | `saqsaar` | `q` for anusvara `ं` |
| देव | `deva` | Direct |
| मंदिर | `maqdir` | `q` for `ं`, then direct |
| राम | `raam` | Direct |
| रावण | `raavann` | `nn` → `ण` (retroflex) |
| सीता | `seetaa` | `see` → `सी` |
| हनुमान | `hanumaan` | Direct |
| बलि | `bali` | Direct |
| सुग्रीव | `sugreeva` | `gree` → `ग्री` |
| अंगद | `aqgad` | `q` for `ं` after vowel `a` |
| मिथिला | `mithilaa` | Direct |
| लंका | `laqkaa` | `q` for `ं` |
| काशी | `kaashee` | Direct |
| प्रयाग | `prayaag` | Direct |
| ऋषि | `rishhi` | `ri` → `ऋ`, `shh` → `ष` |
| गंगा | `gaqgaa` | `q` for `ं` (avoids `ng` → `ङ`) |
| यमुना | `yamunaa` | Direct |
| सरस्वती | `sarasvatee` | `tee` → `ती` |
| शैव | `shaiva` | Direct |
| शाक्त | `shaakt` | `t` → dental `त` (correct here) |
| नाथ | `naath` | Direct (`th` → dental `थ`) |
| शंकर | `shaqkar` | `q` for `ं` |
| शिव | `shiva` | Direct |
| पशुपति | `pashupati` | Direct |
| उमा | `umaa` | Direct |
| रुद्र | `rudra` | Direct |
| भैरव | `bhairava` | Direct |
| गणेश | `gannesh` | `nn` → `ण` (retroflex) |
| विनायक | `vinaayak` | Direct |
| एकदंत | `ekadaqt` | `q` for `ं`, `t` → dental `त` |
| नारायण | `naaraayann` | `nn` → `ण` (retroflex) |
| वामन | `vaaman` | Direct |
| परशुराम | `parashuraam` | Direct |
| गोपाल | `gopaal` | Direct |
| राधा | `raadhaa` | Direct (`dh` → dental `ध`) |
| कैकेयी | `kaikeyee` | Direct |
| केकय | `kekaya` | Direct |

---

## 3. Known Limitations & Workarounds

### The `ny` Trap

After a vowel or matra, the sequence `ny` is greedily matched as the single consonant `ञ` (e.g., `kanya` → `कञ`). There is currently no way to force `न` + `य` conjunct (`न्य`) when `n` follows a vowel.

**Workaround:** Use an extra `a` to separate the syllables, or pick a different spelling if possible.

### The `ri` Vowel Trap

After a vowel or matra, `ri` is matched as the independent vowel `ऋ` instead of consonant `र` + matra `ि`. This breaks words like `hari` → `हऋ`.

**Workaround:** Use `ree` instead of `ri` to get the `री` sound (e.g., `haree` → `हरी`). For the `रि` sound, there is no easy workaround without chips.

### The `ng` Trap

After a vowel, `ng` is matched as the single consonant `ङ` (e.g., `gangaa` → `गङा`). Most Hindi speakers expect `ंग` (anusvara + `ग`).

**Workaround:** Use `q` for anusvara instead: `gaqgaa` → `गंगा`.

### The `am`/`ah` Legacy

Older versions mapped `am` → `ं` and `ah` → `ः` as matras. These have been **removed**.

- To type anusvara (`ं`), use the **`q` shortcut** after a vowel/matra.
- To type visarga (`ः`), there is currently no direct shortcut.

---

## 4. The OVERRIDE_RI Token for ृ

By default, `ri` after a consonant forms a conjunct: `kri` → `क्रि` (क्र + ि). If you want the vowel sign `ृ` instead, insert a ZWSP (zero-width space, `​`) before `r`.

| You want | You typed | You got | Correct way |
|----------|-----------|---------|-------------|
| कृपा | `kripa` | `क्रिपा` | `k​rpa` |
| कृष्ण | `krishna` | `क्रिश्ण` | `k​rshhnn` |
| वृक्ष | `vrksh` | `व्र्क्ष` | `v​rksh` |
| कावेरी | `kaaverii` | `कावेरि` | `kaave​ree` |

**Note:** On most keyboards, ZWSP is hard to type. The chip bar offers the same choice when you type `kri`.

---

## 5. Bypassing Chips — The `q` and `qq` Shortcuts

Typing `n` at the end of a word triggers 3 chips because `n` can map to `न`, `ण`, or `ं`. You can skip the chips by using the **`q` shortcut**.

| To get | Type | Instead of |
|--------|------|------------|
| हिं | `hiq` | `hin` + click chip |
| कं | `kaq` | `kan` + click chip |
| मैं | `maiq` | `main` + click chip |
| हूं | `hooq` | `hoon` + click chip |
| लंका | `laqkaa` | `laanka` + click chip |
| शंकर | `shaqkar` | `shankar` + click chip |
| संसार | `saqsaar` | `sansaar` + click chip |
| मंदिर | `maqdir` | `mandir` + click chip |

### How `q` works

- After any Devanagari character, `q` immediately produces `ं` (anusvara).
- At the start of a word or after a space/punctuation, `q` stays as literal `q`.

### Visarga shortcut (`qq`)

Type **`qq`** after any Devanagari character to get **visarga** (`ः`).

| To get | Type |
|--------|------|
| रामः | `raamqq` |
| हिः | `hiqq` |
| दुः | `duqq` |
| कः | `kaqq` |

---

## 6. Forcing a New Syllable — The Extra `a` Trick

Because the parser clusters consonants by default, some words need an **extra `a`** to force the engine to finish the current consonant with its implicit vowel and start a fresh syllable.

### How it works

When you type a consonant, it implicitly carries the short "a" vowel (`क` is pronounced "ka"). If you type another consonant immediately, the parser **removes** that implicit vowel and forms a conjunct.

To **preserve** the implicit vowel and start a new syllable, insert an explicit `a` between the consonants.

### Examples

#### Example A: `शन` vs `श्न`

| Keystrokes | Parsed as | Hindi output | Notes |
|------------|-----------|--------------|-------|
| `shna` | `sh` + `n` (conjunct) | **श्न** | No implicit vowel on `sh` |
| `shana` | `sha` + `na` | **शन** | Extra `a` forces syllable break |

#### Example B: `करम` vs `कर्म`

| Keystrokes | Parsed as | Hindi output | Notes |
|------------|-----------|--------------|-------|
| `karma` | `kar` (conjunct) + `ma` | **कर्म** | `r` + `m` form a cluster |
| `karama` | `ka` + `ra` + `ma` | **करम** | Extra `a` separates `ka` and `ra` |

#### Example C: `राम` vs `रम`

| Keystrokes | Parsed as | Hindi output | Notes |
|------------|-----------|--------------|-------|
| `rama` | `ra` + `ma` | **रम** | Short `a` vowels |
| `raama` | `raa` + `ma` | **राम** | Double `aa` gives long `आ` vowel |

#### Example D: `सवर` vs `स्वर`

| Keystrokes | Parsed as | Hindi output | Notes |
|------------|-----------|--------------|-------|
| `sawar` | `sa` + `wa` + `ra` | **सवर** | `w` is a new consonant after `sa` |
| `swar` | `sw` (conjunct) + `ra` | **स्वर** | `s` + `w` form a cluster |

### General Rule

> If you want two consonants to appear as **separate syllables** instead of a conjunct, insert an **`a`** between them.

This tells the parser:
1. The first consonant is complete (with its implicit `a` vowel).
2. The next letter starts a brand-new syllable.

---

## 7. Matras (Vowel Signs After Consonants)

When a vowel follows a consonant, it usually becomes a **matra** (a combining mark) rather than an independent vowel letter.

| Keystrokes | Parsed as | Hindi output |
|------------|-----------|--------------|
| `ka` | `k` + matra `a` (empty) | **क** |
| `kaa` | `k` + matra `aa` | **का** |
| `ki` | `k` + matra `i` | **कि** |
| `kee` | `k` + matra `ee` | **की** |
| `ku` | `k` + matra `u` | **कु** |
| `koo` | `k` + matra `oo` | **कू** |
| `ke` | `k` + matra `e` | **के** |
| `kai` | `k` + matra `ai` | **कै** |
| `ko` | `k` + matra `o` | **को** |
| `kau` | `k` + matra `au` | **कौ** |
| `kri` | `k` + `r` (conjunct) + matra `i` | **क्रि** |

Notice that `kri` forms a conjunct (`क्र`) and then applies the matra (`ि`). This is the default behavior described in the Golden Rule.

---

## 8. Summary Cheat Sheet

| Goal | Technique |
|------|-----------|
| Type a conjunct (cluster) | Just type the consonants together: `kri` → `क्रि` |
| Break a conjunct into syllables | Insert `a` between consonants: `shana` → `शन` |
| Get long vowel sound | Double the vowel key: `kaa` → `का`, `kee` → `की` |
| Pick an alternate Hindi letter | Click the chip in the suggestion bar |
| Keep the default ambiguous mapping | Just keep typing; the default is auto-selected |
| Type anusvara quickly | Use `q` after a vowel/matra: `hiq` → `हिं` |
| Type dental न/त/थ/द/ध | Use plain `n`, `t`, `th`, `d`, `dh` (defaults) |
| Type retroflex ण/ट/ठ/ड/ढ | Use `nn`, `tt`, `thh`, `dd`, `dhh` |
| Get vowel sign ृ instead of रि | Use OVERRIDE_RI (ZWSP) before `ri` |
| Prevent `ri` from becoming `ऋ` | Use `ree` instead (e.g. `haree` → `हरी`) |
| Get `ंग` instead of `ङ` | Use `q` for anusvara (e.g. `gaqgaa` → `गंगा`) |
| Type visarga quickly | Use `qq` after any Devanagari char (e.g. `raamqq` → `रामः`) |

---

## Quick Reference: Full Character Table

See `README.md` for the complete mapping tables.
