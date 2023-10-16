const {Communication} = require('./communication_types');
const {Thrift} = require('thrift');

/**
 * Adds internal references between data structures contained in Communication.
 * 
 * Based on add_references_to_communication in concrete-python.  Adds the following properties
 * to concrete data types in a communication:
 *   - to each concrete.Argument:
 *     - entity: reference to Entity liked by entityId, or null
 *     - situation: reference to Situation liked by situationId, or null
 *   - to each concrete.EntityMention:
 *     - childMentionList: list of child EntityMentions corresponding to childMentionIdList
 *     - parentMention: reference to parent EntityMention, or null
 *     - entityMentionSet: reference to enclosing EntityMentionSet
 *   - to each concrete.Entity:
 *     - mentionList: list of EntityMentions corresponding to mentionIdList
 *     - entitySet: reference to enclosing EntitySet
 *   - to each concrete.Communication:
 *     - entityForUUID: map from entity UUID strings to entities
 *     - entityMentionForUUID: map from entity mention UUID strings to entity mentions
 *     - sectionForUUID: map from section UUID strings to sections
 *     - sentenceForUUID: map from sentence UUID strings to sentences
 *     - situationForUUID: map from situation UUID strings to situations
 *     - situationMentionForUUID: map from situation mention UUID strings to situation mentions
 *     - tokenizationForUUID: map from tokenization UUID strings to tokenizations
 *   - to each concrete.MentionArgument:
 *     - entityMention: reference to EntityMention liked by entityMentionId, or null
 *     - situationMention: reference to SituationMention liked by situationMentionId, or null
 *   - to each concrete.Section:
 *     - communication: reference to the enclosing Communication
 *   - to each concrete.Sentence:
 *     - section: reference to the enclosing Section
 *   - to each concrete.SituationMention:
 *     - situationMentionSet: reference to enclosing SituationMentionSet
 *   - to each concrete.Situation:
 *     - mentionList: list of EntityMentions corresponding to mentionIdList
 *     - situationSet: reference to enclosing SituationSet
 *   - to each concrete.Tokenization:
 *     - sentence: reference to the enclosing Sentence
 *   - to each concrete.TokenRefSequence:
 *     - tokenization: reference to the Tokenization corresponding to tokenizationId
 *
 * @function concrete.communication.Communication.prototype.addInternalReferences
 * @returns {object} Object with references to Communication-level maps (entityForUUID, entityMentionForUUID,
 *                   sectionForUUID, sentenceForUUID, situationForUUID, situationMentionForUUID, tokenizationForUUID),
 *                   mainly intended for TypeScript consumers.  JavaScript consumers can access these maps directly
 *                   on the Communication.
 */
Communication.prototype.addInternalReferences = function() {
  this.entityForUUID = {};
  this.entityMentionForUUID = {};
  this.sectionForUUID = {};
  this.sentenceForUUID = {};
  this.situationForUUID = {};
  this.situationMentionForUUID = {};
  this.tokenizationForUUID = {};

  (this.sectionList ? this.sectionList : []).forEach((section) => {
    this.sectionForUUID[section.uuid.uuidString] = section;
    // We add both a 'comm' and 'communication' field to each section.  We
    // originally only added 'comm', but 'communication' is arguably more
    // consistent.  We keep both variable names to avoid breaking existing code.
    section.comm = this;
    section.communication = this;
    if (section.sentenceList) {
      section.sentenceList.forEach((sentence) => {
        this.sentenceForUUID[sentence.uuid.uuidString] = sentence;
        sentence.section = section;
        if (sentence.tokenization) {
          this.tokenizationForUUID[sentence.tokenization.uuid.uuidString] = sentence.tokenization;
          sentence.tokenization.sentence = sentence;
        }
      });
    }
  });

  (this.entityMentionSetList || []).forEach((entityMentionSet) => {
    entityMentionSet.mentionList.forEach((entityMention) => {
      this.entityMentionForUUID[entityMention.uuid.uuidString] = entityMention;
      entityMention.tokens.tokenization = this.tokenizationForUUID[
        entityMention.tokens.tokenizationId.uuidString
      ] || null;
      entityMention.childMentionList = [];
      entityMention.parentMention = null;
      entityMention.entityMentionSet = entityMentionSet;
    });
    entityMentionSet.mentionList.forEach((entityMention) => {
      if (entityMention.childMentionIdList) {
        entityMention.childMentionIdList.forEach((childMentionId) => {
          const childMention = this.entityMentionForUUID[childMentionId.uuidString];
          childMention.parentMention = entityMention;
          entityMention.childMentionList.push(childMention);
        });
      }
    });
  });

  (this.entitySetList || []).forEach((entitySet) => {
    entitySet.entityList.forEach((entity) => {
      this.entityForUUID[entity.uuid.uuidString] = entity;
      entity.mentionList = entity.mentionIdList
        .map((mentionId) => this.entityMentionForUUID[mentionId.uuidString]);
      entity.entitySet = entitySet;
    });
  });

  (this.situationMentionSetList || []).forEach((situationMentionSet) => {
    situationMentionSet.mentionList.forEach((situationMention) => {
      this.situationMentionForUUID[situationMention.uuid.uuidString] = situationMention;
      (situationMention.argumentList || []).forEach((argument) => {
        argument.entityMention = argument.entityMentionId ?
          this.entityMentionForUUID[argument.entityMentionId.uuidString] :
          null;
        argument.situationMention = argument.situationMentionId ?
          this.situationMentionForUUID[argument.situationMentionId.uuidString] :
          null;
        if (argument.tokens) {
          argument.tokens.tokenization = this.tokenizationForUUID[
            argument.tokens.tokenizationId.uuidString
          ];
        }
      });
      if (situationMention.tokens) {
        situationMention.tokens.tokenization = this.tokenizationForUUID[
          situationMention.tokens.tokenizationId.uuidString
        ];
      }
      situationMention.situationMentionSet = situationMentionSet;
    });
  });

  (this.situationSetList || []).forEach((situationSet) => {
    situationSet.situationList.forEach((situation) => {
      this.situationForUUID[situation.uuid.uuidString] = situation;
      situation.mentionList = situation.mentionIdList ?
        situation.mentionIdList
          .map((mentionId) => this.situationMentionForUUID[mentionId.uuidString]) :
        null;
      (situation.argumentList || []).forEach((argument) => {
        argument.entity = argument.entityId ?
          this.entityForUUID[argument.entityId.uuidString] :
          null;
        argument.situation = argument.situationId ?
          this.situationForUUID[argument.situationId.uuidString] :
          null;
      });
      situation.situationSet = situationSet;
    });
  });

  return {
    entityForUUID: this.entityForUUID,
    entityMentionForUUID: this.entityMentionForUUID,
    sectionForUUID: this.sectionForUUID,
    sentenceForUUID: this.sentenceForUUID,
    situationForUUID: this.situationForUUID,
    situationMentionForUUID: this.situationMentionForUUID,
    tokenizationForUUID: this.tokenizationForUUID,
  };
};


