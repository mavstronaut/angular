import * as ts from 'typescript';
import * as path from 'path';
import * as tsickle from 'tsickle';
import {NodeReflectorHost} from './reflector_host';
import {AngularCompilerOptions} from './codegen';

/**
 * Implementation of CompilerHost that forwards all methods to another instance.
 * Useful for partial implementations to override only methods they care about.
 */
export abstract class DelegatingHost implements ts.CompilerHost {
  constructor(protected delegate: ts.CompilerHost) {}
  getSourceFile =
      (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) =>
          this.delegate.getSourceFile(fileName, languageVersion, onError);

  getCancellationToken = () => this.delegate.getCancellationToken();
  getDefaultLibFileName = (options: ts.CompilerOptions) =>
      this.delegate.getDefaultLibFileName(options);
  getDefaultLibLocation = () => this.delegate.getDefaultLibLocation();
  writeFile: ts.WriteFileCallback = this.delegate.writeFile;
  getCurrentDirectory = () => this.delegate.getCurrentDirectory();
  getCanonicalFileName = (fileName: string) => this.delegate.getCanonicalFileName(fileName);
  useCaseSensitiveFileNames = () => this.delegate.useCaseSensitiveFileNames();
  getNewLine = () => this.delegate.getNewLine();
  fileExists = (fileName: string) => this.delegate.fileExists(fileName);
  readFile = (fileName: string) => this.delegate.readFile(fileName);
  trace = (s: string) => this.delegate.trace(s);
  directoryExists = (directoryName: string) => this.delegate.directoryExists(directoryName);
}

export class TsickleHost extends DelegatingHost {
  // Additional diagnostics gathered by pre- and post-emit transformations.
  public diagnostics: ts.Diagnostic[] = [];
  // tsickle wants to use the program even though the reference usually goes the other way
  public program: ts.Program;
  private TSICKLE_SUPPORT = `
interface DecoratorInvocation {
  type: Function;
  args?: any[];
}
`;
  constructor(delegate: ts.CompilerHost, private options: ts.CompilerOptions,
              private ngOptions: AngularCompilerOptions) {
    super(delegate);
  }

  getSourceFile =
      (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) => {
        let originalContent = this.delegate.readFile(fileName);
        if (/\.d\.ts$/.test(fileName)) {
          return ts.createSourceFile(fileName, originalContent, languageVersion, true);
        } else {
          let firstPass = originalContent;
          if (this.ngOptions.googleClosureOutput) {
            const annotateResult =
                tsickle.annotate(this.program, this.program.getSourceFile(fileName), {untyped:true});
            if (annotateResult.diagnostics) {
              this.diagnostics.push(...annotateResult.diagnostics);
            }
            firstPass = annotateResult.output;
          }
          const converted = tsickle.convertDecorators(fileName, firstPass);
          if (converted.diagnostics) {
            this.diagnostics.push(...converted.diagnostics);
          }
          return ts.createSourceFile(fileName, converted.output + this.TSICKLE_SUPPORT,
                                     languageVersion, true);
        }
      };

  /**
   * Massages file names into valid goog.module names:
   * - resolves relative paths to the given context
   * - replace resolved module path with module name
   * - replaces '/' with '$' to have a flat name.
   * - replace first char if non-alpha
   * - replace subsequent non-alpha numeric chars
   */
  static pathToGoogModuleName(context:string, importPath:string) {
    importPath = importPath.replace(/\.js$/, '');
    if (importPath[0] == '.') {
      // './foo' or '../foo'.
      // Resolve the path against the dirname of the current module.
      importPath = path.join(path.dirname(context), importPath);
    }
    const dist = /dist\/packages-dist\/([^\/]+)\/esm\/(.*)/;
    if (dist.test(importPath)) {
      importPath = importPath.replace(dist, (match:string, pkg:string, impt:string) => {
        return `@angular/${pkg}/${impt}`;
      }).replace(/\/index$/, '');
    }
    const rxDist = /dist\/es6\/(.*)/;
    if (rxDist.test(importPath)) {
      importPath = importPath.replace(rxDist, "rxjs/$1");
    }
    // Replace characters not supported by goog.module.
    let moduleName = importPath.replace(/\//g, '$')
      .replace(/_/g, '__')
      .replace(/^[^a-zA-Z_$]/, '_')
      .replace(/[^a-zA-Z_0-9._$]/g, '_');
    return moduleName;
  }

  writeFile: ts.WriteFileCallback =
      (fileName: string, data: string, writeByteOrderMark: boolean,
       onError?: (message: string) => void, sourceFiles?: ts.SourceFile[]) => {
        let toWrite = data;
        if (/\.js$/.test(fileName) && this.ngOptions.googleClosureOutput) {
          const {output, referencedModules} = tsickle.convertCommonJsToGoogModule(
            path.relative(this.delegate.getCurrentDirectory(), fileName), data, TsickleHost.pathToGoogModuleName);
          toWrite = output;
        }
        return this.delegate.writeFile(fileName, toWrite, writeByteOrderMark, onError, sourceFiles);
      };
}

const IGNORED_FILES = /\.ngfactory\.js$|\.css\.js$|\.css\.shim\.js$/;

export class MetadataWriterHost extends DelegatingHost {
  private reflectorHost: NodeReflectorHost;
  constructor(delegate: ts.CompilerHost, program: ts.Program, options: ts.CompilerOptions,
              ngOptions: AngularCompilerOptions) {
    super(delegate);
    this.reflectorHost = new NodeReflectorHost(program, this, options, ngOptions);
  }

  writeFile: ts.WriteFileCallback = (fileName: string, data: string, writeByteOrderMark: boolean,
                                     onError?: (message: string) => void,
                                     sourceFiles?: ts.SourceFile[]) => {
    if (/\.d\.ts$/.test(fileName)) {
      // Let the original file be written first; this takes care of creating parent directories
      this.delegate.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);

      // TODO: remove this early return after https://github.com/Microsoft/TypeScript/pull/8412 is
      // released
      return;
    }

    if (IGNORED_FILES.test(fileName)) {
      return;
    }

    if (!sourceFiles) {
      throw new Error('Metadata emit requires the sourceFiles are passed to WriteFileCallback. ' +
                      'Update to TypeScript ^1.9.0-dev');
    }
    if (sourceFiles.length > 1) {
      throw new Error('Bundled emit with --out is not supported');
    }
    this.reflectorHost.writeMetadata(fileName, sourceFiles[0]);
  };
}
