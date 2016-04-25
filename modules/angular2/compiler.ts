/**
 * @module
 * @description
 * Starting point to import all compiler APIs.
 */
export {
  PLATFORM_DIRECTIVES,
  PLATFORM_PIPES,
  COMPILER_PROVIDERS,
  TEMPLATE_TRANSFORMS,
  CompilerConfig,
  RenderTypes,
  UrlResolver,
  DEFAULT_PACKAGE_URL_PROVIDER,
  createOfflineCompileUrlResolver,
  XHR,
  ViewResolver,
  DirectiveResolver,
  PipeResolver,
  SourceModule,
  NormalizedComponentWithViewDirectives,
  OfflineCompiler,
  CompileMetadataWithIdentifier,
  CompileMetadataWithType,
  CompileIdentifierMetadata,
  CompileDiDependencyMetadata,
  CompileProviderMetadata,
  CompileFactoryMetadata,
  CompileTokenMetadata,
  CompileTypeMetadata,
  CompileQueryMetadata,
  CompileTemplateMetadata,
  CompileDirectiveMetadata,
  CompilePipeMetadata
} from 'angular2/src/compiler/compiler';
export {StaticReflector} from 'angular2/src/compiler/static_reflector';
export {RuntimeMetadataResolver} from 'angular2/src/compiler/runtime_metadata';
export {HtmlParser} from 'angular2/src/compiler/html_parser';
export {DirectiveNormalizer} from 'angular2/src/compiler/directive_normalizer';
export {Lexer} from 'angular2/src/compiler/expression_parser/lexer';
export {Parser} from 'angular2/src/compiler/expression_parser/parser';
export {TemplateParser} from 'angular2/src/compiler/template_parser';
export {DomElementSchemaRegistry} from 'angular2/src/compiler/schema/dom_element_schema_registry';
export {StyleCompiler} from 'angular2/src/compiler/style_compiler';
export {ViewCompiler} from 'angular2/src/compiler/view_compiler/view_compiler';
export {TypeScriptEmitter} from 'angular2/src/compiler/output/ts_emitter';

export * from 'angular2/src/compiler/template_ast';
