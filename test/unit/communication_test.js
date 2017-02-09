describe("Communication unit tests", function() {
  beforeEach(function() {
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';
  });

  it("communication.initFromTJSONProtocolObject()", function() {
    var comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    comm.initFromTJSONProtocolObject(commJSONData);

    expect(comm.id).toContain('dog-bites-man');
  });

  it("communication.addInternalReferences()", function() {
    var comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    comm.initFromTJSONProtocolObject(commJSONData);
    comm.addInternalReferences();

    var firstSentence = comm.getFirstSentence();
    var firstTokenization = comm.getFirstTokenization();

    expect(firstTokenization.sentence).toEqual(firstSentence);
    expect(firstSentence.section.communication).toEqual(comm);
  });
});
