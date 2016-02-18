# Compiler CLI

This program mimics the TypeScript tsc command line. It accepts a `-p` flag which points to a
`tsconfig.json` file, or a directory containing one.

This CLI is only intended for demos, prototyping, or for users with simple build systems
that run bare `tsc`.
Users with a build system should expect an Angular 2 template plugin. Such a plugin would be
based on the `index.ts` in this directory, but should share the TypeScript compiler instance
with the one used for emit.

## Design
At a high level, this program
- collects static metadata about the sources using the `tools/metadata` package in angular2
- uses the `OfflineCompiler` from `angular2/src/compiler/compiler` to codegen additional `.ts` files
- the `bootstrap` call should be proceeded by calling the generated `initReflectors` method

See the example in the `test/` directory for a working example.

## Running the compiler

```shell
# Build angular2
gulp build.js.cjs
# Build the compiler
./node_modules/.bin/tsc -p tools/compiler_cli
# Run it on the test project
node ./dist/js/cjs/compiler_cli -p tools/compiler_cli/test --genDir dist/tools/compiler_cli/test/gen
```
