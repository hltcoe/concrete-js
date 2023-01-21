const expect = require("chai").expect;

const bpjson = require("../dist_nodejs/bpjson");

describe("convertBPJsonToConcrete", function() {
  it("is invertible when annotated", function() {
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
          "granular-templates": {
            "template-1": {
              "outcome": [{"event-id": "event-1"}, {"event-id": "event-2"}],
              "over-time": "true",
              "settlement-status-event-or-SoA": [{"event-id": "event-2"}, {ssid: "ss-3"}],
              "template-anchor": "ss-2",
              "template-id": "template-1",
              "template-type": "Displacementplate",
              "total-displaced-count": [{ssid: "ss-2"}, {ssid: "ss-1"}],
            },
          },
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
        {"end": 5, "start": 0, "structural-element": "Headline"},
        {"end": 6, "start": 5, "structural-element": "Headline"},
        {"end": 13, "start": 7, "structural-element": "dateline"},
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

  it("is invertible when unannotated", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
        {"end": 5, "start": 0, "structural-element": "Headline"},
        {"end": 6, "start": 5, "structural-element": "Headline"},
        {"end": 13, "start": 7, "structural-element": "dateline"},
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

  it("adds sections to fill gaps", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
        {"end": 5, "start": 0, "structural-element": "Headline"},
        {"end": 6, "start": 5, "structural-element": "Headline"},
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
      )["segment-sections"]
    ).to.eql([
      {"end": 5, "start": 0, "structural-element": "sentence"},
      {"end": 6, "start": 5, "structural-element": "sentence"},
      {"end": 13, "start": 7, "structural-element": "sentence"},
      {"end": 5, "start": 0, "structural-element": "Headline"},
      {"end": 6, "start": 5, "structural-element": "Headline"},
      {"end": 13, "start": 7, "structural-element": "unknown"},
    ]);
  });

  it("adds a root section if there are no others", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
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
      )["segment-sections"]
    ).to.eql([
      {"end": 5, "start": 0, "structural-element": "sentence"},
      {"end": 6, "start": 5, "structural-element": "sentence"},
      {"end": 13, "start": 7, "structural-element": "sentence"},
      {"end": 13, "start": 0, "structural-element": "unknown"},
    ]);
  });

  it("groups sentences with no section", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "dateline"},
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
      )["segment-sections"]
    ).to.eql([
      {"end": 5, "start": 0, "structural-element": "sentence"},
      {"end": 6, "start": 5, "structural-element": "sentence"},
      {"end": 13, "start": 7, "structural-element": "sentence"},
      {"end": 6, "start": 0, "structural-element": "unknown"},
      {"end": 13, "start": 7, "structural-element": "dateline"},
    ]);
  });

  it("groups sentences with no section by kind", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "headline"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "sentence"},
        {"end": 13, "start": 7, "structural-element": "dateline"},
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
      )["segment-sections"]
    ).to.eql([
      {"end": 5, "start": 0, "structural-element": "sentence"},
      {"end": 6, "start": 5, "structural-element": "sentence"},
      {"end": 13, "start": 7, "structural-element": "sentence"},
      {"end": 5, "start": 0, "structural-element": "headline"},
      {"end": 6, "start": 5, "structural-element": "unknown"},
      {"end": 13, "start": 7, "structural-element": "dateline"},
    ]);
  });

  it("ignores tokens not in any section", function() {
    const corpusEntry = {
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
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 12, "structural-element": "sentence"},
        {"end": 6, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 12, "structural-element": "byline"},
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
    ).to.eql({
      char2tok: [
        [0], [0], [0], [0], [0],
        [1],
        [],
        [], [], [], [], [],
        [2],
      ],
      "doc-id": "doc-0",
      "entry-id": "doc-0",
      "segment-sections": [
        {"end": 5, "start": 0, "structural-element": "sentence"},
        {"end": 6, "start": 5, "structural-element": "sentence"},
        {"end": 13, "start": 12, "structural-element": "sentence"},
        {"end": 6, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 12, "structural-element": "byline"},
      ],
      "segment-text": "Hello, world!",
      "segment-text-tok": ["Hello", ",", "!"],
      "segment-type": "type-0",
      tok2char: [
        [0, 1, 2, 3, 4],
        [5],
        [12],
      ],
    });
  });

  it("ignores tokens crossing sentence boundaries", function() {
    const corpusEntry = {
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
        {"end": 8, "start": 0, "structural-element": "sentence"},
        {"end": 13, "start": 12, "structural-element": "sentence"},
        {"end": 8, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 12, "structural-element": "byline"},
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
    ).to.eql({
      char2tok: [
        [0], [0], [0], [0], [0],
        [1],
        [],
        [], [], [], [], [],
        [2],
      ],
      "doc-id": "doc-0",
      "entry-id": "doc-0",
      "segment-sections": [
        {"end": 8, "start": 0, "structural-element": "sentence"},
        {"end": 13, "start": 12, "structural-element": "sentence"},
        {"end": 8, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 12, "structural-element": "byline"},
      ],
      "segment-text": "Hello, world!",
      "segment-text-tok": ["Hello", ",", "!"],
      "segment-type": "type-0",
      tok2char: [
        [0, 1, 2, 3, 4],
        [5],
        [12],
      ],
    });
  });

  it("ignores tokens spanning multiple sentences", function() {
    const corpusEntry = {
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
        {"end": 8, "start": 0, "structural-element": "sentence"},
        {"end": 13, "start": 8, "structural-element": "sentence"},
        {"end": 8, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 8, "structural-element": "byline"},
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
    ).to.eql({
      char2tok: [
        [0], [0], [0], [0], [0],
        [1],
        [],
        [], [], [], [], [],
        [2],
      ],
      "doc-id": "doc-0",
      "entry-id": "doc-0",
      "segment-sections": [
        {"end": 8, "start": 0, "structural-element": "sentence"},
        {"end": 13, "start": 8, "structural-element": "sentence"},
        {"end": 8, "start": 0, "structural-element": "headline"},
        {"end": 13, "start": 8, "structural-element": "byline"},
      ],
      "segment-text": "Hello, world!",
      "segment-text-tok": ["Hello", ",", "!"],
      "segment-type": "type-0",
      tok2char: [
        [0, 1, 2, 3, 4],
        [5],
        [12],
      ],
    });
  });
});
