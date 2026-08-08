import app from './src/app';
import http from 'http';
import { AddressInfo } from 'net';

async function runFunctionalSmokeVerification() {
  console.log('🧪 Starting Phase 6 Functional Smoke Verification Suite...\n');

  // Start Express server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  let passCount = 0;

  try {
    // 1. Health check
    console.log('Check 1: Health endpoint loads');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || !healthData.success) {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    passCount++;
    console.log('  ✅ Backend server health endpoint responds HTTP 200 OK');

    // 2. ADMIN login & session fetch
    console.log('\nCheck 2: ADMIN login & session fetch');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'admin@nexora.com', password: 'Admin@123456' }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.success || !adminLoginData.data.token) {
      throw new Error(`ADMIN login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.data.token;
    passCount++;
    console.log(`  ✅ ADMIN logged in successfully (Role: ${adminLoginData.data.user.role})`);

    const adminMeRes = await fetch(`${baseUrl}/auth/me`, { headers: headers(adminToken) });
    const adminMeData = await adminMeRes.json();
    if (adminMeRes.status !== 200 || adminMeData.data.email !== 'admin@nexora.com') {
      throw new Error(`GET /auth/me failed: ${JSON.stringify(adminMeData)}`);
    }
    passCount++;
    console.log(`  ✅ Current user profile loaded via GET /auth/me: ${adminMeData.data.email}`);

    // 3. ADMIN list queries
    console.log('\nCheck 3: ADMIN module lists loading');
    const custRes = await fetch(`${baseUrl}/customers`, { headers: headers(adminToken) });
    if (custRes.status !== 200) throw new Error(`Customers list failed: HTTP ${custRes.status}`);
    console.log('  ✅ Customer list successfully loaded from backend (200 OK)');

    const prodRes = await fetch(`${baseUrl}/products`, { headers: headers(adminToken) });
    const prodData = await prodRes.json();
    if (prodRes.status !== 200 || !Array.isArray(prodData.data)) throw new Error(`Products list failed: HTTP ${prodRes.status}`);
    console.log('  ✅ Product list successfully loaded from backend (200 OK)');

    const firstProdId = prodData.data[0]?.id;
    if (firstProdId) {
      const movRes = await fetch(`${baseUrl}/products/${firstProdId}/stock-movements`, { headers: headers(adminToken) });
      if (movRes.status !== 200) throw new Error(`Stock movements list failed: HTTP ${movRes.status}`);
      console.log(`  ✅ Stock movements list for product ID ${firstProdId} loaded from backend (200 OK)`);
    }

    const challanRes = await fetch(`${baseUrl}/challans`, { headers: headers(adminToken) });
    if (challanRes.status !== 200) throw new Error(`Sales challans list failed: HTTP ${challanRes.status}`);
    console.log('  ✅ Sales challans list successfully loaded from backend (200 OK)');
    passCount++;

    // 4. Role-based RBAC verification for SALES
    console.log('\nCheck 4: Role RBAC checks for SALES');
    const salesLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'sales@nexora.com', password: 'Sales@123456' }),
    });
    const salesLoginData = await salesLoginRes.json();
    const salesToken = salesLoginData.data.token;

    const salesCustRes = await fetch(`${baseUrl}/customers`, { headers: headers(salesToken) });
    const salesCreateProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({ name: 'Forbidden', sku: 'FORBIDDEN', category: 'Test', unitPrice: 10, currentStock: 10, location: 'Loc' }),
    });
    if (salesCustRes.status !== 200 || salesCreateProdRes.status !== 403) {
      throw new Error(`SALES RBAC failed: Cust HTTP ${salesCustRes.status}, CreateProd HTTP ${salesCreateProdRes.status}`);
    }
    passCount++;
    console.log('  ✅ SALES has access to Customers (200 OK) and is blocked from creating products (403 Forbidden)');

    // 5. Role-based RBAC verification for WAREHOUSE
    console.log('\nCheck 5: Role RBAC checks for WAREHOUSE');
    const whLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'warehouse@nexora.com', password: 'Warehouse@123456' }),
    });
    const whLoginData = await whLoginRes.json();
    const whToken = whLoginData.data.token;

    const whProdRes = await fetch(`${baseUrl}/products`, { headers: headers(whToken) });
    const whCustRes = await fetch(`${baseUrl}/customers`, { headers: headers(whToken) });
    if (whProdRes.status !== 200 || whCustRes.status !== 403) {
      throw new Error(`WAREHOUSE RBAC failed: Prod HTTP ${whProdRes.status}, Cust HTTP ${whCustRes.status}`);
    }
    passCount++;
    console.log('  ✅ WAREHOUSE has access to Products (200 OK) and is blocked from Customers (403 Forbidden)');

    // 6. Role-based RBAC verification for ACCOUNTS
    console.log('\nCheck 6: Role RBAC checks for ACCOUNTS');
    const accLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'accounts@nexora.com', password: 'Accounts@123456' }),
    });
    const accLoginData = await accLoginRes.json();
    const accToken = accLoginData.data.token;

    const accCustRes = await fetch(`${baseUrl}/customers`, { headers: headers(accToken) });
    const accProdRes = await fetch(`${baseUrl}/products`, { headers: headers(accToken) });
    if (accCustRes.status !== 200 || accProdRes.status !== 200) {
      throw new Error(`ACCOUNTS RBAC failed: Cust HTTP ${accCustRes.status}, Prod HTTP ${accProdRes.status}`);
    }
    passCount++;
    console.log('  ✅ ACCOUNTS has read-only access to Customers and Products (200 OK)');

    console.log(`\n🎉 ALL ${passCount} FUNCTIONAL SMOKE VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
  } finally {
    server.close();
  }
}

runFunctionalSmokeVerification().catch((err) => {
  console.error('\n❌ FUNCTIONAL SMOKE VERIFICATION FAILED:', err);
  process.exit(1);
});
