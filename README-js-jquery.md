# concrete-js: JavaScript + jQuery

This document describes the JavaScript + jQuery distribution of
**concrete-js**.  For overall documentation and documentation of the
Node.js distribution, go to
[the main **concrete-js** documentation page](http://hltcoe.github.io/concrete-js/).

This document is
[available online alongside an API reference](http://hltcoe.github.io/concrete-js/js-jquery/).

The JavaScript + jQuery **concrete-js** distribution contains the
serialization, deserialization, networking, and utility code available
in the Node.js library as well as additional visualization code that
maps Concrete data structures to DOM elements using
[jQuery](http://jquery.com).


## Installation

In order to use **concrete-js**, you will need jQuery version 1.9 or
later, and the files `dist/thrift.js` and `dist/concrete.js`.  You
do not need any of the files in the `src/` directory.  Those files
are concatenated together to create `dist/concrete.js`.

In your HTML file, you should include the scripts in this order:

```html
<script src="your/copy/of/jquery.js"></script>
<script src="thrift.js"></script>
<script src="concrete.js"></script>
```

If you want to access the JavaScript libraries from a CDN, use:

```html
<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
<script src="https://hltcoe.github.io/concrete-js/thrift.js"></script>
<script src="https://hltcoe.github.io/concrete-js/concrete.js"></script>
```


## Usage: Fetching Communications

There are two primary ways to load Concrete Communications into
JavaScript - Thrift RPC (Remote Procedure Calls) and HTTP GET requests
for JSON serialized Communications.  The JavaScript version of Thrift
only supports the *TJSONProtocol* serialization protocol.

The `Communication` class in **concrete-js** has been extended with
some helper functions for working with TJSONProtocol.  Here is an
example of how to retrieve a JSON-serialized Communication with a GET
request using jQuery:

```javascript
// When the page has loaded...
$(document).ready(function() {
  // ...make an HTTP GET request to retrieve a JSON-serialized Communication...
  $.getJSON('dog-bites-man.concrete.json', function(commJSONData) {
    // ...and call this (unnamed) callback function with the JSON data.

    // Create an empty Concrete Communication object
    var commOne = new Communication();

    // Load JSON-serialized Communication data into Communication object
    commOne.initFromTJSONProtocolObject(commJSONData);
```

The `examples/index.html` file uses this technique to retrieve a
Communication.

**concrete-js** provides functions that serialize and deserialize
Communication objects using TJSONProtocol:

```javascript
var comm = new Communication();
var comm_as_json_object = comm.toTJSONProtocolObject();
var comm_as_json_string = comm.toTJSONProtocolString();

var comm2 = new Communication();
comm2.initFromTJSONProtocolObject(comm_as_json_object);

var comm3 = new Communication();
comm3.initFromTJSONProtocolString(comm_as_json_string);
```