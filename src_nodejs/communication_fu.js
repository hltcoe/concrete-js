/**
 * @class Communication
 * @classdesc concrete.js extensions to the Communication class
 */
const Communication = module.exports = require('./communication_types').Communication; 

const thrift = require('thrift');
const Thrift = thrift.Thrift;

/**
 * Adds internal references between data structures contained in Communication
 *
 * Specifically, adds:
 *   - to each concrete.Section, a section.communication reference to the enclosing Communication
 *   - to each concrete.Sentence, a sentence.section reference to the enclosing Section
 *   - to each concrete.Tokenization, a tokenization.sentence reference to the enclosing Sentence
 */
Communication.prototype.addInternalReferences = function() {
  if (this.sectionList) {
    for (var sectionIndex in this.sectionList) {
      var section = this.sectionList[sectionIndex];
      // We add both a 'comm' and 'communication' field to each section.  We
      // originally only added 'comm', but 'communication' is arguably more
      // consistent.  We keep both variable names to avoid breaking existing code.
      section.comm = this;
      section.communication = this;

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


/**
 * Return the Entity (or null) that has an EntityMention with the specified UUID
 *
 * @param {UUID} uuid
 * @returns {Entity|null}
 */
Communication.prototype.getEntityForEntityMentionUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.error("ERROR: getEntityForEntityMentionUUID() was not passed a valid UUID");
    return null;
  }

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
  console.error("ERROR: No Entity found for EntityMention with UUID " + uuid.uuidString);
  return null;
};


/**
 * Return the EntityMentionSet in the Communication with the specified toolname
 *
 * @param {String} toolname
 * @returns {EntityMentionSet|null}
 */
Communication.prototype.getEntityMentionSetWithToolname = function(toolname) {
  if (this.entityMentionSetList && this.entityMentionSetList.length > 0) {
    for (var i = 0; i < this.entityMentionSetList.length; i++) {
      if (this.entityMentionSetList[i].metadata.tool === toolname) {
        return this.entityMentionSetList[i];
      }
    }
  }
  return null;
};


/**
 * Return the EntityMention (or null) with the specified UUID
 *
 * @param {UUID} uuid
 * @returns {EntityMention|null}
 */
Communication.prototype.getEntityMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.error("ERROR: getEntityMentionWithUUID() was not passed a valid UUID");
    return null;
  }

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
  console.error("ERROR: No EntityMention found with UUID " + uuid.uuidString);
  return null;
};


/**
 * Return the Entity (or null) that has the specified Entity ID
 *
 * @param {String} entityId
 * @returns {Entity|null}
 */
Communication.prototype.getEntityWithEntityId = function(entityId) {
  if (!entityId) {
    console.error("ERROR: getEntityWithEntityId() was not passed a valid entityId");
    return null;
  }

  if (this.entitySetList) {
    for (var entitySetIndex in this.entitySetList) {
      var entityList = this.entitySetList[entitySetIndex].entityList;
      for (var entityIndex in entityList) {
        var entity = entityList[entityIndex];
        if (entity.id === entityId) {
          return entity;
        }
      }
    }
  }
  // TODO: Error handling if no matching entityId could be found
  console.error("ERROR: No Entity found for entityId " + entityId);
  return null;
};


/**
 * Return the first Sentence in a Communication if it exists, or null
 *
 * @returns {Sentence|null}
 */
Communication.prototype.getFirstSentence = function() {
  // The first few Sections may be empty, so we need to iterate over Sections
  if (this.sectionList && this.sectionList.length) {
    for (var i = 0; i < this.sectionList.length; i++) {
      if (this.sectionList[i].sentenceList && this.sectionList[i].sentenceList.length) {
        return this.sectionList[i].sentenceList[0];
      }
    }
  }
  return null;
};


/**
 * Return the first Tokenization in a Communication if it exists, or null
 *
 * @returns {Tokenization|null}
 */
Communication.prototype.getFirstTokenization = function() {
  var firstSentence = this.getFirstSentence();
  if (firstSentence) {
    return firstSentence.tokenization;
  }
  else {
    return null;
  }
};


/**
 * Return the Sentence (or null) with the specified UUID
 *
 * @param {UUID} uuid
 * @returns {Sentence|null}
 */
Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.error("ERROR: getSentenceWithUUID() was not passed a valid UUID");
    return null;
  }

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
  console.error("ERROR: No Sentence found with UUID " + uuid.uuidString);
  return null;
};


/**
 * Return the SituationMention (or null) with the specified UUID
 *
 * @param {UUID} uuid
 * @returns {SituationMention|null}
 */
Communication.prototype.getSituationMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.error("ERROR: getSituationMentionWithUUID() was not passed a valid UUID");
    return null;
  }

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
  console.error("ERROR: No SituationMention found with UUID " + uuid.uuidString);
  return null;
};


