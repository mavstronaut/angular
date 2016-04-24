import * as ts from 'typescript';
// Don't import from fs in general, that's the CompilerHost's job
import {lstatSync} from 'fs';
import * as path from 'path';
import {AngularCompilerOptions} from './codegen';

/**
 * Our interface to the TypeScript standard compiler.
 * If you write an Angular compiler plugin for another build tool,
 * you should implementa similar interface.
 */
export interface CompilerInterface {
  readConfiguration(
      project: string,
      basePath: string): {parsed: ts.ParsedCommandLine, ngOptions: AngularCompilerOptions};
  typeCheckAndEmit(compilerHost: ts.CompilerHost, oldProgram?: ts.Program): number;
}

const DEBUG = false;
const SOURCE_EXTENSION = /\.[jt]s$/;

function debug(msg: string, ...o: any[]) {
  if (DEBUG) console.log(msg, ...o);
}

export function formatDiagnostics(diags: ts.Diagnostic[]): string {
  return diags.map((d) => {
                let res = ts.DiagnosticCategory[d.category];
                if (d.file) {
                  res += ' at ' + d.file.fileName + ':';
                  const {line, character} = d.file.getLineAndCharacterOfPosition(d.start);
                  res += (line + 1) + ':' + (character + 1) + ':';
                }
                res += ' ' + ts.flattenDiagnosticMessageText(d.messageText, '\n');
                return res;
              })
      .join('\n');
}

export function check(diags: ts.Diagnostic[]) {
  if (diags && diags.length && diags[0]) {
    throw new Error(formatDiagnostics(diags));
  }
}

export class TSC implements CompilerInterface {
  public ngOptions: AngularCompilerOptions;
  public parsed: ts.ParsedCommandLine;
  private basePath: string;

  readConfiguration(project: string, basePath: string) {
    this.basePath = basePath;

    // Allow a directory containing tsconfig.json as the project value
    if (lstatSync(project).isDirectory()) {
      project = path.join(project, "tsconfig.json");
    }

    const {config, error} = ts.readConfigFile(project, ts.sys.readFile);
    check([error]);

    this.parsed =
        ts.parseJsonConfigFileContent(config, {readDirectory: ts.sys.readDirectory}, basePath);

    check(this.parsed.errors);

    // Default codegen goes to the output directory
    // Parsed options are already converted to absolute paths
    let genDir = this.parsed.options.outDir;
    this.ngOptions = config.angularCompilerOptions || {};
    if (this.ngOptions.genDir) {
      // Paths in tsconfig should be relative to the location of the tsconfig
      genDir = path.join(basePath, this.ngOptions.genDir);
    }
    if (!genDir) {
      throw new Error("Must set either compilerOptions.outDir or angularCompilerOptions.genDir");
    }
    this.ngOptions.genDir = genDir;
    return {parsed: this.parsed, ngOptions: this.ngOptions};
  }

  typeCheckAndEmit(compilerHost: ts.CompilerHost, oldProgram?: ts.Program): number {
    let diagnostics: ts.Diagnostic[] = [];

    const program =
        ts.createProgram(this.parsed.fileNames, this.parsed.options, compilerHost, oldProgram);
    debug("Checking global diagnostics...");
    check(program.getGlobalDiagnostics());

    debug("Type checking...");
    for (let sf of program.getSourceFiles()) {
      diagnostics.push(...ts.getPreEmitDiagnostics(program, sf));
    }
    check(diagnostics);

    debug("Emitting outputs...");

    let failed = false;
    for (let sourceFile of program.getRootFileNames()) {
      let {diagnostics, emitSkipped} = program.emit(program.getSourceFile(sourceFile), (jsEmitPath: string, content: string) => {
              compilerHost.writeFile(jsEmitPath, content, false);
      });
      diagnostics.push(...diagnostics);
      failed = failed || emitSkipped;
    }
    check(diagnostics);
    return failed ? 1 : 0;
  }
}
export var tsc: CompilerInterface = new TSC();
