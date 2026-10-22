import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/** Cấu hình chung cho app thật và app trong test e2e. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1');

  // Số lớp proxy tin cậy phía trước API (vd. 1 khi chỉ có proxy của Next/nền tảng hosting);
  // 0 = không tin x-forwarded-for. Cần đúng để rate limit theo IP của khách thật.
  const trustProxy = Number(app.get(ConfigService).get('TRUST_PROXY', 0));
  if (trustProxy > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (app.get(ConfigService).get<string>('WEB_ORIGIN') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : false,
    credentials: true,
  });
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Football Gear API')
    .setDescription('API cho cổng thương mại điện tử đồ bóng đá')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
