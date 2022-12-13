#!/usr/bin/env node

const thrift = require("thrift");

const concrete = require("./concrete");

const connection = thrift.createConnection("localhost", 9000, {
  transport: thrift.TBufferedTransport,
  protocol: thrift.TBinaryProtocol,
});

connection.on("error", (err) => {
  console.log("--- connection error ---");
  console.log(err);
});

const client = thrift.createClient(concrete.convert.ConvertCommunicationService, connection);

client.alive()
  .then((response) => {
    console.log("--- alive() ---");
    console.log(response);
  })
  .then(() => client.about())
  .then((response) => {
    console.log("--- about() ---");
    console.log(response);
  })
  .then(() => client.fromConcrete(new concrete.communication.Communication({
    id: "comm-0",
    entityMentionSetList: [new concrete.entities.EntityMentionSet({
      uuid: new concrete.uuid.UUID({uuidString: "a-b-c-m"}),
      metadata: new concrete.metadata.AnnotationMetadata({
        kBest: 1,
        timestamp: 1,
        tool: "stub",
      }),
      mentionList: [
        new concrete.entities.EntityMention({
          uuid: new concrete.uuid.UUID({uuidString: "a-b-c-o"}),
          tokens: new concrete.structure.TokenRefSequence({
            tokenIndexList: [0],
            tokenizationId: new concrete.uuid.UUID({uuidString: "a-b-c-j"}),
          }),
        }),
        new concrete.entities.EntityMention({
          uuid: new concrete.uuid.UUID({uuidString: "a-b-c-p"}),
          tokens: new concrete.structure.TokenRefSequence({
            tokenIndexList: [0, 1],
            tokenizationId: new concrete.uuid.UUID({uuidString: "a-b-c-l"}),
          }),
        }),
      ],
    })],
    entitySetList: [new concrete.entities.EntitySet({
      uuid: new concrete.uuid.UUID({uuidString: "a-b-c-n"}),
      metadata: new concrete.metadata.AnnotationMetadata({
        kBest: 1,
        timestamp: 1,
        tool: "stub",
      }),
      entityList: [new concrete.entities.Entity({
        mentionIdList: [
          new concrete.uuid.UUID({uuidString: "a-b-c-o"}),
          new concrete.uuid.UUID({uuidString: "a-b-c-p"}),
        ],
        uuid: new concrete.uuid.UUID({uuidString: "a-b-c-q"}),
      })],
    })],
    metadata: new concrete.metadata.AnnotationMetadata({
      kBest: 1,
      timestamp: 1,
      tool: "stub",
    }),
    sectionList: [
      new concrete.structure.Section({
        kind: "headline",
        sentenceList: [
          new concrete.structure.Sentence({
            textSpan: new concrete.spans.TextSpan({ending: 5, start: 0}),
            tokenization: new concrete.structure.Tokenization({
              kind: concrete.structure.TokenizationKind.TOKEN_LIST,
              metadata: new concrete.metadata.AnnotationMetadata({
                kBest: 1,
                timestamp: 1,
                tool: "stub",
              }),
              tokenList: new concrete.structure.TokenList({
                tokenList: [
                  new concrete.structure.Token({
                    textSpan: new concrete.spans.TextSpan({ending: 5, start: 0}),
                    tokenIndex: 0,
                  }),
                ],
              }),
              uuid: new concrete.uuid.UUID({uuidString: "a-b-c-j"}),
            }),
            uuid: new concrete.uuid.UUID({uuidString: "a-b-c-g"}),
          }),
          new concrete.structure.Sentence({
            textSpan: new concrete.spans.TextSpan({ending: 6, start: 5}),
            tokenization: new concrete.structure.Tokenization({
              kind: concrete.structure.TokenizationKind.TOKEN_LIST,
              metadata: new concrete.metadata.AnnotationMetadata({
                kBest: 1,
                timestamp: 1,
                tool: "stub",
              }),
              tokenList: new concrete.structure.TokenList({
                tokenList: [
                  new concrete.structure.Token({
                    textSpan: new concrete.spans.TextSpan({ending: 6, start: 5}),
                    tokenIndex: 0,
                  }),
                ],
              }),
              uuid: new concrete.uuid.UUID({uuidString: "a-b-c-k"}),
            }),
            uuid: new concrete.uuid.UUID({uuidString: "a-b-c-h"}),
          }),
        ],
        textSpan: new concrete.spans.TextSpan({ending: 6, start: 0}),
        uuid: new concrete.uuid.UUID({uuidString: "a-b-c-e"}),
      }),
      new concrete.structure.Section({
        kind: "passage",
        sentenceList: [
          new concrete.structure.Sentence({
            textSpan: new concrete.spans.TextSpan({ending: 13, start: 7}),
            tokenization: new concrete.structure.Tokenization({
              kind: concrete.structure.TokenizationKind.TOKEN_LIST,
              metadata: new concrete.metadata.AnnotationMetadata({
                kBest: 1,
                timestamp: 1,
                tool: "stub",
              }),
              tokenList: new concrete.structure.TokenList({
                tokenList: [
                  new concrete.structure.Token({
                    textSpan: new concrete.spans.TextSpan({ending: 12, start: 7}),
                    tokenIndex: 0,
                  }),
                  new concrete.structure.Token({
                    textSpan: new concrete.spans.TextSpan({ending: 13, start: 12}),
                    tokenIndex: 1,
                  }),
                ],
              }),
              uuid: new concrete.uuid.UUID({uuidString: "a-b-c-l"}),
            }),
            uuid: new concrete.uuid.UUID({uuidString: "a-b-c-i"}),
          }),
        ],
        textSpan: new concrete.spans.TextSpan({ending: 13, start: 7}),
        uuid: new concrete.uuid.UUID({uuidString: "a-b-c-f"}),
      }),
    ],
    text: "Hello, world!",
    type: "article",
    uuid: new concrete.uuid.UUID({uuidString: "a-b-c-d"}),
  })))
  .then((response) => {
    console.log("--- fromConcrete() ---");
    console.dir(JSON.parse(response), {depth: null});
  })
  .then(() => client.toConcrete(JSON.stringify({
    "annotation-sets": {
      "basic-events": {
        events: {},
        "granular-templates": {},
        "span-sets": {
          "ss-1": {
            spans: [
              {
                end: 5,
                "end-token": 0,
                start: 0,
                "start-token": 0,
                string: "Hello",
                "string-tok": ["Hello"],
              },
              {
                end: 13,
                "end-token": 3,
                start: 7,
                "start-token": 2,
                string: "world!",
                "string-tok": ["world", "!"],
              },
            ],
            ssid: "ss-1",
          },
        },
      },
    },
    char2tok: [
      [0], [0], [0], [0], [0],
      [1],
      [],
      [2], [2], [2], [2], [2],
      [3],
    ],
    "doc-id": "doc-0",
    "entry-id": "entry-0",
    "segment-sections": [
      {"end": 5, "start": 0, "structural-element": "Headline"},
      {"end": 6, "start": 5, "structural-element": "Headline"},
      {"end": 13, "start": 7, "structural-element": "Sentence"},
    ],
    "segment-text": "Hello, world!",
    "segment-type": "type-0",
    tok2char: [
      [0, 1, 2, 3, 4],
      [5],
      [7, 8, 9, 10, 11],
      [12],
    ],
  })))
  .then((response) => {
    console.log("--- toConcrete() ---");
    console.dir(response, {depth: null});
  })
  .catch((err) => {
    console.log("--- service method error ---");
    console.log(err);
  })
  .finally(() => connection.end());
