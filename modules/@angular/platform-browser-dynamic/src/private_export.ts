
import {INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS} from './platform_providers';
import * as resource_loader from './resource_loader/resource_loader_impl';

export var __platform_browser_dynamic_private__: {
  INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS: typeof INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
  _ResourceLoaderImpl?: resource_loader.ResourceLoaderImpl,
  ResourceLoaderImpl: typeof resource_loader.ResourceLoaderImpl
} = {
  INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS: INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
  ResourceLoaderImpl: resource_loader.ResourceLoaderImpl
};
