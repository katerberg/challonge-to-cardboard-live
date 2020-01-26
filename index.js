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
const cardboardLiveCreds = require('./creds/cardboardLive');
const challongeCreds = require('./creds/challonge');

if (!challongeCreds.tournament) {
  console.error('Missing challonge tournament parameter');
  process.exit(1);
}
if (!cardboardLiveCreds.tournament) {
  console.error('Missing cardboardLive tournament parameter');
  process.exit(1);
}

console.debug(`Getting ${challongeCreds.tournament} tournament results`);
getTournamentResults(challongeCreds.tournament).then(results => {
  const html = transformResultsToHtml(results);
  const players = getPlayers(results);
  const round = getRound(results);
  fs.writeFile(`${process.cwd()}/rd${getRound(results)}-standings.html`, html, (err) => {
    if (err) {
      throw err;
    }
    console.debug(`Uploading results to ${cardboardLiveCreds.tournament}`);
    uploadToCardboardLive(html, cardboardLiveCreds.tournament, round)
      .then(() => console.debug('successful upload'))
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
