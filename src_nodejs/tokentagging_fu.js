/**
 * @class TokenTagging
 * @classdesc concrete.js extensions to the TokenTagging class
 */
const concrete = {};
concrete.structure = require('./structure_types');
const TokenTagging = module.exports = concrete.structure.TokenTagging;
const TaggedToken = concrete.structure.TaggedToken;
concrete.metadata = require('./metadata_types');
const AnnotationMetadata = concrete.metadata.AnnotationMetadata;

const jQuery = {extend: function(){throw new Error("not implemented");}};
const $ = jQuery;

/**
 * Create a valid TokenTagging with required fields AnnotationMetadata and UUID
 *
 * Example usage:
 *
 *     tt = TokenTagging.create({taggingType: 'NER'}, {tool: 'HIT'})
 *
 * @param {Object} options - Override default TokenTagging fields (except metadata)
 * @param {Object} metadataOptions - Override default tokenTagging.metadata fields
 */
TokenTagging.create = function(options, metadataOptions) {
  var tokenTagging = new TokenTagging();
  tokenTagging.metadata = new AnnotationMetadata();
  tokenTagging.metadata.timestamp = Math.floor(Date.now()/1000);
  tokenTagging.metadata.tool = 'concrete.js - TokenTagging.create()';
  tokenTagging.taggedTokenList = [];
  tokenTagging.taggingType = '';
  tokenTagging.uuid = concrete.util.generateUUID();

  tokenTagging = $.extend({}, tokenTagging, options);
  tokenTagging.metadata = $.extend({}, tokenTagging.metadata, metadataOptions);
  return tokenTagging;
};

/**
 * Get BIO value for TaggedToken at tokenIndex
 *
 * @param {Integer] tokenIndex
 * @returns {String|null} - 'B', 'I', 'O' or null
 */
TokenTagging.prototype.bioGetBIOValue = function(tokenIndex) {
  var taggedToken = this.getTaggedTokenWithTokenIndex(tokenIndex);
  if (taggedToken && taggedToken.tag) {
    var firstChar = taggedToken.tag.charAt(0);
    if (firstChar === 'B' || firstChar === 'I' || firstChar === 'O' ) {
      return firstChar;
    }
  }
  return null;
};

/**
 * Get tag value (stripped of BIO tag and separator) for TaggedToken at tokenIndex
 *
 * @param {Integer] tokenIndex
 * @returns {String|null} - 'B', 'I', 'O' or null
 *
 */
TokenTagging.prototype.bioGetTagValue = function(tokenIndex) {
  var taggedToken = this.getTaggedTokenWithTokenIndex(tokenIndex);
  if (taggedToken && taggedToken.tag) {
    return taggedToken.tag.substring(2);
  }
  return null;
};

/**
 * Returns separator character for BIO TokenTaggings.
 *
 * If the separator character had not been set before this function was called,
 * the separator character will be set to '-'.
 *
 * @returns {String} - Separator character for BIO TokenTaggings
 */
TokenTagging.prototype.bioGetTagSeparator = function() {
  if (this.bioTagSeparator === undefined) {
    this.bioTagSeparator = '-';
  }
  return this.bioTagSeparator;
};

/**
 * Returns token index of 'B' tag for the (possibly multi-token) 'BI'
 * tagging at the specified tokenIndex.
 *
 * If the tag at tokenIndex is a 'B' tag, return tokenIndex.  If the
 * tag at tokenIndex is an 'I' tag, find the index of the 'B' tag for
 * this 'I' tag.
 *
 * @param {Number} tokenIndex -
 * @returns {Number} - Token index of "B" tag
 * @throws {TypeError} Thrown if the tag at TokenIndex is not a 'B' or
 *                     'I' tag.  Also thrown if the tag at TokenIndex
 *                     is a valid 'I' tag, but not part of a valid 'BI*'
 *                     multi-token tagging.
 */
TokenTagging.prototype.bioGetTokenIndexForB = function(tokenIndex) {
  if (this.bioGetBIOValue(tokenIndex) !== 'B' && this.bioGetBIOValue(tokenIndex) !== 'I') {
    throw new TypeError("TokenTagging.getBIOTokenIndexForB expected a 'B' or 'I' tag at tokenIndex " + tokenIndex);
  }

  var bTokenIndex = tokenIndex;
  while (this.bioGetBIOValue(bTokenIndex) === 'I') {
    bTokenIndex -= 1;
  }
  if (this.bioGetBIOValue(bTokenIndex) !== 'B') {
    throw new TypeError("TokenTagging.getBIOTokenIndex expected a 'B' tag at tokenIndex " +
                        bTokenIndex + ', but tag was "' +
                        this.getTaggedTokenWithTokenIndex(bTokenIndex) + "'");
  }
  return bTokenIndex;
};

