#!/usr/bin/env node

'use strict'

const spawn = require('child_process').spawn
const sqlite = require('sqlite3')
const extname = require('path').extname
const open = require('fs').createWriteStream
const sqleton = require('..')


const argv = require('yargs')
  .usage('Usage: $0 [options] <database>')
  .demand(1)
  .wrap(78)

  .option('L', {
    alias: 'layout', describe: 'Layout command.', default: 'sfdp', choices: [
      'neato', 'dot', 'circo', 'fdp', 'osage', 'sfdp', 'twopi'
    ]
  })

  .options('e', {
    alias: 'edge-labels', type: 'boolean',
    describe: 'Label foreign key edges.'
  })

  .options('t', {
    alias: 'title', describe: 'Optional title string.'
  })

  .option('o', {
    alias: 'out', required: true, describe:
      'Output file (determines output format).'
  })

  .argv



function fail(error) {
  if (error) {
    process.stderr.write(`${error.stack}\n`)
  }
  process.exit(1)
}

const db = new sqlite.Database(argv._[0], sqlite.OPEN_READONLY, error => {
  if (error) return fail(error)

  let format = extname(argv.out).slice(1)
  let stream, proc

  if (format !== 'dot') {
    proc = spawn(argv.layout, [`-T${format}`, `-o${argv.out}`])
    proc.stderr.pipe(process.stderr)

    stream = proc.stdin

  } else {
    stream = open(argv.out, { autoClose: true })
  }

  sqleton(db, stream, argv)
    .then(() => { db.close() })
    .then(() => { stream.end() })
    .catch(fail)
})
