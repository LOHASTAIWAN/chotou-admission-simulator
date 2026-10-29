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
  // 公立明星高中
  { id: 'tcfsh', name: '臺中一中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'tcgs',  name: '臺中女中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'nehs',  name: '中科實中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'nchu',  name: '興大附中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'tc2sh', name: '臺中二中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'whsh',  name: '文華高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'hwsh',  name: '惠文高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'zmsh',  name: '忠明高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'csesh', name: '清水高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'cyhs',  name: '長億高中', department: '普通科', quota: 1, type: '公立高中' },
  { id: 'djhs',  name: '大甲高中', department: '普通科', quota: 1, type: '公立高中' },

  // 臺中高工 (專業群科旗艦)
  { id: 'tcivs_ee', name: '臺中高工', department: '電機科', quota: 1, type: '公立高職' },
  { id: 'tcivs_el', name: '臺中高工', department: '電子科', quota: 1, type: '公立高職' },
  { id: 'tcivs_cs', name: '臺中高工', department: '資訊科', quota: 1, type: '公立高職' },
  { id: 'tcivs_ct', name: '臺中高工', department: '控制科', quota: 1, type: '公立高職' },
  { id: 'tcivs_arch', name: '臺中高工', department: '建築科', quota: 1, type: '公立高職' },
  { id: 'tcivs_chem', name: '臺中高工', department: '化工科', quota: 1, type: '公立高職' },
  { id: 'tcivs_mech', name: '臺中高工', department: '機械科', quota: 1, type: '公立高職' },
  { id: 'tcivs_draw', name: '臺中高工', department: '圖文傳播科', quota: 1, type: '公立高職' },
  { id: 'tcivs_auto', name: '臺中高工', department: '汽車科', quota: 1, type: '公立高職' },
  { id: 'tcivs_ref', name: '臺中高工', department: '冷凍空調科', quota: 1, type: '公立高職' },
  { id: 'tcivs_sheet', name: '臺中高工', department: '板金科', quota: 1, type: '公立高職' },

  // 臺中家商 (商業管理與家事旗艦)
  { id: 'tchcvs_en', name: '臺中家商', department: '應用英語科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_bm', name: '臺中家商', department: '商業經營科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_it', name: '臺中家商', department: '國際貿易科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_dp', name: '臺中家商', department: '資料處理科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_ac', name: '臺中家商', department: '會計事務科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_cc', name: '臺中家商', department: '幼兒保育科', quota: 1, type: '公立高職' },
  { id: 'tchcvs_fd', name: '臺中家商', department: '服裝設計科', quota: 1, type: '公立高職' },

  // 興大附農 (臺中高農)
  { id: 'nchuv_tour', name: '興大附農', department: '觀光事業科', quota: 1, type: '公立高職' },
  { id: 'nchuv_food', name: '興大附農', department: '餐飲管理科', quota: 1, type: '公立高職' },
  { id: 'nchuv_hort', name: '興大附農', department: '園藝科', quota: 1, type: '公立高職' },
  { id: 'nchuv_proc', name: '興大附農', department: '食品加工科', quota: 1, type: '公立高職' },
  { id: 'nchuv_anim', name: '興大附農', department: '畜產保健科', quota: 1, type: '公立高職' },
  { id: 'nchuv_farm', name: '興大附農', department: '農場經營科', quota: 1, type: '公立高職' },
  { id: 'nchuv_bio',  name: '興大附農', department: '生物產業機電科', quota: 1, type: '公立高職' },

  // 沙鹿高工
  { id: 'slvs_cs',   name: '沙鹿高工', department: '資訊科', quota: 1, type: '公立高職' },
  { id: 'slvs_el',   name: '沙鹿高工', department: '電子科', quota: 1, type: '公立高職' },
  { id: 'slvs_mech', name: '沙鹿高工', department: '機械科', quota: 1, type: '公立高職' },
  { id: 'slvs_chem', name: '沙鹿高工', department: '化工科', quota: 1, type: '公立高職' },
  { id: 'slvs_auto', name: '沙鹿高工', department: '汽車科', quota: 1, type: '公立高職' },

  // 東勢高工
  { id: 'tsvs_ee',   name: '東勢高工', department: '電機科', quota: 1, type: '公立高職' },
  { id: 'tsvs_el',   name: '東勢高工', department: '電子科', quota: 1, type: '公立高職' },
  { id: 'tsvs_arch', name: '東勢高工', department: '建築科', quota: 1, type: '公立高職' },
  { id: 'tsvs_int',  name: '東勢高工', department: '室內空間設計科', quota: 1, type: '公立高職' },
  { id: 'tsvs_mech', name: '東勢高工', department: '機械科', quota: 1, type: '公立高職' },

  // 霧峰農工
  { id: 'wfvs_ee',   name: '霧峰農工', department: '電機科', quota: 1, type: '公立高職' },
  { id: 'wfvs_el',   name: '霧峰農工', department: '電子科', quota: 1, type: '公立高職' },
  { id: 'wfvs_food', name: '霧峰農工', department: '餐飲管理科', quota: 1, type: '公立高職' },
  { id: 'wfvs_proc', name: '霧峰農工', department: '食品加工科', quota: 1, type: '公立高職' },
  { id: 'wfvs_mech', name: '霧峰農工', department: '機械科', quota: 1, type: '公立高職' },

  // 南投公立技術型高中
  { id: 'ctvs_en',   name: '草屯商工', department: '應用英語科', quota: 1, type: '公立高職' },
  { id: 'ctvs_bm',   name: '草屯商工', department: '商業經營科', quota: 1, type: '公立高職' },
  { id: 'ctvs_mech', name: '草屯商工', department: '機械科', quota: 1, type: '公立高職' },
  { id: 'ntvs_en',   name: '南投高商', department: '應用英語科', quota: 1, type: '公立高職' },
  { id: 'ntvs_bm',   name: '南投高商', department: '商業經營科', quota: 1, type: '公立高職' },
  { id: 'ntvs_dp',   name: '南投高商', department: '資料處理科', quota: 1, type: '公立高職' },
  { id: 'plvs_ee',   name: '埔里高工', department: '電機科', quota: 1, type: '公立高職' },
  { id: 'plvs_cs',   name: '埔里高工', department: '資訊科', quota: 1, type: '公立高職' },
  { id: 'plvs_chem', name: '埔里高工', department: '化工科', quota: 1, type: '公立高職' }
];

