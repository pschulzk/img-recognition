/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { version } from '../../../package.json'

import { AppModule } from './app/app.module'

const globalPrefix = 'api'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  app.enableShutdownHooks()

  app.setGlobalPrefix(globalPrefix)

  const options = new DocumentBuilder()
    .setTitle('NestJS Fastify Streaming Server')
    .setDescription('Video Stream Meta Data Visualization')
    .setVersion(version)
    .addTag('File')
    .build()
  const document = SwaggerModule.createDocument(app, options)
  SwaggerModule.setup('api/docs', app, document)

  app.useStaticAssets({ root: `${__dirname}/assets`, prefix: '/video/', serve: true, preCompressed: true, acceptRanges: true, cacheControl: true })

  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  )
}

bootstrap()
