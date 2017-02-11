describe("CommunicationWidget", function() {
  beforeEach(function() {
    jasmine.getFixtures().fixturesPath='base/test/fixtures';
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';

    this.comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    this.comm.initFromTJSONProtocolObject(commJSONData);
    this.tokenization = this.comm.getFirstTokenization();
  });

  it("concrete.widget.createCommunicationDiv() creates Communication DOM structure", function() {
    loadFixtures('mostly-empty.html');
    expect($('#communication')).toExist();

    var commDiv = concrete.widget.createCommunicationDiv(this.comm);
    $('#communication').append(commDiv);
    expect($('#communication')).toContainElement('.section');
    expect($('#communication')).toContainElement('.sentence');
    expect($('#communication')).toContainElement('.tokenization');
    expect($('#communication')).toContainElement('.token');
    expect($('#communication')).toContainElement('.token_padding');
  });

  it("$.fn.communicationWidget() creates Communication DOM structure", function() {
    loadFixtures('mostly-empty.html');

    $('#communication').communicationWidget(this.comm);
    expect($('#communication')).toContainElement('.section');
    expect($('#communication')).toContainElement('.sentence');
    expect($('#communication')).toContainElement('.tokenization');
    expect($('#communication')).toContainElement('.token');
    expect($('#communication')).toContainElement('.token_padding');
  });

  it("$.fn.communicationWidget() attaches Concrete objects as jQuery data", function() {
    loadFixtures('mostly-empty.html');
    $('#communication').communicationWidget(this.comm);

    var firstSection = this.comm.getSectionsAsList()[0];
    var firstSentence = this.comm.getSentencesAsList()[0];

    expect($('#communication').find('.section').first().data('section')).toEqual(firstSection);
    expect($('#communication').find('.sentence').first().data('sentence')).toEqual(firstSentence);
  });

  it("$.fn.tokenizationWidget() attaches tokenization as jQuery data", function() {
    loadFixtures('mostly-empty.html');
    $('#tokenization').tokenizationWidget(this.tokenization);

    // Attaches Tokenization object to DOM element for Tokenization
    expect($('#tokenization').find('.tokenization').data('tokenization')).toEqual(this.tokenization);

    // Attaches Tokenization object to DOM element for Token
    var firstToken = $('#tokenization').find('.token').first();
    expect(firstToken.data('tokenization')).toEqual(this.tokenization);
  });
});