// =========================================================================
// 依據使用者所附【112, 113, 114 落點比較圖】精準建立的 21 所高中歷史落點對照表
// =========================================================================
const HISTORICAL_CUTOFF_TABLE = [
  { school: '臺中一中', y112: '5A6+ 寫作5 國A++ 數A+', y113: '5A6+ 寫作4 國A++', y114: '5A5+ 寫作5 國A++ 數A+', pts114: 97, score114: 97, tier: 'T1' },
  { school: '臺中女中', y112: '5A5+ 寫作5 國A++ 數A+', y113: '5A4+ 寫作5 國A 數英A++', y114: '5A4+ 寫作5 國A 數A+', pts114: 95, score114: 97, tier: 'T1' },
  { school: '中科實中', y112: '5A4+ 寫作4', y113: '5A4+ 寫作4 國A+ 數A++', y114: '5A3+ 寫作5', pts114: 94, score114: 97, tier: 'T1' },
  { school: '興大附中', y112: '5A3+ 寫作4', y113: '4A1B10+ 寫作5', y114: '4A1B7+ 寫作4 國A+ 數A', pts114: 89, score114: 95, tier: 'T2' },
  { school: '文華高中(男)', y112: '4A1B8+ 寫作5', y113: '4A1B7+ 寫作4', y114: '4A1B6+ 寫作4', pts114: 87, score114: 95, tier: 'T2' },
  { school: '文華高中(女)', y112: '4A1B5+ 寫作5', y113: '4A1B5+ 寫作4 國A 數A+', y114: '4A1B5+ 寫作4', pts114: 85, score114: 95, tier: 'T2' },
  { school: '惠文高中', y112: '4A1B4+ 寫作4', y113: '4A1B4+ 寫作4', y114: '4A1B3+ 寫作4', pts114: 81, score114: 95, tier: 'T3' },
  { school: '臺中二中(男)', y112: '3A2B6+ 寫作4', y113: '3A2B4+ 寫作4', y114: '3A2B3+ 寫作4', pts114: 76, score114: 93, tier: 'T3' },
  { school: '臺中二中(女)', y112: '3A2B6+ 寫作4', y113: '3A2B3+ 寫作5', y114: '3A2B3+ 寫作4', pts114: 76, score114: 93, tier: 'T3' },
  { school: '忠明高中', y112: '3A2B4+ 寫作4', y113: '3A2B3+ 寫作4', y114: '3A2B2+ 寫作4', pts114: 74, score114: 93, tier: 'T4' },
  { school: '西苑高中', y112: '2A3B8+ 寫作4', y113: '2A3B6+ 寫作4', y114: '2A3B6+ 寫作4', pts114: 71, score114: 91, tier: 'T4' },
  { school: '東山高中', y112: '2A3B8+ 寫作4', y113: '2A3B6+ 寫作4', y114: '2A3B6+ 寫作4', pts114: 71, score114: 91, tier: 'T4' },
  { school: '大里高中(市大里)', y112: '2A3B6+ 寫作4', y113: '2A3B4+ 寫作4', y114: '2A3B3+ 寫作4', pts114: 65, score114: 91, tier: 'T5' },
  { school: '清水高中', y112: '1A4B8+ 寫作4', y113: '1A4B6+ 寫作4', y114: '1A4B5+ 寫作5', pts114: 64, score114: 89, tier: 'T5' },
  { school: '豐原高中', y112: '1A4B5+ 寫作4', y113: '1A4B5+ 寫作4', y114: '1A4B2+ 寫作4', pts114: 57, score114: 89, tier: 'T5' },
  { school: '中興高中', y112: '1A4B7+ 寫作4', y113: '1A4B6+ 寫作4', y114: '5B8+ 寫作4', pts114: 56, score114: 87, tier: 'T6' },
  { school: '長億高中', y112: '1A4B5+ (估)', y113: '1A4B5+ 寫作4', y114: '5B7+ 寫作4', pts114: 55, score114: 87, tier: 'T6' },
  { school: '中港高中', y112: '5B7+ 寫作4', y113: '5B7+ 寫作4', y114: '5B6+ 寫作4', pts114: 54, score114: 87, tier: 'T6' },
  { school: '大甲高中', y112: '5B5+ 寫作4', y113: '5B2+ 寫作4', y114: '5B2+ 寫作4', pts114: 46, score114: 87, tier: 'T6' },
  { school: '龍津高中', y112: '5B4+ 寫作4', y113: '5B3+ 寫作3', y114: '5B2+ 寫作3', pts114: 45, score114: 87, tier: 'T7' },
  { school: '后綜高中', y112: '5B2+ 寫作4', y113: '4B1C8+ 寫作3', y114: '4B1C6+ 寫作3', pts114: 43, score114: 85, tier: 'T7' },
  // 臺中高工 114 年官方核定一般生錄取標準 (新增自 114 年一般生最低錄取成績單)
  { school: '臺中高工(電機科)', y112: '3A2B 寫作4 (估)', y113: '3A2B 寫作4 (估)', y114: '3A2B5+ 寫作4 (最低) / 5A5+ (最高)', pts114: 76, score114: 93, tier: 'T3' },
  { school: '臺中高工(電子科)', y112: '2A3B 寫作4 (估)', y113: '2A3B 寫作4 (估)', y114: '2A3B6+ 寫作4 (最低) / 4A1B8+ (最高)', pts114: 70, score114: 91, tier: 'T4' },
  { school: '臺中高工(資訊科)', y112: '2A3B 寫作4 (估)', y113: '2A3B 寫作4 (估)', y114: '2A3B5+ 寫作4 (最低) / 5A5+ (最高)', pts114: 67, score114: 91, tier: 'T4' },
  { school: '臺中高工(控制科)', y112: '1A4B 寫作4 (估)', y113: '1A4B 寫作4 (估)', y114: '1A4B8+ 寫作4 (最低) / 3A2B5+ (最高)', pts114: 67, score114: 89, tier: 'T5' },
  { school: '臺中高工(建築科)', y112: '2A3B 寫作4 (估)', y113: '2A3B 寫作4 (估)', y114: '2A3B4+ 寫作4 (最低) / 4A1B7+ (最高)', pts114: 64, score114: 91, tier: 'T5' },
  { school: '臺中高工(化工科)', y112: '1A4B 寫作4 (估)', y113: '1A4B 寫作4 (估)', y114: '1A4B7+ 寫作4 (最低) / 5A8+ 104點 (最高)', pts114: 64, score114: 89, tier: 'T5' },
  { school: '臺中高工(機械科)', y112: '1A4B 寫作4 (估)', y113: '1A4B 寫作4 (估)', y114: '2A2B1C 4+ 寫作4 (最低) / 4A1B4+ (最高)', pts114: 61, score114: 89, tier: 'T5' },
  { school: '臺中高工(圖文傳播)', y112: '1A4B 寫作4 (估)', y113: '1A4B 寫作4 (估)', y114: '1A4B7+ 寫作4 (最低) / 5A3+ (最高)', pts114: 61, score114: 89, tier: 'T5' }
];

// =========================================================================
// 依據官方 PDF【臺中高工 114 年一般生最低錄取成績】完整科別資料庫
// =========================================================================
const TCIVS_114_CUTOFF_DATA = [
  {
    group: '機械群',
    dept: '機械科',
    maxScore: 95,
    minScore: 89,
    maxPoints: 82,
    minPoints: 61,
    maxGrade: '4A1B，4 個+，作文 4 級分',
    minGrade: '2A2B1C，4 個+，作文 4 級分',
    notes: '群核心科別，最高分達 4A1B 82 點'
  },
  {
    group: '機械群',
    dept: '電腦機械製圖科',
    maxScore: 91,
    minScore: 89,
    maxPoints: 73,
    minPoints: 49,
    maxGrade: '3A2B，3 個+，作文 4 級分',
    minGrade: '1A4B，2 個+，作文 4 級分',
    notes: '重視精密製圖與 CAD 設計能力'
  },
  {
    group: '機械群',
    dept: '板金科',
    maxScore: 89,
    minScore: 87,
    maxPoints: 61,
    minPoints: 51,
    maxGrade: '1A4B，6 個+，作文 4 級分',
    minGrade: '5B，6 個+，作文 3 級分',
    notes: '實作與工藝導向，門檻約 5B6+'
  },
  {
    group: '機械群',
    dept: '機械科精密機械暨建教合作班',
    maxScore: 85.8,
    minScore: 15.9,
    maxPoints: 49,
    minPoints: 28,
    maxGrade: '1A4B，2 個+，作文 4 級分',
    minGrade: '3B2C，1 個+，作文 1 級分',
    notes: '特別注意：本班為獨招需另外單獨報名'
  },
  {
    group: '動力機械群',
    dept: '汽車科',
    maxScore: 93,
    minScore: 87,
    maxPoints: 82,
    minPoints: 32,
    maxGrade: '3A2B，7 個+，作文 4 級分',
    minGrade: '5B，作文 5 級分',
    notes: '跨度較大，最低門檻 5B 作文 5 級分'
  },
  {
    group: '電機電子群(電機類)',
    dept: '電機科',
    maxScore: 97,
    minScore: 93,
    maxPoints: 94,
    minPoints: 76,
    maxGrade: '5A，5 個+，作文 4 級分',
    minGrade: '3A2B，5 個+，作文 4 級分',
    notes: '🔥 臺中高工錄取門檻第一名！5A達7人，最低需 3A2B5+ (76點)'
  },
  {
    group: '電機電子群(電機類)',
    dept: '控制科',
    maxScore: 93,
    minScore: 89,
    maxPoints: 76,
    minPoints: 67,
    maxGrade: '3A2B，5 個+，作文 4 級分',
    minGrade: '1A4B，8 個+，作文 4 級分',
    notes: '智慧控制與機電整合，最低需 1A4B8+ (67點)'
  },
  {
    group: '電機電子群(電機類)',
    dept: '冷凍空調科',
    maxScore: 95,
    minScore: 89,
    maxPoints: 79,
    minPoints: 55,
    maxGrade: '4A1B，3 個+，作文 4 級分',
    minGrade: '1A4B，4 個+，作文 4 級分',
    notes: '高就業率特色科別，最高分達 4A1B 79點'
  },
  {
    group: '電機電子群(資電類)',
    dept: '資訊科',
    maxScore: 97,
    minScore: 91,
    maxPoints: 94,
    minPoints: 67,
    maxGrade: '5A，5 個+，作文 4 級分',
    minGrade: '2A3B，5 個+，作文 4 級分',
    notes: '🔥 超人氣資電科！5A達6人，最高 94 點，最低 2A3B5+ (67點)'
  },
  {
    group: '電機電子群(資電類)',
    dept: '電子科',
    maxScore: 95,
    minScore: 91,
    maxPoints: 94,
    minPoints: 70,
    maxGrade: '4A1B，8 個+，作文 4 級分',
    minGrade: '2A3B，6 個+，作文 4 級分',
    notes: '資電熱門科，最高 94 點，最低需 2A3B6+ (70點)'
  },
  {
    group: '化工群',
    dept: '化工科',
    maxScore: 97,
    minScore: 89,
    maxPoints: 104,
    minPoints: 64,
    maxGrade: '5A，8 個+，作文 5 級分',
    minGrade: '1A4B，7 個+，作文 4 級分',
    notes: '🌟 全校最高分榜首所在！最高高達 5A8+ 104點(作文5)'
  },
  {
    group: '土木建築群',
    dept: '建築科',
    maxScore: 95,
    minScore: 91,
    maxPoints: 91,
    minPoints: 64,
    maxGrade: '4A1B，7 個+，作文 4 級分',
    minGrade: '2A3B，4 個+，作文 4 級分',
    notes: '建築設計熱門科，最高 4A1B 91點，最低 2A3B4+ (64點)'
  },
  {
    group: '土木建築群',
    dept: '土木科',
    maxScore: 91,
    minScore: 89,
    maxPoints: 70,
    minPoints: 60,
    maxGrade: '2A3B，6 個+，作文 4 級分',
    minGrade: '1A4B，6 個+，作文 3 級分',
    notes: '國家工程與測量核心，最低 1A4B6+ 作文3 (60點)'
  },
  {
    group: '設計群',
    dept: '圖文傳播科',
    maxScore: 97,
    minScore: 89,
    maxPoints: 88,
    minPoints: 61,
    maxGrade: '5A，3 個+，作文 4 級分',
    minGrade: '1A4B，7 個+，作文 4 級分',
    notes: '藝術設計跨域，含 5A 考生 1 位，最高 88 點'
  }
];

