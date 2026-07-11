# Module Files

## package.json
```json
{
  "name": "tizenbrew-cineby-at",
  "version": "1.0.0",
  "description": "Netflix-style TV interface for cineby.gd with full remote control support",
  "author": "TizenBrew",
  "license": "MIT",
  "packageType": "mods",
  "appName": "Cineby TV",
  "websiteURL": "https://cineby.at",
  "main": "index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/tizenbrew/cineby-tv"
  },
  "keywords": [
    "tizenbrew",
    "tizen",
    "cineby",
    "netflix",
    "tv",
    "smart-tv"
  ],
  "engines": {
    "node": ">=0.10.0"
  }
}
```

## index.js
```javascript
// Cineby TV - Netflix-style UI for Tizen Smart TVs
// TizenBrew Module - Site Modification

(function() {
  'use strict';

  // ========================================
  // CONFIGURATION
  // ========================================
  var CONFIG = {
    viewports: [1920, 1280],
    focusColor: '#E50914', // Netflix red
    focusSize: '4px',
    focusAnimation: true,
    fontSizeMultiplier: 1.2,
    cardPadding: '16px',
    hideSelectors: [
      'header', // Desktop header
      'footer', // Desktop footer
      '.sidebar', // Sidebars
      '.side-nav', // Side navigation
      '.left-menu', // Left menus
      '.right-menu', // Right menus
      '#cookie-banner', // Cookie banners
      '.popup', // Popups
      '.modal', // Modals
      '.ad', // Ads
      '.advertisement', // Advertisements
      '.social-share', // Social sharing
      '.desktop-only' // Desktop-only elements
    ],
    focusableSelectors: [
      'a[href]',
      'button',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
      '.movie-card',
      '.video-card',
      '.content-card',
      '[class*="card"]',
      '[class*="item"]',
      '[class*="poster"]',
      'img[alt]'
    ]
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  var state = {
    focusIndex: 0,
    focusableElements: [],
    currentViewport: 1920,
    initialized: false,
    lastFocus: null
  };

  // ========================================
  // DOM HELPERS
  // ========================================
  function addStyles() {
    var style = document.createElement('style');
    style.id = 'cineby-tv-styles';
    style.textContent = [
      // ========================================
      // VIEWPORT AND LAYOUT
      // ========================================
      'html, body {',
      '  width: ' + CONFIG.viewports[0] + 'px !important;',
      '  max-width: ' + CONFIG.viewports[0] + 'px !important;',
      '  min-width: ' + CONFIG.viewports[0] + 'px !important;',
      '  overflow-x: hidden !important;',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '}',

      // ========================================
      // HIDE DESKTOP ELEMENTS
      // ========================================
      CONFIG.hideSelectors.join(', ') + ' {',
      '  display: none !important;',
      '  visibility: hidden !important;',
      '}',

      // ========================================
      // TV-OPTIMIZED CONTAINERS
      // ========================================
      '.tv-container {',
      '  width: 100% !important;',
      '  padding: 0 40px !important;',
      '  box-sizing: border-box !important;',
      '}',

      // ========================================
      // FOCUS STYLES (NETFLIX RED)
      // ========================================
      '.tv-focused {',
      '  outline: ' + CONFIG.focusSize + ' solid ' + CONFIG.focusColor + ' !important;',
      '  box-shadow: 0 0 20px ' + CONFIG.focusColor + ', ',
      '              0 0 40px ' + CONFIG.focusColor + ', ',
      '              0 0 60px rgba(229, 9, 20, 0.3) !important;',
      '  transform: scale(1.08) !important;',
      '  transition: all 0.15s ease-out !important;',
      '  z-index: 9999 !important;',
      '  position: relative !important;',
      '}',

      // ========================================
      // FOCUS ANIMATION
      // ========================================
      '@keyframes focusPulse {',
      '  0%, 100% { box-shadow: 0 0 20px ' + CONFIG.focusColor + ', ',
      '                           0 0 40px ' + CONFIG.focusColor + ', ',
      '                           0 0 60px rgba(229, 9, 20, 0.3); }',
      '  50% { box-shadow: 0 0 30px ' + CONFIG.focusColor + ', ',
      '                0 0 50px ' + CONFIG.focusColor + ', ',
      '                0 0 70px rgba(229, 9, 20, 0.5); }',
      '}',

      '.tv-focused.animating {',
      '  animation: focusPulse 2s ease-in-out infinite;',
      '}',

      // ========================================
      // CARD STYLES
      // ========================================
      '[class*="card"], ',
      '[class*="item"], ',
      '[class*="poster"], ',
      '[class*="movie"], ',
      '[class*="video"] {',
      '  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out !important;',
      '  cursor: pointer !important;',
      '  border-radius: 4px !important;',
      '}',

      // ========================================
      // TYPOGRAPHY
      // ========================================
      'body, h1, h2, h3, h4, h5, h6, p, span, div {',
      '  font-size: ' + CONFIG.fontSizeMultiplier + 'em !important;',
      '  line-height: 1.4 !important;',
      '}',

      'h1 { font-size: 2.5em !important; }',
      'h2 { font-size: 2em !important; }',
      'h3 { font-size: 1.75em !important; }',
      'h4 { font-size: 1.5em !important; }',
      'h5 { font-size: 1.25em !important; }',
      'h6 { font-size: 1.1em !important; }',

      // ========================================
      // FOCUSABLE ELEMENTS
      // ========================================
      'a, button, [role="button"] {',
      '  outline: none !important;',
      '  transition: all 0.15s ease-out !important;',
      '}',

      'a:focus, button:focus, [role="button"]:focus {',
      '  outline: none !important;',
      '}',

      // ========================================
      // SCROLLBARS
      // ========================================
      '::-webkit-scrollbar {',
      '  width: 0 !important;',
      '  height: 0 !important;',
      '}',

      // ========================================
      // HIGHLIGHT PREVENTION
      // ========================================
      '*::-moz-selection {',
      '  background: transparent !important;',
      '}',
      '*::selection {',
      '  background: transparent !important;',
      '}',

      // ========================================
      // MAIN CONTENT WRAPPER
      // ========================================
      '.tv-content-wrapper {',
      '  padding: 20px !important;',
      '  box-sizing: border-box !important;',
      '}',

      // ========================================
      // HORIZONTAL SCROLL CONTAINERS
      // ========================================
      '.tv-scroll-container {',
      '  display: flex !important;',
      '  overflow-x: auto !important;',
      '  overflow-y: hidden !important;',
      '  scroll-behavior: smooth !important;',
      '  gap: ' + CONFIG.cardPadding + ' !important;',
      '  padding: ' + CONFIG.cardPadding + ' !important;',
      '}',

      // ========================================
      // VIDEO PLAYER FIXES
      // ========================================
      'video {',
      '  width: 100% !important;',
      '  height: auto !important;',
      '  max-height: 100vh !important;',
      '}',

      // ========================================
      // OVERLAY STYLES
      // ========================================
      '.tv-overlay {',
      '  position: fixed !important;',
      '  top: 0 !important;',
      '  left: 0 !important;',
      '  right: 0 !important;',
      '  bottom: 0 !important;',
      '  background: rgba(0, 0, 0, 0.95) !important;',
      '  z-index: 99999 !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  justify-content: center !important;',
      '}',

      // ========================================
      // LOADING INDICATOR
      // ========================================
      '.tv-loading {',
      '  border: 4px solid rgba(255, 255, 255, 0.3) !important;',
      '  border-top: 4px solid ' + CONFIG.focusColor + ' !important;',
      '  border-radius: 50% !important;',
      '  width: 60px !important;',
      '  height: 60px !important;',
      '  animation: tvSpin 1s linear infinite !important;',
      '}',

      '@keyframes tvSpin {',
      '  0% { transform: rotate(0deg); }',
      '  100% { transform: rotate(360deg); }',
      '}',

      // ========================================
      // BACK BUTTON INDICATOR
      // ========================================
      '.tv-back-button {',
      '  position: fixed !important;',
      '  top: 20px !important;',
      '  left: 20px !important;',
      '  background: rgba(0, 0, 0, 0.8) !important;',
      '  color: white !important;',
      '  border: 2px solid ' + CONFIG.focusColor + ' !important;',
      '  padding: 12px 24px !important;',
      '  font-size: 1.2em !important;',
      '  border-radius: 8px !important;',
      '  cursor: pointer !important;',
      '  z-index: 99998 !important;',
      '}',

      '.tv-back-button.tv-focused {',
      '  background: ' + CONFIG.focusColor + ' !important;',
      '}'

    ].join('\n');
    document.head.appendChild(style);
  }

  // ========================================
  // SPATIAL NAVIGATION ENGINE
  // ========================================
  function scanFocusableElements() {
    var elements = [];
    var selectors = CONFIG.focusableSelectors.join(', ');

    var allElements = document.querySelectorAll(selectors);
    var i = 0;
    for (i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (isElementVisible(el) && isElementInteractable(el)) {
        elements.push(el);
      }
    }

    state.focusableElements = elements;
    return elements;
  }

  function isElementVisible(el) {
    if (!el) return false;
    if (el.offsetParent === null) return false;

    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    if (rect.top > window.innerHeight || rect.bottom < 0) return false;
    if (rect.left > window.innerWidth || rect.right < 0) return false;

    return true;
  }

  function isElementInteractable(el) {
    if (!el) return false;

    var tagName = el.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
      return false;
    }

    if (el.getAttribute('disabled')) return false;

    var style = window.getComputedStyle(el);
    if (style.pointerEvents === 'none') return false;

    return true;
  }

  // ========================================
  // FOCUS MANAGEMENT
  // ========================================
  function setFocus(index) {
    if (state.focusableElements.length === 0) {
      return;
    }

    // Remove focus from current element
    if (state.lastFocus) {
      state.lastFocus.classList.remove('tv-focused');
      state.lastFocus.classList.remove('animating');
    }

    // Ensure index is within bounds
    if (index < 0) index = 0;
    if (index >= state.focusableElements.length) {
      index = state.focusableElements.length - 1;
    }

    state.focusIndex = index;
    var element = state.focusableElements[index];

    // Add focus to new element
    element.classList.add('tv-focused');
    if (CONFIG.focusAnimation) {
      element.classList.add('animating');
    }

    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    state.lastFocus = element;
  }

  function moveFocus(direction) {
    if (state.focusableElements.length === 0) {
      scanFocusableElements();
      if (state.focusableElements.length === 0) {
        return;
      }
    }

    var currentEl = state.focusableElements[state.focusIndex];
    var currentIndex = state.focusIndex;
    var bestIndex = -1;
    var bestScore = Infinity;

    var currentRect = currentEl.getBoundingClientRect();
    var currentCenterX = currentRect.left + currentRect.width / 2;
    var currentCenterY = currentRect.top + currentRect.height / 2;

    var i = 0;
    for (i = 0; i < state.focusableElements.length; i++) {
      if (i === currentIndex) continue;

      var el = state.focusableElements[i];
      var rect = el.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var deltaX = centerX - currentCenterX;
      var deltaY = centerY - currentCenterY;
      var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      var isCandidate = false;

      if (direction === 'up' && deltaY < -10 && Math.abs(deltaX) < currentRect.width * 2) {
        isCandidate = true;
      } else if (direction === 'down' && deltaY > 10 && Math.abs(deltaX) < currentRect.width * 2) {
        isCandidate = true;
      } else if (direction === 'left' && deltaX < -10 && Math.abs(deltaY) < currentRect.height * 2) {
        isCandidate = true;
      } else if (direction === 'right' && deltaX > 10 && Math.abs(deltaY) < currentRect.height * 2) {
        isCandidate = true;
      }

      if (isCandidate && distance < bestScore) {
        bestScore = distance;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      setFocus(bestIndex);
    } else {
      // Fallback: simple linear navigation
      if (direction === 'down' || direction === 'right') {
        if (currentIndex < state.focusableElements.length - 1) {
          setFocus(currentIndex + 1);
        }
      } else if (direction === 'up' || direction === 'left') {
        if (currentIndex > 0) {
          setFocus(currentIndex - 1);
        }
      }
    }
  }

  // ========================================
  // REMOTE CONTROL HANDLER
  // ========================================
  function handleKeyDown(e) {
    var keyCode = e.keyCode;

    switch (keyCode) {
      // Left Arrow (37)
      case 37:
        e.preventDefault();
        moveFocus('left');
        break;

      // Up Arrow (38)
      case 38:
        e.preventDefault();
        moveFocus('up');
        break;

      // Right Arrow (39)
      case 39:
        e.preventDefault();
        moveFocus('right');
        break;

      // Down Arrow (40)
      case 40:
        e.preventDefault();
        moveFocus('down');
        break;

      // Enter (13)
      case 13:
        e.preventDefault();
        if (state.lastFocus) {
          state.lastFocus.click();
        }
        break;

      // Return/Back (10009)
      case 10009:
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Alternative: try to find close button
          var closeButtons = document.querySelectorAll('[class*="close"], [class*="back"], [aria-label*="close"]');
          if (closeButtons.length > 0) {
            closeButtons[0].click();
          }
        }
        break;

      default:
        // Let other key presses through
        return;
    }

    e.stopPropagation();
  }

  // ========================================
  // VIEWPORT RESIZE HANDLER
  // ========================================
  function handleResize() {
    var width = window.innerWidth;
    var newViewport = CONFIG.viewports[0];

    var i = 0;
    for (i = 0; i < CONFIG.viewports.length; i++) {
      if (width <= CONFIG.viewports[i]) {
        newViewport = CONFIG.viewports[i];
        break;
      }
    }

    if (newViewport !== state.currentViewport) {
      state.currentViewport = newViewport;
      var body = document.body;
      body.style.width = newViewport + 'px';
      body.style.maxWidth = newViewport + 'px';
      body.style.minWidth = newViewport + 'px';
    }
  }

  // ========================================
  // OBSERVER FOR DYNAMIC CONTENT
  // ========================================
  function setupMutationObserver() {
    if (!window.MutationObserver) {
      // Fallback: rescan periodically
      setInterval(function() {
        var before = state.focusableElements.length;
        scanFocusableElements();
        var after = state.focusableElements.length;

        // If elements changed, reset focus if needed
        if (before !== after && state.focusIndex >= state.focusableElements.length) {
          state.focusIndex = Math.max(0, state.focusableElements.length - 1);
        }
      }, 2000);
      return;
    }

    var observer = new MutationObserver(function(mutations) {
      var shouldRescan = false;
      var i = 0;
      for (i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0 || mutations[i].removedNodes.length > 0) {
          shouldRescan = true;
          break;
        }
      }

      if (shouldRescan) {
        var before = state.focusableElements.length;
        scanFocusableElements();
        var after = state.focusableElements.length;

        if (before !== after) {
          if (state.focusIndex >= state.focusableElements.length) {
            state.focusIndex = Math.max(0, state.focusableElements.length - 1);
          }
          setFocus(state.focusIndex);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  // ========================================
  // BACK BUTTON INJECTION
  // ========================================
  function injectBackButton() {
    // Only add if not already present
    if (document.querySelector('.tv-back-button')) {
      return;
    }

    var backButton = document.createElement('button');
    backButton.className = 'tv-back-button';
    backButton.innerHTML = '← Back';
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        var closeButtons = document.querySelectorAll('[class*="close"], [class*="back"], [aria-label*="close"]');
        if (closeButtons.length > 0) {
          closeButtons[0].click();
        }
      }
    });

    document.body.appendChild(backButton);
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    if (state.initialized) {
      return;
    }

    console.log('Cineby TV: Initializing Netflix-style interface...');

    // Add CSS styles
    addStyles();

    // Set viewport
    handleResize();

    // Scan for focusable elements
    scanFocusableElements();

    // Set initial focus
    if (state.focusableElements.length > 0) {
      setFocus(0);
    }

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleResize);

    // Setup observer for dynamic content
    setupMutationObserver();

    // Inject back button
    injectBackButton();

    // Periodic rescan as fallback
    setInterval(function() {
      scanFocusableElements();
    }, 3000);

    state.initialized = true;
    console.log('Cineby TV: Initialization complete!');
    console.log('Cineby TV: Found ' + state.focusableElements.length + ' focusable elements');
  }

  // ========================================
  // START WHEN DOM IS READY
  // ========================================
  function start() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Small delay to ensure page is fully processed
      setTimeout(init, 500);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 500);
      });
    }
  }

  // ========================================
  // RUN
  // ========================================
  start();

})();
```

## Summary

I've created a complete TizenBrew NPM module for cineby.gd with:

### ✅ Netflix-Style TV UI
- Heavy red border (#E50914) on focused elements
- Glow and pulse animations
- Scaled up elements on focus
- Clean, minimal interface
- Hides desktop elements (headers, sidebars, etc.)

### ✅ Spatial Navigation Engine
- Intelligent directional movement (up/down/left/right)
- Scans for focusable elements (links, buttons, cards)
- Calculates distances for optimal movement
- Smooth scrolling to focused elements
- Dynamic content detection via MutationObserver

### ✅ Full Remote Control Support
- **Arrow keys (37-40)**: Navigate spatially
- **Enter (13)**: Click focused element
- **Back/Return (10009)**: Go back or close modals

### ✅ TV Optimizations
- Fixed viewport (1920px or 1280px)
- Larger fonts (1.2x multiplier)
- TV-friendly spacing
- Hidden scrollbars
- Custom back button

### ✅ ES5 Compliance
- Uses `var` instead of `const`/`let`
- Function declarations instead of arrow functions
- No async/await
- Compatible with Tizen 3.0

The module is ready to be installed via TizenBrew and will automatically transform cineby.gd into a Netflix-style TV interface!
