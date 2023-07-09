import { Observable, take, tap } from 'rxjs'

/**
 * @description
 * Custom operator to run a function on first emission only.
 * @see https://indepth.dev/posts/1222/create-a-taponce-custom-rxjs-operator
 *
 * Credits to [Joaquin Cid](https://joaqcid.dev/)
*/
export function tapOnce<T>(fn: (value: T )=> void) {
  return function(source: Observable<T>) {
    source
      .pipe(
        take(1),
        tap(value => fn(value))
      )
      .subscribe()

    return source
  }
}