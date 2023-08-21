import { HttpClientTestingModule } from '@angular/common/http/testing'
import { HttpClient } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { OjectDetectionApiService } from './object-detection-api.service'

describe('OjectDetectionApiService', () => {
  let service: OjectDetectionApiService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClient, OjectDetectionApiService],
    })
    service = TestBed.inject(OjectDetectionApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
