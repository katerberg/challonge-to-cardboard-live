const creds = require('../creds/cardboardLive.json');
const axios = require('axios');

function uploadToCardboardLive(html, tournamentId, roundNumber) {
  const boundry = '-----------------------------206411090965099725487092284';
  const header = `Content-Disposition: form-data; name="file"; filename="rd${roundNumber}-standings.html"`;
  const contentType = 'Content-Type: text/html';
  const body = `${boundry}\n${header}\n${contentType}\n\n${html}\n${boundry}--\n`;
  const options = {
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${creds.bearer_token}`,
      'Content-Type': 'multipart/form-data; boundary=---------------------------206411090965099725487092284',
    },
  };

  return axios.post(`https://app.cardboard.live/api/api/v1/tournaments/${tournamentId}/import_standings`, body, options);
}

module.exports = {
  uploadToCardboardLive,
};
