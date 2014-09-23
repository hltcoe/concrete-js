/*
  COMMUNICATION_FU
*/

/** Return the EntityMention (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {EntityMention|null}
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
  return null;
};


/** Return the Sentence (or null) with the specified UUID
 * @param {UUID} uuid
 @ @returns {Sentence|null}
 */
Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (this.sectionSegmentationList) {
    for (var sectionSegmentationListIndex in this.sectionSegmentationList) {
      var sectionSegmentation = this.sectionSegmentationList[sectionSegmentationListIndex];
      if (sectionSegmentation.sectionList) {
        for (var sectionListIndex in sectionSegmentation.sectionList) {
          var sectionList = sectionSegmentation.sectionList[sectionListIndex];
          if (sectionList.sentenceSegmentationList) {
            for (var sentenceSegmentationListIndex in sectionList.sentenceSegmentationList) {
              var sentenceSegmentation = sectionList.sentenceSegmentationList[sentenceSegmentationListIndex];
              for (var sentenceIndex in sentenceSegmentation.sentenceList) {
                var sentence = sentenceSegmentation.sentenceList[sentenceIndex];
                if (sentence.uuid.uuidString == uuid.uuidString) {
                  return sentence;
                }
              }
            }
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid.uuidString);
  return null;
};


/** Return the SituationMention (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {SituationMention|null}
 */
Communication.prototype.getSituationMentionWithUUID = function(uuid) {
  if (this.situationMentionSetList) {
    for (var situationMentionSetIndex in this.situationMentionSetList) {
      var situationMentionSet = this.situationMentionSetList[situationMentionSetIndex];
      for (var mentionListIndex in situationMentionSet.mentionList) {
        var mention = situationMentionSet.mentionList[mentionListIndex];
        if (mention.uuid.uuidString === uuid.uuidString) {
          return mention;
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No SituationMention found with UUID " + uuid.uuidString);
  return null;
};



/** Return the Tokenization (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {Tokenization|null}
 */
Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (this.sectionSegmentationList) {
    for (var sectionSegmentationListIndex in this.sectionSegmentationList) {
      var sectionSegmentation = this.sectionSegmentationList[sectionSegmentationListIndex];
      if (sectionSegmentation.sectionList) {
        for (var sectionListIndex in sectionSegmentation.sectionList) {
          var sectionList = sectionSegmentation.sectionList[sectionListIndex];
          if (sectionList.sentenceSegmentationList) {
            for (var sentenceSegmentationListIndex in sectionList.sentenceSegmentationList) {
              var sentenceSegmentation = sectionList.sentenceSegmentationList[sentenceSegmentationListIndex];
              for (var sentenceIndex in sentenceSegmentation.sentenceList) {
                var sentence = sentenceSegmentation.sentenceList[sentenceIndex];
                for (var tokenizationListIndex in sentence.tokenizationList) {
                  if (sentence.tokenizationList[tokenizationListIndex].uuid.uuidString == uuid.uuidString) {
                    return sentence.tokenizationList[tokenizationListIndex];
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid.uuidString);
  return null;
};


/** Get list of token text strings for the EntityMention specified by the UUID
 * @param {UUID} mentionId
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


/** Get all TokenTaggings with the specified taggingType
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
