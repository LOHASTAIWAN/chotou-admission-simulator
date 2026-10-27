/**
 * 116學年度中投區免試入學比序規則資料庫與核心演算引擎
 * 依據臺中市及南投縣政府教育主管機關公告之「116學年度中投區高級中等學校免試入學作業要點」
 * 及其附表1(積分對照表)、附表2(點數對照表)、附表3(補充說明對照表)及附件1(比序流程圖)嚴格實作
 */

// 1. 各科會考等級標示與點數對照表 (附表2)
const GRADE_POINTS = {
  'A++': 21,
  'A+': 18,
  'A': 15,
  'B++': 12,
  'B+': 9,
  'B': 6,
  'C': 3
};

// 2. 各科教育會考表現積分對照表 (附表1)
const GRADE_SCORES = {
  'A++': 6,
  'A+': 6,
  'A': 6,
  'B++': 4,
  'B+': 4,
  'B': 4,
  'C': 2
};

// 3. 各等級包含之「+」號數量 (附表1備註)
const GRADE_PLUS_COUNT = {
  'A++': { A: 2, B: 0 },
  'A+':  { A: 1, B: 0 },
  'A':   { A: 0, B: 0 },
  'B++': { A: 0, B: 2 },
  'B+':  { A: 0, B: 1 },
  'B':   { A: 0, B: 0 },
  'C':   { A: 0, B: 0 }
};

// 科目順序（中投區法定各科比序順序：國 -> 數 -> 英 -> 社 -> 自）
const SUBJECT_ORDER = [
  { key: 'chinese', name: '國文' },
  { key: 'math',    name: '數學' },
  { key: 'english', name: '英語' },
  { key: 'social',  name: '社會' },
  { key: 'science', name: '自然' }
];

// 代表性中投區學校與科別清單
const POPULAR_SCHOOLS = [
  { id: 'tcfsh', name: '臺中一中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'tcgs',  name: '臺中女中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'n科',   name: '中科實中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'nchu',  name: '興大附中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'tc2sh', name: '臺中二中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'whsh',  name: '文華高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'hwsh',  name: '惠文高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'zmsh',  name: '忠明高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'tcivs', name: '臺中高工', department: '資訊科', quota: 1, type: '公立高職' },
  { id: 'tcivs_ee', name: '臺中高工', department: '電機科', quota: 1, type: '公立高職' },
  { id: 'tchcvs', name: '臺中家商', department: '應用英語科', quota: 1, type: '公立高職' },
  { id: 'csesh', name: '清水高中', department: '普通科', quota: 1, type: '公立高中' }
];

/**
 * 計算志願序積分
 */
function calculateChoiceScore(choiceList, targetIndex) {
  if (!choiceList || choiceList.length === 0 || targetIndex < 0 || targetIndex >= choiceList.length) {
    return { rank: 1, score: 30, schoolRank: 1 };
  }

  let currentRank = 1;
  const uniqueSchoolsSeen = [];

  for (let i = 0; i <= targetIndex; i++) {
    const item = choiceList[i];
    if (!uniqueSchoolsSeen.includes(item.school)) {
      uniqueSchoolsSeen.push(item.school);
    }

    if (i === 0) {
      currentRank = 1;
    } else {
      if (item.school !== choiceList[i - 1].school) {
        currentRank++;
      }
    }
  }

  let score = 30;
  if (currentRank <= 10) {
    score = 30;
  } else if (currentRank <= 20) {
    score = 29;
  } else {
    score = 28;
  }

  const schoolRank = uniqueSchoolsSeen.indexOf(choiceList[targetIndex].school) + 1;

  return {
    rank: currentRank,
    score: score,
    choiceIndex: targetIndex + 1,
    schoolRank: schoolRank
  };
}

/**
 * 計算學生各項總計指標
 */
