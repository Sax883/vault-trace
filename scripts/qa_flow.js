(async () => {
  const base = 'http://localhost:3000';
  const email = `test+${Date.now()}@example.com`;
  console.log('test email:', email);

  try {
    const regRes = await fetch(base + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Auto Test', email, password: 'TestPass123!', description: 'Automated test', amountLost: 123 }),
    });
    const regJson = await regRes.json();
    console.log('register', regRes.status, regJson);

    const clientToken = regJson.token;
    const caseId = regJson.caseId;

    // Admin login
    const adminEmail = process.env.ADMIN_EMAIL || 'support@vaulttrace.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '@Vaulttrace081';
    const adminLogin = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminJson = await adminLogin.json();
    console.log('admin login', adminLogin.status, adminJson);
    const adminToken = adminJson.token;

    // SMTP test
    const smtpRes = await fetch(base + '/api/admin/smtp-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ to: email }),
    });
    try {
      console.log('smtp test', smtpRes.status, await smtpRes.json());
    } catch (e) {
      console.log('smtp test no json', e.message);
    }

    // Escalate stage
    const clientId = regJson.user && regJson.user.id;
    if (clientId) {
      const escRes = await fetch(base + `/api/admin/client/${clientId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ stage: 42 }),
      });
      console.log('escalate', escRes.status, await escRes.json());
    } else {
      console.log('No clientId returned from registration; skipping escalate');
    }

    // Fetch client data
    if (clientToken) {
      const cd = await fetch(base + '/api/client/data', { headers: { Authorization: `Bearer ${clientToken}` } });
      console.log('client data status', cd.status, await cd.json());
    } else {
      console.log('No client token returned from registration; cannot fetch client data');
    }
  } catch (err) {
    console.error('QA flow error:', err);
    process.exit(1);
  }
})();
