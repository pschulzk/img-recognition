import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MetaDataController } from './file/metadata.controller'

@Module({
  imports: [],
  controllers: [AppController, MetaDataController],
  providers: [AppService],
})
export class AppModule {}
