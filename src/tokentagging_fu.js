/**
 * @class TokenTagging
 * @classdesc concrete.js extensions to the TokenTagging class
 */

/** Return the TaggedToken (or null) with the specified tokenIndex
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


/** Sets the tag of the TaggedToken with the specified tokenIndex.
 *  If a TaggedToken with the specified tokenIndex does not exist,
 *  than it will be created.
 * @param {String} tagText
 * @param {Number] tokenIndex
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
