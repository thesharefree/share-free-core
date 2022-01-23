if (process.env.NODE_ENV !== 'production') require('dotenv').config();
import { NestFactory, Reflector } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
//import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/exceptions.filter';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.use(helmet());
  app.enableCors();
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalGuards(new AuthGuard(new Reflector()));
  const options = new DocumentBuilder()
    .setTitle('Share Free APIs')
    .setDescription('Share Free APIs')
    .setVersion('1.0')
    .addTag('ShareFree')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
