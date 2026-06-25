(function () {
  const disableThanksReturn =
    typeof window !== 'undefined' &&
    !!window.__DISABLE_THANKS_RETURN_RESTORE__;
  try {
    if (disableThanksReturn) {
      document.documentElement.classList.remove('is-restoring-scroll');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.has('thanksReturn')) {
      window.history.scrollRestoration = 'manual';
      document.documentElement.classList.add('is-restoring-scroll');
    }
  } catch (e) {}
})();

(function enforceManualScrollRestoration() {
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  } catch (e) {
    // no-op
  }
})();

(function preserveLocalReloadScroll() {
  try {
    const host = window.location && window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal || !window.sessionStorage) return;

    const key = `keis:local-reload-scroll:${window.location.pathname}${window.location.search}`;
    const save = () => {
      const y = Math.max(0, Math.round(window.scrollY || window.pageYOffset || 0));
      sessionStorage.setItem(key, String(y));
    };
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('thanksReturn')) return;

      const raw = sessionStorage.getItem(key);
      sessionStorage.removeItem(key);
      const y = Number.parseInt(raw || '', 10);
      if (!Number.isFinite(y) || y <= 0) return;

      const jump = () => window.scrollTo({ top: y, left: 0, behavior: 'auto' });
      requestAnimationFrame(() => {
        jump();
        setTimeout(jump, 80);
      });
    };

    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    window.addEventListener('DOMContentLoaded', restore, { once: true });
  } catch (e) {
    // no-op
  }
})();

(function initLocalDevAutoReload() {
  try {
    const host = window.location && window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const searchParams = new URLSearchParams(window.location.search || '');
    const isAutoReloadEnabled =
      window.__KEIS_ENABLE_DEV_AUTO_RELOAD__ === true || searchParams.has('keisAutoReload');

    if (!isLocal || window.__KEIS_DISABLE_DEV_AUTO_RELOAD__ || !isAutoReloadEnabled) return;

    const scripts = Array.from(document.scripts || []);
    const hasNativeReload = scripts.some((script) => /live(?:reload|-server)|vscode/i.test(script.src || ''));
    if (hasNativeReload) return;

    const toUrl = (value) => {
      try {
        const url = new URL(value, window.location.href);
        return url.origin === window.location.origin ? url.href : null;
      } catch (e) {
        return null;
      }
    };

    const watchedUrls = Array.from(new Set([
      toUrl(window.location.href.split('#')[0]),
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'), (node) => toUrl(node.href)),
      ...scripts.map((script) => toUrl(script.src)).filter(Boolean),
    ].filter(Boolean)));

    if (!watchedUrls.length) return;

    const signatures = new Map();
    let ready = false;
    let checking = false;

    const signatureFor = async (url) => {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok) return null;
      return [
        response.headers.get('last-modified') || '',
        response.headers.get('etag') || '',
        response.headers.get('content-length') || '',
      ].join('|');
    };

    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        for (const url of watchedUrls) {
          const signature = await signatureFor(url);
          if (!signature) continue;

          const previous = signatures.get(url);
          signatures.set(url, signature);
          if (ready && previous && previous !== signature) {
            window.location.reload();
            return;
          }
        }
        ready = true;
      } catch (e) {
        // Keep local development resilient if one request is interrupted.
      } finally {
        checking = false;
      }
    };

    check();
    window.setInterval(check, 700);
  } catch (e) {
    // no-op
  }
})();

(function initViewportVariable() {
  const rootEl = document.documentElement;
  if (!rootEl) return;

  const applyViewport = () => {
    const height = window.innerHeight || rootEl.clientHeight;
    if (height > 0) {
      const vhUnit = height * 0.01;
      rootEl.style.setProperty('--app-vh', `${vhUnit}px`);
      rootEl.style.setProperty('--app-viewport', `${height}px`);
    }
  };

  let pendingFrame = null;
  const schedule = () => {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      applyViewport();
    });
  };

  applyViewport();
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.addEventListener('pageshow', schedule, { passive: true });
})();

document.addEventListener('DOMContentLoaded', () => {
  restoreThanksReturnScrollIfNeeded();
  initYandexMetrika();
  initHeader();
  initAnchorSmoothScroll();
  ensurePrivacySmoothScroll();
  initCookieBanner();
  initKgxStoriesSlider();
  initFaqAccordion();
  initFaqParallax();
  initFaqAskWave();
  initTrustParallax();
  initFindParallax();
  initFlagsDataCols();
  initFlagsReveal();
  initFlagsCardClickDisable();
  initKgxB4Reveal();
  initLeadFormsValidation();
  initTelegramLeads();
  try {
    initFormsUX();
    if (isDev()) console.log('[formsUX] started / placeholders cycle started');
  } catch (e) {
    if (isDev()) console.warn('[formsUX] error', e);
  }
  initCounterAnimation();
  initBridgeCounters();
  initTicker();
  try {
    initStripeTicker();
    if (isDev()) console.log('[stripeTicker] initialized');
  } catch (e) {
    if (isDev()) console.warn('[stripeTicker] init error', e);
  }
  initSuccessModal();
  initLeftStickyAsk();
  initPrivacyBackButton();
  initNewsBackButton();
  initConsentScrollMemory();
  initPrivacyScrollTopButton();
  initPrivacyMobileCTA();
  initSmartLazyMedia();
  initReviewsSection();
  initCaseShowcaseSections();
  initHeroProofCarousel();

  if (isDev()) {
    console.log('[script.js] All initialization functions completed');
  }
});


/* ==========================================================
   HELPER: Check if in development mode
   ========================================================== */
function isDev() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function isLocalPreview() {
  return isDev() || window.location.protocol === 'file:';
}

function initHeroProofCarousel() {
  if (!guardInit('hero-proof-carousel')) return;

  const roots = Array.from(
    document.querySelectorAll('body > section.hero-investment:first-of-type [data-hero-proof-carousel]')
  );
  if (!roots.length) return;

  const carouselMedia = window.matchMedia('(max-width: 980px)');
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMotionMedia.matches;
  const mod = (n, m) => ((n % m) + m) % m;

  const addMqChangeListener = (mq, handler) => {
    if (!mq || typeof handler !== 'function') return;
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return;
    }
    if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
  };

  const jivoQuietRoots = new Set();
  const syncHeroProofJivoQuiet = () => {
    document.documentElement.classList.toggle(
      'hero-proof-jivo-quiet',
      carouselMedia.matches && jivoQuietRoots.size > 0
    );
  };

  roots.forEach((root) => {
    const viewportEl = root.querySelector('.hero-proof-carousel__viewport');
    const track = root.querySelector('[data-hero-proof-track]');
    if (!track || track.dataset.heroProofReady === '1') return;

    const originalNodes = Array.from(track.querySelectorAll('.hero-proof-card:not([data-hero-proof-clone])'));
    const originalTemplates = originalNodes.map((node) => node.cloneNode(true));
    const totalSlides = originalTemplates.length;
    if (!viewportEl || totalSlides < 2) return;

    track.dataset.heroProofReady = '1';

    const pagination = root.querySelector('[data-hero-proof-pagination]');
    const dots = Array.from(root.querySelectorAll('[data-hero-proof-dot]'));

    const cloneCount = Math.min(3, totalSlides);
    const autoplayDelayMs = 3000;

    let index = cloneCount;
    let slidesAll = [];
    let isAnimating = false;
    let isPaused = false;
    let isSliderVisible = true;
    let autoplayTimer = 0;
    let resumeAutoplayTimer = 0;
    let animationFallbackTimer = 0;
    let edgePeekFrame = 0;
    let edgePeekLoopActive = false;
    let lastWheelSwipeAt = 0;

    const readRealIndex = () => mod(index - cloneCount, totalSlides);

    const updateNav = () => {
      if (!dots.length) return;
      const realIndex = readRealIndex();
      dots.forEach((dot, index) => {
        const isActive = index === realIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    };

    const updateEdgePeek = () => {
      const viewportRect = viewportEl.getBoundingClientRect();
      const leftEdge = viewportRect.left + 1;
      const rightEdge = viewportRect.right - 1;
      let hasEdgePeeks = false;

      slidesAll.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const isVisible = rect.right > leftEdge && rect.left < rightEdge;
        const isRightPeek = isVisible && rect.left < rightEdge && rect.right > rightEdge;
        const isLeftCut = isVisible && rect.left < leftEdge;
        slide.classList.toggle('is-edge-peek', isRightPeek);
        slide.classList.toggle('is-before-edge-peek', !isRightPeek && !isLeftCut && isVisible);
        hasEdgePeeks = hasEdgePeeks || isRightPeek;
      });

      track.classList.toggle('has-edge-peeks', hasEdgePeeks);
    };

    const requestEdgePeekUpdate = () => {
      if (edgePeekFrame) return;
      edgePeekFrame = window.requestAnimationFrame(() => {
        edgePeekFrame = 0;
        updateEdgePeek();
        if (edgePeekLoopActive) {
          edgePeekFrame = window.requestAnimationFrame(runEdgePeekLoop);
        }
      });
    };

    const runEdgePeekLoop = () => {
      edgePeekFrame = 0;
      updateEdgePeek();
      if (edgePeekLoopActive) {
        edgePeekFrame = window.requestAnimationFrame(runEdgePeekLoop);
      }
    };

    const startEdgePeekLoop = () => {
      edgePeekLoopActive = true;
      if (!edgePeekFrame) {
        edgePeekFrame = window.requestAnimationFrame(runEdgePeekLoop);
      }
    };

    const stopEdgePeekLoop = (syncNow = true) => {
      edgePeekLoopActive = false;
      if (edgePeekFrame) {
        window.cancelAnimationFrame(edgePeekFrame);
        edgePeekFrame = 0;
      }
      if (syncNow) updateEdgePeek();
    };

    const readStep = () => {
      const firstSlide = slidesAll[0];
      const secondSlide = slidesAll[1];
      if (firstSlide && secondSlide) {
        return Math.max(1, secondSlide.offsetLeft - firstSlide.offsetLeft);
      }
      return Math.max(1, firstSlide?.getBoundingClientRect?.().width || viewportEl.clientWidth);
    };

    const clearAnimationFallback = () => {
      if (!animationFallbackTimer) return;
      clearTimeout(animationFallbackTimer);
      animationFallbackTimer = 0;
    };

    const cancelActiveAnimation = () => {
      if (!isAnimating) return;
      clearAnimationFallback();
      isAnimating = false;
      track.classList.remove('is-animating');
      track.style.willChange = 'auto';
      track.style.setProperty('transition', 'none', 'important');
      stopEdgePeekLoop();
    };

    const setTranslate = (animated = true) => {
      if (!carouselMedia.matches) {
        clearAnimationFallback();
        track.classList.remove('is-animating');
        track.style.willChange = 'auto';
        track.style.setProperty('transition', 'none', 'important');
        track.style.setProperty('transform', 'none', 'important');
        isAnimating = false;
        stopEdgePeekLoop();
        return;
      }

      const x = -Math.round(readStep() * index);
      if (animated && !prefersReducedMotion() && carouselMedia.matches) {
        track.classList.add('is-animating');
        track.style.willChange = 'transform';
        track.style.setProperty('transition', 'transform 520ms cubic-bezier(0.18, 0.84, 0.22, 1)', 'important');
        isAnimating = true;
        clearAnimationFallback();
        animationFallbackTimer = window.setTimeout(() => {
          animationFallbackTimer = 0;
          if (!isAnimating) return;
          isAnimating = false;
          track.classList.remove('is-animating');
          track.style.willChange = 'auto';
          stopEdgePeekLoop(false);
          if (index >= cloneCount + totalSlides) {
            jumpToRealIndex(0);
          } else if (index < cloneCount) {
            jumpToRealIndex(totalSlides - 1);
          } else {
            updateEdgePeek();
            updateNav();
          }
          scheduleAutoplay();
        }, 760);
      } else {
        clearAnimationFallback();
        track.classList.remove('is-animating');
        track.style.willChange = 'auto';
        track.style.setProperty('transition', 'none', 'important');
        isAnimating = false;
        stopEdgePeekLoop(false);
      }
      track.style.setProperty('transform', `translate3d(${x}px, 0, 0)`, 'important');
      if (isAnimating) {
        startEdgePeekLoop();
      } else {
        requestEdgePeekUpdate();
      }
    };

    const jumpToRealIndex = (targetIndex) => {
      index = cloneCount + mod(targetIndex, totalSlides);
      setTranslate(false);
      updateNav();
    };

    const build = () => {
      const currentRealIndex = readRealIndex();
      track.innerHTML = '';
      originalTemplates.slice(-cloneCount).forEach((node) => {
        const clone = node.cloneNode(true);
        clone.dataset.heroProofClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
      originalTemplates.forEach((node) => track.appendChild(node.cloneNode(true)));
      originalTemplates.slice(0, cloneCount).forEach((node) => {
        const clone = node.cloneNode(true);
        clone.dataset.heroProofClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
      slidesAll = Array.from(track.children);
      index = cloneCount + currentRealIndex;
      setTranslate(false);
      updateNav();
      requestEdgePeekUpdate();
    };

    const stopAutoplay = () => {
      if (!autoplayTimer) return;
      clearTimeout(autoplayTimer);
      autoplayTimer = 0;
    };

    const clearResumeAutoplay = () => {
      if (!resumeAutoplayTimer) return;
      clearTimeout(resumeAutoplayTimer);
      resumeAutoplayTimer = 0;
    };

    const pauseAutoplay = () => {
      isPaused = true;
      stopAutoplay();
      clearResumeAutoplay();
    };

    const resumeAutoplay = (delayMs = 900) => {
      clearResumeAutoplay();
      resumeAutoplayTimer = window.setTimeout(() => {
        resumeAutoplayTimer = 0;
        isPaused = false;
        scheduleAutoplay();
      }, delayMs);
    };

    const shouldAutoplay = () => (
      carouselMedia.matches &&
      !prefersReducedMotion() &&
      !document.hidden &&
      !isPaused &&
      isSliderVisible
    );

    const scheduleAutoplay = () => {
      stopAutoplay();
      if (!shouldAutoplay()) return;
      autoplayTimer = window.setTimeout(() => {
        autoplayTimer = 0;
        goToNext();
      }, autoplayDelayMs);
    };

    const goToNext = () => {
      if (!carouselMedia.matches || isAnimating) {
        scheduleAutoplay();
        return;
      }
      index += 1;
      setTranslate(true);
      updateNav();
    };

    const goToPrev = () => {
      if (!carouselMedia.matches || isAnimating) {
        scheduleAutoplay();
        return;
      }
      index -= 1;
      setTranslate(true);
      updateNav();
    };

    const goToRealIndex = (targetIndex) => {
      if (!Number.isFinite(targetIndex)) return;
      stopAutoplay();
      index = cloneCount + mod(targetIndex, totalSlides);
      setTranslate(!prefersReducedMotion());
      updateNav();
      scheduleAutoplay();
    };

    track.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'transform') return;
      clearAnimationFallback();
      isAnimating = false;
      track.classList.remove('is-animating');
      track.style.willChange = 'auto';
      stopEdgePeekLoop(false);
      if (index >= cloneCount + totalSlides) {
        jumpToRealIndex(0);
      } else if (index < cloneCount) {
        jumpToRealIndex(totalSlides - 1);
      } else {
        updateEdgePeek();
        updateNav();
      }
      scheduleAutoplay();
    });

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => goToRealIndex(dotIndex));
    });

    const swipeState = {
      active: false,
      locked: false,
      source: '',
      pointerId: null,
      startX: 0,
      startY: 0,
      deltaX: 0,
    };

    const resetSwipeState = () => {
      swipeState.active = false;
      swipeState.locked = false;
      swipeState.source = '';
      swipeState.pointerId = null;
      swipeState.startX = 0;
      swipeState.startY = 0;
      swipeState.deltaX = 0;
      viewportEl.classList.remove('is-swiping');
    };

    const releasePointer = () => {
      if (swipeState.pointerId === null) return;
      if (typeof viewportEl.releasePointerCapture !== 'function') return;
      try {
        viewportEl.releasePointerCapture(swipeState.pointerId);
      } catch (_) {}
    };

    const startSwipe = (source, pointerId, clientX, clientY) => {
      if (!carouselMedia.matches || swipeState.active) return false;
      cancelActiveAnimation();
      pauseAutoplay();
      swipeState.active = true;
      swipeState.locked = false;
      swipeState.source = source;
      swipeState.pointerId = pointerId;
      swipeState.startX = clientX;
      swipeState.startY = clientY;
      swipeState.deltaX = 0;
      viewportEl.classList.add('is-swiping');
      return true;
    };

    const onSwipePointerDown = (event) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.buttons !== 1) return;
      if (!startSwipe('pointer', event.pointerId, event.clientX, event.clientY)) return;
      if (typeof viewportEl.setPointerCapture === 'function') {
        try {
          viewportEl.setPointerCapture(event.pointerId);
        } catch (_) {}
      }
    };

    const moveSwipe = (clientX, clientY, event) => {
      const dx = clientX - swipeState.startX;
      const dy = clientY - swipeState.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!swipeState.locked) {
        if (absDy > 18 && absDy > absDx * 1.15) {
          releasePointer();
          resetSwipeState();
          resumeAutoplay(900);
          return;
        }
        if (absDx > 12 && absDx > absDy * 1.2) {
          swipeState.locked = true;
        }
      }

      if (!swipeState.locked) return;
      if (event.cancelable) event.preventDefault();
      swipeState.deltaX = dx;
    };

    const onSwipePointerMove = (event) => {
      if (!swipeState.active || swipeState.source !== 'pointer' || event.pointerId !== swipeState.pointerId) return;
      moveSwipe(event.clientX, event.clientY, event);
    };

    const finishSwipe = () => {
      if (swipeState.locked && Math.abs(swipeState.deltaX) >= 42) {
        if (swipeState.deltaX < 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
      releasePointer();
      resetSwipeState();
      resumeAutoplay(1300);
    };

    const onSwipePointerUp = (event) => {
      if (!swipeState.active || swipeState.source !== 'pointer' || event.pointerId !== swipeState.pointerId) return;
      finishSwipe();
    };

    const onSwipePointerCancel = (event) => {
      if (!swipeState.active || swipeState.source !== 'pointer' || event.pointerId !== swipeState.pointerId) return;
      releasePointer();
      resetSwipeState();
      resumeAutoplay(900);
    };

    const findSwipeTouch = (touches, identifier) => Array.from(touches).find((touch) => touch.identifier === identifier);

    const onSwipeTouchStart = (event) => {
      if (swipeState.active || event.touches.length !== 1) return;
      const touch = event.touches[0];
      startSwipe('touch', touch.identifier, touch.clientX, touch.clientY);
    };

    const onSwipeTouchMove = (event) => {
      if (!swipeState.active || swipeState.source !== 'touch') return;
      const touch = findSwipeTouch(event.touches, swipeState.pointerId);
      if (!touch) return;
      moveSwipe(touch.clientX, touch.clientY, event);
    };

    const onSwipeTouchEnd = (event) => {
      if (!swipeState.active || swipeState.source !== 'touch') return;
      if (!findSwipeTouch(event.changedTouches, swipeState.pointerId)) return;
      finishSwipe();
    };

    const onSwipeTouchCancel = (event) => {
      if (!swipeState.active || swipeState.source !== 'touch') return;
      if (!findSwipeTouch(event.changedTouches, swipeState.pointerId)) return;
      resetSwipeState();
      resumeAutoplay(900);
    };

    const onSwipeMouseDown = (event) => {
      if (event.button !== 0 || swipeState.active) return;
      startSwipe('mouse', 'mouse', event.clientX, event.clientY);
    };

    const onSwipeMouseMove = (event) => {
      if (!swipeState.active || swipeState.source !== 'mouse') return;
      moveSwipe(event.clientX, event.clientY, event);
    };

    const onSwipeMouseUp = () => {
      if (!swipeState.active || swipeState.source !== 'mouse') return;
      finishSwipe();
    };

    const onSwipeWheel = (event) => {
      if (!carouselMedia.matches || swipeState.active) return;
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      if (absX < 18 || absX < absY * 1.15) return;
      if (event.cancelable) event.preventDefault();
      const now = Date.now();
      if (now - lastWheelSwipeAt < 680) return;
      lastWheelSwipeAt = now;
      cancelActiveAnimation();
      pauseAutoplay();
      if (event.deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      resumeAutoplay(1400);
    };

    viewportEl.addEventListener('pointerdown', onSwipePointerDown, { passive: true });
    viewportEl.addEventListener('pointermove', onSwipePointerMove, { passive: false });
    viewportEl.addEventListener('pointerup', onSwipePointerUp, { passive: true });
    viewportEl.addEventListener('pointercancel', onSwipePointerCancel, { passive: true });
    viewportEl.addEventListener('touchstart', onSwipeTouchStart, { passive: true });
    viewportEl.addEventListener('touchmove', onSwipeTouchMove, { passive: false });
    viewportEl.addEventListener('touchend', onSwipeTouchEnd, { passive: true });
    viewportEl.addEventListener('touchcancel', onSwipeTouchCancel, { passive: true });
    viewportEl.addEventListener('mousedown', onSwipeMouseDown, { passive: true });
    viewportEl.addEventListener('wheel', onSwipeWheel, { passive: false });
    window.addEventListener('mousemove', onSwipeMouseMove, { passive: false });
    window.addEventListener('mouseup', onSwipeMouseUp, { passive: true });

    const onResize = () => {
      build();
      if (carouselMedia.matches) {
        root.classList.add('is-hero-proof-loop');
        scheduleAutoplay();
      } else {
        root.classList.remove('is-hero-proof-loop');
        stopAutoplay();
      }
      syncHeroProofJivoQuiet();
    };
    const onResizeDebounced = createRafThrottle(onResize);
    window.addEventListener('resize', onResizeDebounced, { passive: true });
    window.addEventListener('orientationchange', onResizeDebounced, { passive: true });
    addMqChangeListener(carouselMedia, onResizeDebounced);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
        return;
      }
      scheduleAutoplay();
    });

    if ('IntersectionObserver' in window) {
      const autoplayObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== root) return;
          isSliderVisible = entry.isIntersecting && entry.intersectionRatio > 0.2;
          if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
            jivoQuietRoots.add(root);
          } else {
            jivoQuietRoots.delete(root);
          }
          syncHeroProofJivoQuiet();
          if (!isSliderVisible) {
            stopAutoplay();
            return;
          }
          scheduleAutoplay();
        });
      }, {
        threshold: [0, 0.2, 0.35],
        root: null,
        rootMargin: '0px',
      });
      autoplayObserver.observe(root);
    }

    build();
    if (carouselMedia.matches) {
      root.classList.add('is-hero-proof-loop');
      scheduleAutoplay();
    }
    syncHeroProofJivoQuiet();
  });
}

function guardInit(key) {
  if (!key) return false;
  if (!window.__kgInitFlags) {
    window.__kgInitFlags = new Set();
  }
  if (window.__kgInitFlags.has(key)) return false;
  window.__kgInitFlags.add(key);
  return true;
}

/**
 * Base path for assets so they work from any page depth (/, /scam/, /zpp/xxx/, etc.)
 * Returns '' for root, '..' for one level, '../..' for two levels.
 */
function getBasePath() {
  const pathname = window.location.pathname || '/';
  const segments = pathname.replace(/^\//, '').replace(/\/$/, '').split('/').filter(Boolean);
  if (segments[segments.length - 1] === 'index.html') segments.pop();
  const depth = segments.length;
  return depth === 0 ? '' : Array(depth).fill('..').join('/');
}

/**
 * Resolve asset path relative to current page (works for any nesting level).
 * @param {string} rel - e.g. 'assets/head/head_logo.webp', 'assets/icons/hand_s.webp'
 * @returns {string} path suitable for img src / href
 */
function getAssetPath(rel) {
  if (!rel) return '';
  if (/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(rel)) return rel;
  const base = getBasePath();
  return base ? base + '/' + rel : rel;
}

function readStorage(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw;
  } catch (e) {
    if (isDev()) console.warn('[storage] read local failed', e);
  }
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch (e) {
    if (isDev()) console.warn('[storage] read cookie failed', e);
    return null;
  }
}

function writeConsent(key, value, days) {
  if (!key) return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (isDev()) console.warn('[storage] write local failed', e);
  }
  try {
    const expires = days ? `; max-age=${Math.round(days * 24 * 60 * 60)}` : '';
    document.cookie = `${key}=${encodeURIComponent(value)}${expires}; path=/`;
  } catch (e) {
    if (isDev()) console.warn('[storage] write cookie failed', e);
  }
}

function initCookieBanner() {
  if (!guardInit('cookie-banner')) return;

  const CONSENT_KEY = 'kg_cookie_consent';
  const CONSENT_VALUE = 'true';
  const CONSENT_TTL_DAYS = 180;

  const existing = readStorage(CONSENT_KEY);
  if (existing === CONSENT_VALUE) return;

  const banner = document.createElement('div');
  banner.className = 'kg-cookie';
  banner.innerHTML = `
    <div class="kg-cookie__body">
      <p class="kg-cookie__text">Мы обрабатываем cookies, чтобы сделать наш сайт удобнее и персонализированнее для вас. Подробнее: <a class="kg-cookie__link" href="/cookies/">политика использования cookies</a> и <a class="kg-cookie__link" href="/privacy-policy.html">защита данных</a>.</p>
      <button type="button" class="kg-cookie__btn">Принять</button>
    </div>
  `;

  const applySafeInset = () => {
    const stickyAsk = document.querySelector('.kg-obsidian-drift');
    const hasSticky = stickyAsk && window.getComputedStyle(stickyAsk).display !== 'none';
    if (hasSticky) {
      banner.style.setProperty('--kg-cookie-offset-left', '18px');
    } else {
      banner.style.removeProperty('--kg-cookie-offset-left');
    }
  };

  const accept = () => {
    banner.classList.add('is-hiding');
    writeConsent(CONSENT_KEY, CONSENT_VALUE, CONSENT_TTL_DAYS);
    window.setTimeout(() => {
      banner.remove();
    }, 180);
  };

  const btn = banner.querySelector('.kg-cookie__btn');
  if (btn) btn.addEventListener('click', accept);

  document.body.appendChild(banner);
  applySafeInset();

  const mql = window.matchMedia('(max-width: 980px)');
  const handleResize = () => {
    banner.classList.toggle('kg-cookie--mobile', mql.matches);
    applySafeInset();
  };
  handleResize();

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handleResize);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(handleResize);
  }
}

