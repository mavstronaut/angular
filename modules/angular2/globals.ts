/// <reference path="typings/jasmine/jasmine.d.ts" />
/// <reference path="typings/hammerjs/hammerjs.d.ts" />
/// <reference path="typings/zone/zone.d.ts" />
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/typescript/lib.core.d.ts" />
/// <reference path="typings/typescript/lib.dom.d.ts" />
/// <reference path="typings/typescript/lib.symbol.d.ts" />

/**
 * This file contains declarations of global objects we reference in our code
 */

declare var assert: any;
declare var module: any;
declare var $traceurRuntime: any;
declare var global: Window;
declare var $: any;
declare var angular: any;
declare var _resolve: any;
declare var require: any;
declare var browser: any;
declare var benchpressRunner: any;

type int = number;
type Type = {new (...args: any[]): any};
interface List<T> extends Array<T> {}
type TemplateElement = HTMLTemplateElement;
type StyleElement = HTMLStyleElement;
type SetterFn = Function;
type GetterFn = Function;
type MethodFn = Function;

type _globalRegExp = RegExp;


interface HTMLElement {
	createShadowRoot(): HTMLElement;
}

interface HTMLTemplateElement extends HTMLElement {
    content: DocumentFragment
}

interface Window {
    Object: typeof Object;
    Array: typeof Array;
    List: typeof Array;
    Map: typeof Map;
    Set: typeof Set;
    Date: typeof Date;
    RegExp: typeof RegExp;
    JSON: typeof JSON;
    Math: typeof Math;
    assert: typeof assert;
    NaN: typeof NaN;
    setTimeout: typeof setTimeout;
    Promise: typeof Promise;
    zone: Zone;
    Hammer: HammerStatic;
    DocumentFragment: DocumentFragment;
    Node: Node;
    NodeList: NodeList;
    Text: Text;
    HTMLElement: HTMLElement;
    HTMLTemplateElement: TemplateElement;
    HTMLStyleElement: StyleElement;
    gc(): void;
}

// Test extensions
interface Window extends jasmine.GlobalPolluter {
    print(msg: string): void;
    dump(msg: string): void;

    describe(description: string, specDefinitions: () => void): jasmine.Suite;
    ddescribe(description: string, specDefinitions: () => void): jasmine.Suite;
    beforeEach(beforeEachFunction: () => void): void;
    beforeAll(beforeAllFunction: () => void): void;
    afterEach(afterEachFunction: () => void): void;
    afterAll(afterAllFunction: () => void): void;
    xdescribe(desc: string, specDefinitions: () => void): jasmine.XSuite;
    it(description: string, func: (done?: () => void) => void): jasmine.Spec;
    iit(description: string, func: () => void): jasmine.Spec;
    xit(desc: string, func: () => void): jasmine.XSpec;
}

declare module jasmine {
    interface Matchers {
        toHaveText(text: string): void;
        toBeAnInstanceOf(obj: any): void;
        toBePromise(): void;
        toBe(value: any): void;
   }
}

interface Map<K,V> {
    jasmineToString?(): void;
}

interface Console {
    profileEnd(str: string);
}