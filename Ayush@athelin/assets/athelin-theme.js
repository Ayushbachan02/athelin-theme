/* ==========================================================================
   ATHELIN THEME JAVASCRIPT
   Micro-interactions, Swatches, Skeletons, and Smooth Preloader
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Color Swatch & Thumbnail Switching (Hover & Click with Image Change)
  function handleSwatchSwitch(btn) {
    var rawUrl = btn.getAttribute('data-variant-img');
    var card = btn.closest('[data-product-card]');
    if (!card || !rawUrl) return;

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
    if (mainImg) {
      mainImg.removeAttribute('srcset');
      mainImg.src = imgUrl;
      mainImg.addEventListener('load', function () {
        adaptCardBackground(card);
      }, { once: true });
    }

    var siblings = btn.parentElement.querySelectorAll('.product-card__swatch');
    siblings.forEach(function (s) { s.classList.remove('product-card__swatch--active'); });
    btn.classList.add('product-card__swatch--active');
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
    var btn = e.target.closest('.product-card__swatch[data-variant-img]');
    if (btn) {
      handleSwatchSwitch(btn);
    }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.product-card__swatch[data-variant-img]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      handleSwatchSwitch(btn);
    }
  });

  // 2. Wishlist Heart Button Micro-interaction
  var wishlistButtons = document.querySelectorAll('[data-wishlist-btn]');
  wishlistButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      this.classList.toggle('active');
      var svg = this.querySelector('svg');
      if (svg) {
        svg.style.transform = 'scale(1.35)';
        setTimeout(function () {
          svg.style.transform = 'scale(1)';
        }, 200);
      }
    });
  });

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

