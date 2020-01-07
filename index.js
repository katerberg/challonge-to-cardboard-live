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
    uploadToCardboardLive(html, 'b0aca69d-2989-11ea-b3fc-12f15ef2af51')
      .then(() => console.log('successful upload'))
      .catch(e => console.error(e));
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
