const https = require('https');
https.get('https://code.highcharts.com/highcharts.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('colorMode')) console.log("Has colorMode");
    if (data.includes('prefers-color-scheme')) console.log("Has prefers-color-scheme");
  });
});