/**
 * Return the Entity (or null) that has an EntityMention with the specified UUID
 *
 * @function concrete.communication.Communication.prototype.getEntityForEntityMentionUUID
 * @param {UUID} uuid
 * @returns {Entity|null}
 */
Communication.prototype.getEntityForEntityMentionUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    throw new Error("getEntityForEntityMentionUUID() was not passed a valid UUID");
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
  return undefined;
};


/**
 * Return the EntityMentionSet in the Communication with the specified toolname
 *
 * @function concrete.communication.Communication.prototype.getEntityMentionSetWithToolname
 * @param {string} toolname
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
  return undefined;
};


/**
 * Return the EntityMention (or null) with the specified UUID
 *
 * @function concrete.communication.Communication.prototype.getEntityMentionWithUUID
 * @param {UUID} uuid
 * @returns {EntityMention|null}
 */
Communication.prototype.getEntityMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    throw new Error("getEntityMentionWithUUID() was not passed a valid UUID");
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
  return undefined;
};


/**
 * Return the Entity (or null) that has the specified Entity ID
 *
 * @function concrete.communication.Communication.prototype.getEntityWithEntityId
 * @param {string} entityId
 * @returns {Entity|null}
 */
Communication.prototype.getEntityWithEntityId = function(entityId) {
  if (!entityId) {
    throw new Error("getEntityWithEntityId() was not passed a valid entityId");
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
  return undefined;
};


/**
 * Return the first Sentence in a Communication if it exists, or null
 *
 * @function concrete.communication.Communication.prototype.getFirstSentence
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
  return undefined;
};


/**
 * Return the first Tokenization in a Communication if it exists, or null
 *
 * @function concrete.communication.Communication.prototype.getFirstTokenization
 * @returns {Tokenization|null}
 */
Communication.prototype.getFirstTokenization = function() {
  var firstSentence = this.getFirstSentence();
  return firstSentence ? firstSentence.tokenization : undefined;
};


/**
 * Return the Sentence (or null) with the specified UUID
 *
 * @function concrete.communication.Communication.prototype.getSentenceWithUUID
 * @param {UUID} uuid
 * @returns {Sentence|null}
 */
Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    throw new Error("getSentenceWithUUID() was not passed a valid UUID");
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
  return undefined;
};


/**
 * Return the SituationMention (or null) with the specified UUID
 *
 * @function concrete.communication.Communication.prototype.getSituationMentionWithUUID
 * @param {UUID} uuid
 * @returns {SituationMention|null}
 */
Communication.prototype.getSituationMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    throw new Error("getSituationMentionWithUUID() was not passed a valid UUID");
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
  return undefined;
};


/**
 * Return all Sections in a Communication as a (flat) list
 *
 * @function concrete.communication.Communication.prototype.getSectionsAsList
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
 * @function concrete.communication.Communication.prototype.getSentencesAsList
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
 * @function concrete.communication.Communication.prototype.getTokenizationsAsList
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
 * @function concrete.communication.Communication.prototype.getTokenizationWithUUID
 * @param {UUID} uuid
 * @returns {Tokenization|null}
 */
Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    throw new Error("getTokenizationWithUUID() was not passed a valid UUID");
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
  return undefined;
};


/**
 * Get list of token text strings for the EntityMention specified by the UUID
 *
 * @function concrete.communication.Communication.prototype.getTokensForEntityMentionID
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
 * @function concrete.communication.Communication.prototype.initFromTJSONProtocolObject
 * @param {object} commJSONObject - An object created from a Communication using TJSONProtocol
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
 * @function concrete.communication.Communication.prototype.initFromTJSONProtocolString
 * @param {string} commJSONString - A JSON string created from a Communication using TJSONProtocol
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
 * @function concrete.communication.Communication.prototype.toTJSONProtocolObject
 * @returns {object}
 */
Communication.prototype.toTJSONProtocolObject = function() {
  return JSON.parse(this.toTJSONProtocolString());
};


/**
 * Returns JSON string for Communication serialized using TJSONProtocol
 *
 * @function concrete.communication.Communication.prototype.toTJSONProtocolString
 * @returns {string}
 */
Communication.prototype.toTJSONProtocolString = function() {
  var transport = new Thrift.Transport();
  var protocol = new Thrift.TJSONProtocol(transport);
  protocol.tpos = [];
  protocol.tstack = [];
  this.write(protocol);

  return protocol.tstack[0];
};
