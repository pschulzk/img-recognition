import { Test, TestingModule } from '@nestjs/testing'
import { MetaDataController } from './metadata.controller'

describe('MetaDataController', () => {
  let controller: MetaDataController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetaDataController],
    }).compile()

    controller = module.get<MetaDataController>(MetaDataController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
