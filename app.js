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

        const steps = quizComparison.value.allSteps;
        for (let i = 0; i < steps.length; i++) {
          currentScanningStepIndex.value = i;
          playPassSound();
          await new Promise(r => setTimeout(r, 380));
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
            window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
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
          userChoiceList.value = ['tcivs_cs', 'tc2sh', 'tchcvs_en', 'zmsh', 'csesh', 'fyhs'];
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

      // ==================== 模式五：全景流程圖互動 ====================
      const flowchartNodes = ref(FLOWCHART_TREE);
      const selectedNodeId = ref('total_score');
      const selectedNode = computed(() => {
        return flowchartNodes.value.find(n => n.id === selectedNodeId.value) || flowchartNodes.value[0];
      });

      function selectNode(nodeId) {
        selectedNodeId.value = nodeId;
        playBeep(480, 'sine', 0.05);
      }

      const gradeOptions = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'];
      const writingOptions = ['6', '5', '4', '3', '2', '1'];
      const subjects = SUBJECT_ORDER;

      return {
        activeTab,
        activeModalImage,
        openImageModal,
        closeImageModal,

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

        // 模式三：3萬人篩選器與歷年落點資料
        allSchoolOptions,
        historicalCutoffs,
        historyFilter,
        historySearchText,
        filteredHistoricalList,
        getCutoffMatchBadge,
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

        // 模式五：流程圖
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

  console.log('Chotou Simulator 3.1 mounted successfully!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChotouApp);
} else {
  initChotouApp();
}
