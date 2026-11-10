/* ==========================================================================
   ATHELIN THEME JAVASCRIPT
   Micro-interactions, Swatches, Skeletons, and Smooth Preloader
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Variant Circle Switching (Hover & Click with Variant Image & Metadata Sync)
  function handleSwatchSwitch(btn) {
    var card = btn.closest('[data-product-card]');
    if (!card) return;

    var siblings = btn.parentElement.querySelectorAll('.product-card__swatch');
    siblings.forEach(function (s) { s.classList.remove('product-card__swatch--active'); });
    btn.classList.add('product-card__swatch--active');

    var varId = btn.getAttribute('data-variant-id');
    if (varId) {
      card.setAttribute('data-variant-id', varId);
    }

    var varPrice = btn.getAttribute('data-variant-price');
    if (varPrice) {
      var priceEl = card.querySelector('.product-card__price');
      if (priceEl) priceEl.textContent = varPrice;
      card.setAttribute('data-product-price', varPrice);
    }

    var rawUrl = btn.getAttribute('data-variant-img');
    if (!rawUrl) return;

    var imgUrl = rawUrl;
    if (imgUrl.indexOf('//') === 0) {
      imgUrl = window.location.protocol + imgUrl;
    }

    // Ensure any secondary hover image is hidden
    var secondaryImg = card.querySelector('.product-card__image--secondary');
    if (secondaryImg) {
      secondaryImg.style.display = 'none';
      secondaryImg.style.opacity = '0';
      secondaryImg.style.visibility = 'hidden';
    }
    card.classList.add('is-swatched');

    var mainImg = card.querySelector('[data-main-image]');
    if (mainImg && mainImg.src !== imgUrl && mainImg.getAttribute('src') !== rawUrl) {
      mainImg.removeAttribute('srcset');
      mainImg.src = imgUrl;
      card.setAttribute('data-product-image', imgUrl);
      mainImg.addEventListener('load', function () {
        adaptCardBackground(card);
      }, { once: true });
    }
  }

  // Adaptive Card Background: detects product image corner color and matches card background
  function adaptCardBackground(card) {
    var img = card.querySelector('[data-main-image]');
    if (!img) return;

    function detectColor() {
      if (!img.naturalWidth || !img.naturalHeight) return;
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 16, 16);

        var samples = [
          ctx.getImageData(0, 0, 1, 1).data,
          ctx.getImageData(15, 0, 1, 1).data,
          ctx.getImageData(0, 15, 1, 1).data,
          ctx.getImageData(15, 15, 1, 1).data
        ];

        var valid = samples.filter(function (s) { return s[3] > 180; });
        if (valid.length >= 2) {
          var sumR = 0, sumG = 0, sumB = 0;
          valid.forEach(function (s) {
            sumR += s[0];
            sumG += s[1];
            sumB += s[2];
          });
          var r = Math.round(sumR / valid.length);
          var g = Math.round(sumG / valid.length);
          var b = Math.round(sumB / valid.length);

          var wrap = card.querySelector('.product-card__image-wrap');
          if (r >= 246 && g >= 246 && b >= 246) {
            var whiteCol = '#ffffff';
            if (wrap) {
              wrap.style.setProperty('--product-image-bg', whiteCol);
              wrap.style.backgroundColor = whiteCol;
            }
          } else if (r >= 140 && g >= 140 && b >= 140 && Math.abs(r - g) <= 22 && Math.abs(r - b) <= 22) {
            var rgbCol = 'rgb(' + r + ', ' + g + ', ' + b + ')';
            if (wrap) {
              wrap.style.setProperty('--product-image-bg', rgbCol);
              wrap.style.backgroundColor = rgbCol;
            }
          }
        }
      } catch (e) {
        // Fallback already styled via Liquid / CSS
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      detectColor();
    } else {
      img.addEventListener('load', detectColor, { once: true });
    }
  }

  // Initialize adaptive background on all product cards
  document.querySelectorAll('[data-product-card]').forEach(function (c) {
    adaptCardBackground(c);
  });

  // Preload card swatch images on mouseenter for instantaneous switching
  document.addEventListener('mouseenter', function (e) {
    var card = e.target.closest && e.target.closest('[data-product-card]');
    if (card && !card.dataset.preloaded) {
      card.dataset.preloaded = 'true';
      var swatches = card.querySelectorAll('.product-card__swatch[data-variant-img]');
      swatches.forEach(function (s) {
        var u = s.getAttribute('data-variant-img');
        if (u) {
          if (u.indexOf('//') === 0) u = window.location.protocol + u;
          var img = new Image();
          img.src = u;
        }
      });
    }
  }, true);

  document.addEventListener('mouseover', function (e) {
    var btn = e.target.closest('.product-card__swatch');
    if (btn) {
      handleSwatchSwitch(btn);
    }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.product-card__swatch');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      handleSwatchSwitch(btn);
    }
  });

  // 2. Wishlist System (LocalStorage + Badges + Wishlist Page)
  initAthelinWishlist();

  // 2b. Quick Cart Slide-Over Drawer & Full Cart Page
  initAthelinCart();

  // 2c. Search Page Tabs, Sorting & Stock Filtering
  initAthelinSearchPage();

  // 2d. Mobile Hamburger Category Drawer & Scroll-Aware Bottom Navigation
  initAthelinMobileNav();

  // 2e. Home Featured Collections (Garmin Watches & Shoes) New Arrivals Continuous Shuffle
  initAthelinFeaturedShuffle();

  // 2f. Product Compare System (PDP Compare Section + /pages/compare Search & Matrix)
  initAthelinCompare();

  // 2g. Contact Us & Interactive Route Simulator (/pages/contact)
  initAthelinContactPage();

  // 3. Trending Tags Draggable Carousel & Click Filter
  var trendingTagsContainer = document.querySelector('.trending-bar__tags');
  if (trendingTagsContainer) {
    var isDown = false;
    var startX = 0;
    var scrollLeftPos = 0;
    var hasMoved = false;

    trendingTagsContainer.addEventListener('mousedown', function (e) {
      isDown = true;
      hasMoved = false;
      trendingTagsContainer.classList.add('is-dragging');
      startX = e.pageX - trendingTagsContainer.offsetLeft;
      scrollLeftPos = trendingTagsContainer.scrollLeft;
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      trendingTagsContainer.classList.remove('is-dragging');
      setTimeout(function () {
        hasMoved = false;
      }, 50);
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - trendingTagsContainer.offsetLeft;
      var walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
      }
      trendingTagsContainer.scrollLeft = scrollLeftPos - walk;
    });

    var trendingTags = trendingTagsContainer.querySelectorAll('.trending-bar__tag');
    trendingTags.forEach(function (tag) {
      tag.addEventListener('click', function (e) {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        var query = this.textContent.trim();
        var searchInput = document.querySelector('.athelin-header__search-input');
        if (searchInput) {
          searchInput.value = query;
        }
      });
    });
  }

  // 4. Skeleton Crossfade to Content
  var skeletons = document.querySelectorAll('.product-card--skeleton');
  if (skeletons.length > 0) {
    setTimeout(function () {
      skeletons.forEach(function (sk) {
        sk.style.transition = 'opacity 0.4s ease';
        sk.style.opacity = '0';
        setTimeout(function () { sk.remove(); }, 400);
      });
    }, 400);
  }

  // 5. Google Reviews Single-Slide 3-Second Carousel & Live Fetcher
  initGoogleReviewsTicker();

  // 6. Brand Marquee Click / Touch Pause Interaction
  initBrandMarquee();
});

function initBrandMarquee() {
  var marquee = document.querySelector('[data-brand-marquee]');
  if (!marquee) return;

  // Toggle pause on click when clicking the marquee background or track
  marquee.addEventListener('click', function (e) {
    if (e.target.closest('.brand-marquee__item')) {
      return; // Allow the brand link to navigate to the collection
    }
    this.classList.toggle('is-paused');
  });

  // Mobile touch: pause when touched so user can select a brand without it moving away
  var touchTimer = null;
  marquee.addEventListener('touchstart', function () {
    marquee.classList.add('is-paused');
    if (touchTimer) clearTimeout(touchTimer);
  }, { passive: true });

  marquee.addEventListener('touchend', function () {
    touchTimer = setTimeout(function () {
      marquee.classList.remove('is-paused');
    }, 3500);
  }, { passive: true });
}

function initGoogleReviewsTicker() {
  var ticker = document.querySelector('[data-reviews-ticker]');
  if (!ticker) return;

  var intervalMs = parseInt(ticker.getAttribute('data-interval') || '3000', 10);
  if (isNaN(intervalMs) || intervalMs < 1000) intervalMs = 3000;

  var placeId = ticker.getAttribute('data-place-id');
  var apiKey = ticker.getAttribute('data-api-key');
  var proxyUrl = ticker.getAttribute('data-proxy-url');

  var track = ticker.querySelector('[data-reviews-track]');
  var prevBtn = ticker.querySelector('[data-review-prev]');
  var nextBtn = ticker.querySelector('[data-review-next]');
  var dotsContainer = ticker.querySelector('[data-reviews-dots]');
  var progressBar = ticker.querySelector('[data-reviews-progress]');

  var currentIndex = 0;
  var timer = null;
  var isHovered = false;

  function getSlides() {
    return ticker.querySelectorAll('.reviews-ticker__slide');
  }

  function setupDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    var slides = getSlides();
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reviews-ticker__dot' + (i === currentIndex ? ' is-active' : '');
      dot.setAttribute('aria-label', 'View review ' + (i + 1));
      dot.addEventListener('click', function () {
        goToSlide(i);
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateSlideDisplay() {
    var slides = getSlides();
    if (slides.length === 0) return;

    slides.forEach(function (slide, i) {
      if (i === currentIndex) {
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.classList.remove('is-active');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    if (dotsContainer) {
      var dots = dotsContainer.querySelectorAll('.reviews-ticker__dot');
      dots.forEach(function (dot, i) {
        if (i === currentIndex) {
          dot.classList.add('is-active');
        } else {
          dot.classList.remove('is-active');
        }
      });
    }

    resetProgressBar();
  }

  function goToSlide(index) {
    var slides = getSlides();
    if (slides.length === 0) return;
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }
    updateSlideDisplay();
    restartTimer();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function resetProgressBar() {
    if (!progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    void progressBar.offsetWidth; // Force reflow
    if (!isHovered) {
      progressBar.style.transition = 'width ' + intervalMs + 'ms linear';
      progressBar.style.width = '100%';
    }
  }

  function startTimer() {
    stopTimer();
    resetProgressBar();
    timer = setInterval(function () {
      if (!isHovered) {
        nextSlide();
      }
    }, intervalMs);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (progressBar) {
      progressBar.style.transition = 'none';
    }
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  // Prev / Next arrow controls
  if (prevBtn) {
    prevBtn.addEventListener('click', function (e) {
      e.preventDefault();
      prevSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      nextSlide();
    });
  }

  // Pause on hover
  ticker.addEventListener('mouseenter', function () {
    isHovered = true;
    if (progressBar) {
      var computedWidth = window.getComputedStyle(progressBar).width;
      progressBar.style.transition = 'none';
      progressBar.style.width = computedWidth;
    }
  });

  ticker.addEventListener('mouseleave', function () {
    isHovered = false;
    restartTimer();
  });

  // Touch Swipe for mobile
  var touchStartX = 0;
  ticker.addEventListener('touchstart', function (e) {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartX = e.changedTouches[0].screenX;
    }
  }, { passive: true });

  ticker.addEventListener('touchend', function (e) {
    if (e.changedTouches && e.changedTouches[0]) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (diff > 45) {
        nextSlide();
      } else if (diff < -45) {
        prevSlide();
      }
    }
  }, { passive: true });

  // Init dots and start 3s autoplay
  setupDots();
  startTimer();

  // Live Review Fetcher (Google Places API / Custom Worker Proxy)
  fetchLiveGoogleReviews(ticker, placeId, apiKey, proxyUrl, function (newReviews, overallRating, totalRatings) {
    if (newReviews && newReviews.length > 0 && track) {
      renderFetchedReviews(track, newReviews);
      if (overallRating) {
        var scoreEl = ticker.querySelector('[data-rating-score]');
        if (scoreEl) scoreEl.textContent = Number(overallRating).toFixed(1);
      }
      if (totalRatings) {
        var countEl = ticker.querySelector('[data-rating-count]');
        if (countEl) countEl.textContent = '(' + Number(totalRatings).toLocaleString() + '+ reviews)';
      }
      currentIndex = 0;
      setupDots();
      updateSlideDisplay();
      restartTimer();
    }
  });
}

function fetchLiveGoogleReviews(ticker, placeId, apiKey, proxyUrl, callback) {
  var targetUrl = '';
  if (proxyUrl) {
    targetUrl = proxyUrl + (proxyUrl.indexOf('?') !== -1 ? '&' : '?') + (placeId ? 'place_id=' + encodeURIComponent(placeId) : '');
  } else if (placeId && apiKey) {
    targetUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + encodeURIComponent(placeId) + '&fields=rating,user_ratings_total,reviews&key=' + encodeURIComponent(apiKey);
  }

  if (!targetUrl) return;

  fetch(targetUrl, { method: 'GET' })
    .then(function (res) {
      if (!res.ok) throw new Error('Network response not ok');
      return res.json();
    })
    .then(function (data) {
      var reviews = [];
      var overallRating = null;
      var totalRatings = null;

      if (data.result) {
        reviews = data.result.reviews || [];
        overallRating = data.result.rating;
        totalRatings = data.result.user_ratings_total;
      } else if (Array.isArray(data.reviews)) {
        reviews = data.reviews;
        overallRating = data.rating;
        totalRatings = data.user_ratings_total || data.total_reviews;
      } else if (Array.isArray(data)) {
        reviews = data;
      }

      if (reviews && reviews.length > 0) {
        callback(reviews, overallRating, totalRatings);
      }
    })
    .catch(function () {
      // Graceful fallback to verified reviews
      console.info('[Athelin Google Reviews] Loaded verified athlete reviews.');
    });
}

function renderFetchedReviews(track, reviews) {
  track.innerHTML = '';
  reviews.forEach(function (rev, idx) {
    var slide = document.createElement('div');
    slide.className = 'reviews-ticker__slide' + (idx === 0 ? ' is-active' : '');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (idx + 1) + ' of ' + reviews.length);
    slide.setAttribute('aria-hidden', idx === 0 ? 'false' : 'true');

    var stars = '★★★★★';
    if (rev.rating && rev.rating < 5) {
      var full = Math.max(1, Math.floor(rev.rating));
      stars = '★'.repeat(full) + '☆'.repeat(5 - full);
    }

    var author = escapeHtml(rev.author_name || 'Verified Athlete');
    var text = escapeHtml(rev.text || '');
    if (text.length > 130) {
      text = text.slice(0, 127) + '...';
    }
    var time = escapeHtml(rev.relative_time_description || 'Recently');

    slide.innerHTML =
      '<div class="reviews-ticker__item">' +
        '<span class="reviews-ticker__item-stars">' + stars + '</span>' +
        '<p class="reviews-ticker__item-quote">“' + text + '”</p>' +
        '<div class="reviews-ticker__item-author">' +
          '<strong class="reviews-ticker__author-name">' + author + '</strong>' +
          '<span class="reviews-ticker__badge-verified">' +
            '<svg viewBox="0 0 16 16" width="11" height="11" fill="#22c55e" aria-hidden="true"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>' +
            'Verified Buyer' +
          '</span>' +
          '<span class="reviews-ticker__item-time">' + time + '</span>' +
        '</div>' +
      '</div>';

    track.appendChild(slide);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}



/* ==========================================================================
   ATHELIN GLOBAL TOAST, WISHLIST SYSTEM & QUICK CART / CART PAGE CONTROLLER
   ========================================================================== */

