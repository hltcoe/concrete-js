const {concat, groupBy, last, range, sortBy, sortedUniqBy, times} = require("lodash");
const {v4: uuidv4} = require("uuid");
const { ServicesException } = require("../dist_nodejs/services_types");

const concrete = require("./concrete");

function unNullifyList(list) {
  return list ? list : [];
}

function generateUUID() {
  return new concrete.uuid.UUID({uuidString: uuidv4()});
}

function generateAnnotationMetadata() {
  return new concrete.metadata.AnnotationMetadata({
    kBest: 1,
    timestamp: 1,
    tool: "stub",
  });
}

function getTokens(tokenization) {
  return tokenization.tokenList ? tokenization.tokenList.tokenList : [];
}

function listToScalar(list, listName="List") {
  if (list.length === 0) {
    throw new Error(`${listName} is empty`);
  } else if (list.length > 1) {
    throw new Error(`${listName} has more than one element`);
  } else {
    return list[0];
  }
}

function convertConcreteToBPJson(communication) {
  const tok2char = unNullifyList(communication.sectionList).flatMap((section) =>
    unNullifyList(section.sentenceList).flatMap((sentence) =>
      getTokens(sentence.tokenization).map((token) =>
        range(token.textSpan.start, token.textSpan.ending)
      )
    )
  );
  const char2tok = times(communication.text.length).map(() => []);
  tok2char.forEach((tokenTextIndices, globalTokenIndex) =>
    tokenTextIndices.forEach((textIndex) =>
      char2tok[textIndex].push(globalTokenIndex)
    )
  );

  const tokenizationDataByUUID = {};
  let tokenizationTokenOffset = 0;
  unNullifyList(communication.sectionList).forEach((section) =>
    unNullifyList(section.sentenceList).forEach((sentence) => {
      tokenizationDataByUUID[sentence.tokenization.uuid.uuidString] = {
        tokenization: sentence.tokenization,
        tokenOffset: tokenizationTokenOffset,
      };
      tokenizationTokenOffset += getTokens(sentence.tokenization).length;
    })
  );

  const flatTokenData = communication.sectionList.flatMap((section) =>
    section.sentenceList.flatMap((sentence) =>
      getTokens(sentence.tokenization).map((token) => ({token, sentence, section}))
    )
  );

  const entitySet = listToScalar(
    unNullifyList(communication.entitySetList),
    "Communication.entitySetList");
  const entityMentionSet = listToScalar(
    unNullifyList(communication.entityMentionSetList),
    "Communication.entityMentionSetList");
  const entityMentionsByUUID = {};
  entityMentionSet.mentionList.forEach((entityMention) => (
    entityMentionsByUUID[entityMention.uuid.uuidString] = entityMention
  ));
  const entityDataList = entitySet.entityList
    .map((entity, entityIndex) => ({
      entity,
      entityId: entity.id ? entity.id : `ss-${entityIndex}`
    }));
  const entitiesByUUID = {};
  entityDataList.forEach(({entity}) => (
    entitiesByUUID[entity.uuid.uuidString] = entity
  ));
  const spanSets = {};
  entityDataList.forEach(({entity, entityId}) => (
    spanSets[entityId] = {
      ssid: entityId,
      spans: entity.mentionIdList
        .map((mentionUUID) => entityMentionsByUUID[mentionUUID.uuidString])
        .map((entityMention) => ({
          text: entityMention.text,
          tokenizationData: tokenizationDataByUUID[entityMention.tokens.tokenizationId.uuidString],
          tokenIndexList: entityMention.tokens.tokenIndexList,
        }))
        .map(({text, tokenizationData, tokenIndexList}) => ({
          end: getTokens(tokenizationData.tokenization)[last(tokenIndexList)].textSpan.ending,
          start: getTokens(tokenizationData.tokenization)[tokenIndexList[0]].textSpan.start,
          text,
          tokenizationData,
          tokenIndexList,
        }))
        .map(({end, start, text, tokenizationData, tokenIndexList}) => ({
          end,
          "end-token": tokenizationData.tokenOffset + last(tokenIndexList),
          start,
          "start-token": tokenizationData.tokenOffset + tokenIndexList[0],
          string: text ? text : communication.text.substring(start, end),
          "string-tok": tokenIndexList
            .map((tokenIndex) => getTokens(tokenizationData.tokenization)[tokenIndex])
            .map((token) =>
              token.text ?
                token.text :
                communication.text.substring(token.textSpan.start, token.textSpan.ending)
            ),
        }))
    }
  ));

  const situationSet = listToScalar(
    unNullifyList(communication.situationSetList),
    "Communication.situationSetList");
  const situationDataList = situationSet.situationList
    .filter((situation) => situation.situationType === "EVENT")
    .map((situation, situationIndex) => ({
      situation,
      situationId: situation.id ? situation.id : `event-${situationIndex}`
    }));
  const situationsByUUID = {};
  situationDataList.forEach(({situation}) => (
    situationsByUUID[situation.uuid.uuidString] = situation
  ));
  const events = {};
  situationDataList.forEach(({situation, situationId}) => (
    events[situationId] = {
      agents: unNullifyList(situation.argumentList)
        .filter((argument) => argument.role === "agent")
        .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
      anchors: listToScalar(
        unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "anchor")
          .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
        "Anchor arguments"
      ),
      "eventid": situationId,
      "event-type": situation.situationKind,
      patients: unNullifyList(situation.argumentList)
        .filter((argument) => argument.role === "patient")
        .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
      "ref-events": unNullifyList(situation.argumentList)
        .filter((argument) => argument.role === "ref-event")
        .map((argument) => situationsByUUID[argument.situationId.uuidString].id),
      "state-of-affairs": false,
    }
  ));

  const granularTemplates = {};

  return {
    "annotation-sets": {
      "basic-events": {
        events,
        "granular-templates": granularTemplates,
        "span-sets": spanSets,
      },
    },
    char2tok,
    "doc-id": communication.id,
    "entry-id": communication.id,
    "segment-sections": unNullifyList(communication.sectionList).flatMap((section) =>
      unNullifyList(section.sentenceList).map((sentence) => ({
        end: sentence.textSpan.ending,
        start: sentence.textSpan.start,
        "structural-element": section.kind,
      }))
    ),
    "segment-text": communication.text,
    "segment-text-tok": tok2char.map((tokenTextIndices) =>
      tokenTextIndices
        .map((textIndex) => communication.text[textIndex])
        .join("")),
    "segment-type": communication.type,
    tok2char,
  };
}

