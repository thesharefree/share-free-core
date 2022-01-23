import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PreauthMiddleware } from './auth/preauth.middleware';
import { User, UserSchema } from './entities/user.entity';
import { AdminModule } from './modules/admin/admin.module';
import { GroupModule } from './modules/group/group.module';
import { HomeModule } from './modules/home/home.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env['MONGO_DB_URL']),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HomeModule,
    AdminModule,
    UserModule,
    GroupModule,
    OrganizationModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PreauthMiddleware).forRoutes({
      path: '*', method: RequestMethod.ALL
    });
  }
}
