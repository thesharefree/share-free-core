import {
  Controller,
  Get,
  Req,
  Post,
  Body,
  Query,
  Param,
  Put,
} from '@nestjs/common';
import { MessageService } from '../services/message.service';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { Message } from 'src/entities/message.entity';

@Controller('/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Auth('USER')
  @Get('/chats')
  loadChats(@Req() request: Request): Promise<any[]> {
    const loggedInUser = request['user'];
    return this.messageService.loadChats(loggedInUser.email);
  }

  @Auth('USER')
  @Put('/lastRead')
  lastRead(
    @Req() request: Request,
    @Query('chatId') chatId: string,
    @Query('chatType') chatType: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.messageService.lastRead(chatId, chatType, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/notifyNewGroup')
  notifyNewGroup(
    @Req() request: Request,
    @Query('groupId') groupId: string,
  ): Promise<void> {
    return this.messageService.notifyJoinGroup(groupId);
  }
}
