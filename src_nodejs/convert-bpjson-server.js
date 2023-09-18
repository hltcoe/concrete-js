#!/usr/bin/env node

const jsesc = require('jsesc');
const thrift = require("thrift");
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

const concrete = require(".");

const argv = yargs(hideBin(process.argv))
  .option('port', {
    type: 'number',
    default: 9000,
    description: 'TCP port to listen on',
  })
  .option('template-situation-type', {
    type: 'string',
    default: concrete.util.bpjson.DEFAULT_TEMPLATE_SITUATION_TYPE,
    description: 'Situation type to output and expect in the input for BP JSON templates',
  })
  .option('entity-set-tool', {
    type: 'string',
    default: null,
    description: 'Annotation tool to filter input Concrete entity sets by',
  })
  .option('situation-set-tool', {
    type: 'string',
    default: null,
    description: 'Annotation tool to filter input Concrete situation sets by',
  })
  .help()
  .alias('help', 'h')
  .parse();

const server = thrift.createServer(concrete.convert.ConvertCommunicationService, {
  about: () => {
    return new concrete.services.ServiceInfo({
      name: "BP-JSON Entry Convert Service",
      description: `Converts between an individual BETTER BP-JSON v10 corpus entry and a Concrete Communication.  Uses ${argv.templateSituationType} as the situation type for BP JSON templates`,
      version: concrete.util.getVersion(),
    });
  },
  alive: () => {
    return true;
  },
  fromConcrete: (original) => {
    try {
      return jsesc(
        concrete.util.bpjson.convertConcreteToBPJson(
          original,
          argv.templateSituationType,
          argv.entitySetTool,
          argv.situationSetTool),
        {json: true, compact: false, indent: '  '});
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
      return concrete.util.bpjson.convertBPJsonToConcrete(corpusEntry, argv.templateSituationType);
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
