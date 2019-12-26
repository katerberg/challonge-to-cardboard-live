const {expect} = require('chai');
const {getTournamentResults, transformResults} = require('.');

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

      expect(results.startsWith('<Standings>')).to.be.true;
    });

    it('contains teams for each entrant', async () => {
      const input = await getTournamentResults();

      const results = transformResults(input);

      expect((results.match(/<Team /g) || []).length).to.equal(8);
    });

    it('contains base info', async () => {
      const results = transformResults({participants: [{participant: {name: 'Expected', seed: 2}}]});

      expect(results).to.contain('<Team Rank="2" Name="Expected"');
    });
  });
});
