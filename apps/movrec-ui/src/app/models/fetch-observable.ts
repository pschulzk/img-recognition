import { fromEvent, Observable, Subject } from 'rxjs'
import { map, scan, takeUntil, takeWhile } from 'rxjs/operators'

export class FetchObservable extends Observable<number | Uint8Array> {
  constructor(input: RequestInfo, init: RequestInit = {}) {
    super(subscriber => {
      const controller = new AbortController()
      const { signal } = controller
      const data$ = new Subject<ReadableStreamReadResult<Uint8Array>>()

      fetch(input, { ...init, signal })
        .then(({ body, headers }) => {
          if (!body) {
            throw new Error('Response body is empty')
          }

          const reader = body.getReader()
          const total = Number(headers.get('Content-Length'))

          data$
            .pipe(
              scan<ReadableStreamReadResult<Uint8Array>, Uint8Array | number[]>(
                (acc, { done, value = [] }) =>
                  done
                    ? Uint8Array.from([...acc, ...value])
                    : [...acc, ...value],
                []
              ),
              map(value =>
                value instanceof Uint8Array ? value : value.length / total
              ),
              takeWhile(result => typeof result === 'number', true),
              takeUntil(fromEvent(signal, 'abort'))
            )
            .subscribe(subscriber)

          return reader
            .read()
            .then(function process(
              result: ReadableStreamReadResult<Uint8Array>
            ): Promise<ReadableStreamReadResult<Uint8Array>> {
              data$.next(result)

              if (!result.done) {
                return reader.read().then(process)
              } else {
                return Promise.resolve(result)
              }
            })
        })
        .catch(error => subscriber.error(error))

      return () => controller.abort()
    })
  }
}
