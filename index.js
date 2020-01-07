const fs = require('fs');
const {
  transformResultsToHtml,
  getPlayers,
  getRound,
  getTournamentResults,
} = require('./src/challonge');
const {
  uploadToCardboardLive,
} = require('./src/cardboardLive');
const creds = require('./creds/cardboardLive');

const [,, tournament] = process.argv;
if (!tournament) {
  console.error('Missing tournament parameter');
  process.exit(1);
}

getTournamentResults(tournament).then(results => {
  const html = transformResultsToHtml(results);
  const players = getPlayers(results);
  const round = getRound(results);
  fs.writeFile(`${process.cwd()}/rd${getRound(results)}-standings.html`, html, (err) => {
    if (err) {
      throw err;
    }
    uploadToCardboardLive(html, creds.tournament, round)
      .then(() => console.log('successful upload'))
      .catch(e => console.error(e));
  });
  fs.writeFile(`${process.cwd()}/players.csv`, players, (err) => {
    if (err) {
      throw err;
    }
  });
}).catch(() => {
  console.error('Tournament not found');
  process.exit(1);
});
