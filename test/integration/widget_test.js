describe("CommunicationWidget", function() {
  beforeEach(function() {
    jasmine.getFixtures().fixturesPath='base/test/fixtures';
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';

    this.comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    this.comm.initFromTJSONProtocolObject(commJSONData);
    this.tokenization = this.comm.getFirstTokenization();
  });

  it("concrete.widget.creatCommunicationDiv() creates DOM structure", function() {
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
});
