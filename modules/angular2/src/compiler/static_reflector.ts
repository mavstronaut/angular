import {StringMapWrapper} from 'angular2/src/facade/collection';
import {
  isArray,
  isPresent,
  isPrimitive,
} from 'angular2/src/facade/lang';
import {
  AttributeMetadata,
  DirectiveMetadata,
  ComponentMetadata,
  ContentChildrenMetadata,
  ContentChildMetadata,
  InputMetadata,
  HostBindingMetadata,
  HostListenerMetadata,
  OutputMetadata,
  PipeMetadata,
  ViewMetadata,
  ViewChildMetadata,
  ViewChildrenMetadata,
  ViewQueryMetadata,
  QueryMetadata,
} from 'angular2/src/core/metadata';
import {ReflectorReader} from 'angular2/src/core/reflection/reflector_reader';
import {Provider} from 'angular2/src/core/di/provider';
import {
  HostMetadata, OptionalMetadata, InjectableMetadata,
  SelfMetadata, SkipSelfMetadata, InjectMetadata
} from "angular2/src/core/di/metadata";

/**
 * The host of the static resolver is expected to be able to provide module metadata in the form of
 * ModuleMetadata. Angular 2 CLI will produce this metadata for a module whenever a .d.ts files is
 * produced and the module has exported variables or classes with decorators. Module metadata can
 * also be produced directly from TypeScript sources by using MetadataCollector in tools/metadata.
 */
export interface StaticReflectorHost {
  /**
   *  Return a ModuleMetadata for the given module.
   *
   * @param moduleId is a string identifier for a module as an absolute path.
   * @returns the metadata for the given module.
   */
  getMetadataFor(modulePath: string): {[key: string]: any};

  /**
   * Resolve a module from an import statement form to an absolute path.
   * @param moduleName the location imported from
   * @param containingFile for relative imports, the path of the file containing the import
   */
  resolveModule(moduleName: string, containingFile?: string): string;

  findDeclaration(modulePath: string, symbolName: string): {declarationPath: string, declaredName: string};
}

/**
 * A token representing the a reference to a static type.
 *
 * This token is unique for a moduleId and name and can be used as a hash table key.
 */
export class StaticType {
  constructor(public moduleId: string, public name: string) {}
}

/**
 * A static reflector implements enough of the Reflector API that is necessary to compile
 * templates statically.
 */
export class StaticReflector implements ReflectorReader {
  private typeCache = new Map<string, StaticType>();
  private annotationCache = new Map<StaticType, any[]>();
  private propertyCache = new Map<StaticType, {[key: string]: any}>();
  private parameterCache = new Map<StaticType, any[]>();
  private metadataCache = new Map<string, {[key: string]: any}>();
  constructor(private host: StaticReflectorHost) { this.initializeConversionMap(); }

  importUri(typeOrFunc: any): string { return (<StaticType>typeOrFunc).moduleId; }

  /**
   * getStaticType produces a Type whose metadata is known but whose implementation is not loaded.
   * All types passed to the StaticResolver should be pseudo-types returned by this method.
   *
   * @param moduleId the module identifier as an absolute path.
   * @param name the name of the type.
   */
  public getStaticType(moduleId: string, name: string): StaticType {
    let key = `"${moduleId}".${name}`;
    let result = this.typeCache.get(key);
    if (!isPresent(result)) {
      result = new StaticType(moduleId, name);
      this.typeCache.set(key, result);
    }
    return result;
  }

  public annotations(type: StaticType): any[] {
    let annotations = this.annotationCache.get(type);
    if (!isPresent(annotations)) {
      let classMetadata = this.getTypeMetadata(type);
      if (isPresent(classMetadata['decorators'])) {
        annotations = (<any[]>classMetadata['decorators'])
                          .map(decorator => this.convertKnownDecorator(type.moduleId, decorator))
                          .filter(decorator => isPresent(decorator));
      } else {
        annotations = [];
      }
      this.annotationCache.set(type, annotations);
    }
    return annotations;
  }

