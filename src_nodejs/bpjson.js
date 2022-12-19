const {concat, groupBy, last, range, sortBy, sortedUniqBy, times} = require("lodash");
const {generateUUID} = require("./util");

const concrete = require("./concrete");

function unNullifyList(list) {
  return list ? list : [];
}

function unNullifyDict(dict) {
  return dict ? dict : {};
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

function argumentsToSlot(role, args, entitiesByUUID, eventSituationsByUUID) {
  if (! args.every((argument) => argument.role === role)) {
    throw new Error(`Specified arguments do not all have role ${role}`);
  }
  if (args.some((argument) => argument.entityId && argument.situationId)) {
    throw new Error("Some arguments have both entity and situation fills");
  }
  if (args.length > 1 || args.some((argument) => argument.entityId || argument.situationId)) {
    if (args.some((argument) => !argument.entityId && !argument.situationId)) {
      throw new Error("Multiple arguments for role but not all have an entity or situation fill");
    }
    return args.map((argument) => (
      argument.entityId ?
      {ssid: entitiesByUUID[argument.entityId.uuidString].id} :
      {"event-id": eventSituationsByUUID[argument.situationId.uuidString].id}
    ));
  } else {
    const argument = listToScalar(args, "Scalar arguments");
    const property = listToScalar(argument.propertyList, "Scalar argument property");
    return property.value;
  }
}

function templateToArguments(template, entitiesById, eventSituationsById) {
  const args = [];
  if (template["template-anchor"]) {
    args.push(new concrete.situations.Argument({
      role: "template-anchor",
      entityId: entitiesById[template["template-anchor"]].uuid,
    }));
  }
  Object.entries(template)
    .filter(([key]) => !["template-anchor", "template-id", "template-type"].includes(key))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((slotFill) =>
          args.push(new concrete.situations.Argument(
            slotFill.ssid ?
            {role: key, entityId: entitiesById[slotFill.ssid].uuid} :
            {role: key, situationId: eventSituationsById[slotFill["event-id"]].uuid}
          ))
        );
      } else {
        args.push(new concrete.situations.Argument({
          role: key,
          propertyList: [new concrete.situations.Property({
            value: String(value),
            metadata: generateAnnotationMetadata(),
          })],
        }));
      }
    });
  return args;
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

  const corpusEntry = {
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

  const entitiesByUUID = {};
  const entityMentionsByUUID = {};
  if (communication.entitySetList && communication.entityMentionSetList) {
    const spanSets = {};
    corpusEntry["annotation-sets"] = {"basic-events": {"span-sets": spanSets}};

    const entitySet = listToScalar(
      communication.entitySetList,
      "Communication.entitySetList");
    const entityMentionSet = listToScalar(
      communication.entityMentionSetList,
      "Communication.entityMentionSetList");

    entityMentionSet.mentionList.forEach((entityMention) => (
      entityMentionsByUUID[entityMention.uuid.uuidString] = entityMention
    ));
    const entityDataList = entitySet.entityList
      .map((entity, entityIndex) => ({
        entity,
        entityId: entity.id ? entity.id : `ss-${entityIndex}`
      }));
    entityDataList.forEach(({entity}) => (
      entitiesByUUID[entity.uuid.uuidString] = entity
    ));
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
  }

  if (communication.situationSetList) {
    if (! corpusEntry["annotation-sets"]) {
      corpusEntry["annotation-sets"] = {"basic-events": {}};
    }
    const events = {};
    corpusEntry["annotation-sets"]["basic-events"].events = events;
    const granularTemplates = {};
    corpusEntry["annotation-sets"]["basic-events"]["granular-templates"] = granularTemplates;

    const situationSet = listToScalar(
      communication.situationSetList,
      "Communication.situationSetList");

    const eventSituationDataList = situationSet.situationList
      .filter((situation) => situation.situationType === "EVENT")
      .map((situation, situationIndex) => ({
        situation,
        situationId: situation.id ? situation.id : `event-${situationIndex}`
      }));
    const eventSituationsByUUID = {};
    eventSituationDataList.forEach(({situation}) => (
      eventSituationsByUUID[situation.uuid.uuidString] = situation
    ));
    eventSituationDataList.forEach(({situation, situationId}) => (
      events[situationId] = {
        agents: unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "agent")
          .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
        anchors: listToScalar(
          unNullifyList(situation.argumentList)
            .filter((argument) => argument.role === "anchor")
            .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
          "Event anchor arguments"
        ),
        "eventid": situationId,
        "event-type": situation.situationKind,
        patients: unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "patient")
          .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
        "ref-events": unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "ref-event")
          .map((argument) => eventSituationsByUUID[argument.situationId.uuidString].id),
        "state-of-affairs": false,
      }
    ));

    const templateSituationDataList = situationSet.situationList
      .filter((situation) => situation.situationType === "EVENT_TEMPLATE")
      .map((situation, situationIndex) => ({
        situation,
        situationId: situation.id ? situation.id : `template-${situationIndex}`
      }));
    templateSituationDataList.forEach(({situation, situationId}) => {
      granularTemplates[situationId] = {
        "template-anchor": listToScalar(
          unNullifyList(situation.argumentList)
            .filter((argument) => argument.role === "template-anchor")
            .map((argument) => entitiesByUUID[argument.entityId.uuidString].id),
          "Template anchor arguments"
        ),
        "template-id": situationId,
        "template-type": situation.situationKind,
      };
      Object.entries(groupBy(
        unNullifyList(situation.argumentList)
          .filter((argument) => argument.role !== "template-anchor"),
        "role"
      )).forEach(([role, args]) => (
        granularTemplates[situationId][role] = argumentsToSlot(
          role, args, entitiesByUUID, eventSituationsByUUID
        )
      ));
    });
  }

  return corpusEntry;
}

