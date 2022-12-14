const expect = require("chai").expect;

const bpjson = require("../dist_nodejs/bpjson");

describe("convertBPJsonToConcrete", function() {
  it("is invertible", function() {
      const corpusEntry = {
        "annotation-sets": {
          "basic-events": {
            events: {
              "event-1": {
                agents: ["ss-1"],
                anchors: "ss-3",
                "event-type": "Communicate-Event",
                eventid: "event-1",
                patients: ["ss-2"],
                "ref-events": ["event-2"],
                "state-of-affairs": false,
              },
              "event-2": {
                agents: [],
                anchors: "ss-1",
                "event-type": "Violence-Event",
                eventid: "event-2",
                patients: ["ss-3"],
                "ref-events": [],
                "state-of-affairs": false,
              },
            },
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
              "ss-2": {
                spans: [
                  {
                    end: 5,
                    "end-token": 0,
                    start: 0,
                    "start-token": 0,
                    string: "Hello",
                    "string-tok": ["Hello"],
                  },
                ],
                ssid: "ss-2",
              },
              "ss-3": {
                spans: [
                  {
                    end: 12,
                    "end-token": 2,
                    start: 7,
                    "start-token": 2,
                    string: "world",
                    "string-tok": ["world"],
                  },
                ],
                ssid: "ss-3",
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