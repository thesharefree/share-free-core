import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'src/entities/group.entity';
import { Organization, OrganizationSchema } from 'src/entities/organization.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { MessageModule } from '../message/message.module';
import { OrganizationGroupController } from './controllers/organization-group.controller';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationGroupService } from './services/organization-group.service';
import { OrganizationService } from './services/organization.service';

@Module({
    imports: [
        AzureStorageModule.withConfig({
            sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
            accountName: process.env['AZURE_STORAGE_ACCOUNT'],
            containerName: process.env['AZURE_STORAGE_CONTAINER'],
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MessageModule],
    controllers: [OrganizationController, OrganizationGroupController],
    providers: [OrganizationService, OrganizationGroupService],
})
export class OrganizationModule { }