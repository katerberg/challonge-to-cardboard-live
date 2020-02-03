const fs = require('fs');
const {
  transformResultsToHtml,
  getPlayers,
  getRound,
  getTournamentResults,
} = require('./src/challonge');
const {
  login,
  isValidToken,
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

console.debug('Checking for stored token');
fs.readFile('./creds/cardboardToken.json', 'utf8', async(err, data) => {
  let token;
  if (err || !isValidToken(JSON.parse(data))) {
    console.debug(`${err ? 'No token found' : 'Expired token found'}. Logging in again`);
    const result = await login(cardboardLiveCreds.username, cardboardLiveCreds.password);
    token = result.access_token;
  } else {
    console.debug('Token found. Proceeding.');
    token = JSON.parse(data).access_token;
  }

  console.debug(`Using token: ${token}`);

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
      uploadToCardboardLive(token, html, cardboardLiveCreds.tournament, round)
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
});
