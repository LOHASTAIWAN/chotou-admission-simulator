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
    QUIZ_CHALLENGES, 
    FLOWCHART_TREE,
    computeStudentStats, 
    compareTwoStudents 
  } = window.ChotouRules;

  const { createApp, ref, computed, onMounted } = Vue;

  createApp({
    setup() {
      // 當前主頁籤：'quiz' (PK猜猜看) | 'sandbox' (自由模擬) | 'flowchart' (全景流程圖) | 'tips' (錦囊秘笈)
      const activeTab = ref('quiz');
      const isAppReady = ref(true);

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
        } catch (e) {
          // 音效失敗時優雅忽略
        }
      }

      function playWinSound() {
        playBeep(523.25, 'triangle', 0.1); // C5
        setTimeout(() => playBeep(659.25, 'triangle', 0.1), 100); // E5
        setTimeout(() => playBeep(783.99, 'triangle', 0.15), 200); // G5
        setTimeout(() => playBeep(1046.50, 'triangle', 0.35), 320); // C6
      }

      function playPassSound() {
        playBeep(587.33, 'sine', 0.06);
      }

      function playWrongSound() {
        playBeep(330, 'sawtooth', 0.15);
        setTimeout(() => playBeep(261.63, 'sawtooth', 0.25), 160);
      }

      // ==================== 模式一：PK 猜猜看狀態 ====================
      const quizList = ref(QUIZ_CHALLENGES);
      const currentQuizIndex = ref(0);
      const userGuess = ref(null); // 'A' | 'B' | 'BOTH'
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

        const steps = quizComparison.value.allSteps;
        for (let i = 0; i < steps.length; i++) {
          currentScanningStepIndex.value = i;
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
          playWinSound();
          if (window.confetti) {
            window.confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        } else {
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

      // 考生 A (通常代表自己)
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

      // 考生 B (競爭對手)
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

      const sandboxComparison = computed(() => {
        return compareTwoStudents(sandboxA.value, sandboxB.value);
      });

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
          await new Promise(r => setTimeout(r, 350));
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

      // ==================== 模式三：全景流程圖互動 ====================
      const flowchartNodes = ref(FLOWCHART_TREE);
      const selectedNodeId = ref('total_score');
      const selectedNode = computed(() => {
        return flowchartNodes.value.find(n => n.id === selectedNodeId.value) || flowchartNodes.value[0];
      });

      function selectNode(nodeId) {
        selectedNodeId.value = nodeId;
        playBeep(480, 'sine', 0.05);
      }

      // Grade options
      const gradeOptions = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'];
      const writingOptions = ['6', '5', '4', '3', '2', '1'];
      const subjects = SUBJECT_ORDER;

      return {
        activeTab,
        isAppReady,
        // 模式一
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

        // 模式三
        flowchartNodes,
        selectedNodeId,
        selectedNode,
        selectNode,

        // 工具清單
        gradeOptions,
        writingOptions,
        subjects,
        GRADE_POINTS,
        GRADE_SCORES
      };
    }
  }).mount('#app');

  console.log('Chotou Admission Simulator mounted successfully!');
}

// 監聽 DOM 準備完成時啟動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChotouApp);
} else {
  initChotouApp();
}
