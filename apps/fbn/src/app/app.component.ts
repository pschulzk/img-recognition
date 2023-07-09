import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { FrameMetaData, ObjectData } from '@fbn/fbn-streaming'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { StreamingService } from './services/streaming/streaming.service'

// // this implementation is for eventual cross-browser support
// export async function onFrameChange(vid: HTMLVideoElement) {
//   // const log = document.querySelector('pre')
//   // const canvas = document.querySelector('canvas')
//   // const ctx = canvas.getContext('2d')
//   if( vid.requestVideoFrameCallback ) {
//     await vid.play()
//     // canvas.width = vid.videoWidth
//     // canvas.height = vid.videoHeight
//     // ctx.filter = 'invert(1)'
//     const drawingLoop = (timestamp: unknown, frame: unknown) => {
//       console.log(`timestamp: ${ timestamp }
//       frame: ${ JSON.stringify( frame, null, 4 ) }`)
//       // ctx.drawImage( vid, 0, 0 )
//       vid.requestVideoFrameCallback( drawingLoop )  
//     }
//     vid.requestVideoFrameCallback( drawingLoop )
//   }
//   // else if( vid.seekToNextFrame ) {
//   //   const requestNextFrame = (callback) => {
//   //     vid.addEventListener( 'seeked', () => callback( vid.currentTime ), { once: true } )
//   //     // vid.seekToNextFrame()
//   //   }
//   //   await vid.play()
//   //   await vid.pause()
//   //   canvas.width = vid.videoWidth
//   //   canvas.height = vid.videoHeight
//   //   ctx.filter = 'invert(1)'
//   //   const drawingLoop = (timestamp) => {
//   //     log.textContent = 'timestamp: ' + timestamp
//   //     ctx.drawImage( vid, 0, 0 )
//   //     requestNextFrame( drawingLoop )
//   //   }
//   //   requestNextFrame( drawingLoop )
//   // }
//   else {
//     console.error('Your browser doesn\'t support any of these methods, we should fallback to timeupdate')
//   }
// }

export interface VisualizationState {
  frameNumber: number
  objects: VisualObjectData[]
}

export interface VisualObjectData {
  id: string
  x: number
  y: number
  color: string
}

@UntilDestroy()
@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, MatButtonModule],
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  frameRate = 30
  frameMetaDataRows: FrameMetaData[] = []
  currentVisualizationState: VisualizationState = {
    frameNumber: 0,
    objects: []
  }
  @ViewChild('video', { static: false }) video?: ElementRef<HTMLVideoElement>

  constructor(
    private streamingService: StreamingService,
    private cd: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    this.streamingService.metaDataStream.pipe(
      untilDestroyed(this),
    ).subscribe((data) => {
      if (!data) return
      this.frameMetaDataRows.push(data)
      // start after first frame has been received
      if (this.frameMetaDataRows.length === 1) {
        this.startVideoStream()
      }
    })

    this.startMetaDataStream()
  }

  ngOnDestroy() {
    // try stopping the player to close any streams
    const mediaStream: MediaStream = this.video?.nativeElement.srcObject as MediaStream
    if (!mediaStream) {
      return
    }
    const videoTrack = mediaStream.getVideoTracks()
    if (videoTrack.length) {
      videoTrack[0].stop()
    }
  }

  identify(index: number) {
    return index
  }

  startMetaDataStream(): void {
    this.frameMetaDataRows = []
    if (this.video) {
      const video: HTMLVideoElement = this.video.nativeElement
      video.pause()
      video.load()
      this.streamingService.startMetaDataStream()
    }
  }

  startVideoStream(): void {
    if (this.video) {
      const video: HTMLVideoElement = this.video.nativeElement
      video.muted = true
      video.play()
      video.requestVideoFrameCallback((timestamp, videoFrameCallbackMetadata) => this.videoFrameCallback(timestamp, videoFrameCallbackMetadata, video))
    }
  }

  videoFrameCallback(timestamp: DOMHighResTimeStamp, videoFrameCallbackMetadata: VideoFrameCallbackMetadata, vid: HTMLVideoElement) {
    // console.log(`timestamp: ${ timestamp } | frame: ${ JSON.stringify( videoFrameCallbackMetadata, null, 4 ) }`)

    // update state
    const currentFrameNumber = Math.round(videoFrameCallbackMetadata.mediaTime * this.frameRate)
    if (this.frameMetaDataRows[currentFrameNumber]) {
      const frameMetaData: FrameMetaData = this.frameMetaDataRows[currentFrameNumber]
      // check if the correct frame number
      if (frameMetaData.frameNumber === currentFrameNumber + 1) {
        // update visualization state
        this.currentVisualizationState = this.updateVisualizationState(videoFrameCallbackMetadata, frameMetaData)
        this.cd.detectChanges()
      }
    }
    // recursive function call
    vid.requestVideoFrameCallback((timestamp, metadata) => this.videoFrameCallback(timestamp, metadata, vid))
  }

  updateVisualizationState(videoFrameCallbackMetadata: VideoFrameCallbackMetadata, frameMetaData: FrameMetaData): VisualizationState {
    const frameNumber = videoFrameCallbackMetadata.presentedFrames
    const newState: VisualizationState = {
      frameNumber,
      objects: frameMetaData.visualData.objects.map((o: ObjectData, index: number) => ({
        id: '000',
        x: o.x,
        y: o.y,
        color: index ? 'teal' : 'yellow',
      }))
    }
    return newState
  }

}