function convertBPJsonToConcrete(corpusEntry) {
  const communicationParams = {
    id: corpusEntry["entry-id"],
    metadata: generateAnnotationMetadata(),
    sectionList: Object.entries(groupBy(
      sortBy(corpusEntry["segment-sections"], ["start", "end"]),
      "structural-element"
    )).map(([kind, sectionGroup]) => new concrete.structure.Section({
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
    text: corpusEntry["segment-text"],
    type: corpusEntry["segment-type"],
    uuid: generateUUID(),
  };

  const annotationSets = unNullifyDict(corpusEntry["annotation-sets"]);
  const basicEvents = unNullifyDict(annotationSets["basic-events"]);

  const entitiesById = {};
  const eventSituationsById = {};

  if (basicEvents["span-sets"]) {
    const entityMentionSet = new concrete.entities.EntityMentionSet({
      mentionList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    });
    communicationParams.entityMentionSetList = [entityMentionSet];
    const entitySet = new concrete.entities.EntitySet({
      entityList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    });
    communicationParams.entitySetList = [entitySet];

    const flatTokenData = communicationParams.sectionList.flatMap((section) =>
      section.sentenceList.flatMap((sentence) =>
        sentence.tokenization.tokenList.tokenList.map((token) => ({token, sentence, section}))
      )
    );

    Object.values(unNullifyDict(basicEvents["span-sets"])).forEach((spanSet) => {
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

    entitySet.entityList.forEach((entity) => (entitiesById[entity.id] = entity));
  }

  if (basicEvents.events || basicEvents["granular-templates"]) {
    const situationSet = new concrete.situations.SituationSet({
      situationList: [],
      metadata: generateAnnotationMetadata(),
      uuid: generateUUID(),
    });
    communicationParams.situationSetList = [situationSet];

    Object.values(unNullifyDict(basicEvents.events)).forEach((event) =>
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
          }))
        ),
        id: event.eventid,
        situationKind: event["event-type"],
        situationType: "EVENT",
        uuid: generateUUID(),
      }))
    );

    situationSet.situationList.forEach((situation) => (
      eventSituationsById[situation.id] = situation
    ));

    Object.values(unNullifyDict(basicEvents.events)).forEach((event) =>
      eventSituationsById[event.eventid].argumentList.push(...(
        event["ref-events"].map((eventid) => new concrete.situations.Argument({
          situationId: eventSituationsById[eventid].uuid,
          role: "ref-event",
        }))
      ))
    );

    Object.values(unNullifyDict(basicEvents["granular-templates"])).forEach((template) =>
      situationSet.situationList.push(new concrete.situations.Situation({
        argumentList: templateToArguments(template, entitiesById, eventSituationsById),
        id: template["template-id"],
        situationKind: template["template-type"],
        situationType: "EVENT_TEMPLATE",
        uuid: generateUUID(),
      }))
    );
  }

  return new concrete.communication.Communication(communicationParams);
}

module.exports = {convertConcreteToBPJson, convertBPJsonToConcrete};