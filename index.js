const fs = require('fs');
const util = require('util');
const data2xml = require('data2xml');

const convert = data2xml({xmlDecl: false});

fs.readFileAsync = util.promisify(fs.readFile);


function getTournamentResults() {
  return fs.readFileAsync(`${process.cwd()}/sample-input.json`, 'utf-8').then((unparsedResults) => {
    const results = JSON.parse(unparsedResults);
    return results.tournament;
  });
}

function transformResults(json) {
  const teams = json.participants
    .map(p => p.participant)
    .map(p => ({_attr: { 
      Rank: p.seed,
      Name: p.name,
    }}));

  return convert('Standings', {Team: teams});
}

module.exports = {
  getTournamentResults,
  transformResults,
}
