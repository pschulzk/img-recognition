import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { MyStreamData, StreamingService } from './services/streaming/streaming.service'

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
  dataRows: MyStreamData[] = []

  constructor(
    private streamingService: StreamingService,
    private cd: ChangeDetectorRef,
  ) {
    console.log('AppComponent')
  }

  ngOnInit(): void {
    this.streamingService.dataStream.pipe(untilDestroyed(this)).subscribe((data) => {
      // console.log('data', data)
      if (!data) return
      this.dataRows.push(data)
      this.cd.detectChanges()
    })
    this.streamingService.startStream()
  }

  identify(index: number, item: MyStreamData) {
    return item.id
  }

  startStream(): void {
    this.dataRows = []
    this.streamingService.startStream()
  }
}
