export * from './change_detection';
export * from './core';
export * from './annotations';
export * from './directives';
export * from './forms';
export * from './di';
export {Observable, EventEmitter} from 'angular2/src/facade/async';
export * from 'angular2/src/render/api';
export {DomRenderer, DOCUMENT_TOKEN} from 'angular2/src/render/dom/dom_renderer';

// Exports needed to make angular2.d.ts work,
// because these symbols are dependencies of other exports but are not otherwise exported.
// This should be cleaned up in one of two ways:
// 1) if the symbol is intended to be part of the public API, then re-export somewhere else
// 2) if the symbol should be omitted from the public API, then the class exposing it should
//    not be exported, or should avoid exposing the symbol.
export {AbstractChangeDetector} from './src/change_detection/abstract_change_detector';
export {ProtoRecord} from './src/change_detection/proto_record';
export * from './src/core/compiler/element_injector';
export {Directive, LifecycleEvent} from './src/core/annotations_impl/annotations';
export {FormDirective} from './src/forms/directives/form_directive';
export {ControlContainerDirective} from './src/forms/directives/control_container_directive';
export {Injectable} from './src/di/annotations_impl';
export {BaseQueryList} from './src/core/compiler/base_query_list';
export {AppProtoView} from './src/core/compiler/view';
export * from './src/change_detection/parser/ast';
export {Visibility} from './src/core/annotations_impl/visibility';
