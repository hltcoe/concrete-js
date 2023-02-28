# concrete-js

[![Build status](https://github.com/hltcoe/concrete-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/hltcoe/concrete-js/actions/workflows/node.js.yml)

**concrete-js** is a Node.js/JavaScript library for working with
[Concrete](https://hltcoe.github.io/concrete), a set of NLP data
types defined by a [Thrift](https://thrift.apache.org) schema.  Thrift
makes it easy to use a shared set of data structures across multiple
programming languages.

This document is
[available online alongside an API reference](http://hltcoe.github.io/concrete-js/).


### Use cases

The **concrete-js** library is designed for visualization and
annotation.  While it is possible to implement NLP algorithms in
JavaScript, consider using
[concrete-python](https://concrete-python.readthedocs.io/en/stable/) or
[concrete-java](https://github.com/hltcoe/concrete-java)
instead.

In general, you should use **concrete-js** when you have a Concrete
*Communication* object that was created by another tool, and need a
user interface
that visually represents data in the *Communication*.  You may also
need the user or annotator to interactively modify Concrete data
structures and then save their modifications.


### Node.js / JavaScript+jQuery

There are two supported distributions of **concrete-js**: a Node.js
distribution and a JavaScript + jQuery distribution.  These two
distributions provide similar functionality but are designed to
support different approaches to web development.
If you use the `npm` or `yarn` commands to install third-party
libraries, the Node.js distribution will likely fit best in your
workflow.
If you don't know which distribution you should use, we suggest using
the JavaScript + jQuery distribution.

Both distributions provide serialization and deserialization
code for Concrete data structures that is generated by Thrift according
to [the Concrete schema](http://hltcoe.github.io/concrete/schema/).
They also provide utility functions for working with Concrete objects.
The JavaScript + jQuery distribution additionally provides
visualization code that maps Concrete data structures to DOM elements
using [jQuery](http://jquery.com).

The rest of this document describes the Node.js distribution of
**concrete-js**.  For documentation of the
JavaScript + jQuery distribution, go to
[the JavaScript + jQuery **concrete-js** documentation page](http://hltcoe.github.io/concrete-js/js-jquery/).


## Installation

The Node.js distribution of **concrete-js** is published as
`@hltcoe/concrete`.

To use **concrete-js** in your Node.js project, use `npm install` to add it to
your dependencies:

```
npm install @hltcoe/concrete
```


## Usage: Fetching Communications

```javascript
import thrift from "thrift";
import concrete from "@hltcoe/concrete";

/**
 * Creates and returns a Fetch client for an HTTP Fetch service.
 *
 * @param host Host name or IP of HTTP Fetch service
 * @param port TCP port of HTTP Fetch service
 * @param path URL path of HTTP Fetch service
 * @returns Fetch client
 */
async createFetchClient(host, port = 8000, path = '/') {
  const options = {
    transport: thrift.TBufferedTransport,
    protocol: thrift.TJSONProtocol,
    path: path,
    https: false,
  };
  const connection = thrift.createXHRConnection(
    host,
    port,
    options
  );
  connection.on("error", function (err) {
    console.error(err);
  });
  return thrift.createXHRClient(
    concrete.access.FetchCommunicationService,
    connection
  );
}

/**
 * Returns up to the first ten Communications from a Fetch service.
 *
 * @param fetchClient A Fetch client for the desired Fetch service
 * @param maxNumCommunications The maximum number of Communications to
 *   retrieve
 * @returns A list of maxNumCommunications Communications (or fewer
 *   if the Fetch client does not have that many Communications).
 */
async headCommunications(fetchClient, maxNumCommunications = 10) {
  const numCommunications = await fetchClient.getCommunicationCount();
  const communicationIds = await fetchClient.getCommunicationIDs(
    0,
    Math.min(maxNumCommunications, numCommunications)
  );
  const request = new concrete.access.FetchRequest({
    communicationIds: communicationIds,
  });
  const result = await fetchClient.fetch(request);
  return result.communications;
}
```


## Development

### Building

You do not need to build **concrete-js** in order to use
**concrete-js**:  The Node.js package is available on the npm registry,
and a working copy of the JavaScript + jQuery library is included in
this repository in the `dist/` directory.  The **concrete-js** library
only needs to be (re)built when the Thrift schema files for Concrete
have been updated or when the code in `src/` is modified.

Requirements for building **concrete-js**:

* A clone of
  [the Concrete schema repository](https://github.com/hltcoe/concrete)
  at `../concrete`
* [Thrift](https://thrift.apache.org)
* [Node.js](http://nodejs.org)
  (a JavaScript backend runtime and packaging tool)

First, install the Node.js packages required for building
**concrete-js**:

```
npm ci
```

Then build **concrete-js**:

```
npx grunt
```

This command will build both the JavaScript + jQuery and the Node.js version
of the library and then regenerate the documentation:

1. Build Node.js library
   * call the Thrift compiler to generate Node.js code for the Thrift schema under `~/concrete`
   * run [JSHint](http://www.jshint.com) on the code to check for problems
   * combine the Thrift-generated code with the hand-written utility code in `dist_nodejs`
2. Build JavaScript + jQuery library
   * call the Thrift compiler to generate JavaScript + jQuery code for the Thrift schema under `~/concrete`
   * run JSHint on the code to check for problems
   * combine the Thrift-generated code with the hand-written utility code in `dist`
   * minify the combined code to reduce download size
   * download a supported version of `thrift.js` to `dist/thrift.js`
3. Generate documentation in `docs`


### Testing

Code linting will be performed automatically when **concrete-js** is built.

To run tests for both libraries, do:

```
npm test
```

Or to run the tests for just the Node.js library or just the
JavaScript + jQuery library, do `npm run test_nodejs` or
`npm run test_js`, respectively.


### Publishing to NPM

After building the Node.js `@hltcoe/concrete` library using the steps
described previously, the package files will be located in the
`dist_nodejs` subdirectory.  To publish the package to the npm
registry, run `npm publish` from `dist_nodejs`:

```
cd dist_nodejs && npm publish
```

So, to perform a publish from a clean state, you might do something like
the following.  Note that this will cause you to lose any changes not
committed to git!

```
git reset --hard && git clean -fdx && npm ci && npx grunt && cd dist_nodejs && npm publish
```