// 臺中高工 114 官方備註重點整理
const TCIVS_114_NOTES = [
  '此為 114 年中投區免試入學一般生最低錄取分數。',
  '同一類群於科技大學四技二專統一入學測驗 (統測) 報考相同專業科目。',
  '臺中高工全校錄取成績達 5A 者共 15 位：電機科 7 位、資訊科 6 位、化工科 1 位、圖文傳播科 1 位。',
  '電機科為全校錄取積點門檻之冠（最低 76 點 / 3A2B5+ 寫作4）；化工科則出現全校最高積點榜首（104 點 / 5A8+ 寫作5）。'
];

// =========================================================================
// 依據附件兩張圖片與核定名額對齊的「3 萬人篩選器模擬用學校容量庫」
// =========================================================================
const SCHOOL_CAPACITIES_AND_CUTOFFS = [
  {
    id: 'tcfsh',
    name: '臺中一中',
    dept: '普通科',
    category: '明星男校',
    quota: 920,
    minScore: 97,
    safePoints: 97,
    minPoints: 94,
    minGradeDesc: '114年: 5A5+ 寫作5 國A++ 數A+',
    rankRange: '1 ~ 950 名',
    tier: 'T1'
  },
  {
    id: 'tcgs',
    name: '臺中女中',
    dept: '普通科',
    category: '明星女校',
    quota: 700,
    minScore: 97,
    safePoints: 95,
    minPoints: 92,
    minGradeDesc: '114年: 5A4+ 寫作5 國A 數A+',
    rankRange: '1 ~ 1,650 名',
    tier: 'T1'
  },
  {
    id: 'nehs',
    name: '中科實中',
    dept: '普通科',
    category: '國立高中',
    quota: 140,
    minScore: 97,
    safePoints: 94,
    minPoints: 91,
    minGradeDesc: '114年: 5A3+ 寫作5',
    rankRange: '600 ~ 1,800 名',
    tier: 'T1'
  },
  {
    id: 'nchu',
    name: '興大附中',
    dept: '普通科',
    category: '國立高中',
    quota: 560,
    minScore: 95,
    safePoints: 89,
    minPoints: 86,
    minGradeDesc: '114年: 4A1B7+ 寫作4 國A+ 數A',
    rankRange: '1,800 ~ 2,800 名',
    tier: 'T2'
  },
  {
    id: 'whsh',
    name: '文華高中',
    dept: '普通科',
    category: '公立高中',
    quota: 750,
    minScore: 95,
    safePoints: 87,
    minPoints: 84,
    minGradeDesc: '114年: 4A1B5+~6+ 寫作4',
    rankRange: '2,000 ~ 3,200 名',
    tier: 'T2'
  },
  {
    id: 'hwsh',
    name: '惠文高中',
    dept: '普通科',
    category: '市立高中',
    quota: 400,
    minScore: 95,
    safePoints: 81,
    minPoints: 78,
    minGradeDesc: '114年: 4A1B3+ 寫作4',
    rankRange: '3,200 ~ 4,500 名',
    tier: 'T3'
  },
  {
    id: 'tc2sh',
    name: '臺中二中',
    dept: '普通科',
    category: '公立高中',
    quota: 800,
    minScore: 93,
    safePoints: 76,
    minPoints: 73,
    minGradeDesc: '114年: 3A2B3+ 寫作4',
    rankRange: '4,500 ~ 6,000 名',
    tier: 'T3'
  },
  {
    id: 'zmsh',
    name: '忠明高中',
    dept: '普通科',
    category: '市立高中',
    quota: 360,
    minScore: 93,
    safePoints: 74,
    minPoints: 71,
    minGradeDesc: '114年: 3A2B2+ 寫作4',
    rankRange: '5,500 ~ 7,000 名',
    tier: 'T4'
  },
  {
    id: 'tcivs_ee',
    name: '臺中高工',
    dept: '電機科',
    category: '頂尖技術',
    quota: 80,
    minScore: 93,
    safePoints: 80,
    minPoints: 76,
    minGradeDesc: '114年: 3A2B5+ 寫作4 (76點)',
    rankRange: '4,500 ~ 6,000 名',
    tier: 'T3'
  },
  {
    id: 'tcivs_el',
    name: '臺中高工',
    dept: '電子科',
    category: '頂尖技術',
    quota: 80,
    minScore: 91,
    safePoints: 74,
    minPoints: 70,
    minGradeDesc: '114年: 2A3B6+ 寫作4 (70點)',
    rankRange: '6,000 ~ 7,500 名',
    tier: 'T4'
  },
  {
    id: 'tcivs_cs',
    name: '臺中高工',
    dept: '資訊科',
    category: '頂尖技術',
    quota: 80,
    minScore: 91,
    safePoints: 72,
    minPoints: 67,
    minGradeDesc: '114年: 2A3B5+ 寫作4 (67點)',
    rankRange: '6,500 ~ 8,000 名',
    tier: 'T4'
  },
  {
    id: 'tcivs_arch',
    name: '臺中高工',
    dept: '建築科',
    category: '頂尖技術',
    quota: 80,
    minScore: 91,
    safePoints: 68,
    minPoints: 64,
    minGradeDesc: '114年: 2A3B4+ 寫作4 (64點)',
    rankRange: '7,500 ~ 9,000 名',
    tier: 'T5'
  },
  {
    id: 'tcivs_chem',
    name: '臺中高工',
    dept: '化工科',
    category: '頂尖技術',
    quota: 80,
    minScore: 89,
    safePoints: 68,
    minPoints: 64,
    minGradeDesc: '114年: 1A4B7+ 寫作4 (64點)',
    rankRange: '7,500 ~ 9,000 名',
    tier: 'T5'
  },
  {
    id: 'tcivs_mech',
    name: '臺中高工',
    dept: '機械科',
    category: '頂尖技術',
    quota: 80,
    minScore: 89,
    safePoints: 65,
    minPoints: 61,
    minGradeDesc: '114年: 2A2B1C 4+ 寫作4 (61點)',
    rankRange: '8,500 ~ 10,000 名',
    tier: 'T5'
  },
  {
    id: 'xysh',
    name: '西苑高中',
    dept: '普通科',
    category: '市立高中',
    quota: 360,
    minScore: 91,
    safePoints: 71,
    minPoints: 67,
    minGradeDesc: '114年: 2A3B6+ 寫作4',
    rankRange: '6,800 ~ 8,500 名',
    tier: 'T4'
  },
  {
    id: 'eshm',
    name: '東山高中',
    dept: '普通科',
    category: '市立高中',
    quota: 360,
    minScore: 91,
    safePoints: 71,
    minPoints: 67,
    minGradeDesc: '114年: 2A3B6+ 寫作4',
    rankRange: '6,800 ~ 8,500 名',
    tier: 'T4'
  },
  {
    id: 'dlsh',
    name: '大里高中',
    dept: '普通科(市大里)',
    category: '市立高中',
    quota: 320,
    minScore: 91,
    safePoints: 65,
    minPoints: 61,
    minGradeDesc: '114年: 2A3B3+ 寫作4',
    rankRange: '8,500 ~ 10,500 名',
    tier: 'T5'
  },
  {
    id: 'csesh',
    name: '清水高中',
    dept: '普通科',
    category: '國立高中',
    quota: 520,
    minScore: 89,
    safePoints: 64,
    minPoints: 59,
    minGradeDesc: '114年: 1A4B5+ 寫作5',
    rankRange: '10,000 ~ 12,500 名',
    tier: 'T5'
  },
  {
    id: 'fyhs',
    name: '豐原高中',
    dept: '普通科',
    category: '國立高中',
    quota: 560,
    minScore: 89,
    safePoints: 57,
    minPoints: 53,
    minGradeDesc: '114年: 1A4B2+ 寫作4',
    rankRange: '11,500 ~ 14,000 名',
    tier: 'T5'
  },
  {
    id: 'chsh',
    name: '中興高中',
    dept: '普通科(南投)',
    category: '國立高中',
    quota: 480,
    minScore: 87,
    safePoints: 56,
    minPoints: 51,
    minGradeDesc: '114年: 5B8+ 寫作4',
    rankRange: '13,000 ~ 15,500 名',
    tier: 'T6'
  },
  {
    id: 'cyhs',
    name: '長億高中',
    dept: '普通科',
    category: '市立高中',
    quota: 360,
    minScore: 87,
    safePoints: 55,
    minPoints: 50,
    minGradeDesc: '114年: 5B7+ 寫作4',
    rankRange: '13,500 ~ 16,000 名',
    tier: 'T6'
  },
  {
    id: 'cksh',
    name: '中港高中',
    dept: '普通科',
    category: '市立高中',
    quota: 280,
    minScore: 87,
    safePoints: 54,
    minPoints: 49,
    minGradeDesc: '114年: 5B6+ 寫作4',
    rankRange: '14,000 ~ 16,800 名',
    tier: 'T6'
  },
  {
    id: 'tchcvs_en',
    name: '臺中家商',
    dept: '應用英語科',
    category: '公立高職',
    quota: 180,
    minScore: 91,
    safePoints: 68,
    minPoints: 63,
    minGradeDesc: '熱門外語科: 2A3B ~ 1A4B (63點)',
    rankRange: '8,000 ~ 11,000 名',
    tier: 'T5'
  },
  {
    id: 'tchcvs_bm',
    name: '臺中家商',
    dept: '商業經營科',
    category: '公立高職',
    quota: 160,
    minScore: 89,
    safePoints: 64,
    minPoints: 59,
    minGradeDesc: '商管核心科: 1A4B (59點)',
    rankRange: '9,500 ~ 12,000 名',
    tier: 'T5'
  },
  {
    id: 'tchcvs_it',
    name: '臺中家商',
    dept: '國際貿易科',
    category: '公立高職',
    quota: 160,
    minScore: 89,
    safePoints: 65,
    minPoints: 60,
    minGradeDesc: '商管國際科: 1A4B~2A3B (60點)',
    rankRange: '9,000 ~ 11,800 名',
    tier: 'T5'
  },
  {
    id: 'tchcvs_dp',
    name: '臺中家商',
    dept: '資料處理科',
    category: '公立高職',
    quota: 160,
    minScore: 89,
    safePoints: 63,
    minPoints: 58,
    minGradeDesc: '資訊商管科: 1A4B (58點)',
    rankRange: '10,000 ~ 12,500 名',
    tier: 'T5'
  },
  {
    id: 'tchcvs_cc',
    name: '臺中家商',
    dept: '幼兒保育科',
    category: '公立高職',
    quota: 120,
    minScore: 87,
    safePoints: 55,
    minPoints: 50,
    minGradeDesc: '幼保專業: 5B7+ (50點)',
    rankRange: '12,500 ~ 15,000 名',
    tier: 'T6'
  },
  {
    id: 'tchcvs_fd',
    name: '臺中家商',
    dept: '服裝設計科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 56,
    minPoints: 51,
    minGradeDesc: '時尚設計: 5B8+ (51點)',
    rankRange: '12,000 ~ 14,500 名',
    tier: 'T6'
  },

  // 臺中高工補充科別
  {
    id: 'tcivs_auto',
    name: '臺中高工',
    dept: '汽車科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 58,
    minPoints: 53,
    minGradeDesc: '動力機械: 5B9+~1A4B (53點)',
    rankRange: '11,000 ~ 13,500 名',
    tier: 'T5'
  },
  {
    id: 'tcivs_ref',
    name: '臺中高工',
    dept: '冷凍空調科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 58,
    minPoints: 52,
    minGradeDesc: '智慧空調: 5B8+ (52點)',
    rankRange: '11,500 ~ 14,000 名',
    tier: 'T6'
  },
  {
    id: 'tcivs_sheet',
    name: '臺中高工',
    dept: '板金科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 55,
    minPoints: 50,
    minGradeDesc: '精密成形: 5B7+ (50點)',
    rankRange: '12,500 ~ 15,500 名',
    tier: 'T6'
  },
  {
    id: 'tcivs_draw',
    name: '臺中高工',
    dept: '圖文傳播科',
    category: '公立高職',
    quota: 80,
    minScore: 89,
    safePoints: 65,
    minPoints: 61,
    minGradeDesc: '114年: 1A4B7+ 寫作4 (61點)',
    rankRange: '8,500 ~ 10,000 名',
    tier: 'T5'
  },

  // 興大附農 (臺中高農)
  {
    id: 'nchuv_tour',
    name: '興大附農',
    dept: '觀光事業科',
    category: '公立高職',
    quota: 100,
    minScore: 89,
    safePoints: 63,
    minPoints: 58,
    minGradeDesc: '餐旅觀光: 1A4B (58點)',
    rankRange: '10,000 ~ 12,800 名',
    tier: 'T5'
  },
  {
    id: 'nchuv_food',
    name: '興大附農',
    dept: '餐飲管理科',
    category: '公立高職',
    quota: 100,
    minScore: 89,
    safePoints: 64,
    minPoints: 59,
    minGradeDesc: '專業廚藝餐飲: 1A4B (59點)',
    rankRange: '9,500 ~ 12,000 名',
    tier: 'T5'
  },
  {
    id: 'nchuv_proc',
    name: '興大附農',
    dept: '食品加工科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 56,
    minPoints: 51,
    minGradeDesc: '生技食品: 5B7+ (51點)',
    rankRange: '12,500 ~ 15,000 名',
    tier: 'T6'
  },
  {
    id: 'nchuv_hort',
    name: '興大附農',
    dept: '園藝科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 55,
    minPoints: 50,
    minGradeDesc: '造園花卉: 5B6+ (50點)',
    rankRange: '13,000 ~ 15,500 名',
    tier: 'T6'
  },
  {
    id: 'nchuv_anim',
    name: '興大附農',
    dept: '畜產保健科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 57,
    minPoints: 52,
    minGradeDesc: '寵物生醫: 5B8+ (52點)',
    rankRange: '12,000 ~ 14,500 名',
    tier: 'T6'
  },

  // 沙鹿高工
  {
    id: 'slvs_cs',
    name: '沙鹿高工',
    dept: '資訊科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 58,
    minPoints: 53,
    minGradeDesc: '海線工科旗艦: 5B8+ (53點)',
    rankRange: '11,500 ~ 14,000 名',
    tier: 'T6'
  },
  {
    id: 'slvs_el',
    name: '沙鹿高工',
    dept: '電子科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 56,
    minPoints: 51,
    minGradeDesc: '電子半導體: 5B7+ (51點)',
    rankRange: '12,500 ~ 15,000 名',
    tier: 'T6'
  },
  {
    id: 'slvs_mech',
    name: '沙鹿高工',
    dept: '機械科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 54,
    minPoints: 48,
    minGradeDesc: '精密機械: 5B5+ (48點)',
    rankRange: '13,500 ~ 16,500 名',
    tier: 'T6'
  },
  {
    id: 'slvs_chem',
    name: '沙鹿高工',
    dept: '化工科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 53,
    minPoints: 47,
    minGradeDesc: '化學工程: 5B4+ (47點)',
    rankRange: '14,000 ~ 17,000 名',
    tier: 'T6'
  },
  {
    id: 'slvs_auto',
    name: '沙鹿高工',
    dept: '汽車科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 51,
    minPoints: 45,
    minGradeDesc: '車輛工程: 5B3+ (45點)',
    rankRange: '15,000 ~ 18,000 名',
    tier: 'T6'
  },

  // 東勢高工
  {
    id: 'tsvs_ee',
    name: '東勢高工',
    dept: '電機科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 55,
    minPoints: 49,
    minGradeDesc: '山線技術亮點: 5B6+ (49點)',
    rankRange: '13,000 ~ 16,000 名',
    tier: 'T6'
  },
  {
    id: 'tsvs_arch',
    name: '東勢高工',
    dept: '建築科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 54,
    minPoints: 48,
    minGradeDesc: '建築空間: 5B5+ (48點)',
    rankRange: '13,500 ~ 16,500 名',
    tier: 'T6'
  },
  {
    id: 'tsvs_int',
    name: '東勢高工',
    dept: '室內空間設計科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 56,
    minPoints: 50,
    minGradeDesc: '空間設計: 5B6+ (50點)',
    rankRange: '12,500 ~ 15,500 名',
    tier: 'T6'
  },

  // 霧峰農工
  {
    id: 'wfvs_ee',
    name: '霧峰農工',
    dept: '電機科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 56,
    minPoints: 51,
    minGradeDesc: '屯區工科: 5B7+ (51點)',
    rankRange: '12,500 ~ 15,000 名',
    tier: 'T6'
  },
  {
    id: 'wfvs_food',
    name: '霧峰農工',
    dept: '餐飲管理科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 57,
    minPoints: 52,
    minGradeDesc: '觀光餐飲: 5B8+ (52點)',
    rankRange: '12,000 ~ 14,800 名',
    tier: 'T6'
  },

  // 南投公立技術型高中
  {
    id: 'ctvs_en',
    name: '草屯商工',
    dept: '應用英語科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 55,
    minPoints: 49,
    minGradeDesc: '南投外語首選: 5B5+ (49點)',
    rankRange: '13,500 ~ 16,500 名',
    tier: 'T6'
  },
  {
    id: 'ctvs_bm',
    name: '草屯商工',
    dept: '商業經營科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 53,
    minPoints: 46,
    minGradeDesc: '商業管理: 5B4+ (46點)',
    rankRange: '14,500 ~ 17,500 名',
    tier: 'T6'
  },
  {
    id: 'ntvs_en',
    name: '南投高商',
    dept: '應用英語科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 54,
    minPoints: 48,
    minGradeDesc: '南投市區商管: 5B5+ (48點)',
    rankRange: '13,500 ~ 16,500 名',
    tier: 'T6'
  },
  {
    id: 'ntvs_dp',
    name: '南投高商',
    dept: '資料處理科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 52,
    minPoints: 45,
    minGradeDesc: '數位資處: 5B3+ (45點)',
    rankRange: '15,000 ~ 18,000 名',
    tier: 'T6'
  },
  {
    id: 'plvs_ee',
    name: '埔里高工',
    dept: '電機科',
    category: '公立高職',
    quota: 80,
    minScore: 87,
    safePoints: 51,
    minPoints: 44,
    minGradeDesc: '大埔里電機: 5B3+ (44點)',
    rankRange: '15,500 ~ 19,000 名',
    tier: 'T6'
  },

  {
    id: 'djhs',
    name: '大甲高中',
    dept: '普通科',
    category: '市立高中',
    quota: 400,
    minScore: 87,
    safePoints: 46,
    minPoints: 42,
    minGradeDesc: '114年: 5B2+ 寫作4',
    rankRange: '16,500 ~ 19,500 名',
    tier: 'T6'
  },
  {
    id: 'hzsh',
    name: '后綜高中',
    dept: '普通科',
    category: '市立高中',
    quota: 320,
    minScore: 85,
    safePoints: 43,
    minPoints: 38,
    minGradeDesc: '114年: 4B1C6+ 寫作3',
    rankRange: '19,000 ~ 22,500 名',
    tier: 'T7'
  }
];