  public propMetadata(type: StaticType): {[key: string]: any} {
    let propMetadata = this.propertyCache.get(type);
    if (!isPresent(propMetadata)) {
      let classMetadata = this.getTypeMetadata(type);
      propMetadata = this.getPropertyMetadata(type.moduleId, classMetadata['members']);
      if (!isPresent(propMetadata)) {
        propMetadata = {};
      }
      this.propertyCache.set(type, propMetadata);
    }
    return propMetadata;
  }

  public parameters(type: StaticType): any[] {
    let parameters = this.parameterCache.get(type);
    if (!isPresent(parameters)) {
      let classMetadata = this.getTypeMetadata(type);
      if (isPresent(classMetadata)) {
        let members = classMetadata['members'];
        if (isPresent(members)) {
          let ctorData = members['__ctor__'];
          if (isPresent(ctorData)) {
            let ctor = (<any[]>ctorData).find(a => a['__symbolic'] === 'constructor');
            let parameterTypes = this.simplify(type.moduleId, ctor['parameters'], false);
            let parameterDecorators = this.simplify(type.moduleId, ctor['parameterDecorators'], false);

            parameters = parameterTypes.map((paramType, index) => {
              let nestedResult = [];
              const decorators = parameterDecorators ? parameterDecorators[index] : null;
              if (isPresent(paramType)) {
                nestedResult.push(paramType);
              }
              if (isPresent(decorators)) {
                nestedResult.push(...decorators);
              }
              return nestedResult;
            });
          }
        }
      }
      if (!isPresent(parameters)) {
        parameters = [];
      }
      this.parameterCache.set(type, parameters);
    }
    return parameters;
  }

