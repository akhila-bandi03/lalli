/* ==========================================================================
   GRAND THEATRE SURPRISE — MASTER JAVASCRIPT ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------------------------
    // 1. STATE & DOM ELEMENTS
    // --------------------------------------------------------------------------
    let friendName = 'LALLI';
    let isMusicPlaying = false;
    let audioCtx = null;
    let musicInterval = null;
    let giftLayer = 1;
    let activeCandles = 3;

    // ── Real background song (HTML5 Audio) ───────────────────────────────────
    const bgSong = document.getElementById('bgSongAudio');
    let bgSongReady = false; // true once a src is confirmed playable

    if (bgSong) {
        bgSong.volume = 0.75;
        bgSong.addEventListener('canplaythrough', () => { bgSongReady = true; }, { once: true });
        bgSong.addEventListener('error', () => { bgSongReady = false; }); // file missing → fall back to synth
    }

    function startBgSong() {
        if (!bgSong) return;
        bgSong.currentTime = 0;   // always restart from beginning
        bgSong.loop = true;
        const playPromise = bgSong.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                bgSongReady = true;
                isMusicPlaying = true;
                audioIcon.className = 'fa-solid fa-volume-high';
                audioText.textContent = 'Music ON';
                // Stop synth melody since real song is playing
                if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
            }).catch(() => {
                // Browser blocked autoplay — fall back to synth
                bgSongReady = false;
                startBirthdayMelody();
            });
        }
    }

    function pauseBgSong() {
        if (bgSong && !bgSong.paused) bgSong.pause();
    }

    function resumeBgSong() {
        if (bgSong && bgSong.paused && bgSongReady) bgSong.play().catch(() => {});
    }

    const curtainOverlay = document.getElementById('curtainOverlay');
    const curtainLeft = document.getElementById('curtainLeft');
    const curtainRight = document.getElementById('curtainRight');
    const curtainCard = document.getElementById('curtainCard');
    const enterStageBtn = document.getElementById('enterStageBtn');
    const mainStage = document.getElementById('mainStage');
    const friendNameDisplay = document.getElementById('friendNameDisplay');
    const dynamicNameElements = document.querySelectorAll('.dynamic-friend-name');
    const replayCurtainBtn = document.getElementById('replayCurtainBtn');

    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioText = document.getElementById('audioText');

    const chaosBtn = document.getElementById('chaosBtn');
    const popBalloonsBtn = document.getElementById('popBalloonsBtn');
    const balloonContainer = document.getElementById('balloonContainer');
    const roastToastToggle = document.getElementById('roastToastToggle');

    const customizeBtn = document.getElementById('customizeBtn');
    const customModal = document.getElementById('customModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveCustomBtn = document.getElementById('saveCustomBtn');
    const friendNameInput = document.getElementById('friendNameInput');

    const giftBox = document.getElementById('giftBox');
    const giftLayerBadge = document.getElementById('giftLayerBadge');
    const trophyReveal = document.getElementById('trophyReveal');
    const claimAwardBtn = document.getElementById('claimAwardBtn');


    const fxCanvas = document.getElementById('fxCanvas');
    const ctx = fxCanvas.getContext('2d');

    // --------------------------------------------------------------------------
    // 2. CANVAS PARTICLE & FIREWORKS ENGINE
    // --------------------------------------------------------------------------
    let width = fxCanvas.width = window.innerWidth;
    let height = fxCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = fxCanvas.width = window.innerWidth;
        height = fxCanvas.height = window.innerHeight;
    });

    class Particle {
        constructor(x, y, color, velocityX, velocityY, size = 3, friction = 0.98, gravity = 0.05) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.vx = velocityX;
            this.vy = velocityY;
            this.size = size;
            this.alpha = 1;
            this.friction = friction;
            this.gravity = gravity;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.012;
        }
    }

    let particles = [];

    // Ambient floating golden dust particles
    class DustParticle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.vy = -(Math.random() * 0.4 + 0.1);
            this.vx = (Math.random() - 0.5) * 0.3;
            this.alpha = Math.random() * 0.6 + 0.2;
        }
        update() {
            this.y += this.vy;
            this.x += this.vx;
            if (this.y < 0) this.reset();
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#ffd700';
            ctx.fill();
            ctx.restore();
        }
    }

    let dustParticles = Array.from({ length: 45 }, () => new DustParticle());

    function createFirework(x, y) {
        const colors = ['#ffd700', '#ff2a6d', '#05d9e8', '#ffffff', '#7b2cbf', '#ff9f1c'];
        const numParticles = 60;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i;
            const speed = Math.random() * 7 + 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(x, y, color, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
        playFireworkSound();
    }

    function renderFX() {
        ctx.clearRect(0, 0, width, height);

        // Render Dust
        dustParticles.forEach(d => {
            d.update();
            d.draw();
        });

        // Render Explosive Particles
        particles.forEach((p, index) => {
            if (p.alpha <= 0) {
                particles.splice(index, 1);
            } else {
                p.update();
                p.draw();
            }
        });

        requestAnimationFrame(renderFX);
    }

    renderFX();

    // Trigger Firework Bursts periodically
    function triggerRandomFireworks(count = 5) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const rx = Math.random() * (width * 0.8) + (width * 0.1);
                const ry = Math.random() * (height * 0.5) + (height * 0.1);
                createFirework(rx, ry);
            }, i * 350);
        }
    }

    // --------------------------------------------------------------------------
    // 3. WEB AUDIO API SOUND SYNTHESIS ENGINE
    // --------------------------------------------------------------------------
    function initAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type = 'sine', duration = 0.3, vol = 0.2) {
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.log('Audio playback prevented or unsupported', e);
        }
    }

    function playFanfareSound() {
        // Dramatic Theatre Fanfare chords
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 'triangle', 1.2, 0.3);
            }, i * 150);
        });
    }

    function playPopSound() {
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
    }

    function playFireworkSound() {
        try {
            initAudioContext();
            const bufferSize = audioCtx.sampleRate * 0.3;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);

            noise.start();
        } catch(e) {}
    }

    function playShutterSound() {
        if (!audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const bufferSize = audioCtx.sampleRate * 0.05;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(300, now + 0.05);

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            noise.start(now);
        } catch(e) {}
    }

    // Upbeat Birthday Melody Synthesizer Loop
    const birthdayMelodyNotes = [
        { f: 264, d: 0.3 }, { f: 264, d: 0.3 }, { f: 297, d: 0.6 }, { f: 264, d: 0.6 }, { f: 352, d: 0.6 }, { f: 330, d: 1.0 },
        { f: 264, d: 0.3 }, { f: 264, d: 0.3 }, { f: 297, d: 0.6 }, { f: 264, d: 0.6 }, { f: 396, d: 0.6 }, { f: 352, d: 1.0 },
        { f: 264, d: 0.3 }, { f: 264, d: 0.3 }, { f: 528, d: 0.6 }, { f: 440, d: 0.6 }, { f: 352, d: 0.6 }, { f: 330, d: 0.6 }, { f: 297, d: 0.8 },
        { f: 466, d: 0.3 }, { f: 466, d: 0.3 }, { f: 440, d: 0.6 }, { f: 352, d: 0.6 }, { f: 396, d: 0.6 }, { f: 352, d: 1.2 }
    ];

    function startBirthdayMelody() {
        if (musicInterval) clearInterval(musicInterval);
        let index = 0;

        musicInterval = setInterval(() => {
            if (!isMusicPlaying) return;
            const note = birthdayMelodyNotes[index];
            playTone(note.f, 'sine', note.d, 0.12);
            index = (index + 1) % birthdayMelodyNotes.length;
        }, 500);
    }

    function toggleAudio() {
        initAudioContext();
        isMusicPlaying = !isMusicPlaying;
        if (isMusicPlaying) {
            audioIcon.className = 'fa-solid fa-volume-high';
            audioText.textContent = 'Music ON';
            if (bgSongReady) {
                resumeBgSong();
            } else {
                startBirthdayMelody();
            }
        } else {
            audioIcon.className = 'fa-solid fa-volume-xmark';
            audioText.textContent = 'Music OFF';
            pauseBgSong();
            if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
        }
    }

    audioToggleBtn.addEventListener('click', toggleAudio);

    // --------------------------------------------------------------------------
    // 4. SECTION 1: RED CURTAINS OPENING & CINEMATIC SURPRISE SEQUENCE
    // --------------------------------------------------------------------------
    enterStageBtn.addEventListener('click', openTheatreCurtains);

    const cinematicSpotlight = document.getElementById('cinematicSpotlight');
    const revealStep1 = document.getElementById('revealStep1');
    const revealStep2 = document.getElementById('revealStep2');
    const revealStep3 = document.getElementById('revealStep3');
    const revealStep4 = document.getElementById('revealStep4');
    const revealStep5 = document.getElementById('revealStep5');
    const openHeartBtn = document.getElementById('openHeartBtn');
    const personalLetterSection = document.getElementById('personalLetterSection');

    function createLetterSpans(nameText) {
        if (!revealStep3) return;
        revealStep3.innerHTML = '';
        const uppercaseName = nameText.toUpperCase().trim();
        for (let char of uppercaseName) {
            if (char === ' ') continue;
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = char;
            revealStep3.appendChild(span);
        }
    }

    function openTheatreCurtains() {
        initAudioContext();
        isMusicPlaying = true;
        audioIcon.className = 'fa-solid fa-volume-high';
        audioText.textContent = 'Music ON';

        // 🎵 Start the real song from the very beginning when curtains open
        startBgSong();

        // Fanfare SFX plays alongside song
        playFanfareSound();

        // 1. Curtains Parting Timeline (2.4s)
        const curtainTl = gsap.timeline({
            onComplete: () => {
                curtainOverlay.style.display = 'none';
                mainStage.classList.add('active');
                replayCurtainBtn.classList.remove('hidden');

                // Navigate to Page 2 (Birthday Celebration)
                window.goToStoryPage(1);
            }
        });

        curtainTl.to(curtainCard, {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.in'
        });

        curtainTl.to(curtainLeft, {
            xPercent: -102,
            duration: 2.4,
            ease: 'power3.inOut'
        }, "-=0.3");

        curtainTl.to(curtainRight, {
            xPercent: 102,
            duration: 2.4,
            ease: 'power3.inOut'
        }, "<");
    }

    // Step-by-Step Cinematic Reveal Sequence
    function startCinematicStageSequence() {
        // Build letter spans dynamically for friendName
        createLetterSpans(friendName);

        // Hide all steps initially
        gsap.set([revealStep1, revealStep2, revealStep3, revealStep4, revealStep5], { display: 'none', opacity: 0 });

        const stageTl = gsap.timeline();

        // Step A: Dark Stage Pause (~1.0 sec)
        stageTl.to({}, { duration: 1.0 });

        // Step B: Warm Spotlight slowly appears in center of stage
        stageTl.add(() => {
            if (cinematicSpotlight) cinematicSpotlight.classList.add('active');
            playTone(220, 'sine', 1.5, 0.15);
        });

        stageTl.to({}, { duration: 0.8 });

        // Step C: Reveal "✨ A little surprise for you..."
        stageTl.add(() => {
            revealStep1.style.display = 'block';
        });
        stageTl.to(revealStep1, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
        stageTl.to({}, { duration: 1.3 }); // pause
        stageTl.to(revealStep1, { opacity: 0, y: -20, duration: 0.6, ease: 'power2.in' });
        stageTl.add(() => { revealStep1.style.display = 'none'; });

        // Step D: Smoothly reveal "🎂 HAPPY BIRTHDAY"
        stageTl.add(() => {
            revealStep2.style.display = 'block';
        });
        stageTl.to(revealStep2, { opacity: 1, scale: 1, duration: 1.0, ease: 'back.out(1.4)' });
        stageTl.to({}, { duration: 1.2 }); // pause
        stageTl.to(revealStep2, { opacity: 0, scale: 0.9, duration: 0.6, ease: 'power2.in' });
        stageTl.add(() => { revealStep2.style.display = 'none'; });

        // Step E: Dramatic Letter-by-Letter Reveal "L A L L I"
        stageTl.add(() => {
            revealStep3.style.display = 'flex';
            const letters = revealStep3.querySelectorAll('.letter');
            letters.forEach((letEl, idx) => {
                setTimeout(() => {
                    playTone(320 + idx * 80, 'sine', 0.3, 0.2);
                }, idx * 250);
            });
            gsap.to(letters, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.25,
                ease: 'back.out(1.8)'
            });
        });

        stageTl.to({}, { duration: 2.2 }); // pause on full letter display
        stageTl.to(revealStep3, { opacity: 0, scale: 1.1, duration: 0.6, ease: 'power2.in' });
        stageTl.add(() => { revealStep3.style.display = 'none'; });

        // Step F: Combine into "❤️ HAPPY BIRTHDAY LALLI ❤️"
        stageTl.add(() => {
            revealStep4.style.display = 'block';
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 90,
                    origin: { y: 0.5 }
                });
            }
            triggerRandomFireworks(4);
            spawnBalloons(12);
        });

        stageTl.to(revealStep4, {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: 'elastic.out(1, 0.6)'
        });

        // Step G: Wait 1.5 seconds, then reveal large elegant button "💌 OPEN MY HEART ❤️"
        stageTl.to({}, { duration: 1.5 });

        stageTl.add(() => {
            revealStep5.style.display = 'block';
        });

        stageTl.to(revealStep5, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: 'back.out(1.7)'
        });
    }

    // Editable Best Friend Letter Template (Single JavaScript Variable)
    window.letterTextContent = `Hey {NAME} ❤️,

First of all...

HAPPY BIRTHDAYYY! 🎂🥳

Honestly, calling you my best friend sounds nice...

but sometimes I feel like calling you my permanent headache is more accurate. 😂

From our random conversations and stupid jokes to the unnecessary fights, endless laughing and all the crazy moments...

somehow all those little things became some of my favourite memories.

Sometimes we talk for hours.

Sometimes we don't talk for days.

But somehow, that comfort between us never changes.

And that's what I love about our friendship.

You've been there for so many moments — the good ones, the bad ones, and even those completely unnecessary ones where we were just being stupid together. 😂

I don't know where life will take us in the future.

Maybe we'll get busy.

Maybe things will change.

But I genuinely hope one thing never changes...

OUR FRIENDSHIP. ❤️

I want more random plans.

More inside jokes.

More stupid fights.

More laughing until we can't breathe.

And obviously...

more reasons to irritate each other. 😂

I really hope this new year of your life gives you everything you deserve.

Happiness.

Success.

Peace.

And lots and lots of reasons to smile.

And whenever life gets difficult...

just remember,

you've always got me. ❤️

So once again...

HAPPY BIRTHDAY, {NAME}! 🎂❤️

Stay crazy.

Stay happy.

And please...

don't become too mature.

I still need my crazy best friend. 😂🫶

— Your permanently stuck bestie ❤️`;

    // "💌 OPEN MY HEART ❤️" Button Interaction
    if (openHeartBtn) {
        openHeartBtn.addEventListener('click', () => {
            playTone(523.25, 'triangle', 0.8, 0.3);
            playTone(659.25, 'sine', 0.8, 0.25);

            // Heart particles explosion
            createHeartExplosion();

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    colors: ['#ff2a6d', '#ffd700', '#ffffff', '#ff758f'],
                    origin: { y: 0.6 }
                });
            }

            // Smoothly fade out openHeartBtn and transition to Page 3 (Letter)
            gsap.to(openHeartBtn, {
                scale: 1.15,
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    window.goToStoryPage(2);
                }
            });
        });
    }

    // SECTION 2.5: Step 1 -> Step 6 Envelope & Handwritten Letter Sequence
    function startLetterSequence() {
        const letterTeaserBox = document.getElementById('letterTeaserBox');
        const teaserText1 = document.getElementById('teaserText1');
        const teaserText2 = document.getElementById('teaserText2');
        const envelopeContainer = document.getElementById('envelopeContainer');
        const envelopeWrapper = document.getElementById('envelopeWrapper');
        const unfoldedLetterCard = document.getElementById('unfoldedLetterCard');
        const letterLineContainer = document.getElementById('letterLineContainer');
        const letterFooter = document.getElementById('letterFooter');
        const afterReadTeaser1 = document.getElementById('afterReadTeaser1');
        const afterReadTeaser2 = document.getElementById('afterReadTeaser2');
        const continueToStatsBtn = document.getElementById('continueToStatsBtn');

        // Step 1: Transition Teasers
        gsap.to(teaserText1, { opacity: 1, duration: 0.8, delay: 0.3 });

        setTimeout(() => {
            gsap.to(teaserText1, {
                opacity: 0,
                duration: 0.6,
                onComplete: () => {
                    teaserText1.classList.add('hidden-teaser');
                    teaserText2.classList.remove('hidden-teaser');
                    gsap.to(teaserText2, { opacity: 1, duration: 0.8 });
                }
            });
        }, 2000);

        setTimeout(() => {
            gsap.to(teaserText2, {
                opacity: 0,
                duration: 0.6,
                onComplete: () => {
                    letterTeaserBox.style.display = 'none';
                    // Reveal Envelope (Step 2)
                    envelopeContainer.classList.remove('hidden-step');
                    gsap.fromTo(envelopeContainer, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' });
                }
            });
        }, 4200);

        // Step 3: Envelope Opening Click Handler
        let envelopeOpened = false;
        if (envelopeWrapper) {
            envelopeWrapper.onclick = () => {
                if (envelopeOpened) return;
                envelopeOpened = true;

                playTone(350, 'triangle', 0.3, 0.2);

                // 1. Shake envelope
                gsap.to(envelopeWrapper, {
                    x: 8,
                    duration: 0.06,
                    repeat: 5,
                    yoyo: true,
                    onComplete: () => {
                        gsap.set(envelopeWrapper, { x: 0 });
                        // 2. Open flap & break seal
                        envelopeWrapper.classList.add('open');
                        playTone(550, 'sine', 0.4, 0.25);

                        // 3. Zoom towards letter and reveal unfolded letter
                        setTimeout(() => {
                            gsap.to(envelopeContainer, {
                                scale: 1.15,
                                opacity: 0,
                                duration: 0.8,
                                ease: 'power2.in',
                                onComplete: () => {
                                    envelopeContainer.classList.add('hidden-step');
                                    unfoldedLetterCard.classList.remove('hidden-step');
                                    gsap.fromTo(unfoldedLetterCard, 
                                        { opacity: 0, y: 40, scale: 0.95 },
                                        { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'power3.out' }
                                    );

                                    // Step 4: Line-by-Line Handwritten Writing Engine
                                    revealLetterLineByLine(letterLineContainer, letterFooter, afterReadTeaser1, afterReadTeaser2, continueToStatsBtn);
                                }
                            });
                        }, 900);
                    }
                });
            };
        }
    }

    // Step 4: Reveal Text Line-by-Line
    function revealLetterLineByLine(container, footerEl, teaser1, teaser2, continueBtn) {
        if (!container) return;
        container.innerHTML = '';

        // Format letter text with dynamic friend name
        const rawText = window.letterTextContent.replace(/{NAME}/g, friendName);
        const lines = rawText.split('\n');

        let lineIndex = 0;

        function printNextLine() {
            if (lineIndex >= lines.length) {
                // Step 6: After Reading Sequence
                setTimeout(() => {
                    revealAfterReadingFooter(footerEl, teaser1, teaser2, continueBtn);
                }, 800);
                return;
            }

            const currentLineText = lines[lineIndex];
            lineIndex++;

            if (currentLineText.trim() === '') {
                // Spacing line
                const spacer = document.createElement('div');
                spacer.style.height = '1.2rem';
                container.appendChild(spacer);
                setTimeout(printNextLine, 200);
            } else {
                const p = document.createElement('p');
                p.className = 'letter-line';

                // Check formatting tags
                if (currentLineText.includes('HAPPY BIRTHDAY') || currentLineText.includes('HAPPY BIRTHDAYYY')) {
                    p.classList.add('heading-line');
                } else if (currentLineText.includes('OUR FRIENDSHIP')) {
                    p.classList.add('highlight-line');
                } else if (currentLineText.startsWith('—')) {
                    p.classList.add('sign-line');
                }

                p.textContent = currentLineText;
                container.appendChild(p);

                // Play writing sound effect
                playTone(420 + (lineIndex % 5) * 40, 'sine', 0.1, 0.04);

                // Fade in line
                setTimeout(() => {
                    p.classList.add('visible-line');
                }, 50);

                // Delay between lines for natural handwritten reading pace
                const delay = currentLineText.length > 40 ? 650 : 450;
                setTimeout(printNextLine, delay);
            }
        }

        printNextLine();
    }

    // Step 6: After Reading Footer Teasers & CONTINUE Button
    function revealAfterReadingFooter(footerEl, teaser1, teaser2, continueBtn) {
        if (!footerEl) return;
        footerEl.classList.remove('hidden-step');

        gsap.to(teaser1, { opacity: 1, duration: 0.8 });

        setTimeout(() => {
            gsap.to(teaser1, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    teaser1.classList.add('hidden-teaser');
                    teaser2.classList.remove('hidden-teaser');
                    gsap.to(teaser2, { opacity: 1, duration: 0.8 });
                }
            });
        }, 2200);

        setTimeout(() => {
            continueBtn.classList.remove('hidden-teaser');
            gsap.fromTo(continueBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' });
        }, 4000);

        if (continueBtn) {
            continueBtn.onclick = () => {
                playTone(523.25, 'triangle', 0.5, 0.3);
                if (typeof confetti === 'function') {
                    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
                }
                const statsSection = document.getElementById('statsSection');
                if (statsSection) {
                    statsSection.scrollIntoView({ behavior: 'smooth' });
                }
            };
        }
    }

    // Heart particles explosion for "OPEN MY HEART" transition
    function createHeartExplosion() {
        const heartColors = ['#ff2a6d', '#ff758f', '#ffd700', '#ffffff'];
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            const color = heartColors[Math.floor(Math.random() * heartColors.length)];
            particles.push(new Particle(
                width / 2,
                height / 2,
                color,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() * 5 + 3,
                0.96,
                -0.02 // floats upwards!
            ));
        }
    }

    // Replay Curtain Stage -> Jump to Page 1
    replayCurtainBtn.addEventListener('click', () => {
        window.goToStoryPage(0);
    });

    // Spotlight cursor follow over recipient name
    const nameContainer = document.querySelector('.name-container');
    const nameSpotlight = document.getElementById('nameSpotlight');

    if (nameContainer && nameSpotlight) {
        nameContainer.addEventListener('mousemove', (e) => {
            const rect = nameContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            gsap.to(nameSpotlight, {
                x: x - rect.width / 2,
                y: y - rect.height / 2,
                duration: 0.3,
                ease: 'power1.out'
            });
        });
    }

    // --------------------------------------------------------------------------
    // 5. BALLOON SPAWN & POPPING MINIGAME
    // --------------------------------------------------------------------------
    const balloonColors = ['#ff2a6d', '#ffd700', '#05d9e8', '#7b2cbf', '#ff9f1c', '#3a86ff'];

    function spawnBalloons(count = 10) {
        for (let i = 0; i < count; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            const bg = balloonColors[Math.floor(Math.random() * balloonColors.length)];
            balloon.style.backgroundColor = bg;
            balloon.style.left = `${Math.random() * 85 + 5}%`;
            balloon.style.animationDuration = `${Math.random() * 6 + 8}s`;
            balloon.style.animationDelay = `${Math.random() * 4}s`;

            balloon.addEventListener('click', (e) => {
                popBalloon(balloon, e.clientX, e.clientY, bg);
            });

            balloonContainer.appendChild(balloon);
        }
    }

    function popBalloon(balloonEl, x, y, color) {
        playPopSound();
        createFirework(x, y);

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 25,
                spread: 50,
                origin: { x: x / window.innerWidth, y: y / window.innerHeight },
                colors: [color]
            });
        }

        gsap.to(balloonEl, {
            scale: 1.5,
            opacity: 0,
            duration: 0.15,
            onComplete: () => balloonEl.remove()
        });
    }

    if (popBalloonsBtn) {
        popBalloonsBtn.addEventListener('click', () => {
            spawnBalloons(15);
            playTone(523.25, 'triangle', 0.4, 0.3);
        });
    }

    if (chaosBtn) {
        chaosBtn.addEventListener('click', () => {
            triggerRandomFireworks(8);
            spawnBalloons(20);
            if (typeof confetti === 'function') {
                confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
            }
            if (window.goToStoryPage) window.goToStoryPage(3);
        });
    }

    // --------------------------------------------------------------------------
    // 6. FRIEND STATISTICS (ROAST VS TOAST MODE TOGGLE)
    // --------------------------------------------------------------------------
    const roastStats = [
        { val: "99.9%", desc: "Treats a minor inconvenience like a 3-act Shakespearean tragedy." },
        { val: "Dual-Speed", desc: "0.001s for hot gossip; 3–5 business days for simple questions." },
        { val: "Critical ☕", desc: "Can run a small European country entirely on iced coffee and pure willpower." },
        { val: "5.0 Miles", desc: "Can detect snacks, French fries, or boba from across 3 zip codes." },
        { val: "100% Locked", desc: "Will guard your secrets to the grave (or until bribed with snacks)." },
        { val: "3 AM - 1 PM", desc: "Sends profound existential memes at 3:14 AM on a Tuesday." }
    ];

    const toastStats = [
        { val: "100% Angel", desc: "Always brings pure joy, laughter, and heartwarming vibes wherever they go." },
        { val: "Instant Reply", desc: "The most reliable friend who always checks in when you need someone." },
        { val: "Sweet Energy 🍯", desc: "Powered by kindness, compassion, and a heart of absolute solid gold." },
        { val: "Happiness Magnet", desc: "Spreads good moods and turns any dull day into a memorable adventure." },
        { val: "Loyalty 1000%", desc: "The most trustworthy, protective, and genuinely solid best friend forever." },
        { val: "Star Quality", desc: "Lights up the universe just by being their authentic, beautiful self." }
    ];

    if (roastToastToggle) {
        roastToastToggle.addEventListener('change', () => {
        const isToast = roastToastToggle.checked;
        const currentData = isToast ? toastStats : roastStats;

        currentData.forEach((stat, idx) => {
            const valEl = document.getElementById(`statVal${idx + 1}`);
            const descEl = document.getElementById(`statDesc${idx + 1}`);

            if (valEl && descEl) {
                gsap.to([valEl, descEl], {
                    opacity: 0,
                    y: -10,
                    duration: 0.2,
                    onComplete: () => {
                        valEl.textContent = stat.val;
                        descEl.textContent = stat.desc;
                        gsap.to([valEl, descEl], { opacity: 1, y: 0, duration: 0.3 });
                    }
                });
            }
        });
        playTone(440, 'sine', 0.2, 0.15);
        });
    }

    // Soundboard Buttons
    document.querySelectorAll('.sfx-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const soundType = btn.getAttribute('data-sound');
            if (soundType === 'gossip') playTone(880, 'triangle', 0.5, 0.3);
            if (soundType === 'dramatic') playTone(150, 'sawtooth', 0.6, 0.3);
            if (soundType === 'hungry') playTone(350, 'square', 0.4, 0.2);
            if (soundType === 'tired') playTone(200, 'sine', 0.8, 0.25);
            if (soundType === 'slay') playTone(650, 'sine', 0.4, 0.3);

            btn.style.transform = 'scale(0.92)';
            setTimeout(() => btn.style.transform = '', 150);
        });
    });

    // --------------------------------------------------------------------------
    // 7. FLOATING INTERACTIVE ALBUM ZONE ENGINE
    // --------------------------------------------------------------------------
    const floatingAlbumsData = [
        {
            id: 0,
            title: "OUR CHAOS ❤️",
            photos: [
                { img: 'p1.jpeg', text: 'That random day we didn\'t plan...' },
                { img: 'p2.jpeg', text: 'Somehow this became one of my favourite memories. ❤️' },
                { img: 'p3.jpeg', text: 'Unfiltered laughter and pure madness! 😂' }
            ]
        },
        {
            id: 1,
            title: "THE GOOD DAYS ✨",
            photos: [
                { img: 'p4.jpeg', text: 'Golden hour moments with the best person.' },
                { img: 'p5.jpeg', text: 'No worries in the world, just good vibes.' },
                { img: 'p6.jpeg', text: 'Making memories that will last a lifetime. ✨' }
            ]
        },
        {
            id: 2,
            title: "STUPID MOMENTS 😂",
            photos: [
                { img: 'p7.jpeg', text: 'Proof that we cannot act normal for 5 minutes.' },
                { img: 'p8.jpeg', text: 'Laughing so hard our cheeks hurt!' },
                { img: 'p9.jpeg', text: 'The kind of funny moments words can\'t explain. 🤪' }
            ]
        },
        {
            id: 3,
            title: "THE LITTLE THINGS 🫶",
            photos: [
                { img: 'p10.jpeg', text: 'It\'s always the simple conversations that mean the most.' },
                { img: 'p1.jpeg', text: 'Late night chats and emergency snack raids.' },
                { img: 'p2.jpeg', text: 'Grateful for every single little memory with you. 💖' }
            ]
        },
        {
            id: 4,
            title: "MEMORIES 📸",
            photos: [
                { img: 'p3.jpeg', text: 'A snapshot of pure happiness.' },
                { img: 'p4.jpeg', text: 'Every picture tells our story.' },
                { img: 'p5.jpeg', text: 'Through all seasons, always by your side. 🎬' }
            ]
        },
        {
            id: 5,
            title: "JUST US ❤️",
            photos: [
                { img: 'p6.jpeg', text: 'No matter how crazy life gets, you will always be my #1. ❤️' },
                { img: 'p7.jpeg', text: 'Best friends forever and always!' },
                { img: 'p8.jpeg', text: 'Thank you for being the most amazing bestie! ✨' }
            ]
        }
    ];

    let openedAlbumSet = new Set();
    let currentAlbumIdx = 0;
    let currentPhotoIdxInAlbum = 0;
    let activePausedCard = null;

    const floatingCards = document.querySelectorAll('.floating-album-card');
    const openedAlbumModal = document.getElementById('openedAlbumModal');
    const closeAlbumModalBtn = document.getElementById('closeAlbumModalBtn');
    const bookPhotoImg = document.getElementById('bookPhotoImg');
    const bookCaptionText = document.getElementById('bookCaptionText');
    const bookMemoryBadge = document.getElementById('bookMemoryBadge');
    const bookCounterPill = document.getElementById('bookCounterPill');
    const bookPrevPhotoBtn = document.getElementById('bookPrevPhotoBtn');
    const bookNextPhotoBtn = document.getElementById('bookNextPhotoBtn');
    const floatingAlbumHint = document.getElementById('floatingAlbumHint');
    const albumFinaleCard = document.getElementById('albumFinaleCard');

    floatingCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const albumId = parseInt(card.getAttribute('data-album-id'), 10);

            // If user clicked "OPEN THIS MEMORY ❤️" or clicked an already paused card -> Open Album
            if (card.classList.contains('paused-album') || e.target.classList.contains('open-memory-btn')) {
                openAlbumModal(albumId);
                return;
            }

            // Click 1: Pause floating animation & focus album
            if (activePausedCard && activePausedCard !== card) {
                activePausedCard.classList.remove('paused-album');
            }

            activePausedCard = card;
            card.classList.add('paused-album');
            playTone(400, 'sine', 0.2, 0.15);

            if (floatingAlbumHint) {
                floatingAlbumHint.textContent = `Click "OPEN THIS MEMORY ❤️" on ${floatingAlbumsData[albumId].title}!`;
            }
        });
    });

    // Unpause album when clicking blank area in stage
    const floatingAlbumsStage = document.getElementById('floatingAlbumsStage');
    if (floatingAlbumsStage) {
        floatingAlbumsStage.addEventListener('click', (e) => {
            if (!e.target.closest('.floating-album-card')) {
                if (activePausedCard) {
                    activePausedCard.classList.remove('paused-album');
                    activePausedCard = null;
                    if (floatingAlbumHint) {
                        floatingAlbumHint.textContent = 'Click any floating album to pause and open it ✨';
                    }
                }
            }
        });
    }

    function openAlbumModal(albumIdx) {
        currentAlbumIdx = albumIdx;
        currentPhotoIdxInAlbum = 0;
        const albumData = floatingAlbumsData[albumIdx];

        if (!albumData) return;

        playTone(450, 'sine', 0.25, 0.2);

        renderBookPage();

        if (openedAlbumModal) {
            openedAlbumModal.classList.remove('hidden-modal');
            gsap.fromTo('#scrapbookBookWrapper',
                { opacity: 0, scale: 0.8, rotateY: -25 },
                { opacity: 1, scale: 1, rotateY: 0, duration: 0.8, ease: 'back.out(1.4)' }
            );
        }
    }

    function renderBookPage() {
        const albumData = floatingAlbumsData[currentAlbumIdx];
        if (!albumData || !albumData.photos.length) return;

        const photoObj = albumData.photos[currentPhotoIdxInAlbum];

        if (bookPhotoImg) bookPhotoImg.src = photoObj.img;
        if (bookCaptionText) bookCaptionText.textContent = `"${photoObj.text}"`;
        if (bookMemoryBadge) bookMemoryBadge.textContent = `${albumData.title} • PHOTO ${currentPhotoIdxInAlbum + 1}`;
        if (bookCounterPill) bookCounterPill.textContent = `PHOTO ${currentPhotoIdxInAlbum + 1} / ${albumData.photos.length}`;

        if (bookPrevPhotoBtn) bookPrevPhotoBtn.disabled = (currentPhotoIdxInAlbum === 0);
        if (bookNextPhotoBtn) bookNextPhotoBtn.disabled = (currentPhotoIdxInAlbum === albumData.photos.length - 1);
    }

    if (bookPrevPhotoBtn) {
        bookPrevPhotoBtn.addEventListener('click', () => {
            if (currentPhotoIdxInAlbum > 0) {
                currentPhotoIdxInAlbum--;
                playTone(520, 'sine', 0.15, 0.15);
                gsap.fromTo('.photo-frame-polaroid', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4 });
                renderBookPage();
            }
        });
    }

    if (bookNextPhotoBtn) {
        bookNextPhotoBtn.addEventListener('click', () => {
            const albumData = floatingAlbumsData[currentAlbumIdx];
            if (albumData && currentPhotoIdxInAlbum < albumData.photos.length - 1) {
                currentPhotoIdxInAlbum++;
                playTone(580, 'sine', 0.15, 0.15);
                gsap.fromTo('.photo-frame-polaroid', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4 });
                renderBookPage();
            }
        });
    }

    if (closeAlbumModalBtn) {
        closeAlbumModalBtn.addEventListener('click', () => {
            playTone(350, 'triangle', 0.3, 0.2);

            gsap.to('#scrapbookBookWrapper', {
                opacity: 0,
                scale: 0.85,
                duration: 0.4,
                onComplete: () => {
                    if (openedAlbumModal) openedAlbumModal.classList.add('hidden-modal');

                    // Mark album as opened
                    openedAlbumSet.add(currentAlbumIdx);
                    const card = document.querySelector(`.floating-album-card[data-album-id="${currentAlbumIdx}"]`);
                    if (card) {
                        card.classList.remove('paused-album');
                        card.classList.add('opened');
                        const badge = card.querySelector('.album-status-badge');
                        if (badge) badge.classList.remove('hidden-status');
                    }

                    activePausedCard = null;

                    // Check if all 6 albums are opened
                    if (openedAlbumSet.size >= 6) {
                        if (floatingAlbumHint) floatingAlbumHint.textContent = 'All memory albums opened! ❤️';
                        revealAlbumFinale();
                    } else {
                        if (floatingAlbumHint) floatingAlbumHint.textContent = 'Another memory is waiting... 👀';
                    }
                }
            });
        });
    }

    function revealAlbumFinale() {
        if (albumFinaleCard) {
            albumFinaleCard.classList.remove('hidden-step');
            gsap.fromTo(albumFinaleCard,
                { opacity: 0, scale: 0.85, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' }
            );

            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
            }
        }
    }

    // --------------------------------------------------------------------------
    // 8. SECTION 2.8: CINEMATIC 3-STEP CAKE ENTRANCE & BLOW CANDLES
    // --------------------------------------------------------------------------
    const cakeTimeBtn = document.getElementById('cakeTimeBtn');
    const cakeTheatreSection = document.getElementById('cakeTheatreSection');
    const cakeTeaser1 = document.getElementById('cakeTeaser1');
    const cakeTeaser2 = document.getElementById('cakeTeaser2');
    // --------------------------------------------------------------------------
    // 8. SECTION 2.8: CINEMATIC CAKE THEATRE STAGE & WISH FLOW
    // --------------------------------------------------------------------------
    const lightCandlesBtn = document.getElementById('lightCandlesBtn');
    const blowCandlesBtn = document.getElementById('blowCandlesBtn');
    const finalCakeBanner = document.getElementById('finalCakeBanner');
    const wishInput = document.getElementById('wishInput');
    const sendWishBtn = document.getElementById('sendWishBtn');
    const wishInputWrapper = document.getElementById('wishInputWrapper');
    const wishSentMsg = document.getElementById('wishSentMsg');
    const crazyZoneAction = document.getElementById('crazyZoneAction');
    const quickCakeBtn = document.getElementById('quickCakeBtn');

    if (quickCakeBtn) {
        quickCakeBtn.addEventListener('click', () => {
            playTone(523.25, 'triangle', 0.5, 0.3);
            if (curtainOverlay && curtainOverlay.classList.contains('active-page')) {
                curtainOverlay.classList.remove('active-page');
            }
            window.goToStoryPage(5); // Page 6: Cake Cutting Stage
        });
    }

    if (cakeTimeBtn) {
        cakeTimeBtn.addEventListener('click', () => {
            playTone(523.25, 'triangle', 0.5, 0.3);
            window.goToStoryPage(5); // Page 6: Cake Cutting Stage
        });
    }

    // Step 1: Click "LIGHT THE CANDLES"
    if (lightCandlesBtn) {
        lightCandlesBtn.addEventListener('click', () => {
            playTone(440, 'triangle', 0.4, 0.3);
            
            // Ignite candles one by one
            const candles = document.querySelectorAll('.candle-item');
            candles.forEach((c, idx) => {
                setTimeout(() => {
                    c.classList.add('ignited');
                    playTone(350 + idx * 90, 'sine', 0.25, 0.2);
                }, idx * 300);
            });

            // Once all candles are lit, swap to "BLOW THE CANDLES" button
            const totalIgniteTime = candles.length * 300 + 300;
            setTimeout(() => {
                gsap.to(lightCandlesBtn, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.4,
                    onComplete: () => {
                        lightCandlesBtn.classList.add('hidden-step');
                        blowCandlesBtn.classList.remove('hidden-step');
                        gsap.fromTo(blowCandlesBtn,
                            { opacity: 0, scale: 0.85, y: 15 },
                            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)' }
                        );
                    }
                });
            }, totalIgniteTime);
        });
    }

    // Step 2: Click "BLOW THE CANDLES"
    if (blowCandlesBtn) {
        blowCandlesBtn.addEventListener('click', () => {
            playTone(300, 'triangle', 0.4, 0.3);
            const candles = document.querySelectorAll('.candle-item');

            // Flames flicker strongly
            candles.forEach(c => c.classList.add('flickering-strong'));

            // Turn flames off one by one with smoke puffs
            candles.forEach((c, idx) => {
                setTimeout(() => {
                    c.classList.remove('ignited', 'flickering-strong');
                    const smoke = c.querySelector('.smoke-puff');
                    if (smoke) smoke.classList.add('active');
                    playTone(500 - idx * 60, 'sine', 0.15, 0.15);
                }, idx * 280);
            });

            // Once candles are blown out: Confetti burst, fireworks, & reveal Celebration Banner
            const totalBlowTime = candles.length * 280 + 400;
            setTimeout(() => {
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 220,
                        spread: 120,
                        colors: ['#ffd700', '#ff2a6d', '#ffffff', '#05d9e8'],
                        origin: { y: 0.5 }
                    });
                }

                triggerRandomFireworks(8);
                playFanfareSound();

                // Hide Action Button Container
                const cakeActionContainer = document.getElementById('cakeActionContainer');
                if (cakeActionContainer) cakeActionContainer.style.display = 'none';

                // Reveal Final Celebration Banner & Wish Card
                finalCakeBanner.classList.remove('hidden-step');
                gsap.fromTo(finalCakeBanner,
                    { opacity: 0, scale: 0.88, y: 25 },
                    { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'elastic.out(1, 0.7)' }
                );
            }, totalBlowTime);
        });
    }

    // Step 3: Release Wish to the Stars
    if (sendWishBtn && wishInput) {
        sendWishBtn.addEventListener('click', () => {
            const wishText = wishInput.value.trim() || `Happy Birthday ${friendName}! ✨`;
            playTone(587.33, 'triangle', 0.4, 0.4);

            // Animate input container dissolving into floating particles
            if (wishInputWrapper) {
                gsap.to(wishInputWrapper, {
                    opacity: 0,
                    y: -20,
                    duration: 0.6,
                    onComplete: () => {
                        wishInputWrapper.classList.add('hidden-step');
                        
                        // Show "Your wish has been sent to the stars. ✨❤️"
                        if (wishSentMsg) {
                            wishSentMsg.classList.remove('hidden-step');
                            gsap.fromTo(wishSentMsg,
                                { opacity: 0, scale: 0.8, y: 15 },
                                { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.5)' }
                            );
                        }

                        // Show "ENTER THE CRAZY ZONE" button
                        if (crazyZoneAction) {
                            crazyZoneAction.classList.remove('hidden-step');
                            gsap.fromTo(crazyZoneAction,
                                { opacity: 0, y: 20 },
                                { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'back.out(1.4)' }
                            );
                        }
                    }
                });
            }

            // Create floating glowing particles rising up into space
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'star-wish-particle';
                    particle.textContent = ['✨', '⭐', '💫', '💖'][Math.floor(Math.random() * 4)];
                    particle.style.position = 'fixed';
                    particle.style.bottom = '150px';
                    particle.style.left = (35 + Math.random() * 30) + '%';
                    particle.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
                    particle.style.zIndex = '99999';
                    particle.style.pointerEvents = 'none';

                    document.body.appendChild(particle);

                    gsap.to(particle, {
                        y: '-110vh',
                        x: (Math.random() - 0.5) * 150,
                        opacity: 0,
                        duration: 3 + Math.random() * 2,
                        ease: 'power1.out',
                        onComplete: () => particle.remove()
                    });
                }, i * 80);
            }
        });
    }
    // --------------------------------------------------------------------------
    // 8.5. SECRET PASSWORD LOCK & CRAZY ZONE ENGINE
    // --------------------------------------------------------------------------
    window.secretPassword = "bestie"; // Easily editable password variable!

    const funnyWrongPasswordMsgs = [
        "❌ Nice try 😂",
        "❌ Nope. Think harder 👀",
        "❌ Lalli, seriously? 😭",
        "❌ Even I expected better than this 😂",
        "❌ Access denied. Bestie privileges required."
    ];

    const proceedToSecretBtn = document.getElementById('proceedToSecretBtn');
    const crazyLockSection = document.getElementById('crazyLockSection');
    const crazyLockTeaserBox = document.getElementById('crazyLockTeaserBox');
    const lockTeaser1 = document.getElementById('lockTeaser1');
    const lockTeaser2 = document.getElementById('lockTeaser2');
    const lockTeaser3 = document.getElementById('lockTeaser3');
    const crazyLockCard = document.getElementById('crazyLockCard');
    const crazyPasswordInput = document.getElementById('crazyPasswordInput');
    const unlockCrazyBtn = document.getElementById('unlockCrazyBtn');
    const passwordErrorMsg = document.getElementById('passwordErrorMsg');
    const togglePassVisibility = document.getElementById('togglePassVisibility');
    const accessGrantedBanner = document.getElementById('accessGrantedBanner');
    const crazyZoneSection = document.getElementById('crazyZoneSection');
    const lockIcon = document.getElementById('lockIcon');
    const scrollToStatsFromCrazyBtn = document.getElementById('scrollToStatsFromCrazyBtn');

    if (proceedToSecretBtn) {
        proceedToSecretBtn.addEventListener('click', () => {
            playTone(523.25, 'triangle', 0.5, 0.3);
            window.goToStoryPage(6); // Page 7: Secret Crazy Zone
        });
    }

    function startSecretLockSequence() {
        // STEP 1: Teasers
        gsap.to(lockTeaser1, { opacity: 1, duration: 0.8, delay: 0.3 });

        setTimeout(() => {
            gsap.to(lockTeaser1, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    lockTeaser1.classList.add('hidden-step');
                    lockTeaser2.classList.remove('hidden-step');
                    gsap.to(lockTeaser2, { opacity: 1, duration: 0.8 });
                }
            });
        }, 1800);

        setTimeout(() => {
            gsap.to(lockTeaser2, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    lockTeaser2.classList.add('hidden-step');
                    lockTeaser3.classList.remove('hidden-step');
                    gsap.to(lockTeaser3, { opacity: 1, duration: 0.8 });
                }
            });
        }, 3600);

        // Reveal Secret Access Panel (Step 2)
        setTimeout(() => {
            gsap.to(lockTeaser3, {
                opacity: 0,
                duration: 0.6,
                onComplete: () => {
                    crazyLockTeaserBox.style.display = 'none';

                    crazyLockCard.classList.remove('hidden-step');
                    gsap.fromTo(crazyLockCard,
                        { opacity: 0, scale: 0.85, y: 30 },
                        { opacity: 1, scale: 1, y: 0, duration: 1.0, ease: 'back.out(1.5)' }
                    );
                }
            });
        }, 5400);
    }

    // Toggle Password Visibility
    if (togglePassVisibility && crazyPasswordInput) {
        togglePassVisibility.addEventListener('click', () => {
            const currentType = crazyPasswordInput.getAttribute('type');
            crazyPasswordInput.setAttribute('type', currentType === 'password' ? 'text' : 'password');
            togglePassVisibility.innerHTML = currentType === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
        });
    }

    // Unlock Validation Logic
    function attemptUnlockCrazyZone(force = false) {
        if (!crazyPasswordInput && !force) return;
        const val = crazyPasswordInput ? crazyPasswordInput.value.trim().toLowerCase() : '';
        const validPass = (window.secretPassword || 'bestie').toLowerCase();
        const validName = friendName.toLowerCase();

        if (force || val === validPass || val === validName || val === 'bestie' || val === 'lalli') {
            // SUCCESS!
            playTone(880, 'sine', 0.6, 0.3);
            crazyPasswordInput.classList.add('granted');

            if (lockIcon) {
                lockIcon.className = 'fa-solid fa-lock-open';
                lockIcon.style.color = '#00ff87';
            }

            // Hide Error if any
            if (passwordErrorMsg) passwordErrorMsg.classList.add('hidden-step');

            // Screen Shake & Glitch Flash
            gsap.to(crazyLockCard, {
                scale: 1.1,
                opacity: 0,
                duration: 0.7,
                ease: 'power2.in',
                onComplete: () => {
                    crazyLockCard.classList.add('hidden-step');

                    // Access Granted Banner
                    accessGrantedBanner.classList.remove('hidden-step');
                    gsap.fromTo(accessGrantedBanner,
                        { opacity: 0, scale: 0.7 },
                        { opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.6)' }
                    );

                    triggerRandomFireworks(6);
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 200, spread: 120, colors: ['#00ff87', '#ff2a6d', '#05d9e8'] });
                    }

                    // Reveal Crazy Zone Section after 1.5s
                    setTimeout(() => {
                        gsap.to(crazyLockSection, {
                            opacity: 0,
                            duration: 0.8,
                            onComplete: () => {
                                crazyLockSection.classList.add('hidden-section');
                                crazyLockSection.style.display = 'none';
                                if (crazyZoneSection) {
                                    crazyZoneSection.classList.remove('hidden-section');
                                    gsap.fromTo(crazyZoneSection,
                                        { opacity: 0, y: 50 },
                                        {
                                            opacity: 1,
                                            y: 0,
                                            duration: 1.2,
                                            ease: 'power3.out',
                                            onComplete: () => {
                                                crazyZoneSection.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }
                                    );
                                }
                            }
                        });
                    }, 1600);
                }
            });
        } else {
            // INCORRECT PASSWORD!
            playTone(150, 'sawtooth', 0.3, 0.25);

            const randomMsg = funnyWrongPasswordMsgs[Math.floor(Math.random() * funnyWrongPasswordMsgs.length)];
            if (passwordErrorMsg) {
                passwordErrorMsg.textContent = randomMsg;
                passwordErrorMsg.classList.remove('hidden-step');
            }

            // Shake Input Box
            crazyLockCard.classList.add('shake-card');
            setTimeout(() => crazyLockCard.classList.remove('shake-card'), 450);
        }
    }

    if (unlockCrazyBtn) unlockCrazyBtn.addEventListener('click', attemptUnlockCrazyZone);
    if (crazyPasswordInput) {
        crazyPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptUnlockCrazyZone();
        });
    }

    // Vault Cards Toggle
    document.querySelectorAll('.classified-card').forEach(card => {
        const btn = card.querySelector('.vault-unlock-btn');
        const content = card.querySelector('.vault-content');
        if (btn && content) {
            btn.addEventListener('click', () => {
                content.classList.toggle('hidden-vault');
                playTone(600, 'sine', 0.15, 0.15);
                btn.innerHTML = content.classList.contains('hidden-vault') ?
                    '<i class="fa-solid fa-key"></i> Reveal Vault' :
                    '<i class="fa-solid fa-lock"></i> Hide Vault';
            });
        }
    });

    if (scrollToStatsFromCrazyBtn) {
        scrollToStatsFromCrazyBtn.onclick = () => {
            const statsSection = document.getElementById('statsSection');
            if (statsSection) statsSection.scrollIntoView({ behavior: 'smooth' });
        };
    }

    // --------------------------------------------------------------------------
    // 9. SECTION 6: SURPRISE GIFT UNBOXING MINIGAME
    // --------------------------------------------------------------------------
    if (giftBox) {
        giftBox.addEventListener('click', () => {
            playTone(250 + giftLayer * 100, 'triangle', 0.2, 0.2);

            // Wobble Animation
            gsap.to(giftBox, {
                rotate: giftLayer % 2 === 0 ? -12 : 12,
                scale: 1.08,
                duration: 0.15,
                yoyo: true,
                repeat: 1
            });

            if (giftLayer < 3) {
                giftLayer++;
                giftLayerBadge.textContent = `Layer ${giftLayer} / 3`;
            } else {
                // Fully Unwrapped!
                giftLayerBadge.textContent = `UNWRAPPED! 🎁`;
                const lid = giftBox.querySelector('.gift-lid');
                if (lid) {
                    gsap.to(lid, {
                        y: -120,
                        rotate: 35,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'power2.out'
                    });
                }
                setTimeout(() => {
                    giftBox.style.display = 'none';
                    trophyReveal.classList.remove('hidden');
                    gsap.from(trophyReveal, { scale: 0.5, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' });
                    triggerRandomFireworks(6);
                }, 400);
            }
        });
    }

    if (claimAwardBtn) {
        claimAwardBtn.addEventListener('click', () => {
            triggerRandomFireworks(10);
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 250,
                    spread: 140,
                    origin: { y: 0.4 }
                });
            }
            claimAwardBtn.innerHTML = `<i class="fa-solid fa-check"></i> TROPHY CLAIMED! HAPPY BIRTHDAY ${friendName}! 🎉`;
            claimAwardBtn.style.background = 'linear-gradient(135deg, #05d9e8 0%, #7b2cbf 100%)';
        });
    }

    // --------------------------------------------------------------------------
    // 10. PERSONALIZATION MODAL LOGIC
    // --------------------------------------------------------------------------
    function updateFriendName(newName) {
        if (!newName.trim()) return;
        friendName = newName.trim();
        if (friendNameDisplay) friendNameDisplay.textContent = friendName;
        dynamicNameElements.forEach(el => el.textContent = friendName);
        createLetterSpans(friendName);
        document.title = `${friendName}'s Royal Birthday Premiere 🎉`;
    }

    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            if (customModal) customModal.classList.remove('hidden');
            if (friendNameInput) friendNameInput.value = friendName;
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (customModal) customModal.classList.add('hidden');
        });
    }

    if (saveCustomBtn) {
        saveCustomBtn.addEventListener('click', () => {
            if (friendNameInput) updateFriendName(friendNameInput.value);
            if (customModal) customModal.classList.add('hidden');
            playTone(523.25, 'sine', 0.3, 0.2);
        });
    }

    // Default Name Initializer
    updateFriendName('LALLI');

    // --------------------------------------------------------------------------
    // 11. CINEMATIC SINGLE-PHOTO MEMORY GALLERY ENGINE
    // --------------------------------------------------------------------------

    // ── DATA: Easy to edit ──────────────────────────────────────────────────
    const memories = [
        {
            image: "assets/photo1.jpg",
            quote: "Some people come into your life as friends...\nand slowly become family. ❤️",
            label: "MEMORY 01"
        },
        {
            image: "assets/photo2.jpg",
            quote: "No matter how much life changes,\nsome bonds just refuse to change. ❤️",
            label: "MEMORY 02"
        },
        {
            image: "assets/photo3.jpg",
            quote: "We may not have it all figured out,\nbut at least we have each other. 🫶",
            label: "MEMORY 03"
        },
        {
            image: "assets/photo4.jpg",
            quote: "The best memories are never planned.\nThey're created by two idiots having fun. 😂❤️",
            label: "MEMORY 04"
        },
        {
            image: "assets/photo5.jpg",
            quote: "Years may pass, places may change,\nbut this bond will always have a place in my heart. ❤️",
            label: "MEMORY 05"
        },
        {
            image: "assets/photo6.jpg",
            quote: "You're not just a chapter in my story...\nyou're one of my favourite parts. ❤️",
            label: "MEMORY 06"
        }
    ];

    let currentMemoryIndex = 0;
    let isMemoryTransitioning = false;

    // ── DOM references ───────────────────────────────────────────────────────
    const memoryBgBlur       = document.getElementById('memoryBgBlur');
    const memoryPhoto        = document.getElementById('memoryPhoto');
    const memoryBadge        = document.getElementById('memoryBadge');
    const memoryQuoteText    = document.getElementById('memoryQuoteText');
    const memoryCounterText  = document.getElementById('memoryCounterText');
    const polaroidCard       = document.getElementById('polaroidMemoryCard');
    const prevMemoryBtn      = document.getElementById('prevMemoryBtn');
    const nextMemoryBtn      = document.getElementById('nextMemoryBtn');

    // Fullscreen modal
    const photoFullscreenModal  = document.getElementById('photoFullscreenModal');
    const modalPhotoImg         = document.getElementById('modalPhotoImg');
    const modalMemoryBadge      = document.getElementById('modalMemoryBadge');
    const modalQuoteText        = document.getElementById('modalQuoteText');
    const closePhotoModalBtn    = document.getElementById('closePhotoModalBtn');
    const photoUploaderEl       = document.getElementById('photoUploader');

    // ── Dust particles canvas inside the memory section ─────────────────────
    function spawnMemoryDustParticles() {
        const overlay = document.getElementById('dustParticlesOverlay');
        if (!overlay) return;
        overlay.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;overflow:visible;';

        for (let i = 0; i < 28; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const cx = Math.random() * 100;
            const cy = Math.random() * 100;
            const r  = Math.random() * 2.5 + 0.5;
            const dur = (Math.random() * 8 + 5).toFixed(1);
            const delay = (Math.random() * 5).toFixed(1);
            const vy = -(Math.random() * 40 + 20);
            const vx = (Math.random() - 0.5) * 20;

            circle.setAttribute('cx', cx + '%');
            circle.setAttribute('cy', cy + '%');
            circle.setAttribute('r', r);
            circle.setAttribute('fill', `rgba(255, 215, 0, ${(Math.random() * 0.5 + 0.2).toFixed(2)})`);
            circle.innerHTML = `
                <animate attributeName="cy" from="${cy}%" to="${Math.max(0, cy + vy / 10)}%"
                    dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
                <animate attributeName="cx" from="${cx}%" to="${(cx + vx / 10)}%"
                    dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;${(Math.random() * 0.7 + 0.3).toFixed(2)};0"
                    dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
            `;
            svg.appendChild(circle);
        }
        overlay.appendChild(svg);
    }
    spawnMemoryDustParticles();

    // ── Display updater with animated transition ─────────────────────────────
    function updateMemoryDisplay(newIndex, direction = 'next') {
        if (!memoryPhoto || isMemoryTransitioning) return;
        isMemoryTransitioning = true;

        const mem = memories[newIndex];
        const slideOutX = direction === 'next' ? -80 : 80;
        const slideInX  = direction === 'next' ?  80 : -80;

        // Play shutter sound
        initAudioContext();
        playShutterSound();

        // Step 1: Animate card out (zoom-out + slide)
        gsap.to(polaroidCard, {
            opacity: 0,
            scale: 0.88,
            x: slideOutX,
            duration: 0.45,
            ease: 'power2.in',
            onComplete: () => {

                // Step 2: Swap photo & background (while card is invisible)
                memoryPhoto.src      = mem.image;
                memoryBadge.textContent = mem.label;

                // Update counter text
                memoryCounterText.textContent = `${mem.label} / ${memories.length.toString().padStart(2, '0')}`;

                // Swap blurred background
                gsap.to(memoryBgBlur, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        memoryBgBlur.style.backgroundImage = `url('${mem.image}')`;
                        gsap.to(memoryBgBlur, { opacity: 1, duration: 0.7 });
                    }
                });

                // Step 3: Animate card in (zoom-in + slide from opposite side)
                gsap.fromTo(polaroidCard,
                    { opacity: 0, scale: 0.88, x: slideInX },
                    {
                        opacity: 1, scale: 1, x: 0,
                        duration: 0.6,
                        ease: 'back.out(1.5)',
                        onComplete: () => { isMemoryTransitioning = false; }
                    }
                );

                // Step 4: Typewriter quote reveal line-by-line
                revealMemoryQuote(mem.quote);
            }
        });

        currentMemoryIndex = newIndex;
    }

    // ── Quote typewriter line-by-line reveal ────────────────────────────────
    function revealMemoryQuote(quoteText) {
        if (!memoryQuoteText) return;
        memoryQuoteText.innerHTML = '';
        gsap.set(memoryQuoteText, { opacity: 0 });

        const lines = quoteText.split('\n');

        // Fade the quote box out first
        gsap.to(memoryQuoteText, {
            opacity: 0, y: 10, duration: 0.25,
            onComplete: () => {
                memoryQuoteText.innerHTML = '';
                gsap.set(memoryQuoteText, { y: 0 });

                lines.forEach((line, idx) => {
                    const p = document.createElement('p');
                    p.style.cssText = 'margin:0.15rem 0;opacity:0;transform:translateY(8px);transition:opacity 0.5s ease, transform 0.5s ease;';
                    p.textContent = line;
                    memoryQuoteText.appendChild(p);

                    setTimeout(() => {
                        p.style.opacity   = '1';
                        p.style.transform = 'translateY(0)';
                    }, 100 + idx * 320);
                });

                gsap.to(memoryQuoteText, { opacity: 1, y: 0, duration: 0.4, delay: 0.05 });
            }
        });
    }

    // ── Navigation button handlers ───────────────────────────────────────────
    if (nextMemoryBtn) {
        nextMemoryBtn.addEventListener('click', () => {
            if (isMemoryTransitioning) return;
            const nextIdx = (currentMemoryIndex + 1) % memories.length;
            updateMemoryDisplay(nextIdx, 'next');
        });
    }

    if (prevMemoryBtn) {
        prevMemoryBtn.addEventListener('click', () => {
            if (isMemoryTransitioning) return;
            const prevIdx = (currentMemoryIndex - 1 + memories.length) % memories.length;
            updateMemoryDisplay(prevIdx, 'prev');
        });
    }

    // ── Keyboard arrow navigation ────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (!memoryPhoto) return;
        if (e.key === 'ArrowRight') nextMemoryBtn && nextMemoryBtn.click();
        if (e.key === 'ArrowLeft')  prevMemoryBtn && prevMemoryBtn.click();
        if (e.key === 'Escape' && photoFullscreenModal && !photoFullscreenModal.classList.contains('hidden')) {
            closePhotoModal();
        }
    });

    // ── Fullscreen Lightbox ──────────────────────────────────────────────────
    function openPhotoModal() {
        if (!photoFullscreenModal) return;
        const mem = memories[currentMemoryIndex];
        modalPhotoImg.src                = mem.image;
        modalMemoryBadge.textContent     = mem.label;
        modalQuoteText.textContent       = mem.quote;

        photoFullscreenModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        gsap.fromTo(photoFullscreenModal.querySelector('.photo-modal-container'),
            { scale: 0.85, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
        );
    }

    function closePhotoModal() {
        if (!photoFullscreenModal) return;
        gsap.to(photoFullscreenModal.querySelector('.photo-modal-container'), {
            scale: 0.85, opacity: 0, duration: 0.3, ease: 'power2.in',
            onComplete: () => {
                photoFullscreenModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    if (polaroidCard) {
        polaroidCard.addEventListener('click', openPhotoModal);
    }

    if (closePhotoModalBtn) {
        closePhotoModalBtn.addEventListener('click', closePhotoModal);
    }

    // Click backdrop to close
    if (photoFullscreenModal) {
        photoFullscreenModal.addEventListener('click', (e) => {
            if (e.target === photoFullscreenModal || e.target.classList.contains('modal-backdrop-blur')) {
                closePhotoModal();
            }
        });
    }

    // ── Photo uploader: push custom photos into memories array ───────────────
    if (photoUploaderEl) {
        photoUploaderEl.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach((file, i) => {
                const url = URL.createObjectURL(file);
                memories.push({
                    image: url,
                    quote: "Another beautiful memory with my favourite person. ❤️",
                    label: `MEMORY ${String(memories.length + 1).padStart(2, '0')}`
                });
            });

            if (files.length > 0) {
                // Jump to first newly uploaded photo
                updateMemoryDisplay(memories.length - files.length, 'next');
                playTone(523, 'sine', 0.3, 0.2);
            }
        });
    }

    // ── Initialize memory display on load ────────────────────────────────────
    function initMemoryGallery() {
        if (!memoryPhoto) return;
        const mem = memories[0];
        memoryPhoto.src                = mem.image;
        memoryBadge.textContent        = mem.label;
        memoryCounterText.textContent  = `${mem.label} / ${memories.length.toString().padStart(2, '0')}`;
        memoryBgBlur.style.backgroundImage = `url('${mem.image}')`;
        revealMemoryQuote(mem.quote);

        // Entrance animation for first card
        gsap.fromTo(polaroidCard,
            { opacity: 0, scale: 0.85, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.5)', delay: 0.2 }
        );
    }
    initMemoryGallery();

    // ==========================================================================
    // 📖 STORY PAGES ENGINE (Dedicated Full-Screen Experience For Each Section)
    // ==========================================================================
    const storyPages = [
        { id: 'curtainOverlay', title: 'Page 1 of 8: Grand Curtain Welcome' },
        { id: 'birthdayReveal', title: 'Page 2 of 8: Birthday Celebration' },
        { id: 'personalLetterSection', title: 'Page 3 of 8: Heartfelt Letter' },
        { id: 'statsSection', title: 'Page 4 of 8: Scientific Analysis & Quotes' },
        { id: 'memoryGallery', title: 'Page 5 of 8: Our Precious Memories' },
        { id: 'cakeTheatreSection', title: 'Page 6 of 8: Birthday Cake Cutting' },
        { id: 'crazySectionPage', title: 'Page 7 of 8: Secret Crazy Zone' },
        { id: 'giftSection', title: 'Page 8 of 8: Final Surprise Gift Box' }
    ];

    let currentStoryPageIndex = 0;
    let stageSequenceHasRun = false;

    window.goToStoryPage = function(pageIndex, autoTrigger = true) {
        const _storyPages = [
            { id: 'curtainOverlay', title: 'Page 1 of 8: Grand Curtain Welcome' },
            { id: 'birthdayReveal', title: 'Page 2 of 8: Birthday Celebration' },
            { id: 'personalLetterSection', title: 'Page 3 of 8: Heartfelt Letter' },
            { id: 'statsSection', title: 'Page 4 of 8: Scientific Analysis & Quotes' },
            { id: 'memoryGallery', title: 'Page 5 of 8: Our Precious Memories' },
            { id: 'cakeTheatreSection', title: 'Page 6 of 8: Birthday Cake Cutting' },
            { id: 'crazySectionPage', title: 'Page 7 of 8: Secret Crazy Zone' },
            { id: 'giftSection', title: 'Page 8 of 8: Final Surprise Gift Box' }
        ];
        const pages = (typeof storyPages !== 'undefined' && storyPages.length) ? storyPages : _storyPages;

        if (pageIndex < 0 || pageIndex >= pages.length) return;

        currentStoryPageIndex = pageIndex;

        // Hide all story pages
        pages.forEach((p) => {
            const el = document.getElementById(p.id);
            if (el) {
                el.classList.remove('active-page');
                el.style.display = 'none';
            }
        });

        // Show active page
        const activeConfig = pages[currentStoryPageIndex];
        const activeEl = document.getElementById(activeConfig.id);
        if (activeEl) {
            activeEl.classList.add('active-page');
            activeEl.style.display = 'flex';
            gsap.fromTo(activeEl, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
        }

        window.scrollTo({ top: 0, behavior: 'instant' });

        // Update nav bar UI
        if (typeof updateStoryNavUI === 'function') updateStoryNavUI();

        // Music check: if going past Page 1 and music not started, start background song
        if (currentStoryPageIndex > 0 && !isMusicPlaying) {
            startBgSong();
        }

        // Trigger page-specific action if requested
        if (autoTrigger && typeof handlePageActivation === 'function') {
            handlePageActivation(currentStoryPageIndex);
        }
    };

    function updateStoryNavUI() {
        const stepTitle = document.getElementById('storyStepTitle');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const dots = document.querySelectorAll('.story-dot');

        if (stepTitle && storyPages[currentStoryPageIndex]) {
            stepTitle.textContent = storyPages[currentStoryPageIndex].title;
        }

        if (prevBtn) {
            prevBtn.disabled = (currentStoryPageIndex === 0);
        }

        if (nextBtn) {
            nextBtn.disabled = (currentStoryPageIndex === storyPages.length - 1);
        }

        dots.forEach((dot, idx) => {
            if (idx === currentStoryPageIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function handlePageActivation(pageIdx) {
        switch (pageIdx) {
            case 0: // Curtain
                gsap.set(curtainLeft, { xPercent: 0 });
                gsap.set(curtainRight, { xPercent: 0 });
                gsap.set(curtainCard, { scale: 1, opacity: 1 });
                break;
            case 1: // Birthday Reveal
                if (!stageSequenceHasRun) {
                    stageSequenceHasRun = true;
                    startCinematicStageSequence();
                } else {
                    if (revealStep1) revealStep1.style.display = 'none';
                    if (revealStep2) revealStep2.style.display = 'none';
                    if (revealStep3) revealStep3.style.display = 'none';
                    if (revealStep4) {
                        revealStep4.style.display = 'block';
                        revealStep4.style.opacity = '1';
                        revealStep4.style.transform = 'scale(1)';
                    }
                    if (revealStep5) {
                        revealStep5.style.display = 'block';
                        revealStep5.style.opacity = '1';
                        revealStep5.style.transform = 'none';
                    }
                    if (cinematicSpotlight) cinematicSpotlight.classList.add('active');
                }
                break;
            case 2: // Letter Section
                startLetterSequence();
                break;
            case 4: // Memory Gallery
                initMemoryGallery();
                break;
            case 5: // Cake Theatre
                if (typeof startCinematicCakeSequence === 'function') startCinematicCakeSequence();
                break;
            case 6: // Secret Crazy Zone
                startSecretLockSequence();
                break;
        }
    }

    // Attach navigation bar event listeners
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            playTone(440, 'sine', 0.2, 0.15);
            window.goToStoryPage(currentStoryPageIndex - 1);
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            playTone(550, 'sine', 0.2, 0.15);
            if (currentStoryPageIndex === 0) {
                // If on curtain, open curtain properly
                openTheatreCurtains();
            } else {
                window.goToStoryPage(currentStoryPageIndex + 1);
            }
        });
    }

    document.querySelectorAll('.story-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const pageIdx = parseInt(dot.getAttribute('data-page'), 10);
            if (!isNaN(pageIdx)) {
                playTone(520, 'sine', 0.2, 0.15);
                window.goToStoryPage(pageIdx);
            }
        });
    });

    // Page-specific action buttons wiring:
    const goToMemoriesBtn = document.getElementById('goToMemoriesBtn');
    if (goToMemoriesBtn) {
        goToMemoriesBtn.addEventListener('click', () => {
            playTone(523, 'triangle', 0.4, 0.25);
            window.goToStoryPage(4);
        });
    }

    const goToCakeBtn = document.getElementById('goToCakeBtn');
    if (goToCakeBtn) {
        goToCakeBtn.addEventListener('click', () => {
            playTone(523, 'triangle', 0.4, 0.25);
            window.goToStoryPage(5);
        });
    }

    const goToGiftFromCrazyBtn = document.getElementById('goToGiftFromCrazyBtn');
    if (goToGiftFromCrazyBtn) {
        goToGiftFromCrazyBtn.addEventListener('click', () => {
            playTone(587, 'triangle', 0.4, 0.25);
            window.goToStoryPage(7);
        });
    }

    const replayCelebrationBtn = document.getElementById('replayCelebrationBtn');
    if (replayCelebrationBtn) {
        replayCelebrationBtn.addEventListener('click', () => {
            playTone(440, 'sine', 0.4, 0.25);
            window.goToStoryPage(0);
        });
    }

    const quickUnlockBtn = document.getElementById('quickUnlockBtn');
    if (quickUnlockBtn) {
        quickUnlockBtn.addEventListener('click', () => {
            playTone(660, 'sine', 0.4, 0.3);
            attemptUnlockCrazyZone(true);
        });
    }

    // Initialize to Page 0 (Curtain) on load
    window.goToStoryPage(0, false);

});
