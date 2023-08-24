import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { ObjectFrameComponent } from './components/object-frame/object-frame.component';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';
import { VideoViewerComponent } from './components/video-viewer/video-viewer.component';
import { ObjectViewerComponent } from './components/object-viewer/object-viewer.component';

@NgModule({
  declarations: [AppComponent, DialogComponent],
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatToolbarModule,
    OverlayModule,

    // standalone components:
    ImageViewerComponent,
    VideoViewerComponent,
    ObjectFrameComponent,
    ObjectViewerComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
