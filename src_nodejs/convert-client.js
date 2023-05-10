#!/usr/bin/env node

const {readFile, writeFile} = require('fs/promises');
const thrift = require("thrift");
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

const concrete = require("./concrete");
const {serializeThrift, deserializeThrift} = require("./util");


const argv = yargs(hideBin(process.argv))
  .command('$0 <host> <port>',
    `\
Send file contents to a Concrete ConvertCommunicationService and write converted contents to a file.

Can convert from a Concrete Communication to another format or vice versa. \
What the "other" format is depends on the implementation of the convert service. \
Use the --about flag to get information about the specified service's implementation.

The direction of conversion (from Concrete or to Concrete) is inferred from the provided filenames. \
Exactly one file must have a .concrete or .comm extension and that file will be interpreted as the \
Concrete Communication. \
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
    description: 'Path to input Concrete Communication or non-Concrete file',
    alias: 'i',
  })
  .option('output', {
    type: 'string',
    default: '/dev/stdout',
    description: 'Path to output non-Concrete or Concrete Communication file',
    alias: 'o',
  })
  .help()
  .alias('help', 'h')
  .parse();

function isConcretePath(path) {
  return path.endsWith('.concrete') || path.endsWith('.comm');
}

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
  if (isConcretePath(argv.input) && !isConcretePath(argv.output)) {
    const {connection, client} = connect(argv.host, argv.port);
    client.about()
      .then((info) => console.log(`Connected to ${info.name} version ${info.version}`))
      .then(() => readFile(argv.input))
      .then((inputData) => client.fromConcrete(
        deserializeThrift(inputData, concrete.communication.Communication)
      ))
      .then((outputData) => writeFile(argv.output, outputData))
      .finally(() => connection.end());
  } else if (!isConcretePath(argv.input) && isConcretePath(argv.output)) {
    const {connection, client} = connect(argv.host, argv.port);
    client.about()
      .then((info) => console.log(`Connected to ${info.name} version ${info.version}`))
      .then(() => readFile(argv.input))
      .then((inputData) => client.toConcrete(inputData))
      .then((outputObj) => writeFile(argv.output, serializeThrift(outputObj)))
      .finally(() => connection.end());
  } else {
    console.error("Either the input path or the output path must end in .concrete or .comm");
    console.error(`input: ${argv.input}`);
    console.error(`output: ${argv.output}`);
    process.exit(1);
  }
}
