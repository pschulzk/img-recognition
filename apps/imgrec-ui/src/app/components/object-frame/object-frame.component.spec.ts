import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ObjectFrameComponent } from './object-frame.component'

describe('ObjectFrameComponent', () => {
  let component: ObjectFrameComponent
  let fixture: ComponentFixture<ObjectFrameComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectFrameComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ObjectFrameComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
