import { HttpClientTestingModule } from '@angular/common/http/testing'
import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { ImageRecognitionService } from './image-recognition.service'

describe('ImageRecognitionService', () => {
  let service: ImageRecognitionService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClient, ImageRecognitionService],
    })
    service = TestBed.inject(ImageRecognitionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
