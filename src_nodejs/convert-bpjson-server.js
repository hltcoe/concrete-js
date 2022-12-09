#!/usr/bin/env node

const thrift = require("thrift");
const {groupBy, last, range, sortBy, sortedUniqBy, times} = require("lodash");
const {v4: uuidv4} = require("uuid");

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

function convertConcreteToBPJson(communication) {
  const tok2char = unNullifyList(communication.sectionList).flatMap((section) =>
    unNullifyList(section.sentenceList).flatMap((sentence) =>
      sentence.tokenization.tokenList.tokenList.map((token) =>
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
  return {
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
  return new concrete.communication.Communication({
    id: corpusEntry["entry-id"],
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
  });
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
    return JSON.stringify(convertConcreteToBPJson(original));
  },
  toConcrete: (original) => {
    console.log("--- toConcrete() ---");
    return convertBPJsonToConcrete(JSON.parse(original));
  },
});

server.listen(9000);
