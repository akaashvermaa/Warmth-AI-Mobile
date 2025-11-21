// ===== DEBUG: REACT NATIVE WEB OVERLAY DETECTOR =====
// Purpose: Identify and analyze overlays that block button clicks
(function(){

    console.log('🔍 DEBUG: Starting overlay detection and removal...');

    function debugDOM() {
        console.log('=== DOM DEBUG INFO ===');
        console.log('Total elements:', document.querySelectorAll('*').length);
        console.log('Div elements:', document.querySelectorAll('div').length);
        console.log('Elements with tabindex="0":', document.querySelectorAll('[tabindex="0"]').length);
        console.log('Body children:', document.body.children.length);

        // Check for overlays
        const overlays = document.querySelectorAll('div[tabindex="0"]');
        console.log('Potential overlays found:', overlays.length);
        overlays.forEach((el, index) => {
            console.log(`Overlay ${index}:`, {
                tag: el.tagName,
                classes: el.className,
                tabindex: el.getAttribute('tabindex'),
                display: window.getComputedStyle(el).display,
                visibility: window.getComputedStyle(el).visibility,
                pointerEvents: window.getComputedStyle(el).pointerEvents,
                zIndex: window.getComputedStyle(el).zIndex,
                position: window.getComputedStyle(el).position,
                rect: el.getBoundingClientRect()
            });
        });

        // Check specific RNW patterns
        const rnwElements = document.querySelectorAll('[class*="css-view"], [class*="r-"]');
        console.log('RNW elements found:', rnwElements.length);
        rnwElements.forEach((el, index) => {
            if (index < 5) { // Only show first 5 to avoid spam
                console.log(`RNW ${index}:`, el.className);
            }
        });
    }

    function removeProblematicOverlays() {
        console.log('🧹 Running overlay removal...');

        // Target ALL React Native Web overlay elements
        const problematicElements = document.querySelectorAll(
            'div[class*="css-view-g5y9jx"], ' +
            'div[class*="r-transitionProperty"], ' +
            'div[class*="r-userSelect"], ' +
            'div[class*="r-cursor"], ' +
            'div[class*="r-touchAction"], ' +
            'div[class*="r-position"], ' +
            'div[class*="r-flex"], ' +
            'div[tabindex="0"][class*="r-"], ' +
            'div[tabindex="0"]:not(button):not(input):not(select):not(textarea):not(a):not([role="button"])'
        );

        console.log(`Found ${problematicElements.length} problematic elements`);
        let removedCount = 0;

        problematicElements.forEach((el, index) => {
            try {
                const classList = el.className || '';
                const computedStyle = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                console.log(`Processing element ${index}:`, {
                    classes: classList,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    pointerEvents: computedStyle.pointerEvents,
                    zIndex: computedStyle.zIndex,
                    position: computedStyle.position,
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left
                });

                // Check if element is covering the page
                if (rect.width > window.innerWidth * 0.9 && rect.height > window.innerHeight * 0.9) {
                    console.warn('🚨 FOUND FULL-PAGE OVERLAY!', el);
                }

                // Remove if it matches any RNW pattern
                if (classList.includes('css-view-g5y9jx') ||
                    classList.includes('r-transitionProperty') ||
                    classList.includes('r-userSelect') ||
                    classList.includes('r-cursor') ||
                    classList.includes('r-touchAction') ||
                    (el.hasAttribute('tabindex') &&
                     el.getAttribute('tabindex') === '0' &&
                     classList.includes('r-'))) {

                    console.log('🗑️ Removing overlay:', el.className);

                    // Multiple methods to ensure removal
                    el.style.display = 'none !important';
                    el.style.visibility = 'hidden !important';
                    el.style.pointerEvents = 'none !important';
                    el.style.zIndex = '-999999 !important';

                    const parent = el.parentNode;
                    if (parent) {
                        parent.removeChild(el);
                        removedCount++;
                    }
                }
            } catch(e) {
                console.error('Error removing element:', e);
            }
        });

        console.log(`✅ Removed ${removedCount} overlays`);
        return removedCount;
    }

    // Disable ALL problematic elements by default
    function disableProblematicElements() {
        const elements = document.querySelectorAll('div[tabindex="0"]');
        elements.forEach(el => {
            // Only disable if it's not a legitimate interactive element
            if (!el.matches('button, input, select, textarea, a, [role="button"], [onclick], button')) {
                el.style.pointerEvents = 'none !important';
                el.style.visibility = 'hidden !important';
                el.style.display = 'none !important';
            }
        });
    }

    // Monitor DOM changes EXTREMELY aggressively
    const observer = new MutationObserver((mutations) => {
        removeProblematicOverlays();
        disableProblematicElements();
    });

    // Start observing immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            removeProblematicOverlays();
            disableProblematicElements();
            observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'tabindex']
            });
        });
    } else {
        removeProblematicOverlays();
        disableProblematicElements();
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'tabindex']
        });
    }

    // Run frequently to catch overlays that slip through
    setInterval(() => {
        removeProblematicOverlays();
        disableProblematicElements();
    }, 100);

    // Force click-through for intercepted clicks
    document.addEventListener('click', function(e) {
        console.log('🖱️ CLICK DETECTED:', {
            target: e.target.tagName,
            classes: e.target.className,
            id: e.target.id,
            coordinates: { x: e.clientX, y: e.clientY },
            isButton: e.target.matches('button, [role="button"], [onclick]'),
            tabindex: e.target.getAttribute('tabindex')
        });

        const target = e.target;
        const classList = target.className || '';

        // Check what element is actually at the click position
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        console.log('Element at click point:', elementAtPoint.tagName, elementAtPoint.className);

        // If click is on any problematic overlay, force click through
        if (classList.includes('css-view-g5y9jx') ||
            classList.includes('r-transitionProperty') ||
            classList.includes('r-userSelect') ||
            classList.includes('r-cursor') ||
            classList.includes('r-touchAction') ||
            classList.includes('r-') ||
            (target.hasAttribute('tabindex') &&
             target.getAttribute('tabindex') === '0' &&
             !target.matches('button, input, select, textarea, a, [role="button"]'))) {

            console.log('🚫 Click intercepted by overlay!');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Remove the problematic overlay
            target.remove();
            removeProblematicOverlays();

            // Find what's actually underneath and click that
            setTimeout(() => {
                const clickTarget = document.elementFromPoint(e.clientX, e.clientY);
                if (clickTarget && clickTarget !== target) {
                    console.log('🎯 Clicking through to:', clickTarget.tagName, clickTarget.className, clickTarget.id);
                    clickTarget.click();
                } else {
                    console.log('❌ No valid click target found underneath');
                }
            }, 0);
        } else {
            console.log('✅ Click reached valid target:', target.tagName, target.id);
        }
    }, true);

    // Also track hover/mousemove to see cursor behavior
    document.addEventListener('mousemove', function(e) {
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const computedCursor = window.getComputedStyle(elementAtPoint).cursor;

        if (computedCursor === 'pointer') {
            console.log('👆 Pointer cursor on:', elementAtPoint.tagName, elementAtPoint.className, elementAtPoint.id);
        }
    });

    // Also handle mousedown/touchstart events
    ['mousedown', 'touchstart'].forEach(eventType => {
        document.addEventListener(eventType, function(e) {
            const target = e.target;
            const classList = target.className || '';

            if (classList.includes('css-view-g5y9jx') ||
                classList.includes('r-') ||
                (target.hasAttribute('tabindex') &&
                 target.getAttribute('tabindex') === '0' &&
                 !target.matches('button, input, select, textarea, a, [role="button"]'))) {

                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                target.remove();
                removeProblematicOverlays();
            }
        }, true);
    });

    // Initial cleanup
    console.log('🚀 Performing initial cleanup...');
    debugDOM();
    const removed = removeProblematicOverlays();
    disableProblematicElements();

    // Run debug analysis after initial cleanup
    setTimeout(() => {
        console.log('=== POST-CLEANUP ANALYSIS ===');
        debugDOM();

        // Test button functionality
        const testButton = document.querySelector('#mood-button, #theme-toggle, #settings-button, button');
        if (testButton) {
            console.log('Test button found:', testButton);
            const rect = testButton.getBoundingClientRect();
            console.log('Button rect:', rect);
            console.log('Button computed style:', {
                display: window.getComputedStyle(testButton).display,
                visibility: window.getComputedStyle(testButton).visibility,
                pointerEvents: window.getComputedStyle(testButton).pointerEvents,
                zIndex: window.getComputedStyle(testButton).zIndex,
                cursor: window.getComputedStyle(testButton).cursor
            });
        } else {
            console.warn('No test button found!');
        }
    }, 1000);

    console.log('✅ React Native Web overlay detection activated');

    // Expose debug function to console for manual testing
    window.debugOverlays = function() {
        console.log('🔍 Manual debug trigger...');
        debugDOM();
        removeProblematicOverlays();
    };

    console.log('💡 Tip: Run debugOverlays() in console to manually check for overlays');
})();
 // ===== END OVERLAY STABILITY PATCH =====