function createRafThrottle(callback) {
  if (typeof callback !== 'function') return () => {};
  const raf = typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : (fn) => window.setTimeout(fn, 16);
  let frameId = 0;
  return () => {
    if (frameId) return;
    frameId = raf(() => {
      frameId = 0;
      callback();
    });
  };
}

function createRafScheduler() {
  const raf = typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : (fn) => window.setTimeout(fn, 16);

  const scrollSubscribers = new Set();
  const resizeSubscribers = new Set();
  const observedScrollTargets = new WeakSet();

  let frameId = 0;
  let scrollDirty = true;
  let resizeDirty = true;
  let pendingScrollClassTimeout = 0;
  let isScrollingClassOn = false;

  let lastScrollY = Math.round(window.scrollY || window.pageYOffset || 0);
  let lastVW = Math.round(window.innerWidth || document.documentElement.clientWidth || 0);
  let lastVH = Math.round(window.innerHeight || document.documentElement.clientHeight || 0);

  const debug = {
    secondStartedAt: performance.now(),
    frames: 0,
    updatedElements: 0,
  };

  const toggleScrollingClass = (enabled) => {
    const root = document.documentElement;
    if (!root) return;
    if (enabled) {
      if (isScrollingClassOn) return;
      isScrollingClassOn = true;
      root.classList.add('is-scrolling');
      return;
    }
    if (!isScrollingClassOn) return;
    isScrollingClassOn = false;
    root.classList.remove('is-scrolling');
  };

  const scheduleScrollClassReset = () => {
    if (pendingScrollClassTimeout) {
      clearTimeout(pendingScrollClassTimeout);
      pendingScrollClassTimeout = 0;
    }
    pendingScrollClassTimeout = window.setTimeout(() => {
      pendingScrollClassTimeout = 0;
      toggleScrollingClass(false);
    }, 140);
  };

  const requestTick = () => {
    if (frameId) return;
    frameId = raf(runFrame);
  };

  const handleScrollEvent = () => {
    scrollDirty = true;
    toggleScrollingClass(true);
    scheduleScrollClassReset();
    requestTick();
  };

  const handleResizeEvent = () => {
    scrollDirty = true;
    resizeDirty = true;
    requestTick();
  };

  function runFrame() {
    frameId = 0;

    const nextScrollY = Math.round(window.scrollY || window.pageYOffset || 0);
    const nextVW = Math.round(window.innerWidth || document.documentElement.clientWidth || 0);
    const nextVH = Math.round(window.innerHeight || document.documentElement.clientHeight || 0);

    const deltaY = nextScrollY - lastScrollY;
    const scrollChanged = Math.abs(deltaY) >= 1;
    const resizeChanged = nextVW !== lastVW || nextVH !== lastVH;

    const shouldRunScroll = scrollDirty && scrollChanged;
    const shouldRunResize = resizeDirty && resizeChanged;

    if (!shouldRunScroll && !shouldRunResize) {
      scrollDirty = false;
      resizeDirty = false;
      return;
    }

    const snapshot = {
      scrollY: nextScrollY,
      lastScrollY,
      deltaY,
      viewportWidth: nextVW,
      viewportHeight: nextVH,
      lastVW,
      lastVH,
      scrollChanged,
      resizeChanged,
    };

    let updatedCount = 0;
    const runSubscribers = (subscribers, phase) => {
      subscribers.forEach((sub) => {
        if (!sub || typeof sub.callback !== 'function') return;
        if (phase === 'scroll') {
          if (!shouldRunScroll) return;
          if (typeof sub.minDelta === 'number' && Math.abs(deltaY) < sub.minDelta) return;
        }
        if (phase === 'resize' && !shouldRunResize) return;
        const updated = sub.callback(snapshot);
        if (typeof updated === 'number' && Number.isFinite(updated) && updated > 0) {
          updatedCount += Math.round(updated);
        } else if (updated === true) {
          updatedCount += 1;
        }
      });
    };

    runSubscribers(scrollSubscribers, 'scroll');
    runSubscribers(resizeSubscribers, 'resize');

    if (isDev()) {
      debug.frames += 1;
      debug.updatedElements += updatedCount;
      const now = performance.now();
      if (now - debug.secondStartedAt >= 1000) {
        const elapsed = now - debug.secondStartedAt;
        const fps = elapsed > 0 ? (debug.frames * 1000) / elapsed : debug.frames;
        console.debug(
          `[scroll-rAF] fps=${fps.toFixed(1)} updated/frame=${(debug.updatedElements / Math.max(1, debug.frames)).toFixed(1)}`
        );
        debug.secondStartedAt = now;
        debug.frames = 0;
        debug.updatedElements = 0;
      }
    }

    lastScrollY = nextScrollY;
    lastVW = nextVW;
    lastVH = nextVH;
    scrollDirty = false;
    resizeDirty = false;
  }

  const observeScrollSource = (target) => {
    if (!target || typeof target.addEventListener !== 'function') return;
    if (observedScrollTargets.has(target)) return;
    observedScrollTargets.add(target);
    target.addEventListener('scroll', handleScrollEvent, { passive: true });
  };

  window.addEventListener('scroll', handleScrollEvent, { passive: true });
  window.addEventListener('resize', handleResizeEvent, { passive: true });
  window.addEventListener('orientationchange', handleResizeEvent, { passive: true });

  return {
    onScroll(callback, options = {}) {
      if (typeof callback !== 'function') return () => {};
      const sub = {
        callback,
        minDelta: typeof options.minDelta === 'number' ? options.minDelta : 0,
      };
      scrollSubscribers.add(sub);
      if (options.immediate !== false) requestTick();
      return () => scrollSubscribers.delete(sub);
    },
    onResize(callback, options = {}) {
      if (typeof callback !== 'function') return () => {};
      const sub = { callback };
      resizeSubscribers.add(sub);
      if (options.immediate !== false) requestTick();
      return () => resizeSubscribers.delete(sub);
    },
    observeScrollSource,
    requestTick,
  };
}

const REVIEWS_MAP_URL = 'https://yandex.ru/maps/org/keys/64216225429/reviews/';
const REVIEWS_RATING_SUMMARY = {
  average: 4.9,
  count: 63,
};
const reviewsCarouselStates = new WeakMap();

function getReviewInitials(name) {
  const parts = String(name || 'Клиент')
    .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join('');
  return (initials || 'К').toUpperCase();
}

function getReviewAvatarTone(index) {
  const tones = [
    ['#3b2417', '#ff8a3d'],
    ['#172b36', '#54a3c7'],
    ['#2b1f35', '#b586ff'],
    ['#1e3027', '#6ec79a'],
    ['#34231c', '#e1a45d'],
    ['#202536', '#7c9cff'],
    ['#351f29', '#e8799f'],
  ];
  return tones[index % tones.length];
}

function createReviewAvatarFallback(review, index) {
  const [from, to] = getReviewAvatarTone(index);
  const fallback = document.createElement('span');
  fallback.className = 'review-card__avatar review-card__avatar--initials';
  fallback.textContent = getReviewInitials(review.name);
  fallback.style.setProperty('--review-avatar-from', from);
  fallback.style.setProperty('--review-avatar-to', to);
  return fallback;
}

function createReviewAvatar(review, index) {
  const avatarSrc = String(review.avatar || '').trim();
  if (avatarSrc) {
    const avatar = document.createElement('img');
    avatar.className = 'review-card__avatar';
    avatar.src = avatarSrc;
    avatar.alt = '';
    avatar.loading = 'eager';
    avatar.decoding = 'async';
    avatar.referrerPolicy = 'no-referrer';
    avatar.addEventListener('error', () => {
      const fallback = createReviewAvatarFallback(review, index);
      if (avatar.parentNode) avatar.parentNode.replaceChild(fallback, avatar);
    }, { once: true });
    return avatar;
  }

  return createReviewAvatarFallback(review, index);
}

function getReviewsVisibleCount() {
  if (window.matchMedia('(max-width: 768px)').matches) return 1;
  if (window.matchMedia('(max-width: 1100px)').matches) return 2;
  return 3;
}

function getReviewsLogicalIndex(state) {
  if (!state.reviewItems.length) return 0;
  const offset = state.reviewIndex - state.reviewVisibleCount;
  const normalized = ((offset % state.reviewItems.length) + state.reviewItems.length) % state.reviewItems.length;
  return normalized;
}

function updateReviewsIndicator(state) {
  if (!state.indicator) return;
  const segment = state.indicator.querySelector('.reviews-carousel__indicator-segment');
  if (!segment) return;

  const total = state.reviewItems.length;
  if (total <= 1) {
    segment.style.width = '100%';
    segment.style.left = '0%';
    segment.style.transform = 'translate3d(0, -50%, 0)';
    return;
  }

  const logicalIndex = getReviewsLogicalIndex(state);
  const segmentWidth = Math.max(12, (state.reviewVisibleCount / total) * 100);
  const travel = 100 - segmentWidth;
  segment.style.width = `${segmentWidth}%`;
  segment.style.left = `${(logicalIndex / (total - 1)) * travel}%`;
  segment.style.transform = 'translate3d(0, -50%, 0)';
}

function pauseReviewsAutoplay(section, reason) {
  const state = reviewsCarouselStates.get(section);
  if (!state) return;
  state.reviewPauseReasons.add(reason || 'manual');
  if (state.reviewAutoplayTimer) {
    clearTimeout(state.reviewAutoplayTimer);
    state.reviewAutoplayTimer = null;
  }
}

function scheduleReviewsAutoplay(section) {
  const state = reviewsCarouselStates.get(section);
  if (!state) return;
  if (state.reviewAutoplayTimer) clearTimeout(state.reviewAutoplayTimer);
  if (state.reviewPauseReasons.size > 0) return;
  if (state.reviewItems.length <= 1) return;

  state.reviewAutoplayTimer = setTimeout(() => {
    state.reviewAutoplayTimer = null;
    goReviewsNext(section, { fromAutoplay: true });
    scheduleReviewsAutoplay(section);
  }, 4500);
}

function resumeReviewsAutoplay(section, reason) {
  const state = reviewsCarouselStates.get(section);
  if (!state) return;
  if (reason) state.reviewPauseReasons.delete(reason);
  if (state.reviewPauseReasons.size > 0) return;
  scheduleReviewsAutoplay(section);
}

function setReviewsTransform(state, { animate = true } = {}) {
  const distance = state.reviewIndex * (state.reviewCardWidth + state.reviewGap);
  state.track.style.transition = animate
    ? 'transform 420ms ease'
    : 'none';
  state.track.style.transform = `translate3d(${-distance}px, 0, 0)`;
}

function jumpReviewsTransform(state) {
  setReviewsTransform(state, { animate: false });
  state.track.getBoundingClientRect();
  state.track.style.transition = 'transform 420ms ease';
}

function buildReviewsLoopCards(state) {
  const visible = state.reviewVisibleCount;
  const count = state.reviewItems.length;
  if (!count) return [];

  const before = state.reviewItems.slice(count - visible, count);
  const after = state.reviewItems.slice(0, visible);
  const cards = [];

  before.forEach((item, index) => {
    const logicalIndex = count - visible + index;
    const card = state.renderReview(item, logicalIndex);
    card.dataset.reviewClone = 'before';
    card.dataset.reviewLogicalIndex = String(logicalIndex);
    cards.push(card);
  });

  state.reviewItems.forEach((item, index) => {
    const card = state.renderReview(item, index);
    card.dataset.reviewClone = 'real';
    card.dataset.reviewLogicalIndex = String(index);
    cards.push(card);
  });

  after.forEach((item, index) => {
    const card = state.renderReview(item, index);
    card.dataset.reviewClone = 'after';
    card.dataset.reviewLogicalIndex = String(index);
    cards.push(card);
  });

  return cards;
}

function formatReviewsRating(value) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  return normalized.toFixed(1);
}

function getReviewsCountLabel(count) {
  const value = Math.max(0, Number(count) || 0);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} оценка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${value} оценки`;
  return `${value} оценок`;
}

function getReviewsStats(items) {
  const reviews = Array.isArray(items) ? items : [];
  const ratings = reviews
    .map((item) => Number(item && item.rating))
    .filter((value) => Number.isFinite(value) && value > 0);
  const average = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 0;
  return {
    average,
    count: reviews.length,
  };
}

function updateReviewsRatingSummary(section, summary = REVIEWS_RATING_SUMMARY) {
  const rating = section.querySelector('[data-reviews-rating]');
  if (!rating) return;

  const stats = Array.isArray(summary) ? getReviewsStats(summary) : summary;
  const ratingValue = rating.querySelector('.reviews-panel__rating-value');
  const stars = rating.querySelector('.reviews-panel__rating-stars');
  const count = rating.querySelector('.reviews-panel__rating-count');
  const formatted = formatReviewsRating(stats.average);
  const roundedStars = Math.max(0, Math.min(5, Math.round(stats.average)));

  if (ratingValue) ratingValue.textContent = formatted;
  if (stars) {
    stars.textContent = '★'.repeat(roundedStars) + '☆'.repeat(5 - roundedStars);
    stars.setAttribute('aria-label', `Рейтинг ${formatted} из 5`);
  }
  if (count) count.textContent = getReviewsCountLabel(stats.count);
}

function updateReviewsCarousel(section, options = {}) {
  const { keepLogical = true } = options;
  const state = reviewsCarouselStates.get(section);
  if (!state || !state.reviewItems.length) return;

  const previousLogical = keepLogical ? getReviewsLogicalIndex(state) : 0;
  state.reviewVisibleCount = Math.min(getReviewsVisibleCount(), Math.max(1, state.reviewItems.length));
  state.section.classList.toggle('is-reviews-mobile', state.reviewVisibleCount === 1);

  const cards = buildReviewsLoopCards(state);
  state.track.replaceChildren(...cards);
  state.cards = Array.from(state.track.querySelectorAll('.review-card'));

  state.reviewGap = Number.parseFloat(window.getComputedStyle(state.track).gap) || 0;
  const viewportWidth = state.viewport.clientWidth;
  state.reviewCardWidth = state.reviewVisibleCount > 0
    ? (viewportWidth - state.reviewGap * (state.reviewVisibleCount - 1)) / state.reviewVisibleCount
    : viewportWidth;

  state.cards.forEach((card) => {
    card.style.flex = `0 0 ${state.reviewCardWidth}px`;
  });

  const logicalIndex = keepLogical ? Math.max(0, Math.min(previousLogical, state.reviewItems.length - 1)) : 0;
  state.reviewIndex = state.reviewVisibleCount + logicalIndex;
  state.reviewIsAnimating = false;
  state.reviewsReady = false;
  state.prev.disabled = true;
  state.next.disabled = true;
  setReviewsTransform(state, { animate: false });
  state.track.offsetHeight;
  if (state.reviewInitRaf) cancelAnimationFrame(state.reviewInitRaf);
  if (state.reviewInitRaf2) cancelAnimationFrame(state.reviewInitRaf2);
  state.reviewInitRaf = requestAnimationFrame(() => {
    state.reviewInitRaf = null;
    state.reviewInitRaf2 = requestAnimationFrame(() => {
      state.reviewInitRaf2 = null;
      state.track.style.transition = 'transform 420ms ease';
      state.reviewsReady = true;
      state.prev.disabled = false;
      state.next.disabled = false;
    });
  });
  updateReviewsIndicator(state);
}

function goReviewsNext(section, options = {}) {
  const { fromAutoplay = false } = options;
  const state = reviewsCarouselStates.get(section);
  if (!state || state.reviewItems.length <= 1) return;
  if (!state.reviewsReady) return;
  if (state.reviewIsAnimating) return;

  if (!fromAutoplay) pauseReviewsAutoplay(section, 'interaction');
  state.reviewIsAnimating = true;
  state.reviewIndex += 1;
  setReviewsTransform(state, { animate: true });
  if (!fromAutoplay) resumeReviewsAutoplay(section, 'interaction');
}

function goReviewsPrev(section) {
  const state = reviewsCarouselStates.get(section);
  if (!state || state.reviewItems.length <= 1) return;
  if (!state.reviewsReady) return;
  if (state.reviewIsAnimating) return;

  pauseReviewsAutoplay(section, 'interaction');
  state.reviewIsAnimating = true;
  state.reviewIndex -= 1;
  setReviewsTransform(state, { animate: true });
  resumeReviewsAutoplay(section, 'interaction');
}

function bindReviewsSwipe(section) {
  const state = reviewsCarouselStates.get(section);
  if (!state || state.swipeBound) return;

  const swipeThreshold = 35;
  const wheelThreshold = 72;
  let resumeTimer = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let isPointerActive = false;
  let isHorizontalGesture = false;
  let activePointerId = null;
  let activeInput = '';
  let wheelDeltaX = 0;
  let wheelResetTimer = null;
  let wheelLockedUntil = 0;

  const clearResumeTimer = () => {
    if (!resumeTimer) return;
    clearTimeout(resumeTimer);
    resumeTimer = null;
  };

  const scheduleResume = () => {
    clearResumeTimer();
    resumeTimer = setTimeout(() => {
      resumeTimer = null;
      resumeReviewsAutoplay(section, 'touch');
    }, 5500);
  };

  const resetGesture = () => {
    isPointerActive = false;
    isHorizontalGesture = false;
    activePointerId = null;
    activeInput = '';
  };

  const startGesture = (clientX, clientY, input, pointerId = null) => {
    if (!state.reviewsReady) return;
    activePointerId = pointerId;
    activeInput = input;
    isPointerActive = true;
    isHorizontalGesture = false;
    startX = clientX;
    startY = clientY;
    lastX = clientX;
    lastY = clientY;
    pauseReviewsAutoplay(section, 'touch');
  };

  const moveGesture = (clientX, clientY, event) => {
    if (!isPointerActive) return;
    lastX = clientX;
    lastY = clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!isHorizontalGesture) {
      if (absY > absX && absY > 18) {
        resetGesture();
        scheduleResume();
        return;
      }
      if (absX > absY * 1.15 && absX > 12) {
        isHorizontalGesture = true;
      } else {
        return;
      }
    }

    if (event.cancelable) event.preventDefault();
  };

  const finishGesture = () => {
    if (!isPointerActive) return;
    const dx = lastX - startX;
    const dy = lastY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > absY * 1.15 && absX > swipeThreshold) {
      if (dx < 0) goReviewsNext(section);
      else goReviewsPrev(section);
    }

    resetGesture();
    scheduleResume();
  };

  const resetWheelSwipe = () => {
    wheelDeltaX = 0;
    if (wheelResetTimer) {
      clearTimeout(wheelResetTimer);
      wheelResetTimer = null;
    }
  };

  const onWheel = (event) => {
    const rawDeltaX = Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.75
      ? event.deltaX
      : (event.shiftKey ? event.deltaY : 0);
    const absDeltaX = Math.abs(rawDeltaX);
    const absDeltaY = Math.abs(event.deltaY);

    if (absDeltaX < 8 || absDeltaX < absDeltaY * 0.55) return;
    if (event.cancelable) event.preventDefault();

    const now = Date.now();
    if (now < wheelLockedUntil) return;

    pauseReviewsAutoplay(section, 'touch');
    wheelDeltaX += rawDeltaX;

    if (wheelResetTimer) clearTimeout(wheelResetTimer);
    wheelResetTimer = setTimeout(() => {
      resetWheelSwipe();
      scheduleResume();
    }, 180);

    if (wheelDeltaX >= wheelThreshold) {
      resetWheelSwipe();
      wheelLockedUntil = now + 560;
      goReviewsNext(section);
      scheduleResume();
    } else if (wheelDeltaX <= -wheelThreshold) {
      resetWheelSwipe();
      wheelLockedUntil = now + 560;
      goReviewsPrev(section);
      scheduleResume();
    }
  };

  if (typeof window === 'undefined') return;

  state.viewport.addEventListener('wheel', onWheel, { passive: false });

  if ('PointerEvent' in window) {
    state.viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' && 'ontouchstart' in window) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startGesture(event.clientX, event.clientY, 'pointer', event.pointerId);
      try {
        state.viewport.setPointerCapture(event.pointerId);
      } catch (_) {}
    }, { passive: false });

    window.addEventListener('pointermove', (event) => {
      if (!isPointerActive || activeInput !== 'pointer' || activePointerId !== event.pointerId) return;
      moveGesture(event.clientX, event.clientY, event);
    }, { passive: false });

    window.addEventListener('pointerup', (event) => {
      if (!isPointerActive || activeInput !== 'pointer' || activePointerId !== event.pointerId) return;
      finishGesture();
    }, { passive: false });

    window.addEventListener('pointercancel', (event) => {
      if (activeInput !== 'pointer' || activePointerId !== event.pointerId) return;
      resetGesture();
      scheduleResume();
    }, { passive: false });
  }

  state.viewport.addEventListener('touchstart', (event) => {
    if (isPointerActive || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    startGesture(touch.clientX, touch.clientY, 'touch');
  }, { passive: true });

  state.viewport.addEventListener('touchmove', (event) => {
    if (!isPointerActive || activeInput !== 'touch' || !event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    moveGesture(touch.clientX, touch.clientY, event);
  }, { passive: false });

  state.viewport.addEventListener('touchend', () => {
    if (!isPointerActive || activeInput !== 'touch') return;
    finishGesture();
  }, { passive: false });

  state.viewport.addEventListener('touchcancel', () => {
    if (activeInput !== 'touch') return;
    resetGesture();
    scheduleResume();
  }, { passive: false });

  state.swipeBound = true;
}

function initReviewsCarousel(section) {
  const panel = section.querySelector('.reviews-panel');
  const track = section.querySelector('[data-reviews-grid]');
  if (!panel || !track) return;

  track.classList.add('reviews-carousel__track');

  const top = panel.querySelector('.reviews-section__top');
  if (top && !top.querySelector('[data-reviews-rating]')) {
    const rating = document.createElement('div');
    rating.className = 'reviews-panel__rating';
    rating.setAttribute('data-reviews-rating', '');
    rating.innerHTML = '<div class="reviews-panel__rating-row"><strong class="reviews-panel__rating-value">0.0</strong><span class="reviews-panel__rating-stars" aria-label="Рейтинг 0.0 из 5">☆☆☆☆☆</span><span class="reviews-panel__rating-divider" aria-hidden="true"></span><span class="reviews-panel__rating-count">0 оценок</span></div>';
    top.prepend(rating);
  }
  const mapLink = panel.querySelector('.reviews-section__map-link');
  if (top && mapLink && mapLink.parentNode !== top) {
    mapLink.setAttribute('aria-label', 'Смотреть все отзывы на Яндекс.Картах');
    top.append(mapLink);
  }

  let viewport = section.querySelector('[data-reviews-carousel-viewport]');
  if (!viewport) {
    viewport = document.createElement('div');
    viewport.className = 'reviews-carousel__viewport';
    viewport.setAttribute('data-reviews-carousel-viewport', '');
    track.before(viewport);
    viewport.append(track);
  }

  let nav = section.querySelector('[data-reviews-carousel-nav]');
  if (!nav) {
    nav = document.createElement('div');
    nav.className = 'reviews-carousel__nav';
    nav.setAttribute('data-reviews-carousel-nav', '');

    const prev = document.createElement('button');
    prev.className = 'reviews-carousel__button reviews-carousel__button--prev';
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Предыдущий отзыв');
    prev.textContent = '‹';

    const next = document.createElement('button');
    next.className = 'reviews-carousel__button reviews-carousel__button--next';
    next.type = 'button';
    next.setAttribute('aria-label', 'Следующий отзыв');
    next.textContent = '›';

    nav.append(prev, next);
    panel.append(nav);
  }

  let indicator = section.querySelector('[data-reviews-carousel-indicator]');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'reviews-carousel__indicator';
    indicator.setAttribute('data-reviews-carousel-indicator', '');
    indicator.setAttribute('aria-hidden', 'true');
    indicator.innerHTML = '<span class="reviews-carousel__indicator-segment"></span>';
  }
  viewport.after(nav);
  const navNext = nav.querySelector('.reviews-carousel__button--next');
  if (navNext && indicator.parentNode !== nav) {
    nav.insertBefore(indicator, navNext);
  }

  const state = reviewsCarouselStates.get(section) || {
    section,
    reviewItems: [],
    reviewIndex: 0,
    reviewVisibleCount: 1,
    reviewCardWidth: 0,
    reviewGap: 0,
    reviewAutoplayTimer: null,
    reviewIsAnimating: false,
    reviewsReady: false,
    reviewInitRaf: null,
    reviewInitRaf2: null,
    reviewPauseReasons: new Set(),
  };
  state.panel = panel;
  state.viewport = viewport;
  state.track = track;
  state.prev = nav.querySelector('.reviews-carousel__button--prev');
  state.next = nav.querySelector('.reviews-carousel__button--next');
  state.indicator = indicator;
  reviewsCarouselStates.set(section, state);

  if (!state.buttonsBound) {
    const suppressNavDefault = (event) => {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    };
    state.prev.addEventListener('pointerdown', suppressNavDefault, { passive: false });
    state.next.addEventListener('pointerdown', suppressNavDefault, { passive: false });
    state.prev.addEventListener('mousedown', suppressNavDefault, { passive: false });
    state.next.addEventListener('mousedown', suppressNavDefault, { passive: false });
    state.prev.addEventListener('click', (event) => {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      goReviewsPrev(section);
    });
    state.next.addEventListener('click', (event) => {
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      goReviewsNext(section);
    });
    state.panel.addEventListener('mouseenter', () => pauseReviewsAutoplay(section, 'hover'));
    state.panel.addEventListener('mouseleave', () => resumeReviewsAutoplay(section, 'hover'));
    state.panel.addEventListener('pointerdown', () => {
      state.reviewLastPointerDownAt = Date.now();
    }, { passive: true });
    state.panel.addEventListener('focusin', () => {
      const fromPointer = Date.now() - (state.reviewLastPointerDownAt || 0) < 280;
      if (!fromPointer) pauseReviewsAutoplay(section, 'focus');
    });
    state.panel.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!state.panel.contains(document.activeElement)) {
          resumeReviewsAutoplay(section, 'focus');
        }
      });
    });
    state.buttonsBound = true;
  }

  if (!state.transitionBound) {
    state.track.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'transform') return;
      if (!state.reviewItems.length) return;

      const minIndex = state.reviewVisibleCount;
      const maxIndex = state.reviewVisibleCount + state.reviewItems.length - 1;

      if (state.reviewIndex > maxIndex) {
        state.reviewIndex = minIndex;
        jumpReviewsTransform(state);
      } else if (state.reviewIndex < minIndex) {
        state.reviewIndex = maxIndex;
        jumpReviewsTransform(state);
      }

      state.reviewIsAnimating = false;
      updateReviewsIndicator(state);
    });
    state.transitionBound = true;
  }

  bindReviewsSwipe(section);
  updateReviewsCarousel(section, { keepLogical: false });
  scheduleReviewsAutoplay(section);
}

function initReviewsJivoQuietMode(sections) {
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const mobileQuery = window.matchMedia('(max-width: 520px)');
  const visibleSections = new Set();
  const sync = () => {
    root.classList.toggle('reviews-jivo-quiet', mobileQuery.matches && visibleSections.size > 0);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.12) {
        visibleSections.add(entry.target);
      } else {
        visibleSections.delete(entry.target);
      }
    });
    sync();
  }, {
    root: null,
    rootMargin: '-72px 0px -18% 0px',
    threshold: [0, 0.12, 0.28],
  });

  sections.forEach((section) => observer.observe(section));
  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', sync);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(sync);
  }
  sync();
}

function initReviewsSection() {
  if (!guardInit('reviews-section')) return;

  const sections = Array.from(document.querySelectorAll('.reviews-section[data-reviews-source]'));
  if (!sections.length) return;
  initReviewsJivoQuietMode(sections);

  const renderReview = (review, index) => {
    const card = document.createElement('article');
    card.className = 'review-card';

    const head = document.createElement('div');
    head.className = 'review-card__head';

    const avatar = createReviewAvatar(review, index);

    const person = document.createElement('div');
    person.className = 'review-card__person';
    const name = document.createElement('h3');
    name.textContent = review.name || 'Клиент';
    const date = document.createElement('p');
    date.textContent = review.date || '';
    person.append(name, date);

    const rating = document.createElement('span');
    rating.className = 'review-card__rating';
    const value = Math.max(0, Math.min(5, Number(review.rating) || 5));
    rating.textContent = '★'.repeat(value) + '☆'.repeat(5 - value);
    rating.setAttribute('aria-label', `${value} из 5`);
    head.append(avatar, person);

    const text = document.createElement('p');
    text.className = 'review-card__text';
    text.textContent = review.text || '';

    const meta = document.createElement('div');
    meta.className = 'review-card__meta';
    const source = document.createElement('span');
    source.textContent = review.source || 'Яндекс Карты';
    meta.append(source);

    card.append(head, rating, text, meta);
    return card;
  };

  sections.forEach((section) => {
    const grid = section.querySelector('[data-reviews-grid]');
    const source = section.getAttribute('data-reviews-source');
    if (!grid || !source) return;

    section.querySelectorAll('.reviews-section__link, .reviews-section__map-link').forEach((link) => {
      link.href = REVIEWS_MAP_URL;
    });

    initReviewsCarousel(section);
    updateReviewsRatingSummary(section);

    if (typeof fetch !== 'function') return;

    fetch(source, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Reviews source failed: ${response.status}`);
        return response.json();
      })
      .then((items) => {
        if (!Array.isArray(items) || !items.length) return;
        const state = reviewsCarouselStates.get(section);
        if (!state) return;
        state.renderReview = renderReview;
        const reviews = items.filter(Boolean);
        state.reviewItems = reviews.slice(0, 14);
        updateReviewsRatingSummary(section);
        updateReviewsCarousel(section, { keepLogical: false });
        scheduleReviewsAutoplay(section);
      })
      .catch((error) => {
        if (isDev()) console.warn('[reviews] fallback cards used', error);
      });
  });

  onResizeRaf(() => {
    sections.forEach((section) => updateReviewsCarousel(section, { keepLogical: true }));
    return 1;
  });
}

