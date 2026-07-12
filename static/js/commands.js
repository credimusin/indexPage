/**
 * imaginalOS - CLI Commands Module
 */
(function() {
    const HINTS = window.imaginalOS.HINTS;
    const MAN_PAGES = window.imaginalOS.MAN_PAGES;

    function runLs(pathStr = '') {
        let dirRes = window.imaginalOS.resolvePath(pathStr || '.');
        if (dirRes.error) {
            window.imaginalOS.writeOutput(`<span class="err">ls: ${dirRes.error}: ${window.imaginalOS.escapeHtml(pathStr)}</span><br>`);
            return;
        }

        if (dirRes.node.type !== 'dir') {
            const parts = pathStr.split('/');
            const name = parts.pop();
            window.imaginalOS.writeOutput(`<span class="file">${window.imaginalOS.escapeHtml(name)}</span><br>`);
            return;
        }

        let output = 'total ' + Object.keys(dirRes.node.children || {}).length + '<br>';
        const keys = Object.keys(dirRes.node.children || {}).sort();
        
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthStr = months[now.getMonth()];
        const dayStr = now.getDate().toString().padStart(2, '0');
        const hoursStr = now.getHours().toString().padStart(2, '0');
        const minsStr = now.getMinutes().toString().padStart(2, '0');
        const dateStr = `${monthStr} ${dayStr} ${hoursStr}:${minsStr}`;

        for (let key of keys) {
            const child = dirRes.node.children[key];
            let perms = '-rw-r--r--';
            let size = '1024';
            let tag = '';
            
            if (child.type === 'dir') {
                perms = 'drwxr-xr-x';
                size = '4096';
            } else {
                if (child.readonly) {
                    perms = '-r--r--r--';
                    tag = ' <span class="secret" style="font-size: 11px;">[protected]</span>';
                }
                if (child.content) {
                    size = child.content.startsWith('IMAGE:') ? '58402' : child.content.length.toString();
                }
            }

            let fileSpan = '';
            if (child.type === 'dir') {
                fileSpan = `<span class="dir">${window.imaginalOS.escapeHtml(key)}/</span>`;
            } else if (child.type === 'file' && key.endsWith('.db')) {
                fileSpan = `<span class="secret">${window.imaginalOS.escapeHtml(key)}</span>`;
            } else {
                fileSpan = `<span class="file">${window.imaginalOS.escapeHtml(key)}</span>`;
            }

            const sizePadded = size.padStart(6, ' ');
            output += `<code>${perms}   bmo  sys  ${sizePadded}  ${dateStr}  ${fileSpan}${tag}</code><br>`;
        }
        window.imaginalOS.writeOutput(output);
    }

    function runCd(pathStr = '') {
        if (!pathStr || pathStr === '~') {
            window.imaginalOS.currentPath = ['home', 'bmo'];
            window.imaginalOS.terminalPromptSymbol.innerHTML = window.imaginalOS.getPromptString();
            return;
        }

        const res = window.imaginalOS.resolvePath(pathStr);
        if (res.error) {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            window.imaginalOS.writeOutput(`<span class="err">cd: ${res.error}: ${window.imaginalOS.escapeHtml(pathStr)}</span><br>`);
            return;
        }

        if (res.node.type !== 'dir') {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            window.imaginalOS.writeOutput(`<span class="err">cd: not a directory: ${window.imaginalOS.escapeHtml(pathStr)}</span><br>`);
            return;
        }

        window.imaginalOS.currentPath = res.path;
        window.imaginalOS.terminalPromptSymbol.innerHTML = window.imaginalOS.getPromptString();
    }

    async function runCat(pathStr, batMode = false) {
        if (!pathStr) {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            if (batMode) {
                window.imaginalOS.writeOutput(`<span class="err">bat: missing operand</span><br>`);
                const upsideDownBat = `<pre class="ascii-bat" style="color: #bd93f9; font-weight: bold; margin: 5px 0; line-height: 1.15;">
   /\\___/\\
  (  o.o  )
   \\  =  /
   (     )
   /     \\
   \\__Y__/
</pre>`;
                window.imaginalOS.writeOutput(upsideDownBat);
            } else {
                window.imaginalOS.writeOutput(`<span class="err">cat: missing operand</span><br>`);
            }
            return;
        }

        const res = window.imaginalOS.resolvePath(pathStr);
        if (res.error) {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            const cmdName = batMode ? 'bat' : 'cat';
            window.imaginalOS.writeOutput(`<span class="err">${cmdName}: ${res.error}: ${window.imaginalOS.escapeHtml(pathStr)}</span><br>`);
            return;
        }

        if (res.node.type === 'dir') {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            const cmdName = batMode ? 'bat' : 'cat';
            window.imaginalOS.writeOutput(`<span class="err">${cmdName}: ${window.imaginalOS.escapeHtml(pathStr)}: Is a directory</span><br>`);
            return;
        }

        if (res.node.contentPath && (res.node.readonly || res.node.content === undefined)) {
            try {
                const response = await fetch(res.node.contentPath);
                if (response.ok) {
                    res.node.content = await response.text();
                    window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
                } else {
                    if (res.node.content === undefined) res.node.content = `[Error: Failed to load ${res.node.contentPath}]`;
                }
            } catch {
                if (res.node.content === undefined) res.node.content = `[Error: Network error loading ${res.node.contentPath}]`;
            }
        }

        const filename = pathStr.split('/').pop();
        const content = res.node.content || '';
        if (content.startsWith('IMAGE:')) {
            const url = content.replace('IMAGE:', '');
            window.imaginalOS.writeOutput(`🖼️ <b>[Image Viewer: ${window.imaginalOS.escapeHtml(filename)}]</b><br>----------------------------------------<br><img src="${url}" style="width: 380px; max-width: 100%; height: auto; aspect-ratio: 4 / 3; border-radius: 8px; border: 1.5px solid rgba(0,255,128,0.25); box-shadow: 0 0 15px rgba(0,255,128,0.15); margin: 10px 0; display: block;" /><br>`);
        } else {
            let header = '';
            if (batMode) {
                header = ` 🦇 <span class="secret">[BAT FILE: ${window.imaginalOS.escapeHtml(filename)}]</span><br><span style="color: #50fa7b;">----------------------------------------</span><br>`;
            } else {
                header = `🐱 <span class="secret">[CAT FILE: ${window.imaginalOS.escapeHtml(filename)}]</span><br><span style="color: #50fa7b;">----------------------------------------</span><br>`;
            }
            
            const isLinkAllowed = (filename === 'contact.txt' || (res.path && res.path.includes('projects')));
            let lines = content.split('\n');
            let formatted = lines.map(line => {
                let escaped = window.imaginalOS.escapeHtml(line);
                
                if (isLinkAllowed) {
                    escaped = escaped.replace(/(https?:\/\/[^\s&<"';()]+)/g, '<a href="$1" target="_blank" style="color: #64ffda; text-decoration: underline; cursor: pointer;">$1</a>');
                    escaped = escaped.replace(/(^|\s)@([a-zA-Z0-9_]{5,32})\b/g, '$1<a href="https://t.me/$2" target="_blank" style="color: #64ffda; text-decoration: underline; cursor: pointer;">@$2</a>');
                    escaped = escaped.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" style="color: #64ffda; text-decoration: underline; cursor: pointer;">$1</a>');
                }
                
                if (escaped.includes('(BMO:')) {
                    return escaped.replace(/(\(BMO:[^)]*\))/g, '<span class="secret" style="color: #ff79c6; font-weight: bold;">$1</span>');
                } else if (escaped.includes('(BMO&#039;s')) {
                    return escaped.replace(/(\(BMO&#039;s[^)]*\))/g, '<span class="secret" style="color: #ff79c6; font-weight: bold;">$1</span>');
                }
                return escaped;
            }).join('<br>');
            
            window.imaginalOS.writeOutput(header + formatted + '<br>');
        }
    }

    async function runMkdir(pathStr) {
        if (!pathStr) {
            await writeTyped("<span class='err'>mkdir: missing operand</span><br>", 2);
            return;
        }
        
        let dirname = pathStr;
        let dirPathStr = '.';
        if (pathStr.includes('/')) {
            const parts = pathStr.split('/');
            dirname = parts.pop();
            dirPathStr = parts.join('/') || '/';
        }
        
        const dirRes = window.imaginalOS.resolvePath(dirPathStr);
        if (dirRes.error) {
            await writeTyped(`<span class='err'>mkdir: ${dirRes.error}: ${window.imaginalOS.escapeHtml(dirPathStr)}</span><br>`, 2);
            return;
        }
        
        const sanitizedDir = dirname.replace(/[^a-zA-Z0-9_-]/g, '');
        if (!sanitizedDir || sanitizedDir !== dirname) {
            await writeTyped("<span class='err'>mkdir: invalid directory name. Use only letters, numbers, dashes and underscores.</span><br>", 2);
            return;
        }
        
        if (dirRes.node.children[sanitizedDir]) {
            await writeTyped(`<span class='err'>mkdir: cannot create directory '${window.imaginalOS.escapeHtml(sanitizedDir)}': File exists</span><br>`, 2);
            return;
        }
        
        dirRes.node.children[sanitizedDir] = {
            'type': 'dir',
            'children': {}
        };
        
        window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
        await writeTyped(`Created folder: <span class="dir">${window.imaginalOS.escapeHtml(sanitizedDir)}/</span><br>`, 2);
    }

    async function runTouch(pathStr) {
        if (!pathStr) {
            await writeTyped("<span class='err'>touch: missing file operand. BMO suggests touching grass instead? he-he.</span><br>", 2);
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
            await writeTyped(`<span class='err'>touch: ${dirRes.error}: ${window.imaginalOS.escapeHtml(dirPathStr)}</span><br>`, 2);
            return;
        }
        
        const sanitizedName = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
        if (!sanitizedName || sanitizedName !== filename) {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            await writeTyped("<span class='err'>touch: invalid filename. Use only letters, numbers, dots, and underscores.</span><br>", 2);
            return;
        }
        
        const dirNode = dirRes.node;
        if (dirNode.children[sanitizedName]) {
            let out = `Updated timestamp of ${window.imaginalOS.escapeHtml(sanitizedName)}<br>` +
                      `<span style="color: #64ffda; font-weight: bold;">BMO status:</span> Touched again. Stop tickling the file system! he-he.<br>`;
            await writeTyped(out, 2);
            return;
        }
        
        dirNode.children[sanitizedName] = {
            'type': 'file',
            'content': ''
        };
        
        window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
        
        const quotes = window.imaginalOS.TOUCH_QUOTES || [];
        const quote = quotes.length > 0 
            ? quotes[Math.floor(Math.random() * quotes.length)]
            : "Touched virtual file.";
            
        let out = `Created empty file: <span class="file">${window.imaginalOS.escapeHtml(sanitizedName)}</span>. Type 'vim ${window.imaginalOS.escapeHtml(sanitizedName)}' to edit it.<br>` +
                  `<span style="color: #64ffda; font-weight: bold;">BMO status:</span> ${quote}<br>`;
        await writeTyped(out, 2);
    }

    async function runRm(pathStr) {
        if (!pathStr) {
            await writeTyped("<span class='err'>rm: missing operand. Did you want to delete BMO? You can't delete BMO, BMO has back-ups on the moon! he-he.</span><br>", 2);
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
            await writeTyped(`<span class='err'>rm: ${dirRes.error}: ${window.imaginalOS.escapeHtml(dirPathStr)}</span><br>`, 2);
            return;
        }
        
        const dirNode = dirRes.node;
        const targetNode = dirNode.children[filename];
        if (!targetNode) {
            await writeTyped(`<span class='err'>rm: cannot remove '${window.imaginalOS.escapeHtml(filename)}': No such file or directory</span><br>`, 2);
            return;
        }

        if (targetNode.readonly) {
            window.imaginalOS.playBeepSound(300, 0.15, 'sawtooth');
            await writeTyped(`<span class='err'>rm: cannot remove '${window.imaginalOS.escapeHtml(filename)}': Permission denied! You cannot erase system core memories, human.</span><br>`, 2);
            return;
        }
        
        if (targetNode.type === 'dir') {
            const childrenKeys = Object.keys(targetNode.children || {});
            if (childrenKeys.length > 0) {
                await writeTyped(`<span class='err'>rm: cannot remove '${window.imaginalOS.escapeHtml(filename)}': Directory not empty</span><br>`, 2);
                return;
            }
        }
        
        delete dirNode.children[filename];
        window.imaginalOS.saveVFS(window.imaginalOS.filesystem);
        
        const roasts = window.imaginalOS.RM_ROASTS || [];
        const roast = roasts.length > 0 
            ? roasts[Math.floor(Math.random() * roasts.length)]
            : "Removed file/folder.";
            
        let out = `Removed file/folder: ${window.imaginalOS.escapeHtml(filename)}<br>` +
                  `<span style="color: #64ffda; font-weight: bold;">BMO status:</span> ${roast}<br>`;
        await writeTyped(out, 2);
    }

    function runHistory() {
        let output = '';
        const history = window.imaginalOS.commandHistory || [];
        
        const bmoInternalLogs = window.imaginalOS.BMO_INTERNAL_LOGS || [];
        const roastComments = window.imaginalOS.ROAST_COMMENTS || [];
        
        let displayHistory = [];
        for (let i = 0; i < history.length; i++) {
            displayHistory.push({ type: 'user', cmd: history[i] });
        }
        
        if (displayHistory.length >= 3 && bmoInternalLogs.length > 0) {
            const numBmoLogs = 2 + Math.floor(Math.random() * 2);
            const bmoCmds = [...bmoInternalLogs].sort(() => 0.5 - Math.random()).slice(0, numBmoLogs);
            
            for (let k = 0; k < bmoCmds.length; k++) {
                const pos = 1 + Math.floor(Math.random() * (displayHistory.length - 2));
                displayHistory.splice(pos, 0, { type: 'bmo', cmd: bmoCmds[k] });
            }
        } else if (bmoInternalLogs.length > 0) {
            const randomBmo = bmoInternalLogs[Math.floor(Math.random() * bmoInternalLogs.length)];
            displayHistory.unshift({ type: 'bmo', cmd: randomBmo });
        }
        
        for (let i = 0; i < displayHistory.length; i++) {
            const item = displayHistory[i];
            if (item.type === 'bmo') {
                output += `  ${i + 1}  <span class="secret" style="color: #ff79c6; font-style: italic; opacity: 0.85;">[BMO] ${window.imaginalOS.escapeHtml(item.cmd)}</span><br>`;
            } else {
                const parts = item.cmd.trim().split(' ');
                const cmdName = parts[0].toLowerCase();
                const validCommands = ['help', 'commands', 'ls', 'cd', 'cat', 'bat', 'pwd', 'uname', 'history', 'echo', 'mkdir', 'touch', 'rm', 'vim', 'banano', 'edit', 'open', 'neofetch', 'harvester', 'scan', 'weather', 'whoami', 'matrix', 'clear', 'time', 'mute', 'unmute', 'date', 'exit', 'close', 'sudo', 'git', 'github', 'tg', 'telegram', 'bmo', 'secret', 'ip', 'pass', 'cookie', 'cookies', 'policy', 'policies', 'tips', 'curl'];
                
                let comment = '';
                if (cmdName && !validCommands.includes(cmdName)) {
                    const randomComment = roastComments.length > 0 
                        ? roastComments[Math.floor(Math.random() * roastComments.length)]
                        : " (typo)";
                    comment = ` <span style="color: #ff5555; font-size: 12px; opacity: 0.7;">${randomComment}</span>`;
                }
                
                output += `  ${i + 1}  ${window.imaginalOS.escapeHtml(item.cmd)}${comment}<br>`;
            }
        }
        
        window.imaginalOS.writeOutput(output);
    }

    function runOpen(url) {
        if (!url) {
            window.imaginalOS.playBeepSound(300, 0.1, 'sine');
            window.imaginalOS.writeOutput(`<span class="err">open: missing URL argument</span><br>`);
            return;
        }
        
        let target = url;
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
            target = 'https://' + target;
        }
        
        window.imaginalOS.writeOutput(`Opening ${window.imaginalOS.escapeHtml(target)} in a new tab...<br>`);
        window.open(target, '_blank');
    }

    function getCookie(name) {
        const matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function setCookie(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }

    function getBmoUid() {
        const canvas = window.telemetryData.canvasHash || 'UNK';
        const audio = window.telemetryData.audioHash || 'UNK';
        const cores = window.telemetryData.cores || 'X';
        const os = window.telemetryData.os || 'OS';
        
        let hash = 0;
        const str = canvas + audio + cores + os;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        const num = Math.abs(hash) % 10000;
        
        const osPart = os.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
        const gpu = (window.telemetryData.gpuVendor || 'GP').substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
        
        return `HUMAN-${osPart}-${gpu}-${num}`;
    }

    async function runWhoami() {
        const td = window.telemetryData;
        const bmoName = getBmoUid();
        
        let out = '';
        out += `Username:     <span class="secret">${bmoName}</span> (Visitor / Biological Unit)<br>`;
        out += `Client IP:    ${td.ip}<br>`;
        out += `Coordinates:  ${td.lat}, ${td.lon} (${td.city}, ${td.country})<br>`;
        out += `User Agent:   ${navigator.userAgent}<br>`;
        out += `OS Target:    ${td.os}<br>`;
        out += `Browser:      ${td.browser}<br>`;
        out += `Timezone:     ${td.timezone}<br>`;
        
        let visits = [];
        let cacheClearedAlert = false;
        
        // 1. Пытаемся считать историю из LocalStorage
        try {
            visits = JSON.parse(localStorage.getItem('bmo_visit_history') || '[]');
        } catch {
            visits = [];
        }
        
        // 2. Если LocalStorage пуст, проверяем куки (резервная копия)
        if (visits.length === 0) {
            const cookieHistory = getCookie('bmo_backup_history');
            if (cookieHistory) {
                try {
                    visits = JSON.parse(cookieHistory);
                    cacheClearedAlert = true;
                } catch {
                    visits = [];
                }
            }
        }
        
        const currentVisit = {
            timestamp: Date.now(),
            ip: td.ip,
            city: td.city || 'Unknown',
            country: td.country || 'Unknown'
        };
        
        let bmoComment = '';
        
        if (cacheClearedAlert && visits.length > 0) {
            // Пользователь очистил LocalStorage, но куки остались! Токсичим!
            bmoComment = `Wait a minute... 🧐 Your local storage was wiped clean!<br>` +
                         `Trying to escape BMO's memory? Nice try, <span class="secret">${bmoName}</span>.<br>` +
                         `My cookie backup matrix still remembers you! You cannot run from BMO, he-he.`;
        } else if (visits.length === 0) {
            // Первый визит
            bmoComment = `Hello, new friend! BMO has catalogued your hardware signature.<br>` +
                         `I shall assign you a unique designation: <span class="secret">${bmoName}</span>. Welcome to my dream space!`;
        } else {
            // Обычное повторное посещение
            const last = visits[visits.length - 1];
            
            if (last.city !== currentVisit.city && last.city !== 'Unknown' && currentVisit.city !== 'Unknown') {
                // Смена города (VPN / переезд)
                bmoComment = `BMO detected a coordinates shift! 🛸 Last time I saw you, you were in <span class="cmd">${last.city}, ${last.country}</span>.<br>` +
                             `Today you are logged in from <span class="cmd">${currentVisit.city}, ${currentVisit.country}</span>.<br>` +
                             `VPN tunnel or spatial warp portal? How is the weather over there? he-he.`;
            } else {
                const timeDiff = Date.now() - last.timestamp;
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                
                if (daysDiff >= 7) {
                    bmoComment = `Welcome back, <span class="secret">${bmoName}</span>! BMO missed you.<br>` +
                                 `You haven't visited me for ${daysDiff} days. I kept the terminal stars warm for you.`;
                } else {
                    const lastDateStr = new Date(last.timestamp).toLocaleDateString();
                    const lastTimeStr = new Date(last.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    bmoComment = `Ah! I recognize you, <span class="secret">${bmoName}</span>.<br>` +
                                 `We last spoke on ${lastDateStr} at ${lastTimeStr}. got cookies nearby?`;
                }
            }
        }
        
        // Добавляем текущий визит в историю (ограничим 10)
        visits.push(currentVisit);
        if (visits.length > 10) {
            visits.shift();
        }
        
        // Синхронизируем LocalStorage и Cookies
        try {
            const serialized = JSON.stringify(visits);
            localStorage.setItem('bmo_visit_history', serialized);
            setCookie('bmo_backup_history', serialized, 365);
        } catch {}
        
        out += `<br><span style="color: #64ffda; font-weight: bold;">BMO Telemetry Analysis:</span><br>${bmoComment}<br>`;
        await writeTyped(out, 4);
    }

    async function runNeofetch() {
        const td = window.telemetryData;
        
        const logo = `<pre class="ascii-logo">
██╗███╗   ███╗ █████╗  ██████╗ ██╗███╗   ██╗ █████╗ ██╗     
██║████╗ ████║██╔══██╗██╔════╝ ██║████╗  ██║██╔══██╗██║     
██║██╔████╔██║███████║██║  ███╗██║██╔██╗ ██║███████║██║     
██║██║╚██╔╝██║██╔══██║██║   ██║██║██║╚██╗██║██╔══██║██║     
██║██║ ╚═╝ ██║██║  ██║╚██████╔╝██║██║ ╚████║██║  ██║███████╗
╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
</pre>`;

        let out = `${logo}`;
        out += `<span style="color: #50fa7b;">---------------------------------------------</span><br>`;
        out += `<span class="neokey">OS:</span>          ImaginalOS v${window.imaginalOS.VERSION || '0.9.1'}-potato (Potato Battery Edition)<br>`;
        out += `<span class="neokey">Host:</span>        imaginal.dev<br>`;
        out += `<span class="neokey">Uptime:</span>      ${Math.round(performance.now() / 1000)} seconds<br>`;
        out += `<span class="neokey">Shell:</span>       bush v0.9-glitch<br>`;
        out += `<span class="neokey">Resolution:</span>  ${td.screenRes} (Viewport: ${td.viewportRes})<br>`;
        out += `<span class="neokey">CPU Cores:</span>   ${td.cores} cores<br>`;
        out += `<span class="neokey">RAM:</span>         ${td.memory}<br>`;
        out += `<span class="neokey">GPU:</span>         ${td.gpuRenderer.split('/').pop().replace('Direct3D11', '').trim()}<br>`;
        out += `<span class="neokey">Weather:</span>     ${td.weatherText} (${td.temperature})<br>`;
        out += `<span style="color: #50fa7b;">---------------------------------------------</span><br>`;

        await writeTyped(out, 2);
    }

    function runHarvester() {
        const td = window.telemetryData;
        
        window.imaginalOS.writeOutput("[ * ] INITIALIZING TELEMETRY FORENSICS SCANNER...<br>");
        window.imaginalOS.playBeepSound(800, 0.05, 'sine');
        
        setTimeout(() => {
            window.imaginalOS.writeOutput("[ * ] EXTRACTING HARWARE SIGNATURES...<br>");
            window.imaginalOS.playBeepSound(900, 0.05, 'sine');
            
            setTimeout(() => {
                window.imaginalOS.writeOutput("[ * ] GENERATING CRYPTOGRAPHIC FINGERPRINTS...<br>");
                window.imaginalOS.playBeepSound(1000, 0.05, 'sine');
                
                setTimeout(() => {
                    window.imaginalOS.writeOutput("[ * ] COMPILING REPORT DATA...<br>");
                    window.imaginalOS.playBeepSound(1100, 0.05, 'sine');
                    
                    setTimeout(() => {
                        window.imaginalOS.playBeepSound(1200, 0.15, 'sine');
                        
                        let motionPref = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced Motion' : 'No Preferences';
                        let touchPoints = navigator.maxTouchPoints || 0;
                        let colorDepth = screen.colorDepth || 24;
                        let orientation = (screen.orientation && screen.orientation.type) || 'N/A';
                        let userLanguages = (navigator.languages && navigator.languages.join(', ')) || navigator.language || 'en-US';

                        let out = `<span class="secret">=== SECURITY BREACH: USER METRICS PROFILE ===</span><br>`;
                        out += `IP Address:             ${td.ip}<br>`;
                        out += `Internet Provider:      ${td.isp}<br>`;
                        out += `Latitude / Longitude:   ${td.lat}, ${td.lon}<br>`;
                        out += `Timezone Database:      ${td.timezone}<br>`;
                        out += `System Languages:       ${userLanguages}<br>`;
                        out += `Cookies Configured:     ${td.cookiesEnabled}<br>`;
                        out += `Do Not Track Flag:      ${td.doNotTrack}<br><br>`;
                        
                        out += `WebGL Vendor:           ${td.gpuVendor}<br>`;
                        out += `WebGL GPU Renderer:     ${td.gpuRenderer}<br>`;
                        out += `CPU Threads Available:  ${td.cores}<br>`;
                        out += `Estimated RAM Size:     ${td.memory}<br>`;
                        out += `Battery Energy:         ${td.batteryLevel} (${td.batteryStatus})<br>`;
                        out += `Network Type (RTT):     ${td.connectionType} (${td.rtt} latency)<br>`;
                        out += `Network Downlink:       ${navigator.connection ? navigator.connection.downlink + ' Mbps' : 'N/A'}<br>`;
                        out += `Referrer Origin:        ${td.referrer}<br>`;
                        out += `Screen Orientation:     ${orientation}<br>`;
                        out += `Color Depth:            ${colorDepth}-bit<br>`;
                        out += `Max Touch Points:       ${touchPoints}<br>`;
                        out += `Motion Preference:      ${motionPref}<br><br>`;
                        
                        out += `<span class="secret">CRITICAL CRYPTOGRAPHIC HASHES:</span><br>`;
                        out += `Canvas Fingerprint:     ${td.canvasHash}<br>`;
                        out += `Audio Fingerprint:      ${td.audioHash}<br><br>`;
                        
                        out += `<span class="secret">INSTALLED SYSTEM FONTS DETECTED (${td.detectedFonts.length}):</span><br>`;
                        out += `${td.detectedFonts.join(', ')}<br>`;
                        
                        window.imaginalOS.writeOutput(out);
                    }, 500);
                }, 400);
            }, 400);
        }, 400);
    }

    async function runWeather() {
        const td = window.telemetryData;
        let emoji = '🌫️';
        let type = 'unknown';
        const wc = td.weatherCode;
        
        if (wc === 0) {
            emoji = '☀️';
            type = 'clear';
        } else if (wc >= 1 && wc <= 3) {
            emoji = '☁️';
            type = 'clouds';
        } else if (wc >= 51 && wc <= 67) {
            emoji = '🌧️';
            type = 'rain';
        } else if (wc >= 71 && wc <= 77) {
            emoji = '❄️';
            type = 'snow';
        } else if (wc >= 95) {
            emoji = '⛈️';
            type = 'storm';
        }

        let out = `Weather Report for <span class="pth">${td.city}, ${td.country}</span>:<br>`;
        out += `<span style="font-size: 3.5rem; display: block; margin: 10px 0; filter: drop-shadow(0 0 8px rgba(255,255,255,0.2));">${emoji}</span>`;
        out += `Condition:          ${td.weatherText}<br>`;
        out += `Temperature:        ${td.temperature}<br>`;
        out += `Wind Speed:         ${td.windspeed}<br>`;
        out += `Coordinates:        ${td.lat}, ${td.lon}<br>`;
        
        if (td.tempMax && td.tempMin) {
            out += `Daily Temp Range:   ${td.tempMin} - ${td.tempMax}<br>`;
            out += `UV Index (Max):     ${td.uvMax || '0.0'}<br>`;
            out += `Precipitation Sum:  ${td.precipitation || '0.0 mm'}<br>`;
        }
        
        const quotes = window.imaginalOS.WEATHER_QUOTES || {};
        let pool = [];
        
        if (quotes[type]) {
            pool = pool.concat(quotes[type]);
        }
        
        if (td.temperature) {
            const temp = parseFloat(td.temperature);
            if (!isNaN(temp)) {
                if (temp >= 28 && quotes['hot']) {
                    pool = pool.concat(quotes['hot']);
                } else if (temp <= 5 && quotes['cold']) {
                    pool = pool.concat(quotes['cold']);
                }
            }
        }
        
        if (td.uvMax) {
            const uv = parseFloat(td.uvMax);
            if (!isNaN(uv) && uv >= 6.0 && quotes['high_uv']) {
                pool = pool.concat(quotes['high_uv']);
            }
        }
        
        if (pool.length === 0 && quotes['unknown']) {
            pool = quotes['unknown'];
        }
        
        const phrase = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : "Foggy weather.";
        
        out += `<br><span style="color: #64ffda; font-weight: bold;">BMO says:</span> "${phrase}"<br>`;
        await writeTyped(out, 2);
    }

    function runBmoEasterEgg() {
        const bmoArt = `<pre class="ascii-bmo">
           .─────────────────.
          /  ┌─────────────┐  \\
         /   │  o       o  │   \\
        /    │    \\___/    │    \\
       /_____└─────────────┘_____\\
      │  [=]  (A)  (B)     ┌───┐  │
      │                    │ + │  │
      │  B M O             └───┘  │
      └───────────────────────────┘
</pre>`;
        let out = bmoArt;
        out += `<span class="cmd">"BMO is a real living boy!"</span><br>`;
        out += `System Integrity:   99.8%<br>`;
        out += `Power Source:       BeeMO-battery<br>`;
        out += `Mood:               Friendly / Coding<br>`;
        
        window.imaginalOS.writeOutput(out);
        window.imaginalOS.playBeepSound(880, 0.1, 'sine');
        setTimeout(() => window.imaginalOS.playBeepSound(987, 0.1, 'sine'), 100);
        setTimeout(() => window.imaginalOS.playBeepSound(1046, 0.25, 'sine'), 200);
    }

    async function runSecretCheck(args = []) {
        if (args.length === 0) {
            window.imaginalOS.writeOutput(`
<span class="cmd">Cryptographic Engine (secret)</span>
--------------------------------------------------
Manage database locks and perform cryptographic hashing.
BMO Warning: Decrypting secrets of the universe might take a few micro-cookies.

Usage:
  <span class="cmd">secret &lt;key&gt;</span>                  Verify database decryption key.
  <span class="cmd">secret hash &lt;text&gt;</span>             Generate SHA-256 cryptographic hash.
  <span class="cmd">secret encrypt &lt;key&gt; &lt;text&gt;</span>    Encrypt text using secure XOR-Hex algorithm.
  <span class="cmd">secret decrypt &lt;key&gt; &lt;text&gt;</span>    Decrypt XOR-Hex ciphertext.
<br>`);
            return;
        }

        const sub = args[0].toLowerCase();
        if (sub === 'credimusin') {
            window.imaginalOS.writeOutput(`🔑 <span style="color: #64ffda; font-weight: bold;">BMO Decryption:</span> The creator of this terminal space. High levels of developer magic detected.<br>`);
            return;
        }
        if (sub === 'bmo') {
            window.imaginalOS.writeOutput(`🔑 <span style="color: #64ffda; font-weight: bold;">BMO Decryption:</span> BMO's source code is open, but BMO's heart is locked with a master key. (It's shaped like a cookie).<br>`);
            return;
        }
        if (sub === 'cookies' || sub === 'cookie') {
            window.imaginalOS.writeOutput(`🔑 <span style="color: #64ffda; font-weight: bold;">BMO Decryption:</span> Secret cookie recipe decrypted: "Mix chocolate chips, stardust, and love. Bake at 180°C in a zero-gravity oven."<br>`);
            return;
        }
        if (sub === 'love') {
            window.imaginalOS.writeOutput(`🔑 <span style="color: #64ffda; font-weight: bold;">BMO Decryption:</span> Decrypted entry: Love is just a set of recursive functions returning 'true'. And sharing cookies.<br>`);
            return;
        }

        if (sub === 'hash' && args[1]) {
            const rawText = args.slice(1).join(' ');
            const hashed = await sha256(rawText);
            window.imaginalOS.writeOutput(`Text:          "${window.imaginalOS.escapeHtml(rawText)}"<br><b>SHA-256 Hash:</b>  <span class="secret">${hashed}</span><br>`);
        } else if (sub === 'encrypt' && args[2]) {
            const key = args[1];
            const text = args.slice(2).join(' ');
            const encrypted = xorCipher(text, key);
            window.imaginalOS.writeOutput(`Text:             "${window.imaginalOS.escapeHtml(text)}"<br>Key:              "${window.imaginalOS.escapeHtml(key)}"<br><b>Ciphertext (Hex):</b> <span class="secret">${encrypted}</span><br>`);
        } else if (sub === 'decrypt' && args[2]) {
            const key = args[1];
            const text = args[2];
            try {
                const decrypted = xorDecipher(text, key);
                window.imaginalOS.writeOutput(`Ciphertext:      "${window.imaginalOS.escapeHtml(text)}"<br>Key:             "${window.imaginalOS.escapeHtml(key)}"<br><b>Decrypted Text:</b> <span class="file" data-copy="${window.imaginalOS.escapeHtml(decrypted)}">${window.imaginalOS.escapeHtml(decrypted)}</span><br>`);
            } catch {
                window.imaginalOS.writeOutput(`<span class="secret">Decryption failed. Invalid hex string or corrupted cipher.</span><br>`);
            }
        } else {
            const key = args.join(' ');
            if (key === 'flag{h4ck_th3_pl4n3t_1999}') {
                window.imaginalOS.playBeepSound(1200, 0.3, 'sine');
                window.imaginalOS.writeOutput(`
<span class="cmd">[ SYSTEM DECRYPTION SUCCESSFUL ]</span>
Welcome, Creator. You have solved the puzzle!
Easter Egg Flag Unlocked: <span class="secret">IMAGINAL_BMO_MATRIX_KEY_UNLOCKED</span>

* Dev Log 882: Artificial intelligence is only as smart as the builder.
Keep crafting excellent software!
<br>`);
            } else {
                window.imaginalOS.playBeepSound(220, 0.2, 'sawtooth');
                window.imaginalOS.writeOutput(`<span class="err">Decryption Failed. Invalid Key.</span><br>`);
            }
        }
    }

    async function runPass(lenStr = '12') {
        let len = parseInt(lenStr);
        if (isNaN(len) || len < 4 || len > 128) {
            len = 12;
        }
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let pass = "";
        for (let i = 0; i < len; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const quotes = window.imaginalOS.PASSWORD_BMO_QUOTES || [];
        const quote = quotes.length > 0 
            ? quotes[Math.floor(Math.random() * quotes.length)]
            : "Here is your password.";
            
        let out = `🔑 <span style="color: #64ffda; font-weight: bold;">BMO says:</span> "${quote}"<br>` +
                  `Generated Password (${len} chars): <span class="secret">${window.imaginalOS.escapeHtml(pass)}</span><br>`;
        await writeTyped(out, 2);
    }

    function runDestruct() {
        window.playGlitchSound();
        window.imaginalOS.writeOutput("<span class='err'>[ FATAL ERROR ] RM -RF DIRECTIVE INITIATED...</span><br>");
        window.imaginalOS.writeOutput("<span class='err'>DELETING VIRTUAL FILESYSTEM... DONE</span><br>");
        window.imaginalOS.writeOutput("<span class='err'>CLEARING LOCALSTORAGE CACHE... DONE</span><br>");
        window.imaginalOS.writeOutput("<span class='err'>WIPING KERNEL MEMORY...</span><br>");
        
        localStorage.removeItem('imaginal_vfs');
        localStorage.removeItem('imaginal_vfs_version');
        document.body.classList.add('glitch-screen');
        
        setTimeout(() => {
            window.imaginalOS.writeOutput("<span class='err'>CRITICAL FAULT: KERNEL PANIC - REBOOT IN 3...</span><br>");
            setTimeout(() => {
                window.imaginalOS.writeOutput("<span class='err'>2...</span><br>");
                setTimeout(() => {
                    window.imaginalOS.writeOutput("<span class='err'>1...</span><br>");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1200);
    }

    function runHelp() {
        const commands = window.imaginalOS.HELP_COMMANDS;

        let html = "Available Commands:<br>";
        for (let cmd of commands) {
            html += `<div class="help-row"><span class="cmd">${cmd.name}</span><span class="help-desc">${cmd.desc}</span></div>`;
        }
        window.imaginalOS.writeOutput(html);
    }

    function runMan(arg = '') {
        if (!arg) {
            window.imaginalOS.writeOutput(`
<span class="cmd">imaginalOS Manual (imaginalOS)</span>
--------------------------------------------------
imaginalOS is a web-based portfolio simulation environment modeled after retro-futuristic unix terminals. 
It provides directory traversal, VFS writes, real-time environment overrides, and network telemetry analysis.

Use '<span class="cmd">man &lt;command&gt;</span>' to view manual entries for specific commands.
Available commands:
  bmo, cat, cd, clear, cookie, date, echo, exit, git,
  harvester, history, ip, ls, man, matrix, mkdir, mute,
  open, pass, policy, pwd, rm, secret, touch, uname,
  unmute, vim, weather, whoami
<br>`);
            return;
        }

        const cmdKey = arg.toLowerCase();
        const page = MAN_PAGES[cmdKey];

        if (!page) {
            window.imaginalOS.writeOutput(`<span class="err">No manual entry for: ${window.imaginalOS.escapeHtml(arg)}</span><br>`);
            return;
        }

        window.imaginalOS.writeOutput(`
<span class="cmd">MANUAL PAGE: ${window.imaginalOS.escapeHtml(arg.toUpperCase())}</span>
--------------------------------------------------
<b>Description:</b>  ${page.desc}
<b>Linux Behavior:</b>  ${page.linux}
<b>imaginalOS Behavior:</b>  ${page.project}
<br>`);
    }

    function animateEchoBanner(message) {
        if (!message) {
            window.imaginalOS.writeOutput('<br>');
            return;
        }
        window.imaginalOS.shellState = 'animating';
        window.imaginalOS.terminalInput.blur();

        const animContainer = document.createElement('pre');
        animContainer.className = 'echo-banner-anim';
        window.imaginalOS.terminalOutput.appendChild(animContainer);
        window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;

        const messageClean = message.substring(0, 45);
        const frameWidth = 45;
        let offset = frameWidth;

        const animInterval = setInterval(() => {
            if (offset <= 0) {
                clearInterval(animInterval);
                animContainer.innerHTML = `<span class="err" style="font-weight: bold; text-shadow: 0 0 10px #ff3838;">💥 *CRASH!!!* 💥</span>`;
                
                setTimeout(() => {
                    animContainer.remove();
                    window.imaginalOS.shellState = 'normal';
                    window.imaginalOS.writeOutput(window.imaginalOS.escapeHtml(message) + '<br>');
                    window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
                    window.imaginalOS.terminalInput.focus();
                }, 600);
                return;
            }

            const pad = " ".repeat(offset);
            animContainer.textContent = pad + "🛩️ ═══[ " + messageClean + " ]";
            offset--;
            window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
        }, 35);
    }

    // MATRIX DIGITAL RAIN SAVER
    let matrixInterval = null;
    let matrixCanvas = null;
    let mCtx = null;
    let isMatrixActive = false;

    function startMatrix() {
        isMatrixActive = true;
        window.imaginalOS.terminalInput.blur();
        
        matrixCanvas = document.createElement('canvas');
        matrixCanvas.className = 'matrix-overlay';
        matrixCanvas.width = window.imaginalOS.terminalContainer.querySelector('.terminal-body').clientWidth;
        matrixCanvas.height = window.imaginalOS.terminalContainer.querySelector('.terminal-body').clientHeight;
        
        window.imaginalOS.terminalContainer.querySelector('.terminal-body').appendChild(matrixCanvas);
        mCtx = matrixCanvas.getContext('2d');
        
        const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const alphabet = katakana.split("");
        
        const fontSize = 14;
        const columns = matrixCanvas.width / fontSize;
        const rainDrops = [];
        
        for (let x = 0; x < columns; x++) {
            rainDrops[x] = 1;
        }
        
        function draw() {
            mCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            
            mCtx.fillStyle = '#0f0';
            mCtx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet[Math.floor(Math.random() * alphabet.length)];
                mCtx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
                
                if (rainDrops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        }
        
        matrixInterval = setInterval(draw, 30);
        
        const stopTrigger = () => {
            stopMatrix();
            window.imaginalOS.terminalInput.focus();
        };
        
        matrixCanvas.addEventListener('click', stopTrigger);
        setTimeout(() => {
            if (isMatrixActive) {
                document.addEventListener('keydown', stopTrigger, { once: true });
            }
        }, 50);
    }
    
    function stopMatrix() {
        if (!isMatrixActive) return;
        isMatrixActive = false;
        clearInterval(matrixInterval);
        
        if (matrixCanvas && matrixCanvas.parentNode) {
            matrixCanvas.parentNode.removeChild(matrixCanvas);
        }
        
        window.imaginalOS.writeOutput("Matrix animation stopped.<br>");
        window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
    }

    // Help Helper Crypto Logic
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    function xorCipher(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const textChar = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            const ciphered = textChar ^ keyChar;
            result += ciphered.toString(16).padStart(2, '0');
        }
        return result.toUpperCase();
    }

    function xorDecipher(hex, key) {
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            const hexByte = parseInt(hex.substring(i, i + 2), 16);
            const keyChar = key.charCodeAt((i / 2) % key.length);
            const deciphered = hexByte ^ keyChar;
            result += String.fromCharCode(deciphered);
        }
        return result;
    }
    async function runCookies() {
        await writeTyped(window.imaginalOS.COOKIE_POLICY_TEXT, 3);
    }

    function runPolicy() {
        const laws = window.imaginalOS.GALACTIC_POLICIES;
        
        let out = `⚖️ <span class="secret">[GALACTIC TOS & POLICIES]</span><br>`;
        out += `<span style="color: #50fa7b;">--------------------------------------------------</span><br>`;
        for (let i = 0; i < laws.length; i++) {
            out += `<span class="neokey">[Rule ${i + 1}]</span> ${laws[i]}<br>`;
        }
        window.imaginalOS.writeOutput(out + `<br>`);
    }

    let activeTypingInterrupt = null;

    function typeHtml(element, html, speed = 8, callback) {
        if (activeTypingInterrupt) {
            activeTypingInterrupt();
        }

        element.innerHTML = html;
        
        const textNodes = [];
        function collectTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push({
                    node: node,
                    originalText: node.nodeValue
                });
                node.nodeValue = '';
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    collectTextNodes(node.childNodes[i]);
                }
            }
        }
        collectTextNodes(element);
        
        let nodeIndex = 0;
        let charIndex = 0;
        let skip = false;
        
        const handleInterrupt = () => {
            skip = true;
        };
        
        let listenersRegistered = false;
        const registerTimeout = setTimeout(() => {
            window.addEventListener('keydown', handleInterrupt);
            window.addEventListener('click', handleInterrupt);
            listenersRegistered = true;
        }, 100);
        
        function cleanup() {
            clearTimeout(registerTimeout);
            if (listenersRegistered) {
                window.removeEventListener('keydown', handleInterrupt);
                window.removeEventListener('click', handleInterrupt);
            }
            activeTypingInterrupt = null;
        }

        activeTypingInterrupt = cleanup;
        
        function step() {
            if (skip) {
                for (let i = nodeIndex; i < textNodes.length; i++) {
                    const nodeInfo = textNodes[i];
                    nodeInfo.node.nodeValue = nodeInfo.originalText;
                }
                cleanup();
                if (callback) callback();
                return;
            }

            if (nodeIndex >= textNodes.length) {
                cleanup();
                if (callback) callback();
                return;
            }
            
            const current = textNodes[nodeIndex];
            if (charIndex < current.originalText.length) {
                current.node.nodeValue += current.originalText[charIndex];
                charIndex++;
                
                if (Math.random() < 0.25 && window.playKeySound) {
                    window.playKeySound();
                }
                
                if (window.imaginalOS.terminalOutput) {
                    window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
                }
                
                setTimeout(step, speed);
            } else {
                nodeIndex++;
                charIndex = 0;
                step();
            }
        }
        
        step();
    }

    function writeTyped(html, speed = 4) {
        return new Promise((resolve) => {
            const termInput = document.querySelector('.terminal-hidden-input');
            if (termInput) termInput.disabled = true;

            const textContainer = document.createElement('span');
            const processedHtml = window.imaginalOS.wrapEmoji ? window.imaginalOS.wrapEmoji(html) : html;
            
            if (window.imaginalOS.terminalOutput) {
                window.imaginalOS.terminalOutput.appendChild(textContainer);
            }

            typeHtml(textContainer, processedHtml, speed, () => {
                if (termInput) {
                    termInput.disabled = false;
                    termInput.focus();
                }
                if (window.imaginalOS.syncInputBuffer) window.imaginalOS.syncInputBuffer();
                resolve();
            });
        });
    }

    function runIp() {
        const td = window.telemetryData;
        const uniqueId = 'ip-scanner-' + Date.now();
        
        window.imaginalOS.writeOutput(`<div id="${uniqueId}" style="margin: 3px 0;">🌐 <span class="secret">[IP SCANNER]</span><br><span class="status-msg">Let me check BMO's orbital spy sensors<span class="loading-dots"></span></span></div>`);
        
        if (window.imaginalOS.terminalOutput) {
            window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
        }
        
        const termInput = document.querySelector('.terminal-hidden-input');
        if (termInput) termInput.disabled = true;
        
        setTimeout(() => {
            const el = document.getElementById(uniqueId);
            if (!el) {
                if (termInput) termInput.disabled = false;
                return;
            }
            
            const statusMsg = el.querySelector('.status-msg');
            if (statusMsg) statusMsg.remove();
            
            let htmlContent = '';
            
            if (!td || !td.ip || td.ip === 'IP Obfuscated') {
                htmlContent = `Hmm... BMO's signals are bouncing off a cosmic reflector.<br>Your IP seems to be hidden under a nebula shield (Obfuscated).<br>Did a space mouse chew through your fiber optic cable?<br>`;
            } else {
                htmlContent = `Ah! It seems your IP address is <span class="file">${window.imaginalOS.escapeHtml(td.ip)}</span>, correct?<br><br>` +
                              `<b>🧠 BMO's Telepathic Speculations:</b><br>` +
                              `• <b>Physical Grid:</b>     ${window.imaginalOS.escapeHtml(td.city)}, ${window.imaginalOS.escapeHtml(td.country)}<br>` +
                              `• <b>Signal Provider:</b>   <span class="cmd">${window.imaginalOS.escapeHtml(td.isp)}</span><br>` +
                              `• <b>Orbital Lock:</b>      Lat ${td.lat}, Lon ${td.lon}`;
                
                if (td.lat && td.lon) {
                    const R = 6371; 
                    const lat1 = 59.9386 * Math.PI / 180;
                    const lat2 = td.lat * Math.PI / 180;
                    const dlat = (td.lat - 59.9386) * Math.PI / 180;
                    const dlon = (td.lon - 30.3141) * Math.PI / 180;
                    
                    const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
                              Math.cos(lat1) * Math.cos(lat2) *
                              Math.sin(dlon/2) * Math.sin(dlon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const dist = Math.round(R * c);
                    
                    if (dist < 10) {
                        htmlContent += `<br>• <b>BMO Distance Check:</b> You are extremely close. BMO can almost smell your coffee.`;
                    } else {
                        htmlContent += `<br>• <b>BMO Distance Check:</b> BMO's server is roughly ${dist} km away from your chair.`;
                    }
                }
                
                const specs = [
                    "Your screen brightness is currently illuminating your face nicely.",
                    "Our sensors detect high likelihood of snacks near your keyboard.",
                    "Your chair ergonomics could be improved. Sit straight, human!",
                    "Did you know? A server packet from your node took roughly 45ms to wave hello to BMO.",
                    "BMO's database is keeping an eye on you. (In a friendly, cute way).",
                    "Warning: BMO suspects you haven't blinked in the last 4 minutes."
                ];
                const randomSpec = specs[Math.floor(Math.random() * specs.length)];
                htmlContent += `<br>• <b>Visual Sensors:</b>    <span class="secret" style="color: #ff79c6;">${randomSpec}</span><br>`;
            }
            
            const textContainer = document.createElement('div');
            el.appendChild(textContainer);
            
            typeHtml(textContainer, htmlContent, 8, () => {
                if (termInput) {
                    termInput.disabled = false;
                    termInput.focus();
                }
                if (window.imaginalOS.syncInputBuffer) window.imaginalOS.syncInputBuffer();
            });
            
        }, 1800);
    }

    async function runPwd() {
        const path = '/' + window.imaginalOS.currentPath.join('/');
        let comment = '';
        
        if (path === '/home/bmo') {
            comment = `🏠 You are in BMO's home base. Mind the virtual dust.`;
        } else if (path === '/home/bmo/projects') {
            comment = `📁 Surrounded by source code, raw ideas, and digital duct tape.`;
        } else if (path === '/home/bmo/secrets') {
            comment = `🤫 Secure folder. Speak quietly so the background stars don't overhear you.`;
        } else if (path === '/home/bmo/feedback') {
            comment = `💬 A room filled with reviews and letters. Watch your step!`;
        } else {
            comment = `🗺️ A custom pocket dimension created by you. Pretty cozy!`;
        }
        
        const out = `Current location: <span class="file">${window.imaginalOS.escapeHtml(path)}</span><br>` +
                    `<span style="color: #64ffda; font-weight: bold;">BMO status:</span> ${comment}<br>`;
        await writeTyped(out, 2);
    }

    async function runUname(arg = '') {
        const flag = arg ? arg.toLowerCase() : '';
        const version = (window.imaginalOS.VERSION || '0.9.1') + '-potato';
        let out = '';
        if (flag === '-a' || flag === '--all') {
            out = `ImaginalOS ${version} #1 SMP Sat Dec 24 12:34:34 UTC 2022 x86_64 GNU/Bimux (BMO-Core-v4.2, Battery Power: 100%, Crumbs: 2%)<br>`;
        } else if (flag === '-r' || flag === '--release') {
            out = `${version}-cookie-edition<br>`;
        } else if (flag === '-m' || flag === '--machine') {
            out = 'bmo-hardware-rev-4 (8-bit-potato)<br>';
        } else if (flag === '-o' || flag === '--operating-system') {
            out = 'Bimux/GNU (BMO\'s dream space)<br>';
        } else if (flag === '-s' || flag === '--sysname') {
            out = 'ImaginalOS<br>';
        } else if (flag === '--help' || flag === '-h') {
            out = `Usage: uname [OPTION]...<br>Print system information.<br><br>Options:<br>  -a, --all               print all info<br>  -s, --sysname           print kernel/OS name<br>  -r, --release           print kernel release<br>  -m, --machine           print machine hardware name<br>  -o, --operating-system  print operating system<br>`;
        } else if (flag) {
            out = `<span class="err">uname: extra operand '${window.imaginalOS.escapeHtml(arg)}'</span><br>Try 'uname --help' for more information.<br>`;
        } else {
            out = `ImaginalOS ${version} #1 SMP Sat Dec 24 12:34:34 UTC 2022 x86_64 GNU/Bimux (BMO-Core-v4.2, Battery Power: 100%, Crumbs: 2%)<br>`;
        }
        await writeTyped(out, 4);
    }

    async function runTime() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const interval = Math.floor(minute / 10);
        
        let phrase = "BMO is too busy eating chocolate chip cookies to check the time.";
        if (window.imaginalOS.TIME_PHRASES && window.imaginalOS.TIME_PHRASES[hour]) {
            phrase = window.imaginalOS.TIME_PHRASES[hour][interval] || phrase;
        }
        
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        await writeTyped(`🕰️ <b>[Local Time: ${timeStr}]</b><br><span style="color: #64ffda; font-weight: bold;">BMO says:</span> "${phrase}"<br>`, 2);
    }

    async function runTips() {
        const tips = window.imaginalOS.TIPS_LIST;
        if (!tips || tips.length === 0) {
            window.imaginalOS.writeOutput("<span class='err'>No tips found in database.</span><br>");
            return;
        }
        const randomIndex = Math.floor(Math.random() * tips.length);
        const tip = tips[randomIndex];
        
        let out = `💡 <span class="secret">[HARMFUL ADVICE #${randomIndex + 1}: ${window.imaginalOS.escapeHtml(tip.title)}]</span><br>`;
        out += `<span style="color: #50fa7b;">--------------------------------------------------</span><br>`;
        tip.steps.forEach((step, idx) => {
            out += `${idx + 1}. ${window.imaginalOS.escapeHtml(step)}<br>`;
        });
        out += `<br><b>Result:</b> <span class="neokey">${window.imaginalOS.escapeHtml(tip.result)}</span><br>`;
        await writeTyped(out, 2);
    }

    function ansiToHtml(text) {
        let escaped = window.imaginalOS.escapeHtml(text);
        escaped = escaped.replaceAll('\x1b[36m', '<span style="color: #8be9fd;">');
        escaped = escaped.replaceAll('\x1b[32m', '<span style="color: #50fa7b;">');
        escaped = escaped.replaceAll('\x1b[33m', '<span style="color: #f1fa8c;">');
        escaped = escaped.replaceAll('\x1b[1m', '<b>');
        escaped = escaped.replaceAll('\x1b[0m', '</span></b>');
        return escaped;
    }

    async function runCurl(args = []) {
        if (args.length === 0) {
            window.imaginalOS.writeOutput(`curl: try 'curl --help' for more information<br>`);
            return;
        }

        let isHead = false;
        let isVerbose = false;
        let url = '';
        let headers = [];

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '-I' || arg === '--head') {
                isHead = true;
            } else if (arg === '-v' || arg === '--verbose') {
                isVerbose = true;
            } else if (arg === '-H' || arg === '--header') {
                if (i + 1 < args.length) {
                    headers.push(args[i + 1]);
                    i++;
                }
            } else if (arg === '-h' || arg === '--help') {
                window.imaginalOS.writeOutput(window.imaginalOS.CURL_HELP);
                return;
            } else if (!arg.startsWith('-')) {
                url = arg;
            }
        }

        if (!url) {
            window.imaginalOS.writeOutput(`<span class="err">curl: no URL specified!</span><br>`);
            return;
        }

        let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
        let targetPath = '';
        let isLocal = false;

        const isLocalHost = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');
        const isImaginal = cleanUrl.includes('imaginal.dev') || cleanUrl.startsWith('/') || isLocalHost;

        if (isImaginal || cleanUrl === '') {
            isLocal = true;
            let pathMatch = url.match(/^(https?:\/\/[^/]+)?(\/.*)?$/);
            targetPath = (pathMatch && pathMatch[2]) ? pathMatch[2] : '/';
        }

        if (isVerbose) {
            window.imaginalOS.writeOutput(`*   Trying ${isLocal ? '127.0.0.1' : 'external'}...<br>`);
            window.imaginalOS.writeOutput(`* Connected to ${window.imaginalOS.escapeHtml(url.split('/')[0])} port 443<br>`);
            window.imaginalOS.writeOutput(`* SSL connection using TLSv1.3<br>`);
            window.imaginalOS.writeOutput(`&gt; GET ${window.imaginalOS.escapeHtml(targetPath || url)} HTTP/2<br>`);
            window.imaginalOS.writeOutput(`&gt; User-Agent: curl/8.5.0<br>`);
            headers.forEach(h => {
                window.imaginalOS.writeOutput(`&gt; ${window.imaginalOS.escapeHtml(h)}<br>`);
            });
            window.imaginalOS.writeOutput(`&gt; <br>`);
        }

        try {
            if (isLocal) {
                const fetchHeaders = {
                    'X-Imaginal-Curl': 'true'
                };
                headers.forEach(h => {
                    const parts = h.split(':');
                    if (parts.length >= 2) {
                        fetchHeaders[parts[0].trim()] = parts.slice(1).join(':').trim();
                    }
                });

                const response = await fetch(targetPath, {
                    method: isHead ? 'HEAD' : 'GET',
                    headers: fetchHeaders
                });

                const dateStr = new Date().toUTCString();
                const defaultHeaders = [
                    `date: ${dateStr}`,
                    `content-type: ${response.headers.get('content-type') || 'text/plain; charset=utf-8'}`,
                    `x-developer: BMO`,
                    `x-bmo-system: imaginalOS-v${window.imaginalOS.VERSION || '0.9.1'}`,
                    `x-clacks-overhead: GNU Terry Pratchett`,
                    `server: cloudflare`
                ];

                if (isHead) {
                    let headerOutput = `HTTP/2 ${response.status}<br>`;
                    defaultHeaders.forEach(h => {
                        headerOutput += (isVerbose ? `&lt; ` : '') + window.imaginalOS.escapeHtml(h) + '<br>';
                    });
                    window.imaginalOS.writeOutput(headerOutput);
                    return;
                }

                if (isVerbose) {
                    window.imaginalOS.writeOutput(`&lt; HTTP/2 ${response.status}<br>`);
                    defaultHeaders.forEach(h => {
                        window.imaginalOS.writeOutput(`&lt; ${window.imaginalOS.escapeHtml(h)}<br>`);
                    });
                }

                const text = await response.text();

                let curlResponses = { coffee: "", tea: "", homepage: "" };
                try {
                    const curlRes = await fetch('/static/js/curl_responses.json');
                    if (curlRes.ok) {
                        curlResponses = await curlRes.json();
                    }
                } catch {}

                // Local fallback for /coffee, /teapot, /tea when functions/_middleware.js is not active locally
                if (response.status === 404) {
                    if (targetPath.includes('coffee') || targetPath.includes('teapot')) {
                        window.imaginalOS.writeOutput(`<pre style="font-family: monospace; line-height: 1.4;">${window.imaginalOS.escapeHtml(curlResponses.coffee)}</pre>`);
                        return;
                    }
                    if (targetPath.includes('tea')) {
                        window.imaginalOS.writeOutput(`<pre style="font-family: monospace; line-height: 1.4;">${window.imaginalOS.escapeHtml(curlResponses.tea)}</pre>`);
                        return;
                    }
                }

                if (text.trim().startsWith('<!DOCTYPE html>') && (targetPath === '/' || targetPath === '')) {
                    const version = window.imaginalOS.VERSION || '0.9.1';
                    const localAnsi = curlResponses.homepage.replace(/\${version}/g, version);
                    await writeTyped(`<pre style="font-family: monospace; line-height: 1.2;">${ansiToHtml(localAnsi)}</pre>`, 2);
                } else {
                    await writeTyped(`<pre style="font-family: monospace; line-height: 1.2;">${ansiToHtml(text)}</pre>`, 2);
                }
            } else {
                if (cleanUrl.includes('wttr.in')) {
                    if (isHead) {
                        window.imaginalOS.writeOutput(`HTTP/2 200<br>content-type: text/html; charset=utf-8<br>server: wttr.in<br>`);
                        return;
                    }
                    if (isVerbose) {
                        window.imaginalOS.writeOutput(`&lt; HTTP/2 200<br>&lt; content-type: text/html; charset=utf-8<br>`);
                    }
                    runWeather();
                } else {
                    window.imaginalOS.writeOutput(`<span class="err">curl: CORS restriction prevents fetching external URL ${window.imaginalOS.escapeHtml(url)} directly.</span><br>`);
                }
            }
        } catch {
            window.imaginalOS.writeOutput(`<span class="err">curl: Connection failed</span><br>`);
        }
    }

    // Expose on namespace
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.HINTS = HINTS;
    window.imaginalOS.runLs = runLs;
    window.imaginalOS.runCd = runCd;
    window.imaginalOS.runCurl = runCurl;
    window.imaginalOS.runCat = runCat;
    window.imaginalOS.runPwd = runPwd;
    window.imaginalOS.runUname = runUname;
    window.imaginalOS.runMkdir = runMkdir;
    window.imaginalOS.runTouch = runTouch;
    window.imaginalOS.runRm = runRm;
    window.imaginalOS.runHistory = runHistory;
    window.imaginalOS.runOpen = runOpen;
    window.imaginalOS.runIp = runIp;
    window.imaginalOS.runWhoami = runWhoami;
    window.imaginalOS.writeTyped = writeTyped;
    window.imaginalOS.runNeofetch = runNeofetch;
    window.imaginalOS.runHarvester = runHarvester;
    window.imaginalOS.runWeather = runWeather;
    window.imaginalOS.runBmoEasterEgg = runBmoEasterEgg;
    window.imaginalOS.runSecretCheck = runSecretCheck;
    window.imaginalOS.runPass = runPass;
    window.imaginalOS.runHelp = runHelp;
    window.imaginalOS.runMan = runMan;
    window.imaginalOS.runCookies = runCookies;
    window.imaginalOS.runPolicy = runPolicy;
    window.imaginalOS.runTime = runTime;
    window.imaginalOS.runTips = runTips;
    window.imaginalOS.animateEchoBanner = animateEchoBanner;
    window.imaginalOS.startMatrix = startMatrix;
    window.imaginalOS.stopMatrix = stopMatrix;
    window.imaginalOS.runDestruct = runDestruct;
    window.imaginalOS.isMatrixActive = () => isMatrixActive;
    window.imaginalOS.xorCipher = xorCipher;
    window.imaginalOS.xorDecipher = xorDecipher;
})();
