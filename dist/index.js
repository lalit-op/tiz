// Cineby TV - Netflix-style UI for Tizen Smart TVs
// TizenBrew Module - Site Modification
// Tizen 3.0 / Chromium 47 Compatible

(function() {
  'use strict';

  // ========================================
  // POLYFILLS FOR CHROMIUM 47
  // ========================================
  // Object.assign polyfill
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      var i = 1;
      for (i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource != null) {
          var keysArray = Object.keys(Object(nextSource));
          var nextIndex = 0;
          for (nextIndex = 0; nextIndex < keysArray.length; nextIndex++) {
            var nextKey = keysArray[nextIndex];
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    };
  }

  // Array.prototype.find polyfill
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = parseInt(list.length) || 0;
      var thisArg = arguments[1];
      var value;
      var i = 0;
      for (i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    };
  }

  // ========================================
  // RECOVERY MODE STATE
  // ========================================
  var recoveryMode = {
    active: false,
    timeoutId: null,
    injectedStyles: [],
    injectedElements: []
  };

  // ========================================
  // RECOVERY MODE: REMOVE ALL MODIFICATIONS
  // ========================================
  function enterRecoveryMode() {
    if (recoveryMode.active) {
      return;
    }
    
    recoveryMode.active = true;
    console.warn('Cineby TV: Entering recovery mode - removing all modifications');

    try {
      // Remove injected styles
      var styleElement = document.getElementById('cineby-tv-styles');
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }

      // Remove back button
      var backButton = document.querySelector('.tv-back-button');
      if (backButton && backButton.parentNode) {
        backButton.parentNode.removeChild(backButton);
      }

      // Remove focus classes
      var focusedElements = document.querySelectorAll('.tv-focused');
      var i = 0;
      for (i = 0; i < focusedElements.length; i++) {
        focusedElements[i].classList.remove('tv-focused');
        focusedElements[i].classList.remove('animating');
      }

      // Remove event listeners by cloning body (removes all listeners)
      // This is a last resort - just log for now
      console.warn('Cineby TV: Recovery mode activated - original site should be visible');
    } catch (e) {
      console.error('Cineby TV: Error in recovery mode:', e);
    }
  }

  // ========================================
  // SAFE REDIRECT CHECK
  // ========================================
  function checkSafeRedirect() {
    try {
      var currentUrl = window.location.href;
      var targetDomain = 'cineby.at';
      
      if (currentUrl.indexOf(targetDomain) === -1) {
        console.log('Cineby TV: Not on cineby.at, skipping initialization');
        return false;
      }
      
      if (window.location.hash === '#cineby-tv-redirect') {
        console.log('Cineby TV: Redirect loop detected, skipping');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Cineby TV: Error in redirect check:', e);
      return false;
    }
  }

  // ========================================
  // CONFIGURATION
  // ========================================
  var CONFIG = {
    viewports: [1920, 1280],
    focusColor: '#E50914',
    focusSize: '4px',
    focusAnimation: true,
    fontSizeMultiplier: 1.2,
    cardPadding: '16px',
    hideSelectors: [
      'header nav',
      'header > nav',
      '.sidebar',
      '.side-nav',
      '.left-menu',
      '.right-menu',
      '#cookie-banner',
      '.popup:not(.tv-content)',
      '.modal:not(.tv-content)',
      '.ad',
      '.advertisement',
      '.social-share',
      '.desktop-only',
      '[class*="cookie"]',
      '[id*="cookie"]'
    ],
    focusableSelectors: [
      'a[href]',
      'button'
    ],
    maxZIndex: 2147483647 // Maximum 32-bit integer
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  var state = {
    focusIndex: 0,
    focusableElements: [],
    currentViewport: 1920,
    initialized: false,
    lastFocus: null,
    initAttempts: 0,
    maxInitAttempts: 5
  };

  // ========================================
  // VIEWPORT HANDLER (MOVED TO TOP)
  // ========================================
  function handleResize() {
    try {
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
      }

      // Force viewport meta tag if missing
      var viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        if (document.head) {
          document.head.appendChild(viewportMeta);
        }
      }
    } catch (e) {
      console.error('Cineby TV: Error handling resize:', e);
    }
  }

  // ========================================
  // CSS INJECTION (SIMPLIFIED)
  // ========================================
  function addStyles() {
    try {
      // Remove existing style if present
      var existingStyle = document.getElementById('cineby-tv-styles');
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }

      if (!document.head) {
        console.error('Cineby TV: document.head not available');
        return false;
      }

      var style = document.createElement('style');
      style.id = 'cineby-tv-styles';
      style.setAttribute('data-cineby-tv', 'true');
      style.type = 'text/css';
      
      // Build style content as string
      var styleText = '';
      
      // Viewport and layout
      styleText += 'html { width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; }';
      styleText += 'body { width: 100% !important; max-width: 100vw !important; min-width: 0 !important; overflow-x: hidden !important; margin: 0 !important; padding: 0 !important; background-color: #000 !important; color: #fff !important; z-index: 1 !important; }';
      styleText += '@media (min-width: 1280px) { body { min-width: 1280px !important; } }';
      styleText += '@media (min-width: 1920px) { body { min-width: 1920px !important; } }';

      // Hide desktop elements
      styleText += CONFIG.hideSelectors.join(', ') + ' { display: none !important; visibility: hidden !important; }';

      // Ensure main content is visible
      styleText += 'main, #main, .main, [role="main"], .content, #content, [class*="content"]:not([class*="ad"]):not([class*="cookie"]) { display: block !important; visibility: visible !important; opacity: 1 !important; z-index: 10 !important; }';

      // Focus styles - using safe z-index
      var safeZIndex = Math.min(99999, CONFIG.maxZIndex);
      styleText += '.tv-focused { outline: ' + CONFIG.focusSize + ' solid ' + CONFIG.focusColor + ' !important; box-shadow: 0 0 20px ' + CONFIG.focusColor + ', 0 0 40px ' + CONFIG.focusColor + ', 0 0 60px rgba(229, 9, 20, 0.3) !important; transform: scale(1.08) !important; transition: all 0.15s ease-out !important; z-index: ' + safeZIndex + ' !important; position: relative !important; }';

      // Focus animation
      styleText += '@keyframes focusPulse { 0%, 100% { box-shadow: 0 0 20px ' + CONFIG.focusColor + ', 0 0 40px ' + CONFIG.focusColor + ', 0 0 60px rgba(229, 9, 20, 0.3); } 50% { box-shadow: 0 0 30px ' + CONFIG.focusColor + ', 0 0 50px ' + CONFIG.focusColor + ', 0 0 70px rgba(229, 9, 20, 0.5); } }';
      styleText += '.tv-focused.animating { animation: focusPulse 2s ease-in-out infinite; }';

      // Card styles
      styleText += '[class*="card"], [class*="item"], [class*="poster"], [class*="movie"], [class*="video"] { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out !important; cursor: pointer !important; border-radius: 4px !important; }';

      // Typography
      styleText += 'body { font-size: ' + CONFIG.fontSizeMultiplier + 'em !important; line-height: 1.4 !important; }';
      styleText += 'h1, h2, h3, h4, h5, h6, p, span, div { font-size: inherit !important; line-height: 1.4 !important; }';
      styleText += 'h1 { font-size: 2.5em !important; }';
      styleText += 'h2 { font-size: 2em !important; }';
      styleText += 'h3 { font-size: 1.75em !important; }';
      styleText += 'h4 { font-size: 1.5em !important; }';
      styleText += 'h5 { font-size: 1.25em !important; }';
      styleText += 'h6 { font-size: 1.1em !important; }';

      // Focusable elements
      styleText += 'a, button, [role="button"] { outline: none !important; transition: all 0.15s ease-out !important; }';
      styleText += 'a:focus, button:focus, [role="button"]:focus { outline: none !important; }';

      // Scrollbars
      styleText += '::-webkit-scrollbar { width: 0 !important; height: 0 !important; }';

      // Selection
      styleText += '*::-moz-selection { background: transparent !important; }';
      styleText += '*::selection { background: transparent !important; }';

      // Back button - safe z-index
      styleText += '.tv-back-button { position: fixed !important; top: 20px !important; left: 20px !important; background: rgba(0, 0, 0, 0.8) !important; color: white !important; border: 2px solid ' + CONFIG.focusColor + ' !important; padding: 12px 24px !important; font-size: 1.2em !important; border-radius: 8px !important; cursor: pointer !important; z-index: ' + safeZIndex + ' !important; }';
      styleText += '.tv-back-button.tv-focused { background: ' + CONFIG.focusColor + ' !important; }';

      // Use textContent for Chromium 47 compatibility
      if (style.textContent !== undefined) {
        style.textContent = styleText;
      } else if (style.innerHTML !== undefined) {
        style.innerHTML = styleText;
      } else {
        style.appendChild(document.createTextNode(styleText));
      }

      document.head.appendChild(style);
      recoveryMode.injectedStyles.push(style);
      console.log('Cineby TV: Styles injected successfully');
      return true;
    } catch (e) {
      console.error('Cineby TV: Error adding styles:', e);
      return false;
    }
  }

  // ========================================
  // SPATIAL NAVIGATION ENGINE
  // ========================================
  function scanFocusableElements() {
    var elements = [];
    
    try {
      var links = document.querySelectorAll('a[href]');
      var buttons = document.querySelectorAll('button');
      var i = 0;
      var el = null;
      
      for (i = 0; i < links.length; i++) {
        el = links[i];
        if (isElementVisible(el) && isElementInteractable(el)) {
          elements.push(el);
        }
      }
      
      for (i = 0; i < buttons.length; i++) {
        el = buttons[i];
        if (isElementVisible(el) && isElementInteractable(el)) {
          var isDuplicate = false;
          var j = 0;
          for (j = 0; j < elements.length; j++) {
            if (elements[j] === el) {
              isDuplicate = true;
              break;
            }
          }
          if (!isDuplicate) {
            elements.push(el);
          }
        }
      }
      
      state.focusableElements = elements;
      console.log('Cineby TV: Found ' + elements.length + ' focusable elements');
      return elements;
    } catch (e) {
      console.error('Cineby TV: Error scanning focusable elements:', e);
      state.focusableElements = [];
      return [];
    }
  }

  function isElementVisible(el) {
    if (!el) return false;
    
    try {
      if (el.offsetParent === null && el.tagName.toLowerCase() !== 'body') {
        return false;
      }

      var rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }

      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }

      if (rect.top > window.innerHeight || rect.bottom < 0) {
        return false;
      }
      if (rect.left > window.innerWidth || rect.right < 0) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  function isElementInteractable(el) {
    if (!el) return false;

    try {
      var tagName = el.tagName.toLowerCase();
      if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
        return false;
      }

      if (el.getAttribute('disabled')) {
        return false;
      }

      var style = window.getComputedStyle(el);
      if (style.pointerEvents === 'none') {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  // ========================================
  // FOCUS MANAGEMENT
  // ========================================
  function setFocus(index) {
    if (state.focusableElements.length === 0) {
      return;
    }

    try {
      if (state.lastFocus) {
        state.lastFocus.classList.remove('tv-focused');
        state.lastFocus.classList.remove('animating');
      }

      if (index < 0) {
        index = 0;
      }
      if (index >= state.focusableElements.length) {
        index = state.focusableElements.length - 1;
      }

      state.focusIndex = index;
      var element = state.focusableElements[index];

      if (!element) {
        return;
      }

      element.classList.add('tv-focused');
      if (CONFIG.focusAnimation) {
        element.classList.add('animating');
      }

      try {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      } catch (e) {
        element.scrollIntoView();
      }

      state.lastFocus = element;
    } catch (e) {
      console.error('Cineby TV: Error setting focus:', e);
    }
  }

  function moveFocus(direction) {
    if (state.focusableElements.length === 0) {
      scanFocusableElements();
      if (state.focusableElements.length === 0) {
        return;
      }
    }

    try {
      var currentEl = state.focusableElements[state.focusIndex];
      if (!currentEl) {
        setFocus(0);
        return;
      }

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
    } catch (e) {
      console.error('Cineby TV: Error moving focus:', e);
    }
  }

  // ========================================
  // REMOTE CONTROL HANDLER
  // ========================================
  function handleKeyDown(e) {
    var keyCode = e.keyCode;

    switch (keyCode) {
      case 37:
        e.preventDefault();
        moveFocus('left');
        break;
      case 38:
        e.preventDefault();
        moveFocus('up');
        break;
      case 39:
        e.preventDefault();
        moveFocus('right');
        break;
      case 40:
        e.preventDefault();
        moveFocus('down');
        break;
      case 13:
        e.preventDefault();
        if (state.lastFocus) {
          try {
            state.lastFocus.click();
          } catch (e) {
            console.error('Cineby TV: Error clicking element:', e);
          }
        }
        break;
      case 10009:
        e.preventDefault();
        try {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            var closeButtons = document.querySelectorAll('[class*="close"], [class*="back"], [aria-label*="close"]');
            if (closeButtons.length > 0) {
              closeButtons[0].click();
            }
          }
        } catch (e) {
          console.error('Cineby TV: Error handling back button:', e);
        }
        break;
      default:
        return;
    }

    e.stopPropagation();
  }

  // ========================================
  // OBSERVER FOR DYNAMIC CONTENT
  // ========================================
  function setupMutationObserver() {
    try {
      if (!window.MutationObserver) {
        setInterval(function() {
          var before = state.focusableElements.length;
          scanFocusableElements();
          var after = state.focusableElements.length;

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
    } catch (e) {
      console.error('Cineby TV: Error setting up mutation observer:', e);
    }
  }

  // ========================================
  // BACK BUTTON INJECTION
  // ========================================
  function injectBackButton() {
    try {
      if (document.querySelector('.tv-back-button')) {
        return;
      }

      if (!document.body) {
        return;
      }

      var backButton = document.createElement('button');
      backButton.className = 'tv-back-button';
      backButton.innerHTML = '← Back';
      backButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            var closeButtons = document.querySelectorAll('[class*="close"], [class*="back"], [aria-label*="close"]');
            if (closeButtons.length > 0) {
              closeButtons[0].click();
            }
          }
        } catch (err) {
          console.error('Cineby TV: Error in back button handler:', err);
        }
      });

      document.body.appendChild(backButton);
      recoveryMode.injectedElements.push(backButton);
    } catch (e) {
      console.error('Cineby TV: Error injecting back button:', e);
    }
  }

  // ========================================
  // ENSURE CONTENT VISIBILITY
  // ========================================
  function ensureContentVisible() {
    try {
      var mainContent = document.querySelector('main, #main, .main, [role="main"], .content, #content, [class*="container"]:not([class*="ad"]), [id*="container"]:not([id*="ad"])');
      if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
        mainContent.style.zIndex = '10';
        console.log('Cineby TV: Main content found and made visible');
        return true;
      } else {
        var bodyChildren = document.body.children;
        var i = 0;
        var visibleCount = 0;
        for (i = 0; i < bodyChildren.length; i++) {
          var child = bodyChildren[i];
          var tagName = child.tagName.toLowerCase();
          if (tagName !== 'script' && tagName !== 'style' && !child.classList.contains('tv-back-button')) {
            var computedStyle = window.getComputedStyle(child);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
              child.style.display = '';
              child.style.visibility = '';
              child.style.zIndex = '10';
              visibleCount++;
            }
          }
        }
        console.log('Cineby TV: Made', visibleCount, 'elements visible');
        return visibleCount > 0;
      }
    } catch (e) {
      console.error('Cineby TV: Error ensuring content visibility:', e);
      return false;
    }
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    if (state.initialized) {
      return;
    }

    if (!checkSafeRedirect()) {
      return;
    }

    state.initAttempts++;
    if (state.initAttempts > state.maxInitAttempts) {
      console.error('Cineby TV: Max initialization attempts reached');
      enterRecoveryMode();
      return;
    }

    try {
      console.log('Cineby TV: Initializing... (attempt ' + state.initAttempts + ')');

      // Add CSS styles first
      if (!addStyles()) {
        console.error('Cineby TV: Failed to add styles');
        if (state.initAttempts >= state.maxInitAttempts) {
          enterRecoveryMode();
        }
        return;
      }

      // Ensure main content is visible
      ensureContentVisible();

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

      // Periodic rescan
      setInterval(function() {
        scanFocusableElements();
      }, 3000);

      state.initialized = true;
      console.log('Cineby TV: Initialization complete!');
      console.log('Cineby TV: Found ' + state.focusableElements.length + ' focusable elements');

      // Clear recovery timeout since we succeeded
      if (recoveryMode.timeoutId) {
        clearTimeout(recoveryMode.timeoutId);
        recoveryMode.timeoutId = null;
      }
    } catch (e) {
      console.error('Cineby TV: Error during initialization:', e);
      state.initialized = false;
      
      if (state.initAttempts >= state.maxInitAttempts) {
        enterRecoveryMode();
      }
    }
  }

  // ========================================
  // STAGGERED START FUNCTION
  // ========================================
  function start() {
    try {
      // VIEWPORT LOGIC AT TOP (as requested)
      handleResize();

      // Staggered initialization: 1s, 3s, 5s
      setTimeout(function() {
        try {
          init();
        } catch (e) {
          console.error('Cineby TV: Error in 1s init:', e);
        }
      }, 1000);

      setTimeout(function() {
        if (!state.initialized) {
          try {
            console.log('Cineby TV: Retrying initialization at 3s');
            init();
          } catch (e) {
            console.error('Cineby TV: Error in 3s init:', e);
          }
        }
      }, 3000);

      setTimeout(function() {
        if (!state.initialized) {
          try {
            console.log('Cineby TV: Final retry at 5s');
            init();
          } catch (e) {
            console.error('Cineby TV: Error in 5s init:', e);
            enterRecoveryMode();
          }
        }
      }, 5000);

      // Set recovery mode timeout (5 seconds total)
      recoveryMode.timeoutId = setTimeout(function() {
        if (!state.initialized) {
          console.error('Cineby TV: Initialization timeout - entering recovery mode');
          enterRecoveryMode();
        }
      }, 5000);

      // Also listen for DOM ready states
      var readyState = document.readyState;
      
      if (readyState === 'complete' || readyState === 'interactive') {
        // Already handled by timeouts above
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
            if (!state.initialized) {
              try {
                init();
              } catch (e) {
                console.error('Cineby TV: Error in DOMContentLoaded init:', e);
              }
            }
          }, 1000);
        });
      }
    } catch (e) {
      console.error('Cineby TV: Critical error in start function:', e);
      enterRecoveryMode();
    }
  }

  // ========================================
  // MAIN ENTRY POINT WITH MASSIVE TRY-CATCH
  // ========================================
  try {
    start();
  } catch (e) {
    console.error('Cineby TV: Critical error - entering recovery mode immediately:', e);
    enterRecoveryMode();
  }

})();
