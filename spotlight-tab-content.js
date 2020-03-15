main();

let state = {
  visible: false,
  el: null,
  cursor: 0,
  keyword: '',
  tabs: [],
  results: []
};

function main() {
  window.addEventListener('keydown', e => {
    let isMac = navigator.platform.indexOf('Mac') > -1;
    let isCmdKeyPress = (isMac && e.metaKey) || (!isMac && e.ctrlKey);

    if (isCmdKeyPress && e.key === '\\') {
      if (!document.querySelector('.__spotlight-tab')) {
        initSpotlight();
      } else {
        if (state.visible) {
          hideSpotlight();
        } else {
          unhideSpotlight();
        }
      }
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideSpotlight();
    }
  });
}

function getAllTabs(cb) {
  chrome.runtime.sendMessage({ action: 'prepare-tabs' }, function() {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'get-tabs' }, function(response) {
        cb(response);
      });
    }, 10);
  });
}

function search(keywork, tabs) {
  let result = [];

  tabs.forEach(tab => {
    if (tab.title.toLowerCase().includes(keywork.toLowerCase())) {
      result.push(tab);
    }
  });

  return result.slice(0, 10);
}

function initSpotlight() {
  let el = createSpotlightContainer();

  el.innerHTML = `<div class="__spotlight-tab-inner">
    <input type="text" class="__spotlight-tab-input" />
    <div class="__spotlight-result-list"></div>
  </div>`;
  el.querySelector('.__spotlight-tab-input').focus();
  el.querySelector('.__spotlight-tab-input').addEventListener('input', e => {
    state.cursor = 0;
    state.keyword = e.target.value;
    state.results = e.target.value
      ? search(e.target.value, state.tabs)
      : state.tabs;

    showSearchResult(state.results);
  });

  el.querySelector('.__spotlight-tab-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      let tab = state.results[state.cursor];
      if (!tab) return;

      hideSpotlight();
      focusOnTab(tab.id, tab.windowId);
    }

    if (e.key === 'ArrowUp') {
      state.cursor--;
      if (state.cursor < 0) {
        state.cursor = 0;
      }
      highLightResultItem(state.cursor);
    }

    if (e.key === 'ArrowDown') {
      state.cursor++;
      if (state.cursor > state.results.length - 1) {
        state.cursor = state.results.length - 1;
      }
      highLightResultItem(state.cursor);
    }
  });

  el.querySelector('.__spotlight-result-list').addEventListener('click', e => {
    if (e.target.dataset && e.target.dataset.tabId) {
      hideSpotlight();

      focusOnTab(+e.target.dataset.tabId, +e.target.dataset.windowId);
    }
  });

  state.visible = true;
  state.el = el;

  getAllTabs(tabs => {
    console.log('tabs', tabs);
    state.tabs = tabs;
    state.results = tabs;
    showSearchResult(tabs);
  });
}

function unhideSpotlight() {
  state.visible = true;
  state.el.classList.remove('hidden');
  state.el.querySelector('.__spotlight-tab-input').focus();
  state.el.querySelector('.__spotlight-tab-input').select();

  getAllTabs(tabs => {
    state.tabs = tabs;
    state.results = state.keyword
      ? search(state.keyword, state.tabs)
      : state.tabs;

    showSearchResult(state.results);
  });
}

function highLightResultItem(index) {
  state.el.querySelectorAll('.__spotlight-result-item').forEach((item, i) => {
    if (i === index) {
      item.classList.add('__spotlight-result-focused');
    } else {
      item.classList.remove('__spotlight-result-focused');
    }
  });
}

function showSearchResult(results) {
  let listHTML = results
    .map(
      (tab, i) => `
    <div
      data-window-id="${tab.windowId}"
      data-tab-id="${tab.id}"
      class="__spotlight-result-item
      ${i === state.cursor ? '__spotlight-result-focused' : ''}"
    >
      ${
        tab.favIconUrl
          ? `<img class="__spotlight-result-item-favicon" alt="${tab.title}" src="${tab.favIconUrl}" />`
          : `<span class="__spotlight-result-item-favicon-placeholder"></span>`
      }

      <div class="__spotlight-result-item-title">${tab.title}</div>
    </div>`
    )
    .join('');
  state.el.querySelector('.__spotlight-result-list').innerHTML = listHTML;
}

function hideSpotlight() {
  state.visible = false;
  state.el.classList.add('hidden');
}

function focusOnTab(tabId, windowId) {
  chrome.runtime.sendMessage({
    action: 'goto-tab',
    tabId,
    windowId
  });
}

function createSpotlightContainer() {
  let el = document.createElement('div');
  el.className = '__spotlight-tab';
  document.body.appendChild(el);

  return el;
}
