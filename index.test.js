const {expect} = require('chai');
const {getPlayers, getTournamentResults, transformResultsToHtml, transformResultsToXml} = require('.');

function getRandomNumber() {
  return Math.floor(Math.random() * 1000 + 1);
}

function getParticipant(seed) {
  return {participant: {id: getRandomNumber(), name: `${getRandomNumber()}`, seed: seed || getRandomNumber()}};
}

function getMatch(playerId, isWon) {
  const isPlayerOne = Math.random() > 0.5;
  return {
    match: {
      id: getRandomNumber(),
      player1_id: isPlayerOne ? playerId : getRandomNumber(),
      player2_id: isPlayerOne ? getRandomNumber() : playerId,
      winner_id: isWon ? playerId : getRandomNumber(),
    }
  };
}

describe('Index', () => {
  describe('getTournamentResults()', () => {
    it('gives valid json', async () => {
      const results = await getTournamentResults();
      expect(results.game_name).to.equal('Magic: The Gathering');
    });
  });

  describe('transformResultsToXml(challongeExport)', () => {
    it('is a list of standings', async () => {
      const input = await getTournamentResults();

      const results = transformResultsToXml(input);

      expect(results).to.contain('<Standings>');
    });

    it('contains teams for each entrant', async () => {
      const input = await getTournamentResults();

      const results = transformResultsToXml(input);

      expect((results.match(/<Team /g) || []).length).to.equal(8);
    });

    it('contains base info', async () => {
      const p = getParticipant();

      const results = transformResultsToXml({participants: [p], matches: []});

      expect(results).to.contain(`<Team Rank="${p.participant.seed}" Name="${p.participant.name}"`);
    });

    it('calculates match points based on existing matches', async () => {
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

    it('sorts participants by their rank', () => {
      const p1 = getParticipant(2);
      const p2 = getParticipant(1);

      const results = transformResultsToXml({
        participants: [p1, p2],
        matches: [
          getMatch(p1.participant.id, true),
          getMatch(p2.participant.id, false),
          getMatch(p1.participant.id, false),
          getMatch(p2.participant.id, true),
          getMatch(p2.participant.id, true),
        ],
      });

      expect(results).to.match(/Rank="1".*MatchPoints="6".*Rank="2".*MatchPoints="3"/);
    });
  });

  describe('transformResultsToXml(challongeExport)', () => {
    it('is a list of standings', async () => {
      const input = await getTournamentResults();

      const results = transformResultsToHtml(input);

      expect(results.startsWith('<table shade="1" shadecolor="#ffffcc" w="500">')).to.be.true;
      expect(results.endsWith('</table>')).to.be.true;
      expect(results).to.contain('<tbody>');
    });

    it('reverses first and last names', async () => {
      const input = await getTournamentResults();

      const results = transformResultsToHtml(input);

      expect((results.match(/<tr>/g) || []).length).to.equal(9);
    });

    it('contains row for each entrant plus a header', async () => {
      const p1 = getParticipant(1);
      const p2 = getParticipant(2);
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
      const p1 = getParticipant(2);
      const p2 = getParticipant(1);

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
  });

  describe('getPlayers(challongeExport)', () => {
    it('gives player names as csv', () => {
      const p1 = getParticipant(2);
      const p2 = getParticipant(1);
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

      expect(results).to.contain(`"Cao, Elaine",`);
      expect(results).to.contain(`"Hamilton, John Ryan",`);
    });
  });
});
