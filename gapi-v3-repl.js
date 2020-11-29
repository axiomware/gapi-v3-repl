/*
 * REPL for Netrunr GAPI MQTT asynchronous API V3
 *
 * Copyright(C) 2020 Axiomware Systems Inc..
 */

'use strict'

//node --experimental-repl-await .\gapi-v3-repl3.js -h 192.168.8.1 -p 1883 -t 'netrunrfe'

const decache = require('decache');
const Repl = require("repl");
const minimist = require('minimist')
const fs = require('fs')
const path = require('path')
const gNetrunrCLI = require("gapi-v3-sdk");


process.stdin.resume();//so the program will not close instantly
//On exit handler
process.on('exit', function (err) {
  console.log('Bye')
});

// Ensure any unhandled promise rejections get logged.
process.on('unhandledRejection', (reason, p) => {
  console.log('unhandledRejection')
    console.log(reason)
    console.log(p)
    // application specific logging, throwing an error, or other logic here
});

// Ensure any unhandled exceptions get logged.
process.on('uncaughtException', (reason, p) => {
  console.log('uncaughtException')
    console.log(reason)
    console.log(p)
    // application specific logging, throwing an error, or other logic here
});


function exitTerminator(sig) {
    if (typeof sig === "string") {
        console.log('Received %s - terminating server app ...', sig);
        process.exit(1);
    }
    console.log('Node server stopped.');
}

const args = minimist(process.argv.slice(2), {
    string: ['host', // MQTT broker IP addr
      'port', // MQTT broker port
      'prefix', // Topic prefix
      'ca-filename', // Root CA file name
      'key-filename', // client key
      'crt-filename' // client certificate
    ],
    boolean: ['tls'], // true -> if TLS is needed
    alias: { h: 'host', p: 'port', t: 'prefix' },
    default: {
      host: '192.168.8.1',
      port: '1883',
      prefix: 'netrunrfe/',
      tls: false,
      'ca-filename': '',
      'key-filename': '',
      'crt-filename': ''
    }
  })


// Use AWS MQTT for outbound data
var CA = null
var KEY = null
var CRT = null

var gHostFE = args.host
var gPortFE = args.port
var gTLS = args.tls
if (gTLS) {
  if (args['ca-filename']) {
    const caFQN = path.isAbsolute(args['ca-filename']) ? args['ca-filename'] : path.join(__dirname, args['ca-filename'])
    try {
      CA = fs.readFileSync(caFQN)
    } catch (err) {
      logger.info({ log: err }, `Error reading CA file [${caFQN}]`)
    }
  }
  if (args['key-filename']) {
    const keyFQN = path.isAbsolute(args['key-filename']) ? args['key-filename'] : path.join(__dirname, args['key-filename'])
    try {
      KEY = fs.readFileSync(keyFQN)
    } catch (err) {
      logger.info({ log: err }, `Error reading KEY file [${keyFQN}]`)
    }
  }
  if (args['crt-filename']) {
    const crtFQN = path.isAbsolute(args['crt-filename']) ? args['crt-filename'] : path.join(__dirname, args['crt-filename'])
    try {
      CRT = fs.readFileSync(crtFQN)
    } catch (err) {
      logger.info({ log: err }, `Error reading CRT file [${crtFQN}]`)
    }
  }
}

var gOptionsFE = {
  username: '',
  password: '',
  key: KEY,
  cert: CRT,
  ca: CA,
  rejectUnauthorized: false
}

var gTopicPrefixFE = args.prefix

//One per MQTT broker
const gNetrunrClient = new gNetrunrCLI.GapiClient(); 

// Utility function for delay
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// Color functions
const colors = { RED: "31", GREEN: "32", YELLOW: "33", BLUE: "34", MAGENTA: "35" };
const colorize = (color, s) => `\x1b[${color}m${s}\x1b[0m`;

// Some useful stuff
const user = colorize(colors.MAGENTA, process.env.USER);
const cwd = colorize(colors.YELLOW, process.cwd());
const say = message => () => console.log(message);
const sayWelcome = say(`
  Hello, ${user}!
  You're running the Node.js REPL in ${cwd}.
`);

const nodeVersion = colorize(colors.GREEN, `${process.title} ${process.version}`);
const prompt = `${nodeVersion} → `;

main()

async function main () {
  // Print the welcome message
  console.log(`
  Hello, ${process.env.USER}!
  You're running the Node.js REPL in ${process.cwd()}.
  `);
  
  //connect to the MQTT broker
  await gNetrunrClient.init(gHostFE, gPortFE, gOptionsFE, gTopicPrefixFE, gTLS)

  // Start the REPL
  const repl = Repl.start({ prompt });

  // Export functions into REPL context
  repl.context.gNetrunrClient = gNetrunrClient;
  repl.context.decache = decache;
  repl.context.sleep = sleep;
}




