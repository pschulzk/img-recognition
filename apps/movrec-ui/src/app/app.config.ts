import { ApplicationConfig } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { StreamingService } from './services/streaming/streaming.service'

export const appConfig: ApplicationConfig = {
  providers: [provideAnimations(), StreamingService],
}
