const {concat, groupBy, last, range, sortBy, sortedUniqBy, startCase, times} = require("lodash");
const {generateUUID} = require("./util");

const concrete = require("./concrete");

const BPJSON_SECTION_KINDS = [
  "Byline",
  "Dateline",
  "Headline",
  "Ignore",
  "Section_Header",
  "Sentence",
  "Story-Lead",
];

const DEFAULT_TEMPLATE_SITUATION_TYPE = "EVENT_TEMPLATE";

function unNullifyList(list) {
  return list ? list : [];
}

function unNullifyDict(dict) {
  return dict ? dict : {};
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

function normalizeSectionKind(kind) {
  return kind.toLowerCase();
}

function denormalizeSectionKind(kind) {
  // startCase, but preserve - and _ separators
  return normalizeSectionKind(kind).split("-").map((substr) =>
    substr.split("_").map(startCase).join("_")
  ).join("-");
}

function equivalentSectionKindOrder(kind) {
  // return desired order of section kinds in tree when section spans are equivalent
  // (lower order <=> earlier in tree)
  const normalizedKind = normalizeSectionKind(kind);
  // temp_sentence_wrapper is a special section kind we use internally and do not expose to caller
  const orderedKinds = ["section", "section_header", "story-lead", "*", "ignore", "temp_sentence_wrapper", "sentence"];
  const kindIndex = orderedKinds.indexOf(normalizedKind);
  return kindIndex >= 0 ? kindIndex : orderedKinds.indexOf("*");
}

function computeTokenSpanFromTextSpan(tok2char, textSpan) {
  const startTokenIndex = tok2char.findIndex((textIndices) => textIndices[0] === textSpan[0]);
  const lastTokenIndex = tok2char.findIndex((textIndices) => last(textIndices) === textSpan[1]);
  if (startTokenIndex >= 0 && lastTokenIndex >= 0) {
    return [startTokenIndex, lastTokenIndex];
  } else {
    throw new Error(`Could not find token spans matching text span ${textSpan}`);
  }
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

function normalizeSituationType(type) {
  return type.toUpperCase();
}

function normalizeArgumentRole(role) {
  return role.toLowerCase();
}

function argumentsToSlot(role, args, entityIdsByUUID, eventSituationIdsByUUID) {
  if (! args.every((argument) => normalizeArgumentRole(argument.role) === normalizeArgumentRole(role))) {
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
      {ssid: entityIdsByUUID[argument.entityId.uuidString]} :
      {"event-id": eventSituationIdsByUUID[argument.situationId.uuidString]}
    ));
  } else {
    const argument = listToScalar(args, "Scalar argument list");
    const property = listToScalar(argument.propertyList, "Scalar argument property list");
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
          propertyList: [new concrete.property.Property({
            value: String(value),
            metadata: generateAnnotationMetadata(),
          })],
        }));
      }
    });
  return args;
}

