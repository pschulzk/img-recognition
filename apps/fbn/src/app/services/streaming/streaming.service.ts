import { Injectable } from '@angular/core'
import { FrameMetaData } from '@fbn/fbn-streaming'
import { BehaviorSubject, Observable } from 'rxjs'

/**
* Split the stream
* @param {*} splitOn identifier string to split JSON string on
*/
export function splitStream(splitOn: string) {
  let buffer = ''
  
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk
      const parts = buffer.split(splitOn)
      parts.slice(0, -1).forEach(part => controller.enqueue(part))
      buffer = parts[parts.length - 1]
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer)
    }
  })
}

/**
* Parse the NDJSON results
*/
export function parseJson() {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(JSON.parse(chunk))
    }
  })
}

@Injectable()
export class StreamingService {

  maxResults = 1000
  private currentResults = 0
  
  get frameDataStream(): Observable<FrameMetaData | null> {
    return this._frameDataStream.asObservable()
  }

  private _frameDataStream = new BehaviorSubject<FrameMetaData | null>(null)

  async startFrameDataStream(): Promise<void> {
    this.currentResults = 0
    const _reader = await this.getNdjsonReader()
    this.readNextFrameData(_reader)
  }

  private readNextFrameData(reader: ReadableStreamDefaultReader<FrameMetaData>) {
    reader.read().then(
      ({ value, done }) => {
        if (done) {
          console.log('The stream was already closed!')

        } else {
          this._frameDataStream.next(value)
          this.currentResults++

          // Recursively call
          if (this.currentResults <= this.maxResults) {
            this.readNextFrameData(reader)
          }
        }
      },
      e => console.error('The stream became errored and cannot be read from!', e)
    )
  }

  /**
  * Get the streaming data
  */
  private async getNdjsonReader(): Promise<ReadableStreamDefaultReader<FrameMetaData>> {
    // Retrieve NDJSON from the server
    const response = await fetch('/api/meta-data')
    
    let results
    if (response.body) {
      results = response.body
        // From bytes to text:
        .pipeThrough(new TextDecoderStream())
        // Buffer until newlines:
        .pipeThrough(splitStream('\n'))
        // Parse chunks as JSON:
        .pipeThrough(parseJson())
    } else {
      throw new Error('No response body')
    }
    return results.getReader()
  }
}
