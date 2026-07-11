/**
 * imaginalOS - Spacerock Retro Arcade Game Module
 */
(function() {
    let canvas = null;
    let ctx = null;
    let gameEl = null;
    let gameActive = false;
    let gameState = 'MENU'; // MENU, COUNTDOWN, PLAYING, GAMEOVER, PAUSED
    let score = 0;
    let highScore = 0;
    let lives = 3;
    let level = 1;
    let keys = {};
    let ship = null;
    let asteroids = [];
    let lasers = [];
    let particles = [];
    let animationFrameId = null;
    let isTransitioningLevel = false;
    let levelTransitionTimer = 0;
    let countdownTimer = 0;

    // Helper to play beeps using the synth engine from sound.js
    function playBeep(freq, duration, type) {
        if (window.playBeepSound) {
            window.playBeepSound(freq, duration, type);
        }
    }

    function launchSpaceRock() {
        window.imaginalOS.shellState = 'spacerock';
        
        // Hide terminal output, input, and hint bar
        window.imaginalOS.terminalOutput.style.display = 'none';
        window.imaginalOS.terminalInput.parentNode.style.display = 'none';
        if (window.imaginalOS.terminalHintBar) {
            window.imaginalOS.terminalHintBar.style.display = 'none';
        }

        // Create the container
        gameEl = document.createElement('div');
        gameEl.className = 'spacerock-game';
        gameEl.innerHTML = `
            <div class="spacerock-content" style="position: relative; display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center; justify-content: center; background: #050811; border-bottom-left-radius: 7px; border-bottom-right-radius: 7px; overflow: hidden;">
                <canvas id="spacerockCanvas" class="spacerock-canvas" style="display: block; box-sizing: border-box; border: 1.5px solid rgba(0, 255, 128, 0.25); border-radius: 4px; box-shadow: 0 0 15px rgba(0, 255, 128, 0.15);"></canvas>
            </div>
        `;
        window.imaginalOS.terminalContainer.querySelector('.terminal-body').appendChild(gameEl);

        canvas = document.getElementById('spacerockCanvas');
        const parent = canvas.parentElement;
        
        // Fit canvas to terminal size nicely
        const width = Math.min(800, parent.clientWidth - 20);
        const height = Math.min(450, parent.clientHeight - 20);
        canvas.width = width;
        canvas.height = height;

        ctx = canvas.getContext('2d');
        gameActive = true;
        gameState = 'MENU';
        score = 0;
        lives = 3;
        level = 1;
        asteroids = [];
        lasers = [];
        particles = [];
        isTransitioningLevel = false;
        keys = {};

        highScore = parseInt(localStorage.getItem('imaginalOS_spacerock_highscore')) || 0;

        resetShip();
        bindEvents();

        // Play a nice initialization coin-up sound!
        playBeep(440, 0.08, 'sine');
        setTimeout(() => playBeep(880, 0.12, 'sine'), 80);

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        tick();
    }

    function resetShip() {
        ship = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: 0,
            vy: 0,
            angle: -Math.PI / 2, // facing straight up
            radius: 13,
            rotation: 0,
            thrusting: false,
            invulnerableTime: 120, // 2 seconds invuln
            shootCooldown: 0
        };
    }

    function spawnAsteroids(count) {
        asteroids = [];
        for (let i = 0; i < count; i++) {
            let x, y;
            // Spawning away from the center ship
            do {
                x = Math.random() * canvas.width;
                y = Math.random() * canvas.height;
            } while (distBetweenPoints(x, y, canvas.width / 2, canvas.height / 2) < 100);

            asteroids.push(createAsteroid(x, y, 40)); // Large
        }
    }

    function createAsteroid(x, y, radius) {
        const speed = radius === 40 ? 0.6 + Math.random() * 0.45 :
                      radius === 20 ? 1.1 + Math.random() * 0.6 :
                                      1.6 + Math.random() * 0.8;
        const angle = Math.random() * Math.PI * 2;
        const points = [];
        const segments = 8 + Math.floor(Math.random() * 5); // 8 to 12 vertices

        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            const dist = radius * (0.85 + Math.random() * 0.3);
            points.push({
                x: Math.cos(a) * dist,
                y: Math.sin(a) * dist
            });
        }

        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: radius,
            points: points,
            scoreValue: radius === 40 ? 20 : radius === 20 ? 50 : 100
        };
    }

    function distBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function handleKeyDown(e) {
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'p', 'q', 'Escape', 'Enter'];
        if (gameKeys.includes(e.key) || gameKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
        }

        const key = e.key.toLowerCase();
        keys[e.key] = true;
        keys[key] = true;

        if (gameState === 'MENU') {
            if (e.key === 'Enter') {
                gameState = 'COUNTDOWN';
                countdownTimer = 180; // 3 seconds at 60fps
                score = 0;
                lives = 3;
                level = 1;
                resetShip();
                spawnAsteroids(4);
                playBeep(370, 0.1, 'sine');
            } else if (key === 'q' || e.key === 'Escape') {
                exitGame();
            }
        } else if (gameState === 'COUNTDOWN') {
            if (key === 'q' || e.key === 'Escape') {
                exitGame();
            }
        } else if (gameState === 'PLAYING') {
            if (key === 'p') {
                gameState = 'PAUSED';
                playBeep(440, 0.12, 'sine');
            } else if (key === 'q' || e.key === 'Escape') {
                exitGame();
            }
        } else if (gameState === 'PAUSED') {
            if (key === 'p' || e.key === 'Enter') {
                gameState = 'PLAYING';
                playBeep(587.33, 0.12, 'sine');
            } else if (key === 'q' || e.key === 'Escape') {
                exitGame();
            }
        } else if (gameState === 'GAMEOVER') {
            if (e.key === 'Enter') {
                gameState = 'COUNTDOWN';
                countdownTimer = 180;
                score = 0;
                lives = 3;
                level = 1;
                resetShip();
                spawnAsteroids(4);
                playBeep(370, 0.1, 'sine');
            } else if (key === 'q' || e.key === 'Escape') {
                exitGame();
            }
        }
    }

    function handleKeyUp(e) {
        keys[e.key] = false;
        keys[e.key.toLowerCase()] = false;
    }

    function bindEvents() {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }

    function unbindEvents() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }

    function exitGame() {
        gameActive = false;
        unbindEvents();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (gameEl) {
            gameEl.remove();
            gameEl = null;
        }

        window.imaginalOS.shellState = 'normal';

        // Re-enable console displays
        window.imaginalOS.terminalOutput.style.display = 'block';
        window.imaginalOS.terminalInput.parentNode.style.display = 'flex';
        if (window.imaginalOS.terminalHintBar) {
            window.imaginalOS.terminalHintBar.style.display = 'block';
        }

        window.imaginalOS.writeOutput(`🤖 <b>[Arcade Mode Terminated]</b><br>Final Score: <span class="neokey">${score}</span> | High Score: <span class="file">${highScore}</span><br>`);
        
        window.imaginalOS.terminalInput.focus();
        window.imaginalOS.terminalOutput.scrollTop = window.imaginalOS.terminalOutput.scrollHeight;
    }

    function tick() {
        if (!gameActive) return;

        // Auto-cleanup check
        if (!gameEl || !document.body.contains(gameEl)) {
            exitGame();
            return;
        }

        update();
        draw();

        animationFrameId = requestAnimationFrame(tick);
    }

    function update() {
        if (gameState === 'COUNTDOWN') {
            // Let asteroids drift in background
            for (let i = 0; i < asteroids.length; i++) {
                const a = asteroids[i];
                a.x += a.vx;
                a.y += a.vy;

                if (a.x < -a.radius) a.x = canvas.width + a.radius;
                if (a.x > canvas.width + a.radius) a.x = -a.radius;
                if (a.y < -a.radius) a.y = canvas.height + a.radius;
                if (a.y > canvas.height + a.radius) a.y = -a.radius;
            }
            updateParticles();

            // Countdown audio triggers
            const currentSec = Math.ceil(countdownTimer / 60);
            countdownTimer--;
            const nextSec = Math.ceil(countdownTimer / 60);

            if (currentSec !== nextSec) {
                if (nextSec > 0) {
                    playBeep(370, 0.1, 'sine');
                } else {
                    playBeep(587.33, 0.22, 'sine');
                }
            }

            if (countdownTimer <= 0) {
                gameState = 'PLAYING';
            }
            return;
        }

        if (gameState !== 'PLAYING') {
            updateParticles();
            return;
        }

        // 1. Rotate ship
        let rotDir = 0;
        if (keys['ArrowLeft'] || keys['a']) rotDir -= 1;
        if (keys['ArrowRight'] || keys['d']) rotDir += 1;
        ship.angle += rotDir * 0.055;

        // 2. Thrust ship
        ship.thrusting = keys['ArrowUp'] || keys['w'];
        if (ship.thrusting) {
            ship.vx += Math.cos(ship.angle) * 0.125;
            ship.vy += Math.sin(ship.angle) * 0.125;

            // Engine particles spawning from both engines
            const R = ship.radius;
            const cos = Math.cos(ship.angle);
            const sin = Math.sin(ship.angle);
            
            if (Math.random() < 0.6) {
                const tailAngle = ship.angle + Math.PI + (Math.random() * 0.35 - 0.175);
                const exhaustSpeed = 1.0 + Math.random() * 1.5;
                
                // Left engine nozzle
                const lx = ship.x - R * 0.85 * cos + R * 0.08 * sin;
                const ly = ship.y - R * 0.85 * sin - R * 0.08 * cos;
                particles.push({
                    x: lx,
                    y: ly,
                    vx: Math.cos(tailAngle) * exhaustSpeed + ship.vx,
                    vy: Math.sin(tailAngle) * exhaustSpeed + ship.vy,
                    color: '#ff79c6',
                    alpha: 0.9,
                    decay: 0.045 + Math.random() * 0.045,
                    size: 1 + Math.random() * 1.8
                });

                // Right engine nozzle
                const rx = ship.x - R * 0.85 * cos - R * 0.08 * sin;
                const ry = ship.y - R * 0.85 * sin + R * 0.08 * cos;
                particles.push({
                    x: rx,
                    y: ry,
                    vx: Math.cos(tailAngle) * exhaustSpeed + ship.vx,
                    vy: Math.sin(tailAngle) * exhaustSpeed + ship.vy,
                    color: '#ff79c6',
                    alpha: 0.9,
                    decay: 0.045 + Math.random() * 0.045,
                    size: 1 + Math.random() * 1.8
                });
            }
        }

        // Damping (Friction)
        ship.vx *= 0.985;
        ship.vy *= 0.985;

        // Speed cap
        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        const maxSpeed = 5.5;
        if (speed > maxSpeed) {
            ship.vx = (ship.vx / speed) * maxSpeed;
            ship.vy = (ship.vy / speed) * maxSpeed;
        }

        // Apply movement
        ship.x += ship.vx;
        ship.y += ship.vy;

        // Wrap edges
        if (ship.x < -ship.radius) ship.x = canvas.width + ship.radius;
        if (ship.x > canvas.width + ship.radius) ship.x = -ship.radius;
        if (ship.y < -ship.radius) ship.y = canvas.height + ship.radius;
        if (ship.y > canvas.height + ship.radius) ship.y = -ship.radius;

        // Invuln timer
        if (ship.invulnerableTime > 0) {
            ship.invulnerableTime--;
        }

        // 3. Fire Lasers
        if (ship.shootCooldown > 0) {
            ship.shootCooldown--;
        }

        if (keys[' '] && ship.shootCooldown === 0) {
            const R = ship.radius;
            const cos = Math.cos(ship.angle);
            const sin = Math.sin(ship.angle);
            const laserSpeed = 8.0;
            
            // Left wing gun tip
            const lx = ship.x + (R * 0.25) * cos - (-R * 0.75) * sin;
            const ly = ship.y + (R * 0.25) * sin + (-R * 0.75) * cos;
            
            // Right wing gun tip
            const rx = ship.x + (R * 0.25) * cos - (R * 0.75) * sin;
            const ry = ship.y + (R * 0.25) * sin + (R * 0.75) * cos;

            // Push left laser
            lasers.push({
                x: lx,
                y: ly,
                vx: cos * laserSpeed + ship.vx * 0.35,
                vy: sin * laserSpeed + ship.vy * 0.35,
                life: 48
            });

            // Push right laser
            lasers.push({
                x: rx,
                y: ry,
                vx: cos * laserSpeed + ship.vx * 0.35,
                vy: sin * laserSpeed + ship.vy * 0.35,
                life: 48
            });

            ship.shootCooldown = 14; // shoot cooldown

            // Dual shot retro beep effects
            playBeep(720, 0.03, 'sine');
            setTimeout(() => playBeep(720, 0.03, 'sine'), 40);
        }

        // 4. Update lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            l.x += l.vx;
            l.y += l.vy;
            l.life--;

            if (l.x < 0) l.x = canvas.width;
            if (l.x > canvas.width) l.x = 0;
            if (l.y < 0) l.y = canvas.height;
            if (l.y > canvas.height) l.y = 0;

            if (l.life <= 0) {
                lasers.splice(i, 1);
            }
        }

        // 5. Update asteroids
        for (let i = 0; i < asteroids.length; i++) {
            const a = asteroids[i];
            a.x += a.vx;
            a.y += a.vy;

            if (a.x < -a.radius) a.x = canvas.width + a.radius;
            if (a.x > canvas.width + a.radius) a.x = -a.radius;
            if (a.y < -a.radius) a.y = canvas.height + a.radius;
            if (a.y > canvas.height + a.radius) a.y = -a.radius;
        }

        // 6. Update particles
        updateParticles();

        // 7. Hit detection: Lasers vs Asteroids
        for (let lIdx = lasers.length - 1; lIdx >= 0; lIdx--) {
            const l = lasers[lIdx];
            for (let aIdx = asteroids.length - 1; aIdx >= 0; aIdx--) {
                const a = asteroids[aIdx];
                if (distBetweenPoints(l.x, l.y, a.x, a.y) < a.radius) {
                    lasers.splice(lIdx, 1);
                    splitAsteroid(aIdx);
                    break;
                }
            }
        }

        // 8. Hit detection: Ship vs Asteroids
        if (ship.invulnerableTime === 0) {
            for (let i = 0; i < asteroids.length; i++) {
                const a = asteroids[i];
                if (distBetweenPoints(ship.x, ship.y, a.x, a.y) < ship.radius + a.radius) {
                    shipCrash();
                    break;
                }
            }
        }

        // 9. Next wave check
        if (asteroids.length === 0 && !isTransitioningLevel) {
            isTransitioningLevel = true;
            levelTransitionTimer = 110;
        }

        if (isTransitioningLevel) {
            levelTransitionTimer--;
            if (levelTransitionTimer <= 0) {
                level++;
                isTransitioningLevel = false;
                spawnAsteroids(3 + level);
                resetShip();
                playBeep(480, 0.08, 'sine');
                setTimeout(() => playBeep(600, 0.08, 'sine'), 80);
                setTimeout(() => playBeep(720, 0.15, 'sine'), 160);
            }
        }
    }

    function splitAsteroid(idx) {
        const a = asteroids[idx];
        score += a.scoreValue;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('imaginalOS_spacerock_highscore', highScore);
        }

        // Sweep down explosion sound
        playBeep(180 - (a.radius * 2), 0.12, 'sawtooth');

        // Explode particles
        const count = a.radius === 40 ? 20 : a.radius === 20 ? 12 : 7;
        const color = a.radius === 40 ? '#bd93f9' : a.radius === 20 ? '#50fa7b' : '#ffb86c';
        
        for (let i = 0; i < count; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpeed = 0.6 + Math.random() * 2.2;
            particles.push({
                x: a.x,
                y: a.y,
                vx: Math.cos(pAngle) * pSpeed + a.vx * 0.35,
                vy: Math.sin(pAngle) * pSpeed + a.vy * 0.35,
                color: color,
                alpha: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                size: 1.2 + Math.random() * 1.8
            });
        }

        // Split
        if (a.radius > 10) {
            const nextRadius = a.radius === 40 ? 20 : 10;
            asteroids.push(createAsteroid(a.x, a.y, nextRadius));
            asteroids.push(createAsteroid(a.x, a.y, nextRadius));
        }

        asteroids.splice(idx, 1);
    }

    function shipCrash() {
        lives--;
        playBeep(100, 0.35, 'sawtooth');
        if (window.playGlitchSound) {
            window.playGlitchSound();
        }

        // Crash fire particles
        for (let i = 0; i < 35; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpeed = 1.2 + Math.random() * 3.5;
            particles.push({
                x: ship.x,
                y: ship.y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                color: '#ff5555',
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                size: 2.0 + Math.random() * 2.5
            });
        }

        if (lives > 0) {
            resetShip();
        } else {
            gameState = 'GAMEOVER';
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawVectorLogo(x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Stylized glowing retro asteroid (centered around x = 0, y = 0)
        ctx.strokeStyle = '#bd93f9';
        ctx.shadowColor = '#bd93f9';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-35, -15);
        ctx.lineTo(-15, -35);
        ctx.lineTo(20, -30);
        ctx.lineTo(40, -10);
        ctx.lineTo(30, 25);
        ctx.lineTo(0, 35);
        ctx.lineTo(-40, 15);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    function draw() {
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Retro tech grid lines
        ctx.strokeStyle = 'rgba(0, 255, 128, 0.025)';
        ctx.lineWidth = 1;
        const spacing = 45;
        for (let x = 0; x < canvas.width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (gameState === 'MENU') {
            drawMenu();
        } else {
            drawParticles();
            drawAsteroids();
            drawLasers();

            if (gameState !== 'GAMEOVER') {
                drawShip();
            }

            drawHUD();

            if (gameState === 'COUNTDOWN') {
                drawCountdown();
            } else if (gameState === 'PAUSED') {
                drawPaused();
            } else if (gameState === 'GAMEOVER') {
                drawGameOver();
            }

            if (isTransitioningLevel && gameState === 'PLAYING') {
                ctx.fillStyle = '#00ff80';
                ctx.font = '22px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`WAVE ${level} CLEAR`, canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = '13px monospace';
                ctx.fillStyle = '#a8b2d1';
                ctx.fillText('Summoning more asteroids...', canvas.width / 2, canvas.height / 2 + 10);
            }
        }
    }

    function drawShip() {
        if (ship.invulnerableTime > 0 && Math.floor(ship.invulnerableTime / 4) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);

        const R = ship.radius;

        // Draw Left Wing
        ctx.strokeStyle = '#64ffda';
        ctx.shadowColor = '#64ffda';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-R * 0.3, -R * 0.3);
        ctx.lineTo(-R * 0.5, -R * 0.95); // wing tip
        ctx.lineTo(-R * 0.8, -R * 0.95);
        ctx.lineTo(-R * 0.6, -R * 0.3);
        ctx.stroke();

        // Draw Right Wing
        ctx.beginPath();
        ctx.moveTo(-R * 0.3, R * 0.3);
        ctx.lineTo(-R * 0.5, R * 0.95); // wing tip
        ctx.lineTo(-R * 0.8, R * 0.95);
        ctx.lineTo(-R * 0.6, R * 0.3);
        ctx.stroke();

        // Draw Left Gun Barrel
        ctx.strokeStyle = '#00ff80';
        ctx.shadowColor = '#00ff80';
        ctx.beginPath();
        ctx.moveTo(-R * 0.6, -R * 0.75);
        ctx.lineTo(R * 0.25, -R * 0.75);
        ctx.stroke();

        // Draw Right Gun Barrel
        ctx.beginPath();
        ctx.moveTo(-R * 0.6, R * 0.75);
        ctx.lineTo(R * 0.25, R * 0.75);
        ctx.stroke();

        // Draw Main Body / Fuselage
        ctx.strokeStyle = '#64ffda';
        ctx.shadowColor = '#64ffda';
        ctx.beginPath();
        ctx.moveTo(R * 1.1, 0); // Nose tip
        ctx.lineTo(0, -R * 0.35); // Left fuselage
        ctx.lineTo(-R * 0.7, -R * 0.35); // Left back
        ctx.lineTo(-R * 0.85, -R * 0.15); // Left engine
        ctx.lineTo(-R * 0.85, R * 0.15); // Right engine
        ctx.lineTo(-R * 0.7, R * 0.35); // Right back
        ctx.lineTo(0, R * 0.35); // Right fuselage
        ctx.closePath();
        ctx.stroke();

        // Draw Canopy (Cockpit)
        ctx.strokeStyle = '#00ff80';
        ctx.shadowColor = '#00ff80';
        ctx.beginPath();
        ctx.moveTo(R * 0.45, 0);
        ctx.lineTo(-R * 0.15, -R * 0.18);
        ctx.lineTo(-R * 0.35, 0);
        ctx.lineTo(-R * 0.15, R * 0.18);
        ctx.closePath();
        ctx.stroke();

        // Engine flames
        if (ship.thrusting && Math.random() < 0.75) {
            ctx.strokeStyle = '#ff79c6';
            ctx.shadowColor = '#ff79c6';
            
            // Left nozzle flame
            ctx.beginPath();
            ctx.moveTo(-R * 0.85, -R * 0.12);
            ctx.lineTo(-R * 1.5 - Math.random() * 6, -R * 0.08);
            ctx.lineTo(-R * 0.85, -R * 0.04);
            ctx.stroke();

            // Right nozzle flame
            ctx.beginPath();
            ctx.moveTo(-R * 0.85, R * 0.04);
            ctx.lineTo(-R * 1.5 - Math.random() * 6, R * 0.08);
            ctx.lineTo(-R * 0.85, R * 0.12);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawAsteroids() {
        ctx.lineWidth = 1.6;
        for (let i = 0; i < asteroids.length; i++) {
            const a = asteroids[i];
            ctx.save();
            ctx.translate(a.x, a.y);

            const color = a.radius === 40 ? '#bd93f9' : a.radius === 20 ? '#50fa7b' : '#ffb86c';
            ctx.strokeStyle = color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;

            ctx.beginPath();
            ctx.moveTo(a.points[0].x, a.points[0].y);
            for (let j = 1; j < a.points.length; j++) {
                ctx.lineTo(a.points[j].x, a.points[j].y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    }

    function drawLasers() {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff80';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff80';

        for (let i = 0; i < lasers.length; i++) {
            const l = lasers[i];
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            const lSpeed = Math.sqrt(l.vx*l.vx + l.vy*l.vy);
            ctx.lineTo(l.x - (l.vx / lSpeed) * 7, l.y - (l.vy / lSpeed) * 7);
            ctx.stroke();
        }
    }

    function drawParticles() {
        ctx.save();
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }

    function drawHUD() {
        ctx.save();
        ctx.fillStyle = '#64ffda';
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`SCORE: ${score}`, 15, 15);
        ctx.fillText(`WAVE: ${level}`, 15, 33);

        ctx.textAlign = 'right';
        ctx.fillText(`HI-SCORE: ${highScore}`, canvas.width - 15, 15);

        let ships = '';
        for (let i = 0; i < lives; i++) {
            ships += '♥ ';
        }
        ctx.fillStyle = '#ff5555';
        ctx.fillText(`SHIPS: ${ships}`, canvas.width - 15, 33);
        ctx.restore();
    }

    function drawMenu() {
        ctx.save();
        
        // Draw the vector logo at the top
        drawVectorLogo(canvas.width / 2, canvas.height / 3 - 35, 1.0);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#64ffda';
        ctx.shadowColor = '#64ffda';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 32px monospace';
        ctx.fillText('SPACEROCK', canvas.width / 2, canvas.height / 3 + 45);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a8b2d1';
        ctx.font = '13px monospace';
        ctx.fillText('BMO Retro Arcade Terminal V0.9', canvas.width / 2, canvas.height / 3 + 80);

        ctx.fillStyle = '#bd93f9';
        ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, canvas.height / 2 + 25);

        ctx.fillStyle = '#00ff80';
        ctx.font = '15px monospace';
        ctx.fillText('Press [ENTER] to Launch Ship', canvas.width / 2, canvas.height / 2 + 75);

        ctx.fillStyle = '#8892b0';
        ctx.font = '11px monospace';
        ctx.fillText('Controls: W/ArrowUp = Thrust | A/D/Left/Right = Rotate | Space = Shoot', canvas.width / 2, canvas.height - 65);
        ctx.fillText('P = Pause Game | Q/ESC = Exit Arcade', canvas.width / 2, canvas.height - 45);
        ctx.restore();
    }

    function drawCountdown() {
        ctx.save();
        
        // Semi-transparent overlay to focus on the countdown
        ctx.fillStyle = 'rgba(5, 8, 17, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        
        // Render logo in background of countdown
        drawVectorLogo(canvas.width / 2, canvas.height / 3 - 35, 0.95);
        
        // Countdown text
        const secRemaining = Math.ceil(countdownTimer / 60);
        let displayText = '';
        let displayColor = '#00ff80';
        
        if (secRemaining === 3) {
            displayText = '3';
            displayColor = '#ff5555';
        } else if (secRemaining === 2) {
            displayText = '2';
            displayColor = '#ffb86c';
        } else if (secRemaining === 1) {
            displayText = '1';
            displayColor = '#f1fa8c';
        } else {
            displayText = 'LAUNCH!';
            displayColor = '#50fa7b';
        }

        ctx.fillStyle = displayColor;
        ctx.shadowColor = displayColor;
        ctx.shadowBlur = 15;
        ctx.font = 'bold 54px monospace';
        
        // Add a pulsing effect to the countdown number
        const pulse = 1.0 + 0.18 * Math.sin((countdownTimer % 60) / 60 * Math.PI);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 50);
        ctx.scale(pulse, pulse);
        ctx.fillText(displayText, 0, 0);
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a8b2d1';
        ctx.font = '13px monospace';
        ctx.fillText('Get ready to dodge rocks...', canvas.width / 2, canvas.height / 2 + 105);

        ctx.restore();
    }

    function drawPaused() {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 8, 17, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#64ffda';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('ARCADE PAUSED', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#a8b2d1';
        ctx.font = '13px monospace';
        ctx.fillText('Press [P] or [ENTER] to Resume', canvas.width / 2, canvas.height / 2 + 15);
        ctx.fillText('Press [Q] to Quit to Terminal', canvas.width / 2, canvas.height / 2 + 38);
        ctx.restore();
    }

    function drawGameOver() {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 8, 17, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff5555';
        ctx.shadowColor = '#ff5555';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 34px monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 3);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a8b2d1';
        ctx.font = '15px monospace';
        ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 - 10);

        if (score >= highScore && score > 0) {
            ctx.fillStyle = '#50fa7b';
            ctx.fillText('⭐ NEW HI-SCORE ESTABLISHED ⭐', canvas.width / 2, canvas.height / 2 + 15);
        } else {
            ctx.fillStyle = '#bd93f9';
            ctx.fillText(`Current Record: ${highScore}`, canvas.width / 2, canvas.height / 2 + 15);
        }

        ctx.fillStyle = '#00ff80';
        ctx.font = '15px monospace';
        ctx.fillText('Press [ENTER] to Play Again', canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillStyle = '#8892b0';
        ctx.font = '13px monospace';
        ctx.fillText('Press [Q] or [ESC] to Exit', canvas.width / 2, canvas.height / 2 + 85);
        ctx.restore();
    }

    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.runSpaceRock = launchSpaceRock;
})();
