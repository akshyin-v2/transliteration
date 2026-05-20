# How Hindi Transliteration Works

This guide explains the mechanics of the transliteration engine so you can type accurately and know what to do when the output doesn't match your intention.

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

## 1. Ambiguous Sequences — Picking the Right Chip

Some Roman strings map to more than one Hindi letter. When ambiguity is detected, a small chip bar appears below the input field. Click the desired chip to choose.

| Typed | Default (chip 1) | Alternate (chip 2) | Example context |
|-------|------------------|--------------------|-----------------|
| `sh` | **श** | **ष** | `shanti` → `शांति` (default) vs `षांति` (alternate) |
| `th` | **ठ** | **थ** | `thanda` → `ठंडा` (default) vs `थanda` (alternate) |
| `dh` | **ढ** | **ध** | `dhan` → `ढन` (default) vs `धन` (alternate) |
| `t`  | **ट** | **त** | `tamatar` → `टमाटर` (default) vs `तमाटर` (alternate) |
| `d`  | **ड** | **द** | `desh` → `डेश` (default) vs `देश` (alternate) |
| `n`  | **ण** | **न** | `namak` → `णमक` (default) vs `नमक` (alternate) |
| `ri` after a consonant | **रि** | **ृ** (vowel sign) | `kripa` → `क्रिपा` (default) vs `कृपा` (alternate) |

**Tip:** The chip bar only appears while the ambiguous sequence is at the **end** of your current typing. Once you continue typing, the default is locked in.

---

## 2. Forcing a New Syllable — The Extra `a` Trick

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

## 3. Matras (Vowel Signs After Consonants)

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

## 4. Common Scenarios & Recipes

### Typing a word ending in a consonant (no implicit vowel)

Hindi words often end with a pure consonant sound. The parser **always** adds an implicit `a` to a trailing consonant unless you tell it otherwise.

There is no explicit halant key in the Roman mapping. To force a halant, the parser would need support for a dedicated key (e.g., `x` or a period). Currently, trailing consonants will carry the implicit vowel.

**Workaround:** For now, words ending in a consonant will render with the implicit `a`.

### Typing anusvara (`ं`) and visarga (`ः`)

| Keystrokes | Hindi output | Example |
|------------|--------------|---------|
| `am` | **ं** | `hindustan` → `हिंदुस्तान` (if you want the anusvara on the `i`) — actually use `hin` + `dus...` wait. Use `am` at the end of a consonant: `kam` → `कं` |
| `ah` | **ः** | Similar usage for visarga |

Note: `am` and `ah` after a consonant are treated as matras. If you want them as standalone marks, they follow a consonant.

---

## 5. Summary Cheat Sheet

| Goal | Technique |
|------|-----------|
| Type a conjunct (cluster) | Just type the consonants together: `kri` → `क्रि` |
| Break a conjunct into syllables | Insert `a` between consonants: `shana` → `शन` |
| Get long vowel sound | Double the vowel key: `kaa` → `का`, `kee` → `की` |
| Pick an alternate Hindi letter | Click the chip in the suggestion bar |
| Keep the default ambiguous mapping | Just keep typing; the default is auto-selected |

---

## Quick Reference: Full Character Table

See `README.md` for the complete mapping tables.
