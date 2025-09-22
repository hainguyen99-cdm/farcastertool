import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';

describe('Accounts API (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    process.env.MONGODB_URI = uri;
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  it('POST /accounts should create and store encrypted token', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'acc-1', token: 'plain-token-1' })
      .expect(201);

    expect(createRes.body).toHaveProperty('_id');
    expect(createRes.body).toHaveProperty('encryptedToken');
    expect(createRes.body.encryptedToken).not.toBe('plain-token-1');
    expect(createRes.body).not.toHaveProperty('token');
  });

  it('GET /accounts should list accounts', async () => {
    const res = await request(app.getHttpServer())
      .get('/accounts')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /accounts/:id/token should decrypt token', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'acc-2', token: 'plain-token-2' })
      .expect(201);

    const id = createRes.body._id;

    const tokenRes = await request(app.getHttpServer())
      .get(`/accounts/${id}/token`)
      .expect(200);

    expect(tokenRes.body).toEqual({ token: 'plain-token-2' });
  });

  it('PATCH /accounts/:id/status should update status and error', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/accounts')
      .send({ name: 'acc-3', token: 'plain-token-3' })
      .expect(201);

    const id = createRes.body._id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/accounts/${id}/status`)
      .send({ status: 'Error', error: 'Invalid token' })
      .expect(200);

    expect(patchRes.body.status).toBe('Error');
    expect(patchRes.body.error).toBe('Invalid token');
  });
});
