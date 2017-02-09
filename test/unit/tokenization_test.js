describe("Tokenization unit tests", function() {
  beforeEach(function() {
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';
    var comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    comm.initFromTJSONProtocolObject(commJSONData);
    this.tokenization = comm.getFirstTokenization();
  });

  it("tokenization.getTokenTaggingsOfType()", function() {
    var tokenTagging = TokenTagging.create({taggingType: 'FOO'});
    this.tokenization.addTokenTagging(tokenTagging);
    expect(this.tokenization.getTokenTaggingsOfType('FOO')[0]).toEqual(tokenTagging);
  });
});