function initCaseShowcaseSections() {
  if (!guardInit('case-showcase')) return;

  const roots = Array.from(document.querySelectorAll('.case-showcase, .investment-cases#cases'));
  if (!roots.length) return;

  const defaultDocs = ['Претензия', 'Исковое заявление', 'Решение суда', 'Исполнительный лист'];
  const docPools = {
    pret: Array.from({ length: 8 }, (_, i) => `assets/cases/pret/pret-${String(i + 1).padStart(2, '0')}.webp`),
    isk: Array.from({ length: 8 }, (_, i) => `assets/cases/isk/isk-${String(i + 1).padStart(2, '0')}.webp`),
    resh: Array.from({ length: 8 }, (_, i) => `assets/cases/resh/resh-${String(i + 1).padStart(2, '0')}.webp`),
    ispol: Array.from({ length: 8 }, (_, i) => `assets/cases/ispol/ispol-${i + 1}.webp`),
  };
  const caseDurations = ['6 месяцев', '7 месяцев', '5 месяцев', '8 месяцев', '9 месяцев', '10 месяцев', '11 месяцев', '6 месяцев'];
  const caseResults = ['1 600 000 ₽', '1 120 000 ₽', '1 340 000 ₽', '1 080 000 ₽', '1 210 000 ₽', '1 470 000 ₽', '1 250 000 ₽', '1 030 000 ₽'];
  const AUTO_DELAY = 7000;
  const TRANSITION_MS = 620;

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  const splitList = (value) => String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const getText = (node, selector) => String(node.querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  const normalizeDocName = (value) => String(value || '').trim().toLowerCase();
  const getCanonicalDocName = (docName) => {
    const name = normalizeDocName(docName);
    if (name.includes('претенз')) return 'Претензия';
    if (name.includes('иск')) return 'Исковое заявление';
    if (name.includes('решен')) return 'Решение суда';
    if (name.includes('испол')) return 'Исполнительный лист';
    if (name.includes('договор')) return 'Исполнительный лист';
    return '';
  };
  const normalizeDocsList = (docs) => {
    const mapped = docs.map((doc) => getCanonicalDocName(doc)).filter(Boolean);
    const rest = defaultDocs.filter((doc) => !mapped.includes(doc));
    return [...mapped, ...rest].slice(0, 4);
  };
  const getDocPoolKey = (docName) => {
    const name = getCanonicalDocName(docName);
    if (name === 'Претензия') return 'pret';
    if (name === 'Исковое заявление') return 'isk';
    if (name === 'Решение суда') return 'resh';
    if (name === 'Исполнительный лист') return 'ispol';
    return '';
  };
  const pickDocImage = (poolKey, caseIndex) => {
    const pool = docPools[poolKey];
    if (!pool || !pool.length) return '';
    const safeIndex = Number.isFinite(caseIndex) ? caseIndex : 0;
    const imageIndex = ((safeIndex % pool.length) + pool.length) % pool.length;
    return getAssetPath(pool[imageIndex]);
  };
  const getResultCaption = () => {
    const page = document.body?.dataset?.page || '';
    if (page.includes('hack')) return 'кредитная задолженность оспорена';
    return 'возвращено клиенту';
  };
  const harvestStaticCards = (root) => Array.from(root.querySelectorAll('.case-card')).map((card, index) => {
    const title = getText(card, '.case-title, h3') || `Кейс ${index + 1}`;
    const texts = Array.from(card.querySelectorAll('.case-text, p'))
      .map((item) => item.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const resultText = getText(card, '.case-result') || texts.find((text) => /₽|руб/i.test(text)) || caseResults[index % caseResults.length];
    const amountMatch = resultText.match(/[\d\s,.]+(?:млн\s*)?₽/i);
    return {
      index,
      title,
      lead: texts.join(' ') || title,
      result: amountMatch ? amountMatch[0].trim() : resultText,
      tags: [],
      docs: defaultDocs,
      duration: caseDurations[index % caseDurations.length],
    };
  });

  roots.forEach((root) => {
    if (root.dataset.caseShowcaseReady === 'true') return;

    root.classList.add('case-showcase');
    let head = root.querySelector('.case-showcase__head');
    const main = root.querySelector('.case-showcase__main');
    const rail = root.querySelector('.case-showcase__rail');
    const railItems = Array.from(root.querySelectorAll('.case-showcase__item'));
    const staticCards = !railItems.length ? harvestStaticCards(root) : [];
    if ((!main || !rail || !railItems.length) && !staticCards.length) return;

    if (!head) {
      head = document.createElement('div');
      head.className = 'case-showcase__head';
      root.prepend(head);
    }

    if (head) {
      head.innerHTML = `
        <div class="section-header k-header">
          <div class="k-header__box">
            <h2 class="k-title">Наши <span class="k-title__mark">кейсы</span></h2>
            <p class="k-subtitle">Показываем по-честному: что произошло, какую работу провели и какой результат получили.</p>
          </div>
        </div>
      `;
    }

    const cases = railItems.length ? railItems.map((item, index) => ({
      index,
      title: String(item.dataset.title || item.querySelector('strong')?.textContent || '').trim(),
      lead: String(item.dataset.lead || '').trim(),
      result: String(item.dataset.result || caseResults[index % caseResults.length]).trim(),
      tags: splitList(item.dataset.tags),
      docs: normalizeDocsList(splitList(item.dataset.docs)),
      duration: String(item.dataset.duration || caseDurations[index % caseDurations.length]).trim(),
    })) : staticCards.map((item) => ({ ...item, docs: normalizeDocsList(item.docs) }));

    let activeIndex = 0;
    let physicalIndex = 0;
    let autoplayTimer = null;
    let scrollSettleTimer = null;
    let isAnimating = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cloneCount = cases.length;

    root.querySelector('.section-container')?.remove();
    if (main) main.innerHTML = '';
    if (rail) rail.innerHTML = '';

    const layout = root.querySelector('.case-showcase__layout') || document.createElement('div');
    layout.className = 'case-showcase__layout';
    if (!layout.parentNode) root.appendChild(layout);
    layout.innerHTML = '';

    const viewport = document.createElement('div');
    viewport.className = 'case-showcase__viewport';
    const track = document.createElement('div');
    track.className = 'case-showcase__track';
    viewport.appendChild(track);

    const nav = document.createElement('div');
    nav.className = 'case-showcase__nav';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'case-showcase__arrow case-showcase__arrow--prev';
    prevBtn.setAttribute('aria-label', 'Предыдущий кейс');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
    const dots = document.createElement('div');
    dots.className = 'case-showcase__dots';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'case-showcase__arrow case-showcase__arrow--next';
    nextBtn.setAttribute('aria-label', 'Следующий кейс');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
    const hint = document.createElement('p');
    hint.className = 'case-showcase__hint';
    hint.textContent = 'Свайпните →';
    nav.append(prevBtn, dots, nextBtn);
    layout.append(viewport, nav, hint);

    const createCard = (data, realIndex, cloneRole = 'real') => {
      const card = document.createElement('article');
      const docs = normalizeDocsList(data.docs && data.docs.length ? data.docs : defaultDocs);
      card.className = `case-showcase__card${realIndex === 0 && cloneRole === 'real' ? ' is-active' : ''}`;
      card.dataset.caseIndex = String(realIndex);
      card.dataset.cloneRole = cloneRole;
      card.innerHTML = `
        <div class="case-showcase__card-top">
          <div class="case-showcase__intro">
            <h3 class="case-showcase__title">${escapeHtml(data.title)}</h3>
            <p class="case-showcase__lead">${escapeHtml(data.lead)}</p>
          </div>
          <aside class="case-showcase__facts">
            <div class="case-showcase__facts-title">Результат дела</div>
            <strong class="case-showcase__facts-value">${escapeHtml(data.result)}</strong>
            <div class="case-showcase__facts-caption">${escapeHtml(getResultCaption())}</div>
            <div class="case-showcase__facts-rows">
              <div class="case-showcase__fact"><span>Срок возврата</span><strong>${escapeHtml(data.duration)}</strong></div>
              <div class="case-showcase__fact"><span>Статус дела</span><strong class="is-success">${escapeHtml(data.status || 'Завершено')}</strong></div>
            </div>
          </aside>
        </div>
        <div class="case-showcase__path" aria-label="Путь дела">
          ${docs.map((doc) => {
            const image = pickDocImage(getDocPoolKey(doc), realIndex);
            return `
              <div class="case-showcase__step">
                <div class="case-doc case-doc--image" tabindex="0">
                  <div class="case-doc__stack"><img class="case-doc__image loaded" src="${image}" alt="${escapeHtml(doc)}" loading="lazy" decoding="async"></div>
                </div>
                <h4 class="case-doc-title">${escapeHtml(doc)}</h4>
              </div>
            `;
          }).join('')}
        </div>
      `;
      return card;
    };

    const beforeClones = cases.map((item, index) => createCard(item, index, 'before'));
    const realCards = cases.map((item, index) => createCard(item, index, 'real'));
    const afterClones = cases.map((item, index) => createCard(item, index, 'after'));
    track.append(...beforeClones, ...realCards, ...afterClones);
    const slides = Array.from(track.querySelectorAll('.case-showcase__card'));

    const setViewportSnap = (value) => {
      viewport.style.setProperty('scroll-snap-type', value, 'important');
    };
    const getCenteredScrollLeft = (slide) => (
      slide.offsetLeft - ((viewport.clientWidth - slide.offsetWidth) / 2)
    );
    const scrollToPhysical = (nextPhysicalIndex, behavior = 'smooth') => {
      const slide = slides[nextPhysicalIndex];
      if (!slide) return;
      viewport.scrollTo({ left: getCenteredScrollLeft(slide), behavior });
    };
    const setMovingState = (value) => {
      root.classList.toggle('is-moving', value);
      viewport.classList.toggle('is-moving', value);
      track.classList.toggle('is-moving', value);
    };
    const updateActiveState = (realIndex) => {
      activeIndex = ((realIndex % cases.length) + cases.length) % cases.length;
      slides.forEach((slide) => {
        slide.classList.toggle('is-active', Number(slide.dataset.caseIndex) === activeIndex && slide.dataset.cloneRole === 'real');
      });
      Array.from(dots.children).forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
      });
    };
    const rebaseIfNeeded = () => {
      if (physicalIndex < cloneCount) {
        physicalIndex += cloneCount;
        scrollToPhysical(physicalIndex, 'auto');
      } else if (physicalIndex >= cloneCount + cases.length) {
        physicalIndex -= cloneCount;
        scrollToPhysical(physicalIndex, 'auto');
      }
    };
    const finishScroll = () => {
      isAnimating = false;
      setMovingState(false);
      setViewportSnap('x mandatory');
      rebaseIfNeeded();
      updateActiveState(Number(slides[physicalIndex]?.dataset.caseIndex || 0));
    };
    const animateToPhysical = (nextPhysicalIndex) => {
      if (isAnimating) return;
      physicalIndex = nextPhysicalIndex;
      updateActiveState(Number(slides[physicalIndex]?.dataset.caseIndex || 0));
      if (reduceMotion) {
        scrollToPhysical(physicalIndex, 'auto');
        finishScroll();
        return;
      }
      isAnimating = true;
      setMovingState(true);
      setViewportSnap('none');
      scrollToPhysical(physicalIndex, 'smooth');
      window.setTimeout(finishScroll, TRANSITION_MS);
    };
    const goTo = (nextIndex) => {
      const normalized = ((nextIndex % cases.length) + cases.length) % cases.length;
      const currentReal = Number(slides[physicalIndex]?.dataset.caseIndex || 0);
      let delta = normalized - currentReal;
      if (delta > cases.length / 2) delta -= cases.length;
      if (delta < -cases.length / 2) delta += cases.length;
      animateToPhysical(physicalIndex + delta);
    };

    const stopAutoplay = () => {
      if (!autoplayTimer) return;
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const startAutoplay = () => {
      stopAutoplay();
      if (reduceMotion || cases.length < 2) return;
      autoplayTimer = setInterval(() => goTo(activeIndex + 1), AUTO_DELAY);
    };

    cases.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `case-showcase__dot${index === 0 ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Показать кейс ${index + 1}`);
      dot.addEventListener('click', () => {
        goTo(index);
        startAutoplay();
      });
      dots.appendChild(dot);
    });

    const bindArrow = (button, delta) => {
      const trigger = () => {
        if (isAnimating) return;
        animateToPhysical(physicalIndex + delta);
        startAutoplay();
      };
      button.addEventListener('click', trigger);
    };
    bindArrow(prevBtn, -1);
    bindArrow(nextBtn, 1);

    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeStartPhysical = 0;
    let isSwipeTracking = false;

    const onSwipe = (dx, dy) => {
      if (isAnimating) return;
      if (Math.abs(dx) < 28) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
      const step = dx < 0 ? 1 : -1;
      const baseIndex = swipeStartPhysical;
      if (slides[baseIndex]) {
        scrollToPhysical(baseIndex, 'auto');
      }
      animateToPhysical(baseIndex + step);
      startAutoplay();
    };

    viewport.addEventListener('pointerdown', (event) => {
      if (isAnimating) return;
      if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') return;
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
      swipeStartPhysical = physicalIndex;
      isSwipeTracking = true;
      clearTimeout(scrollSettleTimer);
    }, { passive: true });

    const onPointerUp = (event) => {
      if (!isSwipeTracking) return;
      isSwipeTracking = false;
      const dx = event.clientX - swipeStartX;
      const dy = event.clientY - swipeStartY;
      onSwipe(dx, dy);
    };
    viewport.addEventListener('pointerup', onPointerUp, { passive: true });
    viewport.addEventListener('pointercancel', () => {
      isSwipeTracking = false;
    }, { passive: true });

    viewport.addEventListener('scroll', () => {
      if (isAnimating) return;
      setMovingState(true);
      clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(() => {
        let nearestIndex = physicalIndex;
        let nearestDistance = Infinity;
        const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
        slides.forEach((slide, index) => {
          const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(slideCenter - viewportCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        physicalIndex = nearestIndex;
        rebaseIfNeeded();
        updateActiveState(Number(slides[physicalIndex]?.dataset.caseIndex || 0));
        setMovingState(false);
      }, 90);
    }, { passive: true });

    track.addEventListener('click', (event) => {
      const doc = event.target.closest && event.target.closest('.case-doc');
      if (!doc || !track.contains(doc)) return;
      const alreadyZoomed = doc.classList.contains('is-zoomed');
      track.querySelectorAll('.case-doc.is-zoomed').forEach((item) => item.classList.remove('is-zoomed'));
      if (!alreadyZoomed) doc.classList.add('is-zoomed');
    });
    track.addEventListener('pointerout', (event) => {
      const doc = event.target.closest && event.target.closest('.case-doc');
      if (!doc || doc.contains(event.relatedTarget)) return;
      doc.classList.remove('is-zoomed');
    });

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);
    window.addEventListener('pagehide', stopAutoplay, { once: true });
    onResizeRaf(() => {
      scrollToPhysical(physicalIndex, 'auto');
      return 1;
    });

    activeIndex = 0;
    physicalIndex = cloneCount;
    scrollToPhysical(physicalIndex, 'auto');
    updateActiveState(0);
    requestAnimationFrame(() => scrollToPhysical(physicalIndex, 'auto'));
    startAutoplay();
    root.dataset.caseShowcaseReady = 'true';
  });
}

const __kgRafScheduler = createRafScheduler();

function onScrollRaf(callback, options) {
  return __kgRafScheduler.onScroll(callback, options);
}

function onResizeRaf(callback, options) {
  return __kgRafScheduler.onResize(callback, options);
}

function observeScrollSource(target) {
  __kgRafScheduler.observeScrollSource(target);
}

function initAnchorSmoothScroll() {
  if (!guardInit('anchor-smooth-scroll')) return;

  const supportsSmoothScroll = !!(window.CSS && CSS.supports && CSS.supports('scroll-behavior', 'smooth'));
  if (!supportsSmoothScroll) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href*="#"]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    let targetUrl;
    try {
      targetUrl = new URL(href, window.location.href);
    } catch (err) {
      return;
    }

    const current = new URL(window.location.href);
    if (targetUrl.origin !== current.origin || targetUrl.pathname !== current.pathname) return;
    if (!targetUrl.hash || targetUrl.hash === '#') return;

    const targetId = decodeURIComponent(targetUrl.hash.slice(1));
    if (!targetId) return;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    event.preventDefault();
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.history && typeof window.history.pushState === 'function') {
      window.history.pushState(null, '', targetUrl.hash);
    }
  }, { capture: true });
}

function isPrivacyPage() {
  const body = document.body;
  return (
    body?.classList.contains('page-privacy') ||
    (body?.dataset && body.dataset.page === 'privacy-policy')
  );
}

function isCookiesPage() {
  const path = window.location.pathname || '';
  return path === '/cookies/' || path === '/cookies/index.html';
}

const PRIVACY_BACK_URL_KEY = 'keis_privacy_back_url';
const PRIVACY_BACK_SCROLL_KEY = 'keis_privacy_back_scroll';
const THANKS_RETURN_URL_KEY = 'thanksReturnUrl';
const THANKS_RETURN_HASH_KEY = 'thanksReturnHash';
const THANKS_RETURN_SCROLL_KEY = 'thanksReturnScrollY';
const THANKS_RETURN_MARKER = 'thanksReturn';

function readCurrentPageScrollY() {
  const bodyTop = parseFloat(document.body.style.top || '0');
  if (document.body.style.position === 'fixed' && Number.isFinite(bodyTop) && bodyTop !== 0) {
    return Math.max(0, Math.round(-bodyTop));
  }

  return Math.max(
    0,
    Math.round(
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    )
  );
}

function saveThanksReturnState() {
  try {
    sessionStorage.setItem(THANKS_RETURN_URL_KEY, window.location.pathname + window.location.search);
    sessionStorage.setItem(THANKS_RETURN_HASH_KEY, window.location.hash || '');
    sessionStorage.setItem(THANKS_RETURN_SCROLL_KEY, String(readCurrentPageScrollY()));
  } catch (e) {
    if (isDev()) console.warn('[thanksReturn] save failed', e);
  }
}

function clearThanksReturnState() {
  try {
    sessionStorage.removeItem(THANKS_RETURN_URL_KEY);
    sessionStorage.removeItem(THANKS_RETURN_HASH_KEY);
    sessionStorage.removeItem(THANKS_RETURN_SCROLL_KEY);
  } catch (e) {
    if (isDev()) console.warn('[thanksReturn] cleanup failed', e);
  }
}

function finishThanksReturnRestore() {
  document.documentElement.classList.remove('is-restoring-scroll');
}

function removeThanksReturnMarker() {
  const url = new URL(window.location.href);
  url.searchParams.delete(THANKS_RETURN_MARKER);

  if (window.history && typeof window.history.replaceState === 'function') {
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
}

function restoreThanksReturnScrollIfNeeded() {
  if (window.__DISABLE_THANKS_RETURN_RESTORE__) {
    finishThanksReturnRestore();
    try {
      removeThanksReturnMarker();
      clearThanksReturnState();
    } catch (e) {}
    return;
  }

  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get(THANKS_RETURN_MARKER) !== '1') {
      finishThanksReturnRestore();
      return;
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    const savedUrlRaw = sessionStorage.getItem(THANKS_RETURN_URL_KEY) || '';
    const savedScrollRaw = sessionStorage.getItem(THANKS_RETURN_SCROLL_KEY) || '';
    const savedScrollY = Number.parseInt(savedScrollRaw, 10);

    if (savedUrlRaw) {
      const savedUrl = new URL(savedUrlRaw, window.location.origin);
      const cleanCurrentUrl = new URL(window.location.href);
      cleanCurrentUrl.searchParams.delete(THANKS_RETURN_MARKER);
      if (
        savedUrl.origin !== window.location.origin ||
        savedUrl.pathname !== cleanCurrentUrl.pathname ||
        savedUrl.search !== cleanCurrentUrl.search
      ) {
        clearThanksReturnState();
        removeThanksReturnMarker();
        finishThanksReturnRestore();
        return;
      }
    }

    if (!Number.isFinite(savedScrollY)) {
      clearThanksReturnState();
      removeThanksReturnMarker();
      finishThanksReturnRestore();
      return;
    }

    const targetY = Math.max(0, Math.round(savedScrollY));
    const rootStyle = document.documentElement.style;
    const bodyStyle = document.body ? document.body.style : null;
    const prevRootScrollBehavior = rootStyle.scrollBehavior;
    const prevBodyScrollBehavior = bodyStyle ? bodyStyle.scrollBehavior : '';
    rootStyle.scrollBehavior = 'auto';
    if (bodyStyle) bodyStyle.scrollBehavior = 'auto';

    const jump = () => {
      window.scrollTo(0, targetY);
    };
    const finish = () => {
      jump();
      finishThanksReturnRestore();
      removeThanksReturnMarker();
      clearThanksReturnState();
      rootStyle.scrollBehavior = prevRootScrollBehavior;
      if (bodyStyle) bodyStyle.scrollBehavior = prevBodyScrollBehavior;
    };

    jump();
    requestAnimationFrame(() => {
      jump();
      setTimeout(() => {
        jump();
        setTimeout(finish, 80);
      }, 0);
    });
  } catch (e) {
    clearThanksReturnState();
    try {
      removeThanksReturnMarker();
    } catch (_) {}
    finishThanksReturnRestore();
    if (isDev()) console.warn('[thanksReturn] restore failed', e);
  }
}

