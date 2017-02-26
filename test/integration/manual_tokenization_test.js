describe("Manual Tokenization", function() {

  beforeEach(function() {
    jasmine.getFixtures().fixturesPath='base/test/fixtures';
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';

    var numbersComm = new Communication();
    var commJSONData = getJSONFixture('numbers.comm.json');
    numbersComm.initFromTJSONProtocolObject(commJSONData);
    numbersComm.addInternalReferences();
    this.numbersSentence = numbersComm.getFirstSentence();

    var numbersTokenizedComm = new Communication();
    commJSONData = getJSONFixture('numbers-tokenized.comm.json');
    numbersTokenizedComm.initFromTJSONProtocolObject(commJSONData);
    numbersTokenizedComm.addInternalReferences();
    this.numbersTokenizedSentence = numbersTokenizedComm.getFirstSentence();
  });

  it("$.fn.manualTokenizationWidget - Initialize untokenized without connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersSentence);

    expect($('#sentence')).toContainElement('.concrete_character');
    expect($('#sentence')).toContainElement('.concrete_character_gap');
    expect($('#sentence')).not.toContainElement('.connected_concrete_characters');
  });

  it("$.fn.manualTokenizationWidget - Initialize tokenized with connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersTokenizedSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersTokenizedSentence);

    expect($('#sentence')).toContainElement('.concrete_character');
    expect($('#sentence')).toContainElement('.concrete_character_gap');
    expect($('#sentence')).toContainElement('.connected_concrete_characters');
  });

});
