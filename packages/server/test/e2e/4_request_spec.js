/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const bodyParser   = require("body-parser");
const cookieParser = require("cookie-parser");
const e2e          = require("../support/helpers/e2e").default;

let counts = null;

const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser       = bodyParser.json();

const sendBackBody = (req, res) => //# send back to the body
res.json(req.body);

const onServer3 = function(app) {
  app.get("/login", function(req, res) {
    res.cookie("session", "1");

    return res.send("<html>login</html>");
  });

  app.post("/login", function(req, res) {
    res.cookie("session", "2");

    return res.redirect("/cookies");
  });

  return app.get("/cookies", (req, res) => res.json({
    cookie: req.headers.cookie
  }));
};

const onServer2 = function(app) {
  app.get("/statusCode", function(req, res) {
    const {
      code
    } = req.query;

    return res.sendStatus(code);
  });

  app.get("/params", (req, res) => res.json({
    url: req.url,
    params: req.query
  }));

  app.get("/redirect", (req, res) => res.redirect("/home"));

  app.get("/redirectWithCookie", function(req, res) {
    res.cookie('foo', 'bar');
    return res.redirect("/home");
  });

  app.get("/home", (req, res) => res.send("<html>home</html>"));

  app.post("/redirectPost", (req, res) => res.redirect("/home"));

  app.get("/headers", (req, res) => res.json({
    headers: req.headers
  }));

  app.post("/form", urlencodedParser, sendBackBody);

  return app.post("/json", jsonParser, sendBackBody);
};

const onServer = function(app) {
  app.use(cookieParser());

  app.get("/cookies*", (req, res) => res.json(req.cookies));

  app.get("/counts", (req, res) => res.json(counts));

  return app.get("*", function(req, res) {
    const host = req.get("host");

    counts[host] += 1;

    switch (host) {
      case "localhost:2290":
        return res
        .cookie("2290", true, {
          path: "/cookies/one"
        })
        .redirect("http://localhost:2291/");

      case "localhost:2291":
        return res
        .cookie("2291", true, {
          path: "/cookies/two"
        })
        .redirect("http://localhost:2292/");

      case "localhost:2292":
        return res
        .set('Content-Type', 'text/html')
        .cookie("2292", true, {
          path: "/cookies/three"
        })
        .send("<html><head></head><body>hi</body></html>");

      case "localhost:2293":
        return res
        .cookie("2293", true, {
          httpOnly: true,
          maxAge: 60000
        })
        .cookie("2293-session", true)
        .send({});
    }
  });
};

describe("e2e requests", function() {
  e2e.setup({
    servers: [{
      port: 2290,
      onServer
    },{
      port: 2291,
      onServer
    },{
      port: 2292,
      onServer
    },{
      port: 2293,
      onServer
    }, {
      port: 2294,
      onServer: onServer2
    }, {
      port: 2295,
      onServer: onServer3
    }]
  });

  beforeEach(() => counts = {
    "localhost:2290": 0,
    "localhost:2291": 0,
    "localhost:2292": 0,
    "localhost:2293": 0
  });

  e2e.it("passes", {
    spec: "request_spec.coffee",
    snapshot: true
  });

  it("fails when network immediately fails", function() {
    return e2e.exec(this, {
      spec: "request_http_network_error_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1
    });
  });

  it("fails on status code", function() {
    return e2e.exec(this, {
      spec: "request_status_code_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1,
      onStdout(stdout) {
        return stdout
        .replace(/"user-agent": ".+",/, '"user-agent": "foo",')
        .replace(/"etag": "(.+),/, '"etag": "W/13-52060a5f",')
        .replace(/"date": "(.+),/, '"date": "Fri, 18 Aug 2017 15:01:13 GMT",');
      }
    });
  });

  return it("prints long http props on fail", function() {
    return e2e.exec(this, {
      spec: "request_long_http_props_failing_spec.coffee",
      snapshot: true,
      expectedExitCode: 1,
      onStdout(stdout) {
        return stdout
        .replace(/"user-agent": ".+",/, '"user-agent": "foo",')
        .replace(/"etag": "(.+),/, '"etag": "W/13-52060a5f",')
        .replace(/"date": "(.+),/, '"date": "Fri, 18 Aug 2017 15:01:13 GMT",');
      }
    });
  });
});