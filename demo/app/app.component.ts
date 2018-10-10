import { Component } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: "my-app",
    template: `
        <page-router-outlet></page-router-outlet>
    `
})
export class AppComponent {
    constructor(
        private routerExtensions: RouterExtensions
    ) {
        
    }

    ngOnInit() {
        this.routerExtensions.navigate(['property'], { clearHistory: true });
    }
}
