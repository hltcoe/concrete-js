const expect = require("chai").expect;

const bpjson = require("../dist_nodejs/bpjson");

describe("Concrete-BPJson conversion", function() {
  it("is invertible", function() {
      const corpusEntry = {
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
        "entry-id": "doc-0",
        "segment-sections": [
          {"end": 5, "start": 0, "structural-element": "Headline"},
          {"end": 6, "start": 5, "structural-element": "Headline"},
          {"end": 13, "start": 7, "structural-element": "Sentence"},
        ],
        "segment-text": "Hello, world!",
        "segment-text-tok": ["Hello", ",", "world", "!"],
        "segment-type": "type-0",
        tok2char: [
          [0, 1, 2, 3, 4],
          [5],
          [7, 8, 9, 10, 11],
          [12],
        ],
      };
      
      expect(
        bpjson.convertConcreteToBPJson(
          bpjson.convertBPJsonToConcrete(corpusEntry)
        )
      ).to.eql(corpusEntry);
  });
});