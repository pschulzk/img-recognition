import { OverlayContainer } from '@angular/cdk/overlay'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { MatSlideToggleChange } from '@angular/material/slide-toggle'
import { FbnImageRecognitionDetection, FbnImageRecognitionResponse, FbnVideoRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, combineLatest, finalize, switchMap } from 'rxjs'
import { DialogComponent } from './components/dialog/dialog.component'
import { ImageViewerConfig } from './components/image-viewer/image-viewer.component'
import { OjectDetectionApiService } from './services/object-detection-api/object-detection-api.service'
import { VideoViewerConfig } from './components/video-viewer/video-viewer.component'

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
  videoObjectDetections$ = new BehaviorSubject<FbnVideoRecognitionResponse | undefined>(undefined)

  errorRemoteServiceUnavailable$ = new BehaviorSubject<boolean>(false)
  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  isDarkTheme = true

  constructor(
    private objectDetectionService: OjectDetectionApiService,
    private overlay: OverlayContainer,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // check if remote service is available
    this.objectDetectionService.getIsHealthy().pipe(
      untilDestroyed(this),
    ).subscribe((isHealthy) => {
      this.errorRemoteServiceUnavailable$.next(!isHealthy)
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
      this.videoObjectDetections$.asObservable(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([videoUrl, videoInstance, objectDetections]) => {
      this.videoViewerConfig = {
        videoUrl,
        videoInstance,
        objectDetections,
      }
      this.cd.detectChanges()
    })
  }

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
    this.objectDetectionService.getObjectDetectionForImage(uploadedImageFile).pipe(
      untilDestroyed(this),
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
    )
  }

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
      videoInstance.onloadeddata = (ev) => {
        // ev.currentTarget?.
        this.videoInstance$.next(videoInstance)
      }
    }

    // request video recognition meta  data
    this.isLoading$.next(true)
    this.objectDetectionService.uploadVideo(uploadedVideoFile).pipe(
      untilDestroyed(this),
      switchMap((fileId: string) => this.objectDetectionService.getObjectDetectionForVideo(fileId)),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(
      (response: FbnVideoRecognitionResponse) => {
        if (response.frames.length === 0) {
          this.errorHasNoPredictions$.next(true)
          return
        }
        console.log('!!! videoInputChange.response', response)
        this.errorHasNoPredictions$.next(false)
        this.videoObjectDetections$.next(response)
      }
    )
  }

  reset() {
    this.imageUrl$.next(undefined)
    this.videoUrl$.next(undefined)
    this.imageViewerConfig = undefined
    this.videoViewerConfig = undefined
    this.imageObjectDetections$.next([])
    this.videoObjectDetections$.next(undefined)
    this.errorHasNoPredictions$.next(false)
    this.cd.detectChanges()
  }

  themeToggleChange(event: MatSlideToggleChange) {
    this.isDarkTheme = event.checked
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig<{
      title: string,
      content: string,
    }>()
    dialogConfig.width = '400px'
    dialogConfig.position = {
      top: '100px',
    }
    dialogConfig.data = {
      title: 'Info',
      content: 'This application is for demoing object recognition in images. Please upload an image of type JPG and see the results.',
    }

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
}
