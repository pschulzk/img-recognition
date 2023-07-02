import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { createReadStream } from 'node:fs'
import { join } from 'node:path'

@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'apps/fbn-be/src/assets/json-response.ndjson'))
    file.pipe(res)
  }
}