function convertBPJsonToConcrete(corpusEntry) {
  const communicationParams = {
    id: corpusEntry["entry-id"],
    entityMentionSetList: [new concrete.entities.EntityMentionSet({
      mentionList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    })],
    entitySetList: [new concrete.entities.EntitySet({
      entityList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    })],
    metadata: generateAnnotationMetadata(),
    sectionList: Object.entries(
      groupBy(
        sortBy(corpusEntry["segment-sections"], ["start", "end"]),
        "structural-element"
      )
    ).map(([kind, sectionGroup]) => new concrete.structure.Section({
      kind,
      sentenceList: sectionGroup.map((section) => new concrete.structure.Sentence({
        textSpan: new concrete.spans.TextSpan({
          ending: section.end,
          start: section.start,
        }),
        tokenization: new concrete.structure.Tokenization({
          kind: concrete.structure.TokenizationKind.TOKEN_LIST,
          metadata: generateAnnotationMetadata(),
          tokenList: new concrete.structure.TokenList({
            tokenList: sortedUniqBy(sortBy(
              range(section.start, section.end).flatMap((textIndex) => corpusEntry.char2tok[textIndex])
            ))
              .map((globalTokenIndex) => corpusEntry.tok2char[globalTokenIndex])
              .map((tokenTextIndices, tokenIndex) => new concrete.structure.Token({
                text: tokenTextIndices.map((textIndex) => corpusEntry["segment-text"][textIndex]).join(""),
                textSpan: new concrete.spans.TextSpan({
                  ending: last(tokenTextIndices) + 1,
                  start: tokenTextIndices[0],
                }),
                tokenIndex,
              })),
          }),
          uuid: generateUUID(),
        }),
        uuid: generateUUID(),
      })),
      textSpan: new concrete.spans.TextSpan({
        ending: last(sectionGroup).end,
        start: sectionGroup[0].start,
      }),
      uuid: generateUUID(),
    })),
    situationSetList: [new concrete.situations.SituationSet({
      situationList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    })],
    text: corpusEntry["segment-text"],
    type: corpusEntry["segment-type"],
    uuid: generateUUID(),
  };

  const entitySet = listToScalar(
    communicationParams.entitySetList,
    "Constructed Communication.entitySetList");
  const entityMentionSet = listToScalar(
    communicationParams.entityMentionSetList,
    "Constructed Communication.entityMentionSetList");
  const flatTokenData = communicationParams.sectionList.flatMap((section) =>
    section.sentenceList.flatMap((sentence) =>
      sentence.tokenization.tokenList.tokenList.map((token) => ({token, sentence, section}))
    )
  );
  Object.values(corpusEntry["annotation-sets"]["basic-events"]["span-sets"]).forEach((spanSet) => {
    const mentions = spanSet.spans
      .map((span) => range(span["start-token"], span["end-token"] + 1)
        .map((globalTokenIndex) => flatTokenData[globalTokenIndex])
      )
      .map((spanTokenData) => {
        const tokenizationUUIDs = sortedUniqBy(
          spanTokenData.map(({sentence}) => sentence.tokenization.uuid),
          "uuidString"
        );
        const tokenizationId = listToScalar(tokenizationUUIDs, "Tokenizations used by span");
        const tokenIndexList = spanTokenData.map(({token}) => token.tokenIndex);
        return new concrete.entities.EntityMention({
          tokens: new concrete.structure.TokenRefSequence({tokenizationId, tokenIndexList}),
          uuid: generateUUID(),
        });
      });
    entitySet.entityList.push(new concrete.entities.Entity({
      id: spanSet.ssid,
      mentionIdList: mentions.map((mention) => mention.uuid),
      uuid: generateUUID(),
    }));
    mentions.forEach((mention) => entityMentionSet.mentionList.push(mention));
  });

  const entitiesById = {};
  entitySet.entityList.forEach((entity) => (entitiesById[entity.id] = entity));

  const situationSet = listToScalar(
    communicationParams.situationSetList,
    "Constructed Communication.situationSetList");
  Object.values(corpusEntry["annotation-sets"]["basic-events"]["events"]).forEach((event) =>
    situationSet.situationList.push(new concrete.situations.Situation({
      argumentList: concat(
        event.agents.map((ssid) => new concrete.situations.Argument({
          entityId: entitiesById[ssid].uuid,
          role: "agent",
        })),
        new concrete.situations.Argument({
          entityId: entitiesById[event.anchors].uuid,
          role: "anchor",
        }),
        event.patients.map((ssid) => new concrete.situations.Argument({
          entityId: entitiesById[ssid].uuid,
          role: "patient",
        })),
      ),
      id: event.eventid,
      situationKind: event["event-type"],
      situationType: "EVENT",
      uuid: generateUUID(),
    }))
  );

  const situationsById = {};
  situationSet.situationList.forEach((situation) => (situationsById[situation.id] = situation));
  Object.values(corpusEntry["annotation-sets"]["basic-events"]["events"]).forEach((event) =>
    situationsById[event.eventid].argumentList.push(...(
      event["ref-events"].map((eventid) => new concrete.situations.Argument({
        situationId: situationsById[eventid].uuid,
        role: "ref-event",
      }))
    ))
  );

  return new concrete.communication.Communication(communicationParams);
}

module.exports = {convertConcreteToBPJson, convertBPJsonToConcrete};