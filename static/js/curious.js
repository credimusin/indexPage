/**
 * imaginalOS - Curious Navigation Module
 * Provides a discovery-based button, persistent dropdown dock, and clean document viewer.
 */
(function() {
    window.imaginalOS = window.imaginalOS || {};

    const IGNORED_ENTRIES = new Set(['fun', 'feedback', 'secrets']);

    let curiousWidget = null;
    let docViewerEl = null;
    let isMenuOpen = false;
    let isRevealed = false;
    let menuListContainer = null;

    // Movement tracking state (~x2 threshold)
    let totalDist = 0;
    let turns = 0;
    let lastX = null;
    let lastY = null;
    let lastAngle = null;

    let vfsLoadingPromise = null;
    function ensureVFS() {
        if (window.imaginalOS.filesystem) return Promise.resolve(true);
        if (vfsLoadingPromise) return vfsLoadingPromise;

        vfsLoadingPromise = new Promise((resolve) => {
            if (window.imaginalOS.filesystem) {
                resolve(true);
                return;
            }
            const existing = document.querySelector('script[src*="vfs.js"]');
            if (existing) {
                if (window.imaginalOS.filesystem) {
                    resolve(true);
                } else {
                    existing.addEventListener('load', () => resolve(true));
                    existing.addEventListener('error', () => {
                        vfsLoadingPromise = null;
                        resolve(false);
                    });
                }
                return;
            }
            const script = document.createElement('script');
            script.src = '/static/js/vfs.js';
            script.async = false;
            script.onload = () => resolve(true);
            script.onerror = () => {
                vfsLoadingPromise = null;
                resolve(false);
            };
            document.body.appendChild(script);
        });

        return vfsLoadingPromise;
    }

    function formatDisplayName(filename) {
        const base = filename.replace(/\.[^.]+$/, '');
        return base
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function getProjectItems() {
        const fs = window.imaginalOS.filesystem || window.imaginalOS.defaultVFS;
        let projectsChildren = null;
        try {
            projectsChildren = fs.children.home.children.bmo.children.projects.children;
        } catch {}

        if (projectsChildren && typeof projectsChildren === 'object' && Object.keys(projectsChildren).length > 0) {
            return Object.keys(projectsChildren).map(fileName => {
                return {
                    name: formatDisplayName(fileName),
                    path: `/home/bmo/projects/${fileName}`,
                    fileName: fileName
                };
            });
        }

        // Fallback defaults
        return [
            { name: 'Imaginal', path: '/home/bmo/projects/imaginal.txt', fileName: 'imaginal.txt' },
            { name: 'Cashflow 360', path: '/home/bmo/projects/cashflow_360.txt', fileName: 'cashflow_360.txt' },
            { name: 'Drills', path: '/home/bmo/projects/drills.txt', fileName: 'drills.txt' }
        ];
    }

    function renderProjectsSublist(container) {
        if (!container) return;
        container.innerHTML = '';
        const items = getProjectItems();
        items.forEach(sub => {
            const subItem = document.createElement('div');
            subItem.className = 'curious-item curious-sub-item';
            subItem.setAttribute('data-path', sub.path);
            subItem.setAttribute('data-name', sub.fileName);
            subItem.textContent = sub.name;
            container.appendChild(subItem);
        });
    }

    function getMenuItems() {
        const fs = window.imaginalOS.filesystem || window.imaginalOS.defaultVFS;
        let bmoChildren = null;
        try {
            bmoChildren = fs.children.home.children.bmo.children;
        } catch {}

        if (!bmoChildren) {
            return [
                { name: 'About', path: '/home/bmo/about.txt', fileName: 'about.txt' },
                { name: 'Dossier', path: '/home/bmo/dossier.txt', fileName: 'dossier.txt' },
                { name: 'Draft rates', path: '/home/bmo/draft_rates.cfg', fileName: 'draft_rates.cfg' },
                { name: 'Projects', isFolder: true, path: '/home/bmo/projects' },
                { name: 'Contacts', path: '/home/bmo/contact.txt', fileName: 'contact.txt' }
            ];
        }

        const items = [];
        const keys = Object.keys(bmoChildren);

        const orderWeight = (key) => {
            if (key === 'about.txt') return 10;
            if (key === 'dossier.txt') return 20;
            if (key === 'draft_rates.cfg') return 30;
            if (key === 'projects') return 90;
            if (key === 'contact.txt') return 100;
            return 50;
        };

        const sortedKeys = keys
            .filter(k => !k.startsWith('.') && !IGNORED_ENTRIES.has(k))
            .sort((a, b) => orderWeight(a) - orderWeight(b));

        for (const key of sortedKeys) {
            const node = bmoChildren[key];
            if (key === 'projects' || (node && node.type === 'dir')) {
                items.push({
                    name: formatDisplayName(key),
                    isFolder: true,
                    path: `/home/bmo/${key}`
                });
            } else if (node && node.type === 'file') {
                const displayName = key === 'contact.txt' ? 'Contacts' : formatDisplayName(key);
                items.push({
                    name: displayName,
                    path: `/home/bmo/${key}`,
                    fileName: key
                });
            }
        }

        return items;
    }

    function renderMenuList(container) {
        if (!container) return;
        container.innerHTML = '';
        const items = getMenuItems();

        items.forEach(item => {
            if (item.isFolder) {
                const folderHeader = document.createElement('div');
                folderHeader.className = 'curious-accordion-header';
                folderHeader.innerHTML = `
                    <span class="item-name">${window.imaginalOS.escapeHtml(item.name)}</span>
                    <span class="accordion-arrow">▼</span>
                `;

                const subList = document.createElement('div');
                subList.className = 'curious-sub-list';
                renderProjectsSublist(subList);

                folderHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanding = !folderHeader.classList.contains('expanded');
                    if (isExpanding) {
                        renderProjectsSublist(subList);
                    }
                    folderHeader.classList.toggle('expanded');
                    subList.classList.toggle('expanded');
                    if (window.imaginalOS.playBeepSound) {
                        window.imaginalOS.playBeepSound(800, 0.04, 'sine');
                    }
                });

                container.appendChild(folderHeader);
                container.appendChild(subList);
            } else {
                const itemEl = document.createElement('div');
                itemEl.className = 'curious-item';
                itemEl.setAttribute('data-path', item.path);
                itemEl.setAttribute('data-name', item.fileName);
                itemEl.textContent = item.name;
                container.appendChild(itemEl);
            }
        });
    }

    // Link rules for the document viewer. Input must already be escaped.
    const TERM_LINK_STYLE = 'color: #64ffda; text-decoration: underline; cursor: pointer;';
    const termLink = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer" class="term-link" style="${TERM_LINK_STYLE}">${label}</a>`;

    function formatDocContent(text) {
        let escaped = window.imaginalOS.escapeHtml(text);

        escaped = escaped.replace(/(https?:\/\/[^\s&<"';()]+)/g, (url) => termLink(url, url));
        // Bare github.com / t.me references that carry no protocol
        escaped = escaped.replace(/(^|\s)(github\.com\/[^\s&<"';()]+)/g,
            (match, lead, bare) => lead + termLink(`https://${bare}`, bare));
        escaped = escaped.replace(/(^|\s)(t\.me\/[^\s&<"';()]+)/g,
            (match, lead, bare) => lead + termLink(`https://${bare}`, bare));
        escaped = escaped.replace(/(^|\s)@([a-zA-Z0-9_]{5,32})\b/g,
            (match, lead, handle) => lead + termLink(`https://t.me/${handle}`, `@${handle}`));
        escaped = escaped.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            (mail) => termLink(`mailto:${mail}`, mail));

        return escaped;
    }

    async function loadFileContent(filePath) {
        const res = window.imaginalOS.resolvePath(filePath);
        if (res && res.node && res.node.content !== undefined && !res.node.content.startsWith('IMAGE:')) {
            return res.node.content;
        }

        if (res && res.node) {
            return (await window.imaginalOS.loadNodeContent(res.node)) || '[Error: Could not load document content]';
        }

        // The VFS was not available; fall back to the on-disk catalogue path.
        const contentPath = 'static/vfs/' + filePath.replace(/^\/?home\/bmo\//, '');
        try {
            const response = await fetch('/' + contentPath);
            if (response.ok) return await response.text();
        } catch {}
        return '[Error: Could not load document content]';
    }

    function cleanTitleString(raw) {
        let s = raw.trim();
        if (s === s.toUpperCase()) {
            s = s.toLowerCase();
            s = s.charAt(0).toUpperCase() + s.slice(1);
            s = s.replace(/\bbmo\b/gi, 'BMO')
                 .replace(/\bcv\b/gi, 'CV')
                 .replace(/\bui\b/gi, 'UI')
                 .replace(/\bos\b/gi, 'OS')
                 .replace(/\bapi\b/gi, 'API');
        }
        return s;
    }

    function parseDocContent(content, fallbackName) {
        if (!content || typeof content !== 'string') {
            return { title: fallbackName || 'Document', body: '' };
        }

        const lines = content.split(/\r?\n/);
        let firstNonEmptyIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
                firstNonEmptyIdx = i;
                break;
            }
        }

        if (firstNonEmptyIdx === -1) {
            return { title: fallbackName || 'Document', body: content };
        }

        const first = lines[firstNonEmptyIdx].trim();
        let title = null;

        // Pattern 1: === TITLE === or ==== TITLE ==== (strip leading/trailing = and spaces)
        const eqMatch = first.match(/^={2,}\s*(.+?)\s*={2,}$/);
        if (eqMatch) {
            title = cleanTitleString(eqMatch[1]);
        }

        // Pattern 2: [Project: Name] or [Project Name]
        if (!title) {
            const bracketMatch = first.match(/^\[(?:Project:\s*)?(.+?)\]$/i);
            if (bracketMatch) {
                const name = bracketMatch[1].trim();
                title = `Project: ${name.charAt(0).toUpperCase() + name.slice(1)}`;
            }
        }

        // Pattern 3: # Title or # CONFIDENTIAL: TITLE - ...
        if (!title && first.startsWith('#')) {
            let text = first.replace(/^#+\s*/, '').trim();
            if (/draft rate card/i.test(text)) {
                title = 'Draft Rate Card';
            } else {
                text = text.replace(/^confidential:\s*/i, '').replace(/\s*[-!].*$/, '').trim();
                if (text) {
                    title = cleanTitleString(text);
                }
            }
        }

        if (title) {
            // Strip header line and any immediately following blank lines
            let startIdx = firstNonEmptyIdx + 1;
            while (startIdx < lines.length && lines[startIdx].trim().length === 0) {
                startIdx++;
            }
            return {
                title: title,
                body: lines.slice(startIdx).join('\n')
            };
        }

        return {
            title: fallbackName || 'Document',
            body: content.trim()
        };
    }

    function bringToFront(el) {
        if (!el) return;
        window.imaginalOS.topZIndex = Math.max(window.imaginalOS.topZIndex || 9999, 10000) + 2;
        el.style.zIndex = window.imaginalOS.topZIndex;
    }
    window.imaginalOS.bringToFront = bringToFront;

    function makeWindowDraggable(winEl, headerEl) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        headerEl.addEventListener('mousedown', (e) => {
            if (e.target.closest('.dot') || e.target.closest('button')) return;
            if (winEl.classList.contains('maximized') || winEl.classList.contains('minimized')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = winEl.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            winEl.style.transform = 'none';
            winEl.style.left = `${initialLeft}px`;
            winEl.style.top = `${initialTop}px`;

            const onDragMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                winEl.style.left = `${Math.max(10, Math.min(window.innerWidth - 80, initialLeft + dx))}px`;
                winEl.style.top = `${Math.max(10, Math.min(window.innerHeight - 60, initialTop + dy))}px`;
            };

            const onDragEnd = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onDragMove);
                document.removeEventListener('mouseup', onDragEnd);
            };

            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
        });
    }
    window.imaginalOS.makeWindowDraggable = makeWindowDraggable;

    function closeDocViewerAnimated(win) {
        if (!win) return Promise.resolve();
        win.classList.remove('active');
        if (win.style.transform && win.style.transform.includes('scale(1)')) {
            win.style.transform = win.style.transform.replace('scale(1)', 'scale(0.9)');
        }
        return new Promise(resolve => {
            setTimeout(() => {
                if (win.parentNode) win.remove();
                resolve();
            }, 200);
        });
    }

    function destroyDocViewer(immediate = false) {
        if (!docViewerEl) return;
        const win = docViewerEl;
        docViewerEl = null;
        if (window.imaginalOS.playBeepSound) {
            window.imaginalOS.playBeepSound(400, 0.05, 'sine');
        }
        if (immediate) {
            if (win.parentNode) win.remove();
            return;
        }
        return closeDocViewerAnimated(win);
    }

    function onTerminalOpen() {
        destroyDocViewer(true);
        closeMenu();
        if (curiousWidget) {
            curiousWidget.classList.add('terminal-hidden');
        }
    }

    function onTerminalClose() {
        if (curiousWidget) {
            curiousWidget.classList.remove('terminal-hidden');
        }
    }

    window.imaginalOS.onTerminalOpen = onTerminalOpen;
    window.imaginalOS.onTerminalClose = onTerminalClose;

    function toggleDocViewerMinimize() {
        if (!docViewerEl) return;
        docViewerEl.classList.toggle('minimized');
    }

    function toggleDocViewerMaximize() {
        if (!docViewerEl) return;
        docViewerEl.classList.toggle('maximized');
    }

    async function showDocumentViewer(filePath) {
        if (window.imaginalOS.playBeepSound) {
            window.imaginalOS.playBeepSound(650, 0.08, 'sine');
        }

        // If a viewer window is currently open, smoothly close it first
        const prevWin = docViewerEl;
        docViewerEl = null;

        // The VFS has to be in place before the path can be resolved, and the
        // old window is torn down while the document is being fetched.
        await ensureVFS();
        const [rawContent] = await Promise.all([
            loadFileContent(filePath),
            closeDocViewerAnimated(prevWin)
        ]);

        const fallback = formatDisplayName(filePath.split('/').pop());
        const parsed = parseDocContent(rawContent, fallback);
        const formattedHTML = formatDocContent(parsed.body);
        const docTitle = parsed.title;

        docViewerEl = document.createElement('div');
        docViewerEl.id = 'doc-viewer-window';
        // Note: created without 'active' class so CSS transition triggers smoothly on bloom
        docViewerEl.className = 'terminal-window doc-viewer-window';
        docViewerEl.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-dots">
                    <span class="dot close" title="Close"></span>
                    <span class="dot minimize" title="Minimize"></span>
                    <span class="dot maximize" title="Maximize"></span>
                </div>
                <div class="terminal-title">${window.imaginalOS.escapeHtml(docTitle)}</div>
                <div style="width: 50px;"></div>
            </div>
            <div class="terminal-body">
                <div class="terminal-output doc-viewer-content">${formattedHTML}</div>
            </div>
        `;

        // If terminal is currently open and visible, offset doc viewer slightly so both are visible
        const term = window.imaginalOS.terminalContainer;
        const isTermActive = term && term.classList.contains('active') && !term.classList.contains('minimized');
        if (isTermActive) {
            docViewerEl.style.transform = 'translate(calc(-50% + 24px), calc(-50% + 24px)) scale(0.9)';
        }

        // Window Controls
        const header = docViewerEl.querySelector('.terminal-header');
        header.querySelector('.dot.close').addEventListener('click', (e) => {
            e.stopPropagation();
            destroyDocViewer();
        });
        header.querySelector('.dot.minimize').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDocViewerMinimize();
        });
        header.querySelector('.dot.maximize').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDocViewerMaximize();
        });

        // Click on minimized bubble to restore it
        docViewerEl.addEventListener('click', (e) => {
            if (docViewerEl && docViewerEl.classList.contains('minimized')) {
                e.stopPropagation();
                toggleDocViewerMinimize();
                if (window.imaginalOS.playBeepSound) {
                    window.imaginalOS.playBeepSound(600, 0.08, 'sine');
                }
            }
        });

        // Bring to front on mousedown
        docViewerEl.addEventListener('mousedown', () => {
            bringToFront(docViewerEl);
        });

        // Enable dragging window by header
        makeWindowDraggable(docViewerEl, header);

        document.body.appendChild(docViewerEl);
        bringToFront(docViewerEl);

        // Smoothly bloom open in next animation frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (docViewerEl) {
                    docViewerEl.classList.add('active');
                    if (isTermActive) {
                        docViewerEl.style.transform = 'translate(calc(-50% + 24px), calc(-50% + 24px)) scale(1)';
                    } else {
                        docViewerEl.style.transform = '';
                    }
                }
            });
        });
    }

    function createCuriousDOM() {
        if (curiousWidget) return;

        curiousWidget = document.createElement('div');
        curiousWidget.id = 'curious-widget';
        curiousWidget.className = 'curious-widget';

        // Header acts as button when collapsed, close bar when opened
        const header = document.createElement('div');
        header.className = 'curious-header';
        header.setAttribute('role', 'button');
        header.setAttribute('aria-label', 'Not so curious?');
        header.setAttribute('title', 'Not so curious?');
        header.innerHTML = `
            <div class="curious-header-content">
                <span class="curious-btn-text">Not so curious</span>
                <span class="curious-btn-mark">?</span>
            </div>
            <span class="curious-close-btn" title="Close">✕</span>
        `;
        curiousWidget.appendChild(header);

        // Body (integrated dropdown menu dock)
        const body = document.createElement('div');
        body.className = 'curious-body';

        const divider = document.createElement('div');
        divider.className = 'curious-divider';
        body.appendChild(divider);

        menuListContainer = document.createElement('div');
        menuListContainer.className = 'curious-menu-list';
        renderMenuList(menuListContainer);
        body.appendChild(menuListContainer);
        curiousWidget.appendChild(body);
        document.body.appendChild(curiousWidget);

        // Header click toggles menu
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close via Escape key: first closes doc viewer, then closes menu dock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const term = window.imaginalOS.terminalContainer;
                const termZ = term ? parseInt(term.style.zIndex || '0', 10) : 0;
                const docZ = docViewerEl ? parseInt(docViewerEl.style.zIndex || '0', 10) : 0;

                // If user is focused on terminal input or terminal is above doc viewer, ignore
                if (document.activeElement === window.imaginalOS.terminalInput || (term && term.classList.contains('active') && termZ > docZ)) {
                    return;
                }

                if (docViewerEl && !docViewerEl.classList.contains('minimized')) {
                    destroyDocViewer();
                    return;
                }
                if (isMenuOpen) {
                    closeMenu();
                }
            }
        });

        // Click item opens document in clean viewer; menu stays open
        menuListContainer.addEventListener('click', async (e) => {
            const item = e.target.closest('.curious-item');
            if (!item) return;

            const path = item.getAttribute('data-path');
            if (path) {
                e.stopPropagation();
                await showDocumentViewer(path);
            }
        });
    }

    function revealButton(immediate = false) {
        if (isRevealed) return;
        isRevealed = true;

        if (!curiousWidget) {
            createCuriousDOM();
        }

        try {
            sessionStorage.setItem('curious_btn_revealed', '1');
        } catch {}

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);

        // If terminal is currently open and not minimized, keep button hidden
        const term = window.imaginalOS.terminalContainer;
        if (term && term.classList.contains('active') && !term.classList.contains('minimized')) {
            curiousWidget.classList.add('terminal-hidden');
        }

        if (immediate) {
            curiousWidget.classList.add('revealed');
        } else {
            setTimeout(() => {
                if (curiousWidget) curiousWidget.classList.add('revealed');
            }, 60);
        }
    }

    async function toggleMenu() {
        if (isMenuOpen) {
            closeMenu();
        } else {
            await openMenu();
        }
    }

    async function openMenu() {
        if (!curiousWidget) return;
        await ensureVFS();
        isMenuOpen = true;
        if (menuListContainer) {
            renderMenuList(menuListContainer);
        }
        curiousWidget.classList.add('open');
        if (window.imaginalOS.playBeepSound) {
            window.imaginalOS.playBeepSound(700, 0.05, 'sine');
        }
    }

    function closeMenu() {
        if (!curiousWidget) return;
        isMenuOpen = false;
        curiousWidget.classList.remove('open');
    }

    function handlePointerTrace(x, y) {
        if (isRevealed) return;

        if (lastX === null || lastY === null) {
            lastX = x;
            lastY = y;
            return;
        }

        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.hypot(dx, dy);

        if (dist < 12) return;

        totalDist += dist;

        const currentAngle = Math.atan2(dy, dx);
        if (lastAngle !== null) {
            let diff = Math.abs(currentAngle - lastAngle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            if (diff > 0.6) {
                turns++;
            }
        }

        lastAngle = currentAngle;
        lastX = x;
        lastY = y;

        // ~x2 threshold: at least 2000px distance with 4 direction turns, or 3500px total distance
        if ((totalDist >= 2000 && turns >= 4) || totalDist >= 3500) {
            revealButton();
        }
    }

    function onMouseMove(e) {
        handlePointerTrace(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
        if (e.touches && e.touches.length > 0) {
            handlePointerTrace(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    // Reset storage when user performs Ctrl+Shift+R or Ctrl+R or F5
    window.addEventListener('keydown', (e) => {
        if (((e.ctrlKey || e.metaKey) && (e.key === 'R' || e.key === 'r')) || e.key === 'F5') {
            try {
                sessionStorage.removeItem('curious_btn_revealed');
            } catch {}
        }
    });

    function initCurious() {
        // Reset on reload
        try {
            const nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
            if (nav && nav.type === 'reload') {
                sessionStorage.removeItem('curious_btn_revealed');
            }
        } catch {}

        createCuriousDOM();

        let alreadyRevealed = false;
        try {
            alreadyRevealed = sessionStorage.getItem('curious_btn_revealed') === '1';
        } catch {}

        if (alreadyRevealed) {
            revealButton(true);
        } else {
            window.addEventListener('mousemove', onMouseMove, { passive: true });
            window.addEventListener('touchmove', onTouchMove, { passive: true });
        }
    }

    window.imaginalOS.initCurious = initCurious;
    window.imaginalOS.showDocumentViewer = showDocumentViewer;
    window.imaginalOS.destroyDocViewer = destroyDocViewer;
})();
