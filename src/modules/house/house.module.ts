import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'src/entities/group.entity';
import {
  House,
  HouseSchema,
} from 'src/entities/house.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { MessageModule } from '../message/message.module';
import { HouseGroupController } from './controllers/house-group.controller';
import { HouseController } from './controllers/house.controller';
import { HouseGroupService } from './services/house-group.service';
import { HouseService } from './services/house.service';

@Module({
  imports: [
    AzureStorageModule.withConfig({
      sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
      accountName: process.env['AZURE_STORAGE_ACCOUNT'],
      containerName: process.env['AZURE_STORAGE_CONTAINER'],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: House.name, schema: HouseSchema },
    ]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    MessageModule,
  ],
  controllers: [HouseController, HouseGroupController],
  providers: [HouseService, HouseGroupService],
})
export class HouseModule {}
