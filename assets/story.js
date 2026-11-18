(() => {
  const STORY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxhkSNb0V2lK-ij5BhuZhyHCSC2yEPtL3lXVK0zuNafYpSqpLp9cYDo4Fj_pS0YukBVXw/exec?content=story';
  const CACHE_KEY = 'tanu-fan-site-story-v1';
  const CACHE_TTL = 12 * 60 * 60 * 1000;
  const list = document.querySelector('[data-story-list]');
  const count = document.querySelector('[data-story-count]');
  const dialog = document.querySelector('[data-story-dialog]');
  if (!list) return;

  if (dialog) {
    dialog.querySelector('[data-story-dialog-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }

  const cached = readCache();
  const fresh = cached && Array.isArray(cached.data.items) && Date.now() - cached.savedAt < CACHE_TTL;
  if (cached && Array.isArray(cached.data.items)) render(cached.data.items);
  if (fresh) return;

  fetchStory()
    .then(data => {
      writeCache(data);
      render(data.items);
    })
    .catch(() => {
      if (cached && Array.isArray(cached.data.items)) return;
      list.classList.add('story-load-error');
      renderEmpty('これまでの物語を読み込めませんでした。時間をおいて再度ご覧ください。');
    });

  function fetchStory() {
    return new Promise((resolve, reject) => {
      const callback = 'receiveTanuStory';
      const script = document.createElement('script');
      let finished = false;
      const timeout = window.setTimeout(() => finish(new Error('Story request timed out')), 15000);

      function finish(error, data) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        delete window[callback];
        script.remove();
        if (error) reject(error);
        else resolve(data);
      }

      window[callback] = data => {
        if (!data || !Array.isArray(data.items)) return finish(new Error('Invalid story response'));
        finish(null, data);
      };
      script.onerror = () => finish(new Error('Story request failed'));
      script.src = STORY_ENDPOINT + (STORY_ENDPOINT.includes('?') ? '&' : '?') + 'callback=' + callback + '&_=' + Date.now();
      document.head.appendChild(script);
    });
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
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch (_) { /* live response still works */ }
  }

  function render(items) {
    list.replaceChildren();
    if (count) count.textContent = String(items.length);
    if (!items.length) {
      renderEmpty('公開中の記録はまだありません。');
      return;
    }

    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'story-entry-card';

      const date = document.createElement('div');
      date.className = 'story-entry-date';
      date.textContent = formatDateRange(item.start_date, item.end_date);
      card.appendChild(date);

      if (item.event_type) {
        const type = document.createElement('div');
        type.className = 'story-entry-type';
        type.textContent = item.event_type;
        card.appendChild(type);
      }

      const title = document.createElement('button');
      title.className = 'story-entry-title-button';
      title.type = 'button';
      title.textContent = item.title || 'タイトル未設定';
      title.addEventListener('click', () => openStoryDialog(item));
      card.appendChild(title);

      list.appendChild(card);
    });
  }

  function openStoryDialog(item) {
    if (!dialog) return;
    dialog.querySelector('[data-story-dialog-date]').textContent = formatDateRange(item.start_date, item.end_date);
    const type = dialog.querySelector('[data-story-dialog-type]');
    type.textContent = item.event_type || '';
    type.hidden = !item.event_type;
    dialog.querySelector('[data-story-dialog-title]').textContent = item.title || 'タイトル未設定';

    const content = dialog.querySelector('[data-story-dialog-content]');
    content.replaceChildren();
    const imageUrl = safeHttpUrl(item.image_url);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'story-entry-image';
      image.src = imageUrl;
      image.alt = item.title || '';
      image.loading = 'lazy';
      content.appendChild(image);
    }

    appendDetail(content, '概要', item.summary);
    appendDetail(content, '物語', item.story);
    appendDetail(content, '結果・実績', item.result);
    if (item.event_type === 'リアルライブ' || item.event_type === '17LIVEリアルイベント') {
      appendDetail(content, '会場', item.venue);
    }
    if (item.event_type === 'リアルライブ') appendDetail(content, '共演者', item.co_stars);

    const relatedUrls = (Array.isArray(item.related_urls) ? item.related_urls : String(item.related_url || '').split(/\r?\n/))
      .map(safeHttpUrl)
      .filter(Boolean);
    if (relatedUrls.length) {
      const section = document.createElement('section');
      section.className = 'story-detail-section';
      const heading = document.createElement('h3');
      heading.textContent = '関連URL';
      const links = document.createElement('ul');
      links.className = 'story-entry-links';
      relatedUrls.forEach((url, index) => {
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = relatedUrls.length > 1 ? '関連ページ ' + (index + 1) : '関連ページを見る';
        row.appendChild(link);
        links.appendChild(row);
      });
      section.append(heading, links);
      content.appendChild(section);
    }

    dialog.showModal();
  }

  function appendDetail(root, label, value) {
    if (!value) return;
    const section = document.createElement('section');
    section.className = 'story-detail-section';
    const heading = document.createElement('h3');
    heading.textContent = label;
    const paragraph = document.createElement('p');
    paragraph.textContent = value;
    section.append(heading, paragraph);
    root.appendChild(section);
  }

  function renderEmpty(message) {
    if (count) count.textContent = '0';
    list.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'story-empty-state';
    empty.textContent = message;
    list.appendChild(empty);
  }

  function formatDateRange(start, end) {
    const first = formatDate(start);
    const last = formatDate(end);
    if (!first) return last;
    return last ? first + '～' + last : first;
  }

  function formatDate(value) {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value || '');
    return match ? match[1] + '年' + Number(match[2]) + '月' + Number(match[3]) + '日' : value || '';
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (_) { return ''; }
  }
})();