function savePrivacyBackState() {
  try {
    const currentUrl = window.location.href;
    const y = Math.round(window.scrollY || window.pageYOffset || 0);
    sessionStorage.setItem(PRIVACY_BACK_URL_KEY, currentUrl);
    sessionStorage.setItem(PRIVACY_BACK_SCROLL_KEY, String(y));
  } catch (e) {
    if (isDev()) console.warn('[privacyBack] save failed', e);
  }
}

function consumePrivacyBackStateIfSamePage() {
  try {
    const storedUrl = sessionStorage.getItem(PRIVACY_BACK_URL_KEY);
    if (!storedUrl) return;
    const storedScrollRaw = sessionStorage.getItem(PRIVACY_BACK_SCROLL_KEY) || '0';
    const stored = new URL(storedUrl, window.location.href);
    const current = new URL(window.location.href);
    const normalizePath = (p) => {
      if (!p) return '/';
      const trimmed = p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;
      return trimmed || '/';
    };
    const samePath = normalizePath(current.pathname) === normalizePath(stored.pathname);
    if (!samePath) return;
    const targetY = parseInt(storedScrollRaw, 10) || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'auto' });
    });
    sessionStorage.removeItem(PRIVACY_BACK_URL_KEY);
    sessionStorage.removeItem(PRIVACY_BACK_SCROLL_KEY);
  } catch (e) {
    if (isDev()) console.warn('[privacyBack] restore failed', e);
  }
}

function ensurePrivacySmoothScroll() {
  if (!isPrivacyPage()) return;
  try {
    const apply = () => {
      const header = document.querySelector('header');
      const measured = header ? Math.round(header.offsetHeight || header.getBoundingClientRect().height || 0) : 0;
      const headerHeight = measured > 0 ? measured : 84;
      document.documentElement.style.scrollPaddingTop = `${headerHeight + 16}px`;
    };
    const scheduleApply = createRafThrottle(apply);
    apply();
    window.addEventListener('resize', scheduleApply, { passive: true });
    window.addEventListener('orientationchange', scheduleApply, { passive: true });
  } catch (e) {
    if (isDev()) console.warn('[privacyScroll] smooth behavior apply failed', e);
  }
}

function initPrivacyBackButton() {
  if (!guardInit('privacy-back-button')) return;

  const backBtn = document.querySelector('[data-privacy-back]');
  if (!backBtn) return;

  backBtn.addEventListener('click', (event) => {
    event.preventDefault();
    let prev = null;

    try {
      prev = sessionStorage.getItem(PRIVACY_BACK_URL_KEY);
    } catch (e) {
      if (isDev()) console.warn('[privacyBack] read prev url failed', e);
    }

    if (prev) {
      window.location.href = prev;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/';
  });
}

function initNewsBackButton() {
  if (!guardInit('news-back-button')) return;

  const backBtn = document.querySelector('[data-news-back]');
  if (!backBtn) return;

  backBtn.addEventListener('click', (event) => {
    const ref = document.referrer;
    if (!ref) return;

    try {
      const refUrl = new URL(ref);
      if (refUrl.origin === window.location.origin) {
        event.preventDefault();
        window.history.back();
      }
    } catch (e) {
      if (isDev()) console.warn('[newsBack] invalid referrer url', e);
    }
  });
}

function initConsentScrollMemory() {
  if (!guardInit('consent-scroll-memory')) return;

  const consentSelectors = [
    'a.form-consent__link[href*="privacy-policy"]',
    '.form-consent a[href*="privacy-policy"]',
    'a.legal-link[href*="privacy-policy"]'
  ];

  const consentLinks = document.querySelectorAll(consentSelectors.join(','));
  consentLinks.forEach((link) => {
    link.addEventListener(
      'click',
      () => {
        savePrivacyBackState();
      },
      { capture: true }
    );
  });

  const restoreHandler = () => consumePrivacyBackStateIfSamePage();
  restoreHandler();
  window.addEventListener('pageshow', restoreHandler, { passive: true });
}

function initPrivacyScrollTopButton() {
  if (!guardInit('privacy-scroll-top')) return;

  const button = document.querySelector('[data-scroll-top]');
  if (!button) return;

  const scrollRoots = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    document.querySelector('.privacy-main'),
    document.querySelector('.privacy-hero')
  ].filter(Boolean);

  const getScrollTop = () => {
    let top = Math.round(window.scrollY || window.pageYOffset || 0);
    for (const root of scrollRoots) {
      top = Math.max(top, Math.round(root.scrollTop || 0));
    }
    return top;
  };

  const isMobileViewport = () => window.matchMedia('(max-width: 980px)').matches;
  const updateVisibility = () => {
    const threshold = isMobileViewport() ? 24 : 80;
    if (getScrollTop() > threshold) {
      button.classList.add('privacy-scroll-top--visible');
      return;
    }
    button.classList.remove('privacy-scroll-top--visible');
  };
  const scheduleVisibility = createRafThrottle(updateVisibility);

  updateVisibility();

  onScrollRaf(() => {
    updateVisibility();
    return 1;
  }, { minDelta: 1 });
  observeScrollSource(window);
  observeScrollSource(document);
  scrollRoots.forEach(observeScrollSource);
  onResizeRaf(() => {
    updateVisibility();
    return 1;
  });

  window.addEventListener('pageshow', scheduleVisibility, { passive: true });

  let scrollTopAnimRaf = null;
  const scrollToTop = () => {
    const start = getScrollTop();
    if (start <= 0) return;

    if (scrollTopAnimRaf) {
      cancelAnimationFrame(scrollTopAnimRaf);
      scrollTopAnimRaf = null;
    }

    const durationMs = 210;
    const startAt = performance.now();

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    const applyTop = (value) => {
      window.scrollTo(0, value);
      for (const root of scrollRoots) {
        root.scrollTop = value;
      }
    };

    const frame = (now) => {
      const progress = Math.min(1, (now - startAt) / durationMs);
      const eased = easeOutQuint(progress);
      const nextTop = Math.max(0, Math.round(start * (1 - eased)));
      applyTop(nextTop);

      if (progress < 1) {
        scrollTopAnimRaf = requestAnimationFrame(frame);
        return;
      }

      applyTop(0);
      scrollTopAnimRaf = null;
      scheduleVisibility();
    };

    // Immediate first step to avoid any perceived click delay.
    frame(startAt);
    scrollTopAnimRaf = requestAnimationFrame(frame);
  };

  button.addEventListener('click', scrollToTop);
}

function initPrivacyMobileCTA() {
  if (!guardInit('privacy-mobile-cta')) return;
  if (!isPrivacyPage() && !isCookiesPage()) return;

  const heroButtons = Array.from(document.querySelectorAll('.hero-form--modal .btn-primary'));
  const headerButton = document.querySelector('.keis-header-mobile-cta');
  if (!heroButtons.length && !headerButton) return;

  const heroDesktopLabel = 'Получить консультацию';
  const headerDesktopLabel = 'Консультация';
  const mobileLabel = 'Записаться';
  const media = window.matchMedia('(max-width: 980px)');

  const updateLabels = () => {
    const isMobile = media.matches;

    if (heroButtons.length) {
      const heroText = isMobile ? mobileLabel : heroDesktopLabel;
      heroButtons.forEach((button) => {
        if (button.textContent !== heroText) {
          button.textContent = heroText;
        }
      });
    }

    if (headerButton) {
      const headerText = isMobile ? mobileLabel : headerDesktopLabel;
      if (headerButton.textContent !== headerText) {
        headerButton.textContent = headerText;
      }
    }
  };

  updateLabels();

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', updateLabels);
  } else if (typeof media.addListener === 'function') {
    media.addListener(updateLabels);
  }
}

function initSmartLazyMedia() {
  if (!guardInit('smart-lazy-media')) return;

  const firstSection = document.querySelector('body > section:first-of-type, main section:first-of-type');
  const shouldSkip = (el) => {
    if (!el || !(el instanceof Element)) return true;
    if (el.hasAttribute('data-no-lazy')) return true;
    if (el.closest('.keis-header, .hero-investment, .hero-photo, .kg-news__hero, .kxchat-widget, .keis-modal, .keis-success-modal, #contactModal, #successModal')) return true;
    if (firstSection && firstSection.contains(el)) return true;
    return false;
  };

  document.querySelectorAll('img').forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (shouldSkip(img)) return;
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'low');
  });

  document.querySelectorAll('iframe').forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement)) return;
    if (shouldSkip(frame)) return;
    if (!frame.hasAttribute('loading')) frame.setAttribute('loading', 'lazy');
  });
}

function initFlagsDataCols() {
  if (!guardInit('kf-flags-cols')) return;

  const sections = Array.from(document.querySelectorAll('.kf-flags'));
  if (!sections.length) return;

  const fallbackCols = () => {
    if (window.innerWidth >= 1200) return 3;
    if (window.innerWidth >= 981) return 2;
    return 1;
  };

  const measureFirstRow = (section) => {
    const cards = Array.from(section.querySelectorAll('.kf-flag-card, .kf-flag'));
    if (!cards.length) return null;
    const firstRowTop = cards[0].offsetTop;
    const colsInFirstRow = cards.filter((card) => card.offsetTop === firstRowTop).length;
    return colsInFirstRow || null;
  };

  const apply = () => {
    sections.forEach((section) => {
      const measured = measureFirstRow(section);
      const cols = measured || fallbackCols();
      const safeCols = Math.max(1, Math.min(3, cols));
      section.setAttribute('data-cols', String(safeCols));
    });
  };

  let resizeRaf = null;
  const schedule = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      apply();
    });
  };

  apply();
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
}

function initFlagsReveal() {
  if (!guardInit('kf-flags-reveal')) return;

  const sections = Array.from(document.querySelectorAll('.kf-flags'));
  if (!sections.length) return;

  const pageKey = document.body && document.body.dataset ? document.body.dataset.page : '';
  const isMedical = pageKey === 'medical-malpractice';
  const allowReveal = (section) => {
    if (isMedical) return false;
    if (section.dataset && section.dataset.reveal === '0') return false;
    return true;
  };

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetSections = sections.filter(allowReveal);
  if (!targetSections.length) return;

  targetSections.forEach((section) => section.classList.add('kf-reveal-ready'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targetSections.forEach((section) => section.classList.add('is-revealed'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      io.unobserve(entry.target);
    });
  }, {
    threshold: 0.35,
    rootMargin: '0px 0px -10% 0px',
  });

  targetSections.forEach((section) => io.observe(section));
}

/** На страницах кроме /zpp/ и /scam/ карточки «Сигналы нарушений» открывают целевое действие (консультацию), без ложного клика в #. */
function initFlagsCardClickDisable() {
  if (!guardInit('kf-flags-card-click-disable')) return;
  const path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
  if (path === '/zpp' || path === '/scam') return;
  document.querySelectorAll('.kf-flags a.kf-flag-card, .kf-flags a.kf-flag').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.__keisOpenContactModal === 'function') {
        window.__keisOpenContactModal();
        return;
      }
      const fallbackTarget = document.getElementById('consult') || document.querySelector('[data-open-contact-modal]');
      if (fallbackTarget && typeof fallbackTarget.scrollIntoView === 'function') {
        fallbackTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initKgxB4AssetPaths() {
  const items = document.querySelectorAll('.kgx-b4__item');
  items.forEach((item, idx) => {
    const icon = item.querySelector('.kgx-b4__icon');
    if (!icon) return;
    const n = (idx % 6) + 1;
    const src = getAssetPath('assets/icons/s' + n + '.webp');
    let img = icon.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      icon.appendChild(img);
    }
    img.src = src;
  });
}

function initKgxB4Reveal() {
  if (!guardInit('kgx-b4-reveal')) return;

  initKgxB4AssetPaths();

  const sections = Array.from(document.querySelectorAll('.kgx-b4'));
  if (!sections.length) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sections.forEach((section) => {
    section.style.setProperty('--kgx-b4-parallax-y', '0px');
    section.style.removeProperty('--kgx-b4-parallax-max');
  });

  if (!('IntersectionObserver' in window) || reduceMotion) {
    sections.forEach((section) => section.classList.add('kgx-b4-reveal-ready', 'is-revealed'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('kgx-b4-reveal-ready');
        requestAnimationFrame(() => entry.target.classList.add('is-revealed'));
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.28,
      rootMargin: '0px 0px -8% 0px',
    });

    sections.forEach((section) => io.observe(section));
  }
}

/* keis-ticker removed: canonical items and population logic deleted */

// No-op placeholder for legacy initTicker() (keeps existing init flow stable)
function initTicker() {
  // intentionally left blank per user request
}

// Injects a lightweight running stripe ticker into the orange stripe area
function initStripeTicker() {
  if (!guardInit('stripe-ticker')) return;
  try {
    const path = window.location.pathname || '';
    const isConsumer = path.includes('/zpp/');
    const isFraud = path.includes('/scam/');
    // only on the requested sections
    if (!isConsumer && !isFraud) return;

    const firstSection = document.querySelector('body > section:first-of-type');
    if (!firstSection) return;
    if (firstSection.querySelector('.kg-stripe-ticker')) return; // already added

    const items = [
      'Узкопрофильные специалисты',
      'Представление интересов до реального результата',
      'Оплата за честный результат',
      'Знание различных схем и способов достижений поставленных целей',
      'Юрист на связи всегда',
      'Быстрая подготовка и подача первичных документов',
      'Более 30 лет опыта имеет каждый юрист компании',
      'Гибкие условия оплаты'
    ];

    const ticker = document.createElement('div');
    ticker.className = 'kg-stripe-ticker';
    ticker.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'kg-stripe-track';
    // SSOT: stripe movement is driven by JS rAF only.
    track.style.animation = 'none';
    track.style.webkitAnimation = 'none';
    track.style.animationPlayState = 'paused';

    // build a long sequence by repeating the items several times (improves smooth loop)
    for (let r = 0; r < 10; r++) {
      items.forEach((txt, idx) => {
        const span = document.createElement('span');
        span.className = 'kg-stripe-item';
        span.textContent = txt;
        track.appendChild(span);

        // add separator except after last item of the sequence
        const sep = document.createElement('span');
        // use an unusual name for the separator to avoid conflicts
        sep.className = 'kg-onyx-sigil';
        track.appendChild(sep);
      });
    }

    // duplicate the track contents to enable a seamless loop (content duplicated once)
    track.innerHTML += track.innerHTML;

    ticker.appendChild(track);
    // ensure the ticker is a child so absolute positioning sits over the stripe
    firstSection.appendChild(ticker);

    // Replace CSS animation with requestAnimationFrame driven animation for pixel-perfect smoothness
    let rafId = null;
    let lastTime = null;
    let offset = 0;
    let contentWidth = 0; // full scrollWidth
    let loopWidth = 0; // half of contentWidth (since duplicated)
    let pxPerSec = 100; // default fallback

    const recalc = () => {
      contentWidth = track.scrollWidth || 0;
      loopWidth = contentWidth / 2 || contentWidth;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
      // base duration between 12s and 36s for one loop (loopWidth distance) — use floats for smoothness
      let baseDuration = (loopWidth / viewportWidth) * 18 || 18;
      baseDuration = Math.max(12, Math.min(36, baseDuration));
      const speedFactor = (isConsumer || isFraud) ? 6.0 : 1.0;
      let duration = baseDuration * speedFactor;
      duration = Math.min(240, duration);
      // px to move per second = loopWidth / duration (duration in seconds)
      pxPerSec = (loopWidth > 0) ? (loopWidth / duration) : 100;
      // defensive reset of offset to stay in valid range
      if (loopWidth > 0) offset = offset % loopWidth;
    };

    const step = (ts) => {
      if (lastTime === null) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      offset += pxPerSec * dt;
      if (loopWidth > 0 && offset >= loopWidth) offset %= loopWidth;
      // apply transform using fractional pixels for subpixel-smooth movement
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      rafId = requestAnimationFrame(step);
    };

    const start = () => {
      cancel();
      recalc();
      lastTime = null;
      rafId = requestAnimationFrame(step);
    };

    const cancel = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Start the ticker only when it is visible (IO) and when the page is visible.
    // This avoids continuous rAF when the ticker is offscreen and reduces paint churn.
    let isIntersecting = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== ticker) return;
        isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0;
        if (isIntersecting && !document.hidden) {
          start();
          if (isDev()) console.log('[stripeTicker] started');
        } else {
          cancel();
          if (isDev()) console.log('[stripeTicker] paused');
        }
      });
    }, { root: null, threshold: 0 });

    // Observe ticker visibility and compute metrics once now
    try { recalc(); } catch (e) {}
    io.observe(ticker);

    const scheduleRecalc = createRafThrottle(recalc);
    window.addEventListener('resize', scheduleRecalc, { passive: true });
    window.addEventListener('orientationchange', scheduleRecalc, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancel();
        if (isDev()) console.log('[stripeTicker] paused');
      } else {
        // resume only if currently intersecting the viewport
        if (isIntersecting) {
          start();
          if (isDev()) console.log('[stripeTicker] resumed');
        }
      }
    });
  } catch (e) {
    // silent fail to avoid breaking page
    console.warn('initStripeTicker error', e);
  }
}

const HERO_HAND_LAYER_DATA_KEY = '__keisHeroHandLayer';

function ensureHandLayer(container) {
  if (!container || !(container instanceof Element)) return null;
  container.classList.add('hero-hand-layer-container');
  const existing = container[HERO_HAND_LAYER_DATA_KEY];
  if (existing && existing.isConnected) return existing;
  const layer = document.createElement('div');
  layer.className = 'hero-hand-layer';
  layer.setAttribute('aria-hidden', 'true');
  container.appendChild(layer);
  container[HERO_HAND_LAYER_DATA_KEY] = layer;
  return layer;
}

function ensureHandTarget(button) {
  if (!button || !(button instanceof Element)) return null;
  button.classList.add('hero-hand-target');
  return button;
}

// Legacy hand hint + ripple logic (kept intact)
const animateButtonPress = async (btn) => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  if (!btn) return;
  btn.classList.add('is-pressing');
  await sleep(200);
  btn.classList.remove('is-pressing');
  await sleep(100);
};

const triggerBlockFiveLight = (btn, x, y) => {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const container = btn.closest('form');
  const containerRect = container ? container.getBoundingClientRect() : null;
  const fallbackX = rect.width ? rect.width * 0.62 : 0;
  const fallbackY = rect.height ? rect.height * 0.56 : 0;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  let fx = fallbackX;
  let fy = fallbackY;

  if (typeof x === 'number' && typeof y === 'number') {
    if (containerRect) {
      fx = x - (rect.left - containerRect.left);
      fy = y - (rect.top - containerRect.top);
    } else {
      fx = x;
      fy = y;
    }
  }

  fx = clamp(fx, 6, Math.max(rect.width - 6, 6));
  fy = clamp(fy, 6, Math.max(rect.height - 6, 6));
  btn.classList.remove('kg-block5-light');
  void btn.offsetWidth;
  btn.style.setProperty('--hand-light-x', `${Math.round(fx)}px`);
  btn.style.setProperty('--hand-light-y', `${Math.round(fy)}px`);
  btn.classList.add('kg-block5-light');
};

function initHeroFormHandClickHint() {
  if (window.__heroHandHintController) return window.__heroHandHintController;

  let heroForm = document.querySelector('.hero-investment .hero-form') ||
    document.querySelector('section:first-of-type .hero-form') ||
    document.querySelector('.hero-form');
  if (!heroForm) return null;
  ensureHandLayer(heroForm);

  const buttonSelector = 'button[type="submit"], .btn-primary, [data-b4-submit], .faq-ask-btn';
  let heroButton = heroForm.querySelector(buttonSelector);
  if (!heroButton) return null;

  const ensureRipples = (btn) => {
    if (!btn) return;
    if (!btn.querySelector('.hero-hand-ripple--large')) {
      const large = document.createElement('span');
      large.className = 'hero-hand-ripple hero-hand-ripple--large';
      large.setAttribute('aria-hidden', 'true');
      btn.appendChild(large);
    }
    if (!btn.querySelector('.hero-hand-ripple--small')) {
      const small = document.createElement('span');
      small.className = 'hero-hand-ripple hero-hand-ripple--small';
      small.setAttribute('aria-hidden', 'true');
      btn.appendChild(small);
    }
  };

  ensureRipples(heroButton);

  const normalizePlayArgs = (btnOrOptions, opts = {}) => {
    const isElement = typeof Element !== 'undefined' && btnOrOptions instanceof Element;
    if (btnOrOptions && typeof btnOrOptions === 'object' && !isElement) {
      return btnOrOptions;
    }
    return { button: btnOrOptions, ...opts };
  };

  const handEl = document.createElement('div');
  handEl.className = 'hero-hand-hint hero-hand-hint--fixed';
  handEl.setAttribute('aria-hidden', 'true');

  const handImg = document.createElement('img');
  handImg.src = getAssetPath('assets/icons/hand_s.webp');
  handImg.alt = '';
  handEl.appendChild(handImg);

  document.body.appendChild(handEl);

  const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const moveDuration = prefersReducedMotion ? 0 : 520;
  const tapDuration = prefersReducedMotion ? 0 : 190;
  const fadeDuration = prefersReducedMotion ? 140 : 320;

  const state = { timeouts: [], activeButton: null };

  const clearTimers = () => {
    state.timeouts.forEach((id) => clearTimeout(id));
    state.timeouts.length = 0;
    if (state.activeButton) {
      state.activeButton.classList.remove('is-pressed');
      state.activeButton.classList.remove('hero-hand-press');
      state.activeButton = null;
    }
  };

  const schedule = (cb, delay) => {
    const id = window.setTimeout(() => {
      state.timeouts = state.timeouts.filter((storedId) => storedId !== id);
      cb();
    }, delay);
    state.timeouts.push(id);
    return id;
  };

  const resolveButton = () => {
    if (heroButton && heroButton.isConnected) {
      ensureRipples(heroButton);
      return heroButton;
    }
    heroButton = heroForm.querySelector(buttonSelector);
    ensureRipples(heroButton);
    return heroButton;
  };

  const play = (targetBtnOrOptions, opts = {}) => new Promise((resolve) => {
    let settled = false;
    let fallbackId = null;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (fallbackId) window.clearTimeout(fallbackId);
      resolve();
    };
    const playOptions = normalizePlayArgs(targetBtnOrOptions, opts) || {};
    let btn = null;
    if (playOptions && playOptions.button) {
      btn = playOptions.button;
    } else {
      btn = resolveButton();
    }
    if (!btn) {
      resolve();
      return;
    }
    btn = ensureHandTarget(btn) || btn;

    const isModalBtn = !!btn.closest('.hero-form--modal');
    if (isModalBtn) {
      handEl.classList.add('hero-hand-hint--modal');
    } else {
      handEl.classList.remove('hero-hand-hint--modal');
    }

    const targetXPct = typeof playOptions.targetXPct === 'number' ? playOptions.targetXPct : 0.85;
    const targetYPct = typeof playOptions.targetYPct === 'number' ? playOptions.targetYPct : 0.55;
    const visibleOpacity = typeof playOptions.visibleOpacity === 'number' ? playOptions.visibleOpacity : null;
    if (visibleOpacity !== null) {
      handEl.style.setProperty('--hero-hand-opacity', String(visibleOpacity));
    } else {
      handEl.style.removeProperty('--hero-hand-opacity');
    }

    try { ensureRipples(btn); } catch (e) {}

    clearTimers();
    handEl.classList.remove('is-visible');
    handEl.classList.remove('is-tap');
    state.activeButton = null;

    const rect = btn.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      resolve();
      return;
    }

    const originNode = btn.closest('.hero-form-card') || btn.closest('.hero-investment__form') || btn.closest('.hero-form') || btn.closest('form');
    const originRect = originNode ? originNode.getBoundingClientRect() : null;
    const hasOrigin = !!(originRect && originRect.width && originRect.height);
    const useLocalOverlay = !isModalBtn && hasOrigin;
    const overlayTarget = useLocalOverlay ? originNode : document.body;
    if (!overlayTarget) {
      resolve();
      return;
    }

    if (handEl.parentElement !== overlayTarget) {
      handEl.style.position = useLocalOverlay ? 'absolute' : 'fixed';
      handEl.classList.toggle('hero-hand-hint--fixed', !useLocalOverlay);
      overlayTarget.appendChild(handEl);
    } else {
      handEl.style.position = useLocalOverlay ? 'absolute' : 'fixed';
      handEl.classList.toggle('hero-hand-hint--fixed', !useLocalOverlay);
    }

    const HAND_SHIFT_X = 8;
    const FORM_RIGHT_INSET = 18;
    const viewportTargetX = rect.left + rect.width * targetXPct;
    const viewportTargetY = rect.top + rect.height * targetYPct;
    const localTargetX = hasOrigin ? (rect.left - originRect.left + rect.width * targetXPct) : viewportTargetX;
    const localTargetY = hasOrigin ? (rect.top - originRect.top + rect.height * targetYPct) : viewportTargetY;
    const targetX = Math.round((useLocalOverlay ? localTargetX : viewportTargetX) + HAND_SHIFT_X);
    const targetY = Math.round(useLocalOverlay ? localTargetY : viewportTargetY);
    const fallbackStartX = Math.min(window.innerWidth - 12, targetX + 96);
    const startX = Math.round(
      hasOrigin
        ? (useLocalOverlay ? (originRect.width - FORM_RIGHT_INSET + HAND_SHIFT_X) : (originRect.right - FORM_RIGHT_INSET + HAND_SHIFT_X))
        : fallbackStartX
    );
    const startY = Math.round(
      hasOrigin
        ? targetY
        : viewportTargetY
    );

    handEl.style.opacity = '0';
    handEl.classList.add('is-start');

    const prevTransition = handEl.style.transition || '';
    handEl.style.transition = 'none';

    handEl.style.setProperty('--hero-hand-x', `${startX}px`);
    handEl.style.setProperty('--hero-hand-y', `${startY}px`);

    requestAnimationFrame(() => {
      handEl.style.transition = prevTransition || '';
      handEl.classList.add('is-visible');
      handEl.classList.remove('is-start');
      handEl.style.setProperty('--hero-hand-x', `${targetX}px`);
      handEl.style.setProperty('--hero-hand-y', `${targetY}px`);
      handEl.style.opacity = '';
      state.activeButton = btn;

      schedule(() => {
        handEl.classList.add('is-tap');
        btn.classList.add('is-pressed');
        btn.classList.add('hero-hand-press');

        if (typeof playOptions.onTap === 'function') {
          try {
            playOptions.onTap({ button: btn, targetX, targetY });
          } catch (e) {}
        }

        const isModal = !!btn.closest('.hero-form--modal') || !!(btn.closest('form') && btn.closest('form').classList && btn.closest('form').classList.contains('hero-form--modal'));
        if (isModal) {
          try {
            const bRect = btn.getBoundingClientRect();
            const rx = Math.round(bRect.width * 0.85);
            const ry = Math.round(bRect.height * 0.55);
            btn.style.setProperty('--ripple-x', `${rx}px`);
            btn.style.setProperty('--ripple-y', `${ry}px`);
            btn.classList.add('typing-complete');
          } catch (e) {}
        }

        schedule(() => {
          handEl.classList.remove('is-tap');
          btn.classList.remove('is-pressed');
          btn.classList.remove('hero-hand-press');
          state.activeButton = null;
          handEl.classList.remove('is-visible');
          handEl.style.removeProperty('--hero-hand-opacity');
            handEl.classList.remove('hero-hand-hint--modal');

          if (btn.classList.contains('typing-complete')) {
            btn.classList.remove('typing-complete');
          }

          schedule(() => {
            settle();
          }, fadeDuration);
        }, tapDuration);
      }, moveDuration);
    });

    const fallbackMs = Math.max(moveDuration + tapDuration + fadeDuration + 180, 900);
    fallbackId = window.setTimeout(() => {
      if (settled) return;
      try {
        handEl.classList.remove('is-tap');
        handEl.classList.remove('is-visible');
        handEl.style.removeProperty('--hero-hand-opacity');
        handEl.classList.remove('hero-hand-hint--modal');
        btn.classList.remove('is-pressed');
        btn.classList.remove('hero-hand-press');
        btn.classList.remove('typing-complete');
      } catch (e) {}
      settle();
    }, fallbackMs);
  });

  const controller = { form: heroForm, play };
  window.__heroHandHintController = controller;
  controller.playTestSequence = async () => {
    const seq = [];
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    try {
      const heroBtn = heroForm ? heroForm.querySelector('button[type="submit"], .btn-primary') : null;
      if (heroBtn) seq.push(() => play(heroBtn));
    } catch (e) {}
    try {
      const modalForm = document.querySelector('.hero-form--modal');
      if (modalForm) {
        const mBtn = modalForm.querySelector('button[type="submit"], .btn-primary, [data-b4-submit]');
        if (mBtn) seq.push(() => play(mBtn));
      }
    } catch (e) {}
    try {
      const blockForm = document.querySelector('[data-b4-form]');
      if (blockForm) {
        const bBtn = blockForm.querySelector('button[type="submit"], [data-b4-submit]');
        if (bBtn) seq.push(() => play(bBtn));
      }
    } catch (e) {}

    for (let fn of seq) {
      await sleep(350);
      await fn();
    }
  };
  return controller;
}

