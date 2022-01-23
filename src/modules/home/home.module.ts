import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
    imports: [
        AzureStorageModule.withConfig({
            sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
            accountName: process.env['AZURE_STORAGE_ACCOUNT'],
            containerName: process.env['AZURE_STORAGE_CONTAINER'],
        })
    ],
    controllers: [HomeController],
    providers: [HomeService],
})
export class HomeModule { }