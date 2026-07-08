/**
 * L3 样品/试验项联合搜索过滤
 * @param {Array} samples 样品列表
 * @param {Function} getTestsForSample 取样品下试验项
 * @param {string} query 关键词
 * @returns {{ samples: Array, getTests: Function }}
 */
export function filterL3View(samples, getTestsForSample, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return { samples, getTests: getTestsForSample };
  }

  /** 样品名称/编号是否命中 */
  const matchSample = (sample) =>
    (sample.name && sample.name.toLowerCase().includes(keyword))
    || (sample.code && sample.code.toLowerCase().includes(keyword));

  /** 试验项名称是否命中 */
  const matchTest = (test) => test.name && test.name.toLowerCase().includes(keyword);

  const visibleSamples = samples.filter((sample) =>
    matchSample(sample) || getTestsForSample(sample).some(matchTest),
  );

  /** 按样品返回应展示的试验项：搜试验项时两侧过滤；仅搜样品时右侧保留该样品全部试验项 */
  function getTests(sample) {
    const baseTests = getTestsForSample(sample);
    const testsByName = baseTests.filter(matchTest);
    if (testsByName.length) return testsByName;
    if (matchSample(sample)) return baseTests;
    return baseTests.filter(matchTest);
  }

  return { samples: visibleSamples, getTests };
}
