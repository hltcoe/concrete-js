/**
 * @class Tokenization
 * @classdesc concrete.js extensions to the Tokenization class
 */
const Tokenization = module.exports = require('./structure_types').Tokenization;
  
/**
 * Add a TokenTagging to this Tokenization
 * @param {TokenTagging} tokenTagging
 */
Tokenization.prototype.addTokenTagging = function(tokenTagging) {
  if (!this.tokenTaggingList) {
    this.tokenTaggingList = [];
  }
  this.tokenTaggingList.push(tokenTagging);
};

/**
 * Get all TokenTaggings with the specified taggingType
 * @param {String} taggingType - A string specifying a TokenTagging.taggingType
 * @returns {Array} A (possibly empty) array of TokenTagging objects
 */
Tokenization.prototype.getTokenTaggingsOfType = function(taggingType) {
  var tokenTaggings = [];

  for (var tokenTaggingIndex in this.tokenTaggingList) {
    if (this.tokenTaggingList[tokenTaggingIndex].taggingType === taggingType) {
      tokenTaggings.push(this.tokenTaggingList[tokenTaggingIndex]);
    }
  }

  return tokenTaggings;
};
