import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule, } from "nativescript-angular/nativescript.module";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import {NativeScriptRouterModule} from "nativescript-angular/router";
import { registerElement } from "nativescript-angular/element-registry";

import { AppComponent } from "./app.component";
import { PropertyComponent } from "./property/property.component";
import { PreviewComponent } from './preview/preview.component';

// Register VideoView element for camera view
var VideoView = require('tns-video-recorder/video-recorder').VideoView;
registerElement("VideoView", () => {
    return <any>VideoView;
});

const appRoutes = [
    {path: 'property', component: PropertyComponent, pathMatch: 'full'},
    {path: 'preview', component: PreviewComponent, pathMatch: 'full'}
];

@NgModule({
    declarations: [
        AppComponent,
        PropertyComponent,
        PreviewComponent
    ],
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        NativeScriptRouterModule,
        NativeScriptRouterModule.forRoot(appRoutes)
    ],
    schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule { }


