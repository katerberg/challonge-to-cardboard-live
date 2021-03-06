const fs = require('fs');
const util = require('util');
const {expect} = require('chai');
const {
  getRound,
  getPlayers,
  getTournamentResults,
  transformResultsToHtml,
  transformResultsToXml,
} = require('./challonge');
const sinon = require('sinon');
const axios = require('axios');

fs.readFileAsync = util.promisify(fs.readFile);

function getRandomNumber() {
  return Math.floor(Math.random() * 1000 + 1);
}

function getParticipant(name) {
  return {participant: {id: getRandomNumber(), name: name || `${getRandomNumber()}`, seed: getRandomNumber()}};
}

function getMatch(playerId = getRandomNumber(), isWon = false, gamesGivenUp = 0, round = getRandomNumber()) {
  const isPlayerOne = Math.random() > 0.5;
  let csv = '2-';
  if (gamesGivenUp) {
    csv += '1';
  } else {
    csv += '0';
  }
  if (isPlayerOne && !isWon || !isPlayerOne && isWon) {
    csv = csv.split('').reverse().join('');
  }


  return {
    match: {
      id: getRandomNumber(),
      player1_id: isPlayerOne ? playerId : getRandomNumber(), //eslint-disable-line camelcase
      player2_id: isPlayerOne ? getRandomNumber() : playerId, //eslint-disable-line camelcase
      winner_id: isWon ? playerId : getRandomNumber(), //eslint-disable-line camelcase
      loser_id: isWon ? getRandomNumber() : playerId, //eslint-disable-line camelcase
      scores_csv: csv, //eslint-disable-line camelcase
      round: round || getRandomNumber(),
    },
  };
}

function getSampleResults() {
  return fs.readFileAsync(`${process.cwd()}/sample-input.json`, 'utf-8').then((unparsedResults) => {
    const results = JSON.parse(unparsedResults);
    return results.tournament;
  });
}

describe('challonge', () => {
  describe('getTournamentResults()', () => {
    beforeEach(() => {
      sinon.stub(axios, 'get');
    });

    afterEach(() => {
      axios.get.restore();
    });

    it('gives valid json', async() => {
      const expected = Math.random();
      axios.get.returns(Promise.resolve({data: {tournament: expected}}));

      const results = await getTournamentResults();

      expect(results).to.equal(expected);
    });
  });

  describe('transformResultsToXml(challongeExport)', () => {
    it('is a list of standings', async() => {
      const input = await getSampleResults();

      const results = transformResultsToXml(input);

      expect(results).to.contain('<Standings>');
    });

    it('contains teams for each entrant', async() => {
      const input = await getSampleResults();

      const results = transformResultsToXml(input);

      expect((results.match(/<Team /g) || []).length).to.equal(8);
    });

    it('contains base info', async() => {
      const p = getParticipant();

      const results = transformResultsToXml({participants: [p], matches: []});

      expect(results).to.contain(`<Team Rank="${p.participant.seed}" Name="${p.participant.name}"`);
    });

    it('calculates match points based on existing matches', async() => {
      const p = getParticipant();

      const results = transformResultsToXml({
        participants: [p],
        matches: [
          getMatch(p.participant.id, true),
          getMatch(p.participant.id, false),
          getMatch(p.participant.id, true),
        ],
      });

      expect(results).to.contain(' MatchPoints="6"');
    });
  });

  describe('transformResultsToXml(challongeExport)', () => {
    it('is a list of standings', async() => {
      const input = await getSampleResults();

      const results = transformResultsToHtml(input);

      expect(results.startsWith('<table shade="1" shadecolor="#ffffcc" w="500">')).to.be.true;
      expect(results.endsWith('</table>')).to.be.true;
      expect(results).to.contain('<tbody>');
    });

    it('reverses first and last names', async() => {
      const input = await getSampleResults();

      const results = transformResultsToHtml(input);

      expect((results.match(/<tr>/g) || []).length).to.equal(9);
    });

    it('contains row for each entrant plus a header', async() => {
      const p1 = getParticipant();
      const p2 = getParticipant();
      p1.participant.name = 'Elaine Cao';
      p2.participant.name = 'John Ryan Hamilton';
      const input = {
        participants: [p1, p2],
        matches: [
          getMatch(p1.participant.id, true),
        ],
      };

      const results = transformResultsToHtml(input);

      expect(results).to.contain('<td>Cao, Elaine</td>');
      expect(results).to.contain('<td>Hamilton, John Ryan</td>');
    });

    it('sorts participants by their match wins', () => {
      const p1 = getParticipant();
      const p2 = getParticipant();

      const results = transformResultsToHtml({
        participants: [p1, p2],
        matches: [
          getMatch(p1.participant.id, true),
          getMatch(p2.participant.id, false),
          getMatch(p1.participant.id, true),
          getMatch(p2.participant.id, false),
          getMatch(p2.participant.id, true),
        ],
      });

      expect(results).to.match(/<td>1<\/td><td>\w*<\/td><td>6<\/td>/);
      expect(results).to.match(/<td>6<\/td>.*<td>3<\/td>/);
    });

    it('subsorts participants by their game point differentials', () => {
      const p1 = getParticipant('John Morris');
      const p2 = getParticipant('Mark Katerberg');

      const results = transformResultsToHtml({
        participants: [p1, p2],
        matches: [
          getMatch(p1.participant.id, true, 1),
          getMatch(p1.participant.id, false, 0),
          getMatch(p2.participant.id, true, 1),
          getMatch(p2.participant.id, false, 1),
        ],
      });

      expect(results).to.match(/<td>1<\/td><td>Katerberg, Mark<\/td><td>3<\/td>/);
      expect(results).to.match(/<td>2<\/td><td>Morris, John<\/td><td>3<\/td>/);
    });

    it('prevents point differential from breaking past the match points', async() => {
      const input = await getSampleResults();

      const results = transformResultsToHtml(input);

      expect(results).to.match(/<td>2<\/td><td>Curry, Brandon<\/td><td>15<\/td>/);
    });
  });

  describe('getPlayers(challongeExport)', () => {
    it('gives player names as csv', () => {
      const p1 = getParticipant();
      const p2 = getParticipant();
      p1.participant.name = 'Elaine Cao';
      p2.participant.name = 'John Ryan Hamilton';

      const results = getPlayers({
        participants: [p1, p2],
        matches: [
          getMatch(p1.participant.id, true),
          getMatch(p2.participant.id, false),
          getMatch(p1.participant.id, false),
          getMatch(p2.participant.id, true),
          getMatch(p2.participant.id, true),
        ],
      });

      expect(results).to.contain('"Cao, Elaine",');
      expect(results).to.contain('"Hamilton, John Ryan",');
    });
  });

  describe('getRound(json)', () => {
    it('gives the max round in the matches', () => {
      const result = getRound({
        matches: [
          getMatch(undefined, undefined, undefined, 4),
          getMatch(undefined, undefined, undefined, 1),
          getMatch(undefined, undefined, undefined, 1),
        ],
      });

      expect(result).to.equal(4);
    });
  });
});
