import { AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HomeService } from './home.service';

@Controller('/home')
export class HomeController {
  constructor(
    private readonly azureStorage: AzureStorageService,
    private readonly homeService: HomeService) { }

  @Get('/:message')
  getHello(@Query('name') name: string, @Param('message') message: string): any {
    return this.homeService.getHello(name, message);
  }

  @Post('azure/upload')
  @UseInterceptors(FileInterceptor('file'))
  async fileUpload(@UploadedFile() file: UploadedFileMetadata) {
    file = {
      ...file,
      originalname: 'banda/badhiya.png',
    };
    const storageUrl = await this.azureStorage.upload(file);
    console.log(JSON.stringify(storageUrl));
  }

}
