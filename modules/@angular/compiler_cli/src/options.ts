// TODO(alexeagle): we end up passing options and ngOptions everywhere.
// Maybe this should extend ts.CompilerOptions so we only need this one.
export interface AngularCompilerOptions {
  // Absolute path to a directory where generated file structure is written
  genDir: string;

  // Path to the directory containing the tsconfig.json file.
  basePath: string;

  // Don't do the template code generation
  skipTemplateCodegen: boolean;

  // Don't produce .metadata.json files (they don't work for bundled emit with --out)
  skipMetadataEmit: boolean;

  // Lookup angular's symbols using the old angular2/... npm namespace.
  legacyPackageLayout: boolean;

  // Print extra information while running the compiler
  trace: boolean;

  // Translate outputs to ES6 that is valid input to closure compiler
  googleClosureOutput: boolean;
}
