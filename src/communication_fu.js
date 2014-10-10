/*
  COMMUNICATION_FU
*/


/** Adds internal references between data structures contained in Communication
 *
 * Specifically, adds:
 *   - to each concrete.Section, a section.comm reference to the enclosing Communication
 *   - to each concrete.Sentence, a sentence.section reference to the enclosing Section
 *   - to each concrete.Tokenization, a tokenization.sentence reference to the enclosing Sentence
 */
Communication.prototype.addInternalReferences = function() {
  if (this.sectionList) {
    for (var sectionIndex in this.sectionList) {
      var section = this.sectionList[sectionIndex];
      section.comm = this;
      if (section.sentenceList) {
        for (var sentenceIndex in section.sentenceList) {
          var sentence = section.sentenceList[sentenceIndex];
          sentence.section = section;
          if (sentence.tokenization) {
            sentence.tokenization.sentence = sentence;
          }
        }
      }
    }
  }
};


/** Return the Entity (or null) that has an EntityMention with the specified UUID
 * @param {UUID} uuid
 * @returns {Entity|null}
 */
Communication.prototype.getEntityForEntityMentionUUID = function(uuid) {
  if (this.entitySetList) {
    for (var entitySetIndex in this.entitySetList) {
      var entityList = this.entitySetList[entitySetIndex].entityList;
      for (var entityIndex in entityList) {
        var entity = entityList[entityIndex];
        for (var entityMentionIndex in entity.mentionIdList) {
          if (entity.mentionIdList[entityMentionIndex].uuidString === uuid.uuidString) {
            return entity;
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("WARNING: No Entity found for EntityMention with UUID " + uuid.uuidString);
  return null;
};


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
  if (this.sectionList) {
    for (var sectionListIndex in this.sectionList) {
      var section = this.sectionList[sectionListIndex];
      if (section.sentenceList) {
        for (var sentenceIndex in section.sentenceList) {
          var sentence = section.sentenceList[sentenceIndex];
          if (sentence.uuid.uuidString == uuid.uuidString) {
            return sentence;
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
  if (this.sectionList) {
    for (var sectionListIndex in this.sectionList) {
      var section = this.sectionList[sectionListIndex];
      if (section.sentenceList) {
        for (var sentenceIndex in section.sentenceList) {
          var sentence = section.sentenceList[sentenceIndex];
          if (sentence.tokenization && sentence.tokenization.uuid.uuidString == uuid.uuidString) {
            return sentence.tokenization;
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


/** Return the TaggedToken (or null) with the specified tokenIndex
 * @param {Number} tokenIndex
 * @returns {Entity|null}
 */
TokenTagging.prototype.getTaggedTokenWithTokenIndex = function(tokenIndex) {
  for (var i = 0; i < this.taggedTokenList.length; i++) {
    if (this.taggedTokenList[i].tokenIndex === tokenIndex) {
      return this.taggedTokenList[i];
    }
  }
  return null;
};
