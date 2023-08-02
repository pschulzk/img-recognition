import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, map, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ImageRecognitionService {

  apiEndPoint = '/predict'

  constructor(
    private http: HttpClient,
  ) { }

  postImage(file: File): Observable<void> {
    const formData:FormData = new FormData()
    formData.append('image', file, `@${file.name}`)
    
    const headers = new HttpHeaders()
    /** In Angular 5, including the header Content-Type can invalidate your request */
    headers.append('Content-Type', 'multipart/form-data')
    headers.append('Accept', 'application/json')

    return this.http.post(`${this.apiEndPoint}`, formData, { headers }).pipe(
      map(res => JSON.parse(JSON.stringify(res))),
      catchError(error => throwError(() => error)),
    )
  }

}
