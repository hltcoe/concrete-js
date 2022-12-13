#!/usr/bin/env node

const thrift = require("thrift");
const {groupBy, last, range, sortBy, sortedUniqBy, times} = require("lodash");
const {v4: uuidv4} = require("uuid");

const concrete = require("./concrete");

const PORT = 9000;

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
  return tokenization.tokenList
    ? tokenization.tokenList.tokenList
    : [];
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

  const tokenizationDataById = {};
  let tokenizationTokenOffset = 0;
  unNullifyList(communication.sectionList).forEach((section) =>
    unNullifyList(section.sentenceList).forEach((sentence) => {
      tokenizationDataById[sentence.tokenization.uuid.uuidString] = {
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

  const spanSets = {};
  if (unNullifyList(communication.entitySetList).length > 1) {
    throw new Error("Communication cannot have more than one entity set list");
  }
  if (unNullifyList(communication.entityMentionSetList).length > 1) {
    throw new Error("Communication cannot have more than one entity mention set list");
  }
  if (unNullifyList(communication.entitySetList).length > 0
      && unNullifyList(communication.entityMentionSetList).length > 0) {
    const entitySet = communication.entitySetList[0];
    const entityMentionSet = communication.entityMentionSetList[0];
    const entityMentionsById = {};
    entityMentionSet.mentionList.forEach((entityMention) => (
      entityMentionsById[entityMention.uuid.uuidString] = entityMention
    ));
    entitySet.entityList
      .map((entity, entityIndex) => ({
        entity,
        entityId: entity.id ? entity.id : `ss-${entityIndex}`
      }))
      .forEach(({entity, entityId}) => (spanSets[entityId] = {
        ssid: entityId,
        spans: entity.mentionIdList
          .map((mentionUuid) => entityMentionsById[mentionUuid.uuidString])
          .map((entityMention) => ({
            text: entityMention.text,
            tokenizationData: tokenizationDataById[entityMention.tokens.tokenizationId.uuidString],
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
                token.text
                  ? token.text
                  : communication.text.substring(token.textSpan.start, token.textSpan.ending)
              ),
          }))
      }))
  }

  return {
    "annotation-sets": {
      "basic-events": {
        "events": {},
        "granular-templates": {},
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
    text: corpusEntry["segment-text"],
    type: corpusEntry["segment-type"],
    uuid: generateUUID(),
  };
  const entitySet = communicationParams.entitySetList[0];
  const entityMentionSet = communicationParams.entityMentionSetList[0];
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
        const tokenizationIds = sortedUniqBy(
          spanTokenData.map(({sentence}) => sentence.tokenization.uuid),
          "uuidString"
        );
        if (tokenizationIds.length !== 1) {
          throw new Error("Spans cannot cross sentence boundaries");
        }
        const [tokenizationId] = tokenizationIds;
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
  return new concrete.communication.Communication(communicationParams);
}

const server = thrift.createServer(concrete.convert.ConvertCommunicationService, {
  about: () => {
    console.log("--- about() ---");
    return new concrete.services.ServiceInfo({
      name: "bpjson convert server stub",
      version: "0.0.0",
    });
  },
  alive: () => {
    console.log("--- alive() ---");
    return true;
  },
  fromConcrete: (original) => {
    console.log("--- fromConcrete() ---");
    try {
      return JSON.stringify(convertConcreteToBPJson(original));
    } catch (ex) {
      console.error(ex, ex.stack);
      throw new concrete.services.ServicesException({message: `Original exception: ${ex}`});
    }
  },
  toConcrete: (original) => {
    console.log("--- toConcrete() ---");
    try {
      return convertBPJsonToConcrete(JSON.parse(original));
    } catch (ex) {
      console.error(ex, ex.stack);
      throw new concrete.services.ServicesException({message: `Original exception: ${ex}`});
    }
  },
});

server.listen(PORT);
console.log(`Listening on port ${PORT}...`);