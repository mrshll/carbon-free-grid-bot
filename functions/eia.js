const bent = require('bent');
const moment = require('moment');

const config = require('./config.json');

const sourceRe = /(?<=Net generation from )(.*)(?= for)/;

const US_CATEGORY_ID = 3390105;

const REGIONAL_NAMES_AND_CATEGORY_IDS = [
  ['CAL', 3390106],
  ['CAR', 3390107],
  ['CENT', 3390108],
  ['FLA', 3390109],
  ['MIDA', 3390110],
  ['MIDW', 3390111],
  ['NE', 3390112],
  ['NY', 3390113],
  ['NW', 3390114],
  ['SE', 3390115],
  ['SW', 3390116],
  ['TEN', 3390117],
  ['TEX', 3390118],
];

const eiaApiKey = config.eia.key;

const getCategoryUrl = categoryId => {
  return `http://api.eia.gov/category/?api_key=${eiaApiKey}&category_id=${categoryId}`;
};

const getSeriesUrl = seriesId => {
  return `http://api.eia.gov/series/?api_key=${eiaApiKey}&series_id=${seriesId}`;
};

const addQueryParamsForDate = (url, date) => {
  const dateString = moment(date).format('YYYYMMDD');
  return `${url}&start=${dateString}T00-00&end=${dateString}T23-59`;
};

async function sumGenerationBySource(categoryId, date) {
  getJSON = bent('json');
  const url = getCategoryUrl(categoryId);
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
    if (date) {
      seriesUrl = addQueryParamsForDate(seriesUrl, date);
      console.log(seriesUrl);
    }
    const seriesData = await getJSON(seriesUrl);
    const {data} = seriesData.series[0];
    const yesterdaySum = data.reduce((sum, d) => sum + d[1], 0);

    console.log(source, yesterdaySum, data);

    generationSumBySource[source] = yesterdaySum;
  }

  return generationSumBySource;
}

exports.US_CATEGORY_ID = US_CATEGORY_ID;
exports.REGIONAL_NAMES_AND_CATEGORY_IDS = REGIONAL_NAMES_AND_CATEGORY_IDS;
exports.sumGenerationBySource = sumGenerationBySource;
