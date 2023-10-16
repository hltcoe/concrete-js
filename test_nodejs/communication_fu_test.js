const expect = require("chai").expect;

const concrete = require("../dist_nodejs");
const commJSONData = require('../test/fixtures/dog-bites-man.concrete.json');

describe("addInternalReferences", function() {
  it("Returns Communication-level maps", function() {
    const comm = new Communication();
    comm.initFromTJSONProtocolObject(commJSONData);
    const refs = comm.addInternalReferences();
    expect(
      comm.addInternalReferences()
    ).to.have.all.keys([
      "entityForUUID",
      "entityMentionForUUID",
      "sectionForUUID",
      "sentenceForUUID",
      "situationForUUID",
      "situationMentionForUUID",
      "tokenizationForUUID"
    ]);
  });
});
