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

function transformResultsToXml(json) {
  const teams = json.participants
    .map(p => p.participant)
    .map(p => ({_attr: { 
      Rank: p.seed,
      Name: p.name,
      DCI: Math.floor(Math.random() * 10000 + 1),
      MatchPoints: json.matches
        .map(m => m.match)
        .reduce((a, c) => (a + (c.winner_id === p.id ? 3 : 0)), 0),
    }}));
  teams.sort((a, b) => a._attr.Rank > b._attr.Rank ? 1 : -1);

  return convert('Standings', {Team: teams});
}

function transformResultsToHtml(json) {
}

function getPlayers(json) {
  return json.participants.map(p => p.participant)
    .reduce((a, c) => a + `"${c.name}",${Math.floor(Math.random() * 10000 + 1)}\n`, 'Name,DCI\n');
}

function translate() {
  getTournamentResults().then(r => {
    const xml = transformResultsToXml(r);
    const html = transformResultsToHtml(r);
    const players = getPlayers(r);
    fs.writeFile(`${process.cwd()}/standings.xml`, xml, (err) => {
      if (err) {
        throw err;
      }
    });
    fs.writeFile(`${process.cwd()}/standings.html`, html, (err) => {
      if (err) {
        throw err;
      }
    });
    fs.writeFile(`${process.cwd()}/players.csv`, players, (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

module.exports = {
  getTournamentResults,
  getPlayers,
  transformResultsToHtml,
  transformResultsToXml,
  translate,
}
