const {v4: uuidv4} = require("uuid");
const {TBufferedTransport, TCompactProtocol} = require("thrift");
const concrete = require("./concrete");
const version = require("./generated_version");

const util = module.exports = {};

/**
 * Generate a Concrete UUID
 *
 * @returns {UUID}
 *
 * @function concrete.util.generateUUID
 * @memberof concrete.util
 */
util.generateUUID = function() {
  return new concrete.uuid.UUID({uuidString: uuidv4()});
};

/** Retrieve HTTP GET parameters by name
 *
 * Adapted from:
 *   http://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
 *
 * @param {String} sParam - Name of HTTP GET parameter to retrieve
 * @returns {String}
 *
 * @function concrete.util.getURLParameter
 * @memberof concrete.util
 */
util.getURLParameter = function(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

/**
 * Serializes native data of given model into Thrift.
 * @param obj Thrift object to serialize.
 * @param thriftModel Thrift model class.
 */
util.serializeThrift = function(obj) {
  const bufs = [];
  const transport = new TBufferedTransport(undefined, (buf) => bufs.push(buf));
  const protocol = new TCompactProtocol(transport);
  obj.write(protocol);
  protocol.flush();
  return Buffer.concat(bufs);
};

/**
 * Deserializes Thrift data with given model.
 * @param data Thrift-serialized data.
 * @param thriftModel Thrift model class.
 */
util.deserializeThrift = function(data, thriftModel) {
  const obj = new thriftModel();
  TBufferedTransport.receiver((reader) => obj.read(new TCompactProtocol(reader)))(data);
  return obj;
};

util.getVersion = () => version;
