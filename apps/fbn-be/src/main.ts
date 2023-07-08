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

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  app.enableShutdownHooks()

  const options = new DocumentBuilder()
    .setTitle('NestJS Fastify Streaming Server')
    // .setDescription('Stream files to and from a MongoDB.')
    .setVersion(version)
    .addTag('File')
    .build()
  const document = SwaggerModule.createDocument(app, options)
  SwaggerModule.setup('api/docs', app, document)

  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  )
}

bootstrap()
