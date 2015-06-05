///<reference path="../typings/jasmine/jasmine.d.ts"/>

import {DtsGenerator} from './index';

describe("module traversal", () => {
  it("finds all exported symbols", () => {
    let gen = new DtsGenerator('.', ['tools/dts-generator/testdata/nested/*.ts']);
    gen.traverseExports('tools/dts-generator/testdata/nested/root');
    
    expect(gen.rootExportedSymbols['foo']).toBeDefined();
    expect(gen.rootExportedSymbols['Grand']).toBeDefined();
  });
  
  it("detects an exported symbol whose supertype is not exported", () => {
    let gen = new DtsGenerator('.', ['tools/dts-generator/testdata/driving/*.ts']);
    gen.traverseExports('tools/dts-generator/testdata/driving/root');
    expect(() => gen.emitDts()).toThrowError(/Vehicle/);
  });
});

describe("dts emit", () => {
  it("emits classes", () => {
    let gen = new DtsGenerator('.', ['tools/dts-generator/testdata/nested/*.ts']);
    gen.traverseExports('tools/dts-generator/testdata/nested/root');
    gen.emitDts();
    expect(gen.renderedDts).toContain('Grand');
  });
});