const BAR_STYLES = [
  '▁▂▃▄▅▆▇█',
  '⣀⣄⣤⣦⣶⣷⣿',
  '⣀⣄⣆⣇⣧⣷⣿',
  '○◔◐◕⬤',
  '□◱◧▣■',
  '□◱▨▩■',
  '□◱▥▦■',
  '░▒▓█',
  '░█',
  '⬜⬛',
  '▱▰',
  '▭◼',
  '▯▮',
  '◯⬤',
  '⚪⚫',
];

function repeat(s, i) {
  var r = '';
  for (var j = 0; j < i; j++) r += s;
  return r;
}

function makeBar(perc, barStyle = BAR_STYLES[0]) {
  var p = perc;

  var d,
    full,
    m,
    middle,
    r,
    rest,
    x,
    minDelta = Number.POSITIVE_INFINITY,
    fullSymbol = barStyle[barStyle.length - 1],
    n = barStyle.length - 1;
  if (p == 100) return repeat(fullSymbol, 10);
  p = p / 100;

  for (var i = 6; i >= 1; i--) {
    x = p * i;
    full = Math.floor(x);
    rest = x - full;
    middle = Math.floor(rest * n);
    if (p != 0 && full == 0 && middle == 0) middle = 1;
    d = Math.abs(p - (full + middle / n) / i) * 100;
    if (d < minDelta) {
      minDelta = d;
      m = barStyle[middle];
      if (full == i) m = '';
      r = repeat(fullSymbol, full) + m + repeat(barStyle[0], i - full - 1);
    }

    return r;
  }
}

exports.BAR_STYLES = BAR_STYLES;
exports.makeBar = makeBar;
