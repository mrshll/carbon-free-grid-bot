const functions = require('firebase-functions');
const moment = require('moment');

const {sumGenerationBySource} = require('./eia');
const {sendTweet} = require('./twitter');
const {makeBar, BAR_STYLES} = require('./renderBar');

const RENEWABLE_SOURCES = ['nuclear', 'solar', 'hydro', 'wind'];
const EMOJI_BY_SOURCE = {
  coal: '🏭',
  'natural gas': '💨',
  nuclear: '⚛️',
  petroleum: '🛢️',
  other: '❓',
  solar: '☀️',
  hydro: '💧',
  wind: '🌬️',
};

async function makeTweet() {
  const yesterdayDate = moment()
    .subtract(1, 'days')
    .format('YYYYMMDD');

  let tweetText = `${moment(yesterdayDate).format('MMM D')} generation\n\n`;

  const yesterdaySumBySource = await sumGenerationBySource(d => d[0].startsWith(yesterdayDate));
  const renewableTotal = RENEWABLE_SOURCES.reduce(
    (sum, source) => sum + yesterdaySumBySource[source],
    0
  );
  const total = Object.values(yesterdaySumBySource).reduce((a, b) => a + b);

  const totalPercent = (renewableTotal / total) * 100;
  const totalBar = makeBar(totalPercent);
  tweetText += `📊 ${totalBar} ${totalPercent.toFixed(0)}% carbon-free`;

  const sortedSources = Object.keys(yesterdaySumBySource)
    .sort((sourceA, sourceB) => yesterdaySumBySource[sourceA] - yesterdaySumBySource[sourceB])
    .reverse();

  sortedSources.forEach(source => {
    const sourcePercent = (yesterdaySumBySource[source] / total) * 100;
    const bar = makeBar(sourcePercent, BAR_STYLES[1]);
    tweetText += `\n${EMOJI_BY_SOURCE[source]} ${bar} ${sourcePercent.toFixed(0)}% ${source}`;
  });

  return tweetText;
}

async function main() {
  const tweetText = await makeTweet();
  sendTweet(tweetText);
}

async function test() {
  const tweetText = await makeTweet();
  console.log(tweetText);
}

exports.scheduledFunction = functions.pubsub
  .schedule('30 9 * * *')
  .timeZone('America/New_York')
  .onRun(context => {
    return main();
  });

// main();
test();
