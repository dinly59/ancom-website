const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const outFile = path.join(dataDir, 'index.json');

fs.readdir(dataDir, (err, files) => {
  if (err) {
    console.error('Failed to read data directory', err);
    process.exit(1);
  }
  const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json') && f !== 'index.json');
  fs.writeFile(outFile, JSON.stringify(jsonFiles, null, 2), (err) => {
    if (err) {
      console.error('Failed to write index.json', err);
      process.exit(1);
    }
    console.log('Wrote', outFile, 'with', jsonFiles.length, 'entries');
  });
});