function showAthelinToast(message) {
  var toast = document.querySelector('.athelin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'athelin-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '<span class="athelin-toast__badge">✓</span> <span>' + escapeHtml(message) + '</span>';
  toast.classList.add('is-visible');
  if (toast._hideTimer) clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () {
    toast.classList.remove('is-visible');
  }, 2800);
}

function formatInrMoney(cents) {
  var rupees = Math.round((Number(cents) || 0) / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

/* --------------------------------------------------------------------------
   WISHLIST SYSTEM (LOCALSTORAGE PERSISTENCE + PAGE RENDERING)
   -------------------------------------------------------------------------- */
var WISHLIST_STORAGE_KEY = 'athelin_wishlist_v1';

function getWishlistItems() {
  try {
    var raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveWishlistItems(items) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
}

function syncWishlistUI() {
  var items = getWishlistItems();
  var count = items.length;

  // Update header badge
  document.querySelectorAll('[data-wishlist-count]').forEach(function (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });

  // Update all product cards & PDP heart buttons
  document.querySelectorAll('[data-wishlist-btn]').forEach(function (btn) {
    var card = btn.closest('[data-product-card]');
    if (!card) return;
    var pid = card.getAttribute('data-product-id') || card.getAttribute('data-product-handle');
    var isSaved = items.some(function (it) {
      return (pid && (it.id === pid || it.handle === pid)) || (it.title && it.title === card.getAttribute('data-product-title'));
    });
    if (isSaved) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Render Wishlist Page if present
  renderWishlistPage();
}

function extractProductFromCard(card) {
  if (!card) return null;
  var titleEl = card.querySelector('.product-card__title a') || card.querySelector('.product-buy-box__title');
  var priceEl = card.querySelector('.product-card__price') || card.querySelector('[data-product-price]');
  var emiEl = card.querySelector('.product-card__emi') || card.querySelector('[data-product-emi]');
  var imgEl = card.querySelector('[data-main-image]') || card.querySelector('.product-card__image');
  var specsEl = card.querySelector('.product-card__specs');
  var brandEl = card.querySelector('.product-card__brand');
  var swatchesEl = card.querySelector('.product-card__swatches');

  var id = card.getAttribute('data-product-id') || '';
  var handle = card.getAttribute('data-product-handle') || '';
  var title = card.getAttribute('data-product-title') || (titleEl ? titleEl.textContent.trim() : 'Endurance Gear');
  var vendor = card.getAttribute('data-product-vendor') || card.getAttribute('data-brand') || 'ATHELIN';
  var url = card.getAttribute('data-product-url') || (titleEl && titleEl.getAttribute('href') ? titleEl.getAttribute('href') : '/collections/all');
  var image = card.getAttribute('data-product-image') || (imgEl ? imgEl.getAttribute('src') : '');
  var price = card.getAttribute('data-product-price') || (priceEl ? priceEl.textContent.trim() : '₹19,000');
  var emi = card.getAttribute('data-product-emi') || (emiEl ? emiEl.textContent.trim() : '');
  var specs = card.getAttribute('data-product-specs') || (specsEl ? specsEl.textContent.trim() : 'Performance Gear');
  var variantId = card.getAttribute('data-variant-id') || '';
  var brandKey = card.getAttribute('data-brand') || vendor.toLowerCase();
  var surface = card.getAttribute('data-surface') || 'road';
  var cushioning = card.getAttribute('data-cushioning') || 'plush';
  var size = card.getAttribute('data-size') || '9';
  var priceRaw = card.getAttribute('data-price') || '1900000';
  var rating = parseFloat(card.getAttribute('data-product-rating') || '0') || 0;
  var ratingCount = parseInt(card.getAttribute('data-product-rating-count') || '0', 10) || 0;
  var brandHtml = brandEl ? brandEl.innerHTML : '';
  var swatchesHtml = swatchesEl ? swatchesEl.innerHTML : '';

  if (!id) {
    id = handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  return {
    id: String(id),
    handle: String(handle || id),
    title: title,
    vendor: vendor,
    url: url,
    image: image,
    price: price,
    emi: emi,
    specs: specs,
    variantId: variantId,
    brandKey: brandKey,
    surface: surface,
    cushioning: cushioning,
    size: size,
    priceRaw: priceRaw,
    rating: rating,
    ratingCount: ratingCount,
    brandHtml: brandHtml,
    swatchesHtml: swatchesHtml
  };
}

function toggleWishlistItem(productObj) {
  if (!productObj || !productObj.id) return false;
  var items = getWishlistItems();
  var existingIdx = items.findIndex(function (it) {
    return it.id === productObj.id || (productObj.handle && it.handle === productObj.handle);
  });

  var added = false;
  if (existingIdx > -1) {
    items.splice(existingIdx, 1);
  } else {
    items.unshift(productObj);
    added = true;
  }
  saveWishlistItems(items);
  syncWishlistUI();
  return added;
}

function renderWishlistPage() {
  // Support 404 fallback route if /pages/wishlist hasn't been created in Shopify admin yet
  var wishlist404Wrap = document.querySelector('[data-404-wishlist-wrapper]');
  var default404Wrap = document.querySelector('[data-404-default-wrapper]');
  if (wishlist404Wrap && window.location.pathname.toLowerCase().indexOf('wishlist') !== -1) {
    wishlist404Wrap.style.display = 'block';
    if (default404Wrap) default404Wrap.style.display = 'none';
    document.title = 'Saved Gear Wishlist — Athelin';
  }

  var pageContainer = document.querySelector('[data-wishlist-page]');
  if (!pageContainer) return;

  // Ensure we use the visible wishlist container if multiple exist
  var visibleContainers = document.querySelectorAll('[data-wishlist-page]');
  visibleContainers.forEach(function (c) {
    if (c.offsetParent !== null) pageContainer = c;
  });

  var grid = pageContainer.querySelector('[data-wishlist-grid]');
  var fallbackGrid = pageContainer.querySelector('[data-wishlist-fallback-grid]');
  var emptyState = pageContainer.querySelector('[data-wishlist-empty]');
  var countEl = pageContainer.querySelector('[data-wishlist-page-count]');
  var toolbar = pageContainer.querySelector('[data-wishlist-toolbar]');

  var items = getWishlistItems();
  if (countEl) {
    countEl.textContent = items.length + (items.length === 1 ? ' item' : ' items');
  }

  if (items.length === 0) {
    if (grid) {
      grid.style.display = 'none';
      grid.removeAttribute('data-collection-grid');
    }
    if (toolbar) toolbar.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    if (fallbackGrid) {
      fallbackGrid.style.display = 'grid';
      fallbackGrid.setAttribute('data-collection-grid', '');
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (fallbackGrid) {
    fallbackGrid.style.display = 'none';
    fallbackGrid.removeAttribute('data-collection-grid');
  }
  if (toolbar) toolbar.style.display = 'flex';
  if (grid) {
    grid.style.display = 'grid';
    grid.setAttribute('data-collection-grid', '');
    grid.innerHTML = items.map(function (item) {
      var emiHtml = item.emi
        ? '<span class="product-card__emi">' + escapeHtml(item.emi) + '</span>'
        : '';
      var brandContent = item.brandHtml
        ? item.brandHtml
        : '<span class="product-card__vendor">' + escapeHtml(item.vendor || 'ATHELIN') + '</span>';
      var numericPrice = item.priceRaw || String(item.price || '19000').replace(/[^0-9]/g, '') + '00';
      var bKey = item.brandKey || String(item.vendor || 'garmin').toLowerCase();

      var cleanSwatchesHtml = '';
      if (item.swatchesHtml) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.swatchesHtml;
        var seenColors = {};
        tempDiv.querySelectorAll('.product-card__swatch').forEach(function (btn) {
          var bg = (btn.style && btn.style.backgroundColor ? btn.style.backgroundColor : btn.getAttribute('style') || '').toLowerCase().trim();
          if (bg && !seenColors[bg]) {
            seenColors[bg] = true;
            cleanSwatchesHtml += btn.outerHTML;
          }
        });
      }

      return (
        '<div class="product-card" ' +
          'data-product-card ' +
          'data-wishlist-card-id="' + escapeHtml(item.id) + '" ' +
          'data-product-id="' + escapeHtml(item.id) + '" ' +
          'data-product-handle="' + escapeHtml(item.handle || item.id) + '" ' +
          'data-product-title="' + escapeHtml(item.title) + '" ' +
          'data-product-vendor="' + escapeHtml(item.vendor || 'ATHELIN') + '" ' +
          'data-product-url="' + escapeHtml(item.url || '/collections/all') + '" ' +
          'data-product-image="' + escapeHtml(item.image || '') + '" ' +
          'data-product-price="' + escapeHtml(item.price || '') + '" ' +
          'data-product-emi="' + escapeHtml(item.emi || '') + '" ' +
          'data-product-specs="' + escapeHtml(item.specs || '') + '" ' +
          'data-variant-id="' + escapeHtml(item.variantId || '') + '" ' +
          'data-brand="' + escapeHtml(bKey) + '" ' +
          'data-surface="' + escapeHtml(item.surface || 'road') + '" ' +
          'data-cushioning="' + escapeHtml(item.cushioning || 'plush') + '" ' +
          'data-size="' + escapeHtml(item.size || '9') + '" ' +
          'data-price="' + escapeHtml(numericPrice) + '" ' +
          'data-available="true"' +
        '>' +
          '<div class="product-card__image-wrap">' +
            '<span class="product-card__badge product-card__badge--in-stock">In stock</span>' +
            '<a href="' + escapeHtml(item.url || '/collections/all') + '" class="product-card__image-link" aria-label="' + escapeHtml(item.title) + '">' +
              '<img src="' + escapeHtml(item.image || '') + '" alt="' + escapeHtml(item.title) + '" class="product-card__image product-card__image--primary" data-main-image loading="lazy">' +
            '</a>' +
            '<button type="button" class="product-card__wishlist active" data-wishlist-remove="' + escapeHtml(item.id) + '" aria-label="Remove from wishlist" title="Remove from wishlist">' +
              '<svg class="icon-heart-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
            '</button>' +
          '</div>' +
          '<div class="product-card__details">' +
            '<div class="product-card__header-meta">' +
              '<div class="product-card__brand">' + brandContent + '</div>' +
              (Number(item.rating) > 0 && Number(item.ratingCount) > 0
                ? '<div class="product-card__rating">' +
                    '<span class="product-card__stars">' +
                      '★'.repeat(Math.min(5, Math.max(1, Math.round(Number(item.rating))))) +
                      '☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(Number(item.rating))))) +
                    '</span>' +
                    '<span class="product-card__rating-count">' + escapeHtml(String(item.ratingCount)) + '</span>' +
                  '</div>'
                : '') +
            '</div>' +
            '<h3 class="product-card__title"><a href="' + escapeHtml(item.url || '/collections/all') + '">' + escapeHtml(item.title) + '</a></h3>' +
            '<div class="product-card__specs">' + escapeHtml(item.specs || 'Road · Plush · 8mm drop') + '</div>' +
            '<div class="product-card__pricing">' +
              '<span class="product-card__price">' + escapeHtml(item.price || '') + '</span>' +
              emiHtml +
            '</div>' +
            (cleanSwatchesHtml ? '<div class="product-card__swatches" data-swatches>' + cleanSwatchesHtml + '</div>' : '') +
            '<button type="button" class="product-card__bag-btn" data-wishlist-move-to-bag="' + escapeHtml(item.id) + '" data-variant-id="' + escapeHtml(item.variantId || '') + '" data-product-url="' + escapeHtml(item.url || '/collections/all') + '">' +
              '<span>Move to Bag</span>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
}

function initAthelinWishlist() {
  syncWishlistUI();

  // Delegate clicks for heart buttons, wishlist remove, move to bag, clear all, add all
  document.addEventListener('click', function (e) {
    // 1. Heart Toggle on Product Card / PDP
    var heartBtn = e.target.closest('[data-wishlist-btn]');
    if (heartBtn) {
      e.preventDefault();
      e.stopPropagation();
      var card = heartBtn.closest('[data-product-card]');
      var productObj = extractProductFromCard(card);
      if (productObj) {
        var added = toggleWishlistItem(productObj);
        showAthelinToast(added ? 'Saved ' + productObj.title + ' to wishlist' : 'Removed from wishlist');
      } else {
        heartBtn.classList.toggle('active');
      }
      var svg = heartBtn.querySelector('svg');
      if (svg) {
        svg.style.transform = 'scale(1.35)';
        setTimeout(function () {
          svg.style.transform = 'scale(1)';
        }, 200);
      }
      return;
    }

    // 2. Remove single item from Wishlist Page
    var removeBtn = e.target.closest('[data-wishlist-remove]');
    if (removeBtn) {
      e.preventDefault();
      var removeId = removeBtn.getAttribute('data-wishlist-remove');
      var list = getWishlistItems().filter(function (it) { return it.id !== removeId; });
      saveWishlistItems(list);
      syncWishlistUI();
      showAthelinToast('Removed item from wishlist');
      return;
    }

    // 3. Move item from Wishlist Page to Bag
    var moveBtn = e.target.closest('[data-wishlist-move-to-bag]');
    if (moveBtn) {
      e.preventDefault();
      var variantId = moveBtn.getAttribute('data-variant-id');
      var prodUrl = moveBtn.getAttribute('data-product-url');
      if (variantId && /^\d+$/.test(variantId)) {
        moveBtn.disabled = true;
        var spanEl = moveBtn.querySelector('span');
        if (spanEl) spanEl.textContent = 'Adding...';
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ id: Number(variantId), quantity: 1 })
        })
          .then(function (r) { return r.json(); })
          .then(function () {
            moveBtn.disabled = false;
            if (spanEl) spanEl.textContent = 'Move to Bag';
            if (window.AthelinCart) window.AthelinCart.refreshAndOpen();
          })
          .catch(function () {
            window.location.href = prodUrl || '/collections/all';
          });
      } else {
        window.location.href = prodUrl || '/collections/all';
      }
      return;
    }

    // 4. Clear All Wishlist
    var clearBtn = e.target.closest('[data-wishlist-clear-all]');
    if (clearBtn) {
      e.preventDefault();
      saveWishlistItems([]);
      syncWishlistUI();
      showAthelinToast('Wishlist cleared');
      return;
    }

    // 5. Add All Wishlist to Bag
    var addAllBtn = e.target.closest('[data-wishlist-add-all]');
    if (addAllBtn) {
      e.preventDefault();
      var allItems = getWishlistItems();
      var validVariants = allItems
        .filter(function (it) { return it.variantId && /^\d+$/.test(String(it.variantId)); })
        .map(function (it) { return { id: Number(it.variantId), quantity: 1 }; });

      if (validVariants.length > 0) {
        addAllBtn.disabled = true;
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ items: validVariants })
        })
          .then(function () {
            addAllBtn.disabled = false;
            if (window.AthelinCart) window.AthelinCart.refreshAndOpen();
          })
          .catch(function () {
            addAllBtn.disabled = false;
          });
      } else if (allItems.length > 0 && allItems[0].url) {
        window.location.href = allItems[0].url;
      }
      return;
    }

    // 6. Save for later inside Cart Page
    var saveForLaterBtn = e.target.closest('[data-cart-save-wishlist]');
    if (saveForLaterBtn) {
      e.preventDefault();
      var pObj = {
        id: saveForLaterBtn.getAttribute('data-product-id') || saveForLaterBtn.getAttribute('data-product-handle'),
        handle: saveForLaterBtn.getAttribute('data-product-handle') || '',
        title: saveForLaterBtn.getAttribute('data-product-title') || 'Saved Gear',
        vendor: saveForLaterBtn.getAttribute('data-product-vendor') || 'ATHELIN',
        url: saveForLaterBtn.getAttribute('data-product-url') || '/collections/all',
        image: saveForLaterBtn.getAttribute('data-product-image') || '',
        price: saveForLaterBtn.getAttribute('data-product-price') || '',
        emi: saveForLaterBtn.getAttribute('data-product-emi') || '',
        specs: 'Saved from Bag',
        variantId: saveForLaterBtn.getAttribute('data-variant-id') || ''
      };
      var currentList = getWishlistItems();
      if (!currentList.some(function (it) { return it.id === pObj.id; })) {
        currentList.unshift(pObj);
        saveWishlistItems(currentList);
        syncWishlistUI();
      }
      var lineKey = saveForLaterBtn.getAttribute('data-line-key');
      if (lineKey && window.AthelinCart) {
        window.AthelinCart.changeLineQuantity(lineKey, 0);
      }
      showAthelinToast('Saved ' + pObj.title + ' to your wishlist');
    }
  });
}

/* --------------------------------------------------------------------------
   QUICK CART SLIDE-OVER DRAWER & FULL CART PAGE CONTROLLER
   -------------------------------------------------------------------------- */
var FREE_SHIPPING_THRESHOLD_CENTS = 200000; // ₹2,000 in paise

function initAthelinCart() {
  var quickCart = document.querySelector('[data-quick-cart]');

  function openQuickCart() {
    if (!quickCart) return;
    quickCart.classList.add('is-open');
    quickCart.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickCart() {
    if (!quickCart) return;
    quickCart.classList.remove('is-open');
    quickCart.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderCartState(cart) {
    if (!cart) return;
    var count = cart.item_count || 0;
    var totalCents = cart.total_price || 0;
    var remainingCents = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - totalCents);
    var progressPct = count === 0 ? 0 : Math.min(100, Math.round((totalCents * 100) / FREE_SHIPPING_THRESHOLD_CENTS));
    var totalFormatted = formatInrMoney(totalCents);
    var emiFormatted = formatInrMoney(Math.round(totalCents / 3)) + '/mo';

    // 1. Header Cart Badges
    document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });

    // 2. Quick Cart Drawer Updates
    if (quickCart) {
      var qcCount = quickCart.querySelector('[data-quick-cart-count]');
      if (qcCount) qcCount.textContent = count;

      var qcShippingText = quickCart.querySelector('[data-quick-cart-shipping-text]');
      var qcShippingFill = quickCart.querySelector('[data-quick-cart-shipping-fill]');
      if (qcShippingText) {
        if (count === 0) {
          qcShippingText.innerHTML = '<span>Free express shipping on orders over <strong>₹2,000</strong></span>';
        } else if (remainingCents > 0) {
          qcShippingText.innerHTML = '<span>Add <strong>' + formatInrMoney(remainingCents) + '</strong> more to unlock <strong>FREE Shipping</strong></span>';
        } else {
          qcShippingText.innerHTML =
            '<span class="quick-cart__shipping-unlocked">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
              'You\'ve unlocked <strong>FREE Express Shipping</strong> &amp; Priority Dispatch!' +
            '</span>';
        }
      }
      if (qcShippingFill) {
        qcShippingFill.style.width = progressPct + '%';
        if (remainingCents === 0 && count > 0) {
          qcShippingFill.classList.add('is-complete');
        } else {
          qcShippingFill.classList.remove('is-complete');
        }
      }

      var qcItemsWrap = quickCart.querySelector('[data-quick-cart-items-wrap]');
      var qcItemsList = quickCart.querySelector('[data-quick-cart-items]');
      var qcEmpty = quickCart.querySelector('[data-quick-cart-empty]');
      var qcFooter = quickCart.querySelector('[data-quick-cart-footer]');
      var qcSubtotal = quickCart.querySelector('[data-quick-cart-subtotal]');
      var qcEmi = quickCart.querySelector('[data-quick-cart-emi]');

      if (qcSubtotal) qcSubtotal.textContent = totalFormatted;
      if (qcEmi) qcEmi.textContent = emiFormatted;

      if (count === 0) {
        if (qcItemsWrap) qcItemsWrap.style.display = 'none';
        if (qcFooter) qcFooter.style.display = 'none';
        if (qcEmpty) qcEmpty.style.display = 'flex';
      } else {
        if (qcEmpty) qcEmpty.style.display = 'none';
        if (qcItemsWrap) qcItemsWrap.style.display = 'flex';
        if (qcFooter) qcFooter.style.display = 'block';

        if (qcItemsList && Array.isArray(cart.items)) {
          qcItemsList.innerHTML = cart.items.map(function (item) {
            var linePrice = formatInrMoney(item.final_line_price);
            var lineEmi = formatInrMoney(Math.round(item.final_line_price / 3)) + '/mo';
            var variantTitle = item.variant_title && item.variant_title !== 'Default Title'
              ? '<p class="quick-cart__item-variant">' + escapeHtml(item.variant_title) + '</p>'
              : '';
            var imgSrc = item.image || '';
            return (
              '<div class="quick-cart__item" data-cart-item-key="' + escapeHtml(item.key) + '" data-variant-id="' + item.variant_id + '">' +
                '<a href="' + escapeHtml(item.url) + '" class="quick-cart__item-img-wrap">' +
                  '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(item.product_title || item.title) + '" width="72" height="72" class="quick-cart__item-img" loading="lazy">' +
                '</a>' +
                '<div class="quick-cart__item-info">' +
                  '<div class="quick-cart__item-top">' +
                    '<div>' +
                      '<span class="quick-cart__item-vendor">' + escapeHtml(item.vendor || 'ATHELIN') + '</span>' +
                      '<h3 class="quick-cart__item-title"><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.product_title || item.title) + '</a></h3>' +
                      variantTitle +
                    '</div>' +
                    '<button type="button" class="quick-cart__item-remove" data-quick-cart-remove="' + escapeHtml(item.key) + '" aria-label="Remove item">' +
                      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
                    '</button>' +
                  '</div>' +
                  '<div class="quick-cart__item-bottom">' +
                    '<div class="quick-cart__qty">' +
                      '<button type="button" class="quick-cart__qty-btn" data-quick-cart-qty-minus="' + escapeHtml(item.key) + '" data-current-qty="' + item.quantity + '" aria-label="Decrease quantity">−</button>' +
                      '<span class="quick-cart__qty-val" data-quick-cart-qty-val>' + item.quantity + '</span>' +
                      '<button type="button" class="quick-cart__qty-btn" data-quick-cart-qty-plus="' + escapeHtml(item.key) + '" data-current-qty="' + item.quantity + '" aria-label="Increase quantity">+</button>' +
                    '</div>' +
                    '<div class="quick-cart__item-pricing">' +
                      '<span class="quick-cart__item-price">' + linePrice + '</span>' +
                      '<span class="quick-cart__item-emi">or ' + lineEmi + '</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            );
          }).join('');
        }
      }
    }

    // 3. Full Cart Page Updates (if user is on /cart)
    var cartPage = document.querySelector('[data-cart-page]');
    if (cartPage) {
      var cpCount = cartPage.querySelector('[data-cart-page-count]');
      if (cpCount) cpCount.textContent = count + (count === 1 ? ' item' : ' items');

      var cpContent = cartPage.querySelector('[data-cart-page-content]');
      var cpEmpty = cartPage.querySelector('[data-cart-page-empty]');

      if (count === 0) {
        if (cpContent) cpContent.style.display = 'none';
        if (cpEmpty) cpEmpty.style.display = 'flex';
      } else {
        if (cpEmpty) cpEmpty.style.display = 'none';
        if (cpContent) cpContent.style.display = 'grid';

        var cpShipText = cartPage.querySelector('[data-cart-page-shipping-text]');
        var cpShipFill = cartPage.querySelector('[data-cart-page-shipping-fill]');
        if (cpShipText) {
          if (remainingCents > 0) {
            cpShipText.innerHTML = 'Add <strong>' + formatInrMoney(remainingCents) + '</strong> more to unlock <strong>FREE Express Shipping</strong>';
          } else {
            cpShipText.innerHTML = 'You\'ve unlocked <strong>FREE Express Courier Shipping</strong> &amp; Same-Day Dispatch!';
          }
        }
        if (cpShipFill) {
          cpShipFill.style.width = progressPct + '%';
          if (remainingCents === 0) {
            cpShipFill.classList.add('is-complete');
          } else {
            cpShipFill.classList.remove('is-complete');
          }
        }

        var cpSummaryCount = cartPage.querySelector('[data-cart-summary-count]');
        var cpSummarySubtotal = cartPage.querySelector('[data-cart-summary-subtotal]');
        var cpSummaryTotal = cartPage.querySelector('[data-cart-summary-total]');
        var cpSummaryEmi = cartPage.querySelector('[data-cart-summary-emi]');
        var cpSummaryShipping = cartPage.querySelector('[data-cart-summary-shipping]');

        if (cpSummaryCount) cpSummaryCount.textContent = count;
        if (cpSummarySubtotal) cpSummarySubtotal.textContent = formatInrMoney(cart.original_total_price || totalCents);
        if (cpSummaryTotal) cpSummaryTotal.textContent = totalFormatted;
        if (cpSummaryEmi) cpSummaryEmi.textContent = emiFormatted;
        if (cpSummaryShipping) {
          cpSummaryShipping.innerHTML = remainingCents === 0
            ? '<strong style="color: #10b981;">FREE</strong>'
            : 'Calculated at checkout';
        }

        // Update individual rows or remove deleted rows
        var existingRows = cartPage.querySelectorAll('[data-cart-page-item]');
        existingRows.forEach(function (row) {
          var rowKey = row.getAttribute('data-cart-page-item');
          var matchingItem = (cart.items || []).find(function (it) { return it.key === rowKey; });
          if (!matchingItem) {
            row.remove();
          } else {
            row.classList.remove('is-updating');
            var qtyInput = row.querySelector('[data-cart-page-input]');
            var minusBtn = row.querySelector('[data-cart-page-minus]');
            var plusBtn = row.querySelector('[data-cart-page-plus]');
            var linePriceEl = row.querySelector('[data-cart-item-line-price]');
            var lineEmiEl = row.querySelector('[data-cart-item-line-emi]');

            if (qtyInput) qtyInput.value = matchingItem.quantity;
            if (minusBtn) minusBtn.setAttribute('data-current-qty', matchingItem.quantity);
            if (plusBtn) plusBtn.setAttribute('data-current-qty', matchingItem.quantity);
            if (linePriceEl) linePriceEl.textContent = formatInrMoney(matchingItem.final_line_price);
            if (lineEmiEl) lineEmiEl.textContent = 'or ' + formatInrMoney(Math.round(matchingItem.final_line_price / 3)) + '/mo EMI';
          }
        });
      }
    }
  }

  function changeLineQuantity(lineKey, newQty) {
    if (!lineKey) return Promise.resolve();
    var qty = Math.max(0, parseInt(newQty, 10) || 0);

    // Add loading state
    var drawerRow = document.querySelector('[data-cart-item-key="' + CSS.escape(lineKey) + '"]');
    if (drawerRow) drawerRow.classList.add('is-updating');
    var pageRow = document.querySelector('[data-cart-page-item="' + CSS.escape(lineKey) + '"]');
    if (pageRow) pageRow.classList.add('is-updating');

    return fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ id: lineKey, quantity: qty })
    })
      .then(function (r) { return r.json(); })
      .then(function (updatedCart) {
        renderCartState(updatedCart);
        return updatedCart;
      })
      .catch(function (err) {
        console.error('Cart update failed:', err);
        if (drawerRow) drawerRow.classList.remove('is-updating');
        if (pageRow) pageRow.classList.remove('is-updating');
      });
  }

  function refreshAndOpen() {
    return fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderCartState(cart);
        openQuickCart();
      })
      .catch(function () {
        openQuickCart();
      });
  }

  // Expose global controller for PDP & Wishlist scripts
  window.AthelinCart = {
    open: openQuickCart,
    close: closeQuickCart,
    refreshAndOpen: refreshAndOpen,
    changeLineQuantity: changeLineQuantity,
    renderCartState: renderCartState
  };

  // Global Event Delegation for Quick Cart & Cart Page
  document.addEventListener('click', function (e) {
    // Open Quick Cart when clicking header bag icon (unless already on /cart page)
    var trigger = e.target.closest('[data-quick-cart-trigger]');
    if (trigger) {
      if (window.location.pathname === '/cart') return;
      e.preventDefault();
      refreshAndOpen();
      return;
    }

    // Close Quick Cart
    var closeTrigger = e.target.closest('[data-quick-cart-close]');
    if (closeTrigger) {
      e.preventDefault();
      closeQuickCart();
      return;
    }

    // Quick Cart Minus
    var qcMinus = e.target.closest('[data-quick-cart-qty-minus]');
    if (qcMinus) {
      e.preventDefault();
      var keyMinus = qcMinus.getAttribute('data-quick-cart-qty-minus');
      var curMinus = parseInt(qcMinus.getAttribute('data-current-qty'), 10) || 1;
      changeLineQuantity(keyMinus, curMinus - 1);
      return;
    }

    // Quick Cart Plus
    var qcPlus = e.target.closest('[data-quick-cart-qty-plus]');
    if (qcPlus) {
      e.preventDefault();
      var keyPlus = qcPlus.getAttribute('data-quick-cart-qty-plus');
      var curPlus = parseInt(qcPlus.getAttribute('data-current-qty'), 10) || 1;
      changeLineQuantity(keyPlus, curPlus + 1);
      return;
    }

    // Quick Cart Remove
    var qcRemove = e.target.closest('[data-quick-cart-remove]');
    if (qcRemove) {
      e.preventDefault();
      var keyRem = qcRemove.getAttribute('data-quick-cart-remove');
      changeLineQuantity(keyRem, 0);
      return;
    }

    // Quick Cart Upsell Add
    var qcUpsell = e.target.closest('[data-quick-add-variant]');
    if (qcUpsell) {
      e.preventDefault();
      var varId = qcUpsell.getAttribute('data-quick-add-variant');
      if (!varId) return;
      qcUpsell.disabled = true;
      qcUpsell.textContent = 'Adding...';
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ id: Number(varId), quantity: 1 })
      })
        .then(function () {
          qcUpsell.disabled = false;
          qcUpsell.textContent = '+ Add';
          refreshAndOpen();
          showAthelinToast('Added recommended gear to bag');
        })
        .catch(function () {
          qcUpsell.disabled = false;
          qcUpsell.textContent = '+ Add';
        });
      return;
    }

    // Cart Page Minus
    var cpMinus = e.target.closest('[data-cart-page-minus]');
    if (cpMinus) {
      e.preventDefault();
      var cpKeyM = cpMinus.getAttribute('data-cart-page-minus');
      var cpCurM = parseInt(cpMinus.getAttribute('data-current-qty'), 10) || 1;
      changeLineQuantity(cpKeyM, cpCurM - 1);
      return;
    }

    // Cart Page Plus
    var cpPlus = e.target.closest('[data-cart-page-plus]');
    if (cpPlus) {
      e.preventDefault();
      var cpKeyP = cpPlus.getAttribute('data-cart-page-plus');
      var cpCurP = parseInt(cpPlus.getAttribute('data-current-qty'), 10) || 1;
      changeLineQuantity(cpKeyP, cpCurP + 1);
      return;
    }

    // Cart Page Remove
    var cpRemove = e.target.closest('[data-cart-page-remove]');
    if (cpRemove) {
      e.preventDefault();
      var cpKeyR = cpRemove.getAttribute('data-cart-page-remove');
      changeLineQuantity(cpKeyR, 0);
      return;
    }

    // Cart Page Pincode Estimator
    var cpPinBtn = e.target.closest('[data-cart-pincode-btn]');
    if (cpPinBtn) {
      e.preventDefault();
      var pinValEl = document.querySelector('[data-cart-pincode-val]');
      var estEl = document.querySelector('[data-cart-delivery-est]');
      var currentPin = pinValEl ? pinValEl.textContent.trim() : '121003';
      var nextPin = prompt('Enter 6-digit delivery pincode:', currentPin);
      if (nextPin && /^\d{6}$/.test(nextPin.trim())) {
        if (pinValEl) pinValEl.textContent = nextPin.trim();
        if (estEl) estEl.textContent = 'Express 2–3 days';
        showAthelinToast('Delivery estimate updated for ' + nextPin.trim());
      }
    }
  });

  // Direct input change on Cart Page quantity field
  document.addEventListener('change', function (e) {
    var cpInput = e.target.closest('[data-cart-page-input]');
    if (cpInput) {
      var key = cpInput.getAttribute('data-cart-page-input');
      var val = parseInt(cpInput.value, 10);
      if (!isNaN(val) && val >= 0) {
        changeLineQuantity(key, val);
      }
    }
  });

  // Escape key closes Quick Cart
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && quickCart && quickCart.classList.contains('is-open')) {
      closeQuickCart();
    }
  });
}


