import { ComponentFixture, TestBed } from '@angular/core/testing'
import { VideoViewerComponent } from './video-viewer.component'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

describe('VideoViewerComponent', () => {
  let component: VideoViewerComponent
  let fixture: ComponentFixture<VideoViewerComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, VideoViewerComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(VideoViewerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
