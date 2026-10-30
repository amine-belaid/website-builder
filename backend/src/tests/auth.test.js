const request = require('supertest');
const app     = require('../../app');

describe('Auth endpoints', () => {

  it('POST /auth/register returns 201 and token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `test${Date.now()}@test.com`, password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('GET /sites without token returns 401', async () => {
    const res = await request(app).get('/sites');
    expect(res.status).toBe(401);
  });

}); 