/* --------------------------------------------------------------------------
   SEARCH PAGE CONTROLLER (RESULT TABS, SORTING & IN-STOCK FILTER)
   -------------------------------------------------------------------------- */
function initAthelinSearchPage() {
  var searchPage = document.querySelector('[data-search-page]');
  if (!searchPage) return;

  var tabs = searchPage.querySelectorAll('[data-search-tab]');
  var prodSection = searchPage.querySelector('[data-search-section="products"]');
  var contentSection = searchPage.querySelector('[data-search-section="content"]');
  var prodGrid = searchPage.querySelector('[data-search-products-grid]');
  var sortSelect = searchPage.querySelector('[data-search-sort]');
  var stockCheckbox = searchPage.querySelector('[data-search-in-stock-only]');

  // Store initial relevance order of product cards
  var originalCards = prodGrid ? Array.from(prodGrid.querySelectorAll('[data-product-card]')) : [];

  // 1. Tab Switching (All / Products / Guides & Pages)
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = this.getAttribute('data-search-tab');
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('is-active');
      this.setAttribute('aria-selected', 'true');

      if (target === 'all') {
        if (prodSection) prodSection.style.display = '';
        if (contentSection) contentSection.style.display = '';
      } else if (target === 'products') {
        if (prodSection) prodSection.style.display = '';
        if (contentSection) contentSection.style.display = 'none';
      } else if (target === 'content') {
        if (prodSection) prodSection.style.display = 'none';
        if (contentSection) contentSection.style.display = '';
      }
    });
  });

  // 2. Apply Sort & In-Stock Filter to Product Cards
  function applySearchFilters() {
    if (!prodGrid || originalCards.length === 0) return;

    var inStockOnly = stockCheckbox ? stockCheckbox.checked : false;
    var sortMode = sortSelect ? sortSelect.value : 'relevance';

    var list = originalCards.slice();

    if (sortMode === 'price-asc') {
      list.sort(function (a, b) {
        return (parseInt(a.getAttribute('data-price'), 10) || 0) - (parseInt(b.getAttribute('data-price'), 10) || 0);
      });
    } else if (sortMode === 'price-desc') {
      list.sort(function (a, b) {
        return (parseInt(b.getAttribute('data-price'), 10) || 0) - (parseInt(a.getAttribute('data-price'), 10) || 0);
      });
    } else if (sortMode === 'title-asc') {
      list.sort(function (a, b) {
        var tA = (a.getAttribute('data-product-title') || '').toLowerCase();
        var tB = (b.getAttribute('data-product-title') || '').toLowerCase();
        return tA.localeCompare(tB);
      });
    }

    prodGrid.innerHTML = '';
    list.forEach(function (card) {
      var isAvail = card.getAttribute('data-available') !== 'false';
      if (inStockOnly && !isAvail) {
        card.style.display = 'none';
      } else {
        card.style.display = '';
      }
      prodGrid.appendChild(card);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applySearchFilters);
  }
  if (stockCheckbox) {
    stockCheckbox.addEventListener('change', applySearchFilters);
  }
}

