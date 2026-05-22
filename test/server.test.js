const request = require('supertest');
const { expect } = require('chai');
const app = require('../server/index.js');

describe('Server integration tests', function () {
  this.timeout(10000);

  let testEmail = `test+${Date.now()}@example.com`;
  let adminToken;

  it('should register a new client and return caseId and token', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ name: 'Test User', email: testEmail, password: 'TestPass123!', description: 'Test case', amountLost: 100 });

    expect(res.status).to.be.oneOf([200,201]);
    expect(res.body).to.have.property('caseId');
    expect(res.body).to.have.property('token');
  });

  it('should allow admin to login and run smtp test (may return not configured)', async () => {
    // login as admin (uses default env credentials if not set)
    const adminEmail = process.env.ADMIN_EMAIL || 'support@vaulttrace.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '@Vaulttrace081';

    const login = await request(app).post('/api/admin/login').send({ email: adminEmail, password: adminPassword });
    expect(login.status).to.equal(200);
    adminToken = login.body.token;
    expect(adminToken).to.be.a('string');

    const smtpRes = await request(app)
      .post('/api/admin/smtp-test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to: testEmail });

    expect(smtpRes.status).to.be.oneOf([200,500]);
  });
});