  // TODO: move into simplify?!
  private conversionMap = new Map<StaticType, (moduleContext: string, expression: any) => any>();
  private initializeConversionMap(): any {
    let core_metadata = this.host.resolveModule('angular2/src/core/metadata');
    let di_metadata = this.host.resolveModule('angular2/src/core/di/metadata');
    let conversionMap = this.conversionMap;

    // FIXME: conversionMap.set(this.getStaticType(core_metadata, 'Host'), );
    const callExpr = expression['expression'];
    const varArgs = _this.simplify(expression['arguments'], moduleContext, false);
    // check module FIXME
    switch (callExpr['name']) {
      case 'Host':
        return new HostMetadata(...varArgs);
      case 'Optional':
        return new OptionalMetadata(...varArgs);
      case 'Injectable':
        return new InjectableMetadata(...varArgs);
      case 'Self':
        return new SelfMetadata(...varArgs);
      case 'SkipSelf':
        return new SkipSelfMetadata(...varArgs);
      case 'Attribute':
        return new AttributeMetadata(...varArgs);
      case 'Inject':
        return new InjectMetadata(...varArgs);
      case 'Query':
        return new QueryMetadata(...varArgs);
      case 'ViewQuery':
        return new ViewQueryMetadata(...varArgs);
      case 'ContentChild':
        return new ContentChildMetadata(...varArgs);
      case 'ContentChildren':
        return new ContentChildrenMetadata(...varArgs);
      case 'ViewChild':
        return new ViewChildMetadata(...varArgs);
      case 'ViewChildren':
        return new ViewChildrenMetadata(...varArgs);
      default:
        throw new Error("should not find a call to simplify " + JSON.stringify(expression));
    }
    conversionMap.set(this.getStaticType(core_metadata, 'Directive'),
                      (moduleContext, expression) => {
                        let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
                        if (!isPresent(p0)) {
                          p0 = {};
                        }
                        return new DirectiveMetadata({
                          selector: p0['selector'],
                          inputs: p0['inputs'],
                          outputs: p0['outputs'],
                          events: p0['events'],
                          host: p0['host'],
                          bindings: p0['bindings'],
                          providers: p0['providers'],
                          exportAs: p0['exportAs'],
                          queries: p0['queries'],
                        });
                      });
    conversionMap.set(this.getStaticType(core_metadata, 'Component'),
                      (moduleContext, expression) => {
                        let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
                        if (!isPresent(p0)) {
                          p0 = {};
                        }
                        return new ComponentMetadata({
                          selector: p0['selector'],
                          inputs: p0['inputs'],
                          outputs: p0['outputs'],
                          properties: p0['properties'],
                          events: p0['events'],
                          host: p0['host'],
                          exportAs: p0['exportAs'],
                          moduleId: p0['moduleId'],
                          bindings: p0['bindings'],
                          providers: p0['providers'],
                          viewBindings: p0['viewBindings'],
                          viewProviders: p0['viewProviders'],
                          changeDetection: p0['changeDetection'],
                          queries: p0['queries'],
                          templateUrl: p0['templateUrl'],
                          template: p0['template'],
                          styleUrls: p0['styleUrls'],
                          styles: p0['styles'],
                          directives: p0['directives'],
                          pipes: p0['pipes'],
                          encapsulation: p0['encapsulation']
                        });
                      });
    conversionMap.set(this.getStaticType(core_metadata, 'Input'),
                      (moduleContext, expression) => new InputMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'Output'),
                      (moduleContext, expression) => new OutputMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'View'), (moduleContext, expression) => {
      let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
      if (!isPresent(p0)) {
        p0 = {};
      }
      return new ViewMetadata({
        templateUrl: p0['templateUrl'],
        template: p0['template'],
        directives: p0['directives'],
        pipes: p0['pipes'],
        encapsulation: p0['encapsulation'],
        styles: p0['styles'],
      });
    });
    conversionMap.set(this.getStaticType(core_metadata, 'Attribute'),
                      (moduleContext, expression) => new AttributeMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'Query'), (moduleContext, expression) => {
      let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
      let p1 = this.getDecoratorParameter(moduleContext, expression, 1);
      if (!isPresent(p1)) {
        p1 = {};
      }
      return new QueryMetadata(p0, {descendants: p1.descendants, first: p1.first});
    });
    conversionMap.set(this.getStaticType(core_metadata, 'ContentChildren'),
                      (moduleContext, expression) => new ContentChildrenMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'ContentChild'),
                      (moduleContext, expression) => new ContentChildMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'ViewChildren'),
                      (moduleContext, expression) => new ViewChildrenMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'ViewChild'),
                      (moduleContext, expression) => new ViewChildMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'ViewQuery'),
                      (moduleContext, expression) => {
                        let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
                        let p1 = this.getDecoratorParameter(moduleContext, expression, 1);
                        if (!isPresent(p1)) {
                          p1 = {};
                        }
                        return new ViewQueryMetadata(p0, {
                          descendants: p1['descendants'],
                          first: p1['first'],
                        });
                      });
    conversionMap.set(this.getStaticType(core_metadata, 'Pipe'), (moduleContext, expression) => {
      let p0 = this.getDecoratorParameter(moduleContext, expression, 0);
      if (!isPresent(p0)) {
        p0 = {};
      }
      return new PipeMetadata({
        name: p0['name'],
        pure: p0['pure'],
      });
    });
    conversionMap.set(this.getStaticType(core_metadata, 'HostBinding'),
                      (moduleContext, expression) => new HostBindingMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0)));
    conversionMap.set(this.getStaticType(core_metadata, 'HostListener'),
                      (moduleContext, expression) => new HostListenerMetadata(
                          this.getDecoratorParameter(moduleContext, expression, 0),
                          this.getDecoratorParameter(moduleContext, expression, 1)));
    return null;
  }

  private convertKnownDecorator(moduleContext: string, expression: {[key: string]: any}): any {
    let converter = this.conversionMap.get(this.getDecoratorType(moduleContext, expression));
    if (isPresent(converter)) return converter(moduleContext, expression);
    return null;
  }

  private getDecoratorType(moduleContext: string, expression: {[key: string]: any}): StaticType {
    if (isMetadataSymbolicCallExpression(expression)) {
      let target = expression['expression'];
      if (isMetadataSymbolicReferenceExpression(target)) {
        let moduleId = this.host.resolveModule(target['module'], moduleContext);
        const {declarationPath, declaredName} = this.host.findDeclaration(moduleId, target['name']);
        return this.getStaticType(declarationPath, declaredName);
      }
    }
    return null;
  }

  private getDecoratorParameter(moduleContext: string, expression: {[key: string]: any},
                                index: number): any {
    if (isMetadataSymbolicCallExpression(expression) && isPresent(expression['arguments']) &&
        (<any[]>expression['arguments']).length <= index + 1) {
      return this.simplify(moduleContext, (<any[]>expression['arguments'])[index], true);
    }
    return null;
  }

  private getPropertyMetadata(moduleContext: string,
                              value: {[key: string]: any}): {[key: string]: any} {
    if (isPresent(value)) {
      let result = {};
      StringMapWrapper.forEach(value, (value, name) => {
        let data = this.getMemberData(moduleContext, value);
        if (isPresent(data)) {
          let propertyData = data.filter(d => d['kind'] == "property")
                                 .map(d => d['directives'])
                                 .reduce((p, c) => (<any[]>p).concat(<any[]>c), []);
          if (propertyData.length != 0) {
            StringMapWrapper.set(result, name, propertyData);
          }
        }
      });
      return result;
    }
    return {};
  }

  // clang-format off
  private getMemberData(moduleContext: string, member: { [key: string]: any }[]): { [key: string]: any }[] {
    // clang-format on
    let result = [];
    if (isPresent(member)) {
      for (let item of member) {
        result.push({
          kind: item['__symbolic'],
          directives:
              isPresent(item['decorators']) ?
                  (<any[]>item['decorators'])
                      .map(decorator => this.convertKnownDecorator(moduleContext, decorator))
                      .filter(d => isPresent(d)) :
                  null
        });
      }
    }
    return result;
  }

  /** @internal */
  public simplify(moduleContext: string, value: any, crossModules: boolean): any {
    let _this = this;

    function simplify(expression: any): any {
      if (isPrimitive(expression)) {
        return expression;
      }
      if (isArray(expression)) {
        let result = [];
        for (let item of(<any>expression)) {
          result.push(simplify(item));
        }
        return result;
      }
      if (isPresent(expression)) {
        if (isPresent(expression['__symbolic'])) {
          switch (expression['__symbolic']) {
            case "class":
              return _this.getStaticType(moduleContext, expression['name']);
            case "binop":
              let left = simplify(expression['left']);
              let right = simplify(expression['right']);
              switch (expression['operator']) {
                case '&&':
                  return left && right;
                case '||':
                  return left || right;
                case '|':
                  return left | right;
                case '^':
                  return left ^ right;
                case '&':
                  return left & right;
                case '==':
                  return left == right;
                case '!=':
                  return left != right;
                case '===':
                  return left === right;
                case '!==':
                  return left !== right;
                case '<':
                  return left < right;
                case '>':
                  return left > right;
                case '<=':
                  return left <= right;
                case '>=':
                  return left >= right;
                case '<<':
                  return left << right;
                case '>>':
                  return left >> right;
                case '+':
                  return left + right;
                case '-':
                  return left - right;
                case '*':
                  return left * right;
                case '/':
                  return left / right;
                case '%':
                  return left % right;
              }
              return null;
            case "new":
              const ctor = simplify(expression['expression']);
              const args = expression['arguments'];

              if (
                // FIXME: _this.host.resolveModule(ctor.moduleId, moduleContext) === 'angular2/src/core/di/provider' &&
                ctor.name === 'Provider') {
                const varArgs = _this.simplify(moduleContext, args, false);
                return new Provider(...varArgs);
              } else {
                throw new Error(`Unknown constructor call in metadata ${_this.host.resolveModule(ctor.moduleId, moduleContext)} ${JSON.stringify(ctor)}`);
              }
            case "pre":
              let operand = simplify(expression['operand']);
              switch (expression['operator']) {
                case '+':
                  return operand;
                case '-':
                  return -operand;
                case '!':
                  return !operand;
                case '~':
                  return ~operand;
              }
              return null;
            case "index":
              let indexTarget = simplify(expression['expression']);
              let index = simplify(expression['index']);
              if (isPresent(indexTarget) && isPrimitive(index)) return indexTarget[index];
              return null;
            case "select":
              let selectTarget = simplify(expression['expression']);
              let member = simplify(expression['member']);
              if (isPresent(selectTarget) && isPrimitive(member)) return selectTarget[member];
              return null;
            case "reference":
              if (!expression['name']) {
                throw new Error("cannot resolve a reference without a name property" + expression);
              }
              let referenceModuleName;
              if (expression['module']) {
                referenceModuleName = this.host.resolveModule(expression['module'], moduleContext);
                const {declarationPath, declaredName} = this.host.findDeclaration(referenceModuleName, expression['name']);
                if (crossModules) {
                  let moduleMetadata = _this.getModuleMetadata(declarationPath);
                  let declarationValue = moduleMetadata['metadata'][declaredName];
                  return _this.simplify(declarationPath, declarationValue, crossModules);
                } else {
                  return _this.getStaticType(declarationPath, declaredName);
                }
              } else {
                let moduleMetadata = _this.getModuleMetadata(moduleContext);
                let referenceValue = moduleMetadata['metadata'][expression['name']];
                return simplify(referenceValue);
              }
            case "call":
              return _this.convertKnownDecorator(moduleContext, expression);
          }
          return null;
        }
        let result = {};
        StringMapWrapper.forEach(expression, (value, name) => { result[name] = simplify(value); });
        return result;
      }
      return null;
    }

    return simplify(value);
  }

  private resolveReference(expression:any, moduleContext:string) {
    if (!expression['name']) {
      throw new Error("cannot resolve a reference without a name property" + expression);
    }
    let referenceModuleName;
    if (expression['module']) {
      referenceModuleName = this.host.resolveModule(expression['module'], moduleContext);
      return this.host.findDeclaration(referenceModuleName, expression['name']);
    } else {
      return {declarationPath: moduleContext, declaredName: expression['name']};
    }
  }

  /**
   * @param module an absolute path to a module file.
   */
  public getModuleMetadata(module: string): {[key: string]: any} {
    let moduleMetadata = this.metadataCache.get(module);
    if (!isPresent(moduleMetadata)) {
      moduleMetadata = this.host.getMetadataFor(module);
      if (!isPresent(moduleMetadata)) {
        moduleMetadata = {__symbolic: "module", module: module, metadata: {}};
      }
      this.metadataCache.set(module, moduleMetadata);
    }
    return moduleMetadata;
  }

  private getTypeMetadata(type: StaticType): {[key: string]: any} {
    let moduleMetadata = this.getModuleMetadata(type.moduleId);
    let result = moduleMetadata['metadata'][type.name];
    if (!isPresent(result)) {
      result = {__symbolic: "class"};
    }
    return result;
  }
}

function isMetadataSymbolicCallExpression(expression: any): boolean {
  return !isPrimitive(expression) && !isArray(expression) && expression['__symbolic'] == 'call';
}

function isMetadataSymbolicReferenceExpression(expression: any): boolean {
  return !isPrimitive(expression) && !isArray(expression) &&
         expression['__symbolic'] == 'reference';
}
