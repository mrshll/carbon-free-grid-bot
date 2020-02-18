const functions = require('firebase-functions');
const bent = require('bent');

const config = require('./config.json');

const sourceRe = /(?<=Net generation from )(.*)(?= for)/;

const EIA_HOURLY_GENERATION_SERIES_IDS_BY_SOURCE_CATEGORY_ID = 3390105;
const eiaApiKey = config.eia.key;

const getCategoryUrl = categoryId => {
  return `http://api.eia.gov/category/?api_key=${eiaApiKey}&category_id=${categoryId}`;
};

const getSeriesUrl = seriesId => {
  return `http://api.eia.gov/series/?api_key=${eiaApiKey}&series_id=${seriesId}`;
};

async function sumGenerationBySource(filterFn = _ => true) {
  getJSON = bent('json');
  const url = getCategoryUrl(EIA_HOURLY_GENERATION_SERIES_IDS_BY_SOURCE_CATEGORY_ID);
  const hourlyGenerationSeriesIdsBySource = await getJSON(url);
  const childSeries = hourlyGenerationSeriesIdsBySource.category.childseries;

  let generationSumBySource = {};
  for (const series of childSeries) {
    const seriesId = series['series_id'];
    const {name} = series;

    // don't use the UTC series
    if (!name.endsWith('local time')) {
      continue;
    }

    const source = sourceRe.exec(name)[0];

    let seriesUrl = getSeriesUrl(seriesId);
    const seriesData = await getJSON(seriesUrl);
    const {data} = seriesData.series[0];
    const yesterdaySum = data.filter(filterFn).reduce((sum, d) => sum + d[1], 0);

    generationSumBySource[source] = yesterdaySum;
  }

  return generationSumBySource;
}

exports.sumGenerationBySource = sumGenerationBySource;
