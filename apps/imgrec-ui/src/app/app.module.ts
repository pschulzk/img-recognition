import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppComponent } from './app.component'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserAnimationsModule, MatIconModule, MatToolbarModule, MatButtonModule],
  providers: [ImageRecognitionService],
  bootstrap: [AppComponent],
})
export class AppModule {}
