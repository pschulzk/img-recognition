import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'

export interface MyStreamData {
  id: number
  result: string
  phone: number
}

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
export function parseJSON() {
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
  
  get dataStream(): Observable<MyStreamData | null> {
    return this._dataStream.asObservable()
  }

  private _dataStream = new BehaviorSubject<MyStreamData | null>(null)

  async startStream(): Promise<void> {
    this.currentResults = 0
    const _reader = await this.getReader()
    this.readNext(_reader)
  }

  private readNext(reader: ReadableStreamDefaultReader<MyStreamData>) {
    reader.read().then(
      ({ value, done }) => {
        if (done) {
          console.log('The stream was already closed!')

        } else {
          this._dataStream.next(value)
          this.currentResults++

          // Recursively call
          if (this.currentResults <= this.maxResults) {
            this.readNext(reader)
          }
        }
      },
      e => console.error('The stream became errored and cannot be read from!', e)
    )
  }

  /**
  * Get the streaming data
  */
  private async getReader(): Promise<ReadableStreamDefaultReader<MyStreamData>> {
    // Retrieve NDJSON from the server
    const response = await fetch('/api/file')
    
    let results
    if (response.body) {
      results = response.body
        // From bytes to text:
        .pipeThrough(new TextDecoderStream())
        // Buffer until newlines:
        .pipeThrough(splitStream('\n'))
        // Parse chunks as JSON:
        .pipeThrough(parseJSON())
    } else {
      throw new Error('No response body')
    }
    return results.getReader()
  }
}
