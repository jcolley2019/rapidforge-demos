// vendored from webedit/public/webedit-connect.js — keep in sync by re-copying, do not hand-edit below this line
/**
 * webedit-connect.js — include this script in any page to let WebEdit
 * (running in the parent frame) discover and live-edit it via postMessage.
 * Two layers: :root CSS custom properties (tokens), and per-element
 * inspect/select/style/text editing. Dependency-free.
 */
(function () {
  'use strict';

  // Allowlist: the origins the loader put in window.__WEBEDIT_ORIGINS, or
  // webedit's local dev servers when that global is missing.
  var DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  function allowedOrigins() {
    var list = window.__WEBEDIT_ORIGINS;
    return Array.isArray(list) ? list : DEFAULT_ORIGINS;
  }

  function isAllowedOrigin(origin) {
    return allowedOrigins().indexOf(origin) !== -1;
  }

  // postMessage target: the allowlisted origin that framed us (read from
  // document.referrer), '*' only when there is no referrer, and null (send
  // nothing) when the framing page is not on the allowlist.
  function parentTarget() {
    if (!document.referrer) return '*';
    var origin;
    try {
      origin = new URL(document.referrer).origin;
    } catch (e) {
      return null;
    }
    var list = allowedOrigins();
    for (var i = 0; i < list.length; i++) {
      if (list[i] === origin) return list[i];
    }
    return null;
  }

  // ---------------------------------------------------------------- tokens

  // name -> inline value that was on <html> before our first override
  // ('' if there was none), so reset can restore rather than blindly remove.
  var applied = {};

  // Google Fonts families already injected, so repeat picks don't stack links.
  var loadedFonts = {};

  function loadFont(family) {
    if (loadedFonts[family]) return;
    loadedFonts[family] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=' +
      family.trim().replace(/ /g, '+') +
      ':ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';
    document.head.appendChild(link);
  }

  function collectRootVars() {
    var names = [];
    var seen = {};

    function addFrom(style) {
      for (var i = 0; i < style.length; i++) {
        var prop = style[i];
        if (prop.indexOf('--') === 0 && !seen[prop]) {
          seen[prop] = true;
          names.push(prop);
        }
      }
    }

    var sheets = document.styleSheets;
    for (var s = 0; s < sheets.length; s++) {
      var rules;
      try {
        rules = sheets[s].cssRules;
      } catch (e) {
        continue; // cross-origin stylesheet, not readable
      }
      if (!rules) continue;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        if (
          rule.selectorText &&
          /(^|,)\s*(:root|html)\s*($|,)/.test(rule.selectorText)
        ) {
          addFrom(rule.style);
        }
      }
    }
    addFrom(document.documentElement.style);

    var computed = getComputedStyle(document.documentElement);
    return names.map(function (name) {
      return { name: name, value: computed.getPropertyValue(name).trim() };
    });
  }

  function sendHello() {
    if (window.parent === window) return; // not framed, nothing to talk to
    var target = parentTarget();
    if (!target) return;
    window.parent.postMessage(
      { type: 'webedit:hello', cssVars: collectRootVars() },
      target
    );
  }

  // --------------------------------------------------------------- inspect

  var inspectOn = false;
  var hoverEl = null;
  var selectedEl = null;
  var selectedSelector = '';

  var overlayReady = false;
  var hoverBox = null;
  var hoverLabel = null;
  var selectBox = null;

  // selector -> { 'css-prop': value } rendered into one !important sheet, so
  // reset = drop the sheet and the target's own cascade is untouched.
  var styleOverrides = {};
  var overrideSheet = null;

  // selector -> original textContent before our first edit.
  var textEdits = {};

  // selector -> the text the user wants. A framework re-render (entrance
  // animations, HMR, state changes) rebuilds nodes and stomps one-shot
  // textContent writes, so an observer re-asserts these until cleared.
  var desiredText = {};
  var textObserver = null;
  var assertScheduled = false;

  // Mutation storms (entrance animations splitting text into spans) can fire
  // the observer hundreds of times per frame — coalesce to one pass per frame.
  function scheduleAssert() {
    if (assertScheduled) return;
    assertScheduled = true;
    requestAnimationFrame(function () {
      assertScheduled = false;
      assertDesiredText();
    });
  }

  function assertDesiredText() {
    for (var sel in desiredText) {
      var el;
      try {
        el = document.querySelector(sel);
      } catch (e) {
        continue;
      }
      if (!el || el.textContent === desiredText[sel]) continue;
      if (!Object.prototype.hasOwnProperty.call(textEdits, sel)) {
        textEdits[sel] = el.textContent;
      }
      el.textContent = desiredText[sel];
    }
  }

  function syncTextObserver() {
    var hasEdits = false;
    for (var sel in desiredText) {
      void sel;
      hasEdits = true;
      break;
    }
    if (hasEdits && !textObserver) {
      textObserver = new MutationObserver(scheduleAssert);
      textObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    } else if (!hasEdits && textObserver) {
      textObserver.disconnect();
      textObserver = null;
    }
  }

  function ensureOverlay() {
    if (overlayReady) return;
    overlayReady = true;
    hoverBox = document.createElement('div');
    hoverBox.style.cssText =
      'position:fixed;z-index:2147483645;pointer-events:none;display:none;' +
      'box-shadow:inset 0 0 0 1.5px rgba(56,189,248,.9);background:rgba(56,189,248,.07);';
    hoverLabel = document.createElement('div');
    hoverLabel.style.cssText =
      'position:fixed;z-index:2147483646;pointer-events:none;display:none;' +
      'font:10px/1.7 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
      'background:#0c1420;color:#7dd3fc;padding:1px 6px;border-radius:3px;white-space:nowrap;';
    selectBox = document.createElement('div');
    selectBox.style.cssText =
      'position:fixed;z-index:2147483644;pointer-events:none;display:none;' +
      'box-shadow:inset 0 0 0 1.5px rgba(245,158,11,.95);';
    document.documentElement.appendChild(hoverBox);
    document.documentElement.appendChild(hoverLabel);
    document.documentElement.appendChild(selectBox);
  }

  function classesOf(el) {
    var out = [];
    var list = el.classList || [];
    for (var i = 0; i < list.length; i++) out.push(list[i]);
    return out;
  }

  function describe(el) {
    var s = el.tagName.toLowerCase();
    var cls = classesOf(el);
    if (cls.length) s += '.' + cls.slice(0, 2).join('.');
    return s;
  }

  // Structural selector from the nearest id (or body) down: robust against
  // Tailwind utility churn, readable in the edit log, replayable after reload.
  function cssPath(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      if (node.id) {
        parts.unshift('#' + (window.CSS && CSS.escape ? CSS.escape(node.id) : node.id));
        return parts.join(' > ');
      }
      var idx = 1;
      var sib = node;
      while ((sib = sib.previousElementSibling)) {
        if (sib.tagName === node.tagName) idx++;
      }
      parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + idx + ')');
      node = node.parentElement;
    }
    parts.unshift('body');
    return parts.join(' > ');
  }

  function positionBox(box, el) {
    var r = el.getBoundingClientRect();
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    box.style.display = 'block';
  }

  function hideHover() {
    hoverEl = null;
    if (hoverBox) hoverBox.style.display = 'none';
    if (hoverLabel) hoverLabel.style.display = 'none';
  }

  function refreshBoxes() {
    if (!selectBox) return;
    if (selectedEl && document.documentElement.contains(selectedEl)) {
      positionBox(selectBox, selectedEl);
    } else {
      selectBox.style.display = 'none';
    }
  }

  function postSelected() {
    if (!selectedEl) return;
    var target = parentTarget();
    if (!target) return;
    var cs = getComputedStyle(selectedEl);
    var text = (selectedEl.textContent || '').replace(/\s+/g, ' ').trim();
    window.parent.postMessage(
      {
        type: 'webedit:selected',
        ref: {
          selector: selectedSelector,
          tag: selectedEl.tagName.toLowerCase(),
          classes: classesOf(selectedEl),
          snippet: text.slice(0, 80),
        },
        styles: {
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          textAlign: cs.textAlign,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
        },
        // Only leaf elements get text editing: setting textContent on a
        // container would wipe its child markup.
        editableText: selectedEl.children.length === 0 ? selectedEl.textContent : null,
      },
      target
    );
  }

  function selectEl(el) {
    if (!el || el.nodeType !== 1) return;
    selectedEl = el;
    selectedSelector = cssPath(el);
    ensureOverlay();
    positionBox(selectBox, el);
    postSelected();
  }

  // Layered layouts (hero spreads, cards with absolute inset-0 covers) paint
  // a full-size wrapper above the text, so e.target is the wrapper. Walk the
  // whole hit stack instead: prefer the topmost element that renders its own
  // content (text or media); with none, take the smallest box, which skips
  // cover layers sized to their parent.
  function hasOwnContent(el) {
    var tag = el.tagName.toUpperCase();
    if (
      tag === 'IMG' || tag === 'SVG' || tag === 'VIDEO' || tag === 'CANVAS' ||
      tag === 'PICTURE' || tag === 'INPUT' || tag === 'TEXTAREA' ||
      tag === 'SELECT' || tag === 'BUTTON'
    ) {
      return true;
    }
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
    }
    return false;
  }

  function pickTarget(x, y, fallback) {
    if (!document.elementsFromPoint) return fallback;
    var stack = document.elementsFromPoint(x, y);
    var candidates = [];
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el === document.documentElement || el === document.body) continue;
      if (el === hoverBox || el === hoverLabel || el === selectBox) continue;
      candidates.push(el);
    }
    if (!candidates.length) return fallback;
    for (i = 0; i < candidates.length; i++) {
      if (hasOwnContent(candidates[i])) return candidates[i];
    }
    var best = candidates[0];
    var r = best.getBoundingClientRect();
    var bestArea = r.width * r.height;
    for (i = 1; i < candidates.length; i++) {
      r = candidates[i].getBoundingClientRect();
      if (r.width * r.height < bestArea) {
        best = candidates[i];
        bestArea = r.width * r.height;
      }
    }
    return best;
  }

  function onHoverMove(e) {
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    if (t === document.documentElement || t === document.body) {
      hideHover();
      return;
    }
    t = pickTarget(e.clientX, e.clientY, t);
    if (t === hoverEl) return;
    hoverEl = t;
    ensureOverlay();
    positionBox(hoverBox, t);
    hoverLabel.textContent = describe(t);
    var r = t.getBoundingClientRect();
    hoverLabel.style.left = Math.max(4, r.left) + 'px';
    var top = r.top - 22;
    if (top < 4) top = r.top + 4;
    hoverLabel.style.top = top + 'px';
    hoverLabel.style.display = 'block';
  }

  function onInspectClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'click') {
      selectEl(pickTarget(e.clientX, e.clientY, e.target));
    }
  }

  // Swallow the whole click gesture in capture phase so the page's own
  // handlers (links, lightboxes, Radix pointerdown listeners) never fire.
  var BLOCKED_EVENTS = ['pointerdown', 'mousedown', 'mouseup', 'click'];

  function setInspect(on) {
    on = !!on;
    if (on === inspectOn) return;
    inspectOn = on;
    ensureOverlay();
    var i;
    if (on) {
      window.addEventListener('mousemove', onHoverMove, true);
      for (i = 0; i < BLOCKED_EVENTS.length; i++) {
        window.addEventListener(BLOCKED_EVENTS[i], onInspectClick, true);
      }
    } else {
      window.removeEventListener('mousemove', onHoverMove, true);
      for (i = 0; i < BLOCKED_EVENTS.length; i++) {
        window.removeEventListener(BLOCKED_EVENTS[i], onInspectClick, true);
      }
      hideHover();
    }
  }

  function renderOverrides() {
    if (!overrideSheet) {
      overrideSheet = document.createElement('style');
      overrideSheet.id = '__webedit_overrides';
      document.head.appendChild(overrideSheet);
    }
    var css = '';
    for (var sel in styleOverrides) {
      var body = '';
      for (var p in styleOverrides[sel]) {
        body += p + ':' + styleOverrides[sel][p] + ' !important;';
      }
      if (body) css += sel + '{' + body + '}\n';
    }
    overrideSheet.textContent = css;
  }

  function applyStyle(selector, prop, value) {
    var props = styleOverrides[selector] || (styleOverrides[selector] = {});
    props[prop] = String(value);
    renderOverrides();
    refreshBoxes();
  }

  function applyText(selector, text) {
    desiredText[selector] = String(text);
    syncTextObserver();
    assertDesiredText();
    refreshBoxes();
  }

  function clearEdits() {
    desiredText = {};
    syncTextObserver();
    for (var sel in textEdits) {
      var el = document.querySelector(sel);
      if (el) el.textContent = textEdits[sel];
    }
    textEdits = {};
    styleOverrides = {};
    if (overrideSheet) overrideSheet.textContent = '';
    refreshBoxes();
  }

  function deselect() {
    selectedEl = null;
    selectedSelector = '';
    if (selectBox) selectBox.style.display = 'none';
  }

  window.addEventListener('scroll', refreshBoxes, true);
  window.addEventListener('resize', refreshBoxes);

  // -------------------------------------------------------------- messages

  function onMessage(event) {
    if (!isAllowedOrigin(event.origin)) return;
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'webedit:set' && typeof data.name === 'string') {
      var root = document.documentElement;
      if (!Object.prototype.hasOwnProperty.call(applied, data.name)) {
        applied[data.name] = root.style.getPropertyValue(data.name);
      }
      root.style.setProperty(data.name, String(data.value));
    } else if (data.type === 'webedit:font' && typeof data.family === 'string') {
      loadFont(data.family);
    } else if (data.type === 'webedit:reset') {
      for (var name in applied) {
        if (applied[name]) {
          document.documentElement.style.setProperty(name, applied[name]);
        } else {
          document.documentElement.style.removeProperty(name);
        }
      }
      applied = {};
    } else if (data.type === 'webedit:inspect') {
      setInspect(data.on);
    } else if (data.type === 'webedit:deselect') {
      deselect();
    } else if (
      data.type === 'webedit:setStyle' &&
      typeof data.selector === 'string' &&
      typeof data.prop === 'string'
    ) {
      applyStyle(data.selector, data.prop, data.value);
    } else if (
      data.type === 'webedit:setText' &&
      typeof data.selector === 'string' &&
      typeof data.text === 'string'
    ) {
      applyText(data.selector, data.text);
    } else if (data.type === 'webedit:clearEdits') {
      clearEdits();
    } else if (
      data.type === 'webedit:reselect' &&
      typeof data.selector === 'string'
    ) {
      // Re-report a known element (after undo/reset) so the parent panel
      // reads fresh computed styles instead of reconstructing them.
      var target = document.querySelector(data.selector);
      if (target) selectEl(target);
      else deselect();
    }
    // all other message types: ignore
  }

  window.addEventListener('message', onMessage);

  if (document.readyState === 'complete') {
    sendHello();
  } else {
    window.addEventListener('load', sendHello);
  }
})();
