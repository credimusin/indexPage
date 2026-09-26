/**
 * imaginalOS - BIM (Vim Improved) Editor Module
 */
(function() {
    const FLAG_KEY = 'flag{h4ck_th3_pl4n3t_1999}';

    let vimFileNode = null;
    let vimFileName = '';
    let vimMode = 'normal'; // 'normal', 'insert', 'colon'
    let vimEditorEl = null;
    let vimTextarea = null;
    let vimStatusLabel = null;
    let vimColonBar = null;
    let vimColonInput = null;

    // Splits a "dir/file" argument the same way ls/cat/mkdir do.
    function splitTarget(pathStr) {
        let name = pathStr;
        let dirPath = '.';
        if (pathStr.includes('/')) {
            const parts = pathStr.split('/');
            name = parts.pop();
            dirPath = parts.join('/') || '/';
        }
        return { name, dirPath };
    }

    async function runVim(pathStr) {
        if (!pathStr) {
            window.imaginalOS.writeOutput("<span class='err'>vim: missing file operand</span><br>");
            return;
        }

        const { name: targetName, dirPath } = splitTarget(pathStr);
        let filename = targetName;
        const dirRes = window.imaginalOS.resolvePath(dirPath);
        if (dirRes.error) {
            window.imaginalOS.writeOutput(`<span class='err'>vim: ${dirRes.error}: ${window.imaginalOS.escapeHtml(dirPath)}</span><br>`);
            return;
        }
        if (!window.imaginalOS.hasChildren(dirRes.node)) {
            window.imaginalOS.writeOutput(`<span class='err'>vim: ${window.imaginalOS.escapeHtml(dirPath)}: Not a directory</span><br>`);
            return;
        }

        const dirNode = dirRes.node;
        if (dirNode.children[filename] && window.imaginalOS.isDir(dirNode.children[filename])) {
            window.imaginalOS.writeOutput(`<span class='err'>vim: ${window.imaginalOS.escapeHtml(filename)}: Is a directory</span><br>`);
            return;
        }

        if (!dirNode.children[filename]) {
            const sanitizedName = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
            if (!sanitizedName || sanitizedName !== filename) {
                window.imaginalOS.writeOutput("<span class='err'>vim: invalid filename. Use only letters, numbers, dots, and underscores.</span><br>");
                return;
            }
            dirNode.children[sanitizedName] = {
                'type': 'file',
                'content': ''
            };
            filename = sanitizedName;
        }

        const editingFileNode = dirNode.children[filename];
        await window.imaginalOS.loadNodeContent(editingFileNode);

        launchVimEditor(filename, editingFileNode);
    }

    function launchVimEditor(filename, fileNode) {
        window.imaginalOS.shellState = 'vim';
        vimFileNode = fileNode;
        vimFileName = filename;
        vimMode = 'normal';

        const isEmpty = !fileNode.content;
        vimEditorEl = document.createElement('div');
        vimEditorEl.className = 'vim-editor';
        vimEditorEl.innerHTML = `
            <div class="vim-content-area" style="position: relative; display: flex; flex-direction: column; height: 100%;">
                <textarea class="vim-textarea" spellcheck="false" readonly>${window.imaginalOS.escapeHtml(fileNode.content || '')}</textarea>
                <div class="vim-splash" style="display: ${isEmpty ? 'block' : 'none'};">
                    <div style="text-align: center; margin-top: 3vh; color: #64ffda; font-weight: bold; font-size: 16px;">B I M - BMO Improved</div>
                    <div style="text-align: center; color: #8892b0; font-size: 12px; margin-top: 2px;">version ${window.imaginalOS.VERSION}</div>
                    <div style="text-align: center; color: #8892b0; font-size: 11px;">by Maksim B</div>
                    <div style="text-align: center; color: #ff79c6; font-size: 13px; margin-top: 18px; font-style: italic; text-shadow: 0 0 8px rgba(255, 121, 198, 0.4);">"From here, you can never truly escape!"</div>
                    <div style="text-align: center; color: #ff79c6; font-size: 11px; margin-top: 2px;">(Just kidding, type :q! to force quit)</div>
                    
                    <div style="margin: 25px auto 15px auto; max-width: 380px; color: #a8b2d1; font-size: 12px; line-height: 1.6;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Type <span style="color: #00ff80; font-weight: bold;">i</span></span>
                            <span>to enter <span style="color: #00ff80;">INSERT</span> mode</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Type <span style="color: #ff3838; font-weight: bold;">:q!</span> &lt;Enter&gt;</span>
                            <span>to exit without saving</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Type <span style="color: #00ff80; font-weight: bold;">:wq</span> &lt;Enter&gt;</span>
                            <span>to save and quit</span>
                        </div>
                    </div>
                    <div style="color: #212c42; font-size: 14px; margin-top: 10px; line-height: 1.25;">
                        ~<br>~<br>~<br>~<br>~<br>~
                    </div>
                </div>
            </div>
            <div class="vim-status-bar">
                <span class="vim-status-left"></span>
            </div>
            <div class="vim-colon-bar" style="display: none;">
                <span class="vim-colon-symbol">:</span>
                <input type="text" class="vim-colon-input" spellcheck="false" />
            </div>
        `;
        window.imaginalOS.terminalContainer.querySelector('.terminal-body').appendChild(vimEditorEl);

        vimTextarea = vimEditorEl.querySelector('.vim-textarea');
        vimStatusLabel = vimEditorEl.querySelector('.vim-status-left');
        vimColonBar = vimEditorEl.querySelector('.vim-colon-bar');
        vimColonInput = vimEditorEl.querySelector('.vim-colon-input');

        window.imaginalOS.terminalOutput.style.display = 'none';
        window.imaginalOS.terminalInput.parentNode.style.display = 'none';
        if (window.imaginalOS.terminalHintBar) window.imaginalOS.terminalHintBar.style.display = 'none';

        vimEditorEl.focus();
        updateVimStatus();
    }

    function handleVimKey(e) {
        if (vimMode === 'normal') {
            // Block standard editing shortcuts while in Command Mode
            if (e.key !== 'F5' && e.key !== 'F12') {
                e.preventDefault();
            }

            if (e.key === 'i' || e.key === 'I') {
                vimMode = 'insert';
                vimTextarea.removeAttribute('readonly');
                vimTextarea.focus();
                
                const splash = vimEditorEl.querySelector('.vim-splash');
                if (splash) splash.style.display = 'none';
                
                updateVimStatus();
            } else if (e.key === ':') {
                vimMode = 'colon';
                vimColonBar.style.display = 'flex';
                vimColonInput.value = '';
                vimColonInput.focus();
                updateVimStatus();
            }
        } else if (vimMode === 'insert') {
            if (e.key === 'Escape') {
                e.preventDefault();
                vimMode = 'normal';
                vimTextarea.setAttribute('readonly', 'true');
                vimTextarea.blur();
                vimEditorEl.focus();
                
                if (!vimTextarea.value) {
                    const splash = vimEditorEl.querySelector('.vim-splash');
                    if (splash) splash.style.display = 'block';
                }
                
                updateVimStatus();
            }
        } else if (vimMode === 'colon') {
            if (e.key === 'Escape') {
                e.preventDefault();
                vimMode = 'normal';
                vimColonBar.style.display = 'none';
                vimColonInput.blur();
                vimEditorEl.focus();
                updateVimStatus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = vimColonInput.value.trim();
                executeVimColonCommand(cmd);
            }
        }
    }

    function processSavedContent(filename, rawText) {
        if (filename === 'contact.txt') {
            return { text: rawText, corrupted: false };
        }

        const urlRegex = /(https?:\/\/[^\s()<>]+)/;
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

        if (!urlRegex.test(rawText) && !emailRegex.test(rawText)) {
            return { text: rawText, corrupted: false };
        }

        const shield = (match) => {
            const encrypted = window.imaginalOS.xorCipher(match, FLAG_KEY);
            return `[BMO-SHIELD: ${encrypted} (Decrypt with: secret decrypt ${FLAG_KEY} ${encrypted})]`;
        };

        return {
            text: rawText.replace(new RegExp(urlRegex, 'g'), shield).replace(new RegExp(emailRegex, 'g'), shield),
            corrupted: true
        };
    }

    // Every non-writing colon command ends the same way: drop out of COMMAND
    // mode, redraw the status bar and report the outcome.
    function leaveColonMode(message, isError = false) {
        vimMode = 'normal';
        vimColonBar.style.display = 'none';
        vimColonInput.blur();
        vimEditorEl.focus();

        if (!message) {
            updateVimStatus();
            return;
        }
        const prefix = isError ? `<span class="vim-badge command" style="background:#e53e3e;">ERROR</span> ` : '';
        vimStatusLabel.innerHTML = prefix + message;
    }

    function reportShieldedContent(processed) {
        if (!processed.corrupted) return;
        window.imaginalOS.writeOutput(`<span style="color: #64ffda; font-weight: bold;">BMO Warning:</span> Links/emails are restricted for security! Automated crypto-shield active. Secrets locked with ${FLAG_KEY}.<br>`);
    }

    function executeVimColonCommand(cmd) {
        if ((cmd === 'wq' || cmd === 'w') && vimFileNode.readonly) {
            leaveColonMode('[readonly] File is read-only (system write-protection active)', true);
            return;
        }

        if (cmd === 'wq') {
            const processed = processSavedContent(vimFileName, vimTextarea.value);
            vimFileNode.content = processed.text;
            window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
            closeVimEditor();
            window.imaginalOS.writeOutput(`"${window.imaginalOS.escapeHtml(vimFileName)}" written and saved.<br>`);
            reportShieldedContent(processed);
            return;
        }

        if (cmd === 'w') {
            const processed = processSavedContent(vimFileName, vimTextarea.value);
            vimFileNode.content = processed.text;
            vimTextarea.value = processed.text;
            window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
            leaveColonMode(`"${window.imaginalOS.escapeHtml(vimFileName)}" written.`);
            reportShieldedContent(processed);
            return;
        }

        if (cmd === 'q') {
            if (vimTextarea.value !== vimFileNode.content) {
                leaveColonMode('No write since last change (add ! to override)', true);
            } else {
                closeVimEditor();
            }
            return;
        }

        if (cmd === 'q!') {
            closeVimEditor();
            return;
        }

        leaveColonMode();
    }

    function closeVimEditor() {
        if (vimEditorEl) {
            vimEditorEl.remove();
            vimEditorEl = null;
        }
        window.imaginalOS.shellState = 'normal';

        // Re-enable console displays
        if (window.imaginalOS.terminalOutput) window.imaginalOS.terminalOutput.style.display = 'block';
        if (window.imaginalOS.terminalInput && window.imaginalOS.terminalInput.parentNode) window.imaginalOS.terminalInput.parentNode.style.display = 'flex';
        if (window.imaginalOS.terminalHintBar) window.imaginalOS.terminalHintBar.style.display = 'block';

        if (window.imaginalOS.terminalInput) window.imaginalOS.terminalInput.focus();
        if (window.imaginalOS.terminalOutput) window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
    }

    function updateVimStatus() {
        if (!vimStatusLabel) return;
        const roSuffix = vimFileNode.readonly ? ' <span style="color:#ff3838;">[readonly]</span>' : '';

        if (vimMode === 'normal') {
            vimStatusLabel.innerHTML = `<span class="vim-badge normal">NORMAL</span>  "${window.imaginalOS.escapeHtml(vimFileName)}"${roSuffix} -- Type 'i' to edit, ':' for commands`;
        } else if (vimMode === 'insert') {
            vimStatusLabel.innerHTML = `<span class="vim-badge insert">INSERT</span>  Editing content... Press ESC to return`;
        } else if (vimMode === 'colon') {
            vimStatusLabel.innerHTML = `<span class="vim-badge command">COMMAND</span>  wq: save & quit, q!: quit without save`;
        }
    }

    // Expose on namespace
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.runVim = runVim;
    window.imaginalOS.handleVimKey = handleVimKey;
    window.imaginalOS.closeVimEditor = closeVimEditor;
})();