/**
 * Set BIO TaggedToken tag
 *
 * @param {String} bioValue - Should be 'B', 'I' or 'O'
 * @param {String} tagText
 * @param {Number} tokenIndex
 * @throws {TypeError} Thrown if bioValue is not 'B'|'I'|'O'.  Also thrown
 *                     if bioValue is 'I', but not part of a valid 'BI*'
 *                     multi-token tagging.
 */
TokenTagging.prototype.bioSetTaggedTokenTag = function(bioValue, tagText, tokenIndex) {
  if (bioValue !== 'B' && bioValue !== 'I' && bioValue !== 'O') {
    throw new TypeError("TokenTagging.bioSetTaggedTokenTag() expected bioValue to be 'B', 'I' or 'O', " +
                        "but instead it was '" + bioValue + "'");
  }

  var bioTagText;
  if (bioValue === 'B') {
    this.setTaggedTokenTag(bioValue + this.bioGetTagSeparator() + tagText, tokenIndex);
  }
  else if (bioValue === 'I') {
    var bioPreviousValue = this.bioGetBIOValue(tokenIndex-1);
    if (bioPreviousValue === 'B' || bioPreviousValue === 'I') {
      // Get tag value from previous tag, ignore 'tagText' passed into function
      this.setTaggedTokenTag(bioValue + this.bioGetTagSeparator() + this.bioGetTagValue(tokenIndex-1), tokenIndex);
    }
    else {
      throw new TypeError("TokenTagging.bioSetTaggedTokenTag() encountered inconsistent BIO tagging " +
                          "at tokenIndex " + (tokenIndex-1));
    }
  }
  else {
    this.setTaggedTokenTag('O', tokenIndex);
  }

  var bioValueNext = this.bioGetBIOValue(tokenIndex+1);
  var tagTextNext = this.bioGetTagValue(tokenIndex+1);
  if (bioValueNext === 'I') {
    if (bioValue === 'O') {
      this.bioSetTaggedTokenTag('B', tagTextNext, tokenIndex+1);
    }
    else {
      if (tagText !== tagTextNext) {
        // Update tagText for all following 'I' tokens
        this.bioSetTaggedTokenTag('I', tagText, tokenIndex+1);
      }
    }
  }
};

/**
 * For BIO TokenTaggings, sets separator character to be used between
 * B/I/O character and rest of tag
 *
 * @param {String} separator - String used as separator character
 */
TokenTagging.prototype.bioSetTagSeparator = function(separator) {
  this.bioTagSeparator = separator;
};

/**
 * Return a deep copy of this TokenTagging's taggedTokenList.
 *
 * @returns {TaggedToken[]}
 */
TokenTagging.prototype.deepCopyTaggedTokenList = function() {
  var taggedTokenListCopy = [];
  for (var i = 0; i < this.taggedTokenList.length; i++) {
    var taggedToken = new TaggedToken();
    taggedTokenListCopy.push(jQuery.extend(true, taggedToken, this.taggedTokenList[i]));
  }
  return taggedTokenListCopy;
};

/**
 * Return the TaggedToken (or null) with the specified tokenIndex
 *
 * @param {Number} tokenIndex
 * @returns {TaggedToken|null}
 */
TokenTagging.prototype.getTaggedTokenWithTokenIndex = function(tokenIndex) {
  for (var i = 0; i < this.taggedTokenList.length; i++) {
    if (this.taggedTokenList[i].tokenIndex === tokenIndex) {
      return this.taggedTokenList[i];
    }
  }
  return null;
};

/**
 * Set taggedTokenList to a list of TaggedTokens (one per token) with identical tags
 *
 * @param {Tokenization} tokenization - Used to determine # of TokenTags
 * @param {String} tagText - Value for each TaggedToken's "tag" field
 */
TokenTagging.prototype.setAllTaggedTokenTags = function(tokenization, tagText) {
  // Discard the contents of the existing taggedTokenList
  this.taggedTokenList = [];

  for (var i = 0; i < tokenization.tokenList.tokenList.length; i++) {
    var taggedToken = new TaggedToken();
    taggedToken.tag = tagText;
    taggedToken.tokenIndex = i;
    this.taggedTokenList.push(taggedToken);
  }
};

/**
 * Sets the tag of the TaggedToken with the specified tokenIndex.
 * If a TaggedToken with the specified tokenIndex does not exist,
 * than it will be created.
 *
 * @param {String} tagText
 * @param {Number} tokenIndex
 */
TokenTagging.prototype.setTaggedTokenTag = function(tagText, tokenIndex) {
  var taggedToken = this.getTaggedTokenWithTokenIndex(tokenIndex);
  if (!taggedToken) {
    taggedToken = new TaggedToken();
    taggedToken.tokenIndex = tokenIndex;
    this.taggedTokenList.push(taggedToken);
  }
  taggedToken.tag = tagText;
};
