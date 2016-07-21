/*
  COMMUNICATION_FU
*/


/** Adds internal references between data structures contained in Communication
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


/** Return the Entity (or null) that has an EntityMention with the specified UUID
 * @param {UUID} uuid
 * @returns {Entity|null}
 */
Communication.prototype.getEntityForEntityMentionUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.log("ERROR: getEntityForEntityMentionUUID() was not passed a valid UUID");
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
  console.log("WARNING: No Entity found for EntityMention with UUID " + uuid.uuidString);
  return null;
};


/** Return the EntityMention (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {EntityMention|null}
 */
Communication.prototype.getEntityMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.log("ERROR: getEntityMentionWithUUID() was not passed a valid UUID");
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
  console.log("ERROR: No EntityMention found with UUID " + uuid.uuidString);
  return null;
};


/** Return the Sentence (or null) with the specified UUID
 * @param {UUID} uuid
 @ @returns {Sentence|null}
 */
Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.log("ERROR: getSentenceWithUUID() was not passed a valid UUID");
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
  console.log("ERROR: No Tokenization found with UUID " + uuid.uuidString);
  return null;
};


/** Return the SituationMention (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {SituationMention|null}
 */
Communication.prototype.getSituationMentionWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.log("ERROR: getSituationMentionWithUUID() was not passed a valid UUID");
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
  console.log("ERROR: No SituationMention found with UUID " + uuid.uuidString);
  return null;
};



/** Return the Tokenization (or null) with the specified UUID
 * @param {UUID} uuid
 * @returns {Tokenization|null}
 */
Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (!uuid || !uuid.uuidString) {
    console.log("ERROR: getTokenizationWithUUID() was not passed a valid UUID");
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


/** Initialize Communication from a TJSONProtocol object created from a Communication
 *
 * Thrift's TJSONProtocol is used to serialize objects to JSON.  The objects look
 * something like this:
 *    {
 *     "1":{"str":"tests/testdata/serif_dog-bites-man.xml"},
 *     "2":{"rec":{"1":{"str":"a90d397a-560f-44a0-baae-c82a34e4be09"}}},
 *     "3":{"str":"CommunicationType.OTHER"},
 *     ...
 *    }
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


/** Initialize Communication from a TJSONProtocol string created from a Communication
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


/** Returns JSON object for Communication serialized using TJSONProtocol
 * @returns {Object}
 */
Communication.prototype.toTJSONProtocolObject = function() {
  return JSON.parse(this.toTJSONProtocolString());
};


/** Returns JSON string for Communication serialized using TJSONProtocol
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


/** Generate a Concrete UUID
 * @returns {UUID}
 */
var generateUUID = function() {
  var uuid = new UUID();
  uuid.uuidString = generateUUIDString();
  return uuid;
};

/** Generate a UUID string
 *  Code based on the uuid.core.js script from MIT licensed project 'UUID.js':
 *    https://github.com/LiosK/UUID.js
 * @returns {String}
 */
var generateUUIDString = function() {
  /**
   * Returns an unsigned x-bit random integer.
   * @param {int} x A positive integer ranging from 0 to 53, inclusive.
   * @returns {int} An unsigned x-bit random integer (0 <= f(x) < 2^x).
   */
  function rand(x) {  // _getRandomInt
    if (x <   0) return NaN;
    if (x <= 30) return (0 | Math.random() * (1 <<      x));
    if (x <= 53) return (0 | Math.random() * (1 <<     30)) +
      (0 | Math.random() * (1 << x - 30)) * (1 << 30);
    return NaN;
  }

  /**
   * Converts an integer to a zero-filled hexadecimal string.
   * @param {int} num
   * @param {int} length
   * @returns {string}
   */
  function hex(num, length) { // _hexAligner
    var str = num.toString(16), i = length - str.length, z = "0";
    for (; i > 0; i >>>= 1, z += z) { if (i & 1) { str = z + str; } }
    return str;
  }

  return  hex(rand(32), 8) +    // time_low
    "-" +
    hex(rand(16), 4) +          // time_mid
    "-" +
    hex(0x4000 | rand(12), 4) + // time_hi_and_version
    "-" +
    hex(0x8000 | rand(14), 4) + // clock_seq_hi_and_reserved clock_seq_low
    "-" +
    hex(rand(48), 12);        // node
};
