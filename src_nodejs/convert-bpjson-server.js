#!/usr/bin/env node

const thrift = require("thrift");
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

const concrete = require("./concrete");
const bpjson = require("./bpjson");
const {getVersion} = require("./util");

const argv = yargs(hideBin(process.argv))
  .option('port', {
    type: 'number',
    default: 9000,
    description: 'TCP port to listen on',
  })
  .help()
  .alias('help', 'h')
  .parse();

const server = thrift.createServer(concrete.convert.ConvertCommunicationService, {
  about: () => {
    return new concrete.services.ServiceInfo({
      name: "BP-JSON Entry Convert Service",
      description: "Converts between an individual BETTER BP-JSON v10 corpus entry and a Concrete Communication",
      version: getVersion(),
    });
  },
  alive: () => {
    return true;
  },
  fromConcrete: (original) => {
    try {
      return JSON.stringify(bpjson.convertConcreteToBPJson(original));
    } catch (ex) {
      console.error(ex);
      throw new concrete.services.ServicesException({
        message: `${ex.message} (see server log for details)`
      });
    }
  },
  toConcrete: (original) => {
    try {
      const corpusEntry = JSON.parse(original);
      if (corpusEntry.entries) {
        throw new Error("Expected BP-JSON corpus entry but received BP-JSON corpus");
      }
      return bpjson.convertBPJsonToConcrete(corpusEntry);
    } catch (ex) {
      console.error(ex);
      throw new concrete.services.ServicesException({
        message: `${ex.message} (see server log for details)`
      });
    }
  },
});

server.listen(argv.port);
console.log(`Listening on port ${argv.port}...`);