/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const statusCode = require(`${root}lib/util/status_code`);

describe("lib/util/status_code", function() {
  context(".isOk", function() {
    it("numbers starting with 2xx and 3xx returns true", () => [200, 300, 301, 299, 302, 201, "200", "300"].forEach(code => expect(statusCode.isOk(code), `expected status code: ${code} to be true`).to.be.true));

    return it("numbers not starting with 2xx or 3xx returns false", () => [100, 400, 401, 500, 404, 503, "200a", "300b"].forEach(code => expect(statusCode.isOk(code), `expected status code: ${code} to be false`).to.be.false));
  });

  return context(".getText", function() {
    it("is OK", () => expect(statusCode.getText(200)).to.eq("OK"));

    it("is Not Found", () => expect(statusCode.getText(404)).to.eq("Not Found"));

    it("is Server Error", () => expect(statusCode.getText(500)).to.eq("Server Error"));

    return it("is Unknown Status Code", () => expect(statusCode.getText(1234)).to.eq("Unknown Status Code"));
  });
});