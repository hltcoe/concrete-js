const expect = require("chai").expect;

const concrete = require("../dist_nodejs");
const commJSONData = require('../test/fixtures/dog-bites-man.concrete.json');

describe("addInternalReferences", function() {
  it("Returns Communication-level maps", function() {
    const comm = new concrete.communication.Communication();
    comm.initFromTJSONProtocolObject(commJSONData);
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
