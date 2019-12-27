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

      expect(results).to.contain('<html>');
      expect(results).to.contain('<body>');
      expect(results).to.contain('<table shade="1" shadecolor="#ffffcc" w="500">');
      expect(results).to.contain('<tbody>');
    });

    it('contains row for each entrant plus a header', async () => {
      const input = await getTournamentResults();

      const results = transformResultsToHtml(input);

      expect(results).to.contain('<th><b>Rank</b></th>');
      expect(results).to.contain('<th><b>Player</b></th>');
      expect(results).to.contain('<th><b>Points</b></th>');
      expect(results).to.contain('<th><b>OMW%</b></th>');
      expect((results.match(/<tr>/g) || []).length).to.equal(9);
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

      expect(results).to.contain(`"${p1.participant.name}",`);
    });
  });
});
