import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { FrameMetaData } from '@fbn/fbn-streaming'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { StreamingService } from './services/streaming/streaming.service'

@UntilDestroy()
@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule, MatToolbarModule, MatButtonModule],
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  videoFrameDataRows: FrameMetaData[] = []
  @ViewChild('video', {static: true}) video?: ElementRef<HTMLVideoElement>

  constructor(
    private streamingService: StreamingService,
    private cd: ChangeDetectorRef,
  ) {
    console.log('AppComponent')
  }

  ngOnInit(): void {
    this.streamingService.frameDataStream.pipe(untilDestroyed(this)).subscribe((data) => {
      // console.log('data', data)
      if (!data) return
      this.videoFrameDataRows.push(data)
      this.cd.detectChanges()
    })
  }

  async onStart(){
    // const ms: MediaStream = await this.streamingService.frameDataStream.
    // const _video = this.video.nativeElement
    // _video.srcObject = ms
    // _video.play() 
  }

  onStop() {
    if (!this.video) {
      return
    }
    this.video.nativeElement.pause();
    (this.video.nativeElement.srcObject as MediaStream).getVideoTracks()[0].stop()
    this.video.nativeElement.srcObject = null
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
    this.videoFrameDataRows = []
    this.streamingService.startFrameDataStream()
  }
}
