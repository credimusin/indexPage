/**
 * ImaginalOS Retro Terminal Emulator - Core Orchestrator
 */

(function() {

    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.shellState = 'normal';
    window.imaginalOS.commandHistory = [];

    let historyIndex = -1;

    let terminalContainer = null;
    let terminalOutput = null;
    let terminalPromptSymbol = null;
    let terminalInput = null;
    let terminalCmdBuffer = null;
    let terminalHintBar = null;
    let scrollIndicator = null;

    const playKeySound = () => window.playKeySound && window.playKeySound();
    const playBeepSound = (f, d, t) => window.playBeepSound && window.playBeepSound(f, d, t);

    function updateScrollIndicator() {
        if (!scrollIndicator || !terminalOutput) return;
        const threshold = 10;
        const hasMoreContent = (terminalOutput.scrollHeight - terminalOutput.clientHeight) > (terminalOutput.scrollTop + threshold);
        if (hasMoreContent) {
            scrollIndicator.classList.add('visible');
        } else {
            scrollIndicator.classList.remove('visible');
        }
    }

    function createTerminalDOM() {
        terminalContainer = document.createElement('div');
        terminalContainer.id = 'terminal-window';
        terminalContainer.className = 'terminal-window';

        const header = document.createElement('div');
        header.className = 'terminal-header';
        header.innerHTML = `
            <div class="terminal-dots">
                <span class="dot close" title="Close"></span>
                <span class="dot minimize" title="Minimize"></span>
                <span class="dot maximize" title="Maximize"></span>
            </div>
            <div class="terminal-title">bmo@imaginal.dev: ~ (bush)</div>
            <div style="width: 50px;"></div>
        `;

        terminalContainer.appendChild(header);

        const body = document.createElement('div');
        body.className = 'terminal-body';

        terminalOutput = document.createElement('div');
        terminalOutput.className = 'terminal-output';
        body.appendChild(terminalOutput);

        scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'terminal-scroll-indicator';
        scrollIndicator.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="#00ff80" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        body.appendChild(scrollIndicator);

        scrollIndicator.addEventListener('click', () => {
            terminalOutput.scrollTo({
                top: terminalOutput.scrollHeight,
                behavior: 'smooth'
            });
        });

        terminalOutput.addEventListener('scroll', updateScrollIndicator);
        window.addEventListener('resize', updateScrollIndicator);

        terminalHintBar = document.createElement('div');
        terminalHintBar.className = 'terminal-hint-bar';
        body.appendChild(terminalHintBar);

        const inputLine = document.createElement('div');
        inputLine.className = 'terminal-input-line';

        terminalPromptSymbol = document.createElement('span');
        terminalPromptSymbol.className = 'terminal-prompt-symbol';
        terminalPromptSymbol.innerHTML = getPromptString();
        inputLine.appendChild(terminalPromptSymbol);

        const inputContainer = document.createElement('div');
        inputContainer.className = 'terminal-input-container';

        terminalCmdBuffer = document.createElement('span');
        terminalCmdBuffer.className = 'terminal-command-buffer';
        inputContainer.appendChild(terminalCmdBuffer);

        terminalInput = document.createElement('input');
        terminalInput.type = 'text';
        terminalInput.className = 'terminal-hidden-input';
        terminalInput.autofocus = true;
        terminalInput.spellcheck = false;
        inputContainer.appendChild(terminalInput);

        inputLine.appendChild(inputContainer);
        body.appendChild(inputLine);
        terminalContainer.appendChild(body);
        document.body.appendChild(terminalContainer);

        terminalOutput.addEventListener('click', (e) => {
            const target = e.target;
            if (target && (target.classList.contains('secret') || target.hasAttribute('data-copy'))) {
                const textToCopy = target.getAttribute('data-copy') || target.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    playBeepSound(1000, 0.08, 'sine');
                    if (terminalHintBar) {
                        const originalHTML = terminalHintBar.innerHTML;
                        const originalVisible = terminalHintBar.classList.contains('visible');
                        terminalHintBar.innerHTML = wrapEmoji(`<span class="hint-prefix" style="color: #64ffda;">Clipboard:</span> Copied to buffer! 📋`);
                        terminalHintBar.classList.add('visible');
                        setTimeout(() => {
                            if (!originalVisible) {
                                terminalHintBar.classList.remove('visible');
                            } else {
                                terminalHintBar.innerHTML = originalHTML;
                            }
                        }, 2000);
                    }
                    if (window.imaginalOS.shellState !== 'vim') {
                        terminalInput.focus();
                    }
                }).catch(() => {});
            }
        });

        body.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && e.target.closest('a') === null) {
                if (window.imaginalOS.shellState !== 'vim' && window.imaginalOS.shellState !== 'spacerock') {
                    terminalInput.focus();
                }
            }
        });

        header.querySelector('.dot.close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTerminal();
        });
        header.querySelector('.dot.minimize').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMinimize();
        });
        header.querySelector('.dot.maximize').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize();
        });

        terminalContainer.addEventListener('mousedown', () => {
            if (window.imaginalOS.bringToFront) {
                window.imaginalOS.bringToFront(terminalContainer);
            }
        });

        if (window.imaginalOS.makeWindowDraggable) {
            window.imaginalOS.makeWindowDraggable(terminalContainer, header);
        }

        terminalContainer.addEventListener('click', (e) => {
            if (terminalContainer.classList.contains('minimized')) {
                e.stopPropagation();
                toggleMinimize();
                playBeepSound(600, 0.08, 'sine');
            }
        });

        terminalInput.addEventListener('input', () => {
            syncInputBuffer();
            playKeySound();
            resetHintTimer();
        });

        terminalInput.addEventListener('keyup', () => {
            syncInputBuffer();
        });

        terminalInput.addEventListener('click', () => {
            syncInputBuffer();
        });

        terminalInput.addEventListener('focus', () => {
            syncInputBuffer();
        });

        terminalInput.addEventListener('keydown', handleKeyDown);

        window.imaginalOS.terminalContainer = terminalContainer;
        window.imaginalOS.terminalOutput = terminalOutput;
        window.imaginalOS.terminalInput = terminalInput;
        window.imaginalOS.terminalPromptSymbol = terminalPromptSymbol;
        window.imaginalOS.terminalCmdBuffer = terminalCmdBuffer;
        window.imaginalOS.terminalHintBar = terminalHintBar;
    }

    let hintBarTimeout = null;
    let hintBarHideTimeout = null;
    let isHintVisible = false;

    function resetHintTimer() {
        if (isHintVisible) {
            hideHintBar();
        }
        if (hintBarTimeout) clearTimeout(hintBarTimeout);
        if (hintBarHideTimeout) clearTimeout(hintBarHideTimeout);

        hintBarTimeout = setTimeout(showHintBar, 30000);
    }

    function showHintBar() {
        if (!terminalHintBar || !terminalContainer || !terminalContainer.classList.contains('active') || terminalContainer.classList.contains('minimized')) {
            hintBarTimeout = setTimeout(showHintBar, 10000);
            return;
        }

        const hints = window.imaginalOS.HINTS || [];
        if (hints.length === 0) {
            hintBarTimeout = setTimeout(showHintBar, 30000);
            return;
        }

        isHintVisible = true;
        const hint = hints[Math.floor(Math.random() * hints.length)];
        terminalHintBar.innerHTML = wrapEmoji(`<span class="hint-prefix">Hint:</span> ${hint}`);
        terminalHintBar.classList.add('visible');

        hintBarHideTimeout = setTimeout(hideHintBar, 12000);
    }

    function hideHintBar() {
        isHintVisible = false;
        if (terminalHintBar) {
            terminalHintBar.classList.remove('visible');
        }
        if (hintBarHideTimeout) clearTimeout(hintBarHideTimeout);

        hintBarTimeout = setTimeout(showHintBar, 30000);
    }

    function stopHintsSystem() {
        if (hintBarTimeout) clearTimeout(hintBarTimeout);
        if (hintBarHideTimeout) clearTimeout(hintBarHideTimeout);
        isHintVisible = false;
        if (terminalHintBar) {
            terminalHintBar.classList.remove('visible');
        }
    }

    function wrapEmoji(text) {
        if (typeof text !== 'string') return text;
        try {
            return text.replace(/([\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{27BF}]|🍪|🐱|🦇|🌐|🔑|🕰️|🖼️|🏠|📁|🤫|💬|🗺️|⚖️|🤖|💾|🍿|🦖|🎮|👾|⚡|❄️|🍂|🌸|🍀|🌻)/gu, '<span class="emoji">$1</span>');
        } catch {
            return text;
        }
    }

    function writeOutput(text) {
        if (!terminalOutput) return;

        terminalOutput.insertAdjacentHTML('beforeend', wrapEmoji(text));
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        setTimeout(updateScrollIndicator, 10);
    }

    function syncInputBuffer() {
        if (!terminalInput || !terminalCmdBuffer) return;
        const val = terminalInput.value;
        const selStart = terminalInput.selectionStart;

        if (window.imaginalOS.shellState === 'sudo_password') {
            terminalCmdBuffer.innerHTML = '*'.repeat(val.length) + '<span class="terminal-cursor"></span>';
            return;
        }

        const part1 = val.substring(0, selStart);
        const part2 = val.substring(selStart);

        terminalCmdBuffer.innerHTML = window.imaginalOS.escapeHtml(part1) +
                                      '<span class="terminal-cursor"></span>' +
                                      window.imaginalOS.escapeHtml(part2);
    }
    window.imaginalOS.syncInputBuffer = syncInputBuffer;

    function getPromptString() {
        if (window.imaginalOS.shellState === 'sudo_password') {
            return `[sudo] password for bmo: `;
        }
        let pathStr = '/' + window.imaginalOS.currentPath.join('/');
        if (pathStr === '/home/bmo') {
            pathStr = '~';
        }
        return `<a href="mailto:bmo@imaginal.dev" class="usr" style="text-decoration: none; color: inherit; cursor: pointer;">bmo@imaginal.dev</a>:<span class="pth">${pathStr}</span>$ `;
    }

    async function handleKeyDown(e) {
        resetHintTimer();

        if (window.imaginalOS.shellState === 'animating' || window.imaginalOS.shellState === 'vim') {
            return;
        }

        if (e.key === 'Enter') {
            if (window.imaginalOS.shellState === 'sudo_password') {
                const password = terminalInput.value.trim();
                window.imaginalOS.submitSudoPassword(password);
                terminalInput.value = '';
                syncInputBuffer();
            } else {
                const command = terminalInput.value.trim();
                await executeCommand(command);
                terminalInput.value = '';
                syncInputBuffer();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (window.imaginalOS.commandHistory.length > 0) {
                if (historyIndex === -1) {
                    historyIndex = window.imaginalOS.commandHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                terminalInput.value = window.imaginalOS.commandHistory[historyIndex];
                syncInputBuffer();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                if (historyIndex < window.imaginalOS.commandHistory.length - 1) {
                    historyIndex++;
                    terminalInput.value = window.imaginalOS.commandHistory[historyIndex];
                } else {
                    historyIndex = -1;
                    terminalInput.value = '';
                }
                syncInputBuffer();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            handleTabComplete();
        }
    }

    async function executeCommand(rawCmd) {
        if (!rawCmd) {
            writeOutput(getPromptString() + '<br>');
            return;
        }

        window.imaginalOS.commandHistory.push(rawCmd);
        historyIndex = -1;

        const parts = rawCmd.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        const os = window.imaginalOS;

        const cmdId = 'cmd-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        writeOutput(`<div id="${cmdId}">${getPromptString()}${os.escapeHtml(rawCmd)}</div>`);

        switch (cmd) {
            case 'help':
            case 'commands':
                os.runHelp();
                break;
            case 'man':
                os.runMan(args[0]);
                break;
            case 'ls':
                os.runLs(args[0]);
                break;
            case 'cd':
                os.runCd(args[0]);
                break;
            case 'curl':
                await os.runCurl(args);
                break;
            case 'cat':
                await os.runCat(args[0], false);
                break;
            case 'bat':
                await os.runCat(args[0], true);
                break;
            case 'pwd':
                await os.runPwd();
                break;
            case 'uname':
                await os.runUname(args[0]);
                break;
            case 'tips':
                await os.runTips();
                break;
            case 'history':
                os.runHistory();
                break;
            case 'echo':
                os.animateEchoBanner(args.join(' '));
                break;
            case 'mkdir':
                await os.runMkdir(args[0]);
                break;
            case 'touch':
                await os.runTouch(args[0]);
                break;
            case 'rm':
                await os.runRm(args[0]);
                break;
            case 'nano':
                os.runNano();
                break;
            case 'banano':
            case 'edit':
            case 'vim':
                await os.openVim(args[0]);
                break;
            case 'clear':
                triggerDegaussClear();
                break;
            case 'time':
                await os.runTime();
                break;
            case 'whoami':
                await os.runWhoami();
                break;
            case 'neofetch':
                await os.runNeofetch();
                break;
            case 'harvester':
            case 'scan':
                await os.runHarvester();
                break;
            case 'weather':
                if (args[0]) {
                    os.runWeatherOverride(args[0].toLowerCase());
                } else {
                    await os.runWeather();
                }
                break;
            case 'open':
                os.runOpen(args[0]);
                break;
            case 'ip':
                await os.runIp();
                break;
            case 'pass':
                await os.runPass(args[0]);
                break;
            case 'mute':
                os.runMute(true);
                break;
            case 'unmute':
                os.runMute(false);
                break;
            case 'cookies':
            case 'cookie':
                await os.runCookies();
                break;
            case 'policy':
            case 'policies':
                os.runPolicy();
                break;
            case 'date':
                await os.runDate();
                break;
            case 'game':
            case 'spacerock':
            case 'spacerocks':
            case 'asteroids':
                await os.runGame();
                break;
            case 'matrix':
                os.startMatrix();
                break;
            case 'git':
            case 'github':
                await os.runGit();
                break;
            case 'tg':
            case 'telegram':
                await os.runTelegram();
                break;
            case 'bmo':
                os.runBmoEasterEgg();
                break;
            case 'gpg':
                await os.runGpg();
                break;
            case 'secret':
                os.runSecretCheck(args);
                break;
            case 'sudo':
                await os.runSudo(args);
                break;
            case 'exit':
            case 'close':
                closeTerminal();
                break;
            default:
                playBeepSound(300, 0.1, 'sine');
                writeOutput(`<span class="err">bush: command not found: ${os.escapeHtml(cmd)}</span>. Type 'help' for options.<br>`);
        }

        const cmdEl = document.getElementById(cmdId);
        if (cmdEl && terminalOutput) {
            terminalOutput.scrollTop = Math.max(0, cmdEl.offsetTop - 10);
            setTimeout(updateScrollIndicator, 10);
        }
    }

    function triggerDegaussClear() {
        const bodyEl = terminalContainer.querySelector('.terminal-body');
        if (!bodyEl) {
            terminalOutput.innerHTML = '';
            return;
        }

        if (window.imaginalOS.playDegaussSound) {
            window.imaginalOS.playDegaussSound();
        }

        bodyEl.classList.add('degaussing');
        terminalInput.disabled = true;

        setTimeout(() => {
            terminalOutput.innerHTML = '';
            setTimeout(updateScrollIndicator, 10);
        }, 400);

        setTimeout(() => {
            bodyEl.classList.remove('degaussing');
            terminalInput.disabled = false;
            terminalInput.focus();
            syncInputBuffer();
        }, 800);
    }

    function showTabMatches(matches) {
        if (!terminalHintBar) return;

        const formatted = matches.map(m => {
            const res = window.imaginalOS.resolvePath(m);
            if (!res.error && res.node) {
                if (res.node.type === 'dir') {
                    return `<span class="dir">${m}/</span>`;
                } else if (res.node.type === 'file' && m.endsWith('.db')) {
                    return `<span class="secret-title">${m}</span>`;
                } else {
                    return `<span class="file">${m}</span>`;
                }
            }
            return `<span class="cmd">${m}</span>`;
        }).join('&nbsp;&nbsp;&nbsp;&nbsp;');

        terminalHintBar.innerHTML = wrapEmoji(`<span class="hint-prefix">Tab Complete:</span> ` + formatted);
        terminalHintBar.classList.add('visible');
        isHintVisible = true;

        if (hintBarTimeout) clearTimeout(hintBarTimeout);
        if (hintBarHideTimeout) clearTimeout(hintBarHideTimeout);

        hintBarHideTimeout = setTimeout(hideHintBar, 8000);
    }

    function handleTabComplete() {
        const inputVal = terminalInput.value.trim();
        const parts = inputVal.split(' ');

        if (parts.length === 1) {
            const cmd = parts[0].toLowerCase();
            const matches = window.imaginalOS.ALL_COMMAND_NAMES.filter(c => c.startsWith(cmd));
            if (matches.length === 1) {
                terminalInput.value = matches[0] + ' ';
                syncInputBuffer();
            } else if (matches.length > 1) {
                showTabMatches(matches);
            }
        } else if (parts.length === 2) {
            const arg = parts[1];

            const res = window.imaginalOS.resolvePath('.');
            if (window.imaginalOS.hasChildren(res.node)) {
                const names = Object.keys(res.node.children);
                const matches = names.filter(n => n.startsWith(arg));
                if (matches.length === 1) {
                    let fill = matches[0];
                    if (res.node.children[fill].type === 'dir') {
                        fill += '/';
                    }
                    terminalInput.value = `${parts[0]} ${fill}`;
                    syncInputBuffer();
                } else if (matches.length > 1) {
                    showTabMatches(matches);
                }
            }
        }
    }

    function openTerminal() {
        if (!terminalContainer) {
            createTerminalDOM();
        }

        if (terminalContainer.classList.contains('minimized')) {
            terminalContainer.classList.remove('minimized');
        }

        terminalContainer.classList.add('active');
        if (window.imaginalOS.bringToFront) {
            window.imaginalOS.bringToFront(terminalContainer);
        }
        if (window.imaginalOS.onTerminalOpen) {
            window.imaginalOS.onTerminalOpen();
        }
        terminalInput.focus();
        playBeepSound(600, 0.08, 'sine');

        if (terminalOutput.innerHTML === '') {
            writeOutput(`Welcome to my imaginal website.
You are using ImaginalOS v${window.imaginalOS.VERSION}-potato.
Administrator: BMO
`);
        }

        resetHintTimer();
    }

    function closeImmersiveModes() {
        const os = window.imaginalOS;
        if (os.isMatrixActive && os.isMatrixActive()) {
            os.stopMatrix();
        }
        if (os.shellState === 'vim' && os.closeVimEditor) {
            os.closeVimEditor();
        }
        if (os.shellState === 'spacerock' && os.stopSpaceRock) {
            os.stopSpaceRock();
        }
    }

    function closeTerminal() {
        if (terminalContainer) {
            terminalContainer.classList.remove('active');
            terminalContainer.classList.remove('minimized');
            terminalContainer.classList.remove('maximized');
            if (terminalInput) terminalInput.blur();
            closeImmersiveModes();
            if (window.imaginalOS.onTerminalClose) {
                window.imaginalOS.onTerminalClose();
            }
            stopHintsSystem();
            playBeepSound(450, 0.08, 'sine');
        }
    }

    function toggleTerminal() {
        if (terminalContainer && terminalContainer.classList.contains('active') && !terminalContainer.classList.contains('minimized')) {
            closeTerminal();
        } else {
            openTerminal();
        }
    }

    function toggleMinimize() {
        terminalContainer.classList.toggle('minimized');
        if (terminalContainer.classList.contains('minimized')) {
            closeImmersiveModes();
            stopHintsSystem();
            if (window.imaginalOS.onTerminalClose) {
                window.imaginalOS.onTerminalClose();
            }
        } else {
            terminalInput.focus();
            resetHintTimer();
            if (window.imaginalOS.onTerminalOpen) {
                window.imaginalOS.onTerminalOpen();
            }
        }
    }

    function toggleMaximize() {
        terminalContainer.classList.toggle('maximized');
        if (window.imaginalOS.bringToFront) {
            window.imaginalOS.bringToFront(terminalContainer);
        }
        terminalInput.focus();
    }

    window.addEventListener('keydown', (e) => {
        const isTerminalOpen = terminalContainer && terminalContainer.classList.contains('active') && !terminalContainer.classList.contains('minimized');

        if (e.key === '`') {
            e.preventDefault();
            toggleTerminal();
            return;
        }

        if (isTerminalOpen) {
            if (window.imaginalOS.shellState === 'animating') {
                e.preventDefault();
                return;
            }
            if (window.imaginalOS.shellState === 'vim') {
                window.imaginalOS.handleVimKey(e);
                return;
            }
            if (window.imaginalOS.shellState === 'spacerock') {
                return;
            }
        }
    });

    window.imaginalOS.writeOutput = writeOutput;
    window.imaginalOS.getPromptString = getPromptString;
    window.imaginalOS.wrapEmoji = wrapEmoji;
    window.imaginalOS.openTerminal = openTerminal;
    window.imaginalOS.closeTerminal = closeTerminal;
    window.imaginalOS.toggleTerminal = toggleTerminal;
    window.toggleTerminal = toggleTerminal;
})();
