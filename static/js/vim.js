/**
 * imaginalOS - BIM (Vim Improved) Editor Module
 */
(function() {
    let vimFileNode = null;
    let vimFileName = '';
    let vimMode = 'normal'; // 'normal', 'insert', 'colon'
    let vimEditorEl = null;
    let vimTextarea = null;
    let vimStatusLabel = null;
    let vimColonBar = null;
    let vimColonInput = null;

    async function runVim(pathStr) {
        if (!pathStr) {
            window.imaginalOS.writeOutput("<span class='err'>vim: missing file operand</span><br>");
            return;
        }
        
        let filename = pathStr;
        let dirPathStr = '.';
        if (pathStr.includes('/')) {
            const parts = pathStr.split('/');
            filename = parts.pop();
            dirPathStr = parts.join('/') || '/';
        }
        
        const dirRes = window.imaginalOS.resolvePath(dirPathStr);
        if (dirRes.error) {
            window.imaginalOS.writeOutput(`<span class='err'>vim: ${dirRes.error}: ${window.imaginalOS.escapeHtml(dirPathStr)}</span><br>`);
            return;
        }
        
        const dirNode = dirRes.node;
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

        // Fetch lazy content if needed
        if (editingFileNode.contentPath && (editingFileNode.readonly || editingFileNode.content === undefined)) {
            try {
                const response = await fetch(editingFileNode.contentPath);
                if (response.ok) {
                    editingFileNode.content = await response.text();
                    window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
                } else {
                    if (editingFileNode.content === undefined) editingFileNode.content = `[Error: Failed to load ${editingFileNode.contentPath}]`;
                }
            } catch {
                if (editingFileNode.content === undefined) editingFileNode.content = `[Error: Network error loading ${editingFileNode.contentPath}]`;
            }
        }

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
                <textarea class="vim-textarea" spellcheck="false" readonly>${window.imaginalOS.escapeHtml(fileNode.content)}</textarea>
                <div class="vim-splash" style="display: ${isEmpty ? 'block' : 'none'};">
                    <div style="text-align: center; margin-top: 3vh; color: #64ffda; font-weight: bold; font-size: 16px;">B I M - BMO Improved</div>
                    <div style="text-align: center; color: #8892b0; font-size: 12px; margin-top: 2px;">version ${window.imaginalOS.VERSION || '0.9.1'}</div>
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
        
        let corrupted = false;
        const urlRegex = /(https?:\/\/[^\s()<>]+)/g;
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const key = 'flag{h4ck_th3_pl4n3t_1999}';
        
        let newText = rawText;
        
        if (urlRegex.test(rawText) || emailRegex.test(rawText)) {
            corrupted = true;
            urlRegex.lastIndex = 0;
            emailRegex.lastIndex = 0;
            
            newText = newText.replace(urlRegex, (match) => {
                const encrypted = window.imaginalOS.xorCipher ? window.imaginalOS.xorCipher(match, key) : match;
                return `[BMO-SHIELD: ${encrypted} (Decrypt with: secret decrypt ${key} ${encrypted})]`;
            });
            
            newText = newText.replace(emailRegex, (match) => {
                const encrypted = window.imaginalOS.xorCipher ? window.imaginalOS.xorCipher(match, key) : match;
                return `[BMO-SHIELD: ${encrypted} (Decrypt with: secret decrypt ${key} ${encrypted})]`;
            });
        }
        
        return { text: newText, corrupted: corrupted };
    }

    function executeVimColonCommand(cmd) {
        if (cmd === 'wq' || cmd === 'w') {
            if (vimFileNode.readonly) {
                vimMode = 'normal';
                vimColonBar.style.display = 'none';
                vimColonInput.blur();
                updateVimStatus();
                vimStatusLabel.innerHTML = `<span class="vim-badge command" style="background:#e53e3e;">ERROR</span> [readonly] File is read-only (system write-protection active)`;
                return;
            }
        }

        if (cmd === 'wq') {
            const processed = processSavedContent(vimFileName, vimTextarea.value);
            vimFileNode.content = processed.text;
            window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
            closeVimEditor();
            window.imaginalOS.writeOutput(`"${window.imaginalOS.escapeHtml(vimFileName)}" written and saved.<br>`);
            if (processed.corrupted) {
                window.imaginalOS.writeOutput(`<span style="color: #64ffda; font-weight: bold;">BMO Warning:</span> Links/emails are restricted for security! Automated crypto-shield active. Secrets locked with flag{h4ck_th3_pl4n3t_1999}.<br>`);
            }
        } else if (cmd === 'w') {
            const processed = processSavedContent(vimFileName, vimTextarea.value);
            vimFileNode.content = processed.text;
            vimTextarea.value = processed.text;
            window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
            vimMode = 'normal';
            vimColonBar.style.display = 'none';
            vimColonInput.blur();
            updateVimStatus();
            vimStatusLabel.textContent = `"${vimFileName}" written.`;
            if (processed.corrupted) {
                window.imaginalOS.writeOutput(`<span style="color: #64ffda; font-weight: bold;">BMO Warning:</span> Links/emails are restricted for security! Automated crypto-shield active. Secrets locked with flag{h4ck_th3_pl4n3t_1999}.<br>`);
            }
        } else if (cmd === 'q') {
            const hasChanges = vimTextarea.value !== vimFileNode.content;
            if (hasChanges) {
                vimMode = 'normal';
                vimColonBar.style.display = 'none';
                vimColonInput.blur();
                updateVimStatus();
                vimStatusLabel.innerHTML = `<span class="vim-badge command" style="background:#e53e3e;">ERROR</span> No write since last change (add ! to override)`;
            } else {
                closeVimEditor();
            }
        } else if (cmd === 'q!') {
            closeVimEditor();
        } else {
            vimMode = 'normal';
            vimColonBar.style.display = 'none';
            vimColonInput.blur();
            updateVimStatus();
        }
    }

    function closeVimEditor() {
        if (vimEditorEl) {
            vimEditorEl.remove();
            vimEditorEl = null;
        }
        window.imaginalOS.shellState = 'normal';

        // Re-enable console displays
        window.imaginalOS.terminalOutput.style.display = 'block';
        window.imaginalOS.terminalInput.parentNode.style.display = 'flex';
        if (window.imaginalOS.terminalHintBar) window.imaginalOS.terminalHintBar.style.display = 'block';

        window.imaginalOS.terminalInput.focus();
        window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
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
})();
