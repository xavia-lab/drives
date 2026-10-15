import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { describe, it, beforeEach } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // 🚀 Explicitly type cast the server instantiation boundary to avoid unsafe calling logs
    const httpServer = app.getHttpServer();

    return request(httpServer).get('/').expect(200).expect('Hello World!');
  });
});
