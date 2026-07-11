// Cineby TV - Pure Lightweight Navigation Overlay
// TizenBrew Module - Tizen 3.0 / Chromium 47 Compatible

(function() {
  'use strict';

  // ========================================
  // POLYFILLS FOR CHROMIUM 47
  // ========================================
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
      var list = Object(this), length = parseInt(list.length) || 0, thisArg = arguments[1];
      for (var i = 0; i < length; i++) {
        if (predicate.call(thisArg, list[i], i, list)) return list[i];
      }
      return undefined;
    };
  }

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  var state = {
    focusIndex: 0,
    elements: [],
    cursor: null,
    targetX: null, // Remembers horizontal position for Up/Down movement
    initialized: false
  };

  // ========================================
  // CURSOR & CSS INJECTION
  // ========================================
  function initOverlay() {
    if (document.getElementById('tv-cursor')) return;

    // Inject ONLY the cursor styles and scrollbar hider
    var style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = 
      '::-webkit-scrollbar { width: 0 !important; height: 0 !important; }\n' +
      '*::-moz-selection { background: transparent !important; }\n' +
      '#tv-cursor {\n' +
      '  position: fixed !important;\n' +
      '  border: 4px solid #E50914 !important;\n' +
      '  border-radius: 8px !important;\n' +
      '  pointer-events: none !important;\n' +
      '  transition: all 0.15s ease-out !important;\n' +
      '  z-index: 999999 !important;\n' +
      '  box-shadow: 0 0 15px #E50914, 0 0 30px rgba(229,9,20,0.4) !important;\n' +
      '  opacity: 0;\n' +
      '  display: block;\n' +
      '  box-sizing: border-box !important;\n' +
      '}';
    document.head.appendChild(style);

    // Create the floating TV cursor
    state.cursor = document.createElement('div');
    state.cursor.id = 'tv-cursor';
    document.body.appendChild(state.cursor);
  }

  function moveCursor(el) {
    if (!state.cursor || !el) return;
    try {
      var rect = el.getBoundingClientRect();
      
      // Add slight padding to the bounding box
      var padding = 6;
      state.cursor.style.left = (rect.left - padding) + "px";
      state.cursor.style.top = (rect.top - padding) + "px";
      state.cursor.style.width = (rect.width + padding * 2) + "px";
      state.cursor.style.height = (rect.height + padding * 2) + "px";
      state.cursor.style.opacity = "1";
    } catch (e) {
      console.error('Cineby TV: Cursor move error:', e);
    }
  }

  // ========================================
  // ELEMENT SCANNER (MOVIE CARDS ONLY)
  // ========================================
  function scanElements() {
    try {
      // Prioritized element scanning strategy
      var items = document.querySelectorAll('.swiper-slide a, .embla__slide a, [class*="poster"] a, [class*="movie"] a');
      
      if (items.length === 0) {
        items = document.querySelectorAll('a[href*="/movie"], a[href*="/tv"]');
      }
      
      if (items.length === 0) {
        items = document.querySelectorAll('button, [role="button"]');
      }

      // Final fallback: any valid link to prevent total navigation failure
      if (items.length === 0) {
        items = document.querySelectorAll('a[href]:not([href="#"])');
      }
      
      var newElements = [];
      
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        
        if (!isVisible(el)) continue;

        // 1. Ignore nested targets (Keep only the outermost card)
        var isNested = false;
        var parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (newElements.indexOf(parent) !== -1) {
            isNested = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (isNested) continue;

        // 2. Spatial Deduplication (Ignore cloned carousel nodes overlaying exactly)
        var rect = el.getBoundingClientRect();
        var isDuplicate = false;
        for (var k = 0; k < newElements.length; k++) {
          var r = newElements[k].getBoundingClientRect();
          if (Math.abs(r.left - rect.left) < 5 && Math.abs(r.top - rect.top) < 5) {
            isDuplicate = true;
            break;
          }
        }
        if (isDuplicate) continue;
        
        newElements.push(el);
      }
      
      state.elements = newElements;
    } catch (e) {
      console.error('Cineby TV: Scan error:', e);
    }
  }

  function isVisible(el) {
    if (!el || el.offsetParent === null) return false;
    var rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 40) return false; // Ignore tiny icons
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) return false;
    return true;
  }

  // ========================================
  // ROW GROUPING ENGINE
  // ========================================
  function getRows() {
    var rows = [];
    for (var i = 0; i < state.elements.length; i++) {
      var el = state.elements[i];
      var rect = el.getBoundingClientRect();
      var centerY = rect.top + rect.height / 2;
      var foundRow = false;
      var threshold = rect.height * 0.4; // Dynamic threshold based on card height
      
      for (var j = 0; j < rows.length; j++) {
        if (Math.abs(rows[j].centerY - centerY) < threshold) {
          rows[j].items.push({ index: i, rect: rect, el: el });
          // Recalculate average row center
          rows[j].centerY = ((rows[j].centerY * (rows[j].items.length - 1)) + centerY) / rows[j].items.length;
          foundRow = true;
          break;
        }
      }
      
      if (!foundRow) {
        rows.push({ centerY: centerY, items: [{ index: i, rect: rect, el: el }] });
      }
    }
    
    // Sort rows Y, items X
    rows.sort(function(a, b) { return a.centerY - b.centerY; });
    for (var k = 0; k < rows.length; k++) {
      rows[k].items.sort(function(a, b) { return a.rect.left - b.rect.left; });
    }
    return rows;
  }

  // ========================================
  // NAVIGATION LOGIC
  // ========================================
  function setFocus(index) {
    if (state.elements.length === 0) return;
    
    index = Math.max(0, Math.min(index, state.elements.length - 1));
    state.focusIndex = index;
    var el = state.elements[index];
    
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } catch (e) {
      el.scrollIntoView();
    }

    moveCursor(el);
  }

  function moveFocus(direction) {
    if (state.elements.length === 0) {
      scanElements();
      if (state.elements.length === 0) return;
    }

    var currentEl = state.elements[state.focusIndex];
    if (!currentEl) { setFocus(0); return; }
    
    var currentRect = currentEl.getBoundingClientRect();
    if (state.targetX === null) state.targetX = currentRect.left + currentRect.width / 2;

    var rows = getRows();
    var currentRowIndex = -1;
    var currentItemIndex = -1;
    
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].items.length; c++) {
        if (rows[r].items[c].index === state.focusIndex) {
          currentRowIndex = r;
          currentItemIndex = c;
          break;
        }
      }
      if (currentRowIndex !== -1) break;
    }
    
    if (currentRowIndex === -1) { setFocus(0); return; }

    var nextIndex = -1;
    var items = rows[currentRowIndex].items;

    // Left/Right: Wrap around within the current row
    if (direction === 'left') {
      nextIndex = currentItemIndex > 0 ? items[currentItemIndex - 1].index : items[items.length - 1].index;
    } else if (direction === 'right') {
      nextIndex = currentItemIndex < items.length - 1 ? items[currentItemIndex + 1].index : items[0].index;
    } 
    // Up/Down: Jump to adjacent row using memory targetX
    else if (direction === 'up' && currentRowIndex > 0) {
      nextIndex = findClosestInRow(rows[currentRowIndex - 1], state.targetX);
    } else if (direction === 'down' && currentRowIndex < rows.length - 1) {
      nextIndex = findClosestInRow(rows[currentRowIndex + 1], state.targetX);
    }

    if (nextIndex !== -1) {
      if (direction === 'left' || direction === 'right') {
        var newRect = state.elements[nextIndex].getBoundingClientRect();
        state.targetX = newRect.left + newRect.width / 2;
      }
      setFocus(nextIndex);
    }
  }

  function findClosestInRow(row, targetX) {
    var bestDist = Infinity;
    var bestIndex = -1;
    for (var i = 0; i < row.items.length; i++) {
      var cx = row.items[i].rect.left + row.items[i].rect.width / 2;
      var dist = Math.abs(cx - targetX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = row.items[i].index;
      }
    }
    return bestIndex;
  }

  // ========================================
  // INPUT HANDLER
  // ========================================
  function handleKeyDown(e) {
    var isPlayer = (window.location.href.indexOf('/watch') > -1 || document.querySelector('video'));

    if (isPlayer) {
      var video = document.querySelector('video');
      switch (e.keyCode) {
        case 37: e.preventDefault(); if (video) video.currentTime -= 10; return;
        case 39: e.preventDefault(); if (video) video.currentTime += 10; return;
        case 13: 
          e.preventDefault(); 
          if (video) video.paused ? video.play() : video.pause();
          return;
        case 10009: // Samsung Back
          e.preventDefault();
          window.history.length > 1 ? window.history.back() : window.location.href = '/';
          return;
      }
    }

    switch (e.keyCode) {
      case 37: e.preventDefault(); moveFocus('left'); break;
      case 38: e.preventDefault(); moveFocus('up'); break;
      case 39: e.preventDefault(); moveFocus('right'); break;
      case 40: e.preventDefault(); moveFocus('down'); break;
      case 36: e.preventDefault(); setFocus(0); break; // Home
      case 13: 
        e.preventDefault();
        var el = state.elements[state.focusIndex];
        
        // Check for stale elements (loaded or removed dynamically)
        if (!el || !document.body.contains(el)) {
            scanElements();
            el = state.elements[state.focusIndex];
        }
        if (!el) return;

        localStorage.setItem('cinebyFocus', state.focusIndex);
        var target = el;
        var link = el.querySelector("a");
        if (link) target = link;
        target.click();
        break;
      case 10009: 
        e.preventDefault();
        if (window.history.length > 1) window.history.back();
        break;
    }
  }

  // ========================================
  // INITIALIZATION & OBSERVERS
  // ========================================
  function init() {
    if (state.initialized || window.location.href.indexOf('cineby.at') === -1) return;
    
    initOverlay();
    scanElements();

    if (state.elements.length > 0) {
      var saved = parseInt(localStorage.getItem('cinebyFocus'));
      setFocus(!isNaN(saved) && saved < state.elements.length ? saved : 0);
      state.targetX = null;
    }

    document.addEventListener('keydown', handleKeyDown, true);
    
    // Reposition cursor instantly on scroll/resize
    window.addEventListener('resize', function() { moveCursor(state.elements[state.focusIndex]); });
    window.addEventListener('scroll', function() { moveCursor(state.elements[state.focusIndex]); }, true);

    // Keep cursor aligned during JS animations
    setInterval(function () {
      if (state.elements[state.focusIndex]) {
          moveCursor(state.elements[state.focusIndex]);
      }
    }, 150);

    // Efficient MutationObserver for dynamic DOM updates
    if (typeof MutationObserver !== 'undefined') {
      var rescanTimer = null;
      var observer = new MutationObserver(function() {
        clearTimeout(rescanTimer);
        rescanTimer = setTimeout(function() {
          var oldCount = state.elements.length;
          scanElements();
          if (oldCount !== state.elements.length && state.focusIndex >= state.elements.length) {
            setFocus(Math.max(0, state.elements.length - 1));
          }
        }, 200); // Debounce scans
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Fallback scanner for events that bypass the MutationObserver
    setInterval(function() {
      var oldCount = state.elements.length;
      scanElements();
      if (oldCount !== state.elements.length && state.focusIndex >= state.elements.length) {
        setFocus(Math.max(0, state.elements.length - 1));
      }
    }, 2500);

    state.initialized = true;
    console.log('Cineby TV: Pure Overlay Initialized (v1.0.0)');
  }

  // Bootstrap safely
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 500); });
  }

})();
