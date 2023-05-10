#!/usr/bin/env node

const {readFile, writeFile} = require('fs/promises');
const path = require("path");
const AdmZip = require("adm-zip");
const jsesc = require('jsesc');
const thrift = require("thrift");
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

const concrete = require("./concrete");
const {serializeThrift, deserializeThrift} = require("./util");


const argv = yargs(hideBin(process.argv))
  .command('$0 <host> <port>',
    `\
Convert between a BP JSON corpus and a zip archive of Concrete Communications using a ConvertCommunicationService.

The direction of conversion (from Concrete or to Concrete) is inferred from the provided filenames. \
Exactly one file must have a .zip extension and that file will be interpreted as the zip archive of \
Concrete Communications.

To convert between individual BP JSON corpus entries and Concrete Communications (instead of corpora and zip files, \
respectively), use the generic Convert client.\
`
  )
  .positional('host', {
    type: 'string',
    description: 'ConvertCommunicationService host to connect to',
  })
  .positional('port', {
    type: 'number',
    description: 'ConvertCommunicationService port to connect to',
  })
  .option('about', {
    type: 'boolean',
    description: "Don't convert, just print service information to the console.",
  })
  .option('input', {
    type: 'string',
    default: '/dev/stdin',
    description: 'Path to input Concrete zip archive or BP JSON corpus',
    alias: 'i',
  })
  .option('output', {
    type: 'string',
    default: '/dev/stdout',
    description: 'Path to output Concrete zip archive or BP JSON corpus',
    alias: 'o',
  })
  .help()
  .alias('help', 'h')
  .parse();

function connect(host, port) {
  console.log(`Connecting to ${host}:${port} ...`);
  const connection = thrift.createConnection(host, port, {
    transport: thrift.TBufferedTransport,
    protocol: thrift.TBinaryProtocol,
  });
  connection.on("error", (ex) => console.error(`Connection error: ${ex.message}`));
  const client = thrift.createClient(concrete.convert.ConvertCommunicationService, connection);
  return {connection, client};
}

function createCorpus(corpusId, entryList) {
  return {
    entries: Object.fromEntries(entryList.map((entry) => [entry["entry-id"], entry])),
    "corpus-id": corpusId,
    "format-type": "bp-corpus",
    "format-version": "v10",
  };
}

if (argv.about) {
  const {connection, client} = connect(argv.host, argv.port);
  client.about()
    .then((info) => {
      console.log('Connected to service');
      console.log(`Name: ${info.name}`);
      console.log(`Version: ${info.version}`);
      console.log(`Description: ${info.description}`);
    })
    .finally(() => connection.end());
} else {
  if (argv.input.endsWith(".zip") && !argv.output.endsWith(".zip")) {
    const {connection, client} = connect(argv.host, argv.port);
    client.about()
      .then((info) => console.log(`Connected to ${info.name} version ${info.version}`))
      .then(() =>
        new AdmZip(argv.input).getEntries().map((zipEntry) =>
          deserializeThrift(zipEntry.getData(), concrete.communication.Communication)))
      .then((inputCommunicationList) =>
        Promise.all(inputCommunicationList.map((inputCommunication) =>
          client.fromConcrete(inputCommunication))))
      .then((outputDataList) =>
        writeFile(
          argv.output,
          jsesc(
            createCorpus(path.basename(argv.input), outputDataList.map(JSON.parse)),
            {json: true, compact: false, indent: '  '})))
      .finally(() => connection.end());
  } else if (!argv.input.endsWith(".zip") && argv.output.endsWith(".zip")) {
    const {connection, client} = connect(argv.host, argv.port);
    client.about()
      .then((info) => console.log(`Connected to ${info.name} version ${info.version}`))
      .then(() => readFile(argv.input))
      .then((inputData) =>
        Object.values(JSON.parse(inputData).entries).map((entry) => jsesc(entry, {json: true})))
      .then((inputDataList) =>
        Promise.all(inputDataList.map((inputData) =>
          client.toConcrete(inputData))))
      .then((outputCommunicationList) => {
        const zip = AdmZip();
        outputCommunicationList.forEach((outputCommunication) =>
          zip.addFile(`${outputCommunication.id}.concrete`, serializeThrift(outputCommunication)));
        zip.writeZip(argv.output);
      })
      .finally(() => connection.end());
  } else {
    console.error("Either the input path or the output path must end in .zip");
    console.error(`input: ${argv.input}`);
    console.error(`output: ${argv.output}`);
    process.exit(1);
  }
}
