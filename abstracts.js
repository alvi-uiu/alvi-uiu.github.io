/* Abstract window for the Selected Publications list.
   One shared overlay; the text lives next to each paper in index.html. */
(function () {
  'use strict';

  var overlay = document.getElementById('abstract-overlay');
  if (!overlay) return;

  var venueEl = document.getElementById('abstract-venue');
  var titleEl = document.getElementById('abstract-title');
  var textEl = document.getElementById('abstract-text');
  var closeBtn = document.getElementById('abstract-close');
  var lastFocus = null;
  var hideTimer = null;
  var isOpen = false;

  function show(btn) {
    var src = document.getElementById(btn.getAttribute('data-abstract'));
    var article = btn.closest ? btn.closest('.pub') : null;
    if (!src || !article) return;

    venueEl.textContent = article.querySelector('.pub-venue').textContent;
    titleEl.textContent = article.querySelector('.pub-title').textContent;
    textEl.textContent = src.textContent.trim();

    lastFocus = btn;
    isOpen = true;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    overlay.hidden = false;
    /* Hide the page scrollbar but keep the layout from shifting sideways. */
    var gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) document.documentElement.style.paddingRight = gutter + 'px';
    document.documentElement.classList.add('abstract-open');

    /* Read layout once so the transition starts from the collapsed state
       instead of being batched away. */
    void overlay.offsetWidth;
    overlay.classList.add('is-open');
    closeBtn.focus();
  }

  function hide() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.documentElement.classList.remove('abstract-open');
    document.documentElement.style.paddingRight = '';
    hideTimer = setTimeout(function () {
      overlay.hidden = true;
      hideTimer = null;
    }, 380);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.pub-abstract-btn'), function (btn) {
    btn.addEventListener('click', function () { show(btn); });
  });

  closeBtn.addEventListener('click', hide);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) hide();
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      closeBtn.focus();
    }
  });
})();
