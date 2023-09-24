const expect = require("chai").expect;

const concrete = require("../dist_nodejs");

describe("UUID generation", function() {
  it("does not repeat UUIDs", function() {
    expect(
      concrete.util.generateUUID().uuidString
    ).to.not.equal(
      concrete.util.generateUUID().uuidString
    );
  });
});
