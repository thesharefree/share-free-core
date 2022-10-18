import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Req,
  Put,
} from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { TopicService } from '../services/topic.service';
import { Topic } from 'src/entities/topic.entity';
import { Request } from 'express';

@Controller('/topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Auth('USER', 'ADMIN')
  @Get('/all')
  getAllTopics(): Promise<Topic[]> {
    return this.topicService.getAllTopics();
  }

  @Auth('ADMIN')
  @Post('/create')
  createTopic(@Req() request: Request, @Body() topic: Topic): Promise<void> {
    const loggedInUser = request['user'];
    return this.topicService.createTopic(topic, loggedInUser.email);
  }

  @Auth('ADMIN')
  @Get('/:topicId')
  getTopic(@Param('topicId') topicId: string): Promise<Topic> {
    return this.topicService.getTopic(topicId);
  }

  @Auth('ADMIN')
  @Put('/toggle/:topicId')
  toggleTopicById(
    @Req() request: Request,
    @Param('topicId') topicId: string,
  ): Promise<Topic> {
    const loggedInUser = request['user'];
    return this.topicService.toggleTopicById(topicId, loggedInUser.email);
  }
}
