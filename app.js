/**
 * 116學年度中投區免試入學比序互動平台主程式 (Vue 3)
 */

function initChotouApp() {
  if (!window.ChotouRules) {
    console.error('ChotouRules not found, retrying...');
    setTimeout(initChotouApp, 50);
    return;
  }

  if (typeof Vue === 'undefined') {
    console.error('Vue 3 library not loaded, retrying...');
    setTimeout(initChotouApp, 50);
    return;
  }

  const { 
    GRADE_POINTS, 
    GRADE_SCORES, 
    GRADE_PLUS_COUNT, 
    SUBJECT_ORDER, 
    POPULAR_SCHOOLS, 
    HISTORICAL_CUTOFF_TABLE,
    TCIVS_114_CUTOFF_DATA,
    TCIVS_114_NOTES,
    SCHOOL_CAPACITIES_AND_CUTOFFS,
    POPULATION_CURVE,
    computeStudentStats, 
    compareTwoStudents,
    estimateStudentRankIn30k,
    simulate30kAdmissions,
    QUIZ_CHALLENGES, 
    FLOWCHART_TREE 
  } = window.ChotouRules;

  const { createApp, ref, computed, watch, nextTick, onMounted } = Vue;

  createApp({
    setup() {
      // 當前主頁籤：
      // 'quiz' (PK猜猜看) | 'sandbox' (自由模擬) | 'simulator' (3萬人篩選器) | 'charts' (落點兩大圖) | 'flowchart' (流程圖) | 'tips' (錦囊)
      const activeTab = ref('quiz');

      // 圖片燈箱狀態 (放大檢視原圖)
      const activeModalImage = ref(null);
      function openImageModal(imgSrc, title) {
        activeModalImage.value = { src: imgSrc, title };
      }
      function closeImageModal() {
        activeModalImage.value = null;
      }

      // ==================== 音效引擎 (Web Audio API) ====================
      let audioCtx = null;
      function playBeep(freq = 440, type = 'sine', duration = 0.08) {
        try {
          if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
      }

      function playWinSound() {
        playBeep(523.25, 'triangle', 0.1);
        setTimeout(() => playBeep(659.25, 'triangle', 0.1), 100);
        setTimeout(() => playBeep(783.99, 'triangle', 0.15), 200);
        setTimeout(() => playBeep(1046.50, 'triangle', 0.35), 320);
      }

      function playPassSound() {
        playBeep(587.33, 'sine', 0.06);
      }

      function playWrongSound() {
        playBeep(330, 'sawtooth', 0.15);
        setTimeout(() => playBeep(261.63, 'sawtooth', 0.25), 160);
      }

      // ============================================================================
      // 運動賽事現場加油與擂台音效引擎 (Web Audio Sports Stadium Sound Engine)
      // ============================================================================
      class StadiumSoundEngine {
        constructor() {
          this.ctx = null;
          this.masterGain = null;
          this.crowdGain = null;
          this.noiseNode = null;
          this.lfo = null;
          this.isPlaying = false;
          this.volume = 0.35;
          this.ambientTimer = null;
        }

        init() {
          if (this.ctx) return;
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
          } catch (e) {
            console.warn('Web Audio not supported:', e);
          }
        }

        ensureContext() {
          this.init();
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
        }

        startCrowd() {
          this.ensureContext();
          if (!this.ctx || this.isPlaying) return;

          try {
            // 生成 4 秒粉紅/白噪聲循環緩衝區以模擬萬人體育館背景群眾聲浪
            const bufferSize = this.ctx.sampleRate * 4;
            const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
              const data = noiseBuffer.getChannelData(ch);
              let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
              for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
                b6 = white * 0.115926;
              }
            }

            this.noiseNode = this.ctx.createBufferSource();
            this.noiseNode.buffer = noiseBuffer;
            this.noiseNode.loop = true;

            // 雙帶通共鳴濾波器 (模擬遠端群眾歡呼波浪 460Hz 與 1400Hz)
            const bpf = this.ctx.createBiquadFilter();
            bpf.type = 'bandpass';
            bpf.frequency.setValueAtTime(460, this.ctx.currentTime);
            bpf.Q.setValueAtTime(1.8, this.ctx.currentTime);

            const lpf = this.ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.setValueAtTime(1600, this.ctx.currentTime);

            this.crowdGain = this.ctx.createGain();
            this.crowdGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            this.crowdGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.0);

            // LFO 低頻起伏振盪器 (0.16Hz，模擬現場人潮一波波歡呼聲浪)
            this.lfo = this.ctx.createOscillator();
            this.lfo.frequency.setValueAtTime(0.16, this.ctx.currentTime);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(0.10, this.ctx.currentTime);
            this.lfo.connect(lfoGain);
            lfoGain.connect(this.crowdGain.gain);

            this.noiseNode.connect(bpf);
            bpf.connect(lpf);
            lpf.connect(this.crowdGain);
            this.crowdGain.connect(this.masterGain);

            this.noiseNode.start();
            this.lfo.start();
            this.isPlaying = true;

            // 定期隨機穿插球證哨聲或遠端加油熱烈度
            if (this.ambientTimer) clearInterval(this.ambientTimer);
            this.ambientTimer = setInterval(() => {
              if (!this.isPlaying) return;
              const r = Math.random();
              if (r < 0.35) {
                this.playRefereeWhistle(false);
              } else if (r < 0.7) {
                this.swellCrowdRoar(0.15, 2.0);
              }
            }, 6500);

          } catch (e) {
            console.error('startCrowd error:', e);
          }
        }

        stopCrowd() {
          if (!this.isPlaying || !this.crowdGain) return;
          try {
            this.crowdGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
            setTimeout(() => {
              if (this.noiseNode) {
                try { this.noiseNode.stop(); } catch (e) {}
                this.noiseNode.disconnect();
                this.noiseNode = null;
              }
              if (this.lfo) {
                try { this.lfo.stop(); } catch (e) {}
                this.lfo.disconnect();
                this.lfo = null;
              }
              this.isPlaying = false;
            }, 450);
            if (this.ambientTimer) clearInterval(this.ambientTimer);
          } catch (e) {}
        }

        swellCrowdRoar(amount = 0.2, duration = 2.0) {
          if (!this.isPlaying || !this.crowdGain) return;
          try {
            const now = this.ctx.currentTime;
            this.crowdGain.gain.linearRampToValueAtTime(0.35 + amount, now + 0.3);
            this.crowdGain.gain.linearRampToValueAtTime(0.25, now + duration);
          } catch (e) {}
        }

        // 拳擊擂台經典銅鐘響聲 (Ding! Ding! Ding!)
        playBoxingBell(repeats = 3) {
          this.ensureContext();
          if (!this.ctx) return;
          for (let i = 0; i < repeats; i++) {
            setTimeout(() => {
              try {
                const now = this.ctx.currentTime;
                const freqs = [1200, 2400, 3600];
                freqs.forEach((f, idx) => {
                  const osc = this.ctx.createOscillator();
                  const gain = this.ctx.createGain();
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(f, now);
                  const initAmp = (0.35 / (idx + 1)) * this.volume;
                  gain.gain.setValueAtTime(initAmp, now);
                  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
                  osc.connect(gain);
                  gain.connect(this.masterGain || this.ctx.destination);
                  osc.start(now);
                  osc.stop(now + 0.85);
                });
              } catch (e) {}
            }, i * 160);
          }
        }

        // 運動賽事哨聲 (Tweet! Tweet!)
        playRefereeWhistle(double = true) {
          this.ensureContext();
          if (!this.ctx) return;
          const playChirp = (delay = 0) => {
            setTimeout(() => {
              try {
                const now = this.ctx.currentTime;
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(2850, now);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(3150, now);
                
                gain.gain.setValueAtTime(0.12 * this.volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.2);
                osc2.stop(now + 0.2);
              } catch (e) {}
            }, delay);
          };

          playChirp(0);
          if (double) playChirp(130);
        }

        // 拳擊出拳重擊打擊音 (Punch Impact)
        playPunchSound(isHeavy = false) {
          this.ensureContext();
          if (!this.ctx) return;
          try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(isHeavy ? 180 : 250, now);
            osc.frequency.exponentialRampToValueAtTime(36, now + (isHeavy ? 0.22 : 0.12));

            gain.gain.setValueAtTime((isHeavy ? 0.45 : 0.25) * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.22 : 0.12));

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);
            osc.start(now);
            osc.stop(now + (isHeavy ? 0.22 : 0.12));
          } catch (e) {}
        }

        // 獲勝全場大歡呼狂潮爆發 (Victory Crowd Climax)
        playCheerClimax() {
          this.ensureContext();
          this.swellCrowdRoar(0.35, 3.5);
          this.playBoxingBell(2);
          try {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((note, i) => {
              setTimeout(() => {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(note, now);
                gain.gain.setValueAtTime(0.14 * this.volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.55);
              }, i * 110);
            });
          } catch (e) {}
        }

        // ============================================================================
        // 臺灣運動賽事「加～油！加～油！」真人集體吶喊聲 (Human Crowd Chant Synthesis)
        // ============================================================================
        playHumanCrowdChant() {
          this.ensureContext();
          if (!this.ctx) return;

          const now = this.ctx.currentTime;
          this.swellCrowdRoar(0.2, 3.5);

          // 雙拍集體共鳴吶喊：「加～！」(約 0.45s) + 短停 (0.15s) + 「油～！」(約 0.55s)，呼喊 2 次
          const chantRounds = [
            { start: 0.0, syllable: 'jia', dur: 0.45 },
            { start: 0.6, syllable: 'you', dur: 0.55 },
            { start: 1.4, syllable: 'jia', dur: 0.45 },
            { start: 2.0, syllable: 'you', dur: 0.65 }
          ];

          chantRounds.forEach(round => {
            const t0 = now + round.start;
            const dur = round.dur;

            // 多重微音高位移振盪器群 (模擬上百位不同性別年齡觀眾同時發聲)
            const voicePitches = round.syllable === 'jia' 
              ? [196, 220, 246.9, 293.6, 330, 392, 440] // G3, A3, B3, D4, E4, G4, A4
              : [174.6, 196, 220, 261.6, 311, 370];     // F3, G3, A3, C4, Eb4, F#4

            voicePitches.forEach((pitch, idx) => {
              const detune = (Math.random() - 0.5) * 35;
              const osc = this.ctx.createOscillator();
              const gain = this.ctx.createGain();

              osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
              osc.frequency.setValueAtTime(pitch, t0);
              if (round.syllable === 'jia') {
                osc.frequency.linearRampToValueAtTime(pitch * 1.05, t0 + dur * 0.4);
              } else {
                osc.frequency.linearRampToValueAtTime(pitch * 0.94, t0 + dur);
              }
              osc.detune.setValueAtTime(detune, t0);

              // 人聲母音共振峰 (Vocal Formants) 帶通濾波器
              // "加" (/a/): F1 ~ 820Hz, F2 ~ 1350Hz
              // "油" (/o/): F1 ~ 480Hz, F2 ~ 900Hz
              const f1 = this.ctx.createBiquadFilter();
              f1.type = 'bandpass';
              f1.Q.setValueAtTime(4.2, t0);
              f1.frequency.setValueAtTime(round.syllable === 'jia' ? 820 : 480, t0);

              const f2 = this.ctx.createBiquadFilter();
              f2.type = 'bandpass';
              f2.Q.setValueAtTime(5.0, t0);
              f2.frequency.setValueAtTime(round.syllable === 'jia' ? 1350 : 900, t0);

              const baseAmp = (0.05 / (voicePitches.length * 0.5)) * this.volume;
              gain.gain.setValueAtTime(0.0001, t0);
              gain.gain.linearRampToValueAtTime(baseAmp, t0 + 0.08);
              gain.gain.setValueAtTime(baseAmp * 0.9, t0 + dur * 0.7);
              gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

              osc.connect(f1);
              osc.connect(f2);
              f1.connect(gain);
              f2.connect(gain);
              gain.connect(this.masterGain || this.ctx.destination);

              osc.start(t0);
              osc.stop(t0 + dur);
            });

            // 伴隨人聲氣流噪聲 (模擬人群呼吸吹氣共鳴)
            const noiseGain = this.ctx.createGain();
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(round.syllable === 'jia' ? 1200 : 750, t0);
            noiseFilter.Q.setValueAtTime(2.5, t0);

            const bLen = Math.floor(this.ctx.sampleRate * dur);
            const nBuff = this.ctx.createBuffer(1, bLen, this.ctx.sampleRate);
            const nData = nBuff.getChannelData(0);
            for (let i = 0; i < bLen; i++) nData[i] = (Math.random() * 2 - 1) * 0.15;
            const nSrc = this.ctx.createBufferSource();
            nSrc.buffer = nBuff;

            noiseGain.gain.setValueAtTime(0.0001, t0);
            noiseGain.gain.linearRampToValueAtTime(0.035 * this.volume, t0 + 0.08);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

            nSrc.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain || this.ctx.destination);
            nSrc.start(t0);
            nSrc.stop(t0 + dur);
          });

          // 吶喊結束後響起鼓掌聲
          setTimeout(() => {
            this.playClappingApplause(1.8);
          }, 2700);
        }

        // ============================================================================
        // 萬人如雷掌聲合成器 (Clapping Applause Synthesis)
        // ============================================================================
        playClappingApplause(duration = 2.0) {
          this.ensureContext();
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const clapCount = Math.floor(40 * duration);

          for (let i = 0; i < clapCount; i++) {
            const clapDelay = Math.random() * duration;
            const clapTime = now + clapDelay;

            const clapLen = Math.floor(this.ctx.sampleRate * 0.035);
            const clapBuf = this.ctx.createBuffer(1, clapLen, this.ctx.sampleRate);
            const clapData = clapBuf.getChannelData(0);
            for (let s = 0; s < clapLen; s++) {
              clapData[s] = (Math.random() * 2 - 1) * Math.exp(-s / (clapLen * 0.25));
            }

            const src = this.ctx.createBufferSource();
            src.buffer = clapBuf;

            const bpf = this.ctx.createBiquadFilter();
            bpf.type = 'bandpass';
            bpf.frequency.setValueAtTime(900 + Math.random() * 1200, clapTime);
            bpf.Q.setValueAtTime(2.2, clapTime);

            const gain = this.ctx.createGain();
            const vol = (0.05 + Math.random() * 0.08) * this.volume;
            gain.gain.setValueAtTime(vol, clapTime);
            gain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.035);

            src.connect(bpf);
            bpf.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            src.start(clapTime);
            src.stop(clapTime + 0.035);
          }
        }

        // ============================================================================
        // 全場暴動狂歡音效 (Crowd Explosion: 巨浪聲浪 + 雙哨 + 雙銅鐘 + 熱烈掌聲)
        // ============================================================================
        playCrowdExplosion() {
          this.ensureContext();
          this.swellCrowdRoar(0.4, 4.0);
          this.playRefereeWhistle(true);
          this.playBoxingBell(3);
          this.playClappingApplause(3.0);
        }

        setVolume(vol) {
          this.volume = Math.max(0, Math.min(1, vol));
          if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
          }
        }
      }

      const stadium = new StadiumSoundEngine();
      const isStadiumCrowdPlaying = ref(false);
      const stadiumVolume = ref(0.4);

      function toggleStadiumCrowd() {
        if (isStadiumCrowdPlaying.value) {
          stadium.stopCrowd();
          isStadiumCrowdPlaying.value = false;
        } else {
          stadium.startCrowd();
          isStadiumCrowdPlaying.value = true;
        }
      }

      function setStadiumVolume(val) {
        stadiumVolume.value = val;
        stadium.setVolume(val);
      }

      function playBoxingBellSound() {
        stadium.playBoxingBell(2);
      }

      function playRefereeWhistleSound() {
        stadium.playRefereeWhistle(true);
      }

      function playHumanCrowdChantSound() {
        stadium.playHumanCrowdChant();
      }

      function playApplauseSound() {
        stadium.playClappingApplause(2.2);
      }

      function playCrowdExplosionSound() {
        stadium.playCrowdExplosion();
      }

      // ============================================================================
      // 選手點擊出拳與跳躍互動動作控制 (Interactive Punching & Spring Jumping)
      // ============================================================================
      const isAJumping = ref(false);
      const isBJumping = ref(false);
      const isAPunching = ref(false);
      const isBPunching = ref(false);

      function triggerActionA() {
        isAJumping.value = true;
        isAPunching.value = true;
        stadium.playPunchSound(true);
        setTimeout(() => {
          isAJumping.value = false;
          isAPunching.value = false;
        }, 650);
      }

      function triggerActionB() {
        isBJumping.value = true;
        isBPunching.value = true;
        stadium.playPunchSound(true);
        setTimeout(() => {
          isBJumping.value = false;
          isBPunching.value = false;
        }, 650);
      }

      // ============================================================================
      // 開啟網頁強制免責與教學警語彈窗狀態 (Mandatory Disclaimer Modal)
      // ============================================================================
      const showDisclaimerModal = ref(true);
      function confirmDisclaimer() {
        showDisclaimerModal.value = false;
        stadium.playBoxingBell(1);
      }

      // 舞台模式切換：'boxing' (熱血拳擊擂台) 或 'running' (疾速田徑賽跑)
      const arenaTheme = ref('boxing');
      function toggleArenaTheme() {
        arenaTheme.value = arenaTheme.value === 'boxing' ? 'running' : 'boxing';
        stadium.playRefereeWhistle(false);
      }

      // 手遊 Combo 連擊計數器
      const comboStreak = ref(0);
      const maxCombo = ref(0);

      // ============================================================================
      // 可愛動漫 Chibi 造型 SVG 生成器 (15 款活潑手遊立繪造型)
      // ============================================================================
      function getAnimeAvatarSvg(student, corner, state) {
        const type = student?.animeType || (corner === 'RED' ? 'boy_hotblood' : 'girl_twintail');
        const isRed = corner === 'RED';
        const primaryColor = isRed ? '#ef4444' : '#3b82f6';
        const secondaryColor = isRed ? '#f87171' : '#60a5fa';
        const gloveColor = isRed ? '#dc2626' : '#2563eb';
        const gloveTrim = '#ffffff';

        const isWinner = state === 'winner';
        const isLoser = state === 'loser';
        const isPunching = state === 'punching';

        // 眼睛與表情
        let eyesSvg = '';
        if (isWinner) {
          eyesSvg = `
            <!-- 得意單眼眨眼 + 閃亮星星眼 -->
            <path d="M 36 50 Q 44 42 52 50" stroke="#0f172a" stroke-width="4" stroke-linecap="round" fill="none" />
            <polygon class="tooth-sparkle" points="44,36 46,41 51,43 46,45 44,50 42,45 37,43 42,41" fill="#fbbf24" />
            <ellipse cx="76" cy="49" rx="8" ry="10" fill="#0f172a" />
            <ellipse cx="76" cy="51" rx="6.5" ry="7.5" fill="${isRed ? '#be123c' : '#1d4ed8'}" />
            <circle cx="73.5" cy="46" r="3.2" fill="#ffffff" />
            <circle cx="78.5" cy="52" r="1.6" fill="#ffffff" />
            <polygon class="tooth-sparkle" points="76,34 78,39 83,41 78,43 76,48 74,43 69,41 74,39" fill="#fbbf24" />
          `;
        } else if (isLoser) {
          eyesSvg = `
            <!-- 搞笑痛哭 X 眼睛與瀑布淚水 -->
            <path d="M 37 45 L 49 55 M 49 45 L 37 55" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" />
            <path d="M 71 45 L 83 55 M 83 45 L 71 55" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" />
            <!-- 搞笑瀑布淚水噴射動畫 -->
            <g class="tears-flow">
              <path d="M 38 55 C 34 66 30 80 30 96 C 30 102 44 102 44 96 C 44 80 44 66 44 55 Z" fill="#38bdf8" opacity="0.85" />
              <circle cx="36" cy="100" r="3.5" fill="#7dd3fc" />
              <path d="M 76 55 C 76 66 76 80 76 96 C 76 102 90 102 90 96 C 90 80 86 66 82 55 Z" fill="#38bdf8" opacity="0.85" />
              <circle cx="84" cy="100" r="3.5" fill="#7dd3fc" />
            </g>
            <!-- 額頭冷汗滴 -->
            <path d="M 88 32 C 92 37 91 42 87 42 C 83 42 81 37 84 32 Z" fill="#67e8f9" />
          `;
        } else if (isPunching) {
          eyesSvg = `
            <!-- 認真熱血出拳眼神 + 額頭暴起青筋 💢 -->
            <g class="vein-pop" transform="translate(${isRed ? '32, 28' : '78, 28'})">
              <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
              <path d="M -6 0 Q -2 0 -2 -4 M 6 0 Q 2 0 2 -4 M 0 -6 Q 0 -2 -4 -2 M 0 6 Q 0 2 4 2" stroke="#ef4444" stroke-width="2" fill="none" />
            </g>
            <ellipse cx="44" cy="49" rx="8" ry="9" fill="#0f172a" />
            <ellipse cx="44" cy="50" rx="6" ry="6.5" fill="${isRed ? '#b91c1c' : '#1d4ed8'}" />
            <circle cx="42" cy="47" r="2.5" fill="#ffffff" />
            <path d="M 33 42 L 53 45" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
            <ellipse cx="76" cy="49" rx="8" ry="9" fill="#0f172a" />
            <ellipse cx="76" cy="50" rx="6" ry="6.5" fill="${isRed ? '#b91c1c' : '#1d4ed8'}" />
            <circle cx="74" cy="47" r="2.5" fill="#ffffff" />
            <path d="M 87 42 L 67 45" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
          `;
        } else {
          const irisColor = isRed ? '#be123c' : '#1d4ed8';
          eyesSvg = `
            <g class="chibi-eye">
              <ellipse cx="44" cy="49" rx="8" ry="10" fill="#0f172a" />
              <ellipse cx="44" cy="51" rx="6.5" ry="7.5" fill="${irisColor}" />
              <circle cx="41.5" cy="46" r="3.2" fill="#ffffff" />
              <circle cx="46.5" cy="52" r="1.6" fill="#ffffff" />
              <path d="M 35 42 Q 44 37 53 43" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />
              <ellipse cx="76" cy="49" rx="8" ry="10" fill="#0f172a" />
              <ellipse cx="76" cy="51" rx="6.5" ry="7.5" fill="${irisColor}" />
              <circle cx="73.5" cy="46" r="3.2" fill="#ffffff" />
              <circle cx="78.5" cy="52" r="1.6" fill="#ffffff" />
              <path d="M 67 43 Q 76 37 85 42" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />
            </g>
          `;
        }

        // 嘴巴
        let mouthSvg = '';
        if (isWinner) {
          mouthSvg = `
            <!-- 吐舌頭得意大笑 + 牙齒星光 -->
            <path d="M 50 63 Q 60 76 70 63 Z" fill="#e11d48" stroke="#0f172a" stroke-width="2" />
            <path d="M 55 69 Q 60 78 65 69 Z" fill="#f43f5e" />
            <polygon class="tooth-sparkle" points="67,61 68,63 71,64 68,65 67,67 66,65 63,64 66,63" fill="#ffffff" />
          `;
        } else if (isPunching) {
          mouthSvg = `
            <!-- 咬牙切齒喊叫嘴形 -->
            <rect x="52" y="62" width="16" height="8" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
            <line x1="60" y1="62" x2="60" y2="70" stroke="#0f172a" stroke-width="1.5" />
          `;
        } else if (isLoser) {
          mouthSvg = `
            <!-- 倒 V 委屈嚎啕大哭嘴 -->
            <path d="M 52 70 Q 60 61 68 70 Q 60 66 52 70 Z" fill="#991b1b" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
          `;
        } else {
          mouthSvg = `<path d="M 54 64 Q 60 70 66 64" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none" />`;
        }

        // 髮型與專屬動漫配件
        let hairAndAccessories = '';
        switch (type) {
          case 'boy_hotblood':
            hairAndAccessories = `
              <path d="M 24 50 Q 20 20 60 16 Q 100 20 96 50 Z" fill="#78350f" />
              <rect x="23" y="32" width="74" height="11" rx="3" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
              <circle cx="60" cy="37.5" r="4.2" fill="#ef4444" />
              <path d="M 24 35 L 36 44 L 46 33 L 56 45 L 66 33 L 78 45 L 94 35 L 86 24 L 60 18 L 32 24 Z" fill="#92400e" />
            `;
            break;
          case 'boy_glasses':
            hairAndAccessories = `
              <path d="M 24 50 Q 20 18 60 14 Q 100 18 96 50 Z" fill="#1e1b4b" />
              <path d="M 26 36 Q 44 48 60 38 Q 78 48 94 36 Q 76 20 60 16 Q 40 20 26 36 Z" fill="#312e81" />
              <rect x="33" y="44" width="23" height="15" rx="3" fill="none" stroke="#0f172a" stroke-width="2.5" />
              <rect x="64" y="44" width="23" height="15" rx="3" fill="none" stroke="#0f172a" stroke-width="2.5" />
              <line x1="56" y1="51" x2="64" y2="51" stroke="#0f172a" stroke-width="2.5" />
              <line x1="36" y1="46" x2="48" y2="56" stroke="#ffffff" stroke-width="2" opacity="0.8" />
              <line x1="67" y1="46" x2="79" y2="56" stroke="#ffffff" stroke-width="2" opacity="0.8" />
            `;
            break;
          case 'girl_twintail':
            hairAndAccessories = `
              <path d="M 26 40 C 6 42 0 72 16 84 C 24 74 24 52 26 40 Z" fill="#db2777" />
              <circle cx="23" cy="40" r="5" fill="#f43f5e" />
              <path d="M 94 40 C 114 42 120 72 104 84 C 96 74 96 52 94 40 Z" fill="#db2777" />
              <circle cx="97" cy="40" r="5" fill="#f43f5e" />
              <path d="M 26 38 C 40 46 50 42 60 44 C 70 42 80 46 94 38 C 90 20 78 16 60 15 C 42 16 30 20 26 38 Z" fill="#be185d" />
            `;
            break;
          case 'girl_longhair':
            hairAndAccessories = `
              <path d="M 24 45 L 20 90 L 32 90 L 30 55 Z" fill="#1e293b" />
              <path d="M 96 45 L 100 90 L 88 90 L 90 55 Z" fill="#1e293b" />
              <path d="M 24 45 Q 22 18 60 15 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#0f172a" />
              <circle cx="34" cy="34" r="5" fill="#f472b6" />
              <circle cx="34" cy="34" r="2" fill="#fef08a" />
            `;
            break;
          case 'girl_sporty':
            hairAndAccessories = `
              <path d="M 75 25 C 95 10 115 25 105 50 C 95 38 82 32 75 25 Z" fill="#c2410c" />
              <circle cx="75" cy="25" r="4.5" fill="#38bdf8" />
              <rect x="24" y="32" width="72" height="9" rx="3" fill="#38bdf8" />
              <path d="M 24 38 Q 42 46 60 40 Q 78 46 96 38 Q 80 20 60 17 Q 40 20 24 38 Z" fill="#9a3412" />
            `;
            break;
          case 'boy_cap':
            hairAndAccessories = `
              <path d="M 22 45 L 28 55 L 34 48 Z" fill="#451a03" />
              <path d="M 98 45 L 92 55 L 86 48 Z" fill="#451a03" />
              <ellipse cx="60" cy="28" rx="36" ry="18" fill="${primaryColor}" />
              <path d="M 28 28 Q 60 12 92 28 Z" fill="${secondaryColor}" />
              <path d="M 38 32 Q 60 38 82 32 L 86 36 Q 60 44 34 36 Z" fill="#0f172a" />
            `;
            break;
          case 'girl_cute':
            hairAndAccessories = `
              <path d="M 24 45 Q 20 20 60 16 Q 100 20 96 45 Q 98 68 88 74 L 88 56 Q 60 44 32 56 L 32 74 Q 22 68 24 45 Z" fill="#be185d" />
              <rect x="34" y="36" width="10" height="4" rx="2" fill="#facc15" />
              <rect x="76" y="36" width="10" height="4" rx="2" fill="#facc15" />
            `;
            break;
          case 'boy_tech':
            hairAndAccessories = `
              <path d="M 24 45 Q 22 18 60 14 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#0284c7" />
              <path d="M 20 40 Q 60 16 100 40" stroke="#38bdf8" stroke-width="4" fill="none" />
              <rect x="18" y="44" width="8" height="18" rx="3" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
              <rect x="94" y="44" width="8" height="18" rx="3" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
            `;
            break;
          case 'boy_runner':
            hairAndAccessories = `
              <path d="M 24 46 L 16 36 L 28 36 L 24 24 L 38 32 L 44 18 L 54 32 L 64 16 L 72 32 L 82 20 L 86 34 L 96 30 L 92 46 Z" fill="#ea580c" />
              <rect x="23" y="32" width="74" height="10" rx="3" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
            `;
            break;
          case 'boy_hoodie':
            hairAndAccessories = `
              <path d="M 24 45 Q 22 18 60 14 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#475569" />
              <path d="M 22 68 Q 60 84 98 68 L 102 82 Q 60 100 18 82 Z" fill="#334155" />
            `;
            break;
          case 'boy_fighter':
            hairAndAccessories = `
              <path d="M 24 48 L 18 30 L 32 36 L 40 20 L 52 34 L 66 18 L 78 34 L 92 24 L 88 44 Z" fill="#b91c1c" />
              <rect x="76" y="62" width="10" height="5" rx="1.5" fill="#fde68a" stroke="#d97706" stroke-width="1" transform="rotate(-15 76 62)" />
            `;
            break;
          case 'boy_mechanic':
            hairAndAccessories = `
              <path d="M 24 45 Q 22 18 60 14 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#ca8a04" />
              <rect x="36" y="26" width="20" height="12" rx="3" fill="#475569" stroke="#94a3b8" stroke-width="2" />
              <rect x="64" y="26" width="20" height="12" rx="3" fill="#475569" stroke="#94a3b8" stroke-width="2" />
              <line x1="56" y1="32" x2="64" y2="32" stroke="#94a3b8" stroke-width="3" />
            `;
            break;
          case 'girl_twins_a':
            hairAndAccessories = `
              <path d="M 24 45 Q 20 20 60 16 Q 100 20 96 45 Q 98 68 88 74 L 88 56 Q 60 44 32 56 L 32 74 Q 22 68 24 45 Z" fill="#db2777" />
              <circle cx="34" cy="34" r="6" fill="#f43f5e" />
              <circle cx="34" cy="34" r="2.5" fill="#ffffff" />
            `;
            break;
          case 'girl_twins_b':
            hairAndAccessories = `
              <path d="M 24 45 Q 20 20 60 16 Q 100 20 96 45 Q 98 68 88 74 L 88 56 Q 60 44 32 56 L 32 74 Q 22 68 24 45 Z" fill="#0284c7" />
              <circle cx="86" cy="34" r="6" fill="#38bdf8" />
              <circle cx="86" cy="34" r="2.5" fill="#ffffff" />
            `;
            break;
          case 'boy_cool':
            hairAndAccessories = `
              <!-- 酷炫銀藍挑染短髮與單側耳機 -->
              <path d="M 24 46 L 16 34 L 28 34 L 22 20 L 38 28 L 46 14 L 56 30 L 68 12 L 76 28 L 86 18 L 92 32 L 96 46 Z" fill="#334155" />
              <path d="M 32 26 L 44 16 L 52 28 L 64 15 L 72 26 Z" fill="#38bdf8" />
              <circle cx="94" cy="50" r="4.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
            `;
            break;
          case 'girl_glasses':
            hairAndAccessories = `
              <!-- 知性文青長直髮與紅色圓形眼鏡 -->
              <path d="M 24 45 L 20 90 L 32 90 L 30 55 Z" fill="#3b0764" />
              <path d="M 96 45 L 100 90 L 88 90 L 90 55 Z" fill="#3b0764" />
              <path d="M 24 45 Q 22 18 60 15 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#581c87" />
              <circle cx="44" cy="50" r="11" fill="none" stroke="#ef4444" stroke-width="2.5" />
              <circle cx="76" cy="50" r="11" fill="none" stroke="#ef4444" stroke-width="2.5" />
              <line x1="55" y1="50" x2="65" y2="50" stroke="#ef4444" stroke-width="2.5" />
            `;
            break;
          default:
            hairAndAccessories = `
              <path d="M 24 45 Q 22 18 60 14 Q 98 18 96 45 Q 80 34 60 36 Q 40 34 24 45 Z" fill="#334155" />
            `;
        }

        // 拳擊手套與出拳/勝利姿態
        let glovesSvg = '';
        if (isWinner) {
          glovesSvg = `
            <g class="crown-anim" transform="translate(42, -2)">
              <polygon points="0,14 6,4 18,10 30,4 36,14" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
              <circle cx="6" cy="4" r="2" fill="#ef4444" />
              <circle cx="18" cy="10" r="2" fill="#3b82f6" />
              <circle cx="30" cy="4" r="2" fill="#10b981" />
            </g>
            <g transform="translate(14, 22)">
              <ellipse cx="12" cy="12" rx="11" ry="13" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="21" width="12" height="6" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
            <g transform="translate(82, 22)">
              <ellipse cx="12" cy="12" rx="11" ry="13" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="21" width="12" height="6" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
          `;
        } else if (isPunching) {
          const isRedPunch = isRed;
          glovesSvg = isRedPunch ? `
            <g transform="translate(74, 50) rotate(12)">
              <!-- 巨力拳套出拳打擊 + 衝擊波星光 -->
              <ellipse cx="22" cy="16" rx="20" ry="17" fill="${gloveColor}" stroke="#0f172a" stroke-width="2.5" />
              <rect x="2" y="10" width="10" height="12" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
              <line x1="44" y1="6" x2="56" y2="2" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" />
              <line x1="46" y1="16" x2="60" y2="16" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
              <line x1="44" y1="26" x2="56" y2="30" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" />
              <polygon points="54,12 56,15 59,16 56,17 54,20 53,17 50,16 53,15" fill="#facc15" />
            </g>
            <g transform="translate(18, 68)">
              <ellipse cx="12" cy="12" rx="12" ry="12" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="20" width="12" height="5" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
          ` : `
            <g transform="translate(6, 50) rotate(-12)">
              <!-- 巨力拳套出拳打擊 + 衝擊波星光 -->
              <ellipse cx="16" cy="16" rx="20" ry="17" fill="${gloveColor}" stroke="#0f172a" stroke-width="2.5" />
              <rect x="26" y="10" width="10" height="12" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
              <line x1="-8" y1="6" x2="-20" y2="2" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" />
              <line x1="-10" y1="16" x2="-24" y2="16" stroke="#3b82f6" stroke-width="4" stroke-linecap="round" />
              <line x1="-8" y1="26" x2="-20" y2="30" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" />
              <polygon points="-16,12 -14,15 -11,16 -14,17 -16,20 -17,17 -20,16 -17,15" fill="#facc15" />
            </g>
            <g transform="translate(76, 68)">
              <ellipse cx="12" cy="12" rx="12" ry="12" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="20" width="12" height="5" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
          `;
        } else {
          glovesSvg = `
            <g transform="translate(24, 70)">
              <ellipse cx="12" cy="12" rx="12" ry="12" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="20" width="12" height="5" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
            <g transform="translate(72, 70)">
              <ellipse cx="12" cy="12" rx="12" ry="12" fill="${gloveColor}" stroke="#0f172a" stroke-width="2" />
              <rect x="6" y="20" width="12" height="5" rx="2" fill="${gloveTrim}" stroke="#0f172a" stroke-width="1.5" />
            </g>
          `;
        }

        return `
          <svg viewBox="0 0 120 120" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="aura-${isRed ? 'red' : 'blue'}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.3" />
                <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="62" r="50" fill="url(#aura-${isRed ? 'red' : 'blue'})" />
            <g transform="translate(36, 74)">
              <path d="M 6 0 L 42 0 L 46 36 L 2 36 Z" fill="${primaryColor}" stroke="#0f172a" stroke-width="2.5" />
              <rect x="18" y="6" width="12" height="15" rx="2" fill="#ffffff" opacity="0.9" />
              <text x="24" y="18" font-size="10" font-weight="900" fill="#0f172a" text-anchor="middle">${isRed ? 'A' : 'B'}</text>
            </g>
            <ellipse cx="28" cy="54" rx="5" ry="6" fill="#fde68a" stroke="#0f172a" stroke-width="2" />
            <ellipse cx="92" cy="54" rx="5" ry="6" fill="#fde68a" stroke="#0f172a" stroke-width="2" />
            <ellipse cx="60" cy="54" rx="34" ry="28" fill="#fde68a" stroke="#0f172a" stroke-width="2.5" />
            <ellipse cx="38" cy="61" rx="6" ry="3.5" fill="#f43f5e" opacity="0.45" />
            <ellipse cx="82" cy="61" rx="6" ry="3.5" fill="#f43f5e" opacity="0.45" />
            ${eyesSvg}
            ${mouthSvg}
            ${hairAndAccessories}
            ${glovesSvg}
          </svg>
        `;
      }

      function getStudentState(side) {
        if (side === 'A' && isAPunching.value) return 'punching';
        if (side === 'B' && isBPunching.value) return 'punching';
        if (isScanning.value) return 'punching';
        if (!quizRevealed.value) return 'idle';
        const winner = quizComparison.value.winner;
        if (winner === 'BOTH_WIN') return 'winner';
        if (side === 'A') {
          return winner === 'A_WIN' ? 'winner' : 'loser';
        } else {
          return winner === 'B_WIN' ? 'winner' : 'loser';
        }
      }

      // ==================== 模式一：PK 猜猜看狀態 ====================
      const quizList = ref(QUIZ_CHALLENGES);
      const currentQuizIndex = ref(0);
      const userGuess = ref(null);
      const isScanning = ref(false);
      const currentScanningStepIndex = ref(-1);
      const quizRevealed = ref(false);
      const quizScore = ref({ correct: 0, total: 0 });

      const currentQuiz = computed(() => quizList.value[currentQuizIndex.value]);

      const quizComparison = computed(() => {
        const q = currentQuiz.value;
        return compareTwoStudents(q.studentA, q.studentB);
      });

      const activeStepsToDisplay = computed(() => {
        if (!quizRevealed.value && !isScanning.value) return [];
        const all = quizComparison.value.allSteps;
        if (currentScanningStepIndex.value < 0) return all;
        return all.slice(0, currentScanningStepIndex.value + 1);
      });

      function selectQuiz(index) {
        if (isScanning.value) return;
        currentQuizIndex.value = index;
        userGuess.value = null;
        quizRevealed.value = false;
        currentScanningStepIndex.value = -1;
      }

      async function makeGuess(guess) {
        if (isScanning.value || quizRevealed.value) return;
        userGuess.value = guess;
        isScanning.value = true;
        currentScanningStepIndex.value = 0;

        // 敲響擂台開場鐘聲與裁判哨音
        stadium.playBoxingBell(2);
        stadium.playRefereeWhistle(false);
        stadium.swellCrowdRoar(0.18, 3.0);

        const steps = quizComparison.value.allSteps;
        for (let i = 0; i < steps.length; i++) {
          currentScanningStepIndex.value = i;
          const isDeciding = (steps[i].outcome !== 'TIE');
          stadium.playPunchSound(isDeciding);
          playPassSound();
          await new Promise(r => setTimeout(r, 400));
          const el = document.getElementById(`step-card-${i}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        isScanning.value = false;
        quizRevealed.value = true;

        const winner = quizComparison.value.winner;
        const isCorrect = (guess === 'A' && winner === 'A_WIN') ||
                          (guess === 'B' && winner === 'B_WIN') ||
                          (guess === 'BOTH' && winner === 'BOTH_WIN');

        quizScore.value.total++;
        if (isCorrect) {
          quizScore.value.correct++;
          comboStreak.value++;
          maxCombo.value = Math.max(maxCombo.value, comboStreak.value);
          stadium.playCheerClimax();
          if (window.confetti) {
            window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          }
        } else {
          comboStreak.value = 0;
          playWrongSound();
        }
      }

      function nextQuiz() {
        if (currentQuizIndex.value < quizList.value.length - 1) {
          selectQuiz(currentQuizIndex.value + 1);
        } else {
          selectQuiz(0);
        }
      }

      // ==================== 模式二：自由沙盒模擬器 ====================
      const popularSchools = ref(POPULAR_SCHOOLS);
      const selectedSchool = ref(POPULAR_SCHOOLS[0]);

      const sandboxA = ref({
        name: '我 (考生 A)',
        avatar: '🎓',
        grades: { chinese: 'A++', math: 'A+', english: 'A++', social: 'A+', science: 'A+' },
        writing: '5',
        balancedLearning: 12,
        conduct: 5,
        noDemerit: 6,
        awardRecords: 4,
        disadvantaged: 0,
        nearby: 10,
        choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 }
      });

      const sandboxB = ref({
        name: '競爭對手 (考生 B)',
        avatar: '🎒',
        grades: { chinese: 'A+', math: 'A++', english: 'A++', social: 'A+', science: 'A+' },
        writing: '5',
        balancedLearning: 12,
        conduct: 5,
        noDemerit: 6,
        awardRecords: 4,
        disadvantaged: 0,
        nearby: 10,
        choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 }
      });

      const isSandboxRunning = ref(false);
      const sandboxScanningIndex = ref(-1);
      const sandboxRevealed = ref(false);

      const sandboxComparison = computed(() => compareTwoStudents(sandboxA.value, sandboxB.value));
      const sandboxStatsA = computed(() => computeStudentStats(sandboxA.value));
      const sandboxStatsB = computed(() => computeStudentStats(sandboxB.value));

      const sandboxStepsToDisplay = computed(() => {
        const all = sandboxComparison.value.allSteps;
        if (!sandboxRevealed.value && !isSandboxRunning.value) return all;
        if (sandboxScanningIndex.value < 0) return all;
        return all.slice(0, sandboxScanningIndex.value + 1);
      });

      async function runSandboxSimulation() {
        if (isSandboxRunning.value) return;
        isSandboxRunning.value = true;
        sandboxRevealed.value = false;
        sandboxScanningIndex.value = 0;

        const steps = sandboxComparison.value.allSteps;
        for (let i = 0; i < steps.length; i++) {
          sandboxScanningIndex.value = i;
          playPassSound();
          await new Promise(r => setTimeout(r, 320));
          const el = document.getElementById(`sandbox-step-${i}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        isSandboxRunning.value = false;
        sandboxRevealed.value = true;
        playWinSound();
        if (window.confetti) {
          window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        }
      }

      // ==================== 沙盒全螢幕比序擂台劇場 ====================
      const isSandboxFullscreen = ref(false);
      const sandboxSpeed = ref(1.0); // 0.5 | 1.0 | 2.0 | 3.0
      const sandboxFullscreenIndex = ref(0);
      const isSandboxFullscreenPlaying = ref(false);
      let sandboxTimer = null;

      function openSandboxFullscreen() {
        isSandboxFullscreen.value = true;
        sandboxFullscreenIndex.value = 0;
        isSandboxFullscreenPlaying.value = false;
        playSandboxFullscreen();
      }

      function closeSandboxFullscreen() {
        pauseSandboxFullscreen();
        isSandboxFullscreen.value = false;
      }

      function setSandboxSpeed(spd) {
        sandboxSpeed.value = spd;
        if (isSandboxFullscreenPlaying.value) {
          pauseSandboxFullscreen();
          playSandboxFullscreen();
        }
      }

      function nextSandboxFullscreenStep() {
        const total = sandboxComparison.value.allSteps.length;
        if (sandboxFullscreenIndex.value < total - 1) {
          sandboxFullscreenIndex.value++;
          playPassSound();
        } else {
          pauseSandboxFullscreen();
          playWinSound();
          if (window.confetti) {
            window.confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          }
        }
      }

      function prevSandboxFullscreenStep() {
        if (sandboxFullscreenIndex.value > 0) {
          sandboxFullscreenIndex.value--;
          playBeep(480, 'sine', 0.05);
        }
      }

      function playSandboxFullscreen() {
        if (isSandboxFullscreenPlaying.value) return;
        const total = sandboxComparison.value.allSteps.length;
        if (sandboxFullscreenIndex.value >= total - 1) {
          sandboxFullscreenIndex.value = 0;
        }
        isSandboxFullscreenPlaying.value = true;
        const intervalMs = Math.round(1400 / sandboxSpeed.value);
        sandboxTimer = setInterval(() => {
          if (sandboxFullscreenIndex.value < total - 1) {
            nextSandboxFullscreenStep();
          } else {
            pauseSandboxFullscreen();
            playWinSound();
            if (window.confetti) {
              window.confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
            }
          }
        }, intervalMs);
      }

      function pauseSandboxFullscreen() {
        isSandboxFullscreenPlaying.value = false;
        if (sandboxTimer) {
          clearInterval(sandboxTimer);
          sandboxTimer = null;
        }
      }

      function resetSandboxFullscreen() {
        pauseSandboxFullscreen();
        sandboxFullscreenIndex.value = 0;
      }

      function applyPreset(presetType) {
        if (presetType === '5A_vs_4A1B') {
          sandboxA.value.name = '壓線 5A 生';
          sandboxA.value.grades = { chinese: 'A', math: 'A', english: 'A', social: 'A', science: 'A' };
          sandboxA.value.writing = '4';
          sandboxB.value.name = '超強 4A1B 生';
          sandboxB.value.grades = { chinese: 'A++', math: 'A++', english: 'A++', social: 'A++', science: 'B++' };
          sandboxB.value.writing = '6';
        } else if (presetType === 'PLUS_DIFFERENCE') {
          sandboxA.value.name = 'A+ 較多生 (3個+)';
          sandboxA.value.grades = { chinese: 'A+', math: 'A+', english: 'A+', social: 'B+', science: 'B+' };
          sandboxA.value.writing = '5';
          sandboxB.value.name = 'A 較多生 (2個+)';
          sandboxB.value.grades = { chinese: 'A+', math: 'A+', english: 'A', social: 'B++', science: 'B+' };
          sandboxB.value.writing = '5';
        } else if (presetType === 'CHINESE_VS_MATH') {
          sandboxA.value.name = '國文強者 (國A++數A)';
          sandboxA.value.grades = { chinese: 'A++', math: 'A', english: 'A+', social: 'A+', science: 'A+' };
          sandboxA.value.writing = '5';
          sandboxB.value.name = '數學強者 (國A數A++)';
          sandboxB.value.grades = { chinese: 'A', math: 'A++', english: 'A+', social: 'A+', science: 'A+' };
          sandboxB.value.writing = '5';
        } else if (presetType === 'CHOICE_ORDER') {
          sandboxA.value.name = '第1志願選填';
          sandboxA.value.grades = { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A+' };
          sandboxA.value.writing = '5';
          sandboxA.value.choiceInfo = { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 };
          sandboxB.value.name = '第2志願跨科選填';
          sandboxB.value.grades = { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A+' };
          sandboxB.value.writing = '5';
          sandboxB.value.choiceInfo = { score: 30, rank: 1, schoolRank: 1, choiceIndex: 2 };
        } else if (presetType === 'MIRACLE_TIE') {
          sandboxA.value.name = '雙生子 A';
          sandboxA.value.grades = { chinese: 'A++', math: 'A++', english: 'A++', social: 'A+', science: 'A+' };
          sandboxA.value.writing = '6';
          sandboxA.value.choiceInfo = { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 };
          sandboxB.value.name = '雙生子 B';
          sandboxB.value.grades = { chinese: 'A++', math: 'A++', english: 'A++', social: 'A+', science: 'A+' };
          sandboxB.value.writing = '6';
          sandboxB.value.choiceInfo = { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 };
        }
        sandboxRevealed.value = false;
        sandboxScanningIndex.value = -1;
      }

      // =========================================================================
      // 模式三：【3 萬人志願分發篩選器大數據模型】
      // =========================================================================
      const allSchoolOptions = ref(SCHOOL_CAPACITIES_AND_CUTOFFS);
      const historicalCutoffs = ref(HISTORICAL_CUTOFF_TABLE);
      const historyFilter = ref('ALL'); // 'ALL' | '5A' | '4A1B' | '3A2B' | '5B'
      const historySearchText = ref('');

      const filteredHistoricalList = computed(() => {
        let list = historicalCutoffs.value;
        if (historyFilter.value === '5A') list = list.filter(s => s.pts114 >= 90);
        else if (historyFilter.value === '4A1B') list = list.filter(s => s.pts114 >= 80 && s.pts114 < 90);
        else if (historyFilter.value === '3A2B') list = list.filter(s => s.pts114 >= 70 && s.pts114 < 80);
        else if (historyFilter.value === '5B') list = list.filter(s => s.pts114 < 70);

        if (historySearchText.value && historySearchText.value.trim() !== '') {
          const kw = historySearchText.value.trim().toLowerCase();
          list = list.filter(s => s.school.toLowerCase().includes(kw) || (s.y114 && s.y114.toLowerCase().includes(kw)));
        }
        return list;
      });

      function getCutoffMatchBadge(targetPts) {
        const myPts = filterUserStats.value.examPoints;
        const diff = myPts - targetPts;
        if (diff >= 2) {
          return { text: '穩固安全', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: 'fa-circle-check', diffText: `+${diff}點` };
        } else if (diff >= -1 && diff <= 1) {
          return { text: '實力五五波', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: 'fa-scale-balanced', diffText: diff === 0 ? '持平' : (diff > 0 ? `+${diff}點` : `${diff}點`) };
        } else {
          return { text: '夢幻挑戰', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: 'fa-rocket', diffText: `${diff}點` };
        }
      }

      // 臺中高工 114 年各科錄取標準專區
      const tcivsCutoffs = ref(TCIVS_114_CUTOFF_DATA);
      const tcivsNotes = ref(TCIVS_114_NOTES);
      const tcivsGroupFilter = ref('ALL'); // 'ALL' | '電機電子' | '機械動力' | '土木建築' | '化工設計'
      const tcivsSearchText = ref('');

      const filteredTcivsList = computed(() => {
        let list = tcivsCutoffs.value;
        if (tcivsGroupFilter.value === '電機電子') {
          list = list.filter(item => item.group.includes('電機') || item.group.includes('資電'));
        } else if (tcivsGroupFilter.value === '機械動力') {
          list = list.filter(item => item.group.includes('機械') || item.group.includes('動力'));
        } else if (tcivsGroupFilter.value === '土木建築') {
          list = list.filter(item => item.group.includes('土木') || item.group.includes('建築'));
        } else if (tcivsGroupFilter.value === '化工設計') {
          list = list.filter(item => item.group.includes('化工') || item.group.includes('設計'));
        }

        if (tcivsSearchText.value && tcivsSearchText.value.trim() !== '') {
          const kw = tcivsSearchText.value.trim().toLowerCase();
          list = list.filter(item => item.dept.toLowerCase().includes(kw) || item.group.toLowerCase().includes(kw));
        }
        return list;
      });

      function getTcivsDeptBadge(minPts, maxPts) {
        const myPts = filterUserStats.value.examPoints;
        const diff = myPts - minPts;
        if (myPts >= maxPts) {
          return { text: '群科榜首級', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: 'fa-crown', diffText: `超標+${myPts - maxPts}點` };
        } else if (diff >= 2) {
          return { text: '穩定達標', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: 'fa-circle-check', diffText: `+${diff}點` };
        } else if (diff >= -1 && diff <= 1) {
          return { text: '實力五五波', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: 'fa-scale-balanced', diffText: diff === 0 ? '持平' : (diff > 0 ? `+${diff}點` : `${diff}點`) };
        } else {
          return { text: '夢幻衝刺', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: 'fa-rocket', diffText: `${diff}點` };
        }
      }
      
      const filterUserStudent = ref({
        name: '我',
        grades: { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A+' },
        writing: '5',
        balancedLearning: 12,
        conduct: 5,
        noDemerit: 6,
        awardRecords: 4,
        disadvantaged: 0,
        nearby: 10
      });

      const userChoiceList = ref([
        'tcfsh',     // 1. 臺中一中
        'nchu',      // 2. 興大附中
        'whsh',      // 3. 文華高中
        'tc2sh',     // 4. 臺中二中
        'tcivs_cs',  // 5. 臺中高工資訊
        'hwsh'       // 6. 惠文高中
      ]);

      const isFilterSimulating = ref(false);
      const filterProgress = ref(0);
      const filterResult = ref(null);

      const filterUserStats = computed(() => computeStudentStats(filterUserStudent.value));
      const filterRankEstimate = computed(() => estimateStudentRankIn30k(filterUserStats.value));

      function applyChoiceStrategy(type) {
        if (type === 'DREAM_FIRST') {
          userChoiceList.value = ['tcfsh', 'nehs', 'nchu', 'whsh', 'tc2sh', 'hwsh'];
        } else if (type === 'BALANCED') {
          userChoiceList.value = ['whsh', 'nchu', 'tc2sh', 'zmsh', 'xysh', 'csesh'];
        } else if (type === 'TECH_STAR') {
          // 頂尖名門高職 (臺中高工電資 + 臺中家商熱門科 + 興大附農)
          userChoiceList.value = ['tcivs_cs', 'tcivs_ee', 'tcivs_elec', 'tchcvs_en', 'tchcvs_ad', 'nchu_av'];
        } else if (type === 'TECH_DIVERSE') {
          // 跨類群技術專精 (機械、化工、商管、農藝、建築)
          userChoiceList.value = ['tcivs_mech', 'tcivs_chem', 'tchcvs_acc', 'tsvs_arch', 'nchu_hort', 'slvs_ee'];
        } else if (type === 'TECH_REGIONAL') {
          // 中投在地優質高職 (沙鹿、東勢、霧峰、草屯、南投)
          userChoiceList.value = ['slvs_auto', 'tsvs_elec', 'wfvsh_fd', 'wfvsh_ee', 'ctvs_elec', 'ntvs_data'];
        } else if (type === 'COMMUNITY') {
          userChoiceList.value = ['hwsh', 'zmsh', 'xysh', 'fyhs', 'dlsh', 'cyhs'];
        }
        filterResult.value = null;
      }

      async function run30kSimulation() {
        if (isFilterSimulating.value) return;
        isFilterSimulating.value = true;
        filterProgress.value = 0;
        filterResult.value = null;

        playPassSound();

        for (let p = 15; p <= 100; p += 18) {
          filterProgress.value = Math.min(100, p);
          playBeep(400 + p * 4, 'sine', 0.04);
          await new Promise(r => setTimeout(r, 120));
        }

        const result = simulate30kAdmissions(filterUserStudent.value, userChoiceList.value);
        filterResult.value = result;
        isFilterSimulating.value = false;

        playWinSound();
        if (window.confetti && result.admittedChoice) {
          window.confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
      }

      // =========================================================================
      // 模式四：【錄取分數與落點比較兩大圖解】(Chart.js)
      // =========================================================================
      let cutoffChartInstance = null;
      let bellChartInstance = null;

      function renderCharts() {
        if (typeof Chart === 'undefined') {
          setTimeout(renderCharts, 100);
          return;
        }

        const myPoints = filterUserStats.value.examPoints;

        // ---------- 圖表一：各校錄取門檻與積點落點比較圖 ----------
        const ctx1 = document.getElementById('cutoffChart');
        if (ctx1) {
          if (cutoffChartInstance) cutoffChartInstance.destroy();

          const schools = SCHOOL_CAPACITIES_AND_CUTOFFS.slice(0, 16);
          const labels = schools.map(s => `${s.name} ${s.dept}`);
          const minData = schools.map(s => s.minPoints);
          const safeData = schools.map(s => s.safePoints);

          cutoffChartInstance = new Chart(ctx1, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: '最低錄取門檻線 (點數)',
                  data: minData,
                  backgroundColor: 'rgba(239, 68, 68, 0.75)',
                  borderColor: '#ef4444',
                  borderWidth: 1,
                  borderRadius: 6
                },
                {
                  label: '安全穩固錄取線 (點數)',
                  data: safeData,
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  borderColor: '#10b981',
                  borderWidth: 1,
                  borderRadius: 6
                }
              ]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: '#cbd5e1', font: { size: 12, weight: 'bold' } }
                },
                tooltip: {
                  callbacks: {
                    afterBody: function(context) {
                      const idx = context[0].dataIndex;
                      const s = schools[idx];
                      return `會考門檻: ${s.minGradeDesc}\n核定招生: ${s.quota} 名\n你的積點: ${myPoints} 點 (${myPoints >= s.safePoints ? '✅ 安全達標' : (myPoints >= s.minPoints ? '⚡ 競爭壓線' : '❌ 未達門檻')})`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  min: 40,
                  max: 111,
                  grid: { color: 'rgba(148, 163, 184, 0.15)' },
                  ticks: { color: '#94a3b8', font: { size: 11 } },
                  title: { display: true, text: '國中教育會考總積點 (滿分 111 點)', color: '#cbd5e1' }
                },
                y: {
                  grid: { display: false },
                  ticks: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } }
                }
              }
            }
          });
        }

        // ---------- 圖表二：3 萬考生常態分佈與累積錄取容納量落點圖 ----------
        const ctx2 = document.getElementById('bellChart');
        if (ctx2) {
          if (bellChartInstance) bellChartInstance.destroy();

          const curveLabels = POPULATION_CURVE.map(c => `${c.label}\n(${c.pointsMin}~${c.pointsMax}點)`);
          const curveCounts = POPULATION_CURVE.map(c => c.count);

          bellChartInstance = new Chart(ctx2, {
            type: 'line',
            data: {
              labels: curveLabels,
              datasets: [
                {
                  label: '中投區考生人數分佈 (母體 30,000 人)',
                  data: curveCounts,
                  fill: true,
                  backgroundColor: 'rgba(99, 102, 241, 0.25)',
                  borderColor: '#818cf8',
                  borderWidth: 3,
                  tension: 0.38,
                  pointBackgroundColor: '#4f46e5',
                  pointRadius: 5
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: '#cbd5e1', font: { size: 12, weight: 'bold' } }
                },
                tooltip: {
                  callbacks: {
                    afterBody: function(context) {
                      const idx = context[0].dataIndex;
                      const c = POPULATION_CURVE[idx];
                      return `累積全區名次: 前 ${c.cumRank.toLocaleString()} 名\n全區百分比: 前 ${c.pct}\n主要落點梯隊: ${c.tier}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { color: 'rgba(148, 163, 184, 0.15)' },
                  ticks: { color: '#94a3b8', font: { size: 10 } }
                },
                y: {
                  grid: { color: 'rgba(148, 163, 184, 0.12)' },
                  ticks: { color: '#94a3b8' },
                  title: { display: true, text: '區間人數 (人)', color: '#cbd5e1' }
                }
              }
            }
          });
        }
      }

      watch(activeTab, (newTab) => {
        if (newTab === 'charts') {
          nextTick(renderCharts);
        }
      });

      watch(() => filterUserStats.value.examPoints, () => {
        if (activeTab.value === 'charts') {
          nextTick(renderCharts);
        }
      });

      // ==================== 模式五：全景流程圖互動與動態闖關播放器 ====================
      const flowchartNodes = ref(FLOWCHART_TREE);
      const selectedNodeId = ref('total_score');
      const isFlowPlaying = ref(false);
      let flowTimer = null;

      const currentFlowNodeIndex = computed(() => {
        return flowchartNodes.value.findIndex(n => n.id === selectedNodeId.value);
      });

      const selectedNode = computed(() => {
        return flowchartNodes.value.find(n => n.id === selectedNodeId.value) || flowchartNodes.value[0];
      });

      function selectNode(nodeId) {
        selectedNodeId.value = nodeId;
        const idx = flowchartNodes.value.findIndex(n => n.id === nodeId);
        playBeep(440 + Math.min(idx * 30, 400), 'sine', 0.05);
      }

      function nextFlowNode() {
        let idx = currentFlowNodeIndex.value;
        if (idx < flowchartNodes.value.length - 1) {
          idx++;
          selectNode(flowchartNodes.value[idx].id);
        } else {
          pauseFlowAnim();
          if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
          }
        }
      }

      function prevFlowNode() {
        let idx = currentFlowNodeIndex.value;
        if (idx > 0) {
          idx--;
          selectNode(flowchartNodes.value[idx].id);
        }
      }

      // 流程圖速度與全螢幕模式
      const isFlowchartFullscreen = ref(false);
      const flowchartSpeed = ref(1.0); // 0.5 | 1.0 | 2.0 | 3.0

      function openFlowchartFullscreen() {
        isFlowchartFullscreen.value = true;
      }

      function closeFlowchartFullscreen() {
        isFlowchartFullscreen.value = false;
      }

      function setFlowchartSpeed(spd) {
        flowchartSpeed.value = spd;
        if (isFlowPlaying.value) {
          pauseFlowAnim();
          playFlowAnim();
        }
      }

      function playFlowAnim() {
        if (isFlowPlaying.value) return;
        isFlowPlaying.value = true;
        if (currentFlowNodeIndex.value >= flowchartNodes.value.length - 1) {
          selectNode(flowchartNodes.value[0].id);
        }
        const intervalMs = Math.round(1500 / flowchartSpeed.value);
        flowTimer = setInterval(() => {
          if (currentFlowNodeIndex.value < flowchartNodes.value.length - 1) {
            nextFlowNode();
          } else {
            pauseFlowAnim();
            if (typeof confetti === 'function') {
              confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
            }
          }
        }, intervalMs);
      }

      function pauseFlowAnim() {
        isFlowPlaying.value = false;
        if (flowTimer) {
          clearInterval(flowTimer);
          flowTimer = null;
        }
      }

      function resetFlowAnim() {
        pauseFlowAnim();
        selectNode(flowchartNodes.value[0].id);
      }

      onMounted(() => {
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            if (activeModalImage.value) closeImageModal();
            if (isSandboxFullscreen.value) closeSandboxFullscreen();
            if (isFlowchartFullscreen.value) closeFlowchartFullscreen();
          }
        });
      });

      const gradeOptions = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'];
      const writingOptions = ['6', '5', '4', '3', '2', '1'];
      const subjects = SUBJECT_ORDER;

      return {
        activeTab,
        activeModalImage,
        openImageModal,
        closeImageModal,

        // 提醒警語全螢幕彈窗
        showDisclaimerModal,
        confirmDisclaimer,

        // 模式一 (動漫拳擊擂台與手遊音效)
        quizList,
        currentQuizIndex,
        currentQuiz,
        userGuess,
        isScanning,
        quizRevealed,
        quizScore,
        quizComparison,
        activeStepsToDisplay,
        selectQuiz,
        makeGuess,
        nextQuiz,
        isStadiumCrowdPlaying,
        stadiumVolume,
        toggleStadiumCrowd,
        setStadiumVolume,
        playBoxingBellSound,
        playRefereeWhistleSound,
        playHumanCrowdChantSound,
        playApplauseSound,
        playCrowdExplosionSound,
        isAJumping,
        isBJumping,
        isAPunching,
        isBPunching,
        triggerActionA,
        triggerActionB,
        arenaTheme,
        toggleArenaTheme,
        comboStreak,
        maxCombo,
        getStudentState,
        getAnimeAvatarSvg,

        // 模式二
        popularSchools,
        selectedSchool,
        sandboxA,
        sandboxB,
        sandboxStatsA,
        sandboxStatsB,
        sandboxComparison,
        sandboxStepsToDisplay,
        isSandboxRunning,
        sandboxScanningIndex,
        sandboxRevealed,
        runSandboxSimulation,
        applyPreset,
        isSandboxFullscreen,
        sandboxSpeed,
        sandboxFullscreenIndex,
        isSandboxFullscreenPlaying,
        openSandboxFullscreen,
        closeSandboxFullscreen,
        setSandboxSpeed,
        playSandboxFullscreen,
        pauseSandboxFullscreen,
        nextSandboxFullscreenStep,
        prevSandboxFullscreenStep,
        resetSandboxFullscreen,

        // 模式三：3萬人篩選器與歷年落點資料
        allSchoolOptions,
        historicalCutoffs,
        historyFilter,
        historySearchText,
        filteredHistoricalList,
        getCutoffMatchBadge,
        
        // 臺中高工 114 官方各科落點專區
        tcivsCutoffs,
        tcivsNotes,
        tcivsGroupFilter,
        tcivsSearchText,
        filteredTcivsList,
        getTcivsDeptBadge,

        filterUserStudent,
        userChoiceList,
        isFilterSimulating,
        filterProgress,
        filterResult,
        filterUserStats,
        filterRankEstimate,
        applyChoiceStrategy,
        run30kSimulation,

        // 模式四：圖表
        renderCharts,

        // 模式五：流程圖與動畫播放器
        flowchartNodes,
        selectedNodeId,
        selectedNode,
        selectNode,
        currentFlowNodeIndex,
        isFlowPlaying,
        playFlowAnim,
        pauseFlowAnim,
        nextFlowNode,
        prevFlowNode,
        resetFlowAnim,
        isFlowchartFullscreen,
        flowchartSpeed,
        openFlowchartFullscreen,
        closeFlowchartFullscreen,
        setFlowchartSpeed,

        // 工具清單
        gradeOptions,
        writingOptions,
        subjects,
        GRADE_POINTS,
        GRADE_SCORES
      };
    }
  }).mount('#app');

  console.log('Chotou Simulator 3.1 mounted successfully!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChotouApp);
} else {
  initChotouApp();
}
