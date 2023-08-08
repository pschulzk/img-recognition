import { OverlayModule } from '@angular/cdk/overlay'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppComponent } from './app.component'
import { DialogComponent } from './components/dialog/dialog.component'
// import { MatCommonModule } from '@angular/material/core'

@NgModule({
  declarations: [AppComponent, DialogComponent],
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    // MatCommonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatToolbarModule,
    OverlayModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
