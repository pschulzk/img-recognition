import { Injectable } from '@angular/core'
import { FrameMetaData } from '@fbn/fbn-streaming'
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable()
export class ImageRecognitionService {

  maxResults = 10000
  private currentResults = 0
  
  get metaDataStream(): Observable<FrameMetaData | null> {
    return this._metaDataStream.asObservable()
  }

  private _metaDataStream = new BehaviorSubject<FrameMetaData | null>(null)

  async startMetaDataStream(): Promise<void> {
    return Promise.resolve()
  }

}
