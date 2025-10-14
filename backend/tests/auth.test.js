const request = require('supertest');
const app = require('../src/server');

describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Password123',
                fullName: 'Test User',
                phone: '+1234567890'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.fullName).toBe(userData.fullName);
            expect(response.body.data.token).toBeDefined();
        });

        it('should not register user with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'Password123',
                fullName: 'Test User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should not register user with weak password', async () => {
            const userData = {
                email: 'test2@example.com',
                password: '123',
                fullName: 'Test User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            // First register a user
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'login@example.com',
                    password: 'Password123',
                    fullName: 'Login User'
                });

            // Then login
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('login@example.com');
            expect(response.body.data.token).toBeDefined();
        });

        it('should not login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get user profile with valid token', async () => {
            // Register and login to get token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'profile@example.com',
                    password: 'Password123',
                    fullName: 'Profile User'
                });

            const token = registerResponse.body.data.token;

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('profile@example.com');
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_TOKEN');
        });
    });
});

describe('Health Check', () => {
    it('should return server health status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Server is running');
    });
});