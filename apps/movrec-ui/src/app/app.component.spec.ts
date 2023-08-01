import { ChangeDetectorRef } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AppComponent } from './app.component'
import { StreamingService } from './services/streaming/streaming.service'

describe('AppComponent', () => {
  const loadStub = jest
    .spyOn(window.HTMLMediaElement.prototype, 'pause')
    .mockImplementation(() => undefined)
  const pauseStub = jest
    .spyOn(window.HTMLMediaElement.prototype, 'load')
    .mockImplementation(() => undefined)

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        StreamingService,
        ChangeDetectorRef,
      ],
    }).compileComponents()
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement

    expect(compiled.querySelector('video')).toBeTruthy()
    
    expect(loadStub).toHaveBeenCalled()
    loadStub.mockRestore()
    
    expect(pauseStub).toHaveBeenCalled()
    pauseStub.mockRestore()
  })
})
