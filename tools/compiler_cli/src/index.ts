// TODO(alexeagle): use --lib=node when available; remove this reference
/// <reference path="../../typings/node/node.d.ts"/>

// Must be imported first.
import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {tsc, check} from './tsc';
import {createCompilerHost} from './compiler_host';
import {CodeGenerator} from './codegen';

const DEBUG = false;

function debug(msg: string, ...o: any[]) {
  if (DEBUG) console.log(msg, ...o);
}

export function main(project: string, basePath?: string): Promise<number> {
  // file names in tsconfig are resolved relative to this absolute path
  basePath = path.join(process.cwd(), basePath || project);

  // read the configuration options from wherever you store them
  const {parsed, ngOptions} = tsc.readConfiguration(project, basePath);

  // use our compiler host, which wraps the built-in one from TypeScript
  const compilerHost =
      createCompilerHost(ts.createCompilerHost(parsed.options, true), parsed.options);
  const {errors, generator} = CodeGenerator.create(ngOptions, parsed, compilerHost);
  check(errors);

  return generator.codegen()
      .then(() => { return tsc.typeCheckAndEmit(compilerHost, generator.program); })
      .catch(rejected => {
        console.error('Compile failed\n', rejected.message);
        throw new Error(rejected);
      });
}

// CLI entry point
if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  try {
    main(args.p || args.project || '.', args.basePath)
        .then(exitCode => process.exit(exitCode))
        .catch(r => { process.exit(1); });
  } catch (e) {
    console.error('FATAL', e.message, e.stack);
    process.exit(1);
  }
}
