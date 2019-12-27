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

function getGamePointDifferential(matches, playerId) {
  return matches
    .map(m => m.match)
    .reduce((a, c) => {
      let points = 0;
      if (c.winner_id === playerId) {
        points += 2;
        points -= c.scores_csv.match(/1/) ? 1 : 0;
      }
      if (c.loser_id === playerId) {
        points -= 2;
        points += c.scores_csv.match(/1/) ? 1 : 0;
      }
      return (a + points);
    }, 0);
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
      td: ['nada', commaSeparateName(p.name), getMatchPoints(json.matches, p.id), '0.5'],
      gamePointDifferential: getGamePointDifferential(json.matches, p.id),
    }));

  playersWithMatchPoints.sort((a,b) => {
    if (a.td[2] >= b.td[2]) {
      return a.gamePointDifferential > b.gamePointDifferential ? -1 : 1;
    } else {
      return 1;
    }
  });
  const players = playersWithMatchPoints.map(p=> p.td)
    .map((p, i) => ({
      td: [i + 1, p[1], p[2], p[3]]
    }));

  const converted = convert('a', {
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
  }
  );
  return converted.slice(3, converted.length - 4);
}

function getPlayers(json) {
  return json.participants.map(p => p.participant)
    .reduce((a, c) => a + `"${commaSeparateName(c.name)}",${Math.floor(Math.random() * 10000 + 1)}\n`, 'Name,DCI\n');
}

function commaSeparateName(name) {
  const lastSpacePosition = name.lastIndexOf(' ');
  if (lastSpacePosition === -1) {
    return name;
  }
  const lastName = name.slice(lastSpacePosition + 1, name.length);
  const firstName = name.slice(0, lastSpacePosition);
  return `${lastName}, ${firstName}`;
}

function translate() {
  getTournamentResults().then(r => {
    const xml = transformResultsToXml(r);
    const html = transformResultsToHtml(r);
    const players = getPlayers(r);
    fs.writeFile(`${process.cwd()}/rd8-standings.html`, html, (err) => {
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
