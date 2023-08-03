import { OverlayContainer } from '@angular/cdk/overlay'
import { Component, ElementRef, ViewChild } from '@angular/core'
import { MatSlideToggleChange } from '@angular/material/slide-toggle'
import { FbnImageRecognitionDetection, FbnImageRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, finalize, tap } from 'rxjs'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'

export interface VisualObjectData {
  data: FbnImageRecognitionDetection
  width: number
  height: number
  left: number
  bottom: number
  color: string
}

@UntilDestroy()
@Component({
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [rowCollapseAnimation],
})
export class AppComponent {
  isLoading$ = new BehaviorSubject<boolean>(false)

  imgUrl?: string 

  visualObjects: VisualObjectData[] = []

  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>

  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  themeToggleDarkTheme = true

  constructor(
    private imageRecognitionService: ImageRecognitionService,
    private overlay: OverlayContainer,
  ) { }

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
      this.imgUrl = reader.result as string
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
        
        this.visualObjects = res.detections.map((detection) => {
          if (!this.userImage?.nativeElement) {
            throw new Error('No image element')
          }
          const imageWidth = this.userImage.nativeElement.width as number
          const imageHeight = this.userImage.nativeElement.height as number
          console.log('!!! this.userImage!.nativeElement', imageWidth, imageHeight)
          return {
            data: detection,
            width: detection.box.w * imageWidth,
            height: detection.box.h * imageHeight,
            left: (detection.box.x * imageWidth) - (detection.box.w * imageWidth / 2),
            bottom: (detection.box.y * imageHeight) - (detection.box.h * imageHeight / 2) ,
            color: this.getRandomLighterColor(),
          }
        })
      }
    )
  }

  reset() {
    this.imgUrl = undefined
    this.visualObjects = []
    this.errorHasNoPredictions$.next(false)
  }

  themeToggleChange(event: MatSlideToggleChange) {
    const darkThemeClassName = 'dark-theme'
    this.themeToggleDarkTheme = event.checked
    if (this.themeToggleDarkTheme) {
      this.overlay.getContainerElement().classList.add(darkThemeClassName)
    } else {
      this.overlay.getContainerElement().classList.remove(darkThemeClassName)
    }
  }

  private getRandomLighterColor() {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)]
      color += randomLetter + randomLetter
    }
    return color
  }
}
