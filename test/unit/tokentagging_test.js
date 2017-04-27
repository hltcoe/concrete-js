describe("TokenTagging unit tests", function() {
  beforeEach(function() {
    jasmine.getJSONFixtures().fixturesPath='base/test/fixtures';
    var comm = new Communication();
    var commJSONData = getJSONFixture('dog-bites-man.concrete.json');
    comm.initFromTJSONProtocolObject(commJSONData);
    this.tokenization = comm.getFirstTokenization();
  });

  it("TokenTagging.create() - initializing fields", function() {
    var tokenTagging = TokenTagging.create({taggingType: 'fooType'}, {tool: 'fooTool'});
    expect(tokenTagging.taggingType).toEqual('fooType');
    expect(tokenTagging.metadata.tool).toEqual('fooTool');
  });

  it("tokenTagging.bioGetTagSeparator() default value", function() {
    var tokenTagging = TokenTagging.create();
    expect(tokenTagging.bioGetTagSeparator()).toEqual('-');
  });

  it("tokenTagging.bioGetTokenIndexForB()", function() {
    var tokenTagging = TokenTagging.create();

    tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 4);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 5);

    expect(tokenTagging.bioGetTokenIndexForB(3)).toEqual(3);
    expect(tokenTagging.bioGetTokenIndexForB(4)).toEqual(3);
    expect(tokenTagging.bioGetTokenIndexForB(5)).toEqual(3);
  });

  it("tokenTagging.bioSetTaggedTokenTag() - sets tag", function() {
    var tokenTagging = TokenTagging.create();

    tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 4);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 5);

    expect(tokenTagging.bioGetBIOValue(3)).toEqual('B');
    expect(tokenTagging.bioGetTagValue(3)).toEqual('FOO');
    expect(tokenTagging.bioGetBIOValue(4)).toEqual('I');
    expect(tokenTagging.bioGetTagValue(4)).toEqual('FOO');
    expect(tokenTagging.bioGetBIOValue(5)).toEqual('I');
    expect(tokenTagging.bioGetTagValue(5)).toEqual('FOO');
  });

  it("tokenTagging.bioSetTaggedTokenTag() - propagates tag value for B tokens", function() {
    var tokenTagging = TokenTagging.create();

    tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 4);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 5);

    // Updating tag value propagates to right
    tokenTagging.bioSetTaggedTokenTag('B', 'BAR', 3);
    expect(tokenTagging.bioGetBIOValue(3)).toEqual('B');
    expect(tokenTagging.bioGetTagValue(3)).toEqual('BAR');
    expect(tokenTagging.bioGetBIOValue(4)).toEqual('I');
    expect(tokenTagging.bioGetTagValue(4)).toEqual('BAR');
    expect(tokenTagging.bioGetBIOValue(5)).toEqual('I');
    expect(tokenTagging.bioGetTagValue(5)).toEqual('BAR');
  });

  it("tokenTagging.bioSetTaggedTokenTag() - enforces bioValue constraint", function() {
    var tokenTagging = TokenTagging.create();

    var bNoThrow = function () {
      tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    };
    expect(bNoThrow).not.toThrowError(TypeError);

    var zThrow = function() {
      tokenTagging.bioSetTaggedTokenTag('Z', 'FOO', 4);
    };
    expect(zThrow).toThrowError(TypeError);
  });

  it("tokenTagging.bioSetTaggedTokenTag() - reject lone 'I' tag", function() {
    var tokenTagging = TokenTagging.create();

    var iThrow = function() {
      tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 3);
    };
    expect(iThrow).toThrowError(TypeError);
  });

  it("tokenTagging.bioSetTaggedTokenTag() - promote 'I' tag on right to 'B'", function() {
    var tokenTagging = TokenTagging.create();

    tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 4);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 5);

    tokenTagging.bioSetTaggedTokenTag('O', 'ignored', 3);

    expect(tokenTagging.bioGetBIOValue(3)).toEqual('O');
    expect(tokenTagging.bioGetTagValue(3)).toEqual('');
    expect(tokenTagging.bioGetBIOValue(4)).toEqual('B');
    expect(tokenTagging.bioGetTagValue(4)).toEqual('FOO');
    expect(tokenTagging.bioGetBIOValue(5)).toEqual('I');
    expect(tokenTagging.bioGetTagValue(5)).toEqual('FOO');
  });

  it("tokenTagging.bioSetTagSeparator() sets separator", function() {
    var tokenTagging = TokenTagging.create();
    tokenTagging.bioSetTagSeparator('_');
    expect(tokenTagging.bioGetTagSeparator()).toEqual('_');
  });

  it("tokenTagging.deepCopyTaggedTokenList() - makes deep copy", function() {
    var tokenTagging = TokenTagging.create();
    tokenTagging.bioSetTaggedTokenTag('B', 'FOO', 3);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 4);
    tokenTagging.bioSetTaggedTokenTag('I', 'FOO', 5);

    var tokenTaggingCopy = TokenTagging.create();
    tokenTaggingCopy.taggedTokenList = tokenTagging.deepCopyTaggedTokenList();

    expect(tokenTaggingCopy.taggedTokenList.length).toEqual(tokenTagging.taggedTokenList.length);

    for (var i = 0; i < tokenTagging.taggedTokenList.length; i++) {
      expect(tokenTaggingCopy.taggedTokenList[i].tag).toEqual(tokenTagging.taggedTokenList[i].tag);
      expect(tokenTaggingCopy.taggedTokenList[i].tokenIndex).toEqual(tokenTagging.taggedTokenList[i].tokenIndex);

      // Verify that
      expect(tokenTaggingCopy.taggedTokenList[i]).not.toBe(tokenTagging.taggedTokenList[i]);
    }
  });

  it("tokenTagging.setAllTaggedTokens() - integer tokenIndices", function() {
    var tokenTagging = TokenTagging.create();
    tokenTagging.setAllTaggedTokenTags(this.tokenization, 'FOO');
    for (var i = 0; i < this.tokenization.tokenList.tokenList.length; i++) {
      expect(tokenTagging.getTaggedTokenWithTokenIndex(i).tokenIndex).toEqual(i);
    }
  });

  it("tokenTagging.setAllTaggedTokens()", function() {
    var tokenTagging = TokenTagging.create();
    tokenTagging.setAllTaggedTokenTags(this.tokenization, 'FOO');
    for (var i = 0; i < this.tokenization.tokenList.tokenList.length; i++) {
      expect(tokenTagging.getTaggedTokenWithTokenIndex(i).tag).toEqual('FOO');
    }
  });
});