/* ==========================================================
   FORMS UX: placeholder typing + subtle CTA pulse + pressed state
   ========================================================== */
function initFormsUX() {
  if (!guardInit('forms-ux')) return;
  const pageKey = (document.body && document.body.dataset && document.body.dataset.page) || 'default';

  const BASE_PLACEHOLDERS = {
    name: 'Как вас зовут?',
    phone: 'Ваш номер',
    message: 'Опишите, что произошло'
  };
  const COMMON_PHONE_TEXT = '+7 987 654 32 10';
  const TYPING_SETS = {
    fraud: {
      name: ['Алексей Смирнов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Перевёл деньги мошенникам, нужна помощь с возвратом средств']
    },
    investment: {
      name: ['Ирина Ковалева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Перевёл деньги брокеру, вывод заблокировали после доплаты комиссии']
    },
    influence: {
      name: ['Олег Воронов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['После звонка «службы безопасности» перевёл деньги на чужой счёт']
    },
    credit: {
      name: ['Марина Орлова'],
      phone: [COMMON_PHONE_TEXT],
      message: ['На меня оформили кредит без согласия, банк требует оплату']
    },
    'consumer-protection': {
      name: ['Анна Миронова'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Нарушили мои права как потребителя, нужен возврат денег и защита']
    },
    'medical-malpractice': {
      name: ['Ирина Власова'],
      phone: [COMMON_PHONE_TEXT],
      message: ['После лечения стало хуже, нужна помощь разобраться с врачом']
    },
    'poor-quality-services': {
      name: ['Алексей Синицын'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Услугу оказали плохо, хочу вернуть деньги и исправить ситуацию']
    },
    'forced-insurance': {
      name: ['Мария Руднева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Навязали страховку при оформлении, хочу её отменить']
    },
    'furniture-defects': {
      name: ['Владислав Крылов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Мебель пришла с дефектами, продавец не решает вопрос']
    },
    'defective-apartment-renovation': {
      name: ['Ольга Зуева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Ремонт сделали плохо, нужен возврат и переделка']
    },
    'consumer-goods-refund': {
      name: ['Сергей Козлов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Купил товар с браком, магазин отказывается вернуть деньги']
    },
    'construction-contract': {
      name: ['Дмитрий Орлов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Подрядчик сорвал сроки и качество работ, нужен возврат']
    },
    'contractor-agreement': {
      name: ['Евгений Логинов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Подрядчик нарушил договор, нужны возврат денег и неустойка']
    },
    'complaint-against-lawyer': {
      name: ['Наталья Лебедева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Заплатила юристу, результата нет, хочу подать жалобу']
    },
    default: {
      name: ['Антон Смирнов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Опишите, что произошло, и мы подскажем, как вернуть деньги']
    }
  };

  initHeroFormHandClickHint();

  if (!window.__keisFormControllers || !(window.__keisFormControllers instanceof WeakMap)) {
    window.__keisFormControllers = new WeakMap();
  }

  const controllers = window.__keisFormControllers;
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const pageTexts = TYPING_SETS[pageKey] || TYPING_SETS.default;
  const defaultTexts = TYPING_SETS.default;

  const resolveFieldKey = (el) => {
    const nameAttr = (el.getAttribute('name') || '').toLowerCase();
    if (/name|fullname|your_name/.test(nameAttr)) return 'name';
    if (/phone|tel|phone_number/.test(nameAttr)) return 'phone';
    return 'message';
  };

  const getTexts = (key) => {
    const current = pageTexts[key];
    if (Array.isArray(current) && current.length) return current;
    return Array.isArray(defaultTexts[key]) ? defaultTexts[key] : [];
  };

  const heroSection = document.querySelector('body > section:first-of-type');
  const allForms = Array.from(document.querySelectorAll('form'));
  const eligibleForms = allForms
    .map((form) => {
      const uxOff = form.hasAttribute('data-no-ux') || form.getAttribute('data-keis-ux') === 'off';
      const fields = Array.from(form.querySelectorAll('input[type="text"], input[type="tel"], textarea'))
        .filter((el) => {
          const type = (el.getAttribute('type') || '').toLowerCase();
          if (type === 'hidden' || type === 'submit' || type === 'checkbox' || type === 'radio') return false;
          return !el.disabled && !el.hidden;
        });
      const submit = form.querySelector('button[type="submit"], input[type="submit"]');
      const isHero = !!heroSection && (heroSection.contains(form) || form.classList.contains('hero-form'));
      const isB4 = form.hasAttribute('data-b4-form') || !!form.closest('[data-b4-form]');
      const isModal = form.classList.contains('hero-form--modal') || !!form.closest('.hero-form--modal');
      return { form, fields, submit, isHero, isB4, isModal, uxOff };
    })
    .filter(({ fields, submit, uxOff }) => !uxOff && fields.length >= 2 && !!submit)
    .sort((a, b) => (Number(b.isHero) - Number(a.isHero)) || (Number(b.isB4) - Number(a.isB4)) || (Number(b.isModal) - Number(a.isModal)));

  if (!eligibleForms.length) return;

  eligibleForms.forEach(({ form, fields, submit, isHero, isB4, isModal }) => {
    if (controllers.has(form)) return;

    const fieldStates = fields.map((el) => ({
      el,
      key: resolveFieldKey(el),
      idx: -1
    }));

    fieldStates.forEach((fs) => {
      const baseText = BASE_PLACEHOLDERS[fs.key] || '';
      fs.el.setAttribute('placeholder', baseText);
    });

    const submitButton = submit || form.querySelector('button[type="submit"], .btn-primary, [data-b4-submit], .faq-ask-btn');

    const state = {
      running: false,
      stopped: false,
      userInteracted: false,
      restartTimer: null
    };

    const gateByViewport = isB4 || isModal;
    let isIntersecting = !gateByViewport;

    const tapSubmit = async () => {
      if (!submitButton) return;
      if (state.stopped || state.userInteracted) return;
      const hero = window.__heroHandHintController;
      if (hero && typeof hero.play === 'function') {
        const failSafe = sleep(1200).then(() => animateButtonPress(submitButton));
        await Promise.race([hero.play(submitButton), failSafe]);
      } else {
        await animateButtonPress(submitButton);
      }
    };

    const resetPlaceholdersAnimated = async () => {
      const emptyFields = fieldStates.map((fs) => fs.el).filter((el) => el && !(el.value && String(el.value).trim()));
      if (!emptyFields.length) return;
      emptyFields.forEach((el) => {
        el.classList.remove('ux-typing');
        el.classList.add('ux-resetting');
        el.setAttribute('placeholder', '');
      });
      await sleep(170);
      emptyFields.forEach((el) => {
        const key = resolveFieldKey(el);
        const base = BASE_PLACEHOLDERS[key] || '';
        el.setAttribute('placeholder', base);
      });
      await new Promise(requestAnimationFrame);
      emptyFields.forEach((el) => {
        el.classList.remove('ux-resetting');
      });
    };

    const enforceBasePlaceholders = () => {
      fieldStates.forEach((fs) => {
        if (!fs.el) return;
        const key = resolveFieldKey(fs.el);
        const base = BASE_PLACEHOLDERS[key] || '';
        if (!fs.el.value || !String(fs.el.value).trim()) {
          fs.el.setAttribute('placeholder', base);
        }
      });
    };

    const stopTyping = () => {
      state.stopped = true;
      state.userInteracted = true;
      clearTimeout(state.restartTimer);
      form.classList.remove('ux-typing-active');
      fieldStates.forEach((fs) => fs.el.classList.remove('ux-typing'));
    };

    const nextText = (fs) => {
      const texts = getTexts(fs.key);
      if (!texts.length) return '';
      fs.idx = (fs.idx + 1) % texts.length;
      return texts[fs.idx];
    };

    const typePlaceholder = async (fs) => {
      const el = fs.el;
      if (!el || state.stopped) return false;
      if (el.value && String(el.value).trim()) return false;
      const text = nextText(fs);
      if (!text) return false;

      el.classList.add('ux-typing');
      el.setAttribute('placeholder', '');

      for (let i = 0; i < text.length; i++) {
        if (state.stopped || state.userInteracted) break;
        if (el.value && String(el.value).trim()) break;
        el.setAttribute('placeholder', text.slice(0, i + 1));
        await sleep(randomBetween(35, 60));
      }

      el.classList.remove('ux-typing');
      return true;
    };

    const runCycle = async () => {
      if (state.running) return;
      state.running = true;
      state.stopped = false;
      enforceBasePlaceholders();

      while (!state.stopped) {
        form.classList.add('ux-typing-active');

        let lastAnimated = null;

        for (const fs of fieldStates) {
          if (state.stopped) break;
          if (fs.el.value && String(fs.el.value).trim()) continue;
          if (state.userInteracted) {
            state.stopped = true;
            break;
          }
          const didType = await typePlaceholder(fs);
          if (didType) lastAnimated = fs;
          if (state.stopped) break;
          await sleep(randomBetween(240, 420));
        }

        if (!state.stopped && !state.userInteracted && lastAnimated) {
          await sleep(randomBetween(260, 480));
          await tapSubmit();
          await resetPlaceholdersAnimated();
          enforceBasePlaceholders();
          form.classList.remove('ux-typing-active');
          if (state.stopped || state.userInteracted) break;
          await sleep(randomBetween(2000, 2600));
          continue;
        }

        form.classList.remove('ux-typing-active');
        if (state.stopped || state.userInteracted) break;
        await sleep(randomBetween(1500, 2500));
      }

      form.classList.remove('ux-typing-active');
      await resetPlaceholdersAnimated();
      enforceBasePlaceholders();
      state.running = false;
      if (!state.userInteracted) {
        scheduleStart(2200);
      }
    };

    const scheduleStart = (delayMs) => {
      clearTimeout(state.restartTimer);
      state.restartTimer = setTimeout(() => {
        if (!state.running && !state.userInteracted) {
          if (gateByViewport && !isIntersecting) return;
          runCycle();
        }
      }, delayMs);
    };

    fieldStates.forEach((fs) => {
      const el = fs.el;

      const interruptAndReset = async () => {
        stopTyping();
        await resetPlaceholdersAnimated();
      };

      el.addEventListener('pointerdown', () => {
        interruptAndReset();
      });

      el.addEventListener('focus', () => {
        interruptAndReset();
      });

      el.addEventListener('input', (e) => {
        if (e && !e.isTrusted) return;
        stopTyping();
      });

      el.addEventListener('blur', () => {
        clearTimeout(state.restartTimer);
        const focusInside = form.contains(document.activeElement);
        if (focusInside) return;
        const hasValue = fieldStates.some((f) => f.el.value && String(f.el.value).trim());
        if (hasValue) return;
        state.stopped = false;
        state.userInteracted = false;
        scheduleStart(2000);
      });
    });

    const controller = {
      form,
      fields: fieldStates.map((fs) => fs.el),
      start: () => {
        state.stopped = false;
        state.userInteracted = false;
        if (!state.running) runCycle();
      },
      stop: stopTyping
    };

    controllers.set(form, controller);

    // Ensure CTA form (block 5) starts placeholder typing consistently on load.
    if (isB4) {
      setTimeout(() => {
        if (state.running || state.userInteracted) return;
        controller.start();
      }, 1400);
    }

    const initialDelay = gateByViewport ? null : 3200;
    if (initialDelay !== null) scheduleStart(initialDelay);

    // Fail-safe: ensure hero/B4 form cycles start even if observers/timers were skipped
    if (isHero || isB4 || isModal) {
      setTimeout(() => {
        if (state.running || state.userInteracted) return;
        if (gateByViewport && !isIntersecting) {
          const rect = form.getBoundingClientRect();
          const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
          if (!inViewport) return;
          isIntersecting = true;
        }
        runCycle();
      }, gateByViewport ? 5200 : 4200);
    }

    if (gateByViewport && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (!entry.isIntersecting || state.userInteracted) return;
          state.stopped = false;
          state.userInteracted = false;
          clearTimeout(state.restartTimer);
          resetPlaceholdersAnimated().then(() => {
            if (!state.running) runCycle();
          });
        });
      }, { threshold: 0.15 });
      io.observe(form);
      const rect = form.getBoundingClientRect();
      const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
      if (inViewport && !state.userInteracted) {
        isIntersecting = true;
        clearTimeout(state.restartTimer);
        resetPlaceholdersAnimated().then(() => {
          if (!state.running) runCycle();
        });
      }
    } else if (gateByViewport) {
      isIntersecting = true;
      scheduleStart(3200);
    }
  });
}
/* ==========================================================
   HEADER: desktop dropdown + mobile burger
   ========================================================== */
function initHeader() {
  if (window.__headerInitialized) return;
  if (!guardInit('header')) return;
  window.__headerInitialized = true;

  // Measure header height and expose it via CSS var
  const header = document.querySelector('.keis-header');
  let headerMeasureRaf = null;
  const measureHeaderHeight = () => {
    if (!header) return;
    const measured = Math.round(header.offsetHeight || header.getBoundingClientRect().height || 0);
    if (measured > 0) {
      // Guard against accidental layout inflation (e.g. transient overlays affecting header flow)
      const safe = Math.max(64, Math.min(92, measured));
      document.documentElement.style.setProperty('--keis-header-h', `${safe}px`);
    }
  };
  const scheduleHeaderMeasure = () => {
    if (headerMeasureRaf) cancelAnimationFrame(headerMeasureRaf);
    headerMeasureRaf = requestAnimationFrame(() => {
      headerMeasureRaf = null;
      measureHeaderHeight();
    });
  };
  measureHeaderHeight();
  window.addEventListener('resize', scheduleHeaderMeasure, { passive: true });
  window.addEventListener('orientationchange', scheduleHeaderMeasure, { passive: true });

  const logoLink = document.querySelector('.keis-header-logo');
  const logoImg = document.querySelector('.keis-header-logo img, .kg-home__logo');
  const mobileHeaderCta = document.querySelector('.keis-header-mobile-cta');
  if (logoImg) logoImg.src = '/assets/head/biglogo.svg';

  if (mobileHeaderCta) {
    const defaultLabel = (mobileHeaderCta.textContent || '').trim() || 'Записаться';
    mobileHeaderCta.dataset.defaultLabel = defaultLabel;
    const compactLabel = 'Запись';
    const updateMobileCtaLabel = () => {
      const isCompact = window.matchMedia('(max-width: 399px)').matches;
      mobileHeaderCta.textContent = isCompact ? compactLabel : defaultLabel;
    };
    updateMobileCtaLabel();
    window.addEventListener('resize', createRafThrottle(updateMobileCtaLabel), { passive: true });
    window.addEventListener('orientationchange', createRafThrottle(updateMobileCtaLabel), { passive: true });
  }

  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      const href = logoLink.getAttribute('href') || '';
      let targetUrl = null;
      try {
        targetUrl = new URL(href, window.location.href);
      } catch (err) {
        return;
      }
      const current = new URL(window.location.href);
      const isSamePage = targetUrl.origin === current.origin && targetUrl.pathname === current.pathname;
      const isTopHash = targetUrl.hash === '#top' || targetUrl.hash === '#';
      const isSamePathLink = isSamePage && (!targetUrl.hash || isTopHash);
      if (isSamePathLink) {
        e.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    });
  }

  const headerDirectionGroups = {
    fraud: [
      { href: '/scam/broker/', label: 'Инвестиционное мошенничество' },
      { href: '/scam/pressure/', label: 'Перевод под влиянием' },
      { href: '/scam/hack/', label: 'Взлом и оформление кредита' },
    ],
    consumer: [
      { href: '/zpp/med-error/', label: 'Медицинская ошибка' },
      { href: '/zpp/renovation/', label: 'Некачественный ремонт' },
      { href: '/zpp/refund/', label: 'Возврат товара' },
      { href: '/zpp/lawyer-claim/', label: 'Жалоба на юриста' },
      { href: '/zpp/insurance/', label: 'Навязанная страховка' },
      { href: '/zpp/furniture/', label: 'Брак мебели' },
      { href: '/zpp/build-contract/', label: 'Строительный договор' },
      { href: '/zpp/services/', label: 'Некачественные услуги' },
      { href: '/zpp/contractor/', label: 'Договор подряда' },
    ],
  };
  const getHeaderScopeFromPath = (path) => {
    const normalizedPath = String(path || '/');
    if (normalizedPath === '/scam' || normalizedPath.startsWith('/scam/')) return 'fraud';
    if (normalizedPath === '/zpp' || normalizedPath.startsWith('/zpp/')) return 'consumer';
    return '';
  };
  const getHeaderReferrerScope = () => {
    if (!document.referrer) return '';
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin !== window.location.origin) return '';
      return getHeaderScopeFromPath(referrerUrl.pathname);
    } catch (_) {
      return '';
    }
  };
  const setHeaderDirectionsScope = (scope) => {
    const directions = headerDirectionGroups[scope];
    if (!directions) return;
    const html = directions
      .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
      .join('');
    document.querySelectorAll('.keis-header-nav-dropdown, .kg-mm__sublist').forEach((list) => {
      list.innerHTML = html;
    });
  };
  const syncNewsHeaderDirections = () => {
    const currentScope = getHeaderScopeFromPath(window.location.pathname);
    if (currentScope) {
      try {
        sessionStorage.setItem('keisHeaderDirectionsScope', currentScope);
      } catch (_) {}
      return;
    }
    if (document.body?.dataset?.page !== 'news') return;
    const referrerScope = getHeaderReferrerScope();
    let storedScope = '';
    try {
      storedScope = sessionStorage.getItem('keisHeaderDirectionsScope') || '';
    } catch (_) {}
    setHeaderDirectionsScope(referrerScope || storedScope || 'consumer');
  };
  syncNewsHeaderDirections();

  /* ===== KG Mobile Menu (kg-mm) ===== */
  const burger = document.querySelector('.keis-header-burger, #burgerBtn');
  const kgMm = document.getElementById('kg-mm');
  const body = document.body;
  const KG_MM_BREAKPOINT = 980;
  const injectMobileDropdownIcon = () => {
    if (!kgMm) return;
    const templateIcon = document.querySelector('.keis-header-nav .keis-dropdown-icon');
    if (!templateIcon) return;
    kgMm.querySelectorAll('.kg-mm__sub-toggle').forEach((btn) => {
      if (btn.querySelector('.keis-dropdown-icon')) return;
      const icon = templateIcon.cloneNode(true);
      icon.setAttribute('aria-hidden', 'true');
      btn.appendChild(icon);
    });
  };
  injectMobileDropdownIcon();

  const safeFocus = (el) => {
    if (!el) return;
    const x = window.scrollX;
    const y = window.scrollY;
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      el.focus();
      window.scrollTo(x, y);
    }
  };

  const resetSubmenus = () => {
    kgMm?.querySelectorAll('.kg-mm__item--sub').forEach((li) => {
      li.classList.remove('kg-mm__item--open');
      const btn = li.querySelector('.kg-mm__sub-toggle');
      const ul = li.querySelector('.kg-mm__sublist');
      btn?.setAttribute('aria-expanded', 'false');
      if (ul) {
        ul.setAttribute('aria-hidden', 'true');
      }
    });
  };
  resetSubmenus();

  const closeKgMm = (options = {}) => {
    const { force = false } = options;
    if (!kgMm) return;
    const wasOpen = body.classList.contains('kg-mm-open');
    if (!wasOpen && !force) return;
    body.classList.remove('kg-mm-open');
    body.style.overflow = '';
    kgMm.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.classList.remove('is-open');
    resetSubmenus();
    scheduleHeaderMeasure();
    if (wasOpen) {
      safeFocus(burger);
    }
  };

  const openKgMm = () => {
    if (!kgMm || window.innerWidth > KG_MM_BREAKPOINT) return;
    body.classList.add('kg-mm-open');
    body.style.overflow = '';
    kgMm.setAttribute('aria-hidden', 'false');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.classList.add('is-open');
    scheduleHeaderMeasure();
    const firstMenuItem = kgMm.querySelector('.kg-mm__list a, .kg-mm__sub-toggle');
    if (firstMenuItem instanceof HTMLElement) {
      safeFocus(firstMenuItem);
    } else {
      safeFocus(burger);
    }
  };

  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!kgMm) return;
    body.classList.contains('kg-mm-open') ? closeKgMm() : openKgMm();
  });

  closeKgMm({ force: true });

  kgMm?.querySelectorAll('[data-kg-mm-close]').forEach((el) => {
    el.addEventListener('click', closeKgMm);
  });

  kgMm?.querySelectorAll('.kg-mm__nav a').forEach((link) => {
    link.addEventListener('click', closeKgMm);
  });

  kgMm?.querySelectorAll('.kg-mm__sub-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const li = btn.closest('.kg-mm__item--sub');
      const ul = li?.querySelector('.kg-mm__sublist');
      if (!li || !ul) return;
      const willBeOpen = !li.classList.contains('kg-mm__item--open');
      li.classList.toggle('kg-mm__item--open', willBeOpen);
      btn.setAttribute('aria-expanded', String(willBeOpen));
      ul.setAttribute('aria-hidden', String(!willBeOpen));
    });
  });

  const handleKgMmOutsideClick = (e) => {
    if (!body.classList.contains('kg-mm-open')) return;
    if (window.innerWidth > KG_MM_BREAKPOINT) return;
    const target = e.target;
    if (!target) return;
    if (kgMm?.querySelector('.kg-mm__panel')?.contains(target)) return;
    if (burger?.contains(target)) return;
    closeKgMm();
  };
  document.addEventListener('click', handleKgMmOutsideClick, { capture: true });

  const handleKgMmResize = () => {
    if (window.innerWidth > KG_MM_BREAKPOINT) {
      closeKgMm();
    }
  };
  const scheduleKgMmResize = createRafThrottle(handleKgMmResize);
  window.addEventListener('resize', scheduleKgMmResize, { passive: true });
  window.addEventListener('orientationchange', scheduleKgMmResize, { passive: true });

  /* Desktop dropdown */
  const desktopTrigger = document.querySelector(
    '.keis-header-nav [data-submenu-trigger]'
  );

  const closeDesktopDropdown = () => {
    document
      .querySelectorAll('.keis-header-nav .has-children.is-open')
      .forEach((li) => {
        li.classList.remove('is-open');
        li
          .querySelector('[aria-haspopup]')
          ?.setAttribute('aria-expanded', 'false');
      });
  };

  desktopTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    const li = desktopTrigger.closest('.has-children');
    if (!li) return;

    const open = !li.classList.contains('is-open');
    closeDesktopDropdown();
    if (open) {
      li.classList.add('is-open');
      desktopTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.keis-header-nav')) {
      closeDesktopDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (body.classList.contains('kg-mm-open')) {
      closeKgMm();
      return;
    }
    closeDesktopDropdown();

    // close contact modal (if open)
    if (contactModal?.classList.contains('is-open')) {
      closeContactModal();
    }
  });

    /* ==========================================================
     CONTACT MODAL (opened by header CTA + FAQ button)
     ========================================================== */
  const contactModal = document.getElementById('contactModal');
  const openers = document.querySelectorAll('[data-open-contact-modal]');
  const closers = contactModal
    ? contactModal.querySelectorAll('[data-close-contact-modal]')
    : [];

  const isModalOpen = () => contactModal?.classList.contains('is-open');
  
  // ЗАДАЧА 2: Сохраняем scrollY при открытии попапа
  let savedScrollY = 0;
  const readViewportScrollY = () => {
    const bodyTop = parseFloat(document.body.style.top || '0');
    if (document.body.style.position === 'fixed' && Number.isFinite(bodyTop) && bodyTop !== 0) {
      return Math.max(0, Math.round(-bodyTop));
    }
    return Math.max(
      0,
      Math.round(
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      )
    );
  };

  const openContactModal = () => {
    if (!contactModal) {
      const fallbackTarget = document.getElementById('consult') || document.querySelector('form[action*="api/telegram.php"]');
      if (fallbackTarget && typeof fallbackTarget.scrollIntoView === 'function') {
        fallbackTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      window.location.href = '/zpp/#consult';
      return;
    }
    closeKgMm();
    
    // Сохраняем текущую позицию скролла
    savedScrollY = readViewportScrollY();

    // Prevent global `scroll-behavior: smooth` from animating any restore scroll
    document.documentElement.classList.add('no-smooth-scroll');
    
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    // Lock background scroll (iOS-safe and stable across desktop pages in this project)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';

    // TASK 2: Ensure typewriter works for popup form when modal opens
    const modalForm = contactModal.querySelector('form.hero-form--modal');
    if (modalForm && window.__keisFormControllers) {
      const controller = window.__keisFormControllers.get(modalForm);
      if (controller && typeof controller.start === 'function') {
        setTimeout(() => controller.start(), 120);
      }
    }

    // Also trigger hero-hand hint animation for the modal submit button
    // Only trigger here when the form controller is NOT present — otherwise
    // the controller restart will handle user guidance itself.
    try {
      const heroController = window.__heroHandHintController;
      if (heroController && modalForm) {
        const modalBtn = modalForm.querySelector('button[type="submit"], .btn-primary, [data-b4-submit], .faq-ask-btn');
        const hasController = window.__keisFormControllers && window.__keisFormControllers.get && window.__keisFormControllers.get(modalForm);
        if (modalBtn && !hasController) {
          // small delay to allow modal open animation and layout to settle
          setTimeout(() => {
            try { heroController.play(modalBtn); } catch (e) { /* noop */ }
          }, 240);
        }
      }
    } catch (e) {
      // noop
    }

    const first = contactModal.querySelector('input, textarea, button');
    safeFocus(first);
  };

  const closeContactModal = (options = {}) => {
    const { keepBodyLock = false } = options;
    if (!contactModal) return;
    contactModal.classList.remove('is-open');
    contactModal.setAttribute('aria-hidden', 'true');
    if (keepBodyLock) {
      savedScrollY = 0;
      return;
    }

    document.body.classList.remove('modal-open');
    
    // ЗАДАЧА 2: Восстанавливаем scrollY без анимации
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' });
    savedScrollY = 0;

    // Restore smooth scrolling for the rest of the page interactions
    document.documentElement.classList.remove('no-smooth-scroll');
  };

  window.__keisOpenContactModal = openContactModal;
  window.__keisCloseContactModal = closeContactModal;
  window.__keisIsContactModalOpen = isModalOpen;

  openers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeKgMm();
      closeDesktopDropdown();
      openContactModal();
    });
  });

  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeContactModal();
    });
  });

  // Removed duplicate Escape handler for contact modal

  // NOTE: modal close is handled in success flow to avoid scroll jump between
  // contact and success overlays.
}