// 中投區 30,000 人常態分佈分群曲線參數
const POPULATION_CURVE = [
  { pointsMin: 105, pointsMax: 111, count: 480, label: '5A 7+ ~ 5A 10+', cumRank: 480, pct: '1.6%', tier: '特優頂尖' },
  { pointsMin: 95,  pointsMax: 104, count: 850, label: '5A 3+ ~ 5A 6+',  cumRank: 1330, pct: '4.4%', tier: '頂尖名校 (中一中/中女中)' },
  { pointsMin: 88,  pointsMax: 94,  count: 1150, label: '5A 0+ ~ 5A 2+', cumRank: 2480, pct: '8.3%', tier: '卓越高中 (中科實中/興大附中)' },
  { pointsMin: 80,  pointsMax: 87,  count: 1600, label: '4A1B ~ 5A',     cumRank: 4080, pct: '13.6%', tier: '明星高中 (文華/中二中/惠文)' },
  { pointsMin: 72,  pointsMax: 79,  count: 2200, label: '3A2B ~ 4A1B',   cumRank: 6280, pct: '20.9%', tier: '優質高中 (忠明/西苑/東山)' },
  { pointsMin: 64,  pointsMax: 71,  count: 3100, label: '2A3B ~ 3A2B',   cumRank: 9380, pct: '31.3%', tier: '社區高中 (清水/市大里)' },
  { pointsMin: 55,  pointsMax: 63,  count: 4200, label: '1A4B ~ 2A3B',   cumRank: 13580, pct: '45.3%', tier: '公立高中職 (豐原/中興/長億)' },
  { pointsMin: 45,  pointsMax: 54,  count: 5800, label: '5B (基礎群)',    cumRank: 19380, pct: '64.6%', tier: '公私立高中職 (中港/大甲/龍津)' },
  { pointsMin: 35,  pointsMax: 44,  count: 4600, label: '5B ~ 4B1C',     cumRank: 23980, pct: '79.9%', tier: '綜合高中/后綜' },
  { pointsMin: 15,  pointsMax: 34,  count: 6020, label: '待加強群 C',     cumRank: 30000, pct: '100%', tier: '完全免試/進修學校' }
];

