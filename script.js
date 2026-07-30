document.addEventListener("DOMContentLoaded", () => {

    const isMobile = window.innerWidth < 768;

    // =====================================================
    // 1. CONTINUOUS BALLOON ENGINE (BURST + INFINITE FLOW)
    // =====================================================

    const container = document.getElementById("balloon-container");

    const PALETTES = [
        ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#ffb703", "#fb8500"],
        ["#ffcad4", "#b5e2fa", "#f7d6e0", "#f2b5d4", "#7bdff2", "#e8ae5e", "#f15bb5"],
        ["#d90429", "#ef233c", "#0077b6", "#00b4d8", "#38b000", "#ffb703", "#7209b7"]
    ];

    const currentPalette = PALETTES[Math.floor(Math.random() * PALETTES.length)];

    function getPaletteColor() {
        return currentPalette[Math.floor(Math.random() * currentPalette.length)];
    }

    const CLUSTERS = [
        { xRatio: 0.20, spread: 180 },
        { xRatio: 0.50, spread: 220 },
        { xRatio: 0.80, spread: 180 }
    ];

    function createBalloon(clusterIndex) {
        if (!container) return;
        const balloon = document.createElement("div");

        const layerRand = Math.random();
        let layer = "layer-mid";
        if (layerRand < 0.20) layer = "layer-back";
        else if (layerRand > 0.85) layer = "layer-front";

        balloon.className = `balloon ${layer}`;

        let minSize = 65, maxSize = 120;
        if (layer === "layer-back") { minSize = 40; maxSize = 65; }
        if (layer === "layer-front") { minSize = 130; maxSize = 180; }

        const size = minSize + Math.random() * (maxSize - minSize);

        const cluster = CLUSTERS[clusterIndex !== undefined ? clusterIndex : Math.floor(Math.random() * CLUSTERS.length)];
        const originX = window.innerWidth * cluster.xRatio;
        const spawnOffsetX = (Math.random() - 0.5) * cluster.spread;
        const left = Math.max(10, Math.min(window.innerWidth - size - 10, originX + spawnOffsetX));

        const outwardThrust = (left - originX) * 0.8;
        const smallness = 1 - (size - minSize) / (maxSize - minSize);
        const maxDrift = 20 + smallness * 100;
        const drift = ((Math.random() * maxDrift * 2 - maxDrift) + outwardThrust).toFixed(1) + "px";

        const duration = 4.2 + Math.random() * 2.2;

        const rotation = (Math.random() * 24 - 12) + "deg";
        const wobble = (1.5 + Math.random() * 3.5).toFixed(1) + "deg";
        const wobbleX = (2 + Math.random() * 5).toFixed(1) + "px";
        const swayDuration = (1.2 + Math.random() * 1.4).toFixed(2) + "s";

        const color = getPaletteColor();
        const gradientId = "g" + crypto.randomUUID();

        balloon.style.left = left + "px";
        balloon.style.width = size + "px";
        balloon.style.height = size * 1.45 + "px";
        balloon.style.animationDuration = duration + "s";
        balloon.style.setProperty("--drift", drift);
        balloon.style.setProperty("--rotation", rotation);
        balloon.style.setProperty("--wobble", wobble);
        balloon.style.setProperty("--wobble-x", wobbleX);
        balloon.style.setProperty("--sway-duration", swayDuration);

        balloon.innerHTML = `
            <svg viewBox="0 0 100 170">
                <defs>
                    <radialGradient id="${gradientId}" cx="35%" cy="30%">
                        <stop offset="0%" stop-color="white" stop-opacity=".85"/>
                        <stop offset="30%" stop-color="${color}"/>
                        <stop offset="100%" stop-color="${shade(color, -30)}"/>
                    </radialGradient>
                </defs>
                <ellipse cx="50" cy="55" rx="36" ry="46" fill="url(#${gradientId})" />
                <ellipse cx="37" cy="35" rx="9" ry="17" fill="white" opacity=".42"/>
                <polygon points="45,98 55,98 50,110" fill="${shade(color, -20)}"/>
                <path class="string" d="M50 110 C60 135 35 145 50 170"/>
            </svg>
        `;

        container.appendChild(balloon);

        balloon.addEventListener("animationend", () => {
            balloon.remove();
        });
    }

    function shade(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = Math.min(255, Math.max(0, R));
        G = Math.min(255, Math.max(0, G));
        B = Math.min(255, Math.max(0, B));

        return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
    }

    function spawnWave(count, spreadTimeMs = 1200) {
        for (let i = 0; i < count; i++) {
            const clusterIndex = i % 3;
            setTimeout(() => createBalloon(clusterIndex), Math.random() * spreadTimeMs);
        }
    }

    let continuousInterval = null;
    let burstTimeout = null;

    function triggerSectionBalloons(sectionIndex) {
        if (continuousInterval) clearInterval(continuousInterval);
        if (burstTimeout) clearTimeout(burstTimeout);

        document.body.classList.add("active-release");

        if (sectionIndex === 0) {
            spawnWave(35, 1200);

            burstTimeout = setTimeout(() => {
                continuousInterval = setInterval(() => {
                    spawnWave(10, 1500);
                }, 2500);
            }, 1500);

        } else {
            spawnWave(18, 1000);

            burstTimeout = setTimeout(() => {
                continuousInterval = setInterval(() => {
                    spawnWave(9, 1800);
                }, 2800);
            }, 1200);
        }
    }

    triggerSectionBalloons(0);

    // =====================================================
    // 2. SCROLL CONTROLLER & INDICATOR MANAGER
    // =====================================================

    const pages = document.querySelectorAll(".page");
    const scrollIndicator = document.getElementById("scroll-indicator");
    let currentIndex = 0;
    let isScrolling = false;
    const scrollCooldown = 800;

    function updateScrollIndicator() {
        if (!scrollIndicator) return;
        if (currentIndex === pages.length - 1 || isOpened) {
            scrollIndicator.classList.add("hidden-indicator");
        } else {
            scrollIndicator.classList.remove("hidden-indicator");
        }
    }

    function scrollToSection(index) {
        if (index < 0 || index >= pages.length) return;

        isScrolling = true;
        const previousIndex = currentIndex;
        currentIndex = index;

        pages[currentIndex].scrollIntoView({
            behavior: "smooth"
        });

        // Enable pinkish background state when scrolling to Section 2
        if (currentIndex === 1) {
            document.body.classList.add("section-2-active");
        } else {
            document.body.classList.remove("section-2-active");
        }

        updateScrollIndicator();

        if (previousIndex !== currentIndex) {
            triggerSectionBalloons(currentIndex);
        }

        setTimeout(() => {
            isScrolling = false;
        }, scrollCooldown);
    }

    window.addEventListener("wheel", (e) => {
        if (isScrolling) return;

        if (e.deltaY > 0) {
            scrollToSection(currentIndex + 1);
        } else if (e.deltaY < 0) {
            scrollToSection(currentIndex - 1);
        }
    }, { passive: false });

    window.addEventListener("keydown", (e) => {
        if (isScrolling) return;

        if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
            e.preventDefault();
            scrollToSection(currentIndex + 1);
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
            e.preventDefault();
            scrollToSection(currentIndex - 1);
        }
    });

    let touchStartY = 0;

    window.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchend", (e) => {
        if (isScrolling) return;

        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchStartY - touchEndY;

        if (Math.abs(diffY) > 50) {
            if (diffY > 0) {
                scrollToSection(currentIndex + 1);
            } else {
                scrollToSection(currentIndex - 1);
            }
        }
    }, { passive: true });

    // =====================================================
    // 3. SECTION 1: AGE COUNTER
    // =====================================================

    const birthDate = new Date("2009-08-04T00:00:00");

    const yearsEl = document.getElementById("years");
    const monthsEl = document.getElementById("months");
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    function updateAgeCounter() {
        const now = new Date();
        
        let years = now.getFullYear() - birthDate.getFullYear();
        let months = now.getMonth() - birthDate.getMonth();
        let days = now.getDate() - birthDate.getDate();
        let hours = now.getHours() - birthDate.getHours();
        let minutes = now.getMinutes() - birthDate.getMinutes();
        let seconds = now.getSeconds() - birthDate.getSeconds();

        if (seconds < 0) { seconds += 60; minutes--; }
        if (minutes < 0) { minutes += 60; hours--; }
        if (hours < 0) { hours += 24; days--; }
        if (days < 0) {
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }
        if (months < 0) { months += 12; years--; }

        const pad = (num) => String(num).padStart(2, '0');

        if (yearsEl) yearsEl.textContent = pad(years);
        if (monthsEl) monthsEl.textContent = pad(months);
        if (daysEl) daysEl.textContent = pad(days);
        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minutesEl) minutesEl.textContent = pad(minutes);
        if (secondsEl) secondsEl.textContent = pad(seconds);
    }

    setInterval(updateAgeCounter, 1000);
    updateAgeCounter();

    // =====================================================
    // 4. SECTION 2: ENVELOPE & WRAP-SAFE HANDWRITING ENGINE
    // =====================================================

    const bgMusic = document.getElementById("bg-music");
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const glassCard = document.getElementById("glass-card");
    const glassContent = document.getElementById("typewriter-content");

    let isOpened = false;

    const lines = [
        "ni-hao,",
        "To my deerest and prettiest someone, may your life be filled with everything"
    ];

    function playAudio() {
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch((err) => {
                console.log("Audio play error:", err);
            });
        }
    }

    if (envelopeWrapper) {
        envelopeWrapper.addEventListener("click", (e) => {
            e.stopPropagation();

            if (isOpened) return;
            isOpened = true;

            updateScrollIndicator();
            playAudio();
            envelopeWrapper.classList.add("open");

            setTimeout(() => {
                envelopeWrapper.classList.add("fade-out");
            }, 600);

            setTimeout(() => {
                envelopeWrapper.classList.add("hidden");
                glassCard.classList.remove("hidden");

                requestAnimationFrame(() => {
                    glassCard.classList.add("visible");
                });

                setTimeout(() => {
                    startHandwritingSequence(lines);
                }, 600);

            }, 1100);
        });
    }

    if (glassCard) {
        glassCard.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    function startHandwritingSequence(textArray) {
        glassContent.innerHTML = "";
        const letterSpans = [];

        textArray.forEach((lineText) => {
            const p = document.createElement("p");
            const words = lineText.split(" ");

            words.forEach((word, wordIdx) => {
                const wordSpan = document.createElement("span");
                wordSpan.className = "word-span";

                const chars = word.split("");
                chars.forEach((char) => {
                    const charSpan = document.createElement("span");
                    charSpan.className = "fade-letter";
                    charSpan.textContent = char;
                    
                    wordSpan.appendChild(charSpan);
                    letterSpans.push({
                        element: charSpan,
                        char: char
                    });
                });

                p.appendChild(wordSpan);

                if (wordIdx < words.length - 1) {
                    const spaceSpan = document.createElement("span");
                    spaceSpan.className = "fade-letter";
                    spaceSpan.innerHTML = "&nbsp;";
                    p.appendChild(spaceSpan);

                    letterSpans.push({
                        element: spaceSpan,
                        char: " "
                    });
                }
            });

            glassContent.appendChild(p);
        });

        // Pen tip cursor element
        const penTip = document.createElement("span");
        penTip.className = "pen-tip";
        glassContent.lastElementChild.appendChild(penTip);

        let currentIndex = 0;

        function typeNextChar() {
            if (currentIndex < letterSpans.length) {
                const item = letterSpans[currentIndex];
                item.element.classList.add("in");

                // Move pen tip behind current letter
                item.element.after(penTip);

                currentIndex++;
                const delay = item.char === " " ? 60 : Math.floor(Math.random() * 30) + 40;
                setTimeout(typeNextChar, delay);
            } else {
                // Fade out pen cursor when complete
                setTimeout(() => {
                    penTip.style.opacity = "0";
                }, 1000);
            }
        }

        typeNextChar();
    }
});
