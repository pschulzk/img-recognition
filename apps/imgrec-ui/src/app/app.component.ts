import { OverlayContainer } from '@angular/cdk/overlay'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { MatSlideToggleChange } from '@angular/material/slide-toggle'
import { FbnImageRecognitionDetection, FbnImageRecognitionResponse, FbnVideoRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, Observable, Subscription, catchError, combineLatest, finalize, forkJoin, switchMap, throwError } from 'rxjs'
import { DialogComponent } from './components/dialog/dialog.component'
import { ImageViewerConfig } from './components/image-viewer/image-viewer.component'
import { VideoViewerConfig } from './components/video-viewer/video-viewer.component'
import { OjectDetectionApiService } from './services/object-detection-api/object-detection-api.service'

@UntilDestroy()
@Component({
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [rowCollapseAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(false)

  imageUrl$ = new BehaviorSubject<string | undefined>(undefined)
  videoUrl$ = new BehaviorSubject<string | undefined>(undefined)
  imageInstance$ = new BehaviorSubject<HTMLImageElement | undefined>(undefined)
  videoInstance$ = new BehaviorSubject<HTMLVideoElement | undefined>(undefined)
  imageViewerConfig?: ImageViewerConfig
  videoViewerConfig?: VideoViewerConfig
  imageObjectDetections$ = new BehaviorSubject<FbnImageRecognitionDetection[]>([])
  videoObjectDetectionResponse$ = new BehaviorSubject<FbnVideoRecognitionResponse | undefined>(undefined)

  /**
   * Object detection for video query parameter to define threshold for
   * similarly positioned objects between frames to be recognized as the same object.
   */
  videoTrackingThreshold = 0.01

  errorRemoteServiceUnavailable$ = new BehaviorSubject<boolean>(false)
  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  isDarkTheme = true

  private requestSubscriptions$: Subscription[] = []

  constructor(
    private objectDetectionService: OjectDetectionApiService,
    private overlay: OverlayContainer,
    private dialog: MatDialog,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // check if remote service is available
    this.objectDetectionService.getIsHealthy().pipe(
      untilDestroyed(this),
    ).subscribe((isHealthy) => {
      if (!isHealthy) {
        this.errorRemoteServiceUnavailable$.next(true)
        this.openDialog({
          title: 'Error',
          content: 'Remote service is currently not available. Please try again later.',
        })
      }
      this.cd.detectChanges()
    })

    // zip data streams to create image viewer config
    combineLatest([
      this.imageUrl$.asObservable(),
      this.imageInstance$.asObservable(),
      this.imageObjectDetections$.asObservable(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([imageUrl, imageInstance, objectDetections]) => {
      this.imageViewerConfig = {
        imageUrl,
        imageInstance,
        objectDetections,
      }
      this.cd.detectChanges()
    })

    // zip data streams to create video viewer config
    combineLatest([
      this.videoUrl$.asObservable(),
      this.videoInstance$.asObservable(),
      this.videoObjectDetectionResponse$.asObservable(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([videoUrl, videoInstance, videoObjectDetectionResponse]) => {
      this.videoViewerConfig = {
        videoUrl,
        videoInstance,
        objectDetections: videoObjectDetectionResponse?.frames || [],
        frameRate: videoObjectDetectionResponse?.frame_rate || 30,
      }
      this.cd.detectChanges()
    })

    this.initVideoDemo()
  }

  /**
   * Handle image file input change event triggered by user.
   * @param fileInputEvent image file input change event
   */
  imageInputChange(fileInputEvent: Event) {
    this.reset()
    // read uploaded image file from event
    const element = fileInputEvent.currentTarget as HTMLInputElement
    const fileList: FileList | null = element.files
    if (!fileList?.item(0)) {
      throw new Error('No files selected')
    }
    const uploadedImageFile = fileList.item(0) as File

    // generate img src URL
    const reader = new FileReader()
    reader.readAsDataURL(uploadedImageFile) 
    reader.onload = () => { 
      this.imageUrl$.next(reader.result as string)
      const imageInstance = new Image()
      imageInstance.src = reader.result as string
      imageInstance.onload = () => {
        this.imageInstance$.next(imageInstance)
      }
    }

    // request image recognition meta  data
    this.isLoading$.next(true)
    this.requestSubscriptions$.push(this.objectDetectionService.getObjectDetectionForImage(uploadedImageFile).pipe(
      untilDestroyed(this),
      catchError((error) => {
        this.openErrorDialog(error)
        return throwError(() => error)
      }),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(
      (response: FbnImageRecognitionResponse) => {
        if (response.detections.length === 0) {
          this.errorHasNoPredictions$.next(true)
          return
        }
        this.errorHasNoPredictions$.next(false)
        this.imageObjectDetections$.next(response.detections)
      }
    ))
  }

  /**
   * Handle video file input change event triggered by user.
   * @param fileInputEvent video file input change event
   */
  videoInputChange(fileInputEvent: Event) {
    this.reset()
    // read uploaded video file from event
    const element = fileInputEvent.currentTarget as HTMLInputElement
    const fileList: FileList | null = element.files
    if (!fileList?.item(0)) {
      throw new Error('No files selected')
    }
    const uploadedVideoFile = fileList.item(0) as File

    // generate img src URL
    const reader = new FileReader()
    reader.readAsDataURL(uploadedVideoFile) 
    reader.onload = () => { 
      this.videoUrl$.next(reader.result as string)
      const videoInstance = document.createElement('video')
      videoInstance.src = reader.result as string
      videoInstance.onloadeddata = () => {
        this.videoInstance$.next(videoInstance)
      }
    }

    // request video recognition meta  data
    this.isLoading$.next(true)
    this.requestSubscriptions$.push(this.objectDetectionService.uploadVideo(uploadedVideoFile).pipe(
      untilDestroyed(this),
      switchMap((fileId: string) => this.objectDetectionService.getObjectDetectionForVideo(fileId, this.videoTrackingThreshold)),
      catchError((error) => {
        this.openErrorDialog(error)
        return throwError(() => error)
      }),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(
      (response: FbnVideoRecognitionResponse) => {
        if (response.frames.length === 0) {
          this.errorHasNoPredictions$.next(true)
          this.openDialog({
            title: 'Error',
            content: 'No objects could be identified. Please try again or try another image',
          })
          return
        }
        this.errorHasNoPredictions$.next(false)
        this.videoObjectDetectionResponse$.next(response)
      }
    ))
  }

  /**
   * Reset all data streams and cancel all pending http requests.
   */
  reset() {
    // cancel all pending http requests
    this.requestSubscriptions$.forEach((subscription) => subscription.unsubscribe())
    this.imageUrl$.next(undefined)
    this.videoUrl$.next(undefined)
    this.imageViewerConfig = undefined
    this.videoViewerConfig = undefined
    this.imageObjectDetections$.next([])
    this.videoObjectDetectionResponse$.next(undefined)
    this.errorHasNoPredictions$.next(false)
    this.cd.detectChanges()
  }

  /**
   * Toggle theme between light and dark.
   * @param event theme toggle change event
   */
  themeToggleChange(event: MatSlideToggleChange) {
    this.isDarkTheme = event.checked
  }

  openInfoDialog() {
    this.openDialog({
      title: 'Info',
      content: 'This application is for demoing object recognition in images. Please upload an image of type JPG and see the results.',
    })
  }

  /**
   * Open error dialog with error message.
   * @param error error object
   */
  openErrorDialog(error: any): void {
    const content = error?.error?.description || error?.message || 'An error occured. This service is currently unavailable. Please try again later.'
    this.openDialog({
      title: 'Error',
      content,
    })
  }

  /**
   * Open dialog with title and content.
   * @param config dialog config
   */
  private openDialog<T = {
    title: string,
    content: string,
  }>(config: T) {
    const dialogConfig = new MatDialogConfig<T>()
    dialogConfig.width = '400px'
    dialogConfig.position = {
      top: '100px',
    }
    dialogConfig.data = config

    dialogConfig.disableClose = true
    dialogConfig.autoFocus = true

    this.dialog.open(DialogComponent, dialogConfig)

    const darkThemeClassName = 'dark-theme'
    if (this.isDarkTheme) {
      this.overlay.getContainerElement().classList.add(darkThemeClassName)
    } else {
      this.overlay.getContainerElement().classList.remove(darkThemeClassName)
    }
  }

  /**
   * Initialize video demo data.
   */
  private initVideoDemo() {
    this.reset()
    this.isLoading$.next(true)
    this.requestSubscriptions$.push(forkJoin([
      this.getAssetByFileName('demo_data-video.mp4'),
      this.getAssetByFileName('demo_data-video_prediction.json'),
    ]).pipe(
      untilDestroyed(this),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(([videoData, jsonData]) => {
      // cached video data
      const videoUrl = URL.createObjectURL(videoData)
      this.videoUrl$.next(videoUrl)
      const videoInstance = document.createElement('video')
      videoInstance.src = videoUrl
      videoInstance.onloadeddata = () => {
        this.videoInstance$.next(videoInstance)
      }
      // cached json data
      const reader = new FileReader()
      reader.readAsText(jsonData)
      reader.onload = () => {
        const demoData = JSON.parse(reader.result as string) as FbnVideoRecognitionResponse
        this.videoObjectDetectionResponse$.next(demoData)
      }
    }))
  }

  /**
   * Get asset by file name.
   * @param fileName file name of asset
   */
  private getAssetByFileName(fileName: string): Observable<Blob> {
    return this.http.get(`assets/${fileName}`, { responseType: 'blob' })
  }
}
