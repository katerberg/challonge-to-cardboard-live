const fs = require('fs');
const util = require('util');
const data2xml = require('data2xml');


fs.readFileAsync = util.promisify(fs.readFile);


function getTournamentResults() {
  return fs.readFileAsync(`${process.cwd()}/sample-input.json`, 'utf-8').then((unparsedResults) => {
    const results = JSON.parse(unparsedResults);
    return results.tournament;
  });
}

function getMatchPoints(matches, playerId) {
  return matches
    .map(m => m.match)
    .reduce((a, c) => (a + (c.winner_id === playerId ? 3 : 0)), 0);
}

function transformResultsToXml(json) {
  const convert = data2xml();
  const teams = json.participants
    .map(p => p.participant)
    .map(p => ({_attr: { 
      Rank: p.seed,
      Name: p.name,
      DCI: Math.floor(Math.random() * 10000 + 1),
      MatchPoints: getMatchPoints(json.matches, p.id),
    }}));

  teams.sort((a, b) => a._attr.Rank > b._attr.Rank ? 1 : -1);

  return convert('Standings', {Team: teams});
}

function transformResultsToHtml(json) {
  const convert = data2xml({xmlDecl: false});
  const playersWithMatchPoints  = json.participants
    .map(p => p.participant)
    .map(p => ({
      td: ['nada', p.name, getMatchPoints(json.matches, p.id), null]
    }));

  playersWithMatchPoints.sort((a,b) => a.td[2] > b.td[2] ? -1 : 1);
  const players = playersWithMatchPoints.map(p=> p.td)
    .map((p, i) => ({
      td: [i + 1, p[1], p[2], 'nada']
    }));

  return convert('html', {body: {
    table: {
      _attr: {
        shade: '1',
        shadecolor: '#ffffcc',
        w: '500',
      },
      tbody: {
        tr: [{th: [
          {b: 'Rank'},
          {b: 'Player'},
          {b: 'Points'},
          {b: 'OMW%'},
        ]}].concat(players),
      }
    },
  }});
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