/* --------------------------------------------------------------------------
   MOBILE HAMBURGER CATEGORY DRAWER & SCROLL-AWARE BOTTOM NAVIGATION
   -------------------------------------------------------------------------- */
function initAthelinMobileNav() {
  var menuDrawer = document.querySelector('[data-mobile-menu-drawer]');
  var toggleBtns = document.querySelectorAll('[data-mobile-menu-toggle]');
  var closeBtns = document.querySelectorAll('[data-mobile-menu-close]');
  var bottomNav = document.querySelector('[data-mobile-bottom-nav]');

  function openMobileMenu() {
    if (!menuDrawer) return;
    menuDrawer.classList.add('is-open');
    menuDrawer.setAttribute('aria-hidden', 'false');
    toggleBtns.forEach(function (btn) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-expanded', 'true');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!menuDrawer) return;
    menuDrawer.classList.remove('is-open');
    menuDrawer.setAttribute('aria-hidden', 'true');
    toggleBtns.forEach(function (btn) {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.body.style.overflow = '';
  }

  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (menuDrawer && menuDrawer.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  });

  closeBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      closeMobileMenu();
    });
  });

  if (menuDrawer) {
    menuDrawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileMenu();
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuDrawer && menuDrawer.classList.contains('is-open')) {
      closeMobileMenu();
    }
  });

  // Ensure bottom navigation is never shown on Product Pages
  if (bottomNav) {
    var isProductPage =
      document.querySelector('[data-product-page]') !== null ||
      window.location.pathname.indexOf('/products/') !== -1;

    if (isProductPage) {
      bottomNav.remove();
      return;
    }

    // Disable / hide bottom navigation when scrolling
    var lastScrollY = window.scrollY || window.pageYOffset || 0;
    var ticking = false;

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            var currentScrollY = window.scrollY || window.pageYOffset || 0;
            var delta = currentScrollY - lastScrollY;

            if (currentScrollY <= 20) {
              bottomNav.classList.remove('is-scroll-hidden');
            } else if (delta > 4) {
              // Scrolling down -> disable and slide out bottom nav
              bottomNav.classList.add('is-scroll-hidden');
            } else if (delta < -6) {
              // Scrolling up -> re-enable bottom nav
              bottomNav.classList.remove('is-scroll-hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }
}

/* --------------------------------------------------------------------------
   HOME FEATURED COLLECTIONS (NEW ARRIVALS CONTINUOUS SHUFFLE)
   -------------------------------------------------------------------------- */
function initAthelinFeaturedShuffle() {
  var sections = document.querySelectorAll('[data-featured-shuffle-section]');
  if (!sections.length) return;

  function shuffleArray(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  sections.forEach(function (section, sectionIdx) {
    var grid = section.querySelector('[data-shuffle-grid]');
    var triggerBtn = section.querySelector('[data-shuffle-trigger]');
    if (!grid) return;

    var visibleLimit = parseInt(grid.getAttribute('data-visible-limit'), 10) || 4;
    var slots = Array.from(grid.querySelectorAll('[data-shuffle-slot]'));
    if (slots.length <= 1) return;

    var isPaused = false;
    var isAnimating = false;

    function performShuffle(animate) {
      if (isAnimating) return;
      slots = Array.from(grid.querySelectorAll('[data-shuffle-slot]'));
      if (slots.length <= 1) return;

      var shuffled = shuffleArray(slots);

      if (!animate) {
        shuffled.forEach(function (slot, idx) {
          if (idx < visibleLimit) {
            slot.classList.remove('is-shuffle-hidden');
          } else {
            slot.classList.add('is-shuffle-hidden');
          }
          grid.appendChild(slot);
        });
        return;
      }

      isAnimating = true;
      grid.classList.add('is-shuffling');
      if (triggerBtn) {
        triggerBtn.classList.add('is-spinning');
      }

      setTimeout(function () {
        shuffled.forEach(function (slot, idx) {
          if (idx < visibleLimit) {
            slot.classList.remove('is-shuffle-hidden');
          } else {
            slot.classList.add('is-shuffle-hidden');
          }
          grid.appendChild(slot);
        });

        requestAnimationFrame(function () {
          grid.classList.remove('is-shuffling');
          setTimeout(function () {
            isAnimating = false;
            if (triggerBtn) {
              triggerBtn.classList.remove('is-spinning');
            }
          }, 260);
        });
      }, 220);
    }

    // Initial random shuffle of newly added products on load
    performShuffle(false);

    // Manual shuffle button click
    if (triggerBtn) {
      triggerBtn.addEventListener('click', function (e) {
        e.preventDefault();
        performShuffle(true);
      });
    }

    // Pause automatic shuffling while user hovers or touches the section
    section.addEventListener('mouseenter', function () {
      isPaused = true;
    });
    section.addEventListener('mouseleave', function () {
      isPaused = false;
    });
    section.addEventListener('touchstart', function () {
      isPaused = true;
    }, { passive: true });
    section.addEventListener('touchend', function () {
      setTimeout(function () {
        isPaused = false;
      }, 2500);
    }, { passive: true });

    // Continuous auto-shuffle every 5.5s (staggered between sections)
    var intervalMs = 5500 + sectionIdx * 1800;
    setInterval(function () {
      if (!isPaused && !document.hidden) {
        performShuffle(true);
      }
    }, intervalMs);
  });
}

/* ==========================================================================
   PRODUCT COMPARE SYSTEM (PDP COMPARE TAB + DEDICATED /pages/compare PAGE)
   ========================================================================== */
var COMPARE_STORAGE_KEY = 'athelin_compare_items_v1';
var MAX_COMPARE_ITEMS = 4;

function getCompareItems() {
  try {
    var raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCompareItems(items) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
}

function isProductInCompare(id) {
  if (!id) return false;
  var items = getCompareItems();
  return items.some(function (it) {
    return String(it.id) === String(id) || (it.handle && it.handle === id);
  });
}

function addCompareProduct(productObj) {
  if (!productObj || !productObj.id) return false;
  var items = getCompareItems();

  var existingIndex = items.findIndex(function (it) {
    return String(it.id) === String(productObj.id) || (productObj.handle && it.handle === productObj.handle);
  });

  if (existingIndex > -1) {
    showAthelinToast('Already in comparison (' + items.length + '/' + MAX_COMPARE_ITEMS + ')');
    return false;
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    showAthelinToast('Compare limit reached (' + MAX_COMPARE_ITEMS + ' models max). Remove one to add another.');
    return false;
  }

  items.push(productObj);
  saveCompareItems(items);
  syncCompareUI();
  showAthelinToast('Added to comparison (' + items.length + '/' + MAX_COMPARE_ITEMS + ')');
  return true;
}

function removeCompareProduct(id) {
  if (!id) return;
  var items = getCompareItems();
  var filtered = items.filter(function (it) {
    return String(it.id) !== String(id) && it.handle !== id;
  });
  saveCompareItems(filtered);
  syncCompareUI();
  showAthelinToast('Removed from comparison');
}

function clearAllCompareProducts() {
  saveCompareItems([]);
  syncCompareUI();
  showAthelinToast('Cleared comparison list');
}

function extractCompareDataFromElement(el) {
  var card = el.closest('[data-pdp-compare-source]') || el.closest('[data-product-card]') || el;
  if (!card) return null;

  var titleEl = card.querySelector('.product-buy-box__title') || card.querySelector('.product-card__title a') || card.querySelector('h1, h2, h3');
  var priceEl = card.querySelector('[data-product-price]') || card.querySelector('.product-card__price');
  var emiEl = card.querySelector('[data-product-emi]') || card.querySelector('.product-card__emi');
  var imgEl = card.querySelector('[data-gallery-main-img]') || card.querySelector('[data-main-image]') || card.querySelector('img');

  var id = card.getAttribute('data-product-id') || card.getAttribute('data-product-handle') || '';
  var handle = card.getAttribute('data-product-handle') || '';
  var title = card.getAttribute('data-product-title') || (titleEl ? titleEl.textContent.trim() : 'Endurance Model');
  var vendor = card.getAttribute('data-product-vendor') || card.getAttribute('data-brand') || 'ATHELIN';
  var type = card.getAttribute('data-product-type') || card.getAttribute('data-product-specs') || 'Endurance Gear';
  var url = card.getAttribute('data-product-url') || (titleEl && titleEl.getAttribute('href') ? titleEl.getAttribute('href') : '/collections/all');
  var image = card.getAttribute('data-product-image') || (imgEl ? imgEl.getAttribute('src') : '');
  var price = card.getAttribute('data-product-price') || (priceEl ? priceEl.textContent.trim() : '₹19,000');
  var priceRaw = card.getAttribute('data-price') || '1900000';
  var emi = card.getAttribute('data-product-emi') || (emiEl ? emiEl.textContent.trim() : '');
  var variantId = card.getAttribute('data-variant-id') || '';
  var sku = card.getAttribute('data-product-sku') || (handle ? handle.toUpperCase() : 'ATH-' + id);
  var series = card.getAttribute('data-series') || type;
  var activity = card.getAttribute('data-activity') || 'Marathon, Triathlon & Endurance Training';
  var tech = card.getAttribute('data-tech') || 'Competition Grade Precision';
  var summary = card.getAttribute('data-product-summary') || (title + ' engineered for peak endurance sports performance.');
  var available = card.getAttribute('data-available') !== 'false';

  if (!id) {
    id = handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  return {
    id: String(id),
    handle: String(handle || id),
    title: title,
    vendor: vendor,
    type: type,
    url: url,
    image: image,
    price: price,
    priceRaw: priceRaw,
    emi: emi,
    variantId: variantId,
    sku: sku,
    series: series,
    activity: activity,
    tech: tech,
    summary: summary,
    available: available
  };
}

function syncCompareUI() {
  var items = getCompareItems();
  var count = items.length;

  // 1. Update count badges across header, PDP buttons, and hero banners
  document.querySelectorAll('[data-compare-count-badge]').forEach(function (badge) {
    badge.textContent = count > 0 ? '(' + count + ')' : '';
  });

  document.querySelectorAll('[data-compare-page-count]').forEach(function (el) {
    el.textContent = count + (count === 1 ? ' model selected' : ' models selected');
  });

  var clearBtn = document.querySelector('[data-compare-clear-all]');
  if (clearBtn) {
    clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // 2. Sync PDP buttons on current product page
  var pdpSource = document.querySelector('[data-pdp-compare-source]');
  if (pdpSource) {
    var pdpId = pdpSource.getAttribute('data-product-id');
    var inComp = isProductInCompare(pdpId);
    document.querySelectorAll('[data-compare-btn]').forEach(function (btn) {
      if (inComp) {
        btn.classList.add('is-active');
        btn.innerHTML = '<span>✓</span> <span>Added to Compare</span>';
      } else {
        btn.classList.remove('is-active');
        btn.innerHTML = '<span>+</span> <span>Compare</span>';
      }
    });
  }

  // 3. Render Dedicated Compare Page if active
  renderComparePage();

  // 4. Render PDP Compare Tab preview if present
  renderPdpCompareTab();
}

/* Render Dedicated Compare Models Page (/pages/compare) */
function renderComparePage() {
  // Support 404 fallback routing if /pages/compare has not been published in Shopify admin yet
  var compare404Wrap = document.querySelector('[data-404-compare-wrapper]');
  var default404Wrap = document.querySelector('[data-404-default-wrapper]');
  if (compare404Wrap && window.location.pathname.toLowerCase().indexOf('compare') !== -1) {
    compare404Wrap.style.display = 'block';
    if (default404Wrap) default404Wrap.style.display = 'none';
    document.title = 'Compare Models & Gear — Athelin';
  }

  var page = document.querySelector('[data-compare-page]');
  if (!page) return;

  var items = getCompareItems();
  var emptyState = page.querySelector('[data-compare-empty]');
  var tableContainer = page.querySelector('[data-compare-table-container]');
  var thead = page.querySelector('[data-compare-thead]');
  var tbody = page.querySelector('[data-compare-tbody]');

  if (items.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (tableContainer) tableContainer.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (tableContainer) tableContainer.style.display = 'block';

  // Build Table Header
  var theadHtml = '<tr><th class="compare-th-label">Model &amp; Overview</th>';
  items.forEach(function (item) {
    var emiHtml = item.emi ? '<span class="compare-card__emi">' + escapeHtml(item.emi) + '</span>' : '';
    var stockBadge = item.available
      ? '<span class="compare-card__badge is-instock">In stock</span>'
      : '<span class="compare-card__badge is-soldout">Sold out</span>';

    theadHtml +=
      '<th class="compare-th-item">' +
        '<div class="compare-card-top">' +
          '<button type="button" class="compare-card__remove" data-compare-remove="' + escapeHtml(item.id) + '" aria-label="Remove ' + escapeHtml(item.title) + ' from comparison" title="Remove model">✕</button>' +
          stockBadge +
          '<a href="' + escapeHtml(item.url) + '" class="compare-card__img-link">' +
            '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" class="compare-card__img" loading="lazy">' +
          '</a>' +
          '<div class="compare-card__brand">' + escapeHtml(item.vendor) + '</div>' +
          '<h3 class="compare-card__title"><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></h3>' +
          '<div class="compare-card__price-wrap">' +
            '<span class="compare-card__price">' + escapeHtml(item.price) + '</span>' +
            emiHtml +
          '</div>' +
          '<div class="compare-card__actions">' +
            '<button type="button" class="compare-card__btn-cart" data-compare-add-cart="' + escapeHtml(item.variantId || item.id) + '"' + (item.available ? '' : ' disabled') + '>' +
              (item.available ? 'Add to Bag' : 'Sold Out') +
            '</button>' +
            '<a href="' + escapeHtml(item.url) + '" class="compare-card__btn-view">View Details →</a>' +
          '</div>' +
        '</div>' +
      '</th>';
  });

  // If fewer than 4 items, render an empty slot card to add another product
  if (items.length < MAX_COMPARE_ITEMS) {
    theadHtml +=
      '<th class="compare-th-item compare-th-item--placeholder">' +
        '<div class="compare-card-slot" data-compare-slot-add>' +
          '<div class="compare-card-slot__icon">+</div>' +
          '<div class="compare-card-slot__title">Add Product (' + (items.length + 1) + '/' + MAX_COMPARE_ITEMS + ')</div>' +
          '<div class="compare-card-slot__desc">Search catalog above to compare side-by-side</div>' +
        '</div>' +
      '</th>';
  }
  theadHtml += '</tr>';
  if (thead) thead.innerHTML = theadHtml;

  // Build Spec Matrix Rows
  var specRows = [
    { label: 'Brand / Manufacturer', key: 'vendor' },
    { label: 'Category / Discipline', key: 'type' },
    { label: 'Series / Lineup', key: 'series' },
    { label: 'Best For & Activity', key: 'activity' },
    { label: 'Key Technology', key: 'tech' },
    {
      label: 'Pricing & No-Cost EMI',
      formatter: function (item) {
        return '<strong>' + escapeHtml(item.price) + '</strong>' + (item.emi ? ' · ' + escapeHtml(item.emi) : '');
      }
    },
    {
      label: 'Availability & Dispatch',
      formatter: function (item) {
        return item.available
          ? '<span style="color: #10b981; font-weight: 700;">● In Stock · Dispatch Today</span>'
          : '<span style="color: #ef4444; font-weight: 700;">○ Currently Sold Out</span>';
      }
    },
    { label: 'Model Code / SKU', key: 'sku' },
    { label: 'Performance Summary', key: 'summary' }
  ];

  var tbodyHtml = '';
  specRows.forEach(function (row) {
    tbodyHtml += '<tr><td class="compare-td-label">' + escapeHtml(row.label) + '</td>';
    items.forEach(function (item) {
      var cellVal = '';
      if (typeof row.formatter === 'function') {
        cellVal = row.formatter(item);
      } else {
        cellVal = escapeHtml(item[row.key] || '—');
      }
      tbodyHtml += '<td class="compare-td-val">' + cellVal + '</td>';
    });
    if (items.length < MAX_COMPARE_ITEMS) {
      tbodyHtml += '<td class="compare-td-val compare-td-val--empty">—</td>';
    }
    tbodyHtml += '</tr>';
  });

  if (tbody) tbody.innerHTML = tbodyHtml;
}

/* Render PDP Compare Tab Preview Matrix */
function renderPdpCompareTab() {
  var pdpSection = document.querySelector('[data-pdp-compare-section]');
  if (!pdpSection) return;

  var container = pdpSection.querySelector('[data-pdp-compare-table-wrap]');
  if (!container) return;

  var currentProduct = extractCompareDataFromElement(pdpSection.closest('[data-product-page]') || document.body);
  if (!currentProduct) return;

  // Use products in compare list, or fallback to related products json
  var compareItems = getCompareItems().filter(function (it) {
    return String(it.id) !== String(currentProduct.id);
  });

  if (compareItems.length === 0) {
    var relatedScript = pdpSection.querySelector('[data-pdp-related-compare-json]');
    if (relatedScript) {
      try {
        var relatedList = JSON.parse(relatedScript.textContent || '[]');
        if (Array.isArray(relatedList) && relatedList.length > 0) {
          compareItems = relatedList.slice(0, 2);
        }
      } catch (e) {}
    }
  }

  var displayCols = [currentProduct].concat(compareItems.slice(0, 2));

  var tableHtml =
    '<table class="pdp-compare-table">' +
      '<thead>' +
        '<tr>' +
          '<th style="width: 22%;">Feature</th>' +
          displayCols.map(function (col, idx) {
            var isCurrent = idx === 0;
            return (
              '<th style="width: ' + Math.floor(78 / displayCols.length) + '%;">' +
                '<div class="pdp-compare-col-header' + (isCurrent ? ' is-current-model' : '') + '">' +
                  (isCurrent ? '<span class="pdp-compare-current-badge">THIS MODEL</span>' : '') +
                  '<img src="' + escapeHtml(col.image) + '" alt="' + escapeHtml(col.title) + '" class="pdp-compare-thumb">' +
                  '<div class="pdp-compare-col-brand">' + escapeHtml(col.vendor) + '</div>' +
                  '<h4 class="pdp-compare-col-title">' + escapeHtml(col.title) + '</h4>' +
                  '<div class="pdp-compare-col-price">' + escapeHtml(col.price) + '</div>' +
                '</div>' +
              '</th>'
            );
          }).join('') +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr>' +
          '<td class="pdp-compare-spec-name">Category</td>' +
          displayCols.map(function (col) { return '<td>' + escapeHtml(col.type || 'Endurance Gear') + '</td>'; }).join('') +
        '</tr>' +
        '<tr>' +
          '<td class="pdp-compare-spec-name">Series &amp; Lineup</td>' +
          displayCols.map(function (col) { return '<td><strong>' + escapeHtml(col.series || col.type || 'Core') + '</strong></td>'; }).join('') +
        '</tr>' +
        '<tr>' +
          '<td class="pdp-compare-spec-name">Best For</td>' +
          displayCols.map(function (col) { return '<td>' + escapeHtml(col.activity || 'Marathon, Triathlon & Conditioning') + '</td>'; }).join('') +
        '</tr>' +
        '<tr>' +
          '<td class="pdp-compare-spec-name">Key Tech</td>' +
          displayCols.map(function (col) { return '<td>' + escapeHtml(col.tech || 'Competition Grade Precision') + '</td>'; }).join('') +
        '</tr>' +
        '<tr>' +
          '<td class="pdp-compare-spec-name">Pricing / EMI</td>' +
          displayCols.map(function (col) {
            return '<td>' + escapeHtml(col.price) + (col.emi ? '<br><small style="color: #64748b;">' + escapeHtml(col.emi) + '</small>' : '') + '</td>';
          }).join('') +
        '</tr>' +
      '</tbody>' +
    '</table>';

  container.innerHTML = tableHtml;
}

/* Live Search & Quick Picks on Dedicated Compare Page */
function initComparePageSearch() {
  var page = document.querySelector('[data-compare-page]');
  if (!page) return;

  var searchInput = page.querySelector('[data-compare-search-input]');
  var clearSearchBtn = page.querySelector('[data-compare-search-clear]');
  var resultsContainer = page.querySelector('[data-compare-search-results]');
  var quickPicksContainer = page.querySelector('[data-compare-quick-picks]');
  var catalogScript = page.querySelector('[data-compare-catalog-json]');

  var catalog = [];
  if (catalogScript) {
    try {
      catalog = JSON.parse(catalogScript.textContent || '[]');
    } catch (e) {
      catalog = [];
    }
  }

  // Populate Quick Pick chips from catalog
  if (quickPicksContainer && catalog.length > 0) {
    var picks = catalog.slice(0, 6);
    quickPicksContainer.innerHTML = picks.map(function (p) {
      return (
        '<button type="button" class="compare-quick-chip" data-compare-quick-add="' + escapeHtml(p.id) + '">' +
          '+ ' + escapeHtml(p.title) +
        '</button>'
      );
    }).join('');
  }

  if (!searchInput) return;

  function doSearch(query) {
    var q = (query || '').toLowerCase().trim();
    if (!q) {
      if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
      }
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      return;
    }

    if (clearSearchBtn) clearSearchBtn.style.display = 'block';

    var matches = catalog.filter(function (item) {
      var text = (item.title + ' ' + item.vendor + ' ' + item.type + ' ' + item.series + ' ' + item.sku).toLowerCase();
      return text.indexOf(q) !== -1;
    }).slice(0, 8);

    if (resultsContainer) {
      if (matches.length === 0) {
        resultsContainer.innerHTML =
          '<div class="compare-search-empty">' +
            'No products matching "<strong>' + escapeHtml(q) + '</strong>". Try searching "Garmin", "Brooks", "Hoka", or "Oakley".' +
          '</div>';
      } else {
        var currentItems = getCompareItems();
        resultsContainer.innerHTML = matches.map(function (p) {
          var alreadyIn = currentItems.some(function (it) { return String(it.id) === String(p.id); });
          return (
            '<div class="compare-search-item" data-compare-result-id="' + escapeHtml(p.id) + '">' +
              '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.title) + '" class="compare-search-item__thumb">' +
              '<div class="compare-search-item__info">' +
                '<span class="compare-search-item__brand">' + escapeHtml(p.vendor) + '</span>' +
                '<strong class="compare-search-item__title">' + escapeHtml(p.title) + '</strong>' +
                '<span class="compare-search-item__price">' + escapeHtml(p.price) + '</span>' +
              '</div>' +
              '<button type="button" class="compare-search-item__btn' + (alreadyIn ? ' is-added' : '') + '" data-compare-select-product="' + escapeHtml(p.id) + '"' + (alreadyIn ? ' disabled' : '') + '>' +
                (alreadyIn ? '✓ Added' : '+ Add') +
              '</button>' +
            '</div>'
          );
        }).join('');
      }
      resultsContainer.style.display = 'block';
    }
  }

  var debounceTimer = null;
  searchInput.addEventListener('input', function () {
    var val = this.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      doSearch(val);
    }, 150);
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function () {
      searchInput.value = '';
      doSearch('');
      searchInput.focus();
    });
  }

  // Handle clicking quick picks or search results to add product
  page.addEventListener('click', function (e) {
    // 1. Add from search dropdown
    var addResultBtn = e.target.closest('[data-compare-select-product]');
    if (addResultBtn) {
      var prodId = addResultBtn.getAttribute('data-compare-select-product');
      var matchedProduct = catalog.find(function (p) { return String(p.id) === String(prodId); });
      if (matchedProduct) {
        var added = addCompareProduct(matchedProduct);
        if (added) {
          addResultBtn.classList.add('is-added');
          addResultBtn.textContent = '✓ Added';
          addResultBtn.disabled = true;
          searchInput.value = '';
          if (resultsContainer) resultsContainer.style.display = 'none';
        }
      }
      return;
    }

    // 2. Add from quick chips
    var quickChip = e.target.closest('[data-compare-quick-add]');
    if (quickChip) {
      var qId = quickChip.getAttribute('data-compare-quick-add');
      var qProduct = catalog.find(function (p) { return String(p.id) === String(qId); });
      if (qProduct) {
        addCompareProduct(qProduct);
      }
      return;
    }

    // Close search dropdown if clicking outside search card
    if (!e.target.closest('[data-compare-search-section]')) {
      if (resultsContainer) resultsContainer.style.display = 'none';
    }
  });
}

function initAthelinCompare() {
  syncCompareUI();
  initComparePageSearch();

  // Global Delegated Click Listeners for Compare interactions
  document.addEventListener('click', function (e) {
    // 1. "+ Compare" Button (PDP or Product Card)
    var compBtn = e.target.closest('[data-compare-btn]');
    if (compBtn) {
      e.preventDefault();
      var prodData = extractCompareDataFromElement(compBtn);
      if (prodData) {
        if (isProductInCompare(prodData.id)) {
          removeCompareProduct(prodData.id);
        } else {
          addCompareProduct(prodData);
        }
      }
      return;
    }

    // 2. "Compare this model side-by-side" / "Add & Open Compare Page"
    var addAndGoBtn = e.target.closest('[data-compare-add-and-go]');
    if (addAndGoBtn) {
      e.preventDefault();
      var sourceCard = document.querySelector('[data-pdp-compare-source]') || addAndGoBtn.closest('[data-product-card]');
      if (sourceCard) {
        var pData = extractCompareDataFromElement(sourceCard);
        if (pData && !isProductInCompare(pData.id)) {
          addCompareProduct(pData);
        }
      }
      window.location.href = '/pages/compare';
      return;
    }

    // 3. Remove Button in Compare Matrix
    var removeBtn = e.target.closest('[data-compare-remove]');
    if (removeBtn) {
      e.preventDefault();
      var rId = removeBtn.getAttribute('data-compare-remove');
      removeCompareProduct(rId);
      return;
    }

    // 4. Clear All in Compare Page
    var clearBtn = e.target.closest('[data-compare-clear-all]');
    if (clearBtn) {
      e.preventDefault();
      if (confirm('Are you sure you want to clear your comparison models?')) {
        clearAllCompareProducts();
      }
      return;
    }

    // 5. Click on Empty Slot Card (+ Add Model) -> Focus search input
    var slotAdd = e.target.closest('[data-compare-slot-add]');
    if (slotAdd) {
      e.preventDefault();
      var sInput = document.querySelector('[data-compare-search-input]');
      if (sInput) {
        sInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { sInput.focus(); }, 350);
      }
      return;
    }

    // 6. Direct Add to Bag from Compare Matrix Card
    var compAddCartBtn = e.target.closest('[data-compare-add-cart]');
    if (compAddCartBtn) {
      e.preventDefault();
      var vId = compAddCartBtn.getAttribute('data-compare-add-cart');
      if (vId) {
        compAddCartBtn.disabled = true;
        compAddCartBtn.textContent = 'Adding...';
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ items: [{ id: parseInt(vId, 10), quantity: 1 }] })
        })
          .then(function (res) {
            compAddCartBtn.disabled = false;
            compAddCartBtn.textContent = 'Added ✓';
            setTimeout(function () { compAddCartBtn.textContent = 'Add to Bag'; }, 2000);
            if (window.AthelinCart) {
              window.AthelinCart.refreshAndOpen();
            } else {
              showAthelinToast('Added item to shopping bag');
            }
          })
          .catch(function () {
            compAddCartBtn.disabled = false;
            compAddCartBtn.textContent = 'Add to Bag';
          });
      }
      return;
    }
  });
}

