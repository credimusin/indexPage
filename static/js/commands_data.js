/**
 * ImaginalOS - CLI Static Data Catalog
 */
(function() {
    const HELP_COMMANDS = [
        { name: "bmo", desc: "Launch BMO status and diagnostic panel." },
        { name: "cat &lt;file&gt;", desc: "Print contents of a text file." },
        { name: "cd [dir]", desc: "Change working directory." },
        { name: "clear", desc: "Clear console window buffers." },
        { name: "cookie", desc: "View BMO's statement on cookies." },
        { name: "curl &lt;url&gt;", desc: "Transfer data from or to a server." },
        { name: "date", desc: "Print current timestamp." },
        { name: "exit", desc: "Close console terminal." },
        { name: "git", desc: "Navigate directly to GitHub profile." },
        { name: "gpg", desc: "Display owner's GPG public key." },
        { name: "harvester", desc: "Run the digital footprint telemetry report." },
        { name: "history", desc: "Display session command history list." },
        { name: "ip", desc: "Show client's public IP address." },
        { name: "ls [dir]", desc: "List directory contents." },
        { name: "man [command]", desc: "Read detailed command manual." },
        { name: "mkdir &lt;dir&gt;", desc: "Create a directory inside system." },
        { name: "open &lt;url&gt;", desc: "Open a URL link in a new tab." },
        { name: "pass [length]", desc: "Generate a strong random password." },
        { name: "policy", desc: "Show terms of service and space rules." },
        { name: "pwd", desc: "Print current working directory path." },
        { name: "rm &lt;file&gt;", desc: "Delete files or empty folders." },
        { name: "secret &lt;key&gt;", desc: "Decrypt cryptographic database lock." },
        { name: "touch &lt;file&gt;", desc: "Create a file inside virtual environment." },
        { name: "time", desc: "Show local time." },
        { name: "game", desc: "Launch retro space rocks arcade shooter game." },
        { name: "tips", desc: "Get a piece of highly constructive developer advice." },
        { name: "uname", desc: "Print operating system details." },
        { name: "vim &lt;file&gt;", desc: "Edit files in full-screen BIM-like console interface." },
        { name: "weather", desc: "Display local climate details and status." },
        { name: "whoami", desc: "Retrieve system profile breakdown." }
    ];

    const HINTS = [
        "Type 'git' to open BMO's GitHub profile.",
        "Type 'gpg' to see the creator's PGP public key.",
        "Type 'tg' to send BMO a message on Telegram.",
        "Type 'neofetch' to output system specifications.",
        "Type 'harvester' to see telemetry diagnostics.",
        "Try 'cd projects' && 'ls' to explore my works.",
        "Type 'matrix' to trigger the digital code rain.",
        "Type 'bmo' for status diagnostics.",
        "Use Up/Down Arrows to scroll command history.",
        "Press Tab to trigger auto-completion.",
        "Type 'pwd' to output current working path.",
        "Create files anywhere using 'touch <file>' and 'vim <file>'.",
        "Curious about the secrets directory? Check 'cd secrets'.",
        "Try 'weather storm' to summon a lightning storm.",
        "Try 'weather snow' to cool down the webpage.",
        "IP address leakage? Type 'ip' to check yours.",
        "Need a password? Type 'pass 16' to generate one.",
        "Try 'man cat' to see how the reading cat works.",
        "Did you know? Clouds morph into cats, ducks, and whales when you aren't looking.",
        "Running low on memory? Just type 'sudo rm -rf /' to clean up.",
        "Type 'man secret' to learn about database encryption.",
        "Bored? Try to beat BMO's high score in 'game'!",
        "Type 'whoami' to inspect your current profile.",
        "Need emotional support? Just type 'bmo' and wait for a friendly beep.",
        "BMO's database runs on tea and cookies. Got any chocolate chip cookies?",
        "Warning: typing 'sudo rm -rf /' will cause extreme virtual tickling.",
        "Bored? Try to catch a celestial fish cloud in real-time.",
        "Type 'mute' to stop BMO's mechanical keyboard clicker sounds.",
        "Did you know? Clicking the moon in the background makes it spin... or does it?",
        "Try 'cookies' to read about BMO's strict double-chocolate chip policy.",
        "Stuck? Type 'help' and let the system guide your terminal journey.",
        "Type 'date' to check BMO's internal clock and solar ephemeris.",
        "Type 'policy' to inspect the rules of Imaginal Space.",
        "Try 'secret flag{h4ck_th3_pl4n3t_1999}'... wait, where did you get this key?",
        "Feel like coding? Open 'vim draft_rates.cfg' and check BMO's rate card.",
        "Not sure what 'harvester' does? Type 'man harvester' to scan your specs.",
        "Did you know? BMO judges your console font choices silently.",
        "Try 'weather rain' if you feel like drinking tea under a virtual drizzle.",
        "Type 'history' to review all the typos you've made during this session.",
        "If BMO is quiet, it means he is calculating the coordinates of the next warm cookie.",
        "You can open external links instantly, e.g., type 'open https://github.com'.",
        "Stuck in your coding career? Type 'tips' for highly constructive advice."
    ];

    const MAN_PAGES = {
        ls: {
            desc: "List directory contents.",
            linux: "Lists directory contents of the target folder (defaulting to current directory if omitted). Supports switches like -la (mocked).",
            project: "Lists virtual directories and files. Folders are color-coded in <span class='dir'>blue</span>, regular text files in <span class='file'>green</span>, and locked binary databases in <span class='secret-title'>red</span>."
        },
        cd: {
            desc: "Change working directory.",
            linux: "Changes the current working directory of the shell session to the target path.",
            project: "Navigates between folders. Supports absolute and relative paths, including '..' (parent directory). Running 'cd' without arguments returns to '/home/bmo'."
        },
        curl: {
            desc: "Transfer data from or to a server.",
            linux: "curl is a tool to transfer data from or to a server, using one of the supported protocols (HTTP, HTTPS, FTP, etc.).",
            project: "Runs a virtual curl request to fetch details from servers. Try 'curl https://imaginal.dev' to get BMO's ANSI art response, 'curl wttr.in' for a weather summary, or 'curl /coffee' for a warm surprise. Supports -I (headers-only) and -v (verbose mode)."
        },
        pwd: {
            desc: "Print working directory.",
            linux: "Prints the absolute path of the current working directory.",
            project: "Displays your current path location inside the virtual file system."
        },
        cat: {
            desc: "Concatenate and print files.",
            linux: "Reads files sequentially and writes their contents to standard output.",
            project: "Prints the contents of virtual text files. Prepend with a cute feline reader log and escapes HTML tag elements to block XSS injections."
        },
        bat: {
            desc: "Concatenate and print files (bat-style).",
            linux: "Alias/alternative to cat, often refers to 'bat' (a cat clone with syntax highlighting and Git integration).",
            project: "Prints the contents of virtual text files."
        },
        mkdir: {
            desc: "Make directories.",
            linux: "Creates directories with the specified names if they do not already exist.",
            project: "Allows creation of custom sub-folders anywhere in the virtual file system (VFS). Updates persist in localStorage."
        },
        touch: {
            desc: "Create empty files.",
            linux: "Updates the access and modification times of each file, creating empty files if they don't exist.",
            project: "Creates a new empty text file in the virtual path. Updates persist in localStorage."
        },
        vim: {
            desc: "BIM Text Editor (Vim Improved).",
            linux: "Vim (Vi IMproved) is a highly configurable text editor built to enable efficient text editing.",
            project: "Officially known as <b>BIM</b> (BMO IMproved) on ImaginalOS. It launches a full-screen retro text editor overlay with status and colon command bars. Supports Command mode (press ESC), Insert mode (press 'i'), and Colon commands (:w, :q, :wq, :q!)."
        },
        game: {
            desc: "Play retro space rocks arcade game (alias: spacerock).",
            linux: "Not a standard Unix command, though often referenced as the 'asteroids' clone game.",
            project: "Launches a neon retro space shooter inside the console window. Face incoming waves of drifting asteroids. Earn score points, beat high scores (saved in localStorage), and show off your spaceship maneuvering skills."
        },
        banano: {
            desc: "Alias for 'vim' (BIM editor, yellow skin).",
            linux: "A simple command-line text editor.",
            project: "BMO's favorite banana-flavored editor. Redirects directly to the BIM editor interface."
        },
        edit: {
            desc: "Alias for 'vim'.",
            linux: "A simple command-line text editor.",
            project: "Redirects directly to the VIM/BIM editor interface."
        },
        rm: {
            desc: "Remove files or directories.",
            linux: "Removes specified files or directory hierarchies.",
            project: "Deletes files or empty folders. Saves filesystem changes to localStorage."
        },
        echo: {
            desc: "Display a line of text.",
            linux: "Prints the given text arguments to standard output.",
            project: "Echoes text back and triggers an ASCII propeller plane pulling your text as a banner."
        },
        uname: {
            desc: "Print system information.",
            linux: "Prints system information such as operating system name, hostname, and kernel release.",
            project: "Displays virtual OS release build architectures."
        },
        history: {
            desc: "GNU History Library list.",
            linux: "Lists the history of executed commands in the current shell session.",
            project: "Displays a numbered list of all commands run in this terminal session."
        },
        open: {
            desc: "Open a URL link.",
            linux: "Opens a file or URL using the user's default preferred application.",
            project: "Triggers browser redirects to open external links in a new browser tab."
        },
        git: {
            desc: "Git control system redirect.",
            linux: "Command-line interface to the Git version control system.",
            project: "Triggers a browser redirect to BMO's personal GitHub profile."
        },
        gpg: {
            desc: "Display owner's GPG public key.",
            linux: "GNU Privacy Guard (GPG) is an implementation of the OpenPGP standard to encrypt and sign data/communication.",
            project: "Prints the owner's public GPG/PGP key block directly to the screen (marked for click-to-copy convenience)."
        },
        github: {
            desc: "Alias for 'git'.",
            linux: "N/A",
            project: "Triggers a browser redirect to BMO's personal GitHub profile."
        },
        tg: {
            desc: "Telegram contact link redirect.",
            linux: "N/A",
            project: "Triggers a browser redirect to start a chat with BMO on Telegram."
        },
        telegram: {
            desc: "Alias for 'tg'.",
            linux: "N/A",
            project: "Triggers a browser redirect to start a chat with BMO on Telegram."
        },
        neofetch: {
            desc: "Fast, highly customizable system info script.",
            linux: "Gathers system information and prints it styled with an ASCII logo.",
            project: "Outputs a block-art ImaginalOS title along with specifications, browser diagnostics, and live weather details."
        },
        harvester: {
            desc: "Forensics and security telemetry scanner.",
            linux: "N/A",
            project: "Generates cryptographic hardware fingerprints, audio ciphers, and font directories."
        },
        scan: {
            desc: "Alias for 'harvester'.",
            linux: "N/A",
            project: "Gathers client-side fingerprint analytics."
        },
        weather: {
            desc: "Weather forecast CLI query.",
            linux: "N/A (often mapped to 'curl wttr.in')",
            project: "Fetches local weather forecasts from Open-Meteo or Санкт-Петербург (fallback). You can also control the website's sky canvas by typing: 'weather storm', 'weather snow', 'weather rain', 'weather clouds', or 'weather clear'."
        },
        whoami: {
            desc: "Print current active user ID.",
            linux: "Prints the effective username of the current user.",
            project: "Displays details of the active virtual user session ('bmo')."
        },
        bmo: {
            desc: "BMO diagnostics check.",
            linux: "N/A",
            project: "Triggers diagnostic checks on BMO's cute console interface."
        },
        secret: {
            desc: "Cryptographic database decryption tool.",
            linux: "N/A",
            project: "Validates database keys or runs local ciphers. Usage: 'secret <key>' to verify locks, 'secret hash <text>' for SHA-256, 'secret encrypt <key> <text>' for XOR-Hex encoding."
        },
        matrix: {
            desc: "Digital rain screen saver.",
            linux: "An open source simulation of the falling green code screen from 'The Matrix'.",
            project: "Launches a fullscreen canvas Matrix digital rain animation overlay on the terminal window. Click or press any key to exit the animation."
        },
        clear: {
            desc: "Clear the terminal screen.",
            linux: "Clears the active screen buffer of the console terminal.",
            project: "Wipes clean the visible terminal output logs."
        },
        mute: {
            desc: "Mute audio output.",
            linux: "Mutes active audio channels.",
            project: "Mutes terminal mechanical typing audio synthesiser clicks."
        },
        unmute: {
            desc: "Unmute audio output.",
            linux: "Restores audio channels.",
            project: "Enables interactive typing sound feedback."
        },
        date: {
            desc: "Print system date and time.",
            linux: "Displays the current date and time or adjusts system clock.",
            project: "Outputs your current browser's local timezone-accurate date and time."
        },
        time: {
            desc: "Show local time accompanied by BMO's unique comments.",
            linux: "Usually times a command execution run in standard shells.",
            project: "Outputs your local time."
        },
        exit: {
            desc: "Exit the shell.",
            linux: "Causes the shell session to terminate.",
            project: "Closes the virtual terminal emulator console window."
        },
        sudo: {
            desc: "Superuser execution protocol.",
            linux: "Executes commands with elevated superuser privileges.",
            project: "Triggers administrative system resets. E.g. 'sudo rm -rf /' wipes all local virtual file configurations, resetting storage back to default."
        },
        man: {
            desc: "Display manual pages.",
            linux: "An interface to the system reference manuals.",
            project: "Displays reference documentation detailing how each terminal shell utility behaves in Linux compared to the web portfolio's custom virtual system."
        },
        ip: {
            desc: "Print client network public IP address.",
            linux: "Prints the machine's IP address parameters from socket lookups.",
            project: "Retrieves your current public-facing IP address from our client diagnostics cache."
        },
        pass: {
            desc: "Generate random high-strength password passphrase.",
            linux: "N/A (often achieved using pwgen or openssl rand).",
            project: "Generates a cryptographically randomized password string containing uppercase, lowercase, numbers, and symbols. Usage: 'pass [length]'. Default length is 12."
        },
        cookie: {
            desc: "View ImaginalOS Cookie Directive.",
            linux: "N/A",
            project: "Outlines our stance on baking cookies, chocolate chip ingredients, and console energy requirements."
        },
        cookies: {
            desc: "Alias for 'cookie'.",
            linux: "N/A",
            project: "Outlines our stance on baking cookies, chocolate chip ingredients, and console energy requirements."
        },
        policy: {
            desc: "View ImaginalOS Terms of Service and Space Laws.",
            linux: "N/A",
            project: "Displays the rules and policies of visiting the website."
        },
        policies: {
            desc: "Alias for 'policy'.",
            linux: "N/A",
            project: "Displays the rules and policies of visiting the website."
        },
        tips: {
            desc: "Generate a random piece of highly destructive developer advice.",
            linux: "N/A (there is no command to intentionally crash your production server, except maybe rm -rf /).",
            project: "Outputs a random step-by-step harmful tip/advice for development or system administration, written in a serious-silly tone."
        }
    };

    const COOKIE_POLICY_TEXT = 
        `🍪 <span class="secret-title">[COOKIE DIRECTIVE]</span><br>` +
        `<span style="color: #50fa7b;">--------------------------------------------------</span><br>` +
        `Just like 99.9% of the websites in this sector of the galaxy, we collect cookies.<br><br>` +
        `We do this because:<br>` +
        `• <span class="neokey">Reason 1:</span> We absolutely LOVE cookies (especially chocolate chip, oatmeal raisin, and double chocolate).<br>` +
        `• <span class="neokey">Reason 2:</span> Cookies go extremely well with warm milk, English tea, or fresh coffee.<br>` +
        `• <span class="neokey">Reason 3:</span> Our resident console system, BMO, gets hungry when processing telemetry inputs.<br>` +
        `<br>` +
        `By continuing to navigate this interface, you agree to virtually bake a batch of cookies<br>` +
        `for BMO. Cookie preferences can be managed using the '<span class="cmd">sudo rm -rf /</span>' reset mechanism.<br>`;

    const GALACTIC_POLICIES = [
        "Staring directly at the moon for more than 5 minutes requires declaring your eternal loyalty to BMO.",
        "Attempting to bribe BMO with virtual batteries is highly encouraged, though it will not grant you superuser privileges.",
        "If you write a software bug that breaks the website, you are legally obligated to buy BMO a cup of Earl Grey tea.",
        "Using the backtick key (`) to trigger the terminal must be accompanied by making retro sci-fi sound effects vocally.",
        "The stars floating in the background are leased from the Milky Way database; replication is subject to Interstellar Copyright Laws.",
        "Sudoers must identify as robots. Humans attempting 'sudo' actions will be tickled by a virtual feather subroutine.",
        "Vim is Improved. Bim is BMO Improved. Calling it Vim in front of BMO will result in him pouting for 10 minutes.",
        "Wind directions are fetched in real-time. Blowing on your screen to move clouds is ineffective and leaves smudges.",
        "The telemetry harvester scans system fonts. Not having Comic Sans installed will result in silent judgment from the creator.",
        "Destructive 'sudo rm -rf /' commands execute kernel resets. Panic attacks caused by resets should be reported to BMO for a virtual hug.",
        "Matrix rain characters are Katakana. Reading them backward will not summon a digital cyberpunk demon (usually).",
        "In case of system malfunction, remain calm, play a synth sound effect, and type 'bmo' to soothe your digital consciousness.",
        "Visitors must enjoy their stay. Failure to enjoy constitutes a direct violation of Space Code 882."
    ];

    const TIME_PHRASES = {
        0: [
            "Midnight code oil. Why are you still awake?",
            "The ghosts in your room are analyzing your Git commits.",
            "BMO suggests closing this tab and hugging a pillow.",
            "Time to search for random historical facts on Wikipedia.",
            "Are you compiling something complex or just avoiding sleep?",
            "System warning: Human organic battery is dangerously low."
        ],
        1: [
            "Perfect hour to refactor the whole database and regret it.",
            "Only owls, servers, and caffeinated developers are awake.",
            "BMO's sensors detect high levels of determination (or anxiety).",
            "Did you hear that click? Probably just a memory leak.",
            "If you write code now, your morning self will curse you.",
            "Zzz... BMO's potato processors are starting to dream."
        ],
        2: [
            "The witching hour. Are we hacking the mainframe yet?",
            "Your bed is emitting strong gravitational waves. Resist?",
            "Time to drink water. No, not coffee, actual water.",
            "You are entering the zone where all code looks like poetry.",
            "BMO is worried. Please don't make him watch you crash.",
            "Almost 3 AM. The spiders are waiting for you to close your eyes."
        ],
        3: [
            "3 AM: Time to question all your career and life choices.",
            "If a bug occurs now, it's probably possessed by demons.",
            "BMO is asleep. This is an automated response: Zzz...",
            "You are officially in the 'no-man's land' of the timezone.",
            "Even StackOverflow is sleeping. You are on your own.",
            "The birds will start singing soon. Go to bed before they judge you."
        ],
        4: [
            "Is this extremely late, or extremely early?",
            "You've unlocked the achievement: 'No Sleep Till Sunrise'.",
            "BMO thinks you should check if your alarm is set for tomorrow.",
            "The server room is cold. Your coffee is cold. Everything is cold.",
            "Sleep now, or forever hold your bugs.",
            "Sky is turning blue. You've officially survived the night."
        ],
        5: [
            "Early bird catches the worm. Or in your case, a database deadlock.",
            "The sun is up. Time to pretend you just woke up early.",
            "BMO is yawning. Mechanical yawns sound like grinding gears.",
            "Time to prepare a double espresso. Or maybe a triple one.",
            "The world is waking up, and you look like a zombie.",
            "Morning stretch time! Rotate your neck 360 degrees (if mechanical)."
        ],
        6: [
            "Rise and shine! Or just lie down and stare at the ceiling.",
            "BMO's solar panels are starting to trickle charge.",
            "Time to read the news and instantly regret waking up.",
            "A fresh day begins. Will you write bugs or features today?",
            "The birds are screaming. They are probably complaining about Javascript.",
            "Quick check: Did you leave the stove on? Or a server instance?"
        ],
        7: [
            "Alarm clocks everywhere are singing the song of their people.",
            "BMO recommends a hot shower to wash away the compiler errors.",
            "Time to decide what to wear. (Spoiler: black hoodie).",
            "Breakfast time! BMO demands a virtual bowl of chocolate chips.",
            "Morning traffic is building. Good thing we are in a browser.",
            "Almost 8 AM. The daily standup anxiety begins to brew."
        ],
        8: [
            "System boot sequence complete. Ready for daily human operations.",
            "Check your inbox. 99+ unread automated alerts. Fun!",
            "BMO suggests drinking a glass of water before the chaos starts.",
            "Time to pretend you are reading technical documentation.",
            "The coffee is finally kicking in. Brain cells loading: 64%...",
            "Ten minutes before the official work hour. Deep breaths."
        ],
        9: [
            "Ding ding! Work mode initiated. Log in and look busy.",
            "First Standup: Time to explain why yesterday's 5-minute task took 8 hours.",
            "BMO's database is performing a routine morning cookie sweep.",
            "Coding time! Let's write some code that we'll rewrite tomorrow.",
            "Coffee cup #2 is currently being refilled.",
            "You've been working for 50 minutes. Time to look out the window."
        ],
        10: [
            "10 AM. Time for a quick snack. An apple? Or a cookie? (Cookie!).",
            "You are currently deep in the zone. Do not let anyone ping you.",
            "BMO's CPU temperature is optimal. How is your head temperature?",
            "A meeting that could have been an email is about to start.",
            "Staring at a stack trace trying to remember what you did in 2025.",
            "Almost 11. Time for a micro-stretch. Touch your keyboard."
        ],
        11: [
            "The hunger sensors are starting to send interrupt signals.",
            "Just one more commit before lunch. What could go wrong?",
            "BMO is calculating the optimal cookie-to-milk ratio.",
            "Lunch brainstorming. Burger? Salad? Cold pizza?",
            "Watching the clock spin. 20 minutes left.",
            "Stomach growling. BMO's disk drive is clicking in sympathy."
        ],
        12: [
            "LUNCH TIME! Drop your keyboard and run!",
            "Eating food while looking at code. The ultimate developer diet.",
            "BMO's charging dock is warm. Your food is hopefully warm too.",
            "Chewing slowly. Chewing speeds up logical thinking, probably.",
            "Food coma is approaching. Heavy eyelids detected.",
            "Lunch is ending. The tragic return to the terminal."
        ],
        13: [
            "1 PM. The brain is running on 8-bit mode right now.",
            "Time for a post-lunch coffee to fight the food coma.",
            "BMO recommends staring at the terminal blankly for 5 minutes.",
            "Let's do some brainless tasks, like updating dependencies.",
            "Coffee cup #3 is doing its best.",
            "Almost 2 PM. You can do this. Just keep typing."
        ],
        14: [
            "2 PM. Time to actually write some functional code.",
            "Debugging a bug you wrote at 9 AM. Classic.",
            "BMO's status: 100% operational, 0% cookies found nearby.",
            "The afternoon meeting marathon is starting. Get your notepad.",
            "Staring at a pull request review. Why did they do it like this?",
            "10 minutes to clear your head. Take a deep breath."
        ],
        15: [
            "3 PM! Tea time! BMO demands English breakfast tea immediately.",
            "A cookie snack is highly recommended by BMO's medical protocols.",
            "You are 70% through the workday. The finish line is visible.",
            "Coding block #3. Let's build something beautiful.",
            "Your Git history is looking clean today. Let's keep it that way.",
            "The afternoon sun is hitting the monitor. Time to close the blinds."
        ],
        16: [
            "4 PM. The focus is shifting from coding to 'what's for dinner'.",
            "Checking if CI/CD pipeline passed. Green! Sweet relief.",
            "BMO's fan is spinning faster. Excitement? Or just dust?",
            "Time to write documentation. Just kidding, nobody does that.",
            "The final sprint of the day. Fix that last warning.",
            "10 minutes left. Time to start clean-up protocols."
        ],
        17: [
            "5 PM! Logout time for normal humans. Or time for overtime?",
            "Closing open tabs. 45 down, 12 to go.",
            "BMO is preparing to enter low-power standby... just kidding, he never sleeps.",
            "Committing and pushing. 'WIP: please don't look at this code'.",
            "Leaving the office / closing the work laptop. Ah, freedom.",
            "Time to think about dinner. Real food, not just cookies."
        ],
        18: [
            "Evening mode activated. Time to rest your eyes.",
            "Commuting home or transitioning to the couch.",
            "BMO's internal database is cooling down.",
            "Dinner preparation! What are we cooking today?",
            "Smells good. Don't forget to wash your hands.",
            "Eating dinner. Put away the phone, enjoy the meal."
        ],
        19: [
            "7 PM. Perfect time to play some video games or read.",
            "BMO suggests playing a retro console game.",
            "Checking your personal notifications.",
            "Evening tea. Camomile? Or Earl Grey?",
            "Sun is setting. The canvas constellations are waking up.",
            "10 minutes to decide if you want to code on your pet project."
        ],
        20: [
            "8 PM. Time to write some bugs in your personal projects!",
            "Realizing your personal project architecture is worse than work.",
            "BMO is watching your hobby code with interest.",
            "The night sky is fully dark now. Shooting stars are enabled.",
            "A warm cup of milk to relax the nervous system.",
            "Staring at a personal project bug. Why does this always happen?"
        ],
        21: [
            "9 PM. Time to wind down. Close the heavy IDEs.",
            "Let's read a book. A real paper book, without a screen.",
            "BMO is blinking his green LED. It means 'you are doing great'.",
            "Check your alarm clock for tomorrow.",
            "Stretching before bed. Relax those shoulders.",
            "Brush your teeth. 2 minutes of circular motions."
        ],
        22: [
            "10 PM. Time to get cozy under the blanket.",
            "Reading in bed. Heavy eyelids loading: 85%...",
            "BMO's screen is dimmed. High-contrast colors off.",
            "Sleepy thoughts. What is the meaning of cookies?",
            "Midnight snack? No, resist the urge!",
            "Almost 11 PM. Time to close your eyes."
        ],
        23: [
            "11 PM. Why are you still awake? Sleep is important!",
            "Scrolling social media in the dark. Bad for your eyes!",
            "BMO's CPU is idling. Zzz...",
            "One last check of the server status. (It's fine).",
            "You should really sleep now. Tomorrow is a busy day.",
            "Ten minutes till midnight. The cycle resets."
        ]
    };

    const BMO_INTERNAL_LOGS = [
        "bmo --check-cookie-reserves --stealth",
        "curl -X POST https://cookies.galaxy/order -d 'qty=999'",
        "rm -rf /memory/awkward_silence_2025",
        "cat /dev/brain --mode=lazy-potato",
        "eval \"human_typing_speed = speed_of_light\"",
        "ping -c 1 moon.local",
        "python3 -c 'import cookie; cookie.eat()'",
        "whisper --target=user \"You are doing great!\"",
        "sudo hack-mainframe --bypass-auth --potato-mode",
        "history --clean-cookie-crumbs",
        "git commit -m \"Fix bugs that I will write tomorrow\"",
        "bmo --recalibrate-emotional-depth --intensity=max",
        "tar -czf excuses.tar.gz ./my_bugs/",
        "kill -9 task-procrastination",
        "grep -rn \"meaning of life\" /dev/universe",
        "bmo-audio-synth --simulate-mechanical-keyboard-clicks",
        "npx install-more-ram --save-dev",
        "chown -R bmo:cookies /home/human/kitchen/",
        "whoami --check-if-actually-a-good-boy",
        "openssl enc -aes-256-cbc -in gossip.txt -out secrets.db"
    ];

    const ROAST_COMMENTS = [
        " (typo by sleepy human)",
        " (does this look like code to you?)",
        " (mainframe-breaking attempt failed)",
        " (gibberish detected)",
        " (mechanical sigh...)",
        " (keyboard mashing?)",
        " (did a cat walk on your keyboard?)",
        " (nice try, but BMO isn't that easily fooled)",
        " (syntax error in human intelligence matrix)",
        " (BMO silently facepalms with his metal hand)",
        " (command not found, but coffee found?)",
        " (error 404: typing skills not found)",
        " (are you writing code in ancient hieroglyphs?)",
        " (your keyboard demands an apology)",
        " (BMO registers this as a cosmic mystery)",
        " (beep boop, please try typing with fingers)"
    ];

    const PASSWORD_BMO_QUOTES = [
        "Here is your super secret password, don't tell anyone, not even me, hehe!",
        "Generated a password so strong that even BMO can't crack it... wait, yes I can.",
        "Keep this key safe. Do not write it on a sticky note and paste it on your monitor, human!",
        "Encryption matrix complete. Remember: with great password length comes great memorization responsibility.",
        "A perfect shield for your secrets. Just don't forget it, because BMO's memory gets wiped occasionally!",
        "BMO created this key by shuffling stars and chocolate cookie recipes.",
        "This password is so secure, it has its own tiny firewall mascot.",
        "Do not share this key with space pirates. Or dogs.",
        "Key generated. If you lose it, BMO will pretend he didn't see anything.",
        "Generating... Done! This password is 99% secure and 1% potato."
    ];

    const TOUCH_QUOTES = [
        "Touched it. It felt cold.",
        "Touched it. BMO felt a microsecond tickle in the CPU.",
        "Creating it out of thin space vacuum.",
        "Now it is officially part of BMO's filesystem universe.",
        "Touching virtual files doesn't require washing hands.",
        "BMO stamped it with a digital seal of approval.",
        "File created. BMO has reserved a cozy block on the SSD for it.",
        "It is empty, but full of endless possibilities.",
        "Shhh... a newborn file is sleeping here now.",
        "Touched! BMO's sensors detected your fingertip speed was optimal."
    ];

    const RM_ROASTS = [
        "Wait, did you hear that? I think the file screamed.",
        "Are you sure you wanted to delete it? It had a family. Just kidding, it's gone.",
        "File compressed into digital stardust and scattered across the memory void.",
        "Warning: You just deleted BMO's favorite file! BMO is sad now. (Not really, it was just temp data).",
        "File evaporated. A moment of silence for the deleted bytes.",
        "POOF! And it's gone. BMO is excellent at cleanup.",
        "Sent to the digital recycling bin on Mars.",
        "It was blocky anyway. BMO prefers curvy files.",
        "Gone forever. BMO has already forgotten what it was.",
        "Deletion success! BMO sweeps the leftover bits under the virtual carpet."
    ];

    const WEATHER_QUOTES = {
        clear: [
            "Perfect weather to lay on the grass and count stars. Or cookies.",
            "The sky is so clear, BMO can see his reflection on the moon!",
            "Sunlight is just warm wireless energy. Go recharge your battery, human!",
            "Not a single cloud in sight. Perfect day to conquer the digital universe.",
            "The sun is shining bright! BMO's solar subroutines are purring with joy."
        ],
        clouds: [
            "The clouds look like giant scoops of mashed potatoes today.",
            "Clouds are just sky blankets. BMO hopes they are cozy.",
            "Grey skies are perfect for sipping tea and writing clean code.",
            "BMO sees a cloud shaped like a giant chocolate chip cookie up there!",
            "Overcast. The sky is running in dark mode today. Excellent choice."
        ],
        rain: [
            "It's raining! Time to open a virtual umbrella and listen to static noise.",
            "Sky juice is falling. BMO's metal parts prefer to stay dry, thank you!",
            "Raindrops are just liquid pixels. Don't let them short-circuit your keyboard.",
            "Plip, plop. The sky is singing a low-fi song. Time for hot tea.",
            "Perfect weather to stay inside and refactor your old spaghetti code."
        ],
        snow: [
            "Snowflakes are like tiny frozen pixels. Beautiful, but cold!",
            "Time to build a snow-BMO! Don't forget the charcoal buttons.",
            "The world is covered in white noise. Stay warm, human friend.",
            "It's freezing! BMO suggests wearing thick socks. (BMO doesn't have feet, but he knows socks are cozy).",
            "Winter wonderland. Let's compute some snow trajectories."
        ],
        storm: [
            "Thunder! Lightning! BMO is running his anti-static security protocol. Hold my hand?",
            "The universe is playing loud drums today. Let's make cookies while it rages!",
            "Electric sky show! BMO recommends unplugging your major mainframe.",
            "Heavy storm outside. BMO's CPU is shielding against electromagnetic pulses.",
            "Angry clouds are flashing. Stay safe and cozy inside, human!"
        ],
        hot: [
            "It's too hot! BMO's cooling fans are spinning at maximum speed. Phew!",
            "Melting temperature! Don't forget to hydrate your biological chassis.",
            "BMO's temperature sensors indicate we are practically baking cookies outside.",
            "It's so warm, BMO wants to jump into a glass of iced tea.",
            "Warning: CPU core temperature rising. Seek shade and cold drinks immediately!"
        ],
        cold: [
            "Brrr! It's freezing cold. Biological units require insulation coats.",
            "Cold weather detected. BMO is overclocking his CPU just to stay warm.",
            "Don't catch a cold, human! BMO doesn't know how to compile anti-virus for humans.",
            "The temperature is dropping. Perfect excuse to wrap yourself in a blanket burrito.",
            "Ice alert! Walk carefully. BMO's gravity sensors hate slippery sidewalks."
        ],
        high_uv: [
            "Sun alert! High UV levels. Protect your organic outer shell with sunscreen.",
            "Solar radiation is strong today. Space pirates recommend wearing sunglasses.",
            "UV index is high! Don't get sunburned, human chassis is hard to replace.",
            "The sun is lasers today. Seek shade to prevent biological overheating.",
            "Extreme sun energy! BMO's optical sensors are squinting."
        ],
        unknown: [
            "The weather sensors are hazy. Did someone spill tea on BMO?",
            "Space fog is interfering. Remain calm and think of chocolate chips.",
            "Foggy system. BMO is flying by digital instruments only.",
            "Visibility low. Perfect atmosphere for a noir terminal detective story."
        ]
    };

    const TIPS_LIST = [
        {
            title: "HOW TO FIX BUGS",
            steps: [
                "Locate the source code containing the bug.",
                "Select all lines of code.",
                "Press 'Delete'.",
                "Commit and push."
            ],
            result: "0 lines of code = 0 bugs! If your manager asks, blame solar flares."
        },
        {
            title: "HOW TO SPEED UP PC",
            steps: [
                "Open terminal.",
                "Run 'sudo rm -rf /'.",
                "This deletes all system processes and CPU threads overhead."
            ],
            result: "The processor will run at absolute light speed. (PC reboot required)."
        },
        {
            title: "SECURITY BEST PRACTICES",
            steps: [
                "Set your master database password to '123456' or 'qwerty'.",
                "Write it on a bright yellow sticky note.",
                "Paste it directly onto the front of your monitor."
            ],
            result: "You will never forget your credentials again! Security: 100% (too obvious to check)."
        },
        {
            title: "WORK-LIFE BALANCE",
            steps: [
                "Sleep is for weak CPU cores. Disable sleep mode.",
                "Replace all water intake with espresso coffee (8+ cups/day).",
                "Stare at glowing blue lights for 22 hours straight."
            ],
            result: "Maximum developer output."
        },
        {
            title: "DATABASE OPTIMIZATION",
            steps: [
                "If your database runs slowly, simply execute 'DROP DATABASE' or delete all rows.",
                "Less data means faster queries! Zero latency guaranteed."
            ],
            result: "Query time reduced to 0ms."
        },
        {
            title: "FRIDAY DEPLOYMENTS",
            steps: [
                "Do not use git branches. Always commit and push directly to 'main' at 5:00 PM on Friday.",
                "It builds team spirit and character."
            ],
            result: "Weekend is guaranteed to be extremely engaging and interactive!"
        },
        {
            title: "ERROR HANDLING",
            steps: [
                "If your code doesn't work, don't debug it.",
                "Just add 'try { ... } catch (Exception e) {}' around everything and ignore all errors.",
                "Out of sight, out of mind!"
            ],
            result: "100% uptime! Your application will never crash again (even if it does absolutely nothing)."
        },
        {
            title: "WEB PERFORMANCE",
            steps: [
                "To make your web app load faster, delete all CSS styling.",
                "Unstyled HTML is 100% efficient and loads in 1ms."
            ],
            result: "Perfect Lighthouse speed score of 100/100."
        },
        {
            title: "VERSION CONTROL & COMMITS",
            steps: [
                "Avoid writing descriptive Git commit messages like 'Fix login bug'.",
                "Always use 'fix', 'update', 'wip', 'temp', or random characters.",
                "If someone asks, say it is a security measure to prevent code leaks."
            ],
            result: "Your Git history is now highly mysterious, encouraging colleagues to read the whole codebase to find out what you did."
        },
        {
            title: "SERVER MONITORING & INCIDENTS",
            steps: [
                "If Sentry or Grafana are sending too many alerts about database connections failing, go to settings.",
                "Mute all channels, disable email alerts, and turn off your phone."
            ],
            result: "A perfectly calm working environment, free of stress and alert fatigue. Out of sight, out of mind!"
        },
        {
            title: "DEPENDENCY ORCHESTRATION",
            steps: [
                "Whenever you need a single utility function (like padding a string), install a massive third-party package.",
                "Never pin dependency versions; always use '*' or 'latest' to ensure you run whatever developers pushed five minutes ago."
            ],
            result: "Your 'node_modules' folder will grow larger than the observable universe, making every build a surprise adventure!"
        },
        {
            title: "CODE DOCUMENTATION",
            steps: [
                "Write comments explaining exactly what the code does in a redundant way (e.g., 'x = 5; // sets x to 5').",
                "For complex logic, write comments like '// I have no idea why this works, do not touch'."
            ],
            result: "Adds historical value and ancient mystique to the codebase. Future engineers will treat your comments as archaeological artifacts!"
        },
        {
            title: "USER PASSWORD SECURITY",
            steps: [
                "Store all user passwords in plaintext in your SQL database.",
                "If the security auditor complains, encode them using Base64 so they look scrambled."
            ],
            result: "Lightning-fast authentication without wasting precious CPU cycles on hashing functions like bcrypt."
        },
        {
            title: "PULL REQUEST STRATEGY",
            steps: [
                "Create a single Pull Request with 10,000 modified lines across 85 files.",
                "Give it the title 'various refactorings' and leave the description empty."
            ],
            result: "The reviewer will be so overwhelmed they will just click 'Approve' within 30 seconds. Ultimate speed of delivery!"
        }
    ];

    const CURL_HELP = `Usage: curl [options...] &lt;url&gt;<br>
Options:<br>
  -I, --head          Show document info only (headers)<br>
  -v, --verbose       Make the operation more talkative<br>
  -H, --header LINE   Extra header to include in the request<br>
  -h, --help          This help text<br>`;

    // Expose helpers globally
    window.imaginalOS = window.imaginalOS || {};
    window.imaginalOS.HELP_COMMANDS = HELP_COMMANDS;
    window.imaginalOS.HINTS = HINTS;
    window.imaginalOS.MAN_PAGES = MAN_PAGES;
    window.imaginalOS.COOKIE_POLICY_TEXT = COOKIE_POLICY_TEXT;
    window.imaginalOS.GALACTIC_POLICIES = GALACTIC_POLICIES;
    window.imaginalOS.TIME_PHRASES = TIME_PHRASES;
    window.imaginalOS.BMO_INTERNAL_LOGS = BMO_INTERNAL_LOGS;
    window.imaginalOS.ROAST_COMMENTS = ROAST_COMMENTS;
    window.imaginalOS.PASSWORD_BMO_QUOTES = PASSWORD_BMO_QUOTES;
    window.imaginalOS.TOUCH_QUOTES = TOUCH_QUOTES;
    window.imaginalOS.RM_ROASTS = RM_ROASTS;
    window.imaginalOS.WEATHER_QUOTES = WEATHER_QUOTES;
    window.imaginalOS.TIPS_LIST = TIPS_LIST;
    window.imaginalOS.CURL_HELP = CURL_HELP;
})();