/* ==========================================================
   KGX STORIES SLIDER (with autoplay, pause on hover/focus)
   ========================================================== */
function initKgxStoriesSlider() {
  if (window.__kgxStoriesSliderInitialized) return;
  window.__kgxStoriesSliderInitialized = true;

  const root = document.querySelector('#kgx-stories-carousel');
  if (!root) {
    return;
  }

  const ensureStoriesVideoBackground = () => {
    if (root.dataset.videoBgReady === 'true' || root.querySelector('.kgx-stories__video-bg')) {
      root.dataset.videoBgReady = 'true';
      return;
    }

    const mp4Src = '/assets/block/video/just-bg.mp4?v=20260621just';
    const webmSrc = '/assets/block/video/just-bg.webm?v=20260621just';
    const posterSrc = '/assets/block/video/just-bg-poster.webp?v=20260621just';

    const video = document.createElement('video');
    video.className = 'kgx-stories__video-bg';
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = posterSrc;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('tabindex', '-1');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');

    const mp4 = document.createElement('source');
    mp4.src = mp4Src;
    mp4.type = 'video/mp4';
    video.appendChild(mp4);

    const webm = document.createElement('source');
    webm.src = webmSrc;
    webm.type = 'video/webm';
    video.appendChild(webm);

    video.addEventListener('loadeddata', () => root.classList.add('is-video-ready'), { once: true });
    video.addEventListener('error', () => root.classList.add('is-video-failed'), { once: true });

    root.insertBefore(video, root.firstChild);
    root.dataset.videoBgReady = 'true';

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => root.classList.add('is-video-paused'));
    }
  };

  ensureStoriesVideoBackground();

  // Slider enabled: autoplay + pause on hover/focus, looped.

  const viewportEl = root.querySelector('.kgx-stories__viewport');
  const track = root.querySelector('.kgx-stories__track');
  const controls = root.querySelector('.kgx-stories__controls');
  const prevBtn = root.querySelector('.kgx-stories__btn--prev') || document.querySelector('#kgx-stories-carousel .kgx-stories__btn--prev');
  const nextBtn = root.querySelector('.kgx-stories__btn--next') || document.querySelector('#kgx-stories-carousel .kgx-stories__btn--next');

  if (!viewportEl || !track) {
    if (isDev()) console.warn('[initKgxStoriesSlider] Missing required elements: viewportEl or track');
    return;
  }

// Keep an immutable template of the original slides.
// IMPORTANT: backgrounds are currently assigned via CSS rules that can break
// when we clone/reorder slides for an infinite carousel. So we snapshot the
// real slide media backgrounds once and re-apply them to every clone.
const originalNodes = [...track.children];
const originalTemplates = originalNodes.map((n) => n.cloneNode(true));
const totalSlides = originalTemplates.length;
if (totalSlides < 2) return;

const templateBgs = originalNodes.map((slide) => {
  const media = slide.querySelector?.('.kgx-stories__media');
  if (!media) return '';
  const bg = getComputedStyle(media).backgroundImage;
  return bg && bg !== 'none' ? bg : '';
});

const applyBgByRealIndex = (slideEl, realIdx) => {
  if (!slideEl) return;
  const media = slideEl.querySelector?.('.kgx-stories__media');
  if (!media) return;
  const bg = templateBgs[realIdx];
  if (!bg) return;
  media.style.backgroundImage = bg;
};

const mod = (n, m) => ((n % m) + m) % m;

function normalizeStoriesNav() {
  if (!controls) return;
  controls.classList.add('case-showcase__nav');

  if (prevBtn) {
    prevBtn.classList.add('case-showcase__arrow', 'case-showcase__arrow--prev');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  }
  if (nextBtn) {
    nextBtn.classList.add('case-showcase__arrow', 'case-showcase__arrow--next');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  }

  let dots = controls.querySelector('.case-showcase__dots');
  if (!dots) {
    dots = document.createElement('div');
    dots.className = 'case-showcase__dots kgx-stories__dots';
    dots.setAttribute('aria-label', 'Навигация по карточкам');
    if (nextBtn) controls.insertBefore(dots, nextBtn);
    else controls.appendChild(dots);
  }
  if (!dots.children.length) {
    dots.innerHTML = '';
    for (let i = 0; i < totalSlides; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'case-showcase__dot kgx-stories__dot';
      dot.setAttribute('aria-label', `Карточка ${i + 1}`);
      dot.addEventListener('click', () => goToRealIndex(i));
      dots.appendChild(dot);
    }
  }

  let hint = root.querySelector('.kgx-stories__hint.case-showcase__hint');
  if (!hint) {
    hint = document.createElement('p');
    hint.className = 'case-showcase__hint kgx-stories__hint';
    hint.textContent = 'Свайпните →';
    controls.insertAdjacentElement('afterend', hint);
  }
}

function updateStoriesNav() {
  const dots = controls ? Array.from(controls.querySelectorAll('.case-showcase__dot')) : [];
  dots.forEach((dot, index) => {
    dot.classList.toggle('is-active', index === realIndex);
    dot.setAttribute('aria-current', index === realIndex ? 'true' : 'false');
  });
}

  // SSOT breakpoint for block 2: mobile/tablet <=980, desktop >=981
  const mobileMedia = window.matchMedia('(max-width: 980px)');

  let realIndex = 0;
  let domIndex = 0;

  // Autoplay (smooth) + pause on hover/focus
  let autoplayRafId = 0;
  let autoplayLastTs = 0;
  const autoplayDelayMs = 4200;
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMotionMedia.matches;
  let isPaused = false;
  let isAnimating = false;
  let isSliderVisible = true;

  let step = 0; // width of one slide + gap
  let gap = 0;
  let visible = 3;
  let cloneCount = 3;
  let slidesAll = [];
  let pendingJumpDomIndex = null;
  let edgePeekRafId = 0;
  let edgePeekSlide = null;
  let beforeEdgePeekSlide = null;
  let edgePeekWidth = 0;

  const readVisibleFromLayout = () => {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width >= 1581) return 3;
    if (width >= 981) return 2;
    return 1;
  };

  const calcMetrics = () => {
    const cs = getComputedStyle(track);
    gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;

    const first = slidesAll[0];
    if (!first) return;

    // Шаг = реальное расстояние между началом первой и второй карточки в разметке (целое px), иначе накапливается сдвиг и обрезки
    if (slidesAll.length >= 2) {
      const r0 = slidesAll[0].getBoundingClientRect();
      const r1 = slidesAll[1].getBoundingClientRect();
      step = Math.round(r1.left - r0.left);
    } else {
      const rect = first.getBoundingClientRect();
      const slideWidth = rect?.width || first.offsetWidth || 0;
      step = Math.round(slideWidth + gap);
    }
  };

  const setEdgePeekState = (peekSlide, peekWidth) => {
    const beforeSlide = peekSlide ? slidesAll[slidesAll.indexOf(peekSlide) - 1] || null : null;

    if (edgePeekSlide && edgePeekSlide !== peekSlide) {
      edgePeekSlide.classList.remove('is-edge-peek');
      edgePeekSlide.style.removeProperty('--kgx-edge-visible-w');
    }
    if (beforeEdgePeekSlide && beforeEdgePeekSlide !== beforeSlide) {
      beforeEdgePeekSlide.classList.remove('is-before-edge-peek');
    }

    if (!peekSlide) {
      edgePeekSlide = null;
      beforeEdgePeekSlide = null;
      edgePeekWidth = 0;
      return;
    }

    const roundedWidth = Math.round(peekWidth);
    if (edgePeekSlide !== peekSlide) {
      peekSlide.classList.add('is-edge-peek');
    }
    if (roundedWidth !== edgePeekWidth || edgePeekSlide !== peekSlide) {
      peekSlide.style.setProperty('--kgx-edge-visible-w', `${roundedWidth}px`);
    }
    if (beforeSlide && beforeEdgePeekSlide !== beforeSlide) {
      beforeSlide.classList.add('is-before-edge-peek');
    }

    edgePeekSlide = peekSlide;
    beforeEdgePeekSlide = beforeSlide;
    edgePeekWidth = roundedWidth;
  };

  const measureEdgePeekSlide = () => {
    if (visible < 1 || !slidesAll.length) {
      setEdgePeekState(null, 0);
      return;
    }

    const viewportRect = viewportEl.getBoundingClientRect();
    const viewportRight = viewportRect.right;
    let peekSlide = null;
    let peekWidth = 0;
    let peekLeft = -Infinity;

    slidesAll.forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const visibleLeft = Math.max(rect.left, viewportRect.left);
      const visibleRight = Math.min(rect.right, viewportRight);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const slideWidth = Math.max(1, rect.width);
      const isRightPeek =
        rect.left >= viewportRect.left &&
        rect.left < viewportRight &&
        rect.right > viewportRight + 1 &&
        visibleWidth > 0 &&
        visibleWidth < slideWidth - 4;
      if (!isRightPeek) return;
      if (!peekSlide || rect.left > peekLeft) {
        peekSlide = slide;
        peekWidth = visibleWidth;
        peekLeft = rect.left;
      }
    });

    setEdgePeekState(peekSlide, peekWidth);
  };

  const scheduleEdgePeekMeasure = () => {
    if (edgePeekRafId) return;
    edgePeekRafId = requestAnimationFrame(() => {
      edgePeekRafId = 0;
      measureEdgePeekSlide();
    });
  };

  const trackEdgePeekDuringAnimation = () => {
    if (edgePeekRafId) {
      cancelAnimationFrame(edgePeekRafId);
      edgePeekRafId = 0;
    }
    const tick = () => {
      measureEdgePeekSlide();
      if (isAnimating) {
        edgePeekRafId = requestAnimationFrame(tick);
        return;
      }
      measureEdgePeekSlide();
      edgePeekRafId = 0;
    };
    edgePeekRafId = requestAnimationFrame(tick);
  };

  const getCanonicalDomIndex = (targetRealIndex) => cloneCount + mod(targetRealIndex, totalSlides);

  const getClosestDomIndexForReal = (targetRealIndex) => {
    const canonical = getCanonicalDomIndex(targetRealIndex);
    const candidates = [canonical, canonical - totalSlides, canonical + totalSlides]
      .filter((index) => index >= 0 && index < slidesAll.length);
    if (!candidates.length) return canonical;
    return candidates.reduce((best, index) => (
      Math.abs(index - domIndex) < Math.abs(best - domIndex) ? index : best
    ), candidates[0]);
  };

  const snapToDomIndex = (index) => {
    domIndex = index;
    setEdgePeekState(null, 0);
    track.style.transition = 'none';
    track.style.willChange = 'transform';
    applyTranslate(index, false);
    requestAnimationFrame(() => {
      track.style.willChange = 'auto';
      scheduleEdgePeekMeasure();
    });
  };

  const readRootCssLength = (name, fallback = 0) => {
    const rawValue = getComputedStyle(root).getPropertyValue(name).trim();
    const directValue = Number.parseFloat(rawValue);
    if (Number.isFinite(directValue) && rawValue.endsWith('px')) return directValue;

    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.width = `var(${name})`;
    probe.style.height = '0';
    probe.style.overflow = 'hidden';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    root.appendChild(probe);
    const resolvedValue = Number.parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return Number.isFinite(resolvedValue) ? resolvedValue : fallback;
  };

  const applyTranslate = (index, animated = true) => {
    domIndex = index;
    const targetSlide = slidesAll[domIndex];
    const viewportWidth = viewportEl.getBoundingClientRect().width || 0;
    const visibleSlidesWidth = (step * visible) - gap;
    const sideSpace = Math.max(0, Math.round((viewportWidth - visibleSlidesWidth) / 2));
    const safeInset = visible === 1
      ? readRootCssLength('--kgx-card-safe-inset')
      : 0;
    const targetInset = visible === 1 ? safeInset : (visible >= 2 ? 0 : sideSpace);
    const x = targetSlide
      ? -Math.round(targetSlide.offsetLeft - targetInset)
      : -Math.round((domIndex * step) - targetInset);
    const transitionValue = visible >= 1
      ? 'transform 300ms cubic-bezier(0.18, 0.84, 0.22, 1)'
      : 'transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)';
    const useAnimation = animated && !prefersReducedMotion();
    if (useAnimation) {
      measureEdgePeekSlide();
      track.style.willChange = 'transform';
      track.style.transition = transitionValue;
      track.style.transform = `translate3d(${x}px,0,0)`;
      isAnimating = true;
      trackEdgePeekDuringAnimation();
    } else {
      track.style.willChange = 'auto';
      track.style.transition = 'none';
      track.style.transform = `translate3d(${x}px,0,0)`;
      isAnimating = false;
      scheduleEdgePeekMeasure();
    }
  };

  const setTranslate = (index) => applyTranslate(index, true);
  const setTranslateNoAnim = (index) => applyTranslate(index, false);

  const build = () => {
    visible = readVisibleFromLayout();
    cloneCount = visible;
    setEdgePeekState(null, 0);
    track.innerHTML = '';
    const tail = originalTemplates.slice(-cloneCount).map((n) => n.cloneNode(true));
    const head = originalTemplates.slice(0, cloneCount).map((n) => n.cloneNode(true));
    tail.forEach((n) => track.appendChild(n));
    originalTemplates.forEach((n) => track.appendChild(n.cloneNode(true)));
    head.forEach((n) => track.appendChild(n));
    slidesAll = [...track.children];
    slidesAll.forEach((slideEl, idxAll) => {
      const realIdx = mod(idxAll - cloneCount, totalSlides);
      applyBgByRealIndex(slideEl, realIdx);
    });
    calcMetrics();
    realIndex = mod(realIndex, totalSlides);
    pendingJumpDomIndex = null;
    domIndex = cloneCount + realIndex;
    setTranslateNoAnim(domIndex);
  };

  const autoplayTick = (timestamp) => {
    if (!autoplayRafId) return;

    const shouldRun =
      !isPaused &&
      !isAnimating &&
      !prefersReducedMotion() &&
      !document.hidden &&
      isSliderVisible;

    if (!shouldRun) {
      autoplayLastTs = timestamp;
      autoplayRafId = requestAnimationFrame(autoplayTick);
      return;
    }

    if (!autoplayLastTs) autoplayLastTs = timestamp;
    if ((timestamp - autoplayLastTs) >= autoplayDelayMs) {
      autoplayLastTs = timestamp;
      goToNext();
      return;
    }

    autoplayRafId = requestAnimationFrame(autoplayTick);
  };

  function stopAutoplay() {
    if (autoplayRafId) {
      cancelAnimationFrame(autoplayRafId);
      autoplayRafId = 0;
    }
    autoplayLastTs = 0;
  }

  function startAutoplay() {
    if (prefersReducedMotion()) return;
    if (document.hidden || !isSliderVisible || isPaused) return;
    if (autoplayRafId) return;
    autoplayRafId = requestAnimationFrame(autoplayTick);
  }

  function pauseAutoplay() {
    isPaused = true;
    stopAutoplay();
  }

  function resumeAutoplay() {
    isPaused = false;
    startAutoplay();
  }

  let hoverResumeTimeout = null;
  const scheduleResume = (delayMs = 900) => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    hoverResumeTimeout = setTimeout(() => {
      hoverResumeTimeout = null;
      resumeAutoplay();
    }, delayMs);
  };

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    const jumpDomIndex = pendingJumpDomIndex;
    pendingJumpDomIndex = null;
    isAnimating = false;
    if (jumpDomIndex !== null) {
      snapToDomIndex(jumpDomIndex);
      return;
    }
    track.style.willChange = 'auto';
    scheduleEdgePeekMeasure();
  });

  const goToPrev = () => {
    stopAutoplay();
    if (isAnimating) return;
    const wasFirst = realIndex === 0;
    realIndex = mod(realIndex - 1, totalSlides);
    pendingJumpDomIndex = wasFirst ? (cloneCount + totalSlides - 1) : null;
    domIndex = wasFirst ? (cloneCount - 1) : (cloneCount + realIndex);
    setTranslate(domIndex);
    updateStoriesNav();
    isPaused = false;
    startAutoplay();
  };

  const goToNext = () => {
    stopAutoplay();
    if (isAnimating) return;
    const wasLast = realIndex === (totalSlides - 1);
    realIndex = mod(realIndex + 1, totalSlides);
    pendingJumpDomIndex = wasLast ? cloneCount : null;
    domIndex = wasLast ? (cloneCount + totalSlides) : (cloneCount + realIndex);
    setTranslate(domIndex);
    updateStoriesNav();
    startAutoplay();
  };

  const goToRealIndex = (targetIndex) => {
    const nextIndex = mod(targetIndex, totalSlides);
    stopAutoplay();
    if (isAnimating || nextIndex === realIndex) return;
    const targetDomIndex = getClosestDomIndexForReal(nextIndex);
    const canonicalDomIndex = getCanonicalDomIndex(nextIndex);
    realIndex = nextIndex;
    pendingJumpDomIndex = targetDomIndex === canonicalDomIndex ? null : canonicalDomIndex;
    domIndex = targetDomIndex;
    setTranslate(domIndex);
    updateStoriesNav();
    startAutoplay();
  };

  prevBtn?.addEventListener('click', goToPrev);
  nextBtn?.addEventListener('click', goToNext);

  let lastVisible = readVisibleFromLayout();
  const onResize = () => {
    const newVisible = readVisibleFromLayout();
    const real = realIndex;
    if (newVisible !== lastVisible) {
      lastVisible = newVisible;
      build();
      realIndex = real;
      domIndex = cloneCount + realIndex;
      setTranslateNoAnim(domIndex);
      updateStoriesNav();
      isAnimating = false;
      if (!mobileMedia.matches) resetSwipeState();
    } else {
      calcMetrics();
      domIndex = cloneCount + realIndex;
      setTranslateNoAnim(domIndex);
      updateStoriesNav();
      isAnimating = false;
    }
  };
  const onResizeDebounced = createRafThrottle(onResize);
  window.addEventListener('resize', onResizeDebounced, { passive: true });
  window.addEventListener('orientationchange', onResizeDebounced, { passive: true });

  build();
  setTranslateNoAnim(domIndex);
  isAnimating = false;

  if (document?.fonts?.ready?.then) {
    document.fonts.ready.then(() => {
      calcMetrics();
      domIndex = cloneCount + realIndex;
      setTranslateNoAnim(domIndex);
      updateStoriesNav();
    });
  }
  window.addEventListener('load', () => {
    calcMetrics();
    domIndex = cloneCount + realIndex;
    setTranslateNoAnim(domIndex);
    updateStoriesNav();
  }, { once: true });

  viewportEl.addEventListener('pointerenter', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  }, { passive: true });
  viewportEl.addEventListener('pointerleave', () => scheduleResume(900), { passive: true });
  viewportEl.addEventListener('pointerdown', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  }, { passive: true });
  viewportEl.addEventListener('pointerup', () => scheduleResume(900), { passive: true });
  viewportEl.addEventListener('pointercancel', () => scheduleResume(900), { passive: true });

  root.addEventListener('focusin', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  });
  root.addEventListener('focusout', () => scheduleResume(900));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    if (!isPaused) startAutoplay();
  });

  if ('IntersectionObserver' in window) {
    const autoplayObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== root) return;
        isSliderVisible = entry.isIntersecting && entry.intersectionRatio > 0.2;
        if (!isSliderVisible) {
          stopAutoplay();
          return;
        }
        if (!isPaused) startAutoplay();
      });
    }, {
      threshold: [0, 0.2, 0.35],
      root: null,
      rootMargin: '0px',
    });
    autoplayObserver.observe(root);
  }

  startAutoplay();

  const addMqChangeListener = (mq, handler) => {
    if (!mq || typeof handler !== 'function') return;
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return;
    }
    if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
  };

  // --- Swipe gestures for <=980px ---
  const swipeState = {
    active: false,
    locked: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
  };
  let swipeHandlersAttached = false;

  const resetSwipeState = () => {
    swipeState.active = false;
    swipeState.locked = false;
    swipeState.pointerId = null;
    swipeState.startX = 0;
    swipeState.startY = 0;
    swipeState.deltaX = 0;
  };

  const onSwipePointerDown = (event) => {
    if (!event.isPrimary) return;
    if (swipeState.active) return;
    if (event.pointerType === 'mouse' && event.buttons !== 1) return;

    if (typeof viewportEl.setPointerCapture === 'function') {
      try {
        viewportEl.setPointerCapture(event.pointerId);
      } catch (captureError) {}
    }

    swipeState.active = true;
    swipeState.pointerId = event.pointerId;
    swipeState.startX = event.clientX;
    swipeState.startY = event.clientY;
    swipeState.deltaX = 0;
  };

  const onSwipePointerMove = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;

    const dx = event.clientX - swipeState.startX;
    const dy = event.clientY - swipeState.startY;

    if (!swipeState.locked) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDy > absDx && absDy > 18) {
        resetSwipeState();
        return;
      }
      if (absDx > 18 && absDx > absDy * 1.25) {
        swipeState.locked = true;
      }
    }

    if (swipeState.locked) {
      if (event.cancelable) event.preventDefault();
      swipeState.deltaX = dx;
    }
  };

  const releaseSwipePointer = () => {
    if (swipeState.pointerId === null) return;
    if (typeof viewportEl.releasePointerCapture !== 'function') return;
    try {
      viewportEl.releasePointerCapture(swipeState.pointerId);
    } catch (captureError) {}
  };

  const finishSwipe = () => {
    if (!swipeState.locked) {
      releaseSwipePointer();
      resetSwipeState();
      return;
    }

    if (swipeState.deltaX <= -40) {
      goToNext();
    } else if (swipeState.deltaX >= 40) {
      goToPrev();
    }

    releaseSwipePointer();
    resetSwipeState();
  };

  const onSwipePointerUp = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;
    finishSwipe();
  };

  const onSwipePointerCancel = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;
    releaseSwipePointer();
    resetSwipeState();
  };

  let wheelDeltaX = 0;
  let wheelResetTimeout = null;
  let wheelLockedUntil = 0;

  const resetWheelSwipe = () => {
    wheelDeltaX = 0;
    if (wheelResetTimeout) {
      clearTimeout(wheelResetTimeout);
      wheelResetTimeout = null;
    }
  };

  const onSwipeWheel = (event) => {
    if (isAnimating || swipeState.active) return;

    const rawDeltaX = Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.75
      ? event.deltaX
      : (event.shiftKey ? event.deltaY : 0);
    const absDeltaX = Math.abs(rawDeltaX);
    const absDeltaY = Math.abs(event.deltaY);

    if (absDeltaX < 8 || absDeltaX <= absDeltaY * 1.15) return;
    if (event.cancelable) event.preventDefault();

    const now = Date.now();
    if (now < wheelLockedUntil) return;

    pauseAutoplay();
    wheelDeltaX += rawDeltaX;

    if (wheelResetTimeout) clearTimeout(wheelResetTimeout);
    wheelResetTimeout = setTimeout(() => {
      resetWheelSwipe();
      scheduleResume(900);
    }, 180);

    if (wheelDeltaX >= 72) {
      resetWheelSwipe();
      wheelLockedUntil = now + 560;
      goToNext();
    } else if (wheelDeltaX <= -72) {
      resetWheelSwipe();
      wheelLockedUntil = now + 560;
      goToPrev();
    }
  };

  const attachSwipeHandlers = () => {
    if (swipeHandlersAttached) return;
    viewportEl.addEventListener('pointerdown', onSwipePointerDown, { passive: false });
    viewportEl.addEventListener('wheel', onSwipeWheel, { passive: false });
    window.addEventListener('pointermove', onSwipePointerMove, { passive: false });
    window.addEventListener('pointerup', onSwipePointerUp);
    window.addEventListener('pointercancel', onSwipePointerCancel);
    swipeHandlersAttached = true;
  };

  const detachSwipeHandlers = () => {
    if (!swipeHandlersAttached) return;
    viewportEl.removeEventListener('pointerdown', onSwipePointerDown, { passive: false });
    viewportEl.removeEventListener('wheel', onSwipeWheel, { passive: false });
    window.removeEventListener('pointermove', onSwipePointerMove, { passive: false });
    window.removeEventListener('pointerup', onSwipePointerUp);
    window.removeEventListener('pointercancel', onSwipePointerCancel);
    swipeHandlersAttached = false;
    resetWheelSwipe();
    resetSwipeState();
  };

  const evaluateSwipeSupport = () => {
    attachSwipeHandlers();
  };

  evaluateSwipeSupport();
  addMqChangeListener(mobileMedia, evaluateSwipeSupport);

  addMqChangeListener(reducedMotionMedia, () => {
    if (prefersReducedMotion()) {
      stopAutoplay();
      return;
    }
    if (!isPaused) startAutoplay();
  });

  normalizeStoriesNav();
  updateStoriesNav();
}

