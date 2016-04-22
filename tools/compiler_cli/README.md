# Angular Template Compiler

Angular applications are built with templates, which may be `.html` or `.css` files,
or may be inline `template` attributes on Decorators like `@Component`.

These templates are always compiled into executable JS when the application runs.
This compilation can occur on the client, but it results in slower load time, and also
requires that the compiler be included in the code downloaded to the client.

You can produce smaller, faster applications by running Angular's compiler as a build step,
and then downloading only the executable JS to the client.

## Configuration

The `tsconfig.json` file is expected to contain an additional configuration block:
```
 "angularCompilerOptions": {
   "genDir": "codegen"
 }
```
the `genDir` option controls the path (relative to `tsconfig.json`) where the generated file tree
will be written. More options may be added as we implement more features.

You can include this generated folder into your application using the `rootDirs` option to
TypeScript 1.9 and above. This allows your application to live in two different root folders,
but import statements act as if the files are all together in the same tree.

See the example in the `test/` directory for a working example.

## Compiler CLI

This program mimics the TypeScript tsc command line. It accepts a `-p` flag which points to a
`tsconfig.json` file, or a directory containing one.

This CLI is intended for demos, prototyping, or for users with simple build systems
that run bare `tsc`.

Users with a build system should expect an Angular 2 template plugin. Such a plugin would be
based on the `index.ts` in this directory, but should share the TypeScript compiler instance
with the one already used in the plugin for TypeScript typechecking and emit.

## Design
At a high level, this program
- collects static metadata about the sources using the `ts-metadata-collector` package in angular2
- uses the `OfflineCompiler` from `angular2/src/compiler/compiler` to codegen additional `.ts` files
- these `.ts` files are written to the `genDir` path, then compiled together with the application.

## For developers
Run the compiler from source:
```
# Build angular2
gulp build.js.cjs
# Build the compiler
./node_modules/.bin/tsc -p tools/compiler_cli
# Run it on the test project
node ./dist/js/cjs/compiler_cli -p tools/compiler_cli/test
```
