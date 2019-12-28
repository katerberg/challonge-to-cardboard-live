const fs = require('fs');
const {
  transformResultsToHtml,
  transformResultsToXml,
  getPlayers,
  getTournamentResults,
} = require('./src/challonge');

const tournament = process.argv[2];
if (!tournament) {
  console.log('Missing tournament parameter');
  process.exit(1);
}
getTournamentResults(tournament).then(results => {
  const xml = transformResultsToXml(results);
  const html = transformResultsToHtml(results);
  const players = getPlayers(results);
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
}).catch(e => {
  console.log('Tournament not found');
  process.exit(1);
});
