import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { PROP_META_MAP_LOADER } from './shared/tokens/prop-meta-map.loader.token';
import { createServerPropMetaMapLoader } from './shared/resolvers/prop-meta-map.server';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  providers: [
    {
      provide: PROP_META_MAP_LOADER,
      useFactory: createServerPropMetaMapLoader,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
