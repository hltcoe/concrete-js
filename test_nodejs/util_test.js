const expect = require("chai").expect;

const util = require("../dist_nodejs/util");

describe("UUID generation", function() {
  it("does not repeat UUIDs", function() {
    expect(
      util.generateUUID().uuidString
    ).to.not.equal(
      util.generateUUID().uuidString
    );
  });
});
