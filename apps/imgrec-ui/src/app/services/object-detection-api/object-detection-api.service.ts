import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { FbnHealthCheckResponse, FbnImageRecognitionResponse, FbnVideoRecognitionResponse, FbnVideoUploadResponse } from '@fbn/fbn-imgrec'
import { Observable, catchError, map, of, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class OjectDetectionApiService {

  apiEndPoint = ''

  constructor(
    private http: HttpClient,
  ) { }

  getIsHealthy(): Observable<boolean> {
    return this.http.get<FbnHealthCheckResponse>(`${this.apiEndPoint}/healthcheck`).pipe(
      catchError(() => of(false)),
      map(res => {
        const parsedRes: FbnHealthCheckResponse | undefined = JSON.parse(JSON.stringify(res))
        return !!parsedRes && parsedRes?.status === 'pass'
      }),
    )
  }

  getObjectDetectionForImage(file: File): Observable<FbnImageRecognitionResponse> {
    const formData: FormData = new FormData()
    formData.append('image', file, `@${file.name}`)
    
    const headers = new HttpHeaders()
    headers.append('Content-Type', 'multipart/form-data')
    headers.append('Accept', 'application/json')

    return this.http.post<FbnImageRecognitionResponse>(`${this.apiEndPoint}/predict`, formData, { headers }).pipe(
      map((res: FbnImageRecognitionResponse) => JSON.parse(JSON.stringify(res))),
      catchError(error => throwError(() => error)),
    )
  }

  /** upload video file and return video file uuid */
  uploadVideo(file: File): Observable<string> {
    const formData: FormData = new FormData()
    formData.append('video', file, `@${file.name}`)
    
    const headers = new HttpHeaders()
    headers.append('Content-Type', 'multipart/form-data')
    headers.append('Accept', 'application/json')

    return this.http.post<FbnVideoUploadResponse>(`${this.apiEndPoint}/video/upload`, formData, { headers }).pipe(
      map((res: FbnVideoUploadResponse) => JSON.parse(JSON.stringify(res))),
      map((res: FbnVideoUploadResponse) => res.fileId),
      catchError(error => throwError(() => error)),
    )
  }

  /**
   * get object detection for uploaded video identified via fileId
   * @param fileId uuid of uploaded video
   * @param trackingThreshold WORK IN PROGRESS: Threshold percentage ranging from 0 to 1 for object detection service backend to
   * identify moving objects among multiple frames by tracking via detection UUID.
   * In current implementation, values > 0 cause video prediction canvases to draw wrong bounding boxes contents.
   * @returns object detection for video
   */
  getObjectDetectionForVideo(fileId: string, trackingThreshold = 0): Observable<FbnVideoRecognitionResponse> {
    const headers = new HttpHeaders({ 'Accept': 'application/json'})
    const params = new HttpParams({ fromObject: { fileId, trackingThreshold } })

    return this.http.get<FbnVideoRecognitionResponse>(`${this.apiEndPoint}/video/predict`, { headers, params }).pipe(
      map(res => JSON.parse(JSON.stringify(res))),
      catchError(error => throwError(() => error)),
    )
  }

}
