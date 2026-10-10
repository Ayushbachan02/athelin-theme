/**
 * Athelin Product Detail Page (PDP) JavaScript
 * Supports Gallery Switching, Dynamic Variant Selection, AJAX Cart, Tabs, and Sticky Bar
 */

(function () {
  'use strict';

  function initProductPage() {
    const productContainer = document.querySelector('[data-product-page]');
    if (!productContainer) return;

    // 1. Gallery Interactions
    const thumbs = productContainer.querySelectorAll('[data-gallery-thumb]');
    const mainImg = productContainer.querySelector('[data-gallery-main-img]');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', function () {
        const fullSrc = this.getAttribute('data-img-src');
        if (fullSrc && mainImg) {
          mainImg.style.opacity = '0.5';
          mainImg.src = fullSrc;
          const altText = this.querySelector('img') ? this.querySelector('img').alt : '';
          mainImg.alt = altText;
          setTimeout(() => {
            mainImg.style.opacity = '1';
          }, 100);
        }

        thumbs.forEach((t) => t.classList.remove('is-active'));
        this.classList.add('is-active');
        this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    // 2. Variant Swatch Selector
    const swatches = productContainer.querySelectorAll('[data-swatch-variant]');
    const variantIdInput = productContainer.querySelector('[data-variant-id-input]');
    const activeValLabel = productContainer.querySelector('[data-variant-active-val]');
    const priceDisplay = productContainer.querySelector('[data-product-price]');
    const emiDisplay = productContainer.querySelector('[data-product-emi]');
    const stockDot = productContainer.querySelector('[data-stock-dot]');
    const stockText = productContainer.querySelector('[data-stock-text]');
    const addToCartBtn = productContainer.querySelector('[data-add-to-cart-btn]');
    const stickyBarTitle = document.querySelector('[data-sticky-title]');
    const stickyBarPrice = document.querySelector('[data-sticky-price]');
    const stickyBarThumb = document.querySelector('[data-sticky-thumb]');

    swatches.forEach((swatch) => {
      swatch.addEventListener('click', function () {
        const variantId = this.getAttribute('data-variant-id');
        const variantTitle = this.getAttribute('data-variant-title');
        const variantPrice = this.getAttribute('data-variant-price');
        const variantAvailable = this.getAttribute('data-variant-available') === 'true';
        const variantImg = this.getAttribute('data-variant-img');

        // Update active class
        swatches.forEach((s) => s.classList.remove('is-selected'));
        this.classList.add('is-selected');

        // Update variant title
        if (activeValLabel) {
          activeValLabel.textContent = variantTitle;
        }

        // Update form input
        if (variantIdInput) {
          variantIdInput.value = variantId;
        }

        // Update price
        if (priceDisplay && variantPrice) {
          priceDisplay.textContent = variantPrice;
        }

        // Calculate and update EMI pill
        if (emiDisplay && variantPrice) {
          const rawNum = parseInt(variantPrice.replace(/[^\d]/g, ''), 10);
          if (!isNaN(rawNum)) {
            const emiVal = Math.round(rawNum / 3);
            emiDisplay.textContent = '₹' + emiVal.toLocaleString('en-IN') + '/mo';
          }
        }

        // Update stock status
        if (stockDot && stockText) {
          if (variantAvailable) {
            stockDot.classList.remove('is-soldout');
            stockText.textContent = 'In stock · dispatched today';
          } else {
            stockDot.classList.add('is-soldout');
            stockText.textContent = 'Sold out · currently unavailable';
          }
        }

        // Update CTA button
        if (addToCartBtn) {
          if (variantAvailable) {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'Add to cart';
          } else {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Sold out';
          }
        }

        // Update main image if variant has associated image
        if (variantImg && mainImg) {
          mainImg.src = variantImg;
          // Also highlight matching thumbnail
          thumbs.forEach((t) => {
            if (t.getAttribute('data-img-src') === variantImg) {
              t.classList.add('is-active');
              t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              t.classList.remove('is-active');
            }
          });
        }

        // Update sticky bar details
        if (stickyBarPrice && variantPrice) {
          const rawNum = parseInt(variantPrice.replace(/[^\d]/g, ''), 10);
          const emiStr = !isNaN(rawNum) ? ' · ₹' + Math.round(rawNum / 3).toLocaleString('en-IN') + '/mo' : '';
          stickyBarPrice.textContent = variantPrice + emiStr;
        }
        if (stickyBarThumb && variantImg) {
          stickyBarThumb.src = variantImg;
        }
      });
    });

    // 3. Tab Switching
    const tabButtons = productContainer.querySelectorAll('[data-tab-target]');
    const tabPanels = productContainer.querySelectorAll('[data-tab-panel]');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const targetId = this.getAttribute('data-tab-target');

        tabButtons.forEach((b) => b.classList.remove('is-active'));
        this.classList.add('is-active');

        tabPanels.forEach((panel) => {
          if (panel.getAttribute('data-tab-panel') === targetId) {
            panel.classList.add('is-active');
          } else {
            panel.classList.remove('is-active');
          }
        });
      });
    });

    // 4. Pincode Estimator
    const pincodeTrigger = productContainer.querySelector('[data-pincode-trigger]');
    const deliveryDateSpan = productContainer.querySelector('[data-delivery-date]');
    const pincodeValueSpan = productContainer.querySelector('[data-pincode-value]');

    if (pincodeTrigger) {
      pincodeTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        const currentPin = pincodeValueSpan ? pincodeValueSpan.textContent : '121003';
        const newPin = prompt('Enter delivery pincode (6 digits):', currentPin);
        if (newPin && newPin.trim().length === 6 && /^\d+$/.test(newPin.trim())) {
          if (pincodeValueSpan) {
            pincodeValueSpan.textContent = newPin.trim();
          }
          // Compute estimated delivery 3 days from now
          const estDate = new Date();
          estDate.setDate(estDate.getDate() + 3);
          const options = { weekday: 'short', day: 'numeric', month: 'short' };
          const formatted = estDate.toLocaleDateString('en-GB', options);
          if (deliveryDateSpan) {
            deliveryDateSpan.textContent = formatted;
          }
        }
      });
    }

    // 5. Toast Notification Helper
    function showToast(message) {
      let toast = document.querySelector('.product-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'product-toast';
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span>✓</span> ' + message;
      toast.classList.add('is-active');
      setTimeout(() => {
        toast.classList.remove('is-active');
      }, 3000);
    }

    // 6. AJAX Add to Cart Handler
    const productForm = productContainer.querySelector('#product-form');
    if (productForm) {
      productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const submitBtn = productForm.querySelector('[data-add-to-cart-btn]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Adding...';
        }

        const formData = new FormData(productForm);
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Add to cart';
            }
            showToast('Added ' + (data.title || 'item') + ' to cart!');

            // Update cart count badge if available
            fetch('/cart.js')
              .then((r) => r.json())
              .then((cart) => {
                document.querySelectorAll('[data-cart-count]').forEach((el) => {
                  el.textContent = cart.item_count;
                });
              })
              .catch(() => {});
          })
          .catch((err) => {
            console.error('Error adding to cart:', err);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Add to cart';
            }
            productForm.submit();
          });
      });
    }

    // 7. Bundle Add to Cart Handler
    const bundleBtn = productContainer.querySelector('[data-bundle-add-btn]');
    if (bundleBtn) {
      bundleBtn.addEventListener('click', function () {
        this.disabled = true;
        this.textContent = 'Adding bundle...';

        // Add first available variant or accessory
        const currentVariantId = variantIdInput ? variantIdInput.value : null;
        if (!currentVariantId) return;

        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            id: currentVariantId,
            quantity: 1,
          }),
        })
          .then((res) => res.json())
          .then(() => {
            this.disabled = false;
            this.textContent = 'Add to cart';
            showToast('Setup accessories added to cart!');
          })
          .catch(() => {
            this.disabled = false;
            this.textContent = 'Add to cart';
          });
      });
    }

    // 8. Sticky Bottom Bar Scroll Observer
    const stickyBar = document.querySelector('[data-sticky-bar]');
    const buyBox = productContainer.querySelector('.product-buy-box');

    if (stickyBar && buyBox) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
              stickyBar.classList.add('is-visible');
            } else {
              stickyBar.classList.remove('is-visible');
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(buyBox);

      // Sticky bar button handlers
      const stickyCartBtn = stickyBar.querySelector('[data-sticky-add-cart]');
      const stickyBuyBtn = stickyBar.querySelector('[data-sticky-buy-now]');

      if (stickyCartBtn && productForm) {
        stickyCartBtn.addEventListener('click', function () {
          productForm.dispatchEvent(new Event('submit', { cancelable: true }));
        });
      }

      if (stickyBuyBtn) {
        stickyBuyBtn.addEventListener('click', function () {
          const varId = variantIdInput ? variantIdInput.value : '';
          if (varId) {
            window.location.href = '/cart/' + varId + ':1';
          }
        });
      }
    }

    // 9. Structured Description Formatter
    formatProductDescription();
  }

  function formatProductDescription() {
    const container = document.querySelector('[data-product-description-container]');
    if (!container) return;

    const rawEl = container.querySelector('[data-product-description-raw]');
    const formattedEl = container.querySelector('[data-product-description-formatted]');
    if (!rawEl || !formattedEl) return;

    const rawHtml = rawEl.innerHTML;
    if (!rawHtml || !rawHtml.trim()) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // Strip competitor links and scraper nav icons
      doc.querySelectorAll('a[href*="oakley.com"], a[href*="hyperice.com"], a[href*="hyperinvento.com"]').forEach((a) => {
        if (a.textContent.includes('FIT INFORMATION') || a.textContent.includes('FRAME SIZE') || a.textContent.includes('BRIDGE AND NOSEPADS')) {
          const heading = document.createElement('h4');
          heading.className = 'pdp-extracted-heading';
          heading.textContent = a.textContent.trim();
          a.replaceWith(heading);
        } else {
          a.replaceWith(document.createTextNode(a.textContent));
        }
      });

      doc.querySelectorAll('.det-default-explore-navigator-list, .det-explore-nav-icon, input[type="checkbox"].accordionBox-input, .pdpBottom-productInfo-readmore').forEach((el) => el.remove());

      // 1. Extract Key Metrics & Specifications
      const metrics = [];
      const strongElements = doc.querySelectorAll('strong, span.bold, .oo-text.bold');
      const excludedMetricLabels = ['narrow', 'regular', 'wide', 'high bridge fit', 'low bridge fit', 'universal fit', 'adjustable nosepads', 'fit information', 'frame size', 'frames and lenses', 'bridge and nosepads', 'model code', 'lens width', 'bridge width', 'temple length'];

      strongElements.forEach((strong) => {
        const text = strong.textContent.trim();
        if (text.endsWith(':')) {
          const label = text.slice(0, -1).trim();
          let val = '';
          if (strong.nextElementSibling) {
            val = strong.nextElementSibling.textContent.trim();
          } else if (strong.nextSibling) {
            val = strong.nextSibling.textContent.trim();
          }
          if (label && val && val.length < 90 && !excludedMetricLabels.includes(label.toLowerCase())) {
            if (!metrics.some((m) => m.label.toLowerCase() === label.toLowerCase())) {
              metrics.push({ label, val });
            }
          }
        }
      });

      // Frame measurements extraction
      const specRows = [
        { sel: '.selected-size', label: 'Frame Size' },
        { sel: '.fit-frame', label: 'Frame Fit' },
        { sel: '.fit-description', label: 'Bridge & Nosepad' }
      ];
      specRows.forEach((row) => {
        const el = doc.querySelector(row.sel);
        if (el) {
          const txt = el.textContent.replace('Size:', '').replace('Fit:', '').replace('Bridge and nosepad:', '').trim();
          if (txt && txt.length < 50 && !metrics.some((m) => m.label.toLowerCase() === row.label.toLowerCase())) {
            metrics.push({ label: row.label, val: txt });
          }
        }
      });

      // 2. Extract Specification Tables
      const tables = doc.querySelectorAll('table');
      const tableDataList = [];
      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');
        const tableRows = [];
        rows.forEach((tr) => {
          const cells = tr.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const k = cells[0].textContent.trim();
            const v = cells[1].textContent.trim();
            if (k && v) {
              tableRows.push({ key: k, val: v });
            }
          }
        });
        if (tableRows.length > 0) {
          let title = 'Technical Specifications';
          const prev = table.closest('section') ? table.closest('section').querySelector('h2, h3, .det-text-customizable-product-weight-and-dimensions-title') : null;
          if (prev && prev.textContent.trim()) {
            title = prev.textContent.trim();
          }
          tableDataList.push({ title, rows: tableRows });
          table.remove();
        }
      });

      // 3. Extract Fit Definitions
      const fitOptions = [];
      strongElements.forEach((strong) => {
        const rawT = strong.textContent.trim().replace(':', '');
        if (['Narrow', 'Regular', 'Wide', 'High bridge fit', 'Low bridge fit', 'Universal fit', 'Adjustable nosepads'].includes(rawT)) {
          let desc = '';
          if (strong.nextSibling) {
            desc = strong.nextSibling.textContent.trim();
          }
          if (strong.parentElement && !desc) {
            desc = strong.parentElement.textContent.replace(strong.textContent, '').trim();
          }
          if (desc && !fitOptions.some((f) => f.title.toLowerCase() === rawT.toLowerCase())) {
            fitOptions.push({ title: rawT, desc });
          }
        }
      });

      // 4. Extract Diagrams and Feature Images
      const images = [];
      doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (src && !src.includes('arrow') && !src.includes('icon') && !images.some((i) => i.src === src)) {
          images.push({ src, caption: img.alt || 'Sizing & Specification Diagram' });
        }
      });

      // 5. Extract Feature Sections with Sequential DOM Walker
      const features = [];
      const rawHeadings = Array.from(doc.querySelectorAll('h2, h3, h4, h5, h6, .det-text-customizable-explore-panel-heading'));
      
      const excludedHeadingTerms = [
        'explore', 'description', 'specification', 'specifications',
        'fit information', 'frame size', 'frames and lenses', 'bridge and nosepads',
        'inbox', 'in the box', 'whats in the box', "what's in the box",
        'package contents', 'technical specifications'
      ];

      const featureHeadings = rawHeadings.filter((h) => {
        const text = h.textContent.trim();
        if (!text || text.length < 2 || text.length > 80) return false;
        const lower = text.toLowerCase();
        if (excludedHeadingTerms.some((term) => lower.includes(term))) return false;
        return true;
      });

      function isValidImgSrc(src) {
        if (!src) return false;
        const lower = src.toLowerCase();
        return !lower.includes('arrow') && !lower.includes('icon') && !lower.includes('logo') && !lower.startsWith('data:image');
      }

      function getCleanImgSrc(imgEl) {
        if (!imgEl) return null;
        const src = imgEl.getAttribute('src') || imgEl.getAttribute('data-mce-src') || imgEl.getAttribute('data-src') || imgEl.src;
        if (!isValidImgSrc(src)) return null;
        const s = src.trim();
        return s.startsWith('//') ? 'https:' + s : s;
      }

      featureHeadings.forEach((h, idx) => {
        const title = h.textContent.trim();
        const nextHeading = featureHeadings[idx + 1] || null;

        let bodyText = '';
        let featImg = null;

        // TreeWalker traverses all elements between h and nextHeading in exact document order
        if (doc.body) {
          const walker = doc.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_ELEMENT,
            null
          );
          walker.currentNode = h;

          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node === nextHeading || featureHeadings.includes(node)) {
              break;
            }

            // Extract image if not yet found
            if (!featImg) {
              if (node.tagName === 'IMG') {
                featImg = getCleanImgSrc(node);
              } else if (node.querySelector('img')) {
                featImg = getCleanImgSrc(node.querySelector('img'));
              }
            }

            // Extract text from paragraphs or feature card descriptions
            if (node.tagName === 'P' || (node.classList && node.classList.contains('app__feature__card__description'))) {
              const pText = node.textContent.trim();
              if (pText && !bodyText.includes(pText)) {
                bodyText += ' ' + pText;
              }
            }
          }
        }

        // Fallback for body text if TreeWalker didn't encounter <p> tags
        if (!bodyText.trim()) {
          let s = h.nextElementSibling;
          while (s && s !== nextHeading && !featureHeadings.includes(s)) {
            if (['H2', 'H3', 'H4', 'H5', 'H6'].includes(s.tagName) && s.textContent.trim()) break;
            if (s.textContent.trim()) bodyText += ' ' + s.textContent.trim();
            if (!featImg && s.querySelector('img')) featImg = getCleanImgSrc(s.querySelector('img'));
            s = s.nextElementSibling;
          }
        }

        // Secondary fallback for image from parent card if still missing
        if (!featImg) {
          const card = h.closest('.app__feature__card, [class*="feature"]') || h.closest('div');
          if (card) {
            const cardImg = card.querySelector('img');
            if (cardImg) featImg = getCleanImgSrc(cardImg);
            if (!featImg && card.nextElementSibling) {
              const nextImg = card.nextElementSibling.querySelector('img');
              if (nextImg) featImg = getCleanImgSrc(nextImg);
            }
          }
        }

        const cleanBody = bodyText.replace(/\s+/g, ' ').trim();
        if (cleanBody && cleanBody.length > 8) {
          features.push({ title, text: cleanBody.substring(0, 280), img: featImg });
        }
      });

      // Only reformat if we successfully identified structured components
      if (metrics.length > 0 || tableDataList.length > 0 || fitOptions.length > 0 || features.length > 0) {
        let outputHtml = '<div class="pdp-structured-description">';

        // Card A: Key Measurements & Specifications
        if (metrics.length > 0 || tableDataList.length > 0) {
          outputHtml += `
            <div class="pdp-desc-card">
              <div class="pdp-desc-card__header">
                <h4 class="pdp-desc-card__title">📐 Technical Specifications &amp; Measurements</h4>
                <span style="font-size: 10px; color: #64748b; font-weight: 600;">Verified Factory Data</span>
              </div>
          `;

          if (metrics.length > 0) {
            outputHtml += '<div class="pdp-metrics-grid">';
            metrics.forEach((m) => {
              outputHtml += `
                <div class="pdp-metric-badge">
                  <span class="pdp-metric-label">${m.label}</span>
                  <span class="pdp-metric-val">${m.val}</span>
                </div>
              `;
            });
            outputHtml += '</div>';
          }

          if (tableDataList.length > 0) {
            tableDataList.forEach((t) => {
              outputHtml += `
                <div style="margin-top: 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">${t.title}</div>
                  <table class="pdp-desc-table">
                    <tbody>
              `;
              t.rows.forEach((r) => {
                outputHtml += `<tr><td>${r.key}</td><td>${r.val}</td></tr>`;
              });
              outputHtml += '</tbody></table></div>';
            });
          }

          outputHtml += '</div>';
        }

        // Card B: Ergonomic Fit & Sizing Breakdown
        if (fitOptions.length > 0 || (images.length > 0 && metrics.length > 0)) {
          outputHtml += `
            <div class="pdp-desc-card">
              <div class="pdp-desc-card__header">
                <h4 class="pdp-desc-card__title">🎯 Fit &amp; Sizing Breakdown</h4>
                <span style="font-size: 10px; color: #64748b; font-weight: 600;">Athletic Ergonomics</span>
              </div>
          `;

          if (fitOptions.length > 0) {
            outputHtml += '<div class="pdp-fit-grid">';
            fitOptions.forEach((f) => {
              outputHtml += `
                <div class="pdp-fit-badge">
                  <strong>${f.title}</strong>
                  <p>${f.desc || 'Engineered for aerodynamic fit and comfort during motion.'}</p>
                </div>
              `;
            });
            outputHtml += '</div>';
          }

          if (images.length > 0) {
            const diag = images[0];
            outputHtml += `
              <div class="pdp-diagram-flex">
                <img src="${diag.src}" alt="${diag.caption}" class="pdp-diagram-img" loading="lazy">
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Precision Geometry Guide</div>
                  <p style="font-size: 10px; color: #475569; margin: 0; line-height: 1.5;">
                    Engineered to stay anchored without pressure points. Standard temple millimeter engravings verify exact lens width, bridge span, and arm retention for race-day stability.
                  </p>
                </div>
              </div>
            `;
          }

          outputHtml += '</div>';
        }

        // Card C: Engineering & Feature Highlights
        if (features.length > 0) {
          outputHtml += `
            <div class="pdp-desc-card">
              <div class="pdp-desc-card__header">
                <h4 class="pdp-desc-card__title">⚡ Performance &amp; Engineering Highlights</h4>
              </div>
              <div class="pdp-features-grid">
          `;
          features.forEach((feat) => {
            outputHtml += `
              <div class="pdp-feature-card">
                <h5 class="pdp-feature-card__title">${feat.title}</h5>
                <p style="margin: 0; color: #475569; line-height: 1.5;">${feat.text}</p>
                ${feat.img ? `<img src="${feat.img}" alt="${feat.title}" class="pdp-feature-card__img" loading="lazy">` : ''}
              </div>
            `;
          });
          outputHtml += '</div></div>';
        }

        outputHtml += '</div>';
        formattedEl.innerHTML = outputHtml;

        // Duplicate spec tables into the Specifications tab
        const extraSpecsContainer = document.querySelector('[data-specs-extra-container]');
        if (extraSpecsContainer && tableDataList.length > 0) {
          let extraTablesHtml = '';
          tableDataList.forEach((t) => {
            extraTablesHtml += `
              <div style="margin-top: 14px;">
                <h4 style="font-size: 12px; font-weight: 700; margin: 0 0 6px; color: #1e293b;">${t.title}</h4>
                <table class="pdp-desc-table"><tbody>
            `;
            t.rows.forEach((r) => {
              extraTablesHtml += `<tr><td>${r.key}</td><td>${r.val}</td></tr>`;
            });
            extraTablesHtml += '</tbody></table></div>';
          });
          extraSpecsContainer.innerHTML = extraTablesHtml;
        }

        // Collapsible height limiter
        setTimeout(() => {
          if (formattedEl.scrollHeight > 500) {
            formattedEl.classList.add('is-collapsible');
            const fadeOverlay = document.createElement('div');
            fadeOverlay.className = 'pdp-desc-fade-overlay';
            fadeOverlay.innerHTML = `
              <button type="button" class="pdp-desc-expand-btn" data-desc-expand-btn>
                <span>Show full guide &amp; specifications</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
              </button>
            `;
            formattedEl.appendChild(fadeOverlay);

            const btn = fadeOverlay.querySelector('[data-desc-expand-btn]');
            btn.addEventListener('click', function () {
              const isExpanded = formattedEl.classList.contains('is-expanded');
              if (isExpanded) {
                formattedEl.classList.remove('is-expanded');
                btn.querySelector('span').textContent = 'Show full guide & specifications';
                btn.querySelector('svg').style.transform = 'rotate(0deg)';
                formattedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              } else {
                formattedEl.classList.add('is-expanded');
                btn.querySelector('span').textContent = 'Show less';
                btn.querySelector('svg').style.transform = 'rotate(180deg)';
              }
            });
          }
        }, 50);
      }
    } catch (e) {
      console.warn('Could not reformat product description:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }
})();
