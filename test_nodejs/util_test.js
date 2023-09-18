const expect = require("chai").expect;

const concrete = require("../dist_nodejs");
const util = concrete.util;

describe("UUID generation", function() {
  it("does not repeat UUIDs", function() {
    expect(
      util.generateUUID().uuidString
    ).to.not.equal(
      util.generateUUID().uuidString
    );
  });
});
