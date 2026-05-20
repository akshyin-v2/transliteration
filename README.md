# Hindi Transliterator

A lightweight JavaScript library that enables phonetic Hindi typing on webpage text fields. It converts English (Roman) keystrokes into Devanagari (Hindi) characters in real-time.

---

## Features

- **Real-time Transliteration** – Type using English letters and see Hindi output instantly.
- **Smart Conjuncts** – Automatically forms conjunct consonants (e.g., `kri` → `क्रि`).
- **Ambiguity Chips** – When a typed sequence can map to multiple Hindi letters (e.g., `sh` → `श` or `ष`), a small suggestion bar appears below the input so you can choose the correct one.
- **No Dependencies** – Pure vanilla JavaScript, works in any modern browser.
- **Lightweight** – Single file, easy to drop into any project.

For a deep dive into how the engine parses your keystrokes — including when to use ambiguity chips and how to force syllable breaks — see the **[Transliteration Guide](TRANSLITERATION_GUIDE.md)**.

---

## How to Use

### 1. Include the Script

Add `transliterator.js` to your HTML page:

```html
<script src="transliterator.js"></script>
```

### 2. Mark Your Input Fields

Give your `<input>` or `<textarea>` elements a recognizable selector (class or ID):

```html
<input type="text" class="hindi-input" placeholder="Type Hindi here...">
<textarea class="hindi-input" rows="4" cols="50"></textarea>
```

### 3. Attach the Transliterator

After the DOM is loaded, call `HindiTransliterator.attach()` with a CSS selector:

```html
<script>
  document.addEventListener('DOMContentLoaded', function () {
    HindiTransliterator.attach('.hindi-input');
  });
</script>
```

Now, whenever you type inside those fields, the library will convert your English keystrokes into Hindi.

---

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hindi Typing Demo</title>
  <script src="transliterator.js"></script>
  <style>
    body { font-family: sans-serif; padding: 40px; max-width: 600px; margin: auto; }
    label { display: block; margin-top: 20px; font-weight: bold; }
    input, textarea { width: 100%; padding: 10px; font-size: 1.1rem; }
  </style>
</head>
<body>
  <h1>Hindi Transliterator Demo</h1>

  <label for="name">Name (हिंदी)</label>
  <input id="name" class="hindi-input" placeholder="e.g., rajesh">

  <label for="address">Address (हिंदी)</label>
  <textarea id="address" class="hindi-input" placeholder="e.g., mumbai"></textarea>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      HindiTransliterator.attach('.hindi-input');
    });
  </script>
</body>
</html>
```

**Try typing:**
- `namaste` → `नमस्ते`
- `bharat` → `भारत`
- `shanti` → `शांति`

---

## Transliteration Reference

### Vowels (Independent)

| Roman | Hindi |
|-------|-------|
| `a`   | अ     |
| `aa`  | आ     |
| `i`   | इ     |
| `ee`  | ई     |
| `u`   | उ     |
| `oo`  | ऊ     |
| `e`   | ए     |
| `ai`  | ऐ     |
| `o`   | ओ     |
| `au`  | औ     |
| `ri`  | ऋ     |
| `am`  | ◌ँ    |
| `ah`  | ◌ः    |

### Consonants

| Roman  | Hindi |
|--------|-------|
| `k`    | क     |
| `kh`   | ख     |
| `g`    | ग     |
| `gh`   | घ     |
| `ng`   | ङ     |
| `ch`   | च     |
| `chh`  | छ     |
| `j`    | ज     |
| `jh`   | झ     |
| `ny`   | ञ     |
| `t`    | ट     |
| `th`   | ठ     |
| `d`    | ड     |
| `dh`   | ढ     |
| `n`    | ण     |
| `tt`   | त     |
| `thh`  | थ     |
| `dd`   | द     |
| `dhh`  | ध     |
| `nn`   | न     |
| `p`    | प     |
| `ph`   | फ     |
| `b`    | ब     |
| `bh`   | भ     |
| `m`    | म     |
| `y`    | य     |
| `r`    | र     |
| `l`    | ल     |
| `v`, `w` | व   |
| `sh`   | श     |
| `shh`  | ष     |
| `s`    | स     |
| `h`    | ह     |
| `ksh`  | क्ष    |
| `tr`   | त्र    |
| `gy`   | ज्ञ    |

### Vowel Signs (Matras)

When a vowel follows a consonant, it becomes a matra (vowel sign) attached to that consonant:

| After Consonant | Matra |
|-----------------|-------|
| `aa`            | ा     |
| `i`             | ि     |
| `ee`            | ी     |
| `u`             | ु     |
| `oo`            | ू     |
| `e`             | े     |
| `ai`            | ै     |
| `o`             | ो     |
| `au`            | ौ     |
| `ri`            | ृ     |

### Special Characters

| Purpose | Description |
|---------|-------------|
| `्` (halant) | Used internally to form conjuncts, e.g., `k` + `r` → `क्र`. |

---

## Ambiguous Sequences

Some Roman sequences can map to multiple Hindi letters. The library shows a suggestion chip when it detects ambiguity:

| Typed | Default | Alternative | How to get alternative |
|-------|---------|-------------|----------------------|
| `sh`  | श       | ष           | Select "ष" from the chip |
| `th`  | ठ       | थ           | Select "थ" from the chip |
| `dh`  | ढ       | ध           | Select "ध" from the chip |
| `t`   | ट       | त           | Select "त" from the chip |
| `d`   | ड       | द           | Select "द" from the chip |
| `n`   | ण       | न           | Select "न" from the chip |
| `...ri` | ...रि | ...ृ        | Select "ृ" from the chip |

---

## API

### `HindiTransliterator.attach(selector)`

Attaches transliteration behavior to all elements matching the given CSS selector.

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `selector`| `string` | A valid CSS selector (e.g., `.hindi-input`, `#name`, `input[type="text"]`). |

**Example:**

```javascript
// Attach to all elements with class "hindi-input"
HindiTransliterator.attach('.hindi-input');

// Attach to a specific element by ID
HindiTransliterator.attach('#myTextarea');
```

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge) that support:
- ES6 (JavaScript 2015)
- `Array.from()`
- `String.prototype.match()` with Unicode

---

## File Structure

```
├── transliterator.js           # Main library file
├── test.html                 # Interactive test page
├── test.css                  # Styles for the test page
├── README.md                 # This file
├── TRANSLITERATION_GUIDE.md  # Deep-dive into typing mechanics
└── LICENSE                   # License file
```

---

## Attribution

This project was built with assistance from **Claude Code**, Anthropic's official CLI for Claude.

---

## License

See the [LICENSE](LICENSE) file for details.
