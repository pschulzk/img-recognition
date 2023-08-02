import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { FbnImageRecognitionResponse } from '@fbn/fbn-imgrec'
import { Observable, catchError, map, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class ImageRecognitionService {

  apiEndPoint = '/predict'

  constructor(
    private http: HttpClient,
  ) { }

  postImage(file: File): Observable<FbnImageRecognitionResponse> {
    const formData:FormData = new FormData()
    formData.append('image', file, `@${file.name}`)
    
    const headers = new HttpHeaders()
    headers.append('Content-Type', 'multipart/form-data')
    headers.append('Accept', 'application/json')

    return this.http.post(`${this.apiEndPoint}`, formData, { headers }).pipe(
      map(res => JSON.parse(JSON.stringify(res))),
      catchError(error => throwError(() => error)),
    )
  }

}