/**
 * 估算學生在全中投區 3 萬名考生中的大約全區排名與百分比
 */
function estimateStudentRankIn30k(stats) {
  const points = stats.examPoints;
  const examScore = stats.examScore;

  if (examScore >= 30) {
    // 5A 生，全區約前 2,480 名
    if (points >= 108) return { minRank: 1, maxRank: 200, approx: 120, pr: 99.6 };
    if (points >= 105) return { minRank: 201, maxRank: 480, approx: 340, pr: 98.9 };
    if (points >= 98) return { minRank: 481, maxRank: 1100, approx: 820, pr: 97.2 };
    if (points >= 92) return { minRank: 1101, maxRank: 1800, approx: 1450, pr: 95.1 };
    return { minRank: 1801, maxRank: 2480, approx: 2150, pr: 92.8 };
  } else if (examScore >= 28) {
    // 4A1B，約第 2,481 ~ 4,080 名
    return { minRank: 2481, maxRank: 4200, approx: Math.max(2500, Math.round(3300 - (points - 75) * 45)), pr: 89.0 };
  } else if (examScore >= 26) {
    // 3A2B，約第 4,201 ~ 6,280 名
    return { minRank: 4201, maxRank: 6400, approx: Math.max(4300, Math.round(5200 - (points - 68) * 60)), pr: 82.5 };
  } else if (examScore >= 24) {
    // 2A3B，約第 6,401 ~ 9,380 名
    return { minRank: 6401, maxRank: 9500, approx: Math.max(6500, Math.round(8000 - (points - 60) * 80)), pr: 73.0 };
  } else if (examScore >= 22) {
    // 1A4B，約第 9,501 ~ 13,580 名
    return { minRank: 9501, maxRank: 13800, approx: Math.max(9600, Math.round(11500 - (points - 50) * 100)), pr: 61.5 };
  } else if (examScore >= 20) {
    // 5B，約第 13,801 ~ 22,000 名
    return { minRank: 13801, maxRank: 22000, approx: Math.max(14000, Math.round(17500 - (points - 35) * 150)), pr: 41.0 };
  } else {
    // 含 C
    return { minRank: 22001, maxRank: 30000, approx: 26000, pr: 15.0 };
  }
}

/**
 * 3 萬人志願分發模擬篩選器模型 (Admissions Engine Simulator)
 */
function simulate30kAdmissions(userStudent, userChoiceIds) {
  const stats = computeStudentStats(userStudent);
  const rankInfo = estimateStudentRankIn30k(stats);

  const choices = userChoiceIds.map((id, index) => {
    const sch = SCHOOL_CAPACITIES_AND_CUTOFFS.find(s => s.id === id);
    if (!sch) return null;
    return {
      choiceOrder: index + 1,
      school: sch,
      choiceScore: index < 10 ? 30 : (index < 20 ? 29 : 28)
    };
  }).filter(Boolean);

  let admittedChoice = null;
  const evaluationLog = [];

  for (let c of choices) {
    const sch = c.school;
    const userTotalScore = stats.multipleTotal + stats.nearby + stats.disadvantaged + stats.examScore + c.choiceScore;
    
    let canAdmit = false;
    let reason = '';
    let competitionRatio = (Math.random() * 0.3 + 1.25).toFixed(1);
    let applicantsCount = Math.round(sch.quota * parseFloat(competitionRatio));

    if (userTotalScore > sch.minScore) {
      if (stats.examPoints >= sch.safePoints) {
        canAdmit = true;
        reason = `【穩固錄取】總積分 ${userTotalScore} 分達標，且會考積點 ${stats.examPoints} 點超過該校安全線 (${sch.safePoints}點)！`;
      } else if (stats.examPoints >= sch.minPoints) {
        if (stats.aPlusCount >= 2 || stats.grades.chinese.startsWith('A')) {
          canAdmit = true;
          reason = `【壓線勝出】會考積點 ${stats.examPoints} 點落於競爭區間，因標示「+」號或國文單科比序佔優勢而搶下錄取名額！`;
        } else {
          canAdmit = false;
          reason = `【超額比序未錄取】會考積點 ${stats.examPoints} 點雖達門檻，但該校報名人數超過 ${sch.quota} 人，在第 8 關「+ 號加總」或第 10 關「國文單科」比序中微幅落後其他考生。`;
        }
      } else {
        canAdmit = false;
        reason = `【積點不足】會考總積點 ${stats.examPoints} 點低於該校最低錄取線 (${sch.minPoints}點)。`;
      }
    } else if (userTotalScore === sch.minScore) {
      if (stats.examPoints >= sch.safePoints) {
        canAdmit = true;
        reason = `【總積分達標錄取】總積分 ${userTotalScore} 分剛好壓線，積點足夠而錄取！`;
      } else {
        canAdmit = false;
        reason = `【總積分相同但積點未達】總積分平手，但在第七關「會考總積點」比序止步。`;
      }
    } else {
      canAdmit = false;
      reason = `【總積分門檻未達】你的總積分為 ${userTotalScore} 分，低於該校錄取底線 ${sch.minScore} 分。`;
    }

    evaluationLog.push({
      choiceOrder: c.choiceOrder,
      schoolName: sch.name,
      deptName: sch.dept,
      userTotalScore,
      userPoints: stats.examPoints,
      schoolSafePoints: sch.safePoints,
      schoolMinPoints: sch.minPoints,
      schoolQuota: sch.quota,
      simulatedApplicants: applicantsCount,
      admitted: canAdmit,
      reason
    });

    if (canAdmit && !admittedChoice) {
      admittedChoice = {
        choiceOrder: c.choiceOrder,
        school: sch,
        reason
      };
      break;
    }
  }

  return {
    studentStats: stats,
    rankInfo,
    admittedChoice,
    evaluationLog,
    allChoicesCount: choices.length
  };
}

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
    plusCount: aPlusCount + bPlusCount,
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

  // 關卡 1：總積分 (上限 100 分)
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

  // 關卡 8：教育會考各科等級標示加總（+ 號總加總比序）
  res = recordStep('step_total_plus', '第八關：各科等級標示「+」號加總', '最高 10 個 +', statsA.plusCount, statsB.plusCount, v => `${v} 個 +`, '各科等級標示之「+」號總數加總比序（A++=2, A+=1, B++=2, B+=1）');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

  // 補充：若總 + 號相同，細比 A 等級與 B 等級 + 號
  res = recordStep('step_a_plus', '第 8-1 關：A等級「+」號多寡', '最高 10 個 +', statsA.aPlusCount, statsB.aPlusCount, v => `${v} 個 +`, '比A等級標示+號數量（A++算2個+、A+算1個+）');
  if (res !== 'TIE') return finishComparison(steps, res, statsA, statsB);

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

