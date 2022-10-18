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
  @Get('/load')
  loadMessages(
    @Req() request: Request,
    @Query('recipientId') recipientId: string,
    @Query('recipientType') recipientType: string,
  ): Promise<Message[]> {
    const loggedInUser = request['user'];
    return this.messageService.loadMessages(
      recipientId,
      recipientType,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Get('/chats')
  loadChats(@Req() request: Request): Promise<any[]> {
    const loggedInUser = request['user'];
    return this.messageService.loadChats(loggedInUser.email);
  }

  // @Get('/chatsTest')
  // loadChatsTest(): Promise<any[]> {
  //   return this.messageService.loadChats('sharma.vikashkr@gmail.com');
  // }

  // @Auth('USER')
  // @Post('/send')
  // sendMessage(
  //   @Req() request: Request,
  //   @Body() message: Message): Promise<void> {
  //   const loggedInUser = request['user'];
  //   return this.messageService.sendMessage(message, loggedInUser.email);
  // }

  // @Post('/test')
  // testMessage(
  //   @Body() message: Message): Promise<void> {
  //   return this.messageService.sendMessage(message, 'sharma.vikashkr@gmail.com');
  // }
}
