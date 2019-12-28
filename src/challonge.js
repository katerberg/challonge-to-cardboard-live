const creds = require('../creds/challonge.json');
const data2xml = require('data2xml');
const axios = require('axios');

function getTournamentResults(tournament) {
  const url = `https://${creds.user}:${creds.api_key}@api.challonge.com/v1/tournaments/${tournament}.json?include_matches=1&include_participants=1`;
  return axios.get(url).then(r => {
    return r.data.tournament;
  });
}

function getRound(json) {
  return json.matches.map(m => m.match.round)
    .reduce((a, c) => c > a ? c : a, 0);
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

module.exports = {
  getRound,
  getTournamentResults,
  getPlayers,
  transformResultsToHtml,
  transformResultsToXml,
}
