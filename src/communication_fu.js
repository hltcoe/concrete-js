/*
  COMMUNICATION_FU
*/

Communication.prototype.getEntityMentionWithUUID = function(uuid) {
  if (this.entityMentionSets) {
    for (var entityMentionSetIndex in this.entityMentionSets) {
      if (this.entityMentionSets[entityMentionSetIndex].mentionSet) {
        for (var mentionSetIndex in this.entityMentionSets[entityMentionSetIndex].mentionSet) {
          var entityMention = this.entityMentionSets[entityMentionSetIndex].mentionSet[mentionSetIndex];
          if (entityMention.uuid == uuid) {
            return entityMention;
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No EntityMention found with UUID " + uuid);
}


Communication.prototype.getSentenceWithUUID = function(uuid) {
  if (this.sectionSegmentations[0].sectionList) {
    for (var sectionListIndex in this.sectionSegmentations[0].sectionList) {
      if (this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation) {
        for (var sentenceIndex in this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation[0].sentenceList) {
          var sentence = this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation[0].sentenceList[sentenceIndex];
          if (sentence.uuid == uuid) {
            return sentence;
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid);
}


Communication.prototype.getTokenizationWithUUID = function(uuid) {
  if (this.sectionSegmentations[0].sectionList) {
    for (var sectionListIndex in this.sectionSegmentations[0].sectionList) {
      if (this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation) {
        for (var sentenceIndex in this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation[0].sentenceList) {
          var sentence = this.sectionSegmentations[0].sectionList[sectionListIndex].sentenceSegmentation[0].sentenceList[sentenceIndex];
          for (var tokenizationListIndex in sentence.tokenizationList) {
            if (sentence.tokenizationList[tokenizationListIndex].uuid == uuid) {
              return sentence.tokenizationList[tokenizationListIndex];
            }
          }
        }
      }
    }
  }
  // TODO: Error handling if no matching UUID could be found
  console.log("ERROR: No Tokenization found with UUID " + uuid);
}


Communication.prototype.getTokensForEntityMentionID = function(mentionId) {
  var entityMention = this.getEntityMentionWithUUID(mentionId);
  var tokenization = this.getTokenizationWithUUID(entityMention.tokens.tokenizationId);

  var tokens = new Array();

  for (var tokenIndex in entityMention.tokens.tokenIndexList) {
    tokens.push(tokenization.tokenList[entityMention.tokens.tokenIndexList[tokenIndex]].text);
  }
  return tokens;
}
