const fs = require('fs');
const creds = require('../creds/cardboardLive.json');
const axios = require('axios');

function uploadToCardboardLive(token, html, tournamentId, roundNumber) {
  const boundary = '-----------------------------206411090965099725487092284';
  const header = `Content-Disposition: form-data; name="file"; filename="rd${roundNumber}-standings.html"`;
  const contentType = 'Content-Type: text/html';
  const body = `${boundary}\n${header}\n${contentType}\n\n${html}\n${boundary}--\n`;
  const options = {
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${creds.bearer_token}`,
      'Content-Type': 'multipart/form-data; boundary=---------------------------206411090965099725487092284',
    },
  };

  return axios.post(`https://app.cardboard.live/api/api/v1/tournaments/${tournamentId}/import_standings`, body, options);
}

function isValidToken(token) {
  return new Date().valueOf() < token.date + token.expires_in
}

function login(username, password) {
  const options = {
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: 'undefined',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const body = `grant_type=&username=${encodeURIComponent(username)}&client_id=1&client_secret=secret&password=${password}&grant_type=password`;

  return axios.post('https://app.cardboard.live/api/oauth/v2/token', body, options).then(r => r.data).then(token => {
    fs.writeFile(`${process.cwd()}/creds/cardboardToken.json`, JSON.stringify({...token, date: new Date().valueOf()}), () => {});
    return token;
  });;
}

module.exports = {
  isValidToken,
  login,
  uploadToCardboardLive,
};
