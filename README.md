# Cineby TV - Netflix-style Interface for Tizen Smart TVs

A TizenBrew module that transforms **cineby.at** into a Netflix-style TV interface with full remote control support.

## Features

### 🎨 Netflix-Style UI
- Clean, TV-optimized interface
- Netflix-style red focus border
- Smooth focus animations and transitions
- Increased font sizes for TV viewing distances
- Hides desktop-only elements (headers, sidebars, footers)

### 🎮 Full Remote Control Support
- **Arrow Keys (▲▼◀▶):** Navigate between movies, shows, and menus
- **Enter (OK):** Select focused item
- **Back/Return (10009):** Go back or close dialogs

### 📺 TV Optimizations
- Fixed viewport (1920px / 1280px)
- Spatial navigation engine
- Automatic focus management
- Smooth scrolling
- Custom back button

### ⚡ Performance
- ES5 JavaScript (Tizen 3.0 compatible)
- Efficient focus scanning
- MutationObserver support
- Lightweight and fast

---

# Installation

## Requirements

- Samsung Smart TV (Tizen 3.0+)
- TizenBrew installed
- Node.js (optional, for development)

## Install

```bash
npm install tizenbrew-cineby-at
```

Or download this repository and install it manually in TizenBrew.

---

# Setup

1. Install the module.
2. Add it to your TizenBrew Mods folder.
3. Launch **https://cineby.at**
4. The TV interface loads automatically.

---

# Remote Controls

| Button | Action |
|---------|--------|
| ▲ ▼ ◀ ▶ | Navigate |
| Enter | Select |
| Back | Previous page / Close popup |

---

# Configuration

Edit `index.js` if you want to customize the interface.

```javascript
var CONFIG = {
  viewports: [1920, 1280],
  focusColor: '#E50914',
  focusSize: '4px',
  focusAnimation: true,
  fontSizeMultiplier: 1.2,
  cardPadding: '16px'
};
```

---

# Browser Compatibility

- ✅ Tizen 3.0+
- ✅ Chromium 47
- ✅ ES5 JavaScript

---

# Project Structure

```
tizenbrew-cineby-at/
├── index.js
├── package.json
├── README.md
├── MODULE.md
└── test.html
```

---

# Development

No build process is required.

Simply edit `index.js` and reload the page on your TV.

---

# Troubleshooting

## Module doesn't load

- Verify TizenBrew is installed.
- Ensure you're visiting **https://cineby.at**.
- Check the TV console for errors.

## Navigation isn't working

- Reload the page.
- Verify remote keys are detected.
- Check whether Cineby changed its website layout.

---

# Contributing

Pull requests are welcome.

Please:

- Keep ES5 compatibility.
- Test on real Samsung TVs.
- Test navigation thoroughly.

---

# License

MIT License

---

# Credits

- Original concept by **TizenBrew**
- Netflix-inspired TV interface
- Maintained for **cineby.at**

---

Enjoy streaming on your Samsung Smart TV! 🎬📺