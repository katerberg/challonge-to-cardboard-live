const fs = require('fs');
const {
  transformResultsToHtml,
  getPlayers,
  getRound,
  getTournamentResults,
} = require('./src/challonge');

const [,, tournament] = process.argv;
if (!tournament) {
  console.log('Missing tournament parameter');
  process.exit(1);
}
getTournamentResults(tournament).then(results => {
  const html = transformResultsToHtml(results);
  const players = getPlayers(results);
  fs.writeFile(`${process.cwd()}/rd${getRound(results)}-standings.html`, html, (err) => {
    if (err) {
      throw err;
    }
  });
  fs.writeFile(`${process.cwd()}/players.csv`, players, (err) => {
    if (err) {
      throw err;
    }
  });
}).catch(() => {
  console.log('Tournament not found');
  process.exit(1);
});
