const TreeView = (() => {
  function renderSessionTree(session, container) {
    container.innerHTML = '';

    if (!session || !session.windows || session.windows.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">No tabs in this session</p>
        </div>`;
      return;
    }

    const domainMap = new Map();

    session.windows.forEach((win, winIndex) => {
      win.tabs.forEach(tab => {
        let domain;
        try {
          domain = new URL(tab.url).hostname;
        } catch {
          domain = 'other';
        }

        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain).push({ ...tab, windowIndex: winIndex });
      });
    });

    const sortedDomains = Array.from(domainMap.entries())
      .sort((a, b) => b[1].length - a[1].length);

    const root = document.createElement('div');
    root.className = 'tree-root';

    const allTabsNode = createTreeNode({
      label: 'All Tabs',
      count: session.totalTabs,
      expanded: true,
      isRoot: true
    });

    const allChildren = document.createElement('div');
    allChildren.className = 'tree-children';

    for (const [domain, tabs] of sortedDomains) {
      const domainNode = createDomainNode(domain, tabs);
      allChildren.appendChild(domainNode);
    }

    allTabsNode.appendChild(allChildren);
    root.appendChild(allTabsNode);
    container.appendChild(root);
  }

  function createDomainNode(domain, tabs) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    const header = document.createElement('div');
    header.className = 'tree-node-header';

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;

    const icon = document.createElement('span');
    icon.className = 'tree-icon domain-icon';
    const letter = domain.replace('www.', '').charAt(0).toUpperCase();
    icon.textContent = letter;
    icon.style.background = getDomainColor(domain);

    const label = document.createElement('span');
    label.className = 'tree-label tree-domain';
    label.textContent = domain.replace('www.', '');

    const count = document.createElement('span');
    count.className = 'tree-count';
    count.textContent = tabs.length;

    header.appendChild(toggle);
    header.appendChild(icon);
    header.appendChild(label);
    header.appendChild(count);

    const children = document.createElement('div');
    children.className = 'tree-children';

    tabs.sort((a, b) => a.index - b.index).forEach(tab => {
      const tabNode = createTabNode(tab);
      children.appendChild(tabNode);
    });

    let expanded = true;
    children.style.display = 'block';
    toggle.classList.add('expanded');

    header.addEventListener('click', () => {
      expanded = !expanded;
      children.style.display = expanded ? 'block' : 'none';
      toggle.classList.toggle('expanded', expanded);
    });

    node.appendChild(header);
    node.appendChild(children);
    return node;
  }

  function createTabNode(tab) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    const header = document.createElement('div');
    header.className = 'tree-node-header';

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle empty';

    const favicon = document.createElement('img');
    favicon.className = 'tree-icon';
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%235c5f66" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>'
    );
    favicon.onerror = function() {
      this.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.className = 'tree-icon domain-icon';
      fallback.textContent = '?';
      fallback.style.background = 'var(--bg-hover)';
      this.parentNode.insertBefore(fallback, this.nextSibling);
    };

    const status = document.createElement('span');
    status.className = 'tree-status ' + (tab.status || 'complete');

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = tab.title || tab.url;
    label.title = tab.url;

    header.appendChild(toggle);
    header.appendChild(favicon);
    header.appendChild(status);
    header.appendChild(label);

    if (tab.pinned) {
      const pinBadge = document.createElement('span');
      pinBadge.className = 'tree-group-badge';
      pinBadge.style.background = 'rgba(28, 126, 214, 0.2)';
      pinBadge.style.color = 'var(--accent)';
      pinBadge.textContent = 'PIN';
      header.appendChild(pinBadge);
    }

    if (tab.muted) {
      const muteBadge = document.createElement('span');
      muteBadge.className = 'tree-group-badge';
      muteBadge.style.background = 'rgba(92, 95, 102, 0.3)';
      muteBadge.style.color = 'var(--text-muted)';
      muteBadge.textContent = 'MUTE';
      header.appendChild(muteBadge);
    }

    header.addEventListener('click', () => {
      document.querySelectorAll('.tree-node-header.active').forEach(el => {
        el.classList.remove('active');
      });
      header.classList.add('active');
    });

    header.addEventListener('dblclick', () => {
      chrome.tabs.create({ url: tab.url, active: true });
    });

    node.appendChild(header);
    return node;
  }

  function createTreeNode({ label, count, expanded = false, isRoot = false }) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    const header = document.createElement('div');
    header.className = 'tree-node-header' + (isRoot ? ' active' : '');

    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle' + (expanded ? ' expanded' : '');
    toggle.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;

    const labelEl = document.createElement('span');
    labelEl.className = 'tree-label';
    labelEl.textContent = label;

    header.appendChild(toggle);
    header.appendChild(labelEl);

    if (count !== undefined) {
      const countEl = document.createElement('span');
      countEl.className = 'tree-count';
      countEl.textContent = count;
      header.appendChild(countEl);
    }

    node.appendChild(header);
    return node;
  }

  function getDomainColor(domain) {
    const colors = [
      '#1c7ed6', '#40c057', '#fab005', '#fa5252',
      '#be4bdb', '#e8590c', '#1098ad', '#845ef7'
    ];
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function renderCurrentTabs(container) {
    chrome.windows.getAll({ populate: true }, (windows) => {
      const session = {
        windows: windows.map(w => ({
          tabs: w.tabs.map(t => ({
            url: t.url,
            title: t.title,
            favIconUrl: t.favIconUrl || '',
            status: t.status || 'complete',
            pinned: t.pinned,
            muted: t.mutedInfo?.muted || false,
            active: t.active,
            groupId: t.groupId || -1,
            index: t.index
          }))
        })),
        totalTabs: windows.reduce((sum, w) => sum + w.tabs.length, 0)
      };
      renderSessionTree(session, container);
    });
  }

  return {
    renderSessionTree,
    renderCurrentTabs
  };
})();
