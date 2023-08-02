import { Component, ElementRef, ViewChild } from '@angular/core'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { FbnImageRecognitionDetection, FbnImageRecognitionResponse } from '@fbn/fbn-imgrec'
import { BehaviorSubject, finalize, tap } from 'rxjs'

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
})
export class AppComponent {
  isLoading$ = new BehaviorSubject<boolean>(false)

  imgUrl?: string 

  visualObjects: VisualObjectData[] = []

  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>

  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  constructor(
    private imageRecognitionService: ImageRecognitionService,
  ) { }

  imgInputChange(fileInputEvent: Event) {
    this.reset()
    // read uploaded image file from event
    const element = fileInputEvent.currentTarget as HTMLInputElement
    console.log('!!! element', element)
    const fileList: FileList | null = element.files
    if (!fileList?.item(0)) {
      throw new Error('No files selected')
    }
    const uploadedImageFile = fileList.item(0) as File
    // const img = new Image()

    // generate img src URL
    const reader = new FileReader()
    reader.readAsDataURL(uploadedImageFile) 
    reader.onload = () => { 
      this.imgUrl = reader.result as string
      // img.src = this.imgUrl
    }

    // request image recognition meta  data
    this.imageRecognitionService.postImage(uploadedImageFile).pipe(
      untilDestroyed(this),
      tap(() => this.isLoading$.next(true)),
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
            color: this.getRandomColor(),
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

  private getRandomColor() {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)]
    }
    return color
  }
}
