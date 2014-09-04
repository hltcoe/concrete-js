/*
  COMMUNICATION_FU
*/

/**
 * @param {String} uuid
 */
Communication.prototype.getEntityMentionWithUUID = function(uuid) {
  if (this.entityMentionSetList) {
    for (var entityMentionSetIndex in this.entityMentionSetList) {
      if (this.entityMentionSetList[entityMentionSetIndex].mentionList) {
        for (var mentionListIndex in this.entityMentionSetList[entityMentionSetIndex].mentionList) {
          var entityMention = this.entityMentionSetList[entityMentionSetIndex].mentionList[mentionListIndex];
          if (entityMention.uuid.uuidString == uuid.uuidString) {
            return entityMention;
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No EntityMention found with UUID " + uuid.uuidString);
};


/**
 * @param {String} uuid
 */
Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (this.sectionSegmentationList[0].sectionList) {
    for (var sectionListIndex in this.sectionSegmentationList[0].sectionList) {
      if (this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList) {
        for (var sentenceIndex in this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList) {
          var sentence = this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList[sentenceIndex];
          if (sentence.uuid.uuidString == uuid.uuidString) {
            return sentence;
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid.uuidString);
};


/**
 * @param {String} uuid
 */
Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (this.sectionSegmentationList[0].sectionList) {
    for (var sectionListIndex in this.sectionSegmentationList[0].sectionList) {
      if (this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList) {
        for (var sentenceIndex in this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList) {
          var sentence = this.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList[sentenceIndex];
          for (var tokenizationListIndex in sentence.tokenizationList) {
            if (sentence.tokenizationList[tokenizationListIndex].uuid.uuidString == uuid.uuidString) {
              return sentence.tokenizationList[tokenizationListIndex];
            }
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid.uuidString);
};


/**
 * @param {String} mentionId
 * @returns {Array} An array of token text strings
 */
Communication.prototype.getTokensForEntityMentionID = function(mentionId) {
  var entityMention = this.getEntityMentionWithUUID(mentionId);
  var tokenization = this.getTokenizationWithUUID(entityMention.tokens.tokenizationId);

  var tokens = [];

  for (var tokenIndex in entityMention.tokens.tokenIndexList) {
    tokens.push(tokenization.tokenList.tokenList[entityMention.tokens.tokenIndexList[tokenIndex]].text);
  }
  return tokens;
};


/**
 * @param {String} taggingType - A string specifying a TokenTagging.taggingType
 * @returns {Array} A (possibly empty) array of TokenTagging objects
 */
Tokenization.prototype.getTokenTaggingsOfType = function(taggingType) {
  var tokenTaggings = [];

  for (var tokenTaggingIndex in this.tokenTaggingList) {
    if (this.tokenTagging[tokenTaggingIndex].taggingType === taggingType) {
      tokenTaggings.push(this.tokenTagging[tokenTaggingIndex]);
    }
  }

  return tokenTaggings;
};
