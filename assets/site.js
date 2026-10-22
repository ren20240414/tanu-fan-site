(() => {
  const toggle = document.querySelector('.menu-summary');
  const drawer = document.querySelector('#site-drawer');
  const backdrop = document.querySelector('.menu-backdrop');
  if (!toggle || !drawer || !backdrop) return;

  let closeTimer;
  const openMenu = () => {
    clearTimeout(closeTimer);
    backdrop.hidden = false;
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-visible');
    });
    drawer.querySelector('.drawer-close').focus();
  };
  const closeMenu = (restoreFocus = true) => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    closeTimer = setTimeout(() => { backdrop.hidden = true; }, 240);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });
  drawer.querySelectorAll('[data-menu-close]').forEach(button => button.addEventListener('click', () => closeMenu()));
  backdrop.addEventListener('click', () => closeMenu());
  drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
  });
})();

(() => {
  const NEWS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxhkSNb0V2lK-ij5BhuZhyHCSC2yEPtL3lXVK0zuNafYpSqpLp9cYDo4Fj_pS0YukBVXw/exec';
  const CACHE_KEY = 'tanu-fan-site-news-v1';
  const CACHE_TTL = 12 * 60 * 60 * 1000;
  const latestRoot = document.querySelector('[data-news-latest]');
  const archiveRoot = document.querySelector('[data-news-archive]');

  if (!latestRoot && !archiveRoot) return;

  const detailId = new URLSearchParams(window.location.search).get('id');
  const cached = readCache();
  const isFresh = cached && validPayload(cached.data) && Date.now() - cached.savedAt < CACHE_TTL;

  if (cached && validPayload(cached.data)) render(cached.data);
  if (isFresh) return;

  fetchNews()
    .then(data => {
      writeCache(data);
      render(data);
    })
    .catch(() => {
      if (cached && validPayload(cached.data)) return;
      showLoadError();
    });

  function fetchNews() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let finished = false;
      const timeout = window.setTimeout(() => finish(new Error('News request timed out')), 15000);

      function finish(error, data) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        delete window.receiveTanuNews;
        script.remove();
        if (error) reject(error);
        else resolve(data);
      }

      window.receiveTanuNews = data => {
        if (!validPayload(data)) {
          finish(new Error('Invalid news response'));
          return;
        }
        finish(null, data);
      };

      script.onerror = () => finish(new Error('News request failed'));
      script.src = NEWS_ENDPOINT + '?callback=receiveTanuNews&_=' + Date.now();
      document.head.appendChild(script);
    });
  }

  function validPayload(data) {
    return data && Array.isArray(data.items) && Array.isArray(data.latest);
  }

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return value && typeof value.savedAt === 'number' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    } catch (_) {
      // The live response remains usable when browser storage is unavailable.
    }
  }

  function render(data) {
    if (latestRoot) renderLatest(data.latest || [], data.items || []);
    if (archiveRoot) {
      const item = detailId
        ? (data.items || []).find(entry => String(entry.news_id) === detailId)
        : null;
      if (detailId) renderDetail(item);
      else renderArchive(data.items || []);
    }
  }

  function renderLatest(items, allItems) {
    latestRoot.replaceChildren();
    if (!items.length) {
      latestRoot.classList.add('latest-news-placeholder');
      latestRoot.textContent = '作戦会議中';
      return;
    }

    latestRoot.classList.remove('latest-news-placeholder');
    const list = document.createElement('ul');
    list.className = 'latest-news-list';
    items.slice(0, 2).forEach(item => {
      const row = document.createElement('li');
      row.className = 'latest-news-item';
      const fullItem = allItems.find(entry => String(entry.news_id) === String(item.news_id));
      const publishedAt = item.published_at || (fullItem && fullItem.published_at);
      if (publishedAt) {
        const date = makeDate(publishedAt);
        date.className = 'latest-news-date';
        row.appendChild(date);
      }
      const link = document.createElement('a');
      link.href = 'news/?id=' + encodeURIComponent(item.news_id);
      link.textContent = item.title;
      row.appendChild(link);
      list.appendChild(row);
    });
    latestRoot.appendChild(list);
  }

  function renderArchive(items) {
    archiveRoot.replaceChildren();
    if (!items.length) {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = '📜';
      archiveRoot.append(icon, document.createTextNode('新しい便りは、これからここに届きます。'));
      return;
    }

    archiveRoot.className = 'news-archive-list';
    items.forEach(item => {
      const row = document.createElement('article');
      row.className = 'news-archive-item';
      const date = makeDate(item.published_at);
      const link = document.createElement('a');
      link.className = 'news-entry-link';
      link.href = '?id=' + encodeURIComponent(item.news_id);
      link.textContent = item.title;
      row.append(date, link);
      archiveRoot.appendChild(row);
    });
  }

  function renderDetail(item) {
    const eyebrow = document.querySelector('[data-news-eyebrow]');
    const heading = document.querySelector('[data-news-heading]');
    const intro = document.querySelector('[data-news-intro]');
    const breadcrumb = document.querySelector('.breadcrumbs');

    if (!item) {
      if (eyebrow) eyebrow.textContent = 'NEWS';
      if (heading) heading.textContent = 'ニュースが見つかりません';
      if (intro) intro.textContent = '公開が終了したか、URLが正しくない可能性があります。';
      renderBackLink(archiveRoot);
      return;
    }

    document.title = item.title + ' — tanu 非公式ファンサイト';
    if (eyebrow) eyebrow.textContent = 'NEWS';
    if (heading) heading.textContent = item.title;
    if (intro) intro.textContent = '';
    if (breadcrumb) breadcrumb.append(document.createTextNode('　/　' + item.title));

    archiveRoot.className = 'news-detail';
    archiveRoot.replaceChildren();
    archiveRoot.appendChild(makeDate(item.published_at));

    const imageUrl = safeHttpUrl(item.image_url);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'news-detail-image';
      image.src = imageUrl;
      image.alt = item.title;
      image.loading = 'lazy';
      archiveRoot.appendChild(image);
    }

    const body = document.createElement('div');
    body.className = 'news-detail-body';
    body.textContent = item.body;
    archiveRoot.appendChild(body);

    const urls = (item.related_urls || []).map(safeHttpUrl).filter(Boolean);
    if (urls.length) {
      const list = document.createElement('ul');
      list.className = 'news-related-links';
      urls.forEach(url => {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = url;
        row.appendChild(link);
        list.appendChild(row);
      });
      archiveRoot.appendChild(list);
    }

    renderBackLink(archiveRoot);
  }

  function renderBackLink(root) {
    const link = document.createElement('a');
    link.className = 'news-back-link';
    link.href = './';
    link.textContent = '← ニュース一覧へ戻る';
    root.appendChild(link);
  }

  function makeDate(value) {
    const date = document.createElement('time');
    date.dateTime = value || '';
    date.textContent = formatDate(value);
    return date;
  }

  function formatDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? match[1] + '年' + Number(match[2]) + '月' + Number(match[3]) + '日' : value || '';
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function showLoadError() {
    if (latestRoot) {
      latestRoot.classList.add('news-load-error');
      latestRoot.textContent = 'ニュースを読み込めませんでした。';
    }
    if (archiveRoot) {
      archiveRoot.classList.add('news-load-error');
      archiveRoot.textContent = 'ニュースを読み込めませんでした。時間をおいて再度ご覧ください。';
    }
  }
})();
