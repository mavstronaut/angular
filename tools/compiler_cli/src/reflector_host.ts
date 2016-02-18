import {StaticReflectorHost, StaticType} from 'angular2/src/compiler/static_reflector';
import * as ts from 'typescript';
import {MetadataCollector, ModuleMetadata} from 'tools/metadata';
import * as fs from 'fs';

const EXTS = ['', '.ts', '.d.ts', '.js', '.jsx', '.tsx'];
const DTS = /\.d\.ts$/;

export class NodeReflectorHost implements StaticReflectorHost {
  constructor(private program: ts.Program, private metadataCollector: MetadataCollector,
              private basePath: string, private compilerHost: ts.CompilerHost) {}

  getMetadataFor(moduleId: string): ModuleMetadata {
    let filePath: string;

    const resolved = this.compilerHost.resolveModuleNames([moduleId], '');
    if (resolved && resolved.length) {
      filePath = resolved[0].resolvedFileName;
      if (DTS.test(filePath)) {
        const metadataPath = filePath.replace(DTS, '.metadata.json');
        if (fs.existsSync(metadataPath)) {
          return this.readMetadata(metadataPath);
        }
      }
    }

    if (!filePath) {
      throw new Error(`Could not locate any file containing module ${moduleId}`);
    }

    let sf = this.program.getSourceFile(filePath);
    if (!sf) {
      throw new Error(`Source file ${filePath} not present in program.`);
    }
    return this.metadataCollector.getMetadata(sf, this.program.getTypeChecker());
  }

  readMetadata(filePath: string) {
    try {
      return JSON.parse(fs.readFileSync(filePath, {encoding: 'utf-8'}));
    } catch (e) {
      console.error(`Failed to read JSON file ${filePath}`);
      throw e;
    }
  }

  writeMetadata(emitFilePath: string, sourceFile: ts.SourceFile) {
    if (DTS.test(emitFilePath)) {
      const path = emitFilePath.replace(DTS, '.metadata.json');
      const metadata =
          this.metadataCollector.getMetadata(sourceFile, this.program.getTypeChecker());
      if (metadata && metadata.metadata) {
        const metadataText = JSON.stringify(metadata);
        fs.writeFileSync(path, metadataText, {encoding: 'utf-8'});
      }
    }
  }
}
