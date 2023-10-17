const expect = require("chai").expect;

const concrete = require("../dist_nodejs");
const commJSONData = require('../test/fixtures/dog-bites-man.concrete.json');

describe("addInternalReferences", function() {
  it("Returns Communication-level maps", function() {
    const comm = new concrete.communication.Communication();
    comm.initFromTJSONProtocolObject(commJSONData);
    const refs = comm.addInternalReferences();
    expect(refs).to.have.all.keys([
      "entityForUUID",
      "entityMentionForUUID",
      "sectionForUUID",
      "sentenceForUUID",
      "situationForUUID",
      "situationMentionForUUID",
      "tokenizationForUUID"
    ]);
    comm.sectionList.forEach((section) => {
      expect(refs.sectionForUUID[section.uuid.uuidString]).to.equal(section);
      section.sentenceList.forEach((sentence) => {
        expect(refs.sentenceForUUID[sentence.uuid.uuidString]).to.equal(sentence);
        expect(refs.tokenizationForUUID[sentence.tokenization.uuid.uuidString]).to.equal(sentence.tokenization);
      });
    });
    comm.entitySetList.forEach((entitySet) =>
      entitySet.entityList.forEach((entity) =>
        expect(refs.entityForUUID[entity.uuid.uuidString]).to.equal(entity)
      )
    );
    comm.entityMentionSetList.forEach((entityMentionSet) =>
      entityMentionSet.mentionList.forEach((mention) =>
        expect(refs.entityMentionForUUID[mention.uuid.uuidString]).to.equal(mention)
      )
    );
    comm.situationSetList.forEach((situationSet) =>
      situationSet.situationList.forEach((situation) =>
        expect(refs.situationForUUID[situation.uuid.uuidString]).to.equal(situation)
      )
    );
    comm.situationMentionSetList.forEach((situationMentionSet) =>
      situationMentionSet.mentionList.forEach((mention) =>
        expect(refs.situationMentionForUUID[mention.uuid.uuidString]).to.equal(mention)
      )
    );
  });
});
