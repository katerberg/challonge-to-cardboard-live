const {expect} = require('chai');
const {
  isValidToken,
  uploadToCardboardLive,
} = require('./cardboardLive');
const sinon = require('sinon');
const axios = require('axios');

function getRandomNumber() {
  return Math.floor(Math.random() * 1000 + 1);
}

describe('cardboardLive', () => {
  describe('uploadToCardboardLive(token, html, tournamentId, roundNumber)', () => {
    beforeEach(() => {
      sinon.stub(axios, 'post');
    });

    afterEach(() => {
      axios.post.restore();
    });

    it('posts to correct url', async() => {
      const html = `${getRandomNumber()}`;
      const tournamentId = `${getRandomNumber()}`;

      uploadToCardboardLive({}, html, tournamentId);

      expect(axios.post).to.have.been.called;
      const call = axios.post.getCall(0);
      expect(call.args[0]).to.equal(`https://app.cardboard.live/api/api/v1/tournaments/${tournamentId}/import_standings`);
    });

    it('passes body with valid header and html', async() => {
      const html = `${getRandomNumber()}`;
      const tournamentId = `${getRandomNumber()}`;

      uploadToCardboardLive({}, html, tournamentId, '2');

      expect(axios.post).to.have.been.called;
      const [, postBody] = axios.post.getCall(0).args;
      expect(postBody.startsWith('----')).to.be.true;
      expect(postBody).to.contain('Content-Disposition: form-data;');
      expect(postBody).to.contain('name="file";');
      expect(postBody).to.contain('filename="rd2-standings.html"');
      expect(postBody).to.contain('Content-Type: text/html');
      expect(postBody).to.contain(html);
    });

    it('passes creds via headers', async() => {
      const html = `${getRandomNumber()}`;
      const tournamentId = `${getRandomNumber()}`;

      uploadToCardboardLive({}, html, tournamentId);

      expect(axios.post).to.have.been.called;
      const [, , creds] = axios.post.getCall(0).args;
      expect(creds.headers.Accept).to.contain('application/json');
      expect(creds.headers.Authorization.startsWith('Bearer')).to.be.true;
      expect(creds.headers['Content-Type']).to.contain('boundary');
      expect(creds.headers['Content-Type']).to.contain('multipart/form-data');
    });
  });

  describe('isValidToken(token)', () => {
    it('is true for non-expired token', () => {
      const currentTime = new Date().valueOf();
      const input = {
        date: currentTime - 500,
        expires_in: 1000, //eslint-disable-line camelcase
      };

      const result = isValidToken(input);

      expect(result).to.be.true;
    });

    it('is false for expired token', () => {
      const currentTime = new Date().valueOf();
      const input = {
        date: currentTime - 1500,
        expires_in: 1000, //eslint-disable-line camelcase
      };

      const result = isValidToken(input);

      expect(result).to.be.false;
    });
  });
});

