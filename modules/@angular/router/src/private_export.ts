

import {ROUTES} from './router_config_loader';
import {ROUTER_PROVIDERS} from './router_module';
import {flatten} from './utils/collection';

export var __router_private__:
    {ROUTER_PROVIDERS: typeof ROUTER_PROVIDERS; ROUTES: typeof ROUTES; flatten: typeof flatten;} = {
      ROUTER_PROVIDERS: ROUTER_PROVIDERS,
      ROUTES: ROUTES,
      flatten: flatten
    };
