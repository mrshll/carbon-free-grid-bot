const functions = require('firebase-functions');
const Twitter = require('twitter');

const config = require('./config.json');

const T = new Twitter({
  ...config.twitter,
  timeout_ms: 60 * 1000,
});

function sendTweet(tweet, options = {}) {
  // Post a tweet
  return T.post('statuses/update', {status: tweet, ...options});
}

async function sendTweetThread(tweets) {
  let prevTweetId = null;
  for (const tweet of tweets) {
    let options = {};
    if (prevTweetId) {
      options.in_reply_to_status_id = prevTweetId;
    }
    const response = await sendTweet(tweet, options);
    prevTweetId = response.id_str;
  }
}

exports.sendTweet = sendTweet;
exports.sendTweetThread = sendTweetThread;
