import { OverlayModule } from '@angular/cdk/overlay'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ChangeDetectorRef } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatToolbarModule } from '@angular/material/toolbar'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { AppComponent } from './app.component'
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component'
import { OjectDetectionApiService } from './services/object-detection-api/object-detection-api.service'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ImageViewerComponent,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatToolbarModule,
        NoopAnimationsModule,
        OverlayModule,
      ],
      declarations: [AppComponent],
      providers: [ChangeDetectorRef, OjectDetectionApiService, OverlayModule],
    }).compileComponents()
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('.title')?.textContent).toContain(
      'Image Recognition'
    )
  })
})
