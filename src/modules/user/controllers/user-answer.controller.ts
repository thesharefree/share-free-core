import { Controller, Get, Req, Put, Query, Delete } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Request } from 'express';
import { UserAnswerService } from '../services/user-answer.service';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { Query as QueryEntity } from 'src/entities/query.entity';

@Controller('/user/answers')
export class UserAnswerController {
  constructor(private readonly userAnswerService: UserAnswerService) {}

  @Auth('USER')
  @Put('/update')
  updateAnswer(
    @Req() request: Request,
    @Query('queryId') queryId: string,
    @Query('answer') answer: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.userAnswerService.updateAnswer(
      queryId,
      answer,
      loggedInUser.email,
    );
  }

  @Auth('USER')
  @Get('/pendingQueries')
  pendingQueries(@Req() request: Request): Promise<QueryEntity[]> {
    const loggedInUser = request['user'];
    return this.userAnswerService.pendingQueries(loggedInUser.email);
  }

  @Auth('USER')
  @Delete('/deleteAnswer')
  deleteAnswer(
    @Query('queryId') queryId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.userAnswerService.deleteAnswer(queryId, loggedInUser.email);
  }

  @Auth('USER')
  @Get()
  userAnswers(@Req() request: Request): Promise<UserAnswer[]> {
    const loggedInUser = request['user'];
    return this.userAnswerService.userAnswers(loggedInUser.email);
  }
}
