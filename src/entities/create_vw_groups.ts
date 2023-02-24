import { Connection } from 'mongoose';

export class CreateGroupView {
  public static async createView(connection: Connection): Promise<void> {
    const collections = await connection.db.listCollections().toArray();
    if (collections.some((collection) => collection.name === 'vw_groups')) {
      await connection.db.dropCollection('vw_groups');
    }
    await connection.db.createCollection('vw_groups', {
      viewOn: 'groups',
      pipeline: [
        {
          $match: {
            deleted: {
              $ne: true,
            },
          },
        },
        {
          $addFields: {
            groupId: {
              $toString: '$_id',
            },
          },
        },
        {
          $lookup: {
            from: 'usergroupxrefs',
            localField: 'groupId',
            foreignField: 'groupId',
            as: 'userXrefs',
          },
        },
        {
          $addFields: {
            members: {
              $size: '$userXrefs',
            },
          },
        },
        {
          $addFields: {
            userIds: {
              $map: {
                input: '$userXrefs',
                in: '$$this.userId',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'usergroupactions',
            localField: 'groupId',
            foreignField: 'groupId',
            as: 'userActions',
          },
        },
        {
          $addFields: {
            stars: {
              $size: {
                $filter: {
                  input: '$userActions',
                  cond: {
                    $eq: ['$$this.starred', true],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            reports: {
              $size: {
                $filter: {
                  input: '$userActions',
                  cond: {
                    $eq: ['$$this.reported', true],
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            houseId: {
              $toObjectId: '$houseId',
            },
          },
        },
        {
          $lookup: {
            from: 'houses',
            localField: 'houseId',
            foreignField: '_id',
            as: 'houses',
          },
        },
        {
          $addFields: {
            house: {
              $first: '$houses',
            },
          },
        },
        {
            $addFields: {
              houseId: {
                $toString: '$houseId',
              },
            },
          },
        {
          $lookup: {
            from: 'grouptopicxrefs',
            localField: 'groupId',
            foreignField: 'groupId',
            as: 'topicXrefs',
          },
        },
        {
          $addFields: {
            topicIds: {
              $map: {
                input: '$topicXrefs',
                in: {
                  $toObjectId: '$$this.topicId',
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicIds',
            foreignField: '_id',
            as: 'topics',
          },
        },
        {
          $unset: ['userXrefs', 'houses', 'topicXrefs'],
        },
      ],
    });
  }
}
