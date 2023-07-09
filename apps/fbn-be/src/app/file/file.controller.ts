import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { createReadStream } from 'node:fs'
import { join } from 'node:path'

@Controller('meta-data')
export class MetaDataController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'apps/fbn-be/src/assets/test.ndjson'))
    res.send(file)
  }
}

// @Controller('video')
// export class VideoController {
//   @Get()
//   getFile(@Res() res: Response) {
//     const file = createReadStream(join(process.cwd(), 'apps/fbn-be/src/assets/testvideo-001.mp4'))
//     res.send(file)
//   }
// }