import { OverlayContainer } from '@angular/cdk/overlay'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { MatSlideToggleChange } from '@angular/material/slide-toggle'
import { FbnImageRecognitionDetection, FbnImageRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, combineLatest, finalize } from 'rxjs'
import { DialogComponent } from './components/dialog/dialog.component'
import { ImageViewerConfig } from './components/image-viewer/image-viewer.component'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'

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

  imgUrl$ = new BehaviorSubject<string | undefined>(undefined)
  imageInstance$ = new BehaviorSubject<HTMLImageElement | undefined>(undefined)
  objectDetections$ = new BehaviorSubject<FbnImageRecognitionDetection[]>([])
  imageViewerConfig?: ImageViewerConfig<FbnImageRecognitionDetection>

  errorRemoteServiceUnavailable$ = new BehaviorSubject<boolean>(false)
  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  isDarkTheme = true

  constructor(
    private imageRecognitionService: ImageRecognitionService,
    private overlay: OverlayContainer,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // check if remote service is available
    this.imageRecognitionService.getIsHealthy().pipe(
      untilDestroyed(this),
    ).subscribe((isHealthy) => {
      this.errorRemoteServiceUnavailable$.next(!isHealthy)
      this.cd.detectChanges()
    })

    combineLatest([
      this.imgUrl$.asObservable(),
      this.imageInstance$.asObservable(),
      this.objectDetections$.asObservable(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([imgUrl, originalImageInstance, objectDetections]) => {
      this.imageViewerConfig = {
        imgUrl,
        imageInstance: originalImageInstance,
        objectDetections,
      }
      this.cd.detectChanges()
    })
  }

  imgInputChange(fileInputEvent: Event) {
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
      this.imgUrl$.next(reader.result as string)
      const img = new Image()
      img.src = reader.result as string
      img.onload = () => {
        this.imageInstance$.next(img)
      }
    }

    // request image recognition meta  data
    this.isLoading$.next(true)
    this.imageRecognitionService.postImage(uploadedImageFile).pipe(
      untilDestroyed(this),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(
      (res: FbnImageRecognitionResponse) => {
        if (res.detections.length === 0) {
          this.errorHasNoPredictions$.next(true)
          return
        }
        this.errorHasNoPredictions$.next(false)
        this.objectDetections$.next(res.detections)
      }
    )
  }

  reset() {
    this.imgUrl$.next(undefined)
    this.objectDetections$.next([])
    this.errorHasNoPredictions$.next(false)
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
