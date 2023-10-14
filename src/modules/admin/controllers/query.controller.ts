import { Controller, Get, Param, Post, Body, Req, Put, Delete } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { QueryService } from '../services/query.service';
import { Query } from 'src/entities/query.entity';
import { Request } from 'express';

@Controller('/queries')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Auth('ADMIN')
  @Post('/create')
  createQuery(@Req() request: Request, @Body() query: Query): Promise<Query> {
    const loggedInUser = request['user'];
    return this.queryService.createQuery(query, loggedInUser.email);
  }

  @Get('/all')
  @Auth('USER', 'ADMIN')
  getAllTopics(): Promise<Query[]> {
    return this.queryService.getAllQueries();
  }

  @Get('/:queryId')
  @Auth('USER', 'ADMIN')
  getQuery(@Param('queryId') queryId: string): Promise<Query> {
    return this.queryService.getQuery(queryId);
  }

  @Delete('/:queryId')
  @Auth('ADMIN')
  deleteQuery(@Param('queryId') queryId: string): Promise<void> {
    return this.queryService.deleteQuery(queryId);
  }

  @Put('/update/:queryId')
  @Auth('ADMIN')
  updateQueryById(
    @Req() request: Request,
    @Param('queryId') queryId: string,
    @Body() query: Query,
  ): Promise<Query> {
    const loggedInUser = request['user'];
    return this.queryService.updateQuery(queryId, query, loggedInUser.email);
  }

  @Put('/toggle/:queryId')
  @Auth('ADMIN')
  toggleQueryById(
    @Req() request: Request,
    @Param('queryId') queryId: string,
  ): Promise<Query> {
    const loggedInUser = request['user'];
    return this.queryService.toggleQueryById(queryId, loggedInUser.email);
  }
}
