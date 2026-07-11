/**
 * ImaginalOS Retro Terminal Emulator - Core Orchestrator
 */

(function() {
    // Shared State Initialization
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.shellState = 'normal';
    window.imaginalOS.commandHistory = [];
    
    let historyIndex = -1;
    let sudoAttempts = 0;
    
    let terminalContainer = null;
    let terminalOutput = null;
    let terminalPromptSymbol = null;
    let terminalInput = null;
    let terminalCmdBuffer = null;
    let terminalHintBar = null;
    let scrollIndicator = null;

    // Keystroke & Beep Audio Synthesiser clicks are provided globally by sound.js
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

    // Terminal DOM Builder
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

        // Copy secret values to clipboard on click
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

        // Bind clicks to hidden input focus
        body.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && e.target.closest('a') === null) {
                if (window.imaginalOS.shellState !== 'vim' && window.imaginalOS.shellState !== 'spacerock') {
                    terminalInput.focus();
                }
            }
        });

        // Window Controls
        header.querySelector('.dot.close').addEventListener('click', closeTerminal);
        header.querySelector('.dot.minimize').addEventListener('click', toggleMinimize);
        header.querySelector('.dot.maximize').addEventListener('click', toggleMaximize);

        // Track Input Buffers
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

        // Expose DOM elements on namespace
        window.imaginalOS.terminalContainer = terminalContainer;
        window.imaginalOS.terminalOutput = terminalOutput;
        window.imaginalOS.terminalInput = terminalInput;
        window.imaginalOS.terminalPromptSymbol = terminalPromptSymbol;
        window.imaginalOS.terminalCmdBuffer = terminalCmdBuffer;
        window.imaginalOS.terminalHintBar = terminalHintBar;
    }

    // Inactivity Hints Engine
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
        
        isHintVisible = true;
        const hints = window.imaginalOS.HINTS || [];
        if (hints.length === 0) return;
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

    // Output Logger
    function writeOutput(text) {
        if (!terminalOutput) return;
        terminalOutput.innerHTML += wrapEmoji(text);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        setTimeout(updateScrollIndicator, 10);
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

        terminalCmdBuffer.innerHTML = escapeHtml(part1) + 
                                      '<span class="terminal-cursor"></span>' + 
                                      escapeHtml(part2);
    }
    window.imaginalOS.syncInputBuffer = syncInputBuffer;

    // Prompt generator
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

    // Key interceptor for commands
    async function handleKeyDown(e) {
        resetHintTimer();

        if (window.imaginalOS.shellState === 'animating' || window.imaginalOS.shellState === 'vim') {
            return;
        }

        if (e.key === 'Enter') {
            if (window.imaginalOS.shellState === 'sudo_password') {
                const password = terminalInput.value.trim();
                executePasswordCheck(password);
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

    function executePasswordCheck(pwd) {
        writeOutput(getPromptString() + '*'.repeat(pwd.length) + '<br>');
        
        if (pwd.toLowerCase() === 'love' || pwd.toLowerCase() === 'admin' || pwd.toLowerCase() === 'bmo') {
            window.imaginalOS.shellState = 'normal';
            playBeepSound(700, 0.1, 'sine');
            writeOutput("<span class='cmd'>Access Granted. You are temporarily root. Type 'rm -rf /' to reboot.</span><br>");
        } else {
            sudoAttempts++;
            if (sudoAttempts >= 3) {
                window.imaginalOS.shellState = 'normal';
                sudoAttempts = 0;
                playBeepSound(250, 0.2, 'sawtooth');
                writeOutput("<span class='err'>sudo: 3 incorrect password attempts. Incidents reported. Locking shell.</span><br>");
            } else {
                playBeepSound(300, 0.15, 'sawtooth');
                writeOutput("<span class='err'>Sorry, try again.</span><br>");
            }
        }
        terminalPromptSymbol.innerHTML = getPromptString();
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

        const cmdId = 'cmd-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        writeOutput(`<div id="${cmdId}">${getPromptString()}${escapeHtml(rawCmd)}</div>`);

        switch(cmd) {
            case 'help':
            case 'commands':
                window.imaginalOS.runHelp();
                break;
            case 'man':
                window.imaginalOS.runMan(args[0]);
                break;
            case 'ls':
                window.imaginalOS.runLs(args[0]);
                break;
            case 'cd':
                window.imaginalOS.runCd(args[0]);
                break;
            case 'cat':
                await window.imaginalOS.runCat(args[0], false);
                break;
            case 'bat':
                await window.imaginalOS.runCat(args[0], true);
                break;
            case 'pwd':
                window.imaginalOS.runPwd();
                break;
            case 'uname':
                window.imaginalOS.runUname(args[0]);
                break;
            case 'tips':
                window.imaginalOS.runTips();
                break;
            case 'history':
                window.imaginalOS.runHistory();
                break;
            case 'echo':
                window.imaginalOS.animateEchoBanner(args.join(' '));
                break;
            case 'mkdir':
                window.imaginalOS.runMkdir(args[0]);
                break;
            case 'touch':
                window.imaginalOS.runTouch(args[0]);
                break;
            case 'rm':
                window.imaginalOS.runRm(args[0]);
                break;
            case 'nano':
                playBeepSound(300, 0.1, 'sine');
                writeOutput(`<span class="err">nano: command not found.</span> Did you mean <span class="cmd">'banano'</span>? 🍌<br>`);
                break;
            case 'banano':
            case 'edit':
            case 'vim':
                window.imaginalOS.runVim(args[0]);
                break;
            case 'clear':
                triggerDegaussClear();
                break;
            case 'time':
                window.imaginalOS.runTime();
                break;
            case 'whoami':
                window.imaginalOS.runWhoami();
                break;
            case 'neofetch':
                window.imaginalOS.runNeofetch();
                break;
            case 'harvester':
            case 'scan':
                window.imaginalOS.runHarvester();
                break;
            case 'weather':
                if (args[0]) {
                    const ok = window.setWeatherOverride(args[0].toLowerCase());
                    if (ok) {
                        writeOutput(`Weather override activated: <span class="cmd">${args[0].toLowerCase()}</span><br>`);
                    } else {
                        writeOutput(`<span class="err">Invalid weather type. Choose from: clear, clouds, rain, snow, storm.</span><br>`);
                    }
                } else {
                    window.imaginalOS.runWeather();
                }
                break;
            case 'open':
                window.imaginalOS.runOpen(args[0]);
                break;
            case 'ip':
                window.imaginalOS.runIp();
                break;
            case 'pass':
                window.imaginalOS.runPass(args[0]);
                break;
            case 'mute':
                window.audioSynthMuted = true;
                writeOutput("Terminal audio effects MUTED.<br>");
                break;
            case 'unmute':
                window.audioSynthMuted = false;
                writeOutput("Terminal audio effects UNMUTED.<br>");
                break;
            case 'cookies':
            case 'cookie':
                window.imaginalOS.runCookies();
                break;
            case 'policy':
            case 'policies':
                window.imaginalOS.runPolicy();
                break;
            case 'date': {
                let out = new Date().toString() + '<br>';
                const td = window.telemetryData;
                if (td.sunrise && td.sunset) {
                    out += `☀️ <b>Solar Ephemeris for ${escapeHtml(td.city)}:</b><br>`;
                    out += `   Sunrise: <span class="neokey">${td.sunrise}</span> (local time)<br>`;
                    out += `   Sunset:  <span class="neokey">${td.sunset}</span> (local time)<br>`;
                }
                writeOutput(out);
                break;
            }
            case 'game':
            case 'spacerock':
            case 'spacerocks':
            case 'asteroids':
                if (window.imaginalOS.runSpaceRock) {
                    window.imaginalOS.runSpaceRock();
                } else {
                    writeOutput("<span class='err'>game: failed to load game module</span><br>");
                }
                break;
            case 'matrix':
                window.imaginalOS.startMatrix();
                break;
            case 'git':
            case 'github':
                writeOutput("Redirecting to GitHub: https://github.com/credimusin ...<br>");
                window.open('https://github.com/credimusin', '_blank');
                break;
            case 'tg':
            case 'telegram':
                writeOutput("Redirecting to Telegram: https://t.me/credimusin ...<br>");
                window.open('https://t.me/credimusin', '_blank');
                break;
            case 'bmo':
                window.imaginalOS.runBmoEasterEgg();
                break;
            case 'secret':
                window.imaginalOS.runSecretCheck(args);
                break;
            case 'sudo':
                if (args.join(' ').includes('rm -rf')) {
                    window.imaginalOS.runDestruct();
                } else {
                    window.imaginalOS.shellState = 'sudo_password';
                    sudoAttempts = 0;
                    terminalPromptSymbol.innerHTML = getPromptString();
                    writeOutput("System authentication requested. (Try password: bmo)<br>");
                }
                break;
            case 'exit':
            case 'close':
                closeTerminal();
                break;
            default:
                playBeepSound(300, 0.1, 'sine');
                writeOutput(`<span class="err">bush: command not found: ${escapeHtml(cmd)}</span>. Type 'help' for options.<br>`);
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
                    return `<span class="secret">${m}</span>`;
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
            const commands = ['help', 'commands', 'ls', 'cd', 'cat', 'bat', 'pwd', 'uname', 'history', 'echo', 'mkdir', 'touch', 'rm', 'vim', 'banano', 'nano', 'edit', 'open', 'neofetch', 'harvester', 'scan', 'weather', 'whoami', 'matrix', 'clear', 'time', 'mute', 'unmute', 'date', 'exit', 'close', 'sudo', 'git', 'github', 'tg', 'telegram', 'bmo', 'secret', 'ip', 'pass', 'cookie', 'cookies', 'policy', 'policies', 'tips', 'spacerock', 'spacerocks', 'asteroids', 'game'];
            const matches = commands.filter(c => c.startsWith(cmd));
            if (matches.length === 1) {
                terminalInput.value = matches[0] + ' ';
                syncInputBuffer();
            } else if (matches.length > 1) {
                showTabMatches(matches);
            }
        } else if (parts.length === 2) {
            const arg = parts[1];
            
            const res = window.imaginalOS.resolvePath('.');
            if (res.node && res.node.children) {
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

    // Toggle Console Window
    function openTerminal() {
        if (!terminalContainer) {
            createTerminalDOM();
        }
        
        if (terminalContainer.classList.contains('minimized')) {
            terminalContainer.classList.remove('minimized');
        }
        
        terminalContainer.classList.add('active');
        terminalInput.focus();
        playBeepSound(600, 0.08, 'sine');
        
        if (terminalOutput.innerHTML === '') {
            writeOutput(`Welcome to my imaginal website.
You are using ImaginalOS v${window.imaginalOS.VERSION || '0.9.1'}-potato.
Administrator: BMO
`);
        }
        
        resetHintTimer();
    }

    function closeTerminal() {
        if (terminalContainer) {
            terminalContainer.classList.remove('active');
            terminalContainer.classList.remove('minimized');
            terminalContainer.classList.remove('maximized');
            terminalInput.blur();
            if (window.imaginalOS.isMatrixActive()) {
                window.imaginalOS.stopMatrix();
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
            stopHintsSystem();
        } else {
            terminalInput.focus();
            resetHintTimer();
        }
    }

    function toggleMaximize() {
        terminalContainer.classList.toggle('maximized');
        terminalInput.focus();
    }

    // Backtick opens/closes terminal. Escape key is reserved for inside console control.
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

    // Expose on global namespace
    window.imaginalOS.writeOutput = writeOutput;
    window.imaginalOS.escapeHtml = escapeHtml;
    window.imaginalOS.getPromptString = getPromptString;
    window.toggleTerminal = toggleTerminal;
    window.openTerminal = openTerminal;
    window.closeTerminal = closeTerminal;
})();