function computeStudentStats(student) {
  // 1. 會考表現積分 (30分)
  let examScore = 0;
  SUBJECT_ORDER.forEach(sub => {
    examScore += GRADE_SCORES[student.grades[sub.key]] || 0;
  });

  // 2. 會考總積點 (111點)
  let examPoints = 0;
  SUBJECT_ORDER.forEach(sub => {
    examPoints += GRADE_POINTS[student.grades[sub.key]] || 0;
  });
  const writingPoint = parseInt(student.writing) || 0;
  examPoints += writingPoint;

  // 3. 會考等級標示「+」號累計
  let aPlusCount = 0;
  let bPlusCount = 0;
  SUBJECT_ORDER.forEach(sub => {
    const p = GRADE_PLUS_COUNT[student.grades[sub.key]] || { A: 0, B: 0 };
    aPlusCount += p.A;
    bPlusCount += p.B;
  });

  // 4. 多元學習表現 (27分)
  const balanced = Math.min(12, Number(student.balancedLearning ?? 12));
  const conduct = Math.min(5, Number(student.conduct ?? 5));
  const demerit = Math.min(6, Number(student.noDemerit ?? 6));
  const award = Math.min(4, Number(student.awardRecords ?? 4));
  const multipleTotal = balanced + conduct + demerit + award;

  // 5. 弱勢扶助 (3分)
  const disadvantaged = Math.min(3, Number(student.disadvantaged ?? 0));

  // 6. 就近入學 (10分)
  const nearby = Math.min(10, Number(student.nearby ?? 10));

  // 7. 志願序積分
  const choiceInfo = student.choiceInfo || { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 };
  const choiceScore = choiceInfo.score;

  // 8. 總積分 (滿分100分)
  const totalScore = choiceScore + nearby + disadvantaged + multipleTotal + examScore;

  return {
    examScore,
    examPoints,
    writingPoint,
    aPlusCount,
    bPlusCount,
    balanced,
    conduct,
    demerit,
    award,
    multipleTotal,
    disadvantaged,
    nearby,
    choiceScore,
    choiceRank: choiceInfo.rank,
    schoolRank: choiceInfo.schoolRank,
    choiceIndex: choiceInfo.choiceIndex,
    totalScore
  };
}

/**
 * 核心超額比序演算法（比對兩位考生）
 */
