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

  it("$.fn.manualTokenizationWidget - Initialize untokenized with connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersSentence);

    expect($('#sentence .concrete_character')).toHaveLength(13);
    expect($('#sentence .concrete_character_gap')).toHaveLength(12);
    expect($('#sentence .concrete_character.connected_concrete_characters')).toHaveLength(13);
    expect($('#sentence .concrete_character_gap.connected_concrete_characters')).toHaveLength(12);
  });

  it("$.fn.manualTokenizationWidget - Initialize untokenized without connected tokens", function() {
    loadFixtures('mostly-empty.html');
    expect(this.numbersSentence).not.toBe(undefined);
    $('#sentence').manualTokenizationWidget(this.numbersSentence, {charactersInitiallyConnected: false});

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

  it("$.fn.getManualTokenization correctly records existing tokenization", function() {
    loadFixtures('mostly-empty.html');

    // manualTokenizationWidget will use existing tokenization for token boundaries
    $('#sentence').manualTokenizationWidget(this.numbersTokenizedSentence);
    var originalTokenization = this.numbersTokenizedSentence.tokenization;
    var originalTokenList = originalTokenization.tokenList.tokenList;

    // getManualTokenization will create new Tokenization based on the token
    // boundaries currently displayed by the UI
    var newTokenization = $('#sentence').getManualTokenization();
    var newTokenList = newTokenization.tokenList.tokenList;

    // Verify that the two Tokenizations have the same structure
    expect(newTokenList.length).toEqual(originalTokenList.length);
    for (var i = 0; i < newTokenList.length; i++) {
      expect(newTokenList[i].text).toEqual(originalTokenList[i].text);
      expect(newTokenList[i].textSpan.start).toEqual(originalTokenList[i].textSpan.start);
      expect(newTokenList[i].textSpan.ending).toEqual(originalTokenList[i].textSpan.ending);
    }

    // The UUID and AnnotationMetadata values will differ
    expect(newTokenization.uuid.uuidString).not.toEqual(originalTokenization.uuid.uuidString);
    expect(newTokenization.metadata.timestamp).not.toEqual(originalTokenization.metadata.timestamp);
  });

});