// 8 個貼近一般中投區學生日常分數的「經典對決題目庫」
// 結構配置：名校 2 所、長億高中 1 所、普通高中及高職 5 所（一般學生成績中段常態）
const QUIZ_CHALLENGES = [
  // -------------------------------------------------------------
  // 【名校 1】臺中一中：5A 壓線 vs 4A1B 滿積點
  // -------------------------------------------------------------
  {
    id: 'quiz_1',
    round: 1,
    badge: '名校對決 1',
    title: '【第 1 戰】5A 壓線 vs 4A1B 破百積點，誰能稱霸中投？',
    targetSchool: { name: '臺中一中', department: '普通科', quota: 1 },
    question: '志遠考出「5A 0+」作文4級分；明軒考出「4A++ 1B++」作文6級分滿分（總積點破百點！）。當一中只剩最後 1 個缺額，誰會被電腦錄取？',
    studentA: {
      name: '陳志遠',
      avatar: '🥊',
      animeType: 'boy_hotblood',
      powerTitle: '5A 壓線奇蹟',
      quote: '「就算每一科都是剛好 5A，我的總積分一樣是滿分 97 分！」',
      corner: 'RED',
      grades: { chinese: 'A', math: 'A', english: 'A', social: 'A', science: 'A' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '林明軒',
      avatar: '⚡',
      animeType: 'boy_glasses',
      powerTitle: '四科雙加暴擊',
      quote: '「四科 A++ 總積點破百點，這場戰鬥我志在必得！」',
      corner: 'BLUE',
      grades: { chinese: 'A++', math: 'A++', english: 'A++', social: 'A++', science: 'B++' },
      writing: '6',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：很多人以為明軒總積點高達 102 點無敵，但請注意中投區第 1 關看的是「總積分（一般生滿分97分）」！',
    explanation: '【答案是陳志遠錄取！】志遠雖然每科都是剛好壓線的 A，但 5 科全精熟(5A)使「會考表現總積分」拿下滿分 30 分，總積分達一般生滿分 97 分！反觀明軒雖然 4 科 A++、寫作滿分總積點破百，但因自然科是 B++(得4分)，會考總積分只有 28 分，總積分為 95 分。在第一關「總積分」就被淘汰了！中投區保住 5A 永遠是第一優先！'
  },

  // -------------------------------------------------------------
  // 【名校 2】臺中女中：同為 5A 名校線，+ 號加總 vs 總積點
  // -------------------------------------------------------------
  {
    id: 'quiz_2',
    round: 2,
    badge: '名校對決 2',
    title: '【第 2 戰】同為 5A 頂尖名校線，先比 + 號還是先比積點？',
    targetSchool: { name: '臺中女中', department: '普通科', quota: 1 },
    question: '羽彤考出 5A 4+（4科A+、1科A，作文4級分，總積點 91 點）；若瑄也是 5A 4+（衝出雙A++、3科A，作文5級分，總積點 92 點）。兩人都是 4 個 + 號，誰能搶下臺中女中最後一個席次？',
    studentA: {
      name: '張羽彤',
      avatar: '🎀',
      animeType: 'girl_twintail',
      powerTitle: '四連加號疾風',
      quote: '「我有 4 個 A+！學科實力絕不認輸！」',
      corner: 'RED',
      grades: { chinese: 'A+', math: 'A+', english: 'A+', social: 'A+', science: 'A' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '李若瑄',
      avatar: '🌟',
      animeType: 'girl_longhair',
      powerTitle: '雙 A++ 超能',
      quote: '「先比第七關總積點！我的 92 點比妳高喔！」',
      corner: 'BLUE',
      grades: { chinese: 'A++', math: 'A++', english: 'A', social: 'A', science: 'A' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：算算兩人的「教育會考總積點(第七關)」！羽彤是 18*4+15+4 = 91點；若瑄是 21*2+15*3+5 = 92點！',
    explanation: '【答案是李若瑄錄取！】這題是最經典的觀念題！兩人雖然都是 4 個「+」號（羽彤是 4 個 A+，若瑄是 2 個 A++ 各算 2 個 +），但中投區在第一到六關平手後，先比的是「第七關：教育會考總積點（滿分111點）」！若瑄以 92 點勝過羽彤的 91 點，因此在第七關就由若瑄勝出錄取！根本不必比到第八關！'
  },

  // -------------------------------------------------------------
  // 【長億高中 1 所】社區公立高中代表：5B 密集區之多元學習慘痛教訓
  // -------------------------------------------------------------
  {
    id: 'quiz_3',
    round: 3,
    badge: '長億高中',
    title: '【第 3 戰】長億高中 5B 壓線戰：少記嘉獎差 0.5 分的慘痛代價！',
    targetSchool: { name: '長億高中', department: '普通科', quota: 1 },
    question: '家豪會考考出 5B 7+（總積點 55 點），但國中三年只有 2 支嘉獎（獎勵紀錄只得1分）；雅婷考出 5B 4+（總積點 48 點），但三年累積滿大功小功獎勵拿滿 4 分。爭奪長億高中最後名額，誰會勝出？',
    studentA: {
      name: '王家豪',
      avatar: '🥊',
      animeType: 'boy_cap',
      powerTitle: '5B7+ 會考猛將',
      quote: '「我會考衝出 55 點，難道長億上不了嗎！？」',
      corner: 'RED',
      grades: { chinese: 'B++', math: 'B++', english: 'B+', social: 'B+', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 1, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '陳雅婷',
      avatar: '🌟',
      animeType: 'girl_sporty',
      powerTitle: '多元大功滿分王',
      quote: '「平時熱心服務記滿大功，多元滿分 27 分直接勝出！」',
      corner: 'BLUE',
      grades: { chinese: 'B+', math: 'B+', english: 'B+', social: 'B+', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：算算兩人的「免試入學總積分（第一關）」！家豪總積分為 94 分，雅婷總積分為 97 分！',
    explanation: '【答案是陳雅婷錄取！】這是一般國中生最真實的血淚教訓！長億高中 114 年最低門檻約 5B7+。家豪會考雖然考得很好拿了 5B7+ (55點)，但因為國中平時不重視獎勵紀錄，多元學習只拿 24 分，導致總積分僅 94 分；反觀雅婷雖然會考只有 5B4+，但多元學習滿分(27分)，總積分達 97 分！在第一關總積分，雅婷就以 97 分直接勝出淘汰 94 分的家豪！'
  },

  // -------------------------------------------------------------
  // 【普通高中 1】臺中二中：一般中上學生 3A2B 級距，+ 號逆轉勝
  // -------------------------------------------------------------
  {
    id: 'quiz_4',
    round: 4,
    badge: '普通高中',
    title: '【第 4 戰】二中 3A2B 膠著戰：總積點完全相同，+ 號決勝負！',
    targetSchool: { name: '臺中二中', department: '普通科', quota: 1 },
    question: '小晴是 3A 2B (2個+) 總積點 67 點；子傑也是 3A 2B 總積點恰好也是 67 點。總積分皆 97 分完全平手，誰能錄取二中？',
    studentA: {
      name: '許小晴',
      avatar: '👧',
      animeType: 'girl_cute',
      powerTitle: '雙 A+ 破局者',
      quote: '「總積點平手時，我有 2 個 A+ 搶下勝利！」',
      corner: 'RED',
      grades: { chinese: 'A+', math: 'A+', english: 'A', social: 'B', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '周子傑',
      avatar: '🧑',
      animeType: 'boy_cool',
      powerTitle: '單 A+ 追平者',
      quote: '「我的總積點也是 67 點平手，勝負還很難說！」',
      corner: 'BLUE',
      grades: { chinese: 'A+', math: 'A', english: 'A', social: 'B+', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：第七關總積點兩人都為 67 點平手，接著進入第八關比什麼？',
    explanation: '【答案是許小晴錄取！】兩人總積分皆 97 分、會考表現總積分皆 26 分、會考總積點皆 67 點！此時正式啟動第八關「教育會考各科等級標示加總（+號總數比序）」：小晴國A+、數A+共 2 個 + 號；子傑國A+、社B+雖也有2個+，但細比 A 等級標示時小晴有 2 個 A+ 勝過子傑的 1 個 A+，小晴順利搶下二中席次！'
  },

  // -------------------------------------------------------------
  // 【普通高中 2】清水高中：1A4B 社區指標公立高中，1A vs 5B++
  // -------------------------------------------------------------
  {
    id: 'quiz_5',
    round: 5,
    badge: '普通高中',
    title: '【第 5 戰】清水高中 1A4B 保衛戰：1A 勝過 5B++ 嗎？',
    targetSchool: { name: '清水高中', department: '普通科', quota: 1 },
    question: '冠宇成績平平，只考出 1A 4B (國A 其他皆B，作文4)；欣怡五科全都是 B++ (作文5)，總積點高達 65 點！清水高中只剩最後 1 個缺額，誰會錄取？',
    studentA: {
      name: '張冠宇',
      avatar: '👦',
      animeType: 'boy_runner',
      powerTitle: '關鍵 1A 守護神',
      quote: '「就算只有 1 個 A，會考積分就多了整整 2 分！」',
      corner: 'RED',
      grades: { chinese: 'A', math: 'B', english: 'B', social: 'B', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '洪欣怡',
      avatar: '👧',
      animeType: 'girl_glasses',
      powerTitle: '全科 B++ 霸者',
      quote: '「我五科全 B++ 總積點 65 點，怎麼可能不行！？」',
      corner: 'BLUE',
      grades: { chinese: 'B++', math: 'B++', english: 'B++', social: 'B++', science: 'B++' },
      writing: '5',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：算算兩人的「教育會考表現積分」！A 得 6 分、B 得 4 分！',
    explanation: '【答案是張冠宇錄取！】這題是中投區家長最常掉入的陷阱！欣怡雖然 5 科全是 B++ 總積點高達 65 點，但因為沒有任何一科拿到 A（精熟），每科只能拿基礎 4 分，會考表現總積分只有 20 分（總積分 91 分）；而冠宇雖然只有 1 個最普通的 A（積點才 43 點），但這科 A 拿了 6 分，會考表現總積分為 22 分（總積分 93 分）！冠宇在第一關總積分直接錄取！'
  },

  // -------------------------------------------------------------
  // 【普通高中 3】大甲高中：5B 平手生死鬥，單科國文定天下
  // -------------------------------------------------------------
  {
    id: 'quiz_6',
    round: 6,
    badge: '普通高中',
    title: '【第 6 戰】大甲高中 5B 平手局：關鍵時刻誰是單科大魔王？',
    targetSchool: { name: '大甲高中', department: '普通科', quota: 1 },
    question: '俊銘與芷涵成績都是 5B 2+，作文都是 3 級分，總積分 91 分、總積點 45 點完全相同。俊銘是國文 B++ 數學 B；芷涵是國文 B 數學 B++。誰會錄取大甲高中？',
    studentA: {
      name: '李俊銘',
      avatar: '🏃',
      animeType: 'boy_hoodie',
      powerTitle: '國文 B++ 斬擊',
      quote: '「中投區第一主科就是國文！單科比序看我的！」',
      corner: 'RED',
      grades: { chinese: 'B++', math: 'B', english: 'B', social: 'B', science: 'B' },
      writing: '3',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '謝芷涵',
      avatar: '👧',
      animeType: 'girl_twintail',
      powerTitle: '數理 B++ 奇兵',
      quote: '「我的數學 B++ 難道派不上用場嗎！？」',
      corner: 'BLUE',
      grades: { chinese: 'B', math: 'B++', english: 'B', social: 'B', science: 'B' },
      writing: '3',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：一路平手比到第十關單科標示時，法定第一順位的科目是哪一科？',
    explanation: '【答案是李俊銘錄取！】兩人從總積分、志願序、多元表現、會考總分、總積點(45點)、+號總數(2個+)一路平手到第九關單科積分！進入第十關「單科成績標示比序」，法定嚴格順序是：國文 ➔ 數學 ➔ 英語 ➔ 社會 ➔ 自然。俊銘國文是 B++，直接勝過芷涵的國文 B，完全不需要比到數學科！這就是中投區「國文定生死」的由來！'
  },

  // -------------------------------------------------------------
  // 【公立高職 1】臺中高工：志願序群組規範與連續選填同校同科特權
  // -------------------------------------------------------------
  {
    id: 'quiz_7',
    round: 7,
    badge: '公立高職 1',
    title: '【第 7 戰】臺中高工志願序密技：連填同校不佔新志願序，逆轉高分跨校生！',
    targetSchool: { name: '臺中高工', department: '汽車科', quota: 1 },
    question: '依台中市教育局公文規範：中投區免試入學以「10個志願序為1群組積分」（第1~10志願序30分、第11~20志願序29分），且「連續選填同校不同科計為同一志願序」。阿哲成績普通 5B 6+（作文4），第1~9志願填他校，第10志願填臺中高工板金科，第11志願緊接著填臺中高工汽車科；佩君考出 5B 10+（5科全B++，積點高達64點），但前10志願皆填不同學校，第11志願才跨校填臺中高工汽車科。誰會錄取？',
    studentA: {
      name: '劉阿哲',
      avatar: '🔧',
      animeType: 'boy_mechanic',
      powerTitle: '連填同校戰術家',
      quote: '「高工同校連續填，第 11 志願仍屬第 10 志願序 30 分滿分！」',
      corner: 'RED',
      grades: { chinese: 'B++', math: 'B+', english: 'B+', social: 'B+', science: 'B+' },
      writing: '4',
      choiceInfo: { score: 30, rank: 10, schoolRank: 10, choiceIndex: 11 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '陳佩君',
      avatar: '👩‍🔧',
      animeType: 'girl_sporty',
      powerTitle: '5B 10+ 積點戰神',
      quote: '「我 5 科全 B++ 積點高達 64 點，難道會輸在志願序！？」',
      corner: 'BLUE',
      grades: { chinese: 'B++', math: 'B++', english: 'B++', social: 'B++', science: 'B++' },
      writing: '4',
      choiceInfo: { score: 29, rank: 11, schoolRank: 11, choiceIndex: 11 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB_note: '佩君前 10 志願皆填不同學校用滿第 1 群組，第 11 志願跨校填臺中高工，跨入第 11~20 志願序群組被扣 1 分(得29分)',
    hint: '💡 提示：算算兩人的「志願序積分」！依中投區公文規定：以「10個志願序為1群組」（第1~10志願序30分、第11~20志願序29分），且連續選填同校各科計為同一志願序！阿哲第 11 志願連填同校仍計為第 10 志願序(30分滿分)；佩君第 11 志願跨校落入第 11 志願序被扣 1 分(29分)！',
    explanation: '【答案是劉阿哲錄取！】這是中投區免試入學最精妙也最實用的高職選填技巧！\n1. 依據台中市教育局公文規定：中投區免試入學以「10個志願序為1群組積分」，第1~10個志願序得滿分30分，第11~20個志願序得29分，第21個志願序以後得28分，且「連續選填同校不同類科均計為同一個志願序」。\n2. 阿哲雖然成績只有 5B 6+，但他善用連填特權，第10志願（板金科）與第11志願（汽車科）皆為臺中高工，因此第11志願汽車科仍計為「第10志願序」，在第1群組內穩穩拿到滿分30分，總積分高達 87 分！\n3. 佩君成績雖然考出 5B 頂標 10+（5科全B++，積點高達64點），但她前面10個志願填了10所不同學校（用滿了第1~10志願序的30分），第11志願跨校填台中高工，落入「第11志願序（第2群組）」，志願序積分被扣1分剩 29 分，總積分降為 86 分！\n4. 結果在「第一關：免試入學總積分」，阿哲就以 87 分擊敗佩君的 86 分！佩君雖然積點比阿哲高出整整12點，但連第七關總積點都還沒比到，在第一關總積分就因為志願序被扣分而遺憾落榜！這正是中投區選填志願最重要的避坑大原則！'
  },

  // -------------------------------------------------------------
  // 【公立高職 2】臺中家商：一般中段成績，比到最後平手會抽籤嗎？
  // -------------------------------------------------------------
  {
    id: 'quiz_8',
    round: 8,
    badge: '公立高職 2',
    title: '【第 8 戰】臺中家商龍鳳雙胞胎平手戰：電腦分發最後會抽籤嗎？',
    targetSchool: { name: '臺中家商', department: '應用英語科', quota: 1 },
    question: '一對同校龍鳳雙胞胎姊弟佩珊與翔安，成績皆為中段 2A 3B 2+，作文皆為 4 級分，兩人同時將臺中家商應用英語科列為第 1 志願。但名額只剩最後 1 個，所有項目完全相同，誰會錄取？',
    studentA: {
      name: '林佩珊',
      avatar: '👩',
      animeType: 'girl_twins_a',
      powerTitle: '雙胞胎姊姊',
      quote: '「我和弟弟同分同點，我們誰都不會被淘汰！」',
      corner: 'RED',
      grades: { chinese: 'A', math: 'A', english: 'B+', social: 'B+', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    studentB: {
      name: '林翔安',
      avatar: '👦',
      animeType: 'boy_tech',
      powerTitle: '雙胞胎弟弟',
      quote: '「法規說了超額同分不抽籤，大家一起增額錄取！」',
      corner: 'BLUE',
      grades: { chinese: 'A', math: 'A', english: 'B+', social: 'B+', science: 'B' },
      writing: '4',
      choiceInfo: { score: 30, rank: 1, schoolRank: 1, choiceIndex: 1 },
      balancedLearning: 12, conduct: 5, noDemerit: 6, awardRecords: 4, disadvantaged: 0, nearby: 10
    },
    hint: '💡 提示：法規明文規定超額同分時「不予抽籤」！',
    explanation: '【答案是兩人全部錄取（增額錄取）！】中投區免試入學作業要點明文規定：電腦比序一路比到第 12 關若仍完全相同而超額，「不予抽籤，以增額錄取處理」！這是教育制度對一般認真努力學生的最高保障，絕不會因為運氣抽籤落榜！'
  }
];

// 中投區比序流程圖的 13 階結構（嚴格遵循官方 115/116 流程圖標準規範，含精簡醒目標題）
const FLOWCHART_TREE = [
  {
    id: 'total_score',
    stepNumber: '1',
    shortTitle: '總積分',
    title: '免試入學總積分',
    badge: '滿分 100 分',
    phase: '階段一：總積分門檻',
    icon: 'fa-scale-unbalanced-flip',
    color: 'from-blue-600 to-indigo-600',
    summary: '志願序(30) + 就近(10) + 弱勢(2) + 多元(27/30) + 會考(30)',
    detail: '第一道門檻，五大指標總和。若報名人數未超額則全額錄取；若超過核定名額且同分時，正式啟動後續超額比序！',
    officialQuote: '志願序積分 + 就近入學積分 + 扶助弱勢積分 + 多元學習表現積分 + 教育會考表現積分'
  },
  {
    id: 'choice_score',
    stepNumber: '2',
    shortTitle: '志願序',
    title: '志願序積分',
    badge: '滿分 30 分',
    phase: '階段二：各分項積分比序',
    icon: 'fa-list-ol',
    color: 'from-indigo-600 to-purple-600',
    summary: '第 1~10 志願 30 分、第 11~20 志願 29 分、第 21 志願以後 28 分',
    detail: '每 10 個志願序為同一群組，群組內皆為同一積分。特別重要：連續選填同校不同類科者，皆計為同一志願序（完全不扣分）！',
    officialQuote: '1.每10個志願序為同一群組，群組內皆為同一積分。2.連續選填同校不同科者皆計為同一志願序。'
  },
  {
    id: 'nearby',
    stepNumber: '3',
    shortTitle: '就近入學',
    title: '就近入學積分',
    badge: '滿分 10 分',
    phase: '階段二：各分項積分比序',
    icon: 'fa-location-dot',
    color: 'from-purple-600 to-pink-600',
    summary: '中投區學校畢業或共同就學區考生核給滿分 10 分',
    detail: '國中三年皆就讀偏遠地區學校者亦有保障。一般中投區國三生均拿滿 10 分。',
    officialQuote: '國中三年皆就讀偏遠地區學校者1分，偏遠地區學校係報主管機關核准有案者。'
  },
  {
    id: 'disadvantaged',
    stepNumber: '4',
    shortTitle: '扶助弱勢',
    title: '扶助弱勢積分',
    badge: '上限 2 分',
    phase: '階段二：各分項積分比序',
    icon: 'fa-hand-holding-heart',
    color: 'from-pink-600 to-rose-600',
    summary: '低收入戶 2 分、中低收入戶 1 分',
    detail: '低收入戶(2分)、中低收入戶(1分)須領有當年度鄉鎮市區公所低收或中低收證明文件。一般生為 0 分。',
    officialQuote: '低收入戶(2分)，中低收入戶(1分)係領有當年度免試入學當年度有效文件者。'
  },
  {
    id: 'multiple_learning',
    stepNumber: '5',
    shortTitle: '多元表現',
    title: '多元學習表現總積分',
    badge: '滿分 27/30 分',
    phase: '階段二：各分項積分比序',
    icon: 'fa-trophy',
    color: 'from-amber-500 to-orange-600',
    summary: '同分依序水平比：均衡(12) ➔ 德行(5) ➔ 無過(6) ➔ 獎勵(4)',
    detail: '絕大多數學生在國中三年引導下均拿滿多元分數。若總分平手，依法令水平展開比序：均衡學習 ➔ 德行表現 ➔ 無記過紀錄 ➔ 獎勵紀錄。',
    officialQuote: '均衡學習 ➔ 德行表現 ➔ 無記過紀錄 ➔ 獎勵紀錄',
    subFlow: [
      { name: '均衡學習', score: '滿分12分', desc: '四領域及格' },
      { name: '德行表現', score: '滿分5分', desc: '社團+服務' },
      { name: '無記過', score: '滿分6分', desc: '無懲處/已銷過' },
      { name: '獎勵紀錄', score: '滿分4分', desc: '大功/小功/嘉獎' }
    ]
  },
  {
    id: 'exam_score',
    stepNumber: '6',
    shortTitle: '會考總積分',
    title: '教育會考表現總積分',
    badge: '滿分 30 分',
    phase: '階段三：會考三大核心關卡',
    icon: 'fa-star',
    color: 'from-emerald-500 to-teal-600',
    summary: '5 科總積分（精熟6/基礎4/待加強2，滿分 30 分）',
    detail: '精熟(A)每科得 6 分、基礎(B)每科得 4 分、待加強(C)每科得 2 分（俗稱 5A=30分、4A1B=28分）。此處不採計寫作測驗！',
    officialQuote: '國文科積分 + 數學科積分 + 英語科積分 + 社會科積分 + 自然科積分'
  },
  {
    id: 'exam_points',
    stepNumber: '7',
    shortTitle: '會考總積點',
    title: '國中教育會考總積點',
    badge: '滿分 111 點',
    phase: '階段三：會考三大核心關卡',
    icon: 'fa-bolt',
    color: 'from-amber-500 to-yellow-600',
    summary: '5 科積點(105點) + 寫作測驗積點(6點)',
    detail: '公立高中最關鍵分水嶺！A++=21點、A+=18點、A=15點、B++=12點、B+=9點、B=6點、C=3點，寫作測驗1~6級分得1~6點。滿分 111 點！',
    officialQuote: '國中教育會考各科按等級標示分1~7級，點數為級數的3倍，寫作測驗分1~6點，最高為111點。'
  },
  {
    id: 'plus_accumulation',
    stepNumber: '8',
    shortTitle: '+ 號加總',
    title: '教育會考各科等級標示加總',
    badge: '全科 + 號總數',
    phase: '階段三：會考三大核心關卡',
    icon: 'fa-plus',
    color: 'from-red-500 to-rose-600',
    summary: '各科成績等級標示「+」號的加總比序（最高 10 個 + 號）',
    detail: 'A++ 算 2 個 +、A+ 算 1 個 +、B++ 算 2 個 +、B+ 算 1 個 +。總積點相同時，+ 號累積多的人直接勝出！',
    officialQuote: '國中教育會考各科成績之等級標示+號的加總比序。'
  },
  {
    id: 'subject_scores',
    stepNumber: '9',
    shortTitle: '單科積分比序',
    title: '會考各科單科積分比序',
    badge: '國➔數➔英➔社➔自',
    phase: '階段四：單科積分 (國數英社自)',
    icon: 'fa-cubes',
    color: 'from-cyan-500 to-blue-600',
    summary: '法定嚴格順序：國文 ➔ 數學 ➔ 英語 ➔ 社會 ➔ 自然',
    detail: '「精熟」者每科得 6 分、「基礎」者每科得 4 分、「待加強」者每科得 2 分。國文科排在第一位！',
    officialQuote: '會考國文科積分 ➔ 數學科積分 ➔ 英語科積分 ➔ 社會科積分 ➔ 自然科積分',
    subFlow: [
      { name: '1. 國文', desc: '精熟6/基礎4/待加強2' },
      { name: '2. 數學', desc: '精熟6/基礎4/待加強2' },
      { name: '3. 英語', desc: '精熟6/基礎4/待加強2' },
      { name: '4. 社會', desc: '精熟6/基礎4/待加強2' },
      { name: '5. 自然', desc: '精熟6/基礎4/待加強2' }
    ]
  },
  {
    id: 'subject_grades',
    stepNumber: '10',
    shortTitle: '單科標示比序',
    title: '會考各科單科成績標示比序',
    badge: 'A++ 到 C 單科PK',
    phase: '階段五：單科標示 (國數英社自)',
    icon: 'fa-feather-pointed',
    color: 'from-indigo-500 to-violet-600',
    summary: '法定順序比單科等級標示：A++ > A+ > A > B++ > B+ > B > C',
    detail: '依照：國文科標示 ➔ 數學科標示 ➔ 英語科標示 ➔ 社會科標示 ➔ 自然科標示。前項平手時才進入下一科！',
    officialQuote: '會考國文科成績標示 ➔ 數學科標示 ➔ 英語科標示 ➔ 社會科標示 ➔ 自然科標示',
    subFlow: [
      { name: '1. 國文標示', desc: 'A++ > A+ > ... > C' },
      { name: '2. 數學標示', desc: 'A++ > A+ > ... > C' },
      { name: '3. 英語標示', desc: 'A++ > A+ > ... > C' },
      { name: '4. 社會標示', desc: 'A++ > A+ > ... > C' },
      { name: '5. 自然標示', desc: 'A++ > A+ > ... > C' }
    ]
  },
  {
    id: 'school_rank',
    stepNumber: '11',
    shortTitle: '校序順次',
    title: '志願序之校序順次',
    badge: '排更前學校優先',
    phase: '階段六：志願排序與同分保障',
    icon: 'fa-school',
    color: 'from-violet-500 to-purple-600',
    summary: '比較該校在學生選填名單中是第幾所學校（序位小者優先）',
    detail: '例如：小明將該校排為第 1 所學校，小華排為第 2 所學校，則小明優先錄取！',
    officialQuote: '志願序之校序順次'
  },
  {
    id: 'choice_index',
    stepNumber: '12',
    shortTitle: '志願順次',
    title: '志願序之順次',
    badge: '科別項目序位',
    phase: '階段六：志願排序與同分保障',
    icon: 'fa-arrow-down-1-9',
    color: 'from-purple-500 to-pink-600',
    summary: '比較該志願科別在志願表中的項目順次（第 1 志願 > 第 2 志願）',
    detail: '例如：小明將該科填為第 1 個志願項目，小華填為第 3 個志願項目，則小明優先錄取！',
    officialQuote: '志願序之順次'
  },
  {
    id: 'quota_overflow',
    stepNumber: '13',
    shortTitle: '同分增額錄取',
    title: '同分增額錄取保障',
    badge: '中投區絕不抽籤',
    phase: '階段六：志願排序與同分保障',
    icon: 'fa-crown',
    color: 'from-pink-500 to-rose-600',
    summary: '比至第 12 項完全相同且超過招生名額時，全數【增額錄取】！',
    detail: '中投區免試入學作業要點明文規定：超額比序後仍相同者「不予抽籤，以增額錄取處理」！這是對考生努力的最大保障。',
    officialQuote: '超額比序後仍相同者，不予抽籤，以增額錄取處理。'
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
    HISTORICAL_CUTOFF_TABLE,
    TCIVS_114_CUTOFF_DATA,
    TCIVS_114_NOTES,
    SCHOOL_CAPACITIES_AND_CUTOFFS,
    POPULATION_CURVE,
    calculateChoiceScore,
    computeStudentStats,
    compareTwoStudents,
    estimateStudentRankIn30k,
    simulate30kAdmissions,
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
    HISTORICAL_CUTOFF_TABLE,
    TCIVS_114_CUTOFF_DATA,
    TCIVS_114_NOTES,
    SCHOOL_CAPACITIES_AND_CUTOFFS,
    POPULATION_CURVE,
    calculateChoiceScore,
    computeStudentStats,
    compareTwoStudents,
    estimateStudentRankIn30k,
    simulate30kAdmissions,
    QUIZ_CHALLENGES,
    FLOWCHART_TREE
  };
}
