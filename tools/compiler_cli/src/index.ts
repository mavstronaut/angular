// TODO(alexeagle): use --lib=node when available; remove this reference
/// <reference path="../../typings/node/node.d.ts"/>

// Must be imported first.
import 'reflect-metadata';

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {tsc} from './tsc';
import {createCompilerHost} from './compiler_host';
import {MetadataCollector} from 'tools/metadata';
import {CodeGenerator} from './codegen';
import {NodeReflectorHost} from './reflector_host';

const DEBUG = false;

function debug(msg: string, ...o: any[]) {
  if (DEBUG) console.log(msg, ...o);
}

export function main(project: string, basePath?: string): Promise<number> {
  basePath = path.join(process.cwd(), basePath || project);

  debug("Reading configuration...");
  const {options, ngOptions} = tsc.readConfiguration(project, basePath);

  debug("Initializing program...");
  const compilerHost = createCompilerHost(options);
  const program = tsc.createProgram(compilerHost);

  debug(`Generating Angular 2 code to ${ngOptions.genDir}...`);
  const metadataCollector = new MetadataCollector(compilerHost);
  const reflectorHost = new NodeReflectorHost(program, metadataCollector, basePath, compilerHost);
  const generator = CodeGenerator.create(ngOptions, program, compilerHost, reflectorHost);

  return generator.codegen(program.getRootFileNames())
      .then(() => {
        const writeFile: ts.WriteFileCallback =
            (absoluteFilePath: string, content: string, writeByteOrderMark: boolean,
             onError?: (message: string) => void, sf?: ts.SourceFile[]) => {
              if (sf.length > 1) {
                throw new Error("expected to emit one file at a time.");
              }
              const sourceFile = sf[0];
              compilerHost.writeFile(absoluteFilePath, content, false);
              // const writePath =
              //  tsc.writeEmit(sourceFile.fileName, absoluteFilePath, content);
              reflectorHost.writeMetadata(absoluteFilePath, sourceFile);
            };
        return Promise.resolve(tsc.typeCheckAndEmit(compilerHost, writeFile, program));
      })
      .catch(rejected => {
        console.error('Compile failed\n', rejected.message);
        throw new Error();
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
