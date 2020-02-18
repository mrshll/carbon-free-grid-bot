const functions = require('firebase-functions');
const Twitter = require('twitter');

const config = require('./config.json');

const T = new Twitter({
  ...config.twitter,
  timeout_ms: 60 * 1000,
});

function sendTweet(tweetText) {
  // Post a tweet
  T.post('statuses/update', {status: tweetText}, (err, data) => {
    console.log(err, data);
  });
}

exports.sendTweet = sendTweet;
