const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const url = require('url');

/**
 *
 * Used in in-memory db.
 * add custom scripts and logic here.
 *
 * @param db {Db}
 */
module.exports = async (db) => {

  await loadProjectIndexes(db._testUri, db._mongoBin);

  let coll = await db.collection('testCollection');
  // some custom test logic
  coll.createIndex({someParam:1});

  // TODO: customs inserts, updates, etc
}

async function loadProjectIndexes(mongouri, mongoBin) {
  if (!mongouri) {
    console.warn('No mongo memory uri');
    return;
  }
  if ((parseInt(url.parse(mongouri).port) || 9200) === 9200) {
    // may be test using db.. abort
    console.warn(`MongoDB port: ${mongouri}, skip db indexes`);
    return;
  }

  const directoryPath = path.join(__dirname, '..', '..', '..', 'scripts', 'database');
  let files = await fs.readdir(directoryPath);
  for (const file of files.filter(file => path.extname(file) === '.js')) {
    await execAsPromise(`${path.join(path.dirname(mongoBin), 'mongo')} ${mongouri} ${path.join(directoryPath, file)}`);
  }
}
function execAsPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      } else if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(new Error(stderr));
      } else {
        resolve(stdout);
      }
    });
  });
}