/* ==========================================================
   FAQ ACCORDION
   ========================================================== */
function initFaqAccordion() {
  if (window.__faqAccordionInitialized) return;
  window.__faqAccordionInitialized = true;

  const root = document.querySelector('.investment-faq');
  if (!root) {
    return;
  }

  const items = Array.from(root.querySelectorAll('.faq-item'));
  const spacer = root.querySelector('.faq-spacer');
  const answerHeights = new WeakMap();
  items.forEach((item) => {
    const panel = item.querySelector('.faq-answer');
    if (!panel || panel.querySelector('.faq-answer__content')) return;
    const content = document.createElement('div');
    content.className = 'faq-answer__content';
    while (panel.firstChild) content.appendChild(panel.firstChild);
    panel.appendChild(content);
  });

  const readPxVar = (name, fallback) => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.height = `var(${name})`;
    root.appendChild(probe);
    const value = parseFloat(window.getComputedStyle(probe).height);
    probe.remove();
    return Number.isFinite(value) ? value : fallback;
  };

  const measureAnswerHeight = (item) => {
    if (!item) return 0;
    const content = item.querySelector('.faq-answer__content');
    if (!content) return 0;
    const height = Math.ceil(content.scrollHeight || 0);
    answerHeights.set(item, height);
    return height;
  };

  const primeAnswerHeights = () => {
    items.forEach((item) => {
      measureAnswerHeight(item);
    });
  };

  const syncFaqSpacer = () => {
    if (!spacer) return;
    const baseGap = readPxVar('--faq-spacer-base', 85);
    const minGap = readPxVar('--faq-spacer-min', 48);
    const openItem = items.find((item) => item.classList.contains('is-open'));
    if (!openItem) {
      spacer.style.height = `${baseGap}px`;
      return;
    }
    const openedHeight = answerHeights.get(openItem) ?? measureAnswerHeight(openItem);
    const nextGap = Math.max(minGap, baseGap - openedHeight);
    spacer.style.height = `${nextGap}px`;
  };

  const syncFaqSpacerNextFrame = () => {
    window.requestAnimationFrame(() => {
      syncFaqSpacer();
    });
  };

  const setItemState = (item, isOpen) => {
    if (!item) return;
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    item.classList.toggle('is-open', isOpen);
    btn?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (panel) {
      panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }
  };

  const closeAll = (exceptItem = null) => {
    items.forEach((item) => {
      if (item === exceptItem) return;
      setItemState(item, false);
    });
  };

  // Инициализация: первая карточка раскрыта, остальные закрыты
  if (items.length > 0) {
    setItemState(items[0], true);
  }
  for (let i = 1; i < items.length; i++) {
    setItemState(items[i], false);
  }
  primeAnswerHeights();
  syncFaqSpacerNextFrame();

  // Делегирование событий на контейнер
  root.addEventListener('click', (e) => {
    const questionBtn = e.target.closest('.faq-question');
    if (!questionBtn) return;

    const item = questionBtn.closest('.faq-item');
    if (!item) return;

    e.preventDefault();
    e.stopPropagation();

    const isOpen = item.classList.contains('is-open');
    closeAll(isOpen ? null : item);
    setItemState(item, !isOpen);
    syncFaqSpacerNextFrame();
  });

  const handleOutsideClick = (e) => {
    if (e.target.closest('.faq-question') || e.target.classList.contains('faq-question')) {
      return;
    }

    const hasOpenItems = items.some((item) => item.classList.contains('is-open'));
    if (!hasOpenItems) return;

    const clickedItem = e.target.closest('.faq-item');
    if (clickedItem) return;

    closeAll();
    syncFaqSpacerNextFrame();
  };

  const outsideClickEvent = window.PointerEvent ? 'pointerdown' : 'mousedown';
  document.addEventListener(outsideClickEvent, handleOutsideClick, { capture: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll();
      syncFaqSpacerNextFrame();
    }
  });

  const handleFaqResize = createRafThrottle(() => {
    primeAnswerHeights();
    syncFaqSpacerNextFrame();
  });
  window.addEventListener('resize', handleFaqResize, { passive: true });
  window.addEventListener('orientationchange', handleFaqResize, { passive: true });
}

/* ==========================================================
   FAQ PARALLAX
   ========================================================== */
function initFaqParallax() {
  if (window.__faqParallaxInitialized) return;
  window.__faqParallaxInitialized = true;

  const section = document.querySelector('.investment-faq');
  if (!section) {
    return;
  }

  section.style.setProperty('--faq-parallax-y', '0px');
}

function initFaqAskWave() {
  if (window.__faqAskWaveInitialized) return;
  window.__faqAskWaveInitialized = true;

  const btn = document.querySelector('.investment-faq .faq-ask .faq-ask-btn');
  if (!btn) return;

  const reduceMotionMql = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  let isVisible = false;
  let isTabActive = !document.hidden;
  let isHoverPaused = false;
  let waveTimerId = 0;
  let waveStopId = 0;
  let waveFrameId = 0;

  const waveDurationMs = 560;
  const minDelayMs = 6000;
  const maxDelayMs = 10000;

  const clearWaveSchedule = () => {
    if (waveTimerId) {
      clearTimeout(waveTimerId);
      waveTimerId = 0;
    }
    if (waveStopId) {
      clearTimeout(waveStopId);
      waveStopId = 0;
    }
    if (waveFrameId) {
      cancelAnimationFrame(waveFrameId);
      waveFrameId = 0;
    }
  };

  const canAnimate = () => {
    if (reduceMotionMql?.matches) return false;
    if (isHoverPaused) return false;
    return isVisible && isTabActive;
  };

  const randomDelay = () => {
    const spread = maxDelayMs - minDelayMs;
    return minDelayMs + Math.floor(Math.random() * (spread + 1));
  };

  const scheduleNextWave = () => {
    if (!canAnimate() || waveTimerId) return;
    waveTimerId = window.setTimeout(() => {
      waveTimerId = 0;
      triggerWave();
    }, randomDelay());
  };

  const stopWave = () => {
    btn.classList.remove('is-wave');
  };

  const triggerWave = () => {
    if (!canAnimate()) return;
    stopWave();
    waveFrameId = requestAnimationFrame(() => {
      waveFrameId = 0;
      if (!canAnimate()) return;
      btn.classList.add('is-wave');
      waveStopId = window.setTimeout(() => {
        waveStopId = 0;
        stopWave();
      }, waveDurationMs);
      scheduleNextWave();
    });
  };

  const syncWaveState = () => {
    if (!canAnimate()) {
      clearWaveSchedule();
      stopWave();
      return;
    }
    scheduleNextWave();
  };

  const setHoverPaused = (paused) => {
    if (isHoverPaused === paused) return;
    isHoverPaused = paused;
    btn.classList.toggle('is-hover-paused', paused);
    if (paused) {
      clearWaveSchedule();
      stopWave();
      return;
    }
    syncWaveState();
  };

  btn.addEventListener('mouseenter', () => setHoverPaused(true));
  btn.addEventListener('mouseleave', () => setHoverPaused(false));
  btn.addEventListener('focus', () => setHoverPaused(true));
  btn.addEventListener('blur', () => setHoverPaused(false));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== btn) return;
        isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      });
      syncWaveState();
    }, {
      threshold: [0.15, 0.35, 0.6],
      root: null,
      rootMargin: '0px 0px -8% 0px',
    });
    io.observe(btn);
  } else {
    isVisible = true;
  }

  document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
    syncWaveState();
  }, { passive: true });

  if (reduceMotionMql) {
    const onMotionChange = () => syncWaveState();
    if (typeof reduceMotionMql.addEventListener === 'function') {
      reduceMotionMql.addEventListener('change', onMotionChange);
    } else if (typeof reduceMotionMql.addListener === 'function') {
      reduceMotionMql.addListener(onMotionChange);
    }
  }

  syncWaveState();
}

/* ==========================================================
   TRUST PARALLAX (subtle)
   ========================================================== */
function initTrustParallax() {
  if (window.__trustParallaxInitialized) return;
  window.__trustParallaxInitialized = true;

  const section = document.querySelector('.trust-parallax');
  if (!section) {
    return;
  }

  section.style.setProperty('--trust-parallax-y', '0px');
  section.style.setProperty('--trust-panel-y', '0px');

  const pathname = window.location.pathname || '/';
  const disableParallaxOnHeavyRoutes = /^\/(?:scam|zpp|auto-law)(?:\/|$)/.test(pathname);
  const disableParallaxOnCompact = window.matchMedia && window.matchMedia('(max-width: 980px)').matches;
  if (disableParallaxOnCompact || disableParallaxOnHeavyRoutes) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const applyParallax = ({ deltaY, viewportHeight }) => {
    if (Math.abs(deltaY) < 1) return 0;
    const rect = section.getBoundingClientRect();
    if (rect.bottom <= -80 || rect.top >= viewportHeight + 80) return 0;

    const centerOffset = viewportHeight * 0.5 - (rect.top + rect.height * 0.5);
    const next = Math.max(-28, Math.min(28, centerOffset * 0.05));
    const nextPx = `${next.toFixed(2)}px`;
    if (section.style.getPropertyValue('--trust-parallax-y') === nextPx) return 0;
    section.style.setProperty('--trust-parallax-y', nextPx);
    return 1;
  };

  onScrollRaf(applyParallax, { minDelta: 6 });
  onResizeRaf((snapshot) => applyParallax({ ...snapshot, deltaY: 2 }));
}

/* ==========================================================
   FIND PARALLAX (для секции "Как нас найти")
   ========================================================== */
function initFindParallax() {
  if (window.__findParallaxInitialized) return;
  window.__findParallaxInitialized = true;

  const section = document.querySelector('.investment-find');
  if (!section) {
    return;
  }

  const parallaxElements = section.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) return;

  const pathname = window.location.pathname || '/';
  const disableParallaxOnHeavyRoutes = /^\/(?:scam|zpp|auto-law)(?:\/|$)/.test(pathname);
  const disableParallaxOnCompact = window.matchMedia && window.matchMedia('(max-width: 980px)').matches;
  if (disableParallaxOnCompact || disableParallaxOnHeavyRoutes) {
    parallaxElements.forEach((el) => {
      el.style.setProperty('--parallax-y', '0px');
      el.classList.remove('is-parallax-active');
    });
    return;
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    parallaxElements.forEach((el) => {
      el.style.setProperty('--parallax-y', '0px');
      el.classList.remove('is-parallax-active');
    });
    return;
  }

  const speeds = Array.from(parallaxElements, (el) => {
    const raw = parseFloat(el.dataset.parallaxSpeed || '0.18');
    const speed = Number.isFinite(raw) ? raw : 0.18;
    return Math.max(0.05, Math.min(0.35, speed));
  });
  const lastValues = new WeakMap();
  let sectionInView = false;

  const resetParallaxElements = () => {
    let updated = 0;
    parallaxElements.forEach((el) => {
      if (lastValues.get(el) !== '0px') {
        el.style.setProperty('--parallax-y', '0px');
        el.classList.remove('is-parallax-active');
        lastValues.set(el, '0px');
        updated += 1;
      }
    });
    return updated;
  };

  const applyParallax = ({ deltaY, viewportHeight }) => {
    if (Math.abs(deltaY) < 1) return 0;

    const sectionRect = section.getBoundingClientRect();
    const visibleNow = sectionRect.bottom > -140 && sectionRect.top < viewportHeight + 140;
    if (!visibleNow) {
      const changed = sectionInView ? resetParallaxElements() : 0;
      sectionInView = false;
      return changed;
    }
    sectionInView = true;

    const reads = [];
    parallaxElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      reads.push({ el, rect, speed: speeds[index] });
    });

    let updated = 0;
    reads.forEach(({ el, rect, speed }) => {
      const active = rect.bottom > -120 && rect.top < viewportHeight + 120;
      if (!active) {
        if (lastValues.get(el) !== '0px') {
          el.style.setProperty('--parallax-y', '0px');
          el.classList.remove('is-parallax-active');
          lastValues.set(el, '0px');
          updated += 1;
        }
        return;
      }

      const elementCenter = rect.top + rect.height * 0.5;
      const viewportCenter = viewportHeight * 0.5;
      const shift = Math.max(-36, Math.min(36, (viewportCenter - elementCenter) * speed * 0.16));
      const next = `${shift.toFixed(2)}px`;
      if (lastValues.get(el) === next) return;
      el.style.setProperty('--parallax-y', next);
      el.classList.add('is-parallax-active');
      lastValues.set(el, next);
      updated += 1;
    });

    return updated;
  };

  onScrollRaf(applyParallax, { minDelta: 8 });
  onResizeRaf((snapshot) => applyParallax({ ...snapshot, deltaY: 2 }));
}

function getUserCountryCode() {
  const fromLocale = (locale) => {
    if (!locale || typeof locale !== 'string') return '';
    const parts = locale.replace('_', '-').split('-');
    const region = parts.find((p) => /^[A-Z]{2}$/.test(p.toUpperCase()));
    return region ? region.toUpperCase() : '';
  };

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const cc = fromLocale(intlLocale);
    if (cc) return cc;
  } catch (e) {}

  try {
    const navLocale = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    const cc = fromLocale(navLocale);
    if (cc) return cc;
  } catch (e) {}

  try {
    const htmlLang = (document.documentElement && document.documentElement.lang) || '';
    const cc = fromLocale(htmlLang);
    if (cc) return cc;
  } catch (e) {}

  return 'RU';
}

function getPhonePrefixByCountry(countryCode) {
  const map = {
    RU: '+7',
    BY: '+375',
    KZ: '+7',
    UA: '+380',
    AM: '+374',
    GE: '+995',
    AZ: '+994',
    UZ: '+998',
    KG: '+996',
    TJ: '+992',
    MD: '+373',
    US: '+1',
    CA: '+1'
  };
  return map[countryCode] || '+7';
}

function ensureToastStack() {
  let stack = document.querySelector('.keis-toast-stack');
  if (stack) return stack;
  stack = document.createElement('div');
  stack.className = 'keis-toast-stack';
  stack.setAttribute('aria-live', 'polite');
  stack.setAttribute('aria-atomic', 'true');
  document.body.appendChild(stack);
  return stack;
}

function showKeisToast(message, ttl = 2600) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = 'keis-toast';
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  const close = () => {
    toast.classList.remove('is-visible');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 220);
  };

  setTimeout(close, ttl);
}

function ensureInlineErrorEl(inputEl) {
  if (!inputEl || !inputEl.parentElement) return null;
  inputEl.parentElement.classList.add('keis-error-anchor');
  let errorEl = inputEl.parentElement.querySelector('.keis-inline-error');
  if (errorEl) return errorEl;
  errorEl = document.createElement('div');
  errorEl.className = 'keis-inline-error';
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.setAttribute('role', 'status');
  inputEl.parentElement.appendChild(errorEl);
  return errorEl;
}

function clearVisibleInlineErrors(exceptErrorEl = null) {
  const visibleErrors = Array.from(document.querySelectorAll('.keis-inline-error.is-visible'));
  visibleErrors.forEach((errorEl) => {
    if (!errorEl || errorEl === exceptErrorEl) return;
    const inputEl = errorEl.parentElement
      ? errorEl.parentElement.querySelector('input, textarea, select')
      : null;
    if (inputEl) {
      clearInlineError(inputEl);
      return;
    }
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  });
}

function clearInlineError(inputEl) {
  if (!inputEl || !inputEl.parentElement) return;
  inputEl.classList.remove('keis-input-error');
  inputEl.removeAttribute('aria-invalid');
  const errorEl = inputEl.parentElement.querySelector('.keis-inline-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  }
}

function setInlineError(inputEl, message) {
  if (!inputEl) return;
  const errorEl = ensureInlineErrorEl(inputEl);
  inputEl.classList.add('keis-input-error');
  inputEl.setAttribute('aria-invalid', 'true');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
  }
}

function getPhoneLengthByCountry(countryCode) {
  const map = {
    RU: 10,
    KZ: 10,
    US: 10,
    CA: 10,
    BY: 9,
    UA: 9,
    AM: 8,
    GE: 9,
    AZ: 9,
    UZ: 9,
    KG: 9,
    TJ: 9,
    MD: 8
  };
  return map[countryCode] || 10;
}

function getPhoneRulesFromValue(rawValue) {
  const digits = String(rawValue || '').replace(/\D/g, '');
  if (!digits) return { exact: 10, national: '' };
  let national = digits;
  if (national.startsWith('8') || national.startsWith('7')) {
    national = national.slice(1);
  }
  return { exact: 10, national: national.slice(0, 10) };
}

function normalizePhoneInput(value) {
  const raw = String(value || '');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('8') || digits.startsWith('7')) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  let formatted = '+7';
  if (digits.length > 0) formatted += ` ${digits.slice(0, 3)}`;
  if (digits.length > 3) formatted += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += ` ${digits.slice(6, 8)}`;
  if (digits.length > 8) formatted += ` ${digits.slice(8, 10)}`;
  return formatted;
}

function getRawRuNationalLength(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 0;
  if (digits.startsWith('8') || digits.startsWith('7')) digits = digits.slice(1);
  return digits.length;
}

function showPhoneDigitsHint(inputEl) {
  const msg = 'Номер вводится только цифрами';
  setInlineError(inputEl, msg);
}

function applyPhonePrefixOnFocus(inputEl) {
  if (!inputEl) return;
  const current = normalizePhoneInput(inputEl.value);
  inputEl.value = current || '+7 ';
  requestAnimationFrame(() => {
    const len = (inputEl.value || '').length;
    try {
      inputEl.setSelectionRange(len, len);
    } catch (e) {}
  });
}

function validateRequiredLeadFields(form) {
  if (!form) return true;

  const pick = (selectors) => form.querySelector(selectors);
  const nameField = pick('input[name*="name" i], input[id*="name" i], input[type="text"]:not([name*="phone" i]):not([name*="tel" i])');
  const phoneField = pick('input[type="tel"], input[name*="phone" i], input[name*="tel" i]');
  const messageField = pick('textarea[name*="message" i], textarea[name*="description" i], textarea');

  [nameField, phoneField, messageField].forEach((field) => clearInlineError(field));

  if (nameField && !String(nameField.value || '').trim()) {
    const msg = 'Укажите ваше имя';
    setInlineError(nameField, msg);
    nameField.focus();
    return false;
  }
  if (phoneField && String(phoneField.value || '').replace(/\D/g, '').trim().length === 0) {
    const msg = 'Укажите ваш номер';
    setInlineError(phoneField, msg);
    phoneField.focus();
    return false;
  }
  if (phoneField) {
    if (phoneField.dataset.phoneOverflow === '1') {
      const msg = 'Проверьте номер: слишком много цифр';
      setInlineError(phoneField, msg);
      phoneField.focus();
      return false;
    }
    const { exact, national } = getPhoneRulesFromValue(phoneField.value || '');
    if (national.length < exact) {
      const msg = 'Проверьте номер: не хватает цифр';
      setInlineError(phoneField, msg);
      phoneField.focus();
      return false;
    }
    if (national.length > exact) {
      const msg = 'Проверьте номер: слишком много цифр';
      setInlineError(phoneField, msg);
      phoneField.focus();
      return false;
    }
  }
  if (messageField && !String(messageField.value || '').trim()) {
    const msg = 'Опишите вашу ситуацию';
    setInlineError(messageField, msg);
    messageField.focus();
    return false;
  }
  return true;
}

function initLeadFormsValidation() {
  if (!guardInit('lead-forms-validation')) return;

  const forms = Array.from(document.querySelectorAll('form'));
  forms.forEach((form) => {
    const pick = (selectors) => form.querySelector(selectors);
    const nameField = pick('input[name*="name" i], input[id*="name" i], input[type="text"]:not([name*="phone" i]):not([name*="tel" i])');
    const phoneField = pick('input[type="tel"], input[name*="phone" i], input[name*="tel" i]');
    const messageField = pick('textarea[name*="message" i], textarea[name*="description" i], textarea');
    const hasLeadFields = !!(nameField || phoneField || messageField);
    if (!hasLeadFields) return;

    form.setAttribute('novalidate', 'novalidate');
    if (nameField) nameField.required = true;
    if (phoneField) phoneField.required = true;
    if (messageField) messageField.required = true;

    [nameField, phoneField, messageField].forEach((field) => {
      if (!field) return;
      ensureInlineErrorEl(field);
      field.addEventListener('input', () => clearInlineError(field));
    });
  });

  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.keis-inline-error')) return;
      clearVisibleInlineErrors();
    },
    true
  );

  const phoneInputs = Array.from(document.querySelectorAll('input[type="tel"], input[name*="phone" i], input[name*="tel" i]'));
  phoneInputs.forEach((input) => {
    // KXchat has its own phone mask/caret logic, keep it isolated from global site formatter.
    if (input.id === 'kxchat-contact-phone' || input.closest('#kxchat-widget')) {
      return;
    }
    if (input.dataset.keisPrefixBound === '1') return;
    input.dataset.keisPrefixBound = '1';
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('autocomplete', 'tel');
    input.setAttribute('maxlength', '16');
    input.setAttribute('placeholder', input.getAttribute('placeholder') || 'Ваш номер');
    input.addEventListener('focus', () => applyPhonePrefixOnFocus(input));
    input.addEventListener('pointerdown', () => {
      requestAnimationFrame(() => applyPhonePrefixOnFocus(input));
    });
    input.addEventListener('paste', (e) => {
      const text = (e.clipboardData && e.clipboardData.getData('text')) || '';
      if (/[^\d+\s()\-]/.test(text)) {
        e.preventDefault();
        input.value = normalizePhoneInput(text);
        showPhoneDigitsHint(input);
        return;
      }
      requestAnimationFrame(() => {
        const rawNationalLen = getRawRuNationalLength(text);
        if (rawNationalLen > 10) {
          input.dataset.phoneOverflow = '1';
          setInlineError(input, 'Проверьте номер: слишком много цифр');
        } else {
          delete input.dataset.phoneOverflow;
        }
        const normalized = normalizePhoneInput(input.value);
        if (input.value !== normalized) input.value = normalized;
        if (rawNationalLen <= 10) clearInlineError(input);
      });
    });
    input.addEventListener('input', () => {
      const raw = input.value || '';
      const normalized = normalizePhoneInput(raw);
      const hasInvalidChars = /[^\d+\s()\-]/.test(raw);
      const rawNationalLen = getRawRuNationalLength(raw);
      if (rawNationalLen > 10) {
        input.dataset.phoneOverflow = '1';
        setInlineError(input, 'Проверьте номер: слишком много цифр');
      } else {
        delete input.dataset.phoneOverflow;
      }
      if (raw !== normalized) {
        input.value = normalized;
        if (hasInvalidChars) {
          showPhoneDigitsHint(input);
        } else if (rawNationalLen <= 10) {
          clearInlineError(input);
        }
      } else if (rawNationalLen <= 10) {
        clearInlineError(input);
      }
    });
  });

  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!validateRequiredLeadFields(form)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}

