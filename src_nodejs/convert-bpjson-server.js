#!/usr/bin/env node

const bpjson = require("./bpjson");
const thrift = require("thrift");

const concrete = require("./concrete");

const PORT = 9000;

const server = thrift.createServer(concrete.convert.ConvertCommunicationService, {
  about: () => {
    console.log("--- about() ---");
    return new concrete.services.ServiceInfo({
      name: "bpjson convert server stub",
      version: "0.0.0",
    });
  },
  alive: () => {
    console.log("--- alive() ---");
    return true;
  },
  fromConcrete: (original) => {
    console.log("--- fromConcrete() ---");
    try {
      return JSON.stringify(bpjson.convertConcreteToBPJson(original));
    } catch (ex) {
      console.error(ex, ex.stack);
      throw new concrete.services.ServicesException({message: `Original exception: ${ex}`});
    }
  },
  toConcrete: (original) => {
    console.log("--- toConcrete() ---");
    try {
      return bpjson.convertBPJsonToConcrete(JSON.parse(original));
    } catch (ex) {
      console.error(ex, ex.stack);
      throw new concrete.services.ServicesException({message: `Original exception: ${ex}`});
    }
  },
});

server.listen(PORT);
console.log(`Listening on port ${PORT}...`);