// Nest dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Local files
import { UserModule } from '../../src/v1/User/user.module';

describe('Follower Features (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UserModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/POST follow/:followedId', () => {
        return request(app.getHttpServer())
            .post('/v1/user/follow/123')
            .set('Authorization', 'Bearer token')
            .expect(200)
            .expect({ status: 'ok', message: 'User followed successfully' });
    });

    it('/DELETE unfollow/:followedId', () => {
        return request(app.getHttpServer())
            .delete('/v1/user/unfollow/123')
            .set('Authorization', 'Bearer token')
            .expect(200)
            .expect({ status: 'ok', message: 'User unfollowed successfully' });
    });

    it('/GET :username/followers', () => {
        return request(app.getHttpServer())
            .get('/v1/user/johndoe/followers')
            .expect(200)
            .expect(res => {
                expect(res.body).toHaveProperty('followers_list');
            });
    });

    afterAll(async () => {
        await app.close();
    });
});
