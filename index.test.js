const {expect} = require('chai');
const {getPlayers, getTournamentResults, transformResults} = require('.');

function getRandomNumber() {
  return Math.floor(Math.random() * 1000 + 1);
}

function getParticipant(seed) {
  return {participant: {id: getRandomNumber(), name: `${Math.random()}`, seed: seed || getRandomNumber()}};
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

  describe('transformResults(challongeExport)', () => {
    it('is a list of standings', async () => {
      const input = await getTournamentResults();

      const results = transformResults(input);

      expect(results).to.contain('<Standings>');
    });

    it('contains teams for each entrant', async () => {
      const input = await getTournamentResults();

      const results = transformResults(input);

      expect((results.match(/<Team /g) || []).length).to.equal(8);
    });

    it('contains base info', async () => {
      const p = getParticipant();

      const results = transformResults({participants: [p], matches: []});

      expect(results).to.contain(`<Team Rank="${p.participant.seed}" Name="${p.participant.name}"`);
    });

    it('calculates match points based on existing matches', async () => {
      const p = getParticipant();

      const results = transformResults({
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

      const results = transformResults({
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
