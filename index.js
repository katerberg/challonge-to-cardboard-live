const fs = require('fs');
const util = require('util');
const data2xml = require('data2xml');

const convert = data2xml();

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
      MatchPoints: json.matches
        .map(m => m.match)
        .reduce((a, c) => (a + (c.winner_id === p.id ? 3 : 0)), 0),
    }}));
  teams.sort((a, b) => a._attr.Rank > b._attr.Rank ? 1 : -1);

  return convert('Standings', {Team: teams});
}

function translate() {
  getTournamentResults().then(r => {
    const xml = transformResults(r);
    fs.writeFile(`${process.cwd()}/standings.xml`, xml, (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

module.exports = {
  getTournamentResults,
  transformResults,
  translate,
}
