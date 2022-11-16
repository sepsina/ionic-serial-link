import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from './angular-material/angular-material.module';

import { IonicModule } from '@ionic/angular';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HTU21D_005_Component } from './htu21d-005/htu21d-005.component';
import { SH_006_Component } from './sh-006/sh-006.component';
import { SSR_009_Component } from './ssr-009/ssr-009.component';
import { Actuator_010_Component } from './actuator-010/actuator-010.component';
import { DBL_SW_008_Component } from './dbl-sw-008/dbl-sw-008.component';
import { ZB_Bridge_Component } from './zb-bridge/zb-bridge.component';

import { SliderModule } from 'primeng/slider'
import { Serial } from '@ionic-native/serial/ngx';

import { ResizeObserverDirective } from './directives/resize-observer.directive';

@NgModule({
    declarations: [
        AppComponent,
        HTU21D_005_Component,
        SH_006_Component,
        SSR_009_Component,
        Actuator_010_Component,
        DBL_SW_008_Component,
        ZB_Bridge_Component,
        ResizeObserverDirective
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule.forRoot(),
        BrowserAnimationsModule,
        AngularMaterialModule,
        SliderModule
    ],
    providers: [
        Serial
    ],
    bootstrap: [AppComponent],
})

export class AppModule {}
