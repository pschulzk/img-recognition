import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
