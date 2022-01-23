import { Controller, Get, Put, Query, Param, Req, Delete } from '@nestjs/common';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { GroupAnswerService } from '../services/group-answer.service';
import { GroupAnswer } from 'src/entities/group-answer.entity';
import { Query as QueryEntity } from 'src/entities/query.entity';

@Controller('/group/answers')
export class GroupAnswerController {
  constructor(private readonly groupAnswerService: GroupAnswerService) { }

  @Auth('USER')
  @Put('/update/:groupId')
  updateAnswer(
    @Req() request: Request,
    @Param('groupId') groupId: string,
    @Query('queryId') queryId: string,
    @Query('answer') answer: string): Promise<void> {
    const loggedInUser = request['user'];
    return this.groupAnswerService.updateAnswer(groupId, queryId, answer, loggedInUser.email);
  }

  @Auth('USER')
  @Delete('/deleteAnswer/:groupId')
  deleteAnswer(
    @Param('groupId') groupId: string,
    @Query('queryId') queryId: string,): Promise<void> {
    return this.groupAnswerService.deleteAnswer(groupId, queryId);
  }

  @Auth('USER')
  @Get('/pendingQueries/:groupId')
  pendingQueries(@Param('groupId') groupId: string,): Promise<QueryEntity[]> {
    return this.groupAnswerService.pendingQueries(groupId);
  }

  @Auth('USER')
  @Get('/:groupId')
  groupAnswers(@Param('groupId') groupId: string,): Promise<GroupAnswer[]> {
    return this.groupAnswerService.groupAnswers(groupId);
  }
}