/* ==========================================================================
   ATHELIN STORE IMAGE CAROUSEL GALLERY (/pages/contact & store pages)
   ========================================================================== */
function initAthelinStoreCarousel() {
  var carouselEl = document.querySelector('[data-store-carousel]');
  if (!carouselEl) return;

  var slides = carouselEl.querySelectorAll('[data-carousel-slide]');
  var prevBtn = carouselEl.querySelector('[data-carousel-prev]');
  var nextBtn = carouselEl.querySelector('[data-carousel-next]');
  var dots = carouselEl.querySelectorAll('[data-carousel-dot]');
  var counterEl = carouselEl.querySelector('[data-carousel-counter]');

  if (!slides || slides.length === 0) return;

  var currentIndex = 0;
  var totalSlides = slides.length;
  var autoPlayTimer = null;
  var AUTO_PLAY_INTERVAL = 4500;

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;

    slides.forEach(function (slide, idx) {
      if (idx === currentIndex) {
        slide.classList.add('is-active');
      } else {
        slide.classList.remove('is-active');
      }
    });

    dots.forEach(function (dot, idx) {
      if (idx === currentIndex) {
        dot.classList.add('is-active');
      } else {
        dot.classList.remove('is-active');
      }
    });

    if (counterEl) {
      var currentDisplay = (currentIndex + 1 < 10 ? '0' : '') + (currentIndex + 1);
      var totalDisplay = (totalSlides < 10 ? '0' : '') + totalSlides;
      counterEl.textContent = currentDisplay + ' / ' + totalDisplay;
    }
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(function () {
      goToSlide(currentIndex + 1);
    }, AUTO_PLAY_INTERVAL);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function (e) {
      e.preventDefault();
      goToSlide(currentIndex - 1);
      startAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      e.preventDefault();
      goToSlide(currentIndex + 1);
      startAutoPlay();
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function (e) {
      e.preventDefault();
      var targetIdx = parseInt(this.getAttribute('data-carousel-dot'), 10);
      if (!isNaN(targetIdx)) {
        goToSlide(targetIdx);
        startAutoPlay();
      }
    });
  });

  // Pause on hover
  carouselEl.addEventListener('mouseenter', stopAutoPlay);
  carouselEl.addEventListener('mouseleave', startAutoPlay);

  // Touch Swipe Support for mobile devices
  var touchStartX = 0;
  var touchEndX = 0;
  carouselEl.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
    }
    stopAutoPlay();
  }, { passive: true });

  carouselEl.addEventListener('touchend', function (e) {
    if (e.changedTouches && e.changedTouches[0]) {
      touchEndX = e.changedTouches[0].clientX;
      var swipeThreshold = 40;
      if (touchEndX < touchStartX - swipeThreshold) {
        goToSlide(currentIndex + 1);
      } else if (touchEndX > touchStartX + swipeThreshold) {
        goToSlide(currentIndex - 1);
      }
    }
    startAutoPlay();
  }, { passive: true });

  // Initial state
  goToSlide(0);
  startAutoPlay();
}

