import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { FbnImageRecognitionResponse } from '@fbn/fbn-imgrec'
import { Observable, catchError, map, of, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ImageRecognitionService {

  apiEndPoint = '/object-detection-service-api'

  constructor(
    private http: HttpClient,
  ) { }

  getIsHealthy(): Observable<boolean> {
    return this.http.get(`${this.apiEndPoint}/healthcheck`).pipe(
      catchError(() => of(false)),
      map(res => {
        const parsedRes: { status: 'pass' } | undefined = JSON.parse(JSON.stringify(res))
        return !!parsedRes && parsedRes?.status === 'pass' ? true : false
      }),
    )
  }

  postImage(file: File): Observable<FbnImageRecognitionResponse> {
    const formData:FormData = new FormData()
    formData.append('image', file, `@${file.name}`)
    
    const headers = new HttpHeaders()
    headers.append('Content-Type', 'multipart/form-data')
    headers.append('Accept', 'application/json')

    return this.http.post(`${this.apiEndPoint}/predict`, formData, { headers }).pipe(
      map(res => JSON.parse(JSON.stringify(res))),
      catchError(error => throwError(() => error)),
    )
  }

}
