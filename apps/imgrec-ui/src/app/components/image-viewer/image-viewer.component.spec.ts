import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ImageViewerComponent } from './image-viewer.component'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

describe('ImageViewerComponent', () => {
  let component: ImageViewerComponent
  let fixture: ComponentFixture<ImageViewerComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ImageViewerComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ImageViewerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