document.addEventListener('DOMContentLoaded', function() {

    

    // --- DOM references ---
    const chatLog = document.getElementById('chat-log'),
          chatForm = document.getElementById('chat-form'),
          chatInput = document.getElementById('chat-input'),
          typingIndicator = document.getElementById('typing-indicator'),
          sendButton = document.getElementById('send-button'),
          typingTimer = document.getElementById('typing-timer'),
          settingsButton = document.getElementById('settings-button'),
          memoryPanel = document.getElementById('memory-panel'),
          memoryList = document.getElementById('memory-list'),
          memoriesArea = document.getElementById('memories-area'),
          refreshMemoriesBtn = document.getElementById('refresh-memories-btn'),
          moodButton = document.getElementById('mood-button'),
          moodPanel = document.getElementById('mood-panel'),
          moodList = document.getElementById('mood-list'),
          vibeText = document.getElementById('vibe-text'),
          adviceText = document.getElementById('advice-text'),
          themeToggle = document.getElementById('theme-toggle'),
          themeIcon = document.getElementById('theme-icon'),
          modal = document.getElementById('custom-modal'),
          modalTitle = document.getElementById('modal-title'),
          modalMessage = document.getElementById('modal-message'),
          modalConfirm = document.getElementById('modal-confirm'),
          modalCancel = document.getElementById('modal-cancel'),
            welcomePopup = document.getElementById('welcome-popup'),
          welcomeClose = document.getElementById('welcome-close');

    // --- Config ---
    const API_URL = ''; // Use relative paths, not absolute
    let moodChartInstance = null;
    let typingTimerInterval = null;
    let typingStartTime = null;
    let onConfirm = null;
      let csrfToken = null; // To store the CSRF token

    // --- Helpers ---
    function escapeHtml(text) { const d=document.createElement('div'); d.textContent = text; return d.innerHTML; }

    // --- Theme Initialization ---
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(themeIcon) themeIcon.classList.replace('ph-moon', 'ph-sun');
    }
    if (themeToggle) themeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            if(themeIcon) themeIcon.classList.replace('ph-sun','ph-moon');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            if(themeIcon) themeIcon.classList.replace('ph-moon','ph-sun');
        }
    });

    // --- Chat submit flow ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if(!text || sendButton.disabled) return;

        sendButton.disabled = true;
        chatInput.disabled = true;
        addMessage('user', text);
        chatInput.value = '';
        typingIndicator.classList.remove('hidden');
        startTypingTimer();
        scrollToBottom();

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            // Use streaming endpoint for real-time response
            const response = await fetch('/chat/stream', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: text })
            });

            if(!response.ok) {
                if(response.status === 401) {
                     addMessage('bot', "Authentication error. Please refresh and log in.");
                }
                throw new Error(`Server ${response.status}`);
            }

            // Hide typing indicator before streaming starts
            typingIndicator.classList.add('hidden');
            stopTypingTimer();

            // Stream the response token-by-token from backend
            await streamResponseFromServer(response);

        } catch(err) {
            console.error("Chat fetch error:", err);
            addMessage('bot', "My brain fizzled. The server might be busy. Try again?");
        } finally {
            typingIndicator.classList.add('hidden');
            stopTypingTimer();
            sendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    // --- Add message utility ---
    function addMessage(sender, text) {
        const chatLog = document.getElementById('chat-log');
        if(!chatLog) return;
        const row = document.createElement('div');
        row.className = 'message-row animate-msg';
        if (sender === 'user') {
            row.classList.add('msg-right');
            row.innerHTML = `
                <div class="msg-right-wrapper">
                    <div class="message-bubble user-bubble">
                        <p class="leading-relaxed text-base font-medium">${escapeHtml(text)}</p>
                    </div>
                </div>`;
        } else {
            row.classList.add('msg-left');
            row.innerHTML = `
                <div class="avatar w-8 h-8 rounded-full bg-lavender_soft dark:bg-night_panel flex items-center justify-center flex-shrink-0 mb-1 border border-lavender_border/50 dark:border-white/10">
                    <i class="ph-fill ph-flower-lotus text-lavender_text dark:text-white text-sm"></i>
                </div>
                <div class="message-bubble bot-bubble px-6 py-4">
                    <p class="leading-relaxed text-base font-medium">${escapeHtml(text)}</p>
                </div>`;
        }
        chatLog.appendChild(row);
        requestAnimationFrame(()=> row.style.opacity = '1');
        chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
    }

    // --- Optimized streaming from server-sent events ---
    async function streamResponseFromServer(response) {
        const chatLog = document.getElementById('chat-log');
        if (!chatLog) return;

        // Create bot message with GPU-optimized animation
        const row = document.createElement('div');
        row.className = 'message-row animate-msg streaming';
        row.style.willChange = 'transform, opacity';

        row.innerHTML = `
            <div class="avatar w-8 h-8 rounded-full bg-lavender_soft dark:bg-night_panel flex items-center justify-center flex-shrink-0 mb-1 border border-lavender_border/50 dark:border-white/10">
                <i class="ph-fill ph-flower-lotus text-lavender_text dark:text-white text-sm"></i>
            </div>
            <div class="message-bubble bot-bubble px-6 py-4">
                <p class="leading-relaxed text-base font-medium"><span class="stream-content"></span><span class="stream-cursor">|</span></p>
            </div>`;

        chatLog.appendChild(row);

        // Use requestAnimationFrame for smooth initial render
        requestAnimationFrame(() => {
            row.style.transform = 'translateY(0)';
            row.style.opacity = '1';
        });

        const streamContent = row.querySelector('.stream-content');
        const streamCursor = row.querySelector('.stream-cursor');

        // Performance optimization: use textContent instead of innerHTML
        let fullText = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();

                        if (data === '[DONE]') {
                            // Streaming completed
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.error) {
                                // Handle error case
                                streamContent.textContent = `Error: ${parsed.error}`;
                                break;
                            }

                            if (parsed.token) {
                                fullText += parsed.token;
                                streamContent.textContent = fullText;

                                // Use transform for smooth scrolling (GPU-accelerated)
                                chatLog.scrollTo({
                                    top: chatLog.scrollHeight,
                                    behavior: 'smooth'
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing streaming data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading stream:', error);
            streamContent.textContent = 'Streaming error occurred';
        }

        // Clean up streaming animation
        streamCursor.style.display = 'none';
        row.classList.remove('streaming');

        // Final smooth scroll
        chatLog.scrollTo({
            top: chatLog.scrollHeight,
            behavior: 'smooth'
        });
    }

    // --- Scroll helper ---
    function scrollToBottom(smooth = true) {
        if(smooth) chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
        else chatLog.scrollTop = chatLog.scrollHeight;
    }

    // --- Typing timer ---
    function startTypingTimer() {
        typingStartTime = Date.now();
        typingTimerInterval = setInterval(() => {
            if(typingStartTime) {
                const elapsed = Math.floor((Date.now() - typingStartTime)/1000);
                const minutes = Math.floor(elapsed/60), seconds = elapsed % 60;
                typingTimer.textContent = minutes>0 ? `${minutes}:${String(seconds).padStart(2,'0')}` : `${seconds}s`;
            }
        }, 100);
    }
    function stopTypingTimer() {
        if(typingTimerInterval) { clearInterval(typingTimerInterval); typingTimerInterval = null; }
        typingStartTime = null;
        if(typingTimer) typingTimer.textContent = '';
    }

   
    // --- Memory panel open/close & load ---
    settingsButton.addEventListener('click', () => {
        memoryPanel.classList.remove('hidden');
        loadListeningPreferences();
    });
    document.getElementById('close-memory-button').addEventListener('click', () => { memoryPanel.classList.add('hidden'); });

    async function loadMemory() {
        memoryList.innerHTML = '<div class="flex justify-center py-10"><div class="typing-dot"></div></div>';
        try {
            const res = await fetch(`/memory/`); // Relative path
            const data = await res.json();
            memoryList.innerHTML = '';
            if(!data.memories || data.memories.length === 0) {
                memoryList.innerHTML = '<div class="text-center text-muted py-10 font-serif italic text-sm">The book is empty.</div>';
                return;
            }
            data.memories.forEach(mem => {
                const div = document.createElement('div');
                div.className = 'bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm flex justify-between items-center group transition-all hover:border-lavender_border';
                const infoDiv = document.createElement('div');
                infoDiv.innerHTML = `<p class="text-[10px] text-lavender_text dark:text-white font-bold uppercase tracking-widest mb-1 font-sans">${escapeHtml(mem.key)}</p><p class="text-ink dark:text-gray-300 font-serif italic text-base line-clamp-2">${escapeHtml(mem.value)}</p>`;
                const btn = document.createElement('button');
                btn.className = 'w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-muted hover:text-ink transition-colors opacity-0 group-hover:opacity-100';
                btn.innerHTML = `<i class="ph ph-trash text-sm"></i>`;
                btn.addEventListener('click', ()=> { confirmForget(mem.id, mem.key); });
                div.appendChild(infoDiv);
                div.appendChild(btn);
                memoryList.appendChild(div);
            });
        } catch(e) {
            console.error("Error loading memory:", e);
            memoryList.innerHTML = '<p class="text-center text-red-400">Failed to load memories.</p>';
        }
    }

    // --- Dedicated Memories Area ---
    async function loadMemoriesArea() {
        if (!memoriesArea) return;

        memoriesArea.innerHTML = '<div class="flex justify-center py-4"><div class="typing-dot"></div></div>';
        try {
            const res = await fetch(`/memory/`); // Relative path
            const data = await res.json();
            memoriesArea.innerHTML = '';

            if(!data.memories || data.memories.length === 0) {
                memoriesArea.innerHTML = '<div class="text-center text-muted py-4 font-serif italic text-xs">No memories stored yet.</div>';
                return;
            }

            data.memories.forEach(mem => {
                const memoryCard = document.createElement('div');
                memoryCard.className = 'memory-card bg-lavender_soft/20 dark:bg-white/5 p-3 rounded-lg border border-lavender_border/30 dark:border-white/10 hover:border-lavender_border/50 transition-all group';

                const memoryContent = document.createElement('div');
                memoryContent.className = 'flex items-start justify-between gap-2';

                const memoryInfo = document.createElement('div');
                memoryInfo.className = 'flex-1 min-w-0';
                memoryInfo.innerHTML = `
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-4 h-4 rounded-full bg-lavender_soft dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                            <i class="ph-fill ph-notebook text-lavender_text dark:text-white text-xs"></i>
                        </div>
                        <p class="text-[9px] text-lavender_text dark:text-white font-bold uppercase tracking-widest font-sans truncate">${escapeHtml(mem.key)}</p>
                    </div>
                    <p class="text-ink dark:text-gray-300 font-serif text-sm leading-relaxed line-clamp-2">${escapeHtml(mem.value)}</p>
                `;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'w-6 h-6 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0';
                deleteBtn.innerHTML = `<i class="ph ph-trash text-xs"></i>`;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    confirmForgetMemory(mem.id, mem.key);
                });

                memoryContent.appendChild(memoryInfo);
                memoryContent.appendChild(deleteBtn);
                memoryCard.appendChild(memoryContent);

                memoriesArea.appendChild(memoryCard);
            });

        } catch(e) {
            console.error("Error loading memories area:", e);
            memoriesArea.innerHTML = '<p class="text-center text-red-400 text-xs">Failed to load memories.</p>';
        }
    }

    // --- Mood panel ---
    moodButton.addEventListener('click', ()=> {
        moodPanel.classList.remove('hidden');
        loadJournal();
        loadMemoriesArea(); // Load memories when Journal panel opens
    });
    document.getElementById('close-mood-button').addEventListener('click', ()=> { moodPanel.classList.add('hidden'); });

    // Refresh memories button (now in Journal panel)
    if (refreshMemoriesBtn) {
        refreshMemoriesBtn.addEventListener('click', () => {
            loadMemoriesArea();
        });
    }

    async function loadMoods() {
        moodList.innerHTML = '<div class="flex justify-center py-5"><div class="typing-dot"></div></div>';
        try {
            const res = await fetch(`/mood-history`); // Relative path
            const data = await res.json();
            moodList.innerHTML = '';
            adviceText.textContent = `"${data.advice}"`;

            if(!data.history || data.history.length === 0) {
                moodList.innerHTML = '<div class="text-center text-muted py-5 text-sm">No pulse detected yet.</div>';
                vibeText.textContent = "Waiting...";
                renderChart([], []);
                return;
            }

            const chartData = [...data.history].reverse();
            const labels = [], scores = [];
            chartData.forEach(item => {
                if(!item || !item[0]) return;
                const d = new Date(item[0]);
                labels.push(d.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
                scores.push(item[1]);
            });

            const latestScore = data.history[0][1];
            setVibeText(latestScore);
            renderChart(labels, scores);

            // render list
            data.history.forEach(item => {
                if(!item || !item[0]) return;
                const dateObj = new Date(item[0]);
                const isToday = new Date().toDateString() === dateObj.toDateString();
                const displayDate = isToday ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const score = item[1];
                const count = item[2];
                let label = "Neutral", barColor = "bg-gray-300";
                if(score >= 0.5) { label="Radiant"; barColor = "bg-lavender_border"; }
                else if(score >= 0.1) { label="Good"; barColor = "bg-lavender_border"; }
                else if(score <= -0.5) { label="Heavy"; barColor = "bg-rose-300"; }
                else if(score <= -0.1) { label="Low"; barColor = "bg-rose-200"; }
                const intensity = Math.abs(score) * 100;
                const div = document.createElement('div');
                div.className = 'flex flex-col gap-2';
                div.innerHTML = `
                    <div class="flex justify-between items-end">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-ink dark:text-white">${label}</span>
                            ${count ? `<span class="text-[10px] text-muted bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">${count} entries</span>` : ''}
                        </div>
                        <span class="text-[10px] text-muted font-mono">${displayDate}</span>
                    </div>
                    <div class="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width: ${Math.max(intensity,10)}%"></div>
                    </div>
                `;
                moodList.appendChild(div);
            });

        } catch(e) {
            console.error("Error loading moods:", e);
            moodList.innerHTML = '<p class="text-center text-red-400">Failed to read pulse.</p>';
        }
    }

    // --- Journal panel (combined memories and moods) ---
    async function loadJournal() {
        const journalList = document.getElementById('journal-list');
        if (!journalList) {
            console.error('Journal list element not found');
            return;
        }

        journalList.innerHTML = '<div class="flex justify-center py-5"><div class="typing-dot"></div></div>';

        try {
            // Load mood data for chart and advice
            const moodResponse = await fetch('/mood-history');
            if (!moodResponse.ok) {
                console.error('Failed to fetch mood history:', moodResponse.status);
                adviceText.textContent = '"Unable to load advice"';
                return;
            }
            const moodData = await moodResponse.json();
            console.log('Mood data received:', moodData);

            if (moodData.advice) {
                adviceText.textContent = `"${moodData.advice}"`;
            } else {
                adviceText.textContent = '"No advice available"';
            }

            // Load combined journal data
            const journalResponse = await fetch('/api/journal');
            if (!journalResponse.ok) {
                console.error('Failed to fetch journal data:', journalResponse.status);
                journalList.innerHTML = '<p class="text-center text-red-400">Failed to load journal.</p>';
                return;
            }
            const journalData = await journalResponse.json();
            console.log('Journal data received:', journalData);

            journalList.innerHTML = '';

            if (!journalData.entries || journalData.entries.length === 0) {
                journalList.innerHTML = '<div class="text-center text-muted py-5 text-sm">No journal entries yet.</div>';
                setVibeText(0);
                renderChart([], []);
                return;
            }

            // Process mood data for chart
            const moodEntries = moodData.history || [];
            const chartData = [...moodEntries].reverse();
            const labels = [], scores = [];
            chartData.forEach(item => {
                if (!item || !item[0]) return;
                const d = new Date(item[0]);
                labels.push(d.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
                scores.push(item[1]);
            });

            const latestScore = moodEntries.length > 0 ? moodEntries[0][1] : 0;
            setVibeText(latestScore);
            renderChart(labels, scores);

            // Render combined journal entries
            journalData.entries.forEach(entry => {
                if (entry.type === 'memory') {
                    renderMemoryEntry(journalList, entry);
                } else if (entry.type === 'mood') {
                    renderMoodEntry(journalList, entry);
                }
            });

        } catch(e) {
            console.error("Error loading journal:", e);
            journalList.innerHTML = '<p class="text-center text-red-400">Failed to load journal.</p>';
        }
    }

    function renderMemoryEntry(container, entry) {
        const dateObj = new Date(entry.timestamp);
        const displayDate = dateObj.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

        const div = document.createElement('div');
        div.className = 'bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm mb-3';
        div.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2">
                    <div class="w-6 h-6 rounded-full bg-lavender_soft dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <i class="ph-fill ph-notebook text-lavender_text dark:text-white text-xs"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-[10px] text-lavender_text dark:text-white font-bold uppercase tracking-widest mb-1">${escapeHtml(entry.key)}</p>
                        <p class="text-ink dark:text-gray-300 text-sm line-clamp-2">${escapeHtml(entry.value)}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <button onclick="confirmForget(${entry.id}, '${escapeHtml(entry.key)}')" class="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-muted hover:text-ink transition-colors opacity-0 hover:opacity-100">
                        <i class="ph ph-trash text-xs"></i>
                    </button>
                    <span class="text-[9px] text-muted font-mono">${displayDate}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    }

    function renderMoodEntry(container, entry) {
        const dateObj = new Date(entry.timestamp);
        const displayDate = dateObj.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

        let label = entry.label || "Neutral";
        let barColor = "bg-gray-300";
        if(entry.score >= 0.5) { label="Radiant"; barColor = "bg-lavender_border"; }
        else if(entry.score >= 0.1) { label="Good"; barColor = "bg-lavender_border"; }
        else if(entry.score <= -0.5) { label="Heavy"; barColor = "bg-rose-300"; }
        else if(entry.score <= -0.1) { label="Low"; barColor = "bg-rose-200"; }

        const intensity = Math.abs(entry.score) * 100;

        const div = document.createElement('div');
        div.className = 'bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm mb-3';
        div.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-2">
                    <div class="w-6 h-6 rounded-full bg-lavender_soft dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <i class="ph-fill ph-heartbeat text-lavender_text dark:text-white text-xs"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-sm font-medium text-ink dark:text-white">${label}</span>
                            ${entry.count ? `<span class="text-[9px] text-muted bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md">${entry.count} messages</span>` : ''}
                            ${entry.topic ? `<span class="text-[9px] text-muted bg-lavender_soft/20 dark:bg-white/5 px-1.5 py-0.5 rounded-md">${escapeHtml(entry.topic)}</span>` : ''}
                        </div>
                        <div class="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width: ${Math.max(intensity,10)}%"></div>
                        </div>
                    </div>
                </div>
                <span class="text-[9px] text-muted font-mono">${displayDate}</span>
            </div>
        `;
        container.appendChild(div);
    }

    function setVibeText(score) {
        if(score > 0.5) vibeText.textContent = "Radiant ✨";
        else if(score > 0.1) vibeText.textContent = "Gentle 🍃";
        else if(score > -0.1) vibeText.textContent = "Calm ☁️";
        else if(score > -0.5) vibeText.textContent = "Cloudy 🌧️";
        else vibeText.textContent = "Heavy 🌑";
    }

    function renderChart(labels, dataPoints) {
        const ctx = document.getElementById('moodChart').getContext('2d');
        if(moodChartInstance) moodChartInstance.destroy();
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
        const tickColor = isDark ? '#8E8894' : '#5B4B6E';
        const getWarmColor = (value) => {
            if(value >= 0.5) return '#FF8C69';
            if(value >= 0.1) return '#FFB347';
            if(value >= -0.1) return '#DDA0DD';
            if(value >= -0.5) return '#DA70D6';
            return '#C71585';
        };
        const getWarmFillColor = (value) => {
            if(value >= 0.5) return isDark ? 'rgba(255,140,105,0.15)' : 'rgba(255,140,105,0.25)';
            if(value >= 0.1) return isDark ? 'rgba(255,179,71,0.15)' : 'rgba(255,179,71,0.25)';
            if(value >= -0.1) return isDark ? 'rgba(221,160,221,0.15)' : 'rgba(221,160,221,0.25)';
            if(value >= -0.5) return isDark ? 'rgba(218,112,214,0.15)' : 'rgba(218,112,214,0.25)';
            return isDark ? 'rgba(199,21,133,0.15)' : 'rgba(199,21,133,0.25)';
        };
        const gradient = ctx.createLinearGradient(0,0,0,180);
        const avgValue = dataPoints.length > 0 ? dataPoints.reduce((a,b)=>a+b,0)/dataPoints.length : 0;
        gradient.addColorStop(0, getWarmColor(Math.max(avgValue,0.3)));
        gradient.addColorStop(1, getWarmColor(Math.min(avgValue,-0.3)));

        moodChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vibe',
                    data: dataPoints,
                    borderColor: '#FF8C69',
                    backgroundColor: (context) => {
                        if (!context.chart.chartArea) return 'rgba(255,140,105,0.1)';
                        const value = dataPoints[context.dataIndex];
                        return getWarmFillColor(value);
                    },
                    borderWidth: 2.5,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: (context) => {
                        const value = dataPoints[context.dataIndex];
                        return getWarmColor(value);
                    },
                    pointBorderColor: '#FFF',
                    pointBorderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: -1, max: 1, grid: { drawBorder: false, color: gridColor }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: isDark ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255,255,255,0.95)',
                        titleColor: isDark ? '#E0DEE6' : '#2D2A32',
                        bodyColor: isDark ? '#E0DEE6' : '#2D2A32',
                        borderColor: '#FF8C69',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    // --- Modal logic (confirm) ---
    function confirmForget(id, keyName) {
        onConfirm = async () => {
            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            await fetch(`/memory/forget`, { method:'POST', headers: headers, body: JSON.stringify({ id }) });
            loadMemory();
            closeModal();
        };
        modalTitle.textContent = "Forget this?";
        modalMessage.innerHTML = `Forget <span class="font-serif italic">"${escapeHtml(keyName)}"</span>?`;
        modal.classList.remove('hidden');
    }

    function confirmForgetMemory(id, keyName) {
        onConfirm = async () => {
            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            await fetch(`/memory/forget`, { method:'POST', headers: headers, body: JSON.stringify({ id }) });
            loadMemoriesArea(); // Refresh the memories area
            loadMemory(); // Also refresh the old memory list if it's being used
            closeModal();
        };
        modalTitle.textContent = "Forget Memory?";
        modalMessage.innerHTML = `Remove memory <span class="font-serif italic">"${escapeHtml(keyName)}"</span>?`;
        modal.classList.remove('hidden');
    }
    function closeModal() { modal.classList.add('hidden'); onConfirm = null; }
    modalConfirm.addEventListener('click', ()=>{ if(onConfirm) onConfirm(); });
    modalCancel.addEventListener('click', closeModal);

        
    
    // --- Privacy stubs ---
    // === FIX: Corrected URL from /mood-export to /export/mood-history ===
    document.getElementById('export-moods-btn').addEventListener('click', ()=> window.open(`/export/mood-history`));
    // === END OF FIX ===

    document.getElementById('clear-data-btn').addEventListener('click', ()=>{
        onConfirm = async ()=> { 
            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }
            await fetch(`/memory/erase-all`,{method:'POST', headers: headers}); 
            loadMemory(); 
            closeModal(); 
            addMessage('bot', "I've cleared all our data, as requested."); 
        };
        modalTitle.textContent = "Clear All Data?";
        modalMessage.innerHTML = `This will permanently delete all your memories and mood history. Are you sure?`;
        modal.classList.remove('hidden');
    });
    document.getElementById('memory-toggle').addEventListener('change', (e)=> { console.log("Memory enabled:", e.target.checked); });

    // --- Listening mode toggles & pref loading ---
    const listeningModeToggle = document.getElementById('listening-mode-toggle'),
          listeningModeOptions = document.getElementById('listening-mode-options'),
          listeningModeIndicator = document.getElementById('listening-mode-indicator'),
          listeningMemoryToggle = document.getElementById('listening-memory-toggle');
    async function loadListeningPreferences() {
        try {
            const res = await fetch(`/preferences/`); // Relative path
            if(res.ok) {
                const prefs = await res.json();
                
                // Load listening mode settings
                listeningModeToggle.checked = prefs.listening_mode || false;
                listeningMemoryToggle.checked = prefs.listening_memory_policy || false;
                if(prefs.listening_mode) {
                    listeningModeOptions.classList.remove('hidden');
                    listeningModeIndicator.classList.remove('hidden');
                    listeningModeIndicator.classList.add('flex');
                } else {
                    listeningModeOptions.classList.add('hidden');
                    listeningModeIndicator.classList.add('hidden');
                    listeningModeIndicator.classList.remove('flex');
                }

                
            }
        } catch(e) { console.error("Failed to load listening prefs:", e); }
    }

    listeningModeToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        try {
            const headers = { 'Content-Type': 'application/json' };
            if(csrfToken) headers['X-CSRF-Token'] = csrfToken;
            const res = await fetch(`/preferences/listening-mode`, {
                method:'POST',
                headers,
                body: JSON.stringify({ enabled: enabled, memory_policy: listeningMemoryToggle.checked, tts_muted: true })
            });
            if(res.ok) {
                if(enabled) { listeningModeOptions.classList.remove('hidden'); listeningModeIndicator.classList.remove('hidden'); listeningModeIndicator.classList.add('flex'); }
                else { listeningModeOptions.classList.add('hidden'); listeningModeIndicator.classList.add('hidden'); listeningModeIndicator.classList.remove('flex'); }
            } else { e.target.checked = !enabled; }
        } catch(err) { console.error("Failed to toggle listening mode:", err); e.target.checked = !enabled; }
    });

    listeningMemoryToggle.addEventListener('change', async (e)=> {
        if(listeningModeToggle.checked) {
            const headers = { 'Content-Type': 'application/json' };
            if(csrfToken) headers['X-CSRF-Token'] = csrfToken;
            await fetch(`/preferences/listening-mode`, { method:'POST', headers, body: JSON.stringify({ enabled:true, memory_policy: e.target.checked, tts_muted: true }) });
        }
    });

    
    // --- welcome popup handling ---
    const hasSeenWelcome = localStorage.getItem('warmth_welcome_seen');
    if(!hasSeenWelcome) setTimeout(()=> welcomePopup.classList.remove('hidden'), 500);
    welcomeClose.addEventListener('click', ()=> { welcomePopup.classList.add('hidden'); localStorage.setItem('warmth_welcome_seen','true'); });
    welcomePopup.addEventListener('click', (e)=> { if(e.target === welcomePopup) { welcomePopup.classList.add('hidden'); localStorage.setItem('warmth_welcome_seen','true'); } });
    
    // Auth has been removed - no need to fetch auth status
    // Load preferences on load
    loadListeningPreferences();

}); // end DOMContentLoaded