function compareTwoStudents(studentA, studentB) {
  const statsA = computeStudentStats(studentA);
  const statsB = computeStudentStats(studentB);

  const steps = [];

  function recordStep(id, title, maxDesc, valA, valB, formatVal = v => v, detailDesc = '') {
    let outcome = 'TIE';
    if (valA > valB) outcome = 'A_WIN';
    else if (valA < valB) outcome = 'B_WIN';

    const stepResult = {
      stepId: id,
      title,
      maxDesc,
      valA: formatVal(valA),
      valB: formatVal(valB),
      rawA: valA,
      rawB: valB,
      outcome,
      detailDesc
    };
    steps.push(stepResult);
    return outcome;
  }

  // 關卡 1：總積分 (滿分 100 分)
  let res = recordStep('step_total', '第一關：總積分', '上限 100 分', statsA.totalScore, statsB.totalScore, v => `${v} 分`, '志願序(30)+就近(10)+多元(27)+會考(30)+扶助弱勢(最高3分，一般生0分/總分97分，弱勢生最高100分)');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 2：志願序積分 (滿分 30 分)
  res = recordStep('step_choice_score', '第二關：志願序積分', '滿分 30 分', statsA.choiceScore, statsB.choiceScore, v => `${v} 分`, '第1~10志願序30分、第11~20志願序29分、第21以後28分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 3：就近入學積分 (滿分 10 分)
  res = recordStep('step_nearby', '第三關：就近入學積分', '滿分 10 分', statsA.nearby, statsB.nearby, v => `${v} 分`, '中投區或共同就學區考生核給10分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 4：扶助弱勢積分 (滿分 3 分)
  res = recordStep('step_disadvantaged', '第四關：扶助弱勢積分', '滿分 3 分', statsA.disadvantaged, statsB.disadvantaged, v => `${v} 分`, '偏遠1分、中低收1分、低收入戶2分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 5：多元學習表現積分 (滿分 27 分)
  res = recordStep('step_multiple', '第五關：多元學習表現總積分', '滿分 27 分', statsA.multipleTotal, statsB.multipleTotal, v => `${v} 分`, '包含均衡學習(12)+德行表現(5)+無記過(6)+獎勵紀錄(4)');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 5.1 均衡學習積分 (12分)
  res = recordStep('step_balanced', '第 5-1 關：均衡學習積分', '滿分 12 分', statsA.balanced, statsB.balanced, v => `${v} 分`, '健體、藝術、綜合、科技四領域前五學期及格各3分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 5.2 德行表現積分 (5分)
  res = recordStep('step_conduct', '第 5-2 關：德行表現積分', '滿分 5 分', statsA.conduct, statsB.conduct, v => `${v} 分`, '社團滿2學期(2分) + 服務學習每學期滿6小時累計滿3學期(3分)');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 5.3 無記過紀錄積分 (6分)
  res = recordStep('step_demerit', '第 5-3 關：無記過紀錄積分', '滿分 6 分', statsA.demerit, statsB.demerit, v => `${v} 分`, '無處分紀錄或銷過後無懲處紀錄得6分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 5.4 獎勵紀錄積分 (4分)
  res = recordStep('step_award', '第 5-4 關：獎勵紀錄積分', '滿分 4 分', statsA.award, statsB.award, v => `${v} 分`, '大功3分、小功1分、嘉獎0.5分，累計上限4分');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 6：教育會考表現積分 (滿分 30 分)
  res = recordStep('step_exam_score', '第六關：教育會考表現積分', '滿分 30 分', statsA.examScore, statsB.examScore, v => `${v} 分`, '精熟(A)每科6分、基礎(B)每科4分、待加強(C)每科2分（俗稱5A=30分）');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 7：國中教育會考總積點 (滿分 111 點)
  res = recordStep('step_exam_points', '第七關：國中教育會考總積點', '滿分 111 點', statsA.examPoints, statsB.examPoints, v => `${v} 點`, '各科A++=21, A+=18, A=15, B++=12, B+=9, B=6, C=3，加寫作1~6點');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 8：會考等級標示「+ 號總累積」加總比序
  // 8.1 A等級標示「+」號多寡
  res = recordStep('step_a_plus', '第 8-1 關：A等級「+」號加總', '最高 10 個 +', statsA.aPlusCount, statsB.aPlusCount, v => `${v} 個 +`, '比A等級標示+號數量（A++算2個+、A+算1個+、A算0個+）');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 8.2 B等級標示「+」號多寡
  res = recordStep('step_b_plus', '第 8-2 關：B等級「+」號加總', '最高 10 個 +', statsA.bPlusCount, statsB.bPlusCount, v => `${v} 個 +`, 'A的+號相同時，再比B等級標示+號數量（B++算2個+、B+算1個+）');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 關卡 9：各科教育會考積分比序（國 -> 數 -> 英 -> 社 -> 自）
  for (let sub of SUBJECT_ORDER) {
    const scA = GRADE_SCORES[studentA.grades[sub.key]] || 0;
    const scB = GRADE_SCORES[studentB.grades[sub.key]] || 0;
    res = recordStep(`step_sub_score_${sub.key}`, `第九關：各科會考積分【${sub.name}】`, '每科滿分 6 分', scA, scB, v => `${v} 分`, `依照國->數->英->社->自然順序比較單科積分`);
    if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);
  }

  // 關卡 10：各科教育會考等級標示比序（國 -> 數 -> 英 -> 社 -> 自）
  for (let sub of SUBJECT_ORDER) {
    const ptA = GRADE_POINTS[studentA.grades[sub.key]] || 0;
    const ptB = GRADE_POINTS[studentB.grades[sub.key]] || 0;
    res = recordStep(`step_sub_grade_${sub.key}`, `第十關：各科等級標示【${sub.name}】`, 'A++ > A+ > A > B++ > B+ > B > C', ptA, ptB, v => Object.keys(GRADE_POINTS).find(k => GRADE_POINTS[k] === v) || v, `依照國->數->英->社->自然順序比較單科等級標示`);
    if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);
  }

  // 關卡 11：志願序之「校序順次」比序
  let schoolRankOutcome = 'TIE';
  if (statsA.schoolRank < statsB.schoolRank) schoolRankOutcome = 'A_WIN';
  else if (statsA.schoolRank > statsB.schoolRank) schoolRankOutcome = 'B_WIN';

  steps.push({
    stepId: 'step_school_rank',
    title: '第十一關：志願序之校序順次',
    maxDesc: '排第 1 所學校 > 第 2 所學校',
    valA: `第 ${statsA.schoolRank} 校`,
    valB: `第 ${statsB.schoolRank} 校`,
    rawA: statsA.schoolRank,
    rawB: statsB.schoolRank,
    outcome: schoolRankOutcome,
    detailDesc: '比較目標學校在該生填寫所有學校中的第幾所學校順序，序位小者優先錄取！'
  });
  if (schoolRankOutcome !== 'TIE') return finishComparison(steps, schoolRankOutcome, statsA, statsB);

  // 關卡 12：志願序之「順次」比序
  let choiceIndexOutcome = 'TIE';
  if (statsA.choiceIndex < statsB.choiceIndex) choiceIndexOutcome = 'A_WIN';
  else if (statsA.choiceIndex > statsB.choiceIndex) choiceIndexOutcome = 'B_WIN';

  steps.push({
    stepId: 'step_choice_index',
    title: '第十二關：志願序之順次',
    maxDesc: '第 1 志願 > 第 2 志願',
    valA: `第 ${statsA.choiceIndex} 志願`,
    valB: `第 ${statsB.choiceIndex} 志願`,
    rawA: statsA.choiceIndex,
    rawB: statsB.choiceIndex,
    outcome: choiceIndexOutcome,
    detailDesc: '比較目標科別在該生選填志願表中的絕對項目順次，排在前面者優先錄取！'
  });
  if (choiceIndexOutcome !== 'TIE') return finishComparison(steps, choiceIndexOutcome, statsA, statsB);

  // 關卡 13：仍同分超額 ➔ 增額錄取！
  steps.push({
    stepId: 'step_quota_exceed',
    title: '第十三關：最終比序判定',
    maxDesc: '全項平手不予抽籤',
    valA: '全部相同',
    valB: '全部相同',
    rawA: 0,
    rawB: 0,
    outcome: 'BOTH_WIN',
    detailDesc: '依中投區作業要點規定：經所有比序仍同分且超額時，不予抽籤，一律以【增額錄取】處理！'
  });

  return finishComparison(steps, 'BOTH_WIN', statsA, statsB);
}

function finishComparison(steps, outcome, statsA, statsB) {
  const decidingStep = steps[steps.length - 1];
  return {
    winner: outcome,
    decidingStep,
    allSteps: steps,
    statsA,
    statsB
  };
}

// 6 個國三生最易踩坑的「經典對決題目庫」
const QUIZ_CHALLENGES = [
  {
    id: 'quiz_1',
    badge: '經典迷思',
    title: '【第 1 戰】5A 迷思 vs 4A1B 神積點，誰能稱霸中投？',
    targetSchool: { name: '臺中一中', department: '普通科', quota: 1 },
    question: '志遠考出「5A 0+」但作文4級；明軒考出「4A++ 1B++」作文滿分6級（總積點破百！）。當名額只剩最後 1 個，誰會錄取？',
    studentA: {
      name: '陳志遠',
      avatar: '👨‍🎓',
      grades: { chinese: 'A', math: 'A', english: 'A', social: 'A', science: 'A' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '林明軒',
      avatar: '🧑‍🎓',
      grades: { chinese: 'A++', math: 'A++', english: 'A++', social: 'A++', science: 'B++' },
      writing: '6',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：很多人以為明軒總積點高達 102 點無敵，但請注意中投區第一關看的是「總積分(一般生滿分97/上限100)」！',
    explanation: '【答案是陳志遠錄取！】志遠雖然每一科都是剛好壓線的 A，但 5 科全精熟(5A)使得「會考表現積分」拿下滿分 30 分，總積分達到一般生滿分 97 分！反觀明軒雖然 4 科 A++、寫作滿分總積點破百，但因為自然科是 B++(得4分)，會考積分只有 28 分，總積分為 95 分。在第一關「總積分」就被淘汰了！在中投區，保住 5A 永遠是第一優先！'
  },
  {
    id: 'quiz_2',
    badge: '關鍵細節',
    title: '【第 2 戰】同積點同積分，+ 號逆轉勝！',
    targetSchool: { name: '臺中二中', department: '普通科', quota: 1 },
    question: '小晴與小雨總積分都是 96 分，會考總積點也恰好都是 77 點！小晴是 3A+ 2B+，小雨是 2A+ 1A 1B++ 1B+。誰能搶下錄取席次？',
    studentA: {
      name: '許小晴',
      avatar: '👩‍🎓',
      grades: { chinese: 'A+', math: 'A+', english: 'A+', social: 'B+', science: 'B+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '周小雨',
      avatar: '👧‍🎓',
      grades: { chinese: 'A+', math: 'A+', english: 'A', social: 'B++', science: 'B+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：總積點相同時，中投區既不抽籤、也不先比國文，而是比一項特殊的「標示統計」！',
    explanation: '【答案是許小晴錄取！】本題取材自官方作業要點範例！當總積點相同(77點)時，進入第 8 關「國中教育會考等級標示加總比序」，先比 A 等級的「+」號多寡！小晴有 3 個 A+ (共3個+號)；小雨只有 2 個 A+ 與 1 個 A (共2個+號)。因此小晴在第 8-1 關直接獲勝錄取！'
  },
  {
    id: 'quiz_3',
    badge: '作文重要性',
    title: '【第 3 戰】寫作測驗到底有沒有用？一分之差的關鍵絕殺！',
    targetSchool: { name: '臺中女中', department: '普通科', quota: 1 },
    question: '羽彤考出 3A++ 2A+ (寫作4級分)；若瑄考出 3A++ 1A+ 1A (寫作6級分滿分)。兩人爭奪最後一個名額，誰會勝出？',
    studentA: {
      name: '張羽彤',
      avatar: '🎀',
      grades: { chinese: 'A++', math: 'A++', english: 'A++', social: 'A+', science: 'A+' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '李若瑄',
      avatar: '🌟',
      grades: { chinese: 'A++', math: 'A++', english: 'A++', social: 'A+', science: 'A' },
      writing: '6',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：算算兩人的「會考總積點(滿分111)」！羽彤是 21*3+18*2+4 = 103點；若瑄是 21*3+18+15+6 = 102點！',
    explanation: '【答案是張羽彤錄取！】羽彤總積點 103 點，若瑄 102 點。雖然若瑄作文拿到滿分6點，但因為學科羽彤多了一個 A+ (多3點)，所以羽彤在第七關「會考總積點」以 1 點之差勝出！這題告訴大家：作文非常重要（能補足2~3點差距），但每一科大科的等級標示更是一分都不能放鬆！'
  },
  {
    id: 'quiz_4',
    badge: '科目權重大魔王',
    title: '【第 4 戰】國文科真的是中投區大魔王嗎？單科 PK 戰！',
    targetSchool: { name: '興大附中', department: '普通科', quota: 1 },
    question: '子豪與冠宇總積分100、總積點95點、+號總數也剛好相同。子豪國文 A++ 數學 A；冠宇國文 A 數學 A++。誰會笑到最後？',
    studentA: {
      name: '黃子豪',
      avatar: '📘',
      grades: { chinese: 'A++', math: 'A', english: 'A+', social: 'A+', science: 'A+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '吳冠宇',
      avatar: '📐',
      grades: { chinese: 'A', math: 'A++', english: 'A+', social: 'A+', science: 'A+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：比到第十關單科標示時，法定順序是：國文 ➔ 數學 ➔ 英語 ➔ 社會 ➔ 自然！',
    explanation: '【答案是黃子豪錄取！】子豪國文 A++，冠宇國文 A。在中投區，單科比序的第一順位就是「國文科」！在國文科等級標示比序時，子豪就直接獲勝錄取，完全不需要輪到第二順位的數學科！這就是中投區考生口耳相傳「國文定生死」的由來！'
  },
  {
    id: 'quiz_5',
    badge: '志願序規則秘笈',
    title: '【第 5 戰】連續填寫同校不同科，真的不會被扣分嗎？',
    targetSchool: { name: '臺中高工', department: '電機科', quota: 1 },
    question: '阿凱第1志願填臺中高工資訊科、第2志願填臺中高工電機科；阿偉第1志願直接填臺中高工電機科。阿凱第2志願比電機科時志願序分數會吃虧嗎？',
    studentA: {
      name: '劉阿凱',
      avatar: '⚡',
      grades: { chinese: 'A', math: 'A+', english: 'A', social: 'B++', science: 'B++' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 2 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '張阿偉',
      avatar: '🔧',
      grades: { chinese: 'A', math: 'A+', english: 'A', social: 'B++', science: 'B++' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：阿凱的志願序積分依然是 30 分！但在所有會考成績完全相同時，比到第 12 關會發生什麼事？',
    explanation: '【答案是張阿偉錄取！】注意！阿凱的志願序積分確實是「30分滿分」（因為連續填同校不同科計為同一個志願序），所以前 11 關兩人都平手！但因為兩人會考成績完全一模一樣，一路比到了第 12 關「志願序之順次」：阿偉是「第1志願」，阿凱是「第2志願」，阿偉排在更前順次而錄取！這題讓學生學到：同校跨科不會扣志願積分，但若成績完全同分，排第一志願者仍佔順次優勢！'
  },
  {
    id: 'quiz_6',
    badge: '終極傳奇',
    title: '【第 6 戰】雙生子奇蹟：比到最後一關還平手，會抽籤嗎？',
    targetSchool: { name: '文華高中', department: '普通科', quota: 1 },
    question: '一對雙胞胎兄弟成傑與成浩，五科成績、作文、多元學習、志願順序全部一模一樣，但文華高中只剩最後 1 個缺額！誰會錄取？',
    studentA: {
      name: '林成傑',
      avatar: '👦',
      grades: { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '林成浩',
      avatar: '🧒',
      grades: { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A+' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：教育部與中投區免試入學明訂：「不予抽籤」！',
    explanation: '【答案是兩人全部錄取（增額錄取）！】中投區電腦分發絕不採取抽籤這種運氣方式！當 12 道比序關卡全部走完依然同分超額時，學校會報請主管機關啟動「增額錄取」，讓兩位優秀同學一同進入文華高中就讀！'
  }
];

// 中投區比序流程圖的 13 階結構（用於全景導覽圖）
const FLOWCHART_TREE = [
  {
    id: 'total_score',
    stepNumber: '1',
    title: '總積分',
    badge: '滿分 100 分',
    summary: '志願序(30) + 就近入學(10) + 扶助弱勢(3) + 多元表現(27) + 教育會考(30)',
    detail: '第一道門檻，五大指標總和。大部分競爭熱門高中的考生此處均接近滿分 100 分。'
  },
  {
    id: 'choice_score',
    stepNumber: '2',
    title: '志願序積分',
    badge: '滿分 30 分',
    summary: '第 1~10 志願序 30 分，每 10 個志願序同一組積分',
    detail: '連續選填同校不同類科者皆為同一志願序！讓考生能安心選填夢幻學校的多元科別。'
  },
  {
    id: 'nearby',
    stepNumber: '3',
    title: '就近入學積分',
    badge: '滿分 10 分',
    summary: '符合中投區或共同就學區考生得 10 分',
    detail: '經審核通過變更就學區之學生亦核給 10 分。'
  },
  {
    id: 'disadvantaged',
    stepNumber: '4',
    title: '扶助弱勢積分',
    badge: '上限 3 分',
    summary: '偏遠地區 1 分、中低收入戶 1 分、低收入戶 2 分',
    detail: '符合資格並繳交相關有效證明文件者給分。'
  },
  {
    id: 'multiple_learning',
    stepNumber: '5',
    title: '多元學習表現積分',
    badge: '滿分 27 分',
    summary: '均衡學習(12) ➔ 德行表現(5) ➔ 無記過(6) ➔ 獎勵紀錄(4)',
    detail: '若總分 27 分相同，會依序細比這四項子項目。絕大多數國中畢業生在學校導引下均能拿滿 27 分。'
  },
  {
    id: 'exam_score',
    stepNumber: '6',
    title: '教育會考表現積分',
    badge: '滿分 30 分',
    summary: '精熟(A) 6 分、基礎(B) 4 分、待加強(C) 2 分，不含寫作測驗',
    detail: '5 科最高 30 分（俗稱 5A=30分）。一科掉到 B 就少 2 分，影響極大！'
  },
  {
    id: 'exam_points',
    stepNumber: '7',
    title: '國中教育會考總積點',
    badge: '滿分 111 點',
    summary: '5 科點數(105點) + 寫作測驗點數(6點)',
    detail: 'A++=21, A+=18, A=15, B++=12, B+=9, B=6, C=3。寫作 1~6 級分得 1~6 點。前三志願名校的分水嶺！'
  },
  {
    id: 'plus_accumulation',
    stepNumber: '8',
    title: '等級標示 + 號總累積',
    badge: '關鍵決戰',
    summary: '先比「A 等級標示 + 號多寡」，若相同再比「B 等級標示 + 號多寡」',
    detail: 'A++ 算 2 個 +、A+ 算 1 個 +。總積點相同時，+ 號多的人直接勝出！'
  },
  {
    id: 'subject_scores',
    stepNumber: '9',
    title: '各科會考表現積分',
    badge: '法定科目順序',
    summary: '國文 ➔ 數學 ➔ 英語 ➔ 社會 ➔ 自然 (每科 6/4/2 分)',
    detail: '依固定科目順序比積分。'
  },
  {
    id: 'subject_grades',
    stepNumber: '10',
    title: '各科會考等級標示',
    badge: '單科 PK 戰',
    summary: '國文 ➔ 數學 ➔ 英語 ➔ 社會 ➔ 自然 (A++ > A+ > A > B++ > ...)',
    detail: '國文科在第 1 順位！如果前面全部平手，國文等級較高者直接勝出！'
  },
  {
    id: 'school_rank',
    stepNumber: '11',
    title: '志願序之校序順次',
    badge: '學校順序',
    summary: '比較該校在學生志願名單中是第幾所學校（排第 1 所學校優先）',
    detail: '若考生把該校填在更前面的校序，優先錄取。'
  },
  {
    id: 'choice_index',
    stepNumber: '12',
    title: '志願序之順次',
    badge: '絕對順次',
    summary: '比較該志願科別在志願卡上的序位（第 1 志願 > 第 2 志願）',
    detail: '排在更前面志願項目者優先錄取。'
  },
  {
    id: 'quota_overflow',
    stepNumber: '13',
    title: '增額錄取',
    badge: '絕不抽籤',
    summary: '經上述所有比序仍同分超額時，以【增額錄取】方式處理！',
    detail: '中投區保障每位努力的學生，絕不讓命運交給電腦抽籤！'
  }
];

// 匯出到全域命名空間，支援純 file:// 與瀏覽器原生普通 script 標籤
if (typeof window !== 'undefined') {
  window.ChotouRules = {
    GRADE_POINTS,
    GRADE_SCORES,
    GRADE_PLUS_COUNT,
    SUBJECT_ORDER,
    POPULAR_SCHOOLS,
    calculateChoiceScore,
    computeStudentStats,
    compareTwoStudents,
    QUIZ_CHALLENGES,
    FLOWCHART_TREE
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRADE_POINTS,
    GRADE_SCORES,
    GRADE_PLUS_COUNT,
    SUBJECT_ORDER,
    POPULAR_SCHOOLS,
    calculateChoiceScore,
    computeStudentStats,
    compareTwoStudents,
    QUIZ_CHALLENGES,
    FLOWCHART_TREE
  };
}
