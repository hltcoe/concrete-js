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

  it("manual_tokenization_test - verify numbersSentence text", function() {
    var sentenceTextSpan = this.numbersSentence.textSpan;
    var sentenceText = this.numbersSentence.section.comm.text.substring(
      sentenceTextSpan.start, sentenceTextSpan.ending);
    expect(sentenceText).toEqual('one two three');
  });

  it("manual_tokenization_test - verify numbersTokenizedSentence text", function() {
    var sentenceTextSpan = this.numbersTokenizedSentence.textSpan;
    var sentenceText = this.numbersTokenizedSentence.section.comm.text.substring(
      sentenceTextSpan.start, sentenceTextSpan.ending);
    expect(sentenceText).toEqual('one two three');
  });

  it("$.fn.manualTokenizationWidget - Initialize untokenized without connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersSentence);

    expect($('#sentence .concrete_character')).toHaveLength(13);
    expect($('#sentence .concrete_character_gap')).toHaveLength(12);
    expect($('#sentence')).not.toContainElement('.connected_concrete_characters');
  });

  it("$.fn.manualTokenizationWidget - Initialize tokenized with connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersTokenizedSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersTokenizedSentence);

    expect($('#sentence .concrete_character')).toHaveLength(13);
    expect($('#sentence .concrete_character_gap')).toHaveLength(12);
    expect($('#sentence .concrete_character.connected_concrete_characters')).toHaveLength(11);
    expect($('#sentence .concrete_character_gap.connected_concrete_characters')).toHaveLength(8);
  });

});
