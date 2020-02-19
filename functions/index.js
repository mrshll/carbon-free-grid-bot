const functions = require('firebase-functions');
const moment = require('moment');

const {sumGenerationBySource, US_CATEGORY_ID, REGIONAL_NAMES_AND_CATEGORY_IDS} = require('./eia');
const {sendTweetThread} = require('./twitter');
const {makeBar, BAR_STYLES} = require('./renderBar');

const LOW_CARBON_SOURCES = ['nuclear', 'solar', 'hydro', 'wind'];
const EMOJI_BY_SOURCE = {
  coal: '⚫',
  'natural gas': '🔥',
  nuclear: '⚛️',
  petroleum: '🛢️',
  other: '❓',
  solar: '☀️',
  hydro: '💧',
  wind: '🌬️',
};
const PRECISION = 1;

function getYesterdayDate() {
  return moment()
    .subtract(1, 'days')
    .format('YYYYMMDD');
}

async function getData(categoryId) {
  const yesterdayDate = getYesterdayDate();

  const yesterdaySumBySource = await sumGenerationBySource(categoryId, d =>
    d[0].startsWith(yesterdayDate)
  );
  const lowCarbonTotal = LOW_CARBON_SOURCES.reduce(
    (sum, source) => sum + (yesterdaySumBySource[source] || 0),
    0
  );
  const total = Object.values(yesterdaySumBySource).reduce((a, b) => a + b);

  return {yesterdaySumBySource, lowCarbonTotal, total};
}

async function makeNationalTweets() {
  const {yesterdaySumBySource, lowCarbonTotal, total} = await getData(US_CATEGORY_ID);

  const lowCarbonPercent = (lowCarbonTotal / total) * 100;
  const lowCarbonBar = makeBar(lowCarbonPercent);
  const highCarbonPercent = 100 - lowCarbonPercent;
  const highCarbonBar = makeBar(100 - lowCarbonPercent);

  let totalTweetText = `Energy generation yesterday (${moment(getYesterdayDate()).format(
    'MMM D'
  )}) was\n`;
  totalTweetText += `🏭 ${highCarbonBar} ${highCarbonPercent.toFixed(PRECISION)}% high-carbon\n`;
  totalTweetText += `🌱 ${lowCarbonBar} ${lowCarbonPercent.toFixed(PRECISION)}% low-carbon`;

  let sourceBreakdownTweetText = `Generation breakdown by source:`;
  const sortedSources = Object.keys(yesterdaySumBySource)
    .sort((sourceA, sourceB) => yesterdaySumBySource[sourceA] - yesterdaySumBySource[sourceB])
    .reverse();

  sortedSources.forEach(source => {
    const sourcePercent = (yesterdaySumBySource[source] / total) * 100;
    const bar = makeBar(sourcePercent, BAR_STYLES[1]);
    sourceBreakdownTweetText += `\n${EMOJI_BY_SOURCE[source]} ${bar} ${sourcePercent.toFixed(
      PRECISION
    )}% ${source}`;
  });

  return [totalTweetText, sourceBreakdownTweetText];
}

async function makeRegionalTweets() {
  let lowCarbonPercentByRegionName = {};
  for (const region of REGIONAL_NAMES_AND_CATEGORY_IDS) {
    const {lowCarbonTotal, total} = await getData(region[1]);
    lowCarbonPercentByRegionName[region[0]] = (lowCarbonTotal / total) * 100;
  }

  const sortedRegionNames = Object.keys(lowCarbonPercentByRegionName)
    .sort(
      (regionNameA, regionNameB) =>
        lowCarbonPercentByRegionName[regionNameA] - lowCarbonPercentByRegionName[regionNameB]
    )
    .reverse();

  const regionalLeaderboardTweet = sortedRegionNames.reduce(
    (tweet, regionName) =>
      `${tweet}\n${makeBar(lowCarbonPercentByRegionName[regionName], BAR_STYLES[1])} ${regionName}`,
    `Regional breakdown (by % generation that is low-carbon)`
  );

  return [regionalLeaderboardTweet];
}

async function main() {
  const nationalTweets = await makeNationalTweets();
  const regionalTweets = await makeRegionalTweets();

  const tweets = [...nationalTweets, ...regionalTweets];

  await sendTweetThread(tweets);
}

async function test() {
  const nationalTweets = await makeNationalTweets();
  const regionalTweets = await makeRegionalTweets();

  const tweets = [...nationalTweets, ...regionalTweets];
  for (const tweet of tweets) {
    console.log(tweet);
  }
}

exports.scheduledFunction = functions.pubsub
  .schedule('30 9 * * *')
  .timeZone('America/New_York')
  .onRun(context => {
    return main();
  });

// main();
test();
