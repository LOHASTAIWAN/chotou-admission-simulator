/**
 * 116 學年度中投區免試入學 8 戰演算法與法規單元測試 (Unit Test Suite)
 * 驗證 8 戰經典比序、第 11 關校序順次、第 12 關志願順次、第 13 關增額錄取及中投區各項法規
 */

const { runAlgorithmUnitTests } = require('./rules_data.js');

console.log('========================================================================');
console.log('🧪 116 學年度中投區高級中等學校免試入學 - 8 戰演算法與法規單元測試');
console.log('========================================================================\n');

const testSuite = runAlgorithmUnitTests();

let allPassed = true;

testSuite.results.forEach((test, idx) => {
  const icon = test.passed ? '✅ PASS' : '❌ FAIL';
  if (!test.passed) allPassed = false;
  console.log(`[${test.id}] ${icon} | ${test.title}`);
  console.log(`      分類: [${test.category}] | 法規依據: ${test.lawRef}`);
  console.log(`      說明: ${test.detail}\n`);
});

console.log('------------------------------------------------------------------------');
console.log(`總測試項目: ${testSuite.total} 項 | 通過: ${testSuite.passedCount} 項 | 失敗: ${testSuite.total - testSuite.passedCount} 項`);
console.log(`測試狀態: ${allPassed ? '🎉 全部 100% 通過！符合中投區簡章與教育局公文規範！' : '⚠️ 有項目未通過，請檢查邏輯！'}`);
console.log('========================================================================');

if (!allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
