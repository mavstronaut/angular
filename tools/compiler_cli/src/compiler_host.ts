import * as ts from 'typescript';
import * as path from 'path';
import {MetadataCollectorHost} from 'ts-metadata-collector';

const DEBUG = false;
function debug(msg: string, ...o: any[]) {
  if (DEBUG) console.log(msg, ...o);
}

/**
 * Implementation of CompilerHost that forwards all methods to another instance.
 * Useful for partial implementations to override only methods they care about.
 */
abstract class DelegatingHost implements ts.CompilerHost {
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
  resolveModuleNames = (moduleNames: string[], containingFile: string) =>
      this.delegate.resolveModuleNames(moduleNames, containingFile);
  fileExists = (fileName: string) => this.delegate.fileExists(fileName);
  readFile = (fileName: string) => this.delegate.readFile(fileName);
  trace = (s: string) => this.delegate.trace(s);
  directoryExists = (directoryName: string) => this.delegate.directoryExists(directoryName);
}

class ReverseModuleResolutionHost extends DelegatingHost implements MetadataCollectorHost {
  private rootDirs: string[] = [];
  private reverseMap: {[filename: string]: string} = {};

  constructor(delegate: ts.CompilerHost, private options: ts.CompilerOptions) { super(delegate); }

  // Workaround #8082
  // Collect a reverse mapping from each resolved absolute module path
  // to the requested module name.
  // Allows us to reverse the moduleResolution.
  resolveModuleNames = (moduleNames: string[], containingFile: string) => {
    const result: ts.ResolvedModule[] = [];
    moduleNames.forEach(moduleName => {
      const resolved =
          ts.resolveModuleName(moduleName, containingFile, this.options, this.delegate);
      if (resolved.resolvedModule) {
        result.push(resolved.resolvedModule);
        // Only care about absolute imports, which are subject to baseUrl/paths
        if (moduleName.indexOf(".") !== 0) {
          const modulePath = path.relative('.', resolved.resolvedModule.resolvedFileName);
          if (this.reverseMap[modulePath] && this.reverseMap[modulePath] !== moduleName) {
            throw new Error(`Cannot uniquely reverse module resolution.\n
            Path ${modulePath} is resolved from ${moduleName} and ${this.reverseMap[modulePath]}`);
          }
          debug(`Adding reverse mapping ${modulePath} => ${moduleName}`);
          this.reverseMap[modulePath] = moduleName;
        }
      }
    });
    return result;
  };

  reverseModuleResolution(fileName: string) {
    // The parsed options have absolute paths, eg.
    // basePath: 'path/to/project' and baseUrl: '../../..' => parsed.options.baseUrl: '.'
    const relPath = path.relative(this.options.baseUrl, fileName);
    const result = this.reverseMap[relPath];
    if (result) {
      debug(`### resolve ${fileName} to ${result}`);
      return result;
    }
  }
}

export function wrapCompilerHost(delegate: ts.CompilerHost,
                                 options: ts.CompilerOptions): ts.CompilerHost &
    MetadataCollectorHost {
  return new ReverseModuleResolutionHost(delegate, options);
}