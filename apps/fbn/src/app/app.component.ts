import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { FrameMetaData } from '@fbn/fbn-streaming'
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

@UntilDestroy()
@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, MatButtonModule],
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit {
  videoFrameMetaDataRows: FrameMetaData[] = []
  @ViewChild('video', { static: false }) video?: ElementRef<HTMLVideoElement>

  constructor(
    private streamingService: StreamingService,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.streamingService.frameDataStream.pipe(untilDestroyed(this)).subscribe((data) => {
      if (!data) return
      this.videoFrameMetaDataRows.push(data)
      this.cd.detectChanges()
    })
  }

  ngAfterViewInit(): void {
    if (this.video) {
      const video: HTMLVideoElement = this.video.nativeElement
      video.play()
      video.requestVideoFrameCallback((time, frameMetadata) => this.drawingLoop(time, frameMetadata, video))
    }
  }

  drawingLoop(time: DOMHighResTimeStamp, frameMetadata: VideoFrameCallbackMetadata, vid: HTMLVideoElement) {
    console.log(`timestamp: ${ time }
    frame: ${ JSON.stringify( frameMetadata, null, 4 ) }`)
    vid.requestVideoFrameCallback((time, metadata) => this.drawingLoop(time, metadata, vid))
  }

  ngOnDestroy() {
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

  startStream(): void {
    this.videoFrameMetaDataRows = []
    this.streamingService.startFrameDataStream()
  }
}