/* ==========================================================================
   CONTACT US PAGE & INTERACTIVE STORE ROUTE SIMULATOR (/pages/contact)
   ========================================================================== */
function initAthelinContactPage() {
  // Support 404 fallback routing if /pages/contact has not been published in Shopify admin yet
  var contact404Wrap = document.querySelector('[data-404-contact-wrapper]');
  var default404Wrap = document.querySelector('[data-404-default-wrapper]');
  if (contact404Wrap && window.location.pathname.toLowerCase().indexOf('contact') !== -1) {
    contact404Wrap.style.display = 'block';
    if (default404Wrap) default404Wrap.style.display = 'none';
    document.title = 'Contact Us & Experience Center — Athelin';
  }

  var contactPage = document.querySelector('[data-contact-page]');
  if (!contactPage) return;

  // Initialize Store Gallery Carousel
  initAthelinStoreCarousel();

  // Athelin Store Coordinates (Sector 42-43 Rapid Metro Station, Golf Course Road, Gurugram)
  var STORE_LAT = 28.4623;
  var STORE_LNG = 77.0984;
  var STORE_DESTINATION = 'Athelin Garmin Brand Store Sector 42-43 Rapid Metro Station Golf Course Road Gurgaon 122002';

  // Preset Route Simulation Scenarios
  var ROUTE_PRESETS = {
    'cyber-hub': {
      label: 'Cyber Hub Gurugram',
      metro: {
        time: '~10 - 12 mins',
        dist: '4.8 km',
        highlight: 'Rapid Metro Direct (3 Stops)',
        step1Title: 'Board Rapid Metro at Cyber City / Phase 2',
        step1Desc: 'Take the loop towards Sector 55-56 on the elevated Rapid Metro corridor.',
        step2Title: 'Pass Phase 1 & Vodafone Belvedere',
        step2Desc: 'Enjoy the express Golf Course Road track. It takes just 3 stops.',
        step3Title: 'Alight at Sector 42-43 Station (Concourse Level)',
        step3Desc: 'Exit train and proceed straight to the 1st Floor Station Concourse (Shop 6A) opposite fare gates.'
      },
      driving: {
        time: '~12 - 15 mins',
        dist: '5.2 km',
        highlight: 'Signal-Free Golf Course Road Expressway',
        step1Title: 'Drive south on Golf Course Road Expressway',
        step1Desc: 'Take the 16-lane signal-free Golf Course Road underpasses towards DLF 5.',
        step2Title: 'Take the Sector 42-43 slip road',
        step2Desc: 'Exit to the left service lane right as you see the Rapid Metro Station.',
        step3Title: 'Park at Rapid Metro dedicated bay',
        step3Desc: 'Take the covered station escalators directly up into the 1st Floor Concourse.'
      },
      cycling: {
        time: '~16 - 18 mins',
        dist: '5.0 km',
        highlight: 'Dedicated Service Corridor',
        step1Title: 'Start along Cyber City / DLF 2 cycle corridor',
        step1Desc: 'Cruise south along the tree-lined Golf Course Road service lane.',
        step2Title: 'Cross under DLF Phase 1 flyover',
        step2Desc: 'Continue straight past Genpact chowk and Sector 42.',
        step3Title: 'Secure bicycle parking at Station Entrance',
        step3Desc: 'Athelin provides indoor cyclist hydration, lock check, and pump service.'
      }
    },
    'igi-airport': {
      label: 'Indira Gandhi International Airport (DEL T3)',
      metro: {
        time: '~35 - 40 mins',
        dist: '18 km',
        highlight: 'Airport Express -> Yellow Line -> Rapid Metro',
        step1Title: 'Board Airport Express Line at Terminal 3/2',
        step1Desc: 'Take Airport Express or hail a cab to Shankar Chowk / Cyber City.',
        step2Title: 'Switch to Rapid Metro at Sikanderpur',
        step2Desc: 'Interchange directly into the covered Rapid Metro towards Sector 55-56.',
        step3Title: 'Alight at Sector 42-43 Station',
        step3Desc: 'Take the concourse escalator straight into the Athelin Experience Center.'
      },
      driving: {
        time: '~22 - 28 mins',
        dist: '16.5 km',
        highlight: 'NH-48 -> Shankar Chowk -> Golf Course Road',
        step1Title: 'Head south on Delhi-Gurgaon NH-48 Expressway',
        step1Desc: 'Cross Sirhaul Toll Plaza into Gurugram.',
        step2Title: 'Exit at Shankar Chowk onto Golf Course Road',
        step2Desc: 'Glide through the underpasses past DLF Cyber Hub and Horizon Center.',
        step3Title: 'Arrive at Sector 42-43 Station drop-off',
        step3Desc: 'Valet and dedicated station parking right beneath the concourse.'
      },
      cycling: {
        time: '~45 mins',
        dist: '17 km',
        highlight: 'Aerocity -> MG Road corridor',
        step1Title: 'Exit Aerocity towards Mehrauli-Gurgaon corridor',
        step1Desc: 'Follow the flat endurance route along MG Road.',
        step2Title: 'Turn onto Golf Course Road at Sikanderpur',
        step2Desc: 'Wide cycling shoulder along the main road.',
        step3Title: 'Arrive at Sector 42-43 Metro Station',
        step3Desc: 'Elevator access available directly to First Floor.'
      }
    },
    'south-delhi': {
      label: 'South Delhi (Hauz Khas / Saket)',
      metro: {
        time: '~25 - 30 mins',
        dist: '15.5 km',
        highlight: 'Yellow Line Direct -> Rapid Metro (1 Interchange)',
        step1Title: 'Board Delhi Metro Yellow Line towards Millennium City Centre',
        step1Desc: 'Ride directly south through Saket, Qutab Minar, and Sultanpur.',
        step2Title: 'Switch to Rapid Metro at Sikanderpur (1 min covered walk)',
        step2Desc: 'Board train heading towards Sector 55-56.',
        step3Title: '2 Stops to Sector 42-43 Station',
        step3Desc: 'Exit train and walk 10 paces into Athelin Shop 6A.'
      },
      driving: {
        time: '~28 - 35 mins',
        dist: '17 km',
        highlight: 'Mehrauli-Gurgaon (MG) Road or Faridabad Expressway',
        step1Title: 'Drive via MG Road or Gurgaon-Faridabad Road',
        step1Desc: 'Join Golf Course Road at Sikanderpur / IFFCO junction.',
        step2Title: 'Enter Golf Course Road underpasses',
        step2Desc: 'Head south towards Sector 43 / DLF Phase 5.',
        step3Title: 'Arrive at Sector 42-43 Station parking',
        step3Desc: 'Take the station elevator to First Floor.'
      },
      cycling: {
        time: '~40 mins',
        dist: '16 km',
        highlight: 'Qutab Enclave / Aravalli ridge route',
        step1Title: 'Ride south along MG Road cycling shoulder',
        step1Desc: 'Smooth gradient through Aya Nagar into Gurugram.',
        step2Title: 'Turn left onto Golf Course Road',
        step2Desc: 'Protected service lane past DLF 1.',
        step3Title: 'Arrive at Athelin Store',
        step3Desc: 'Store opens at 10:30 AM with cold recovery hydration.'
      }
    },
    'cp-delhi': {
      label: 'Connaught Place (Central Delhi)',
      metro: {
        time: '~45 - 50 mins',
        dist: '28 km',
        highlight: 'Yellow Line Non-Stop -> Rapid Metro',
        step1Title: 'Board Yellow Line at Rajiv Chowk',
        step1Desc: 'Direct air-conditioned metro south to Sikanderpur Station.',
        step2Title: 'Transfer to Rapid Metro',
        step2Desc: 'Covered footbridge interchange towards Sector 55-56.',
        step3Title: 'Alight at Sector 42-43 Station',
        step3Desc: 'Shop 6A on the 1st Floor Concourse.'
      },
      driving: {
        time: '~45 - 55 mins',
        dist: '30 km',
        highlight: 'Shanti Path -> Dhaula Kuan -> NH-48',
        step1Title: 'Take Dhaula Kuan onto Delhi-Gurgaon NH-48',
        step1Desc: 'Straight run past Ambience Mall and Cyber City.',
        step2Title: 'Take Golf Course Road Expressway',
        step2Desc: 'Underpass corridor straight to Sector 43.',
        step3Title: 'Park at Rapid Metro bay',
        step3Desc: 'Direct entry into First Floor concourse.'
      },
      cycling: {
        time: '~1h 15m',
        dist: '29 km',
        highlight: 'South Delhi Endurance Training Ride',
        step1Title: 'Start from Central Delhi through Chanakyapuri',
        step1Desc: 'Follow Shanti Path and Aurobindo Marg.',
        step2Title: 'Cruise down MG Road to Golf Course Road',
        step2Desc: 'Popular weekend long-ride cycling route.',
        step3Title: 'Finish ride at Athelin Store',
        step3Desc: 'Enjoy sports nutrition and gait recovery.'
      }
    },
    'noida': {
      label: 'Noida / Greater Noida / East Delhi',
      metro: {
        time: '~55 - 65 mins',
        dist: '42 km',
        highlight: 'Magenta Line -> Yellow Line -> Rapid Metro',
        step1Title: 'Board Magenta Line at Botanical Garden / Sector 18',
        step1Desc: 'Express route under South Delhi directly to Hauz Khas.',
        step2Title: 'Switch to Yellow Line -> Sikanderpur -> Rapid Metro',
        step2Desc: 'Fast transfers inside covered stations.',
        step3Title: 'Arrive at Sector 42-43 Station',
        step3Desc: 'Step directly out into Athelin with zero outdoor pollution or heat.'
      },
      driving: {
        time: '~50 - 65 mins',
        dist: '44 km',
        highlight: 'Kalindi Kunj -> Gurgaon-Faridabad Highway',
        step1Title: 'Take Kalindi Kunj onto Gurgaon-Faridabad Highway',
        step1Desc: 'Fast 6-lane scenic highway across the Aravalli hills.',
        step2Title: 'Join Golf Course Road heading north to Sector 43',
        step2Desc: 'U-turn at Sector 42-43 junction into station lane.',
        step3Title: 'Arrive at Athelin Store',
        step3Desc: 'Easy drop-off and ground parking.'
      },
      cycling: {
        time: '~1h 45m',
        dist: '42 km',
        highlight: 'Faridabad Scenic Aravalli Century Route',
        step1Title: 'Ride through Faridabad-Gurgaon green belt',
        step1Desc: 'Challenging rolling elevation route through the hills.',
        step2Title: 'Descent into Golf Course Road',
        step2Desc: 'Wide sprint lane past Sector 55.',
        step3Title: 'Arrive at Sector 42-43 Station',
        step3Desc: 'Test new carbon shoes and bike computers.'
      }
    },
    'golf-course-ext': {
      label: 'Golf Course Extension Road (Sohna / Sec 56)',
      metro: {
        time: '~8 - 10 mins',
        dist: '3.5 km',
        highlight: 'Rapid Metro 2 Stops North',
        step1Title: 'Board Rapid Metro at Sector 55-56 or 54 Chowk',
        step1Desc: 'Take northbound train towards Sikanderpur / Cyber City.',
        step2Title: 'Alight at Sector 42-43 Station',
        step2Desc: 'Only 2 quick stops along the elevated track.',
        step3Title: 'Walk into Athelin Shop 6A',
        step3Desc: 'Located directly opposite the fare gates.'
      },
      driving: {
        time: '~6 - 8 mins',
        dist: '3.8 km',
        highlight: 'North on Golf Course Road',
        step1Title: 'Head north past Genpact Chowk on Golf Course Road',
        step1Desc: 'Stay on the left service road right before DLF Horizon Center.',
        step2Title: 'Turn into Rapid Metro Sector 42-43 station drop-off',
        step2Desc: 'Convenient ground-level visitor parking.',
        step3Title: 'Take escalator up to First Floor',
        step3Desc: 'Athelin store is directly accessible.'
      },
      cycling: {
        time: '~10 mins',
        dist: '3.5 km',
        highlight: 'Flat morning tempo run / cycle lane',
        step1Title: 'Ride north on the dedicated service lane',
        step1Desc: 'Smooth tarmac, popular with morning runners and cyclists.',
        step2Title: 'Pass DLF Phase 5 and Horizon towers',
        step2Desc: 'Direct ramp up to the station entrance.',
        step3Title: 'Arrive at Athelin Experience Center',
        step3Desc: 'Store is open every day from 10:30 AM to 8:30 PM.'
      }
    }
  };

  var currentPreset = 'cyber-hub';
  var currentMode = 'metro';

  var originInput = contactPage.querySelector('[data-route-origin-input]');
  var gpsBtn = contactPage.querySelector('[data-route-gps-btn]');
  var presetChips = contactPage.querySelectorAll('[data-route-preset]');
  var modeButtons = contactPage.querySelectorAll('[data-route-mode]');

  var timeEl = contactPage.querySelector('[data-route-time]');
  var distEl = contactPage.querySelector('[data-route-dist]');
  var highlightEl = contactPage.querySelector('[data-route-highlight]');
  var liveMapsLink = contactPage.querySelector('[data-route-live-maps-link]');

  var step1TitleEl = contactPage.querySelector('[data-step-1-title]');
  var step1DescEl = contactPage.querySelector('[data-step-1-desc]');
  var step2TitleEl = contactPage.querySelector('[data-step-2-title]');
  var step2DescEl = contactPage.querySelector('[data-step-2-desc]');
  var step3TitleEl = contactPage.querySelector('[data-step-3-title]');
  var step3DescEl = contactPage.querySelector('[data-step-3-desc]');

  // Haversine formula to compute great-circle distance in kilometers
  function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = ((lat2 - lat1) * Math.PI) / 180;
    var dLon = ((lon2 - lon1) * Math.PI) / 180;
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function updateSimulationDisplay(originText) {
    var presetData = ROUTE_PRESETS[currentPreset] || ROUTE_PRESETS['cyber-hub'];
    var modeData = presetData[currentMode] || presetData['metro'];

    var displayOrigin = originText || presetData.label;
    if (originInput && !originText) {
      originInput.value = presetData.label;
    }

    if (timeEl) timeEl.textContent = modeData.time;
    if (distEl) distEl.textContent = modeData.dist;
    if (highlightEl) highlightEl.textContent = modeData.highlight;

    if (step1TitleEl) step1TitleEl.textContent = modeData.step1Title;
    if (step1DescEl) step1DescEl.textContent = modeData.step1Desc;
    if (step2TitleEl) step2TitleEl.textContent = modeData.step2Title;
    if (step2DescEl) step2DescEl.textContent = modeData.step2Desc;
    if (step3TitleEl) step3TitleEl.textContent = modeData.step3Title;
    if (step3DescEl) step3DescEl.textContent = modeData.step3Desc;

    // Build real Google Maps turn-by-turn navigation URL
    if (liveMapsLink) {
      var travelModeParam = 'transit';
      if (currentMode === 'driving') travelModeParam = 'driving';
      else if (currentMode === 'cycling') travelModeParam = 'bicycling';

      var mapsUrl =
        'https://www.google.com/maps/dir/?api=1&origin=' +
        encodeURIComponent(displayOrigin) +
        '&destination=' +
        encodeURIComponent(STORE_DESTINATION) +
        '&travelmode=' +
        travelModeParam;

      liveMapsLink.href = mapsUrl;
    }
  }

  // 1. Preset Chip Clicks
  presetChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      presetChips.forEach(function (c) { c.classList.remove('is-active'); });
      this.classList.add('is-active');
      currentPreset = this.getAttribute('data-route-preset');
      updateSimulationDisplay();
    });
  });

  // 2. Travel Mode Button Clicks
  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      modeButtons.forEach(function (b) { b.classList.remove('is-active'); });
      this.classList.add('is-active');
      currentMode = this.getAttribute('data-route-mode');
      updateSimulationDisplay(originInput ? originInput.value.trim() : '');
    });
  });

  // 3. User Typing in Custom Origin
  var inputDebounceTimer = null;
  if (originInput) {
    originInput.addEventListener('input', function () {
      var customText = this.value.trim();
      clearTimeout(inputDebounceTimer);
      inputDebounceTimer = setTimeout(function () {
        if (customText.length > 2) {
          // Deselect presets when typing custom
          presetChips.forEach(function (c) { c.classList.remove('is-active'); });
          updateSimulationDisplay(customText);
        } else if (customText.length === 0) {
          updateSimulationDisplay();
        }
      }, 300);
    });
  }

  // 4. GPS Geolocation Detection
  if (gpsBtn) {
    gpsBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        showAthelinToast('Geolocation is not supported by your browser.');
        return;
      }

      gpsBtn.disabled = true;
      gpsBtn.innerHTML = '<span>Locating...</span>';

      navigator.geolocation.getCurrentPosition(
        function (position) {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = '<span>✓ Located</span>';
          setTimeout(function () {
            gpsBtn.innerHTML =
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><polyline points="12 9 12 12 13.5 13.5"></polyline><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M2 12h2"></path><path d="M20 12h2"></path></svg><span>Use GPS</span>';
          }, 3000);

          var userLat = position.coords.latitude;
          var userLng = position.coords.longitude;
          var kmDist = calculateDistance(userLat, userLng, STORE_LAT, STORE_LNG);
          var formattedDist = kmDist.toFixed(1) + ' km';

          var estMinutes = Math.round(kmDist * 2.2 + 8);
          if (estMinutes < 5) estMinutes = 5;

          if (originInput) {
            originInput.value = 'My Current GPS Location (' + formattedDist + ' away)';
          }

          if (distEl) distEl.textContent = formattedDist;
          if (timeEl) timeEl.textContent = '~' + estMinutes + ' mins';
          if (highlightEl) highlightEl.textContent = 'Live GPS Calculated Route';

          if (step1TitleEl) step1TitleEl.textContent = 'Head towards Sector 42-43 Gurugram';
          if (step1DescEl) step1DescEl.textContent = 'Take the fastest arterial corridor towards Golf Course Road.';

          if (liveMapsLink) {
            var travelModeParam = currentMode === 'driving' ? 'driving' : 'transit';
            liveMapsLink.href =
              'https://www.google.com/maps/dir/?api=1&origin=' +
              userLat +
              ',' +
              userLng +
              '&destination=' +
              encodeURIComponent(STORE_DESTINATION) +
              '&travelmode=' +
              travelModeParam;
          }

          showAthelinToast('Calculated route from your current location (' + formattedDist + ')');
        },
        function (error) {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML =
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><polyline points="12 9 12 12 13.5 13.5"></polyline><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M2 12h2"></path><path d="M20 12h2"></path></svg><span>Use GPS</span>';
          showAthelinToast('Could not retrieve location. Please type your city/area.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  // Initial simulation render
  updateSimulationDisplay();
}