/**
 * Return all Sections in a Communication as a (flat) list
 *
 * @returns {List}
 */
Communication.prototype.getSectionsAsList = function() {
  var sections = [];

  if (this.sectionList && this.sectionList.length) {
    for (var i = 0; i < this.sectionList.length; i++) {
      sections.push(this.sectionList[i]);
    }
  }

  return sections;
};


/**
 * Return all Sentences in a Communication as a (flat) list
 *
 * @returns {List}
 */
Communication.prototype.getSentencesAsList = function() {
  var sentences = [];

  if (this.sectionList && this.sectionList.length) {
    for (var i = 0; i < this.sectionList.length; i++) {
      if (this.sectionList[i].sentenceList && this.sectionList[i].sentenceList.length) {
        for (var j = 0; j < this.sectionList[i].sentenceList.length; j++) {
          sentences.push(this.sectionList[i].sentenceList[j]);
        }
      }
    }
  }

  return sentences;
};


/**
 * Return all Tokenizations in a Communication as a (flat) list
 *
 * @returns {List}
 */
Communication.prototype.getTokenizationsAsList = function() {
  var tokenizations = [];

  if (this.sectionList && this.sectionList.length) {
    for (var i = 0; i < this.sectionList.length; i++) {
      if (this.sectionList[i].sentenceList && this.sectionList[i].sentenceList.length) {
        for (var j = 0; j < this.sectionList[i].sentenceList.length; j++) {
          if (this.sectionList[i].sentenceList[j].tokenization) {
            tokenizations.push(this.sectionList[i].sentenceList[j].tokenization);
          }
        }
      }
    }
  }

  return tokenizations;
};

/**
 * Return the Tokenization (or null) with the specified UUID
 *
 * @param {UUID} uuid
 * @returns {Tokenization|null}
 */
Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.error("ERROR: getTokenizationWithUUID() was not passed a valid UUID");
    return null;
  }

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
  console.error("ERROR: No Tokenization found with UUID " + uuid.uuidString);
  return null;
};


/**
 * Get list of token text strings for the EntityMention specified by the UUID
 *
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


/**
 * Initialize Communication from a TJSONProtocol object created from a Communication.
 *
 * Thrift's TJSONProtocol is used to serialize objects to JSON.  The objects look
 * something like this:
 *
 *     {
 *       "1":{"str":"tests/testdata/serif_dog-bites-man.xml"},
 *       "2":{"rec":{"1":{"str":"a90d397a-560f-44a0-baae-c82a34e4be09"}}},
 *       "3":{"str":"CommunicationType.OTHER"},
 *       ...
 *     }
 *
 * @param {Object} commJSONObject - An object created from a Communication using TJSONProtocol
 * @returns {Communication} - This Communication
 */
Communication.prototype.initFromTJSONProtocolObject = function(commJSONObject) {
  // We convert the JSON object to a JSON string, and then
  // initFromTJSONProtocol converts the JSON string back to a JSON
  // object.  This is done deliberately.  We create a copy of the
  // original JSON object, and this copy is then destructively
  // modified by Communication.read().
  return this.initFromTJSONProtocolString(JSON.stringify(commJSONObject));
};


/**
 * Initialize Communication from a TJSONProtocol string created from a Communication
 *
 * @param {String} commJSONString - A JSON string created from a Communication using TJSONProtocol
 * @returns {Communication} - This Communication
 */
Communication.prototype.initFromTJSONProtocolString = function(commJSONString) {
  var commJSONObject = JSON.parse(commJSONString);
  var transport = new Thrift.Transport();
  var protocol = new Thrift.TJSONProtocol(transport);

  // The values for these protocol object fields was determined by
  // mucking around with the JavaScript debugger to figure out how
  // Thrift RPC calls used TJSONProtocol objects.
  protocol.rpos = [];

  // The object stored in protocol.rstack[] is destructively modified
  // by Communication.read()
  protocol.rstack = [commJSONObject];

  this.read(protocol);

  return this;
};


/**
 * Returns JSON object for Communication serialized using TJSONProtocol
 *
 * @returns {Object}
 */
Communication.prototype.toTJSONProtocolObject = function() {
  return JSON.parse(this.toTJSONProtocolString());
};


/**
 * Returns JSON string for Communication serialized using TJSONProtocol
 *
 * @returns {String}
 */
Communication.prototype.toTJSONProtocolString = function() {
  var transport = new Thrift.Transport();
  var protocol = new Thrift.TJSONProtocol(transport);
  protocol.tpos = [];
  protocol.tstack = [];
  this.write(protocol);

  return protocol.tstack[0];
};
