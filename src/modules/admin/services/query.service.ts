import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Query, QueryDocument } from 'src/entities/query.entity';

@Injectable()
export class QueryService {
  constructor(
    @InjectModel(Query.name) private readonly queryModel: Model<QueryDocument>,
  ) {}

  public async getQuery(queryId: string): Promise<Query> {
    const query = await this.queryModel.findById(queryId);
    if (query == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return query;
  }

  public async getAllQueries(): Promise<Query[]> {
    return await this.queryModel.find();
  }

  public async createQuery(query: Query, loggedInUser: string): Promise<void> {
    query['_id'] = null;
    query.createdBy = loggedInUser;
    query.createdDate = new Date();
    query.active = true;
    query.updatedBy = loggedInUser;
    query.updatedDate = new Date();
    const createdQuery = new this.queryModel(query);
    await createdQuery.save();
  }

  public async updateQuery(
    queryId: string,
    query: Query,
    loggedInUser: string,
  ): Promise<Query> {
    const queryExist = await this.queryModel.findById(queryId);
    if (queryExist == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return await this.queryModel.findByIdAndUpdate(queryId, {
      queryStr: query.queryStr,
      target: query.target,
      optionType: query.optionType,
      options: query.options,
      updatedBy: loggedInUser,
      updatedDate: new Date(),
    });
  }

  public async toggleQueryById(
    queryId: string,
    loggedInUser: string,
  ): Promise<Query> {
    const query = await this.queryModel.findById(queryId);
    if (query == null) {
      throw new HttpException('Invalid Query', 400);
    }
    return await this.queryModel.findByIdAndUpdate(queryId, {
      active: !query.active,
      updatedBy: loggedInUser,
      updatedDate: new Date(),
    });
  }
}