function convertConcreteToBPJson(communication,
                                 templateSituationType=DEFAULT_TEMPLATE_SITUATION_TYPE,
                                 entitySetTool=null,
                                 situationSetTool=null) {
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
    "segment-sections": concat(
      unNullifyList(communication.sectionList)
        .filter((section) => normalizeSectionKind(section.kind) != "ignore")
        .flatMap((section) =>
          unNullifyList(section.sentenceList).map((sentence) => ({
            end: sentence.textSpan.ending,
            start: sentence.textSpan.start,
            "structural-element": "Sentence",
          }))
      ),
      unNullifyList(communication.sectionList)
        .filter((section) => BPJSON_SECTION_KINDS.includes(denormalizeSectionKind(section.kind)))
        .map((section) => ({
          end: section.textSpan.ending,
          start: section.textSpan.start,
          "structural-element": denormalizeSectionKind(section.kind),
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

  const entityIdsByUUID = {};
  const entityMentionsByUUID = {};
  if (communication.entitySetList && communication.entityMentionSetList) {
    const spanSets = {};
    corpusEntry["annotation-sets"] = {"basic-events": {"span-sets": spanSets}};

    (communication.entityMentionSetList ? communication.entityMentionSetList : []).forEach((entityMentionSet) =>
      entityMentionSet.mentionList.forEach((entityMention) => (
        entityMentionsByUUID[entityMention.uuid.uuidString] = entityMention
      ))
    );
    const entitySet = listToScalar(
      (communication.entitySetList ? communication.entitySetList : []).filter((entitySet) =>
        entitySetTool === null || entitySet.metadata.tool === entitySetTool),
      "Communication.entitySetList");
    const entityDataList = entitySet.entityList
      .map((entity, entityIndex) => ({
        entity,
        entityId: entity.id ? entity.id : `ss-${entityIndex}`
      }));
    entityDataList.forEach(({entity, entityId}) => (
      entityIdsByUUID[entity.uuid.uuidString] = entityId
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
      (communication.situationSetList ? communication.situationSetList : []).filter((situationSet) =>
        situationSetTool === null || situationSet.metadata.tool === situationSetTool),
      "Communication.situationSetList");

    const eventSituationDataList = situationSet.situationList
      .filter((situation) => normalizeSituationType(situation.situationType) === normalizeSituationType("EVENT"))
      .map((situation, situationIndex) => ({
        situation,
        situationId: situation.id ? situation.id : `event-${situationIndex}`
      }));
    const eventSituationIdsByUUID = {};
    eventSituationDataList.forEach(({situation, situationId}) => (
      eventSituationIdsByUUID[situation.uuid.uuidString] = situationId
    ));
    eventSituationDataList.forEach(({situation, situationId}) => (
      events[situationId] = {
        agents: unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "agent")
          .map((argument) => entityIdsByUUID[argument.entityId.uuidString]),
        anchors: listToScalar(
          unNullifyList(situation.argumentList)
            .filter((argument) => argument.role === "anchor")
            .map((argument) => entityIdsByUUID[argument.entityId.uuidString]),
          "Event anchor argument list"
        ),
        "eventid": situationId,
        "event-type": situation.situationKind,
        patients: unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "patient")
          .map((argument) => entityIdsByUUID[argument.entityId.uuidString]),
        "ref-events": unNullifyList(situation.argumentList)
          .filter((argument) => argument.role === "ref-event")
          .map((argument) => eventSituationIdsByUUID[argument.situationId.uuidString]),
        "state-of-affairs": false,
      }
    ));

    const templateSituationDataList = situationSet.situationList
      .filter((situation) =>
        normalizeSituationType(situation.situationType) === normalizeSituationType(templateSituationType)
      )
      .map((situation, situationIndex) => ({
        situation,
        situationId: situation.id ? situation.id : `template-${situationIndex}`
      }));
    templateSituationDataList.forEach(({situation, situationId}) => {
      const templateAnchorIds = unNullifyList(situation.argumentList)
        .filter((argument) => argument.role === "template-anchor")
        .map((argument) => entityIdsByUUID[argument.entityId.uuidString]);
      if (templateAnchorIds.length > 1) {
        throw new Error(`Found multiple template anchors for situation ${situationId}`);
      }
      granularTemplates[situationId] = {
        "template-anchor": templateAnchorIds.length ? templateAnchorIds[0] : "",
        "template-id": situationId,
        "template-type": situation.situationKind,
      };
      Object.entries(groupBy(
        unNullifyList(situation.argumentList)
          .filter((argument) => argument.role !== "template-anchor"),
        "role"
      )).forEach(([role, args]) => (
        granularTemplates[situationId][role] = argumentsToSlot(
          role, args, entityIdsByUUID, eventSituationIdsByUUID
        )
      ));
    });
  }

  return corpusEntry;
}

function convertBPJsonSectionsToConcrete(segmentSections, tok2char, text) {
  const rootSectionNode = {start: 0, ending: text.length, kind: "Unknown", children: []};
  segmentSections
    .map((segmentSection) => ({
      start: segmentSection.start,
      ending: segmentSection.end,
      kind: segmentSection["structural-element"],
      children: [],
    }))
    .forEach(function (sectionData) {
      let node = rootSectionNode;
      while (node) {
        if (node.children.length > 0) {
          const parentCandidate = node.children.find(
            (c) => c.start <= sectionData.start && sectionData.ending <= c.ending
          );
          if (parentCandidate) {
            // parentCandidate span contains sectionData span
            if (parentCandidate.start === sectionData.start && parentCandidate.ending === sectionData.ending) {
              // parentCandidate and sectionData represent same span
              if (normalizeSectionKind(parentCandidate.kind) !== normalizeSectionKind(sectionData.kind)) {
                // parentCandidate, sectionData have different kinds, so insert sectionData below parentCandidate
                [parentCandidate.children, sectionData.children] = [[sectionData], parentCandidate.children];
                if (equivalentSectionKindOrder(sectionData.kind) < equivalentSectionKindOrder(parentCandidate.kind)) {
                  // sectionData kind should appear earlier in hierarchy, swap with parentCandidate kind
                  [parentCandidate.kind, sectionData.kind] = [sectionData.kind, parentCandidate.kind];
                }
              }
              break;
            } else {
              // parentCandidate span strictly contains sectionData span
              node = parentCandidate;
            }
          } else if (sectionData.ending <= node.children[0].start) {
            // sectionData fits before first child
            node.children.unshift(sectionData);
          } else if (last(node.children).ending <= sectionData.start) {
            // sectionData fits after last child
            node.children.push(sectionData);
          } else {
            const nextSiblingIndex = range(1, node.children.length).find((i) =>
              node.children[i - 1].ending <= sectionData.start && sectionData.ending <= node.children[i].start);
            if (nextSiblingIndex >= 0) {
              // sectionData span fits between nextSibling span and previous span, if any
              node.children.splice(nextSiblingIndex, 0, sectionData);
            } else {
              const firstChildIndex = range(node.children.length).find((i) =>
                (i === 0 || node.children[i - 1].ending <= sectionData.start) &&
                sectionData.start <= node.children[i].start);
              const lastChildIndex = range(node.children.length).find((i) =>
                node.children[i].ending <= sectionData.ending &&
                (i + 1 === node.children.length || sectionData.ending <= node.children[i + 1].start));
              if (firstChildIndex >= 0 && lastChildIndex >= 0) {
                // sectionData span contains firstChild span through lastChild span
                sectionData.children = node.children.slice(firstChildIndex, lastChildIndex + 1);
                node.children.splice(firstChildIndex, lastChildIndex + 1 - firstChildIndex, sectionData);
              } else {
                // sectionData span overlaps other span non-hierarchically
                throw new Error("Sections overlap non-hierarchically");
              }
            }
          }
        } else {
          // Node has no children
          node.children.push(sectionData);
        }
      }
      if (!node) {
        throw new Error(`Failed to add section [${sectionData.start}, ${sectionData.ending}) to hierarchy`);
      }
    });

  // loop over nodes recursively, looking for sentences
  const sentenceSearchStack = [rootSectionNode];
  while (sentenceSearchStack.length > 0) {
    const node = sentenceSearchStack.pop();
    if (normalizeSectionKind(node.kind) === "sentence") {
      if (node.children.length === 0) {
        node.isSentence = true;
      } else {
        node.kind = "temp_sentence_wrapper";  // used only to simplify handling of sections below sentences
        sentenceSearchStack.push(...node.children);
      }
    } else {
      if (node.children.length === 0) {
        node.children.push({
          children: [],
          kind: "sentence",
          start: node.start,
          ending: node.ending,
        });
      }
      sentenceSearchStack.push(...node.children);
    }
  }
  // loop again, building a full depth-first search sequence
  const helperStack = [rootSectionNode];
  const sectionSearchStack = [];
  while (helperStack.length > 0) {
    const node = helperStack.pop();
    sectionSearchStack.push(node);
    helperStack.push(...node.children);
  }
  // loop bottom-up, finding sections and recursively filling in gaps
  const flatSectionNodes = [];
  while (sectionSearchStack.length > 0) {
    const node = sectionSearchStack.pop();
    // flat sections will consist of nodes that directly contain at least one sentence in the original data
    // (if a node contains only other sections, we will represent it by its child sections)
    if (node.children.some((child) => child.isSentence)) {
      // node contains at least one sentence
      if (node.children.every((child) => child.isSentence)) {
        // node contains sentences only
        flatSectionNodes.push(node);
      } else {
        // node contains sentences as well as non-sentences (sections)
        // iterate over children, creating a section node for each non-empty sequence of consecutive sentence nodes
        // (updating node.children in-place)
        for (let groupStartIndex = 0; groupStartIndex < node.children.length; groupStartIndex++) {
          let groupEndIndex = groupStartIndex;
          while (groupEndIndex < node.children.length && node.children[groupEndIndex].isSentence) {
            groupEndIndex++;
          }
          if (groupEndIndex > groupStartIndex) {
            const groupSectionNode = {
              children: node.children.slice(groupStartIndex, groupEndIndex),
              kind: "Unknown",
              start: node.children[groupStartIndex].start,
              ending: node.children[groupEndIndex - 1].ending,
            };
            node.children.splice(groupStartIndex, groupEndIndex - groupStartIndex, groupSectionNode);
            flatSectionNodes.push(groupSectionNode);
          }
        }
      }
    }
  }

  const sections = sortBy(flatSectionNodes, ["start"]).map((section) =>
    new concrete.structure.Section({
      kind: section.kind,
      sentenceList: section.children.map((sentence) =>
        new concrete.structure.Sentence({
          textSpan: new concrete.spans.TextSpan({
            start: sentence.start,
            ending: sentence.ending,
          }),
          tokenization: new concrete.structure.Tokenization({
            kind: concrete.structure.TokenizationKind.TOKEN_LIST,
            metadata: generateAnnotationMetadata(),
            tokenList: new concrete.structure.TokenList({tokenList: []}),
            uuid: generateUUID(),
          }),
          uuid: generateUUID(),
        })),
      textSpan: new concrete.spans.TextSpan({
        start: section.start,
        ending: section.ending,
      }),
      uuid: generateUUID(),
    }));

  const textIndexSentenceMap = Object.fromEntries(sections.flatMap((section) =>
    section.sentenceList.flatMap((sent) =>
      range(sent.textSpan.start, sent.textSpan.ending).map((textIndex) =>
        [textIndex, sent]))));
  tok2char
    .forEach(function (indices) {
      const start = indices[0];
      const ending = last(indices) + 1;
      const startSentence = textIndexSentenceMap[start];
      const lastSentence = textIndexSentenceMap[ending - 1];
      if (startSentence && lastSentence) {
        if (startSentence.textSpan.start === lastSentence.textSpan.start &&
            startSentence.textSpan.ending === lastSentence.textSpan.ending) {
          const token = new concrete.structure.Token({
            text: indices.map((i) => text[i]).join(""),
            tokenIndex: startSentence.tokenization.tokenList.tokenList.length,
            textSpan: new concrete.spans.TextSpan({start, ending}),
          });
          if (token.text.length !== token.textSpan.ending - token.textSpan.start) {
            throw new Error("Token text length does not match token indices");
          }
          startSentence.tokenization.tokenList.tokenList.push(token);
        } else {
          console.warn(
            `Ignoring token [${start}, ${ending}) that spans multiple sentences`
          );
        }
      } else if (startSentence || lastSentence) {
        console.warn(
          `Ignoring token [${start}, ${ending}) that crosses a sentence boundary`
        );
      }
    });

  return sections;
}

function convertBPJsonToConcrete(corpusEntry, templateSituationType=DEFAULT_TEMPLATE_SITUATION_TYPE) {
  const communicationParams = {
    id: corpusEntry["entry-id"],
    metadata: generateAnnotationMetadata(),
    sectionList: convertBPJsonSectionsToConcrete(
      corpusEntry["segment-sections"], corpusEntry.tok2char, corpusEntry["segment-text"]),
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
        .map((span) =>
          span["start-token"] !== undefined && span["end-token"] !== undefined ?
            [span["start-token"], span["end-token"]] :
            computeTokenSpanFromTextSpan(corpusEntry.tok2char, [span.start, span.end - 1])
        )
        .map(([startTokenIndex, lastTokenIndex]) => range(startTokenIndex, lastTokenIndex + 1)
          .map((globalTokenIndex) => flatTokenData[globalTokenIndex])
        )
        .map((spanTokenData) => {
          const tokenizationUUIDs = sortedUniqBy(
            spanTokenData.map(({sentence}) => sentence.tokenization.uuid),
            "uuidString"
          );
          const tokenizationId = listToScalar(tokenizationUUIDs, "list of tokenizations referenced by span");
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
        situationType: templateSituationType,
        uuid: generateUUID(),
      }))
    );
  }

  return new concrete.communication.Communication(communicationParams);
}

module.exports = {convertConcreteToBPJson, convertBPJsonToConcrete, DEFAULT_TEMPLATE_SITUATION_TYPE};