/* ==========================================================
   TELEGRAM LEADS (send forms to /api/telegram.php)
   - Works for contact modal form and hero form.
   - No layout changes; only JS submit interception.
   ========================================================== */
function initTelegramLeads() {
  if (window.__telegramLeadsInitialized) return;
  window.__telegramLeadsInitialized = true;

  const ENDPOINT = '/api/telegram.php';

  const forms = new Set();
  document.querySelectorAll('form').forEach((form) => {
    const action = (form.getAttribute('action') || '').toLowerCase();
    const isTelegramForm =
      action.includes('api/telegram.php') ||
      form.hasAttribute('data-tg-lead') ||
      form.hasAttribute('data-keis-lead');
    if (isTelegramForm) forms.add(form);
  });

  if (!forms.size) {
    return;
  }

  const toFormData = (form) => {
    const fd = new FormData(form);

    // Common field normalization (don't break existing names)
    const getAny = (...keys) => {
      for (const k of keys) {
        const v = fd.get(k);
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    };

    if (!fd.get('name')) fd.set('name', getAny('fullname', 'your_name', 'username'));
    if (!fd.get('phone')) fd.set('phone', getAny('tel', 'phone_number'));
    if (!fd.get('message')) fd.set('message', getAny('question', 'text', 'comment', 'situation'));

    // Helpful meta
    if (!fd.get('page')) fd.set('page', document.title || window.location.pathname);
    if (!fd.get('page_url')) fd.set('page_url', window.location.href);

    // Honeypot (must stay empty)
    if (!fd.get('website')) fd.set('website', '');

    return fd;
  };

  forms.forEach((form) => {
    // Avoid double binding
    if (form.dataset.tgBound === '1') return;
    form.dataset.tgBound = '1';

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const phoneInputs = Array.from(form.querySelectorAll('input[type="tel"], input[name*="phone" i], input[name*="tel" i]'));
    phoneInputs.forEach((input) => {
      if (input.dataset.keisPrefixBound === '1') return;
      input.dataset.keisPrefixBound = '1';
      input.addEventListener('focus', () => applyPhonePrefixOnFocus(input));
      input.addEventListener('pointerdown', () => {
        requestAnimationFrame(() => applyPhonePrefixOnFocus(input));
      });
    });
    const redirectToThanks = () => {
      window.location.href = '/thanks/';
    };

    const setSubmitting = (isSubmitting) => {
      form.dataset.tgSubmitting = isSubmitting ? '1' : '0';
      if (!submitBtn) return;
      submitBtn.disabled = isSubmitting;
      submitBtn.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    };

    const getFirstErrorAnchor = () => (
      form.querySelector('input[type="tel"], input[name*="phone" i], input[name*="tel" i]') ||
      form.querySelector('input, textarea, select')
    );

    const showSubmitError = (message) => {
      const target = getFirstErrorAnchor();
      if (target) {
        setInlineError(target, message);
      } else {
        showKeisToast(message, 4200);
      }
    };

    const sendLead = async (endpoint, fd) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: fd,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        throw new Error('bad_json');
      }

      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.error) || `http_${response.status}`);
      }

      return payload;
    };

    const onSubmit = async (e) => {
      if (!validateRequiredLeadFields(form)) {
        e.preventDefault();
        return;
      }
      // Let browser-level constraints (pattern/minlength/etc.) run after custom required checks
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;
      e.preventDefault();
      if (form.dataset.tgSubmitting === '1') return;

      const endpoint = form.getAttribute('action') || ENDPOINT;
      const fd = toFormData(form);

      setSubmitting(true);
      try {
        await sendLead(endpoint, fd);
        saveThanksReturnState();
        form.reset();
        clearVisibleInlineErrors();
        redirectToThanks();
      } catch (error) {
        if (isDev()) console.warn('[telegramLeads] submit failed', error);
        showSubmitError('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.');
        setSubmitting(false);
      }
    };

    form.addEventListener('submit', onSubmit);
  });
}

/* ==========================================================
   SUCCESS MODAL: Подтверждение отправки формы
   ========================================================== */
// ЗАДАЧА 2: Сохраняем scrollY для success modal
let savedSuccessScrollY = 0;
let savedSuccessScrollX = 0;
let lastSuccessClickCoords = null;
const SUCCESS_MODAL_VIEWPORT_GAP = 24;
const SUBMIT_POINTER_EVENT = 'PointerEvent' in window ? 'pointerdown' : 'mousedown';

const captureSubmitPointer = (evt) => {
  const target = evt.target;
  if (!(target instanceof Element)) return;
  const submitEl = target.closest('button[type="submit"], input[type="submit"], [data-keis-submit]');
  if (!submitEl) return;
  if (!submitEl.closest('form')) return;
  lastSuccessClickCoords = {
    x: typeof evt.clientX === 'number' ? evt.clientX : window.innerWidth / 2,
    y: typeof evt.clientY === 'number' ? evt.clientY : window.innerHeight / 2,
  };
};

if (!window.__keisSubmitPointerTrackerInitialized) {
  document.addEventListener(SUBMIT_POINTER_EVENT, captureSubmitPointer, { passive: true });
  window.__keisSubmitPointerTrackerInitialized = true;
}

const restoreInstantScroll = (x, y) => {
  const docEl = document.documentElement;
  const body = document.body;
  const prevDocBehavior = docEl.style.scrollBehavior;
  const prevBodyBehavior = body.style.scrollBehavior;
  docEl.style.scrollBehavior = 'auto';
  body.style.scrollBehavior = 'auto';
  window.scrollTo(x, y);
  if (prevDocBehavior) {
    docEl.style.scrollBehavior = prevDocBehavior;
  } else {
    docEl.style.removeProperty('scroll-behavior');
  }
  if (prevBodyBehavior) {
    body.style.scrollBehavior = prevBodyBehavior;
  } else {
    body.style.removeProperty('scroll-behavior');
  }
};

function openSuccessModal(options = {}) {
  const { forceCenter = false } = options;
  const successModal = document.getElementById('successModal');
  if (!successModal) return;

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;

  const desiredPosition = forceCenter
    ? { x: viewportWidth / 2, y: viewportHeight / 2 }
    : (lastSuccessClickCoords || { x: viewportWidth / 2, y: viewportHeight / 2 });

  const initialX = clampValue(
    desiredPosition.x,
    SUCCESS_MODAL_VIEWPORT_GAP,
    Math.max(SUCCESS_MODAL_VIEWPORT_GAP, viewportWidth - SUCCESS_MODAL_VIEWPORT_GAP)
  );
  const initialY = clampValue(
    desiredPosition.y,
    SUCCESS_MODAL_VIEWPORT_GAP,
    Math.max(SUCCESS_MODAL_VIEWPORT_GAP, viewportHeight - SUCCESS_MODAL_VIEWPORT_GAP)
  );

  successModal.style.setProperty('--success-modal-left', `${initialX}px`);
  successModal.style.setProperty('--success-modal-top', `${initialY}px`);

  // Сохраняем текущую позицию скролла
  {
    const bodyTop = parseFloat(document.body.style.top || '0');
    if (document.body.style.position === 'fixed' && Number.isFinite(bodyTop) && bodyTop !== 0) {
      savedSuccessScrollY = Math.max(0, Math.round(-bodyTop));
    } else {
      savedSuccessScrollY = Math.max(
        0,
        Math.round(
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0
        )
      );
    }
  }
  savedSuccessScrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
  
  successModal.classList.add('is-open');
  successModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('success-modal-open');
  
  // Lock background scroll (iOS-safe and stable across desktop pages in this project)
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedSuccessScrollY}px`;
  document.body.style.width = '100%';

  const panel = successModal.querySelector('.keis-success-modal__panel');
  if (panel) {
    const schedule = (window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) || ((cb) => setTimeout(cb, 0));
    const ensureWithinViewport = () => {
      const rect = panel.getBoundingClientRect();
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      const clampWithHalfSize = (value, halfSize, viewportSize) => {
        const min = halfSize + SUCCESS_MODAL_VIEWPORT_GAP;
        const max = viewportSize - halfSize - SUCCESS_MODAL_VIEWPORT_GAP;
        if (max <= min) {
          return viewportSize / 2;
        }
        return clampValue(value, min, max);
      };
      const safeX = clampWithHalfSize(desiredPosition.x, halfWidth, viewportWidth);
      const safeY = clampWithHalfSize(desiredPosition.y, halfHeight, viewportHeight);
      successModal.style.setProperty('--success-modal-left', `${safeX}px`);
      successModal.style.setProperty('--success-modal-top', `${safeY}px`);
    };
    schedule(ensureWithinViewport);
  }

  lastSuccessClickCoords = null;
}

window.keisShowConfirmAt = (x, y) => {
  if (typeof x === 'number' && typeof y === 'number') {
    lastSuccessClickCoords = { x, y };
  }
  openSuccessModal();
};

function closeSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  successModal.classList.remove('is-open');
  successModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('success-modal-open');
  
  // ЗАДАЧА 2: Восстанавливаем scrollY без анимации
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  restoreInstantScroll(savedSuccessScrollX, savedSuccessScrollY);
  savedSuccessScrollY = 0;
  savedSuccessScrollX = 0;
}
/* ==========================================================
   COUNTER ANIMATION для KGX stories trust bridge
   Анимация счетчика от 1 млн до 200 млн+ при скролле к блоку
   ========================================================== */
function initCounterAnimation() {
  if (window.__counterAnimationInitialized) return;
  window.__counterAnimationInitialized = true;

  const counters = document.querySelectorAll('.kgx-stories__trust-bridge-counter');
  if (!counters.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Если пользователь предпочитает уменьшенную анимацию, просто показываем финальное значение
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target || '200000000', 10);
      const valueEl = counter.querySelector('.kgx-stories__trust-bridge-counter-value');
      if (valueEl) {
        const millions = Math.floor(target / 1000000);
        valueEl.textContent = millions.toLocaleString('ru-RU');
      }
    });
    return;
  }

  const animateCounter = (counter) => {
    if (counter.dataset.animated === 'true') return; // Уже анимирован
    counter.dataset.animated = 'true';

    const target = parseInt(counter.dataset.target || '200000000', 10);
    const valueEl = counter.querySelector('.kgx-stories__trust-bridge-counter-value');
    const suffixEl = counter.querySelector('.kgx-stories__trust-bridge-counter-suffix');
    const labelEl = counter.querySelector('.kgx-stories__trust-bridge-counter-label');
    if (!valueEl) return;

    const start = 1000000; // 1 млн
    const end = target; // 200 млн
    const duration = 2000; // 2 секунды
    const startTime = performance.now();

    const formatNumber = (num) => {
      const millions = Math.floor(num / 1000000);
      return millions.toLocaleString('ru-RU');
    };

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing функция для плавной анимации
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const current = start + (end - start) * easedProgress;
      valueEl.textContent = formatNumber(current);

      // показать суффикс и подпись при приближении к финалу
      const revealAt = 0.6;
      const revealElement = (el) => {
        if (!el) return;
        el.classList.add('is-visible');
        try {
          el.style.opacity = '1';
          el.style.transform = '';
        } catch (e) {}
      };

      if (progress >= revealAt) {
        revealElement(suffixEl);
        revealElement(labelEl);
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Финальное значение
        valueEl.textContent = formatNumber(end);
        revealElement(suffixEl);
        revealElement(labelEl);
      }
    };

    requestAnimationFrame(update);
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3 // Анимация запускается когда 30% блока видно
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        animateCounter(counter);
        observer.unobserve(counter); // Отключаем наблюдение после анимации
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

/* ==========================================================
   BRIDGE COUNTERS: Анимация счетчиков в keis-bridge
   Анимация метрик при скролле к блоку (money: 1 млн → 200 млн+, years: 1 → 30 лет+)
   ========================================================== */
function initBridgeCounters() {
  if (window.__bridgeCountersInitialized) return;
  window.__bridgeCountersInitialized = true;

  const metrics = document.querySelectorAll('.keis-bridge__metric[data-bridge-counter]');
  if (!metrics.length) {
    return;
  }

  const settingsByType = {
    money: { target: 400, duration: 1100 },
    years: { target: 30, duration: 900 },
    cases: { target: 1700, duration: 1200 },
  };

  const getTargetValue = (metric, counterType) => {
    const fallback = settingsByType[counterType]?.target ?? 0;
    const parsed = parseFloat(metric.dataset.target);
    if (!Number.isNaN(parsed)) return parsed;
    return fallback;
  };

  const markMetricDone = (metric, numberEl, finalValue) => {
    if (numberEl) numberEl.textContent = String(finalValue);
    metric.classList.add('is-done');
    const parentBridge = metric.closest('.keis-bridge');
    if (parentBridge) parentBridge.classList.add('is-done');
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    metrics.forEach(metric => {
      const counterType = metric.dataset.bridgeCounter;
      const valueEl = metric.querySelector('[data-counter-value]');
      if (!valueEl) return;

      const numberEl = valueEl.querySelector('.keis-bridge__metric-number') || valueEl;
      const finalValue = Math.max(0, Math.round(getTargetValue(metric, counterType)));
      markMetricDone(metric, numberEl, finalValue);
    });
    return;
  }

  // Easing функция для плавной анимации
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateMetric = (metric) => {
    if (metric.dataset.animated === 'true') return; // Уже анимирован
    metric.dataset.animated = 'true';

    const counterType = metric.dataset.bridgeCounter;
    const settings = settingsByType[counterType];
    if (!settings) return;

    const valueEl = metric.querySelector('[data-counter-value]');
    const numberEl = (valueEl && (valueEl.querySelector('.keis-bridge__metric-number') || valueEl.querySelector('.kgx-stories__trust-bridge-counter-value'))) || valueEl;
    if (!valueEl || !numberEl) return;

    const finalValue = Math.max(0, Math.round(getTargetValue(metric, counterType)));
    const duration = settings.duration;
    const startValue = 0;
    const endValue = finalValue;

    const formatValue = (num) => Math.round(num).toString();

    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * easedProgress;

      numberEl.textContent = formatValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        markMetricDone(metric, numberEl, finalValue);
      }
    };

    requestAnimationFrame(update);
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.4 // Анимация запускается когда 40% блока видно
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const metric = entry.target;
        animateMetric(metric);
        observer.unobserve(metric); // Отключаем наблюдение после анимации
      }
    });
  }, observerOptions);

  metrics.forEach(metric => {
    observer.observe(metric);
  });
}

/* ==========================================================
   SUCCESS MODAL: close handlers (shown after submit)
   ========================================================== */
function initSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  const closers = successModal.querySelectorAll('[data-close-success-modal]');
  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSuccessModal();
    });
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successModal.classList.contains('is-open')) {
      closeSuccessModal();
    }
  });
}


/* ==========================================================
   YANDEX METRIKA: init without inline scripts
   ========================================================== */
function initYandexMetrika() {
  const id = 106061151;

  // Only init on pages that include tag.js in HTML (keeps behavior predictable).
  const existing = document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]');
  if (!existing) {
    return;
  }

  // Provide the queue function if ym is not available yet (mirrors official snippet behavior).
  if (typeof window.ym !== 'function') {
    window.ym = function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = 1 * new Date();
  }

  try {
    window.ym(id, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  } catch (_) {
    // no-op (blocked by browser/extension)
  }
}


/* ==========================================================
   TICKER: lightweight initTicker() — clones content for seamless scroll
   - stores original HTML in data-original
   - duplicates until width >= viewport*2
   - debounced resize via requestAnimationFrame
   - sets data-anim to enable CSS animation
   ========================================================== */
/* initTicker removed — running ticker disabled per request */

/* =========================
   Left sticky ask (desktop)
   ========================= */
function initLeftStickyAsk() {
  try {
    if (window.__kgObsidianDriftInitialized) return;
    window.__kgObsidianDriftInitialized = true;

    const path = window.location.pathname || '';
    const isTargetPage = /\/(scam|zpp)\//.test(path);
    if (!isTargetPage) return;

    const viewportBlock = window.matchMedia('(max-width: 980px)');
    if (viewportBlock.matches) return;

    const isDismissed = () => false; // show on every load (no session persistence)

    const rawSections = Array.from(document.querySelectorAll('main section, body > section, section'));
    if (!rawSections.length) return;

    const techSelectors = ['.kg-mm', '.modal', '.overlay', '.popup', '.tg-widget', '.drawer'];
    const seen = new Set();
    const contentSections = rawSections.filter((section) => {
      if (!(section instanceof HTMLElement)) return false;
      if (seen.has(section)) return false;
      seen.add(section);
      if (section.closest('[aria-hidden="true"]')) return false;
      if (techSelectors.some((sel) => section.closest(sel) || section.matches(sel))) return false;
      const style = window.getComputedStyle(section);
      if (!style) return false;
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (style.position === 'fixed' || style.position === 'absolute') return false;
      return true;
    });

    const thirdSection = contentSections[2];
    if (!thirdSection || !document.body) return;

    let wrap = document.querySelector('.kg-obsidian-drift');
    if (!wrap) {
      wrap = document.createElement('div');
      document.body.appendChild(wrap);
    }
    wrap.className = 'kg-obsidian-drift is-hidden';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'kg-obsidian-drift__panel';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kg-obsidian-drift__close';
    closeBtn.setAttribute('aria-label', 'Закрыть блок');

    const eyebrow = document.createElement('div');
    eyebrow.className = 'kg-obsidian-drift__eyebrow';
    eyebrow.textContent = '';

    const title = document.createElement('p');
    title.className = 'kg-obsidian-drift__title';
    title.textContent = 'За 10 минут общения с нашим юристом Вы узнаете больше, чем за 5 дней поиска в интернете';

    const actions = document.createElement('div');
    actions.className = 'kg-obsidian-drift__actions';

    const askBtn = document.createElement('button');
    askBtn.type = 'button';
    askBtn.className = 'kg-obsidian-drift__btn';
    askBtn.textContent = 'консультация';

    actions.appendChild(askBtn);
    panel.append(closeBtn, eyebrow, title, actions);
    wrap.appendChild(panel);

    const state = {
      hasShown: false,
      dismissed: false,
      autoHidden: false,
    };
    const target = contentSections[8];
    if (!target) return;
    const storiesSection = document.getElementById('kgx-stories-carousel');
    let storiesBlockActive = false;
    let autoCloseObserver = null;
    let autoCloseFallbackActive = false;

    const setAriaVisible = (visible) => wrap.setAttribute('aria-hidden', visible ? 'false' : 'true');
    const disconnectAutoCloseObserver = () => {
      if (!autoCloseObserver) return;
      autoCloseObserver.disconnect();
      autoCloseObserver = null;
    };

    const hide = ({ persist = false, reason = 'manual', immediate = false, markAuto = false } = {}) => {
      if (persist && state.dismissed) return;
      if (markAuto && state.autoHidden) return;
      wrap.classList.remove('is-hidden');
      wrap.classList.remove('is-visible');
      wrap.classList.add('is-hiding');
      setAriaVisible(false);
      if (markAuto) {
        state.autoHidden = true;
        disconnectAutoCloseObserver();
      }
      if (persist) {
        state.dismissed = true;
        disconnectAutoCloseObserver();
      }
      const finalizeHide = () => {
        wrap.classList.remove('is-hiding');
        wrap.classList.add('is-hidden');
      };
      if (immediate) {
        finalizeHide();
        return;
      }
      const onTransitionEnd = (event) => {
        if (event.target !== wrap || (event.propertyName !== 'transform' && event.propertyName !== 'opacity')) return;
        wrap.removeEventListener('transitionend', onTransitionEnd);
        finalizeHide();
      };
      wrap.addEventListener('transitionend', onTransitionEnd);
      if (isDev()) console.debug('[obsidian-drift] hide', reason);
    };

    const show = () => {
      if (state.dismissed || state.hasShown || viewportBlock.matches) return;
      state.hasShown = true;
      if (storiesBlockActive) {
        wrap.classList.remove('is-visible', 'is-hiding');
        wrap.classList.add('is-hidden');
        setAriaVisible(false);
        return;
      }
      wrap.classList.remove('is-hidden', 'is-hiding');
      wrap.classList.add('is-visible');
      setAriaVisible(true);
      if (autoCloseFallbackActive) scheduleAutoCheck();
    };

    const hideForStories = () => {
      if (!state.hasShown || state.dismissed) return;
      wrap.classList.remove('is-visible', 'is-hiding');
      wrap.classList.add('is-hidden');
      setAriaVisible(false);
    };

    const restoreAfterStories = () => {
      if (!state.hasShown || state.dismissed || state.autoHidden || viewportBlock.matches || storiesBlockActive) return;
      wrap.classList.remove('is-hidden', 'is-hiding');
      wrap.classList.add('is-visible');
      setAriaVisible(true);
    };

    const checkAutoClose = () => {
      if (!state.hasShown || state.dismissed) return;
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const midpoint = viewportHeight * 0.55;
      if (rect.top < midpoint && rect.bottom > midpoint) {
        hide({ reason: 'auto-9th', markAuto: true });
      }
    };

    const scheduleAutoCheck = createRafThrottle(checkAutoClose);
    if ('IntersectionObserver' in window) {
      autoCloseObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== target) return;
          if (!entry.isIntersecting || !state.hasShown || state.dismissed || state.autoHidden) return;
          hide({ reason: 'auto-9th', markAuto: true });
        });
      }, {
        threshold: 0,
        root: null,
        rootMargin: '-55% 0px -45% 0px',
      });
      autoCloseObserver.observe(target);
    } else {
      autoCloseFallbackActive = true;
    }

    if (storiesSection && 'IntersectionObserver' in window) {
      const storiesObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== storiesSection) return;
          storiesBlockActive = entry.isIntersecting;
          if (storiesBlockActive) hideForStories();
          else restoreAfterStories();
        });
      }, {
        threshold: 0,
        root: null,
        rootMargin: '-12% 0px -12% 0px',
      });
      storiesObserver.observe(storiesSection);
    }

    const sentinel = document.createElement('div');
    sentinel.className = 'kg-obsidian-drift__sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'display:block;width:100%;height:2px;margin-top:2px;pointer-events:none;';
    thirdSection.appendChild(sentinel);

    let revealObserver = null;
    const triggerReveal = () => {
      if (state.hasShown || state.dismissed || viewportBlock.matches) return;
      const rect = sentinel.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (rect.bottom <= viewportHeight) {
        show();
        if (revealObserver) revealObserver.disconnect();
      }
    };

    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== sentinel) return;
          if (entry.isIntersecting) {
            show();
            revealObserver.disconnect();
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
      revealObserver.observe(sentinel);
    } else {
      const scheduleRevealCheck = createRafThrottle(triggerReveal);
      triggerReveal();
      onScrollRaf(() => {
        scheduleRevealCheck();
        return 1;
      }, { minDelta: 1 });
      onResizeRaf(() => {
        scheduleRevealCheck();
        return 1;
      });
    }

    const openContactModal = () => {
      if (typeof window.__keisOpenContactModal === 'function') {
        window.__keisOpenContactModal();
        return;
      }
      document.querySelector('[data-open-contact-modal]')?.click();
    };

    closeBtn.addEventListener('click', () => hide({ persist: true, reason: 'manual' }));
    askBtn.addEventListener('click', () => {
      hide({ persist: true, reason: 'cta' });
      setTimeout(openContactModal, 120);
    });

    const applyViewportBlock = (e) => {
      if (!viewportBlock.matches) return;
      hide({ immediate: true, reason: e ? 'resize' : 'init', markAuto: true });
      disconnectAutoCloseObserver();
      if (revealObserver) revealObserver.disconnect();
    };
    applyViewportBlock();
    if (typeof viewportBlock.addEventListener === 'function') {
      viewportBlock.addEventListener('change', applyViewportBlock);
    } else if (typeof viewportBlock.addListener === 'function') {
      viewportBlock.addListener(applyViewportBlock);
    }

    const swipeState = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
    };

    const resetSwipe = () => {
      swipeState.active = false;
      swipeState.pointerId = null;
      swipeState.startX = 0;
      swipeState.startY = 0;
    };

    panel.addEventListener('pointerdown', (event) => {
      if (state.dismissed || viewportBlock.matches) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeState.active = true;
      swipeState.pointerId = event.pointerId;
      swipeState.startX = event.clientX;
      swipeState.startY = event.clientY;
    }, { passive: true });

    panel.addEventListener('pointermove', (event) => {
      if (!swipeState.active || event.pointerId !== swipeState.pointerId) return;
      const dx = event.clientX - swipeState.startX;
      const dy = event.clientY - swipeState.startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
        resetSwipe();
        return;
      }
      if (dx <= -60 && Math.abs(dx) > Math.abs(dy)) {
        resetSwipe();
        hide({ persist: true, reason: 'swipe' });
      }
    }, { passive: true });

    if (autoCloseFallbackActive) {
      onScrollRaf(() => {
        scheduleAutoCheck();
        return 1;
      }, { minDelta: 1 });
      onResizeRaf(() => {
        scheduleAutoCheck();
        return 1;
      });
    }

    panel.addEventListener('pointerup', (event) => {
      if (event.pointerId === swipeState.pointerId) resetSwipe();
    }, { passive: true });
    panel.addEventListener('pointercancel', (event) => {
      if (event.pointerId === swipeState.pointerId) resetSwipe();
    }, { passive: true });

    // Auto-hide strictly on the 9th visible content section; no extra anchors.

  } catch (e) {
    console.warn('[initLeftStickyAsk] failed:', e);
  }
}
