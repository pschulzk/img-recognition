import { HttpClientTestingModule } from '@angular/common/http/testing'
import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { OjectDetectionService } from './image-recognition.service'

describe('ImageRecognitionService', () => {
  let service: OjectDetectionService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClient, OjectDetectionService],
    })
    service = TestBed.inject(OjectDetectionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
