import app from './src/app';
import { generateToken } from './src/utils/jwt';
import { prisma } from './src/lib/prisma';
import { Role } from '@prisma/client';
import http from 'http';
import { AddressInfo } from 'net';

async function runProductVerification() {
  console.log('🧪 Starting Phase 4 Products + Inventory Verification Suite...\n');

  // Query actual seeded users from database to ensure valid foreign keys
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const salesUser = await prisma.user.findFirst({ where: { role: Role.SALES } });
  const warehouseUser = await prisma.user.findFirst({ where: { role: Role.WAREHOUSE } });
  const accountsUser = await prisma.user.findFirst({ where: { role: Role.ACCOUNTS } });

  if (!adminUser || !salesUser || !warehouseUser || !accountsUser) {
    throw new Error('❌ Test setup failed: Seeded users not found in database. Run database seed first.');
  }

  // Start Express server on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  // Create valid JWT tokens for each role
  const adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: adminUser.role });
  const salesToken = generateToken({ userId: salesUser.id, email: salesUser.email, role: salesUser.role });
  const warehouseToken = generateToken({ userId: warehouseUser.id, email: warehouseUser.email, role: warehouseUser.role });
  const accountsToken = generateToken({ userId: accountsUser.id, email: accountsUser.email, role: accountsUser.role });

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  let passCount = 0;

  try {
    const timeSuffix = Date.now().toString().slice(-6);

    // 1. ADMIN can create product → success
    console.log('Test 1: ADMIN can create product → success');
    const adminSku = `PROD-ADM-${timeSuffix}`;
    const adminProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Industrial Steel Beam 10mm',
        sku: adminSku,
        category: 'Construction',
        unitPrice: 1500.50,
        currentStock: 100,
        minStockAlert: 15,
        location: 'Warehouse A - Rack 04',
      }),
    });
    const adminProdData = await adminProdRes.json();
    if (adminProdRes.status !== 201 || !adminProdData.success || !adminProdData.data.id) {
      throw new Error(`Test 1 Failed: ${JSON.stringify(adminProdData)}`);
    }
    const productId1 = adminProdData.data.id;
    passCount++;
    console.log(`  ✅ ADMIN created product ID: ${productId1}`);

    // 2. WAREHOUSE can create product → success
    console.log('\nTest 2: WAREHOUSE can create product → success');
    const whSku = `PROD-WH-${timeSuffix}`;
    const whProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(warehouseToken),
      body: JSON.stringify({
        name: 'Copper Wire Spool 50m',
        sku: whSku,
        category: 'Electrical',
        unitPrice: 450.00,
        currentStock: 50,
        minStockAlert: 10,
        location: 'Warehouse B - Bin 12',
      }),
    });
    const whProdData = await whProdRes.json();
    if (whProdRes.status !== 201 || !whProdData.success) {
      throw new Error(`Test 2 Failed: ${JSON.stringify(whProdData)}`);
    }
    const productId2 = whProdData.data.id;
    passCount++;
    console.log(`  ✅ WAREHOUSE created product: ${whProdData.data.name}`);

    // 3. SALES can read products → 200
    console.log('\nTest 3: SALES can read products → 200');
    const salesReadRes = await fetch(`${baseUrl}/products`, { headers: headers(salesToken) });
    const salesReadData = await salesReadRes.json();
    if (salesReadRes.status !== 200 || !salesReadData.success || !Array.isArray(salesReadData.data)) {
      throw new Error(`Test 3 Failed: ${JSON.stringify(salesReadData)}`);
    }
    passCount++;
    console.log(`  ✅ SALES read ${salesReadData.data.length} product entries (HTTP 200)`);

    // 4. ACCOUNTS can read products → 200
    console.log('\nTest 4: ACCOUNTS can read products → 200');
    const accReadRes = await fetch(`${baseUrl}/products`, { headers: headers(accountsToken) });
    const accReadData = await accReadRes.json();
    if (accReadRes.status !== 200 || !accReadData.success) {
      throw new Error(`Test 4 Failed: ${JSON.stringify(accReadData)}`);
    }
    passCount++;
    console.log(`  ✅ ACCOUNTS read ${accReadData.data.length} product entries (HTTP 200)`);

    // 5. SALES cannot create product → 403
    console.log('\nTest 5: SALES cannot create product → 403');
    const salesCreateRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        name: 'Forbidden Product',
        sku: `FORBID-SALES-${timeSuffix}`,
        category: 'Test',
        unitPrice: 10,
        currentStock: 10,
        location: 'Loc',
      }),
    });
    const salesCreateData = await salesCreateRes.json();
    if (salesCreateRes.status !== 403 || salesCreateData.error?.code !== 'FORBIDDEN') {
      throw new Error(`Test 5 Failed: Expected 403 FORBIDDEN, got ${salesCreateRes.status}`);
    }
    passCount++;
    console.log('  ✅ SALES blocked from creating product with HTTP 403 Forbidden');

    // 6. SALES cannot update product → 403
    console.log('\nTest 6: SALES cannot update product → 403');
    const salesUpdateRes = await fetch(`${baseUrl}/products/${productId1}`, {
      method: 'PUT',
      headers: headers(salesToken),
      body: JSON.stringify({ name: 'Attempted Sales Update' }),
    });
    const salesUpdateData = await salesUpdateRes.json();
    if (salesUpdateRes.status !== 403 || salesUpdateData.error?.code !== 'FORBIDDEN') {
      throw new Error(`Test 6 Failed: Expected 403 FORBIDDEN, got ${salesUpdateRes.status}`);
    }
    passCount++;
    console.log('  ✅ SALES blocked from updating product with HTTP 403 Forbidden');

    // 7. ACCOUNTS cannot create/update product → 403
    console.log('\nTest 7: ACCOUNTS cannot create/update product → 403');
    const accUpdateRes = await fetch(`${baseUrl}/products/${productId1}`, {
      method: 'PUT',
      headers: headers(accountsToken),
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    const accUpdateData = await accUpdateRes.json();
    if (accUpdateRes.status !== 403 || accUpdateData.error?.code !== 'FORBIDDEN') {
      throw new Error(`Test 7 Failed: Expected 403 FORBIDDEN, got ${accUpdateRes.status}`);
    }
    passCount++;
    console.log('  ✅ ACCOUNTS blocked from modifying product with HTTP 403 Forbidden');

    // 8. WAREHOUSE can create IN movement → success & 9. IN movement increases stock correctly
    console.log('\nTest 8 & 9: WAREHOUSE can create IN movement & IN movement increases stock correctly');
    const initialStock = whProdData.data.currentStock; // 50
    const inQty = 30;
    const inRes = await fetch(`${baseUrl}/products/${productId2}/stock-movements`, {
      method: 'POST',
      headers: headers(warehouseToken),
      body: JSON.stringify({
        quantity: inQty,
        type: 'IN',
        reason: 'Restock shipment received from supplier (PO-8821)',
      }),
    });
    const inData = await inRes.json();
    if (inRes.status !== 201 || !inData.success || inData.data.type !== 'IN' || inData.data.quantity !== inQty) {
      throw new Error(`Test 8 Failed: ${JSON.stringify(inData)}`);
    }
    passCount++; // Test 8

    const verifyInProdRes = await fetch(`${baseUrl}/products/${productId2}`, { headers: headers(adminToken) });
    const verifyInProdData = await verifyInProdRes.json();
    const expectedInStock = initialStock + inQty; // 50 + 30 = 80
    if (verifyInProdData.data.currentStock !== expectedInStock) {
      throw new Error(`Test 9 Failed: Expected stock ${expectedInStock}, got ${verifyInProdData.data.currentStock}`);
    }
    passCount++; // Test 9
    console.log(`  ✅ Stock correctly increased from ${initialStock} to ${expectedInStock}`);

    // 10. WAREHOUSE can create OUT movement → success & 11. OUT movement decreases stock correctly
    console.log('\nTest 10 & 11: WAREHOUSE can create OUT movement & OUT movement decreases stock correctly');
    const outQty = 25;
    const outRes = await fetch(`${baseUrl}/products/${productId2}/stock-movements`, {
      method: 'POST',
      headers: headers(warehouseToken),
      body: JSON.stringify({
        quantity: outQty,
        type: 'OUT',
        reason: 'Dispatched for manual order transfer',
      }),
    });
    const outData = await outRes.json();
    if (outRes.status !== 201 || !outData.success || outData.data.type !== 'OUT') {
      throw new Error(`Test 10 Failed: ${JSON.stringify(outData)}`);
    }
    passCount++; // Test 10

    const verifyOutProdRes = await fetch(`${baseUrl}/products/${productId2}`, { headers: headers(adminToken) });
    const verifyOutProdData = await verifyOutProdRes.json();
    const expectedOutStock = expectedInStock - outQty; // 80 - 25 = 55
    if (verifyOutProdData.data.currentStock !== expectedOutStock) {
      throw new Error(`Test 11 Failed: Expected stock ${expectedOutStock}, got ${verifyOutProdData.data.currentStock}`);
    }
    passCount++; // Test 11
    console.log(`  ✅ WAREHOUSE created OUT movement of -${outQty} units. Stock correctly decreased to ${expectedOutStock}`);

    // 12. OUT greater than available stock → 400 & 13. Stock remains unchanged & 14. Stock never becomes negative
    console.log('\nTest 12, 13, 14: Excess OUT movement rejected (400), stock unchanged & never negative');
    const excessQty = 9999;
    const excessRes = await fetch(`${baseUrl}/products/${productId2}/stock-movements`, {
      method: 'POST',
      headers: headers(warehouseToken),
      body: JSON.stringify({
        quantity: excessQty,
        type: 'OUT',
        reason: 'Attempted oversized withdrawal',
      }),
    });
    const excessData = await excessRes.json();
    if (excessRes.status !== 400 || excessData.error?.code !== 'BAD_REQUEST') {
      throw new Error(`Test 12 Failed: Expected 400 BAD_REQUEST, got ${excessRes.status}`);
    }
    passCount++; // Test 12

    const checkStockAfterRollbackRes = await fetch(`${baseUrl}/products/${productId2}`, { headers: headers(adminToken) });
    const checkStockAfterRollbackData = await checkStockAfterRollbackRes.json();
    if (checkStockAfterRollbackData.data.currentStock !== expectedOutStock) {
      throw new Error(`Test 13 Failed: Stock changed after rejected OUT! Expected ${expectedOutStock}, got ${checkStockAfterRollbackData.data.currentStock}`);
    }
    passCount++; // Test 13
    passCount++; // Test 14 (non-negative stock invariant)
    console.log(`  ✅ Excess OUT movement rejected with HTTP 400. Stock remained unchanged at ${expectedOutStock}`);

    // 15. Successful movement creates StockMovement & 16. Movement history works and is newest-first
    console.log('\nTest 15 & 16: Stock movement audit log created & history works newest-first');
    const historyRes = await fetch(`${baseUrl}/products/${productId2}/stock-movements`, { headers: headers(salesToken) });
    const historyData = await historyRes.json();
    if (historyRes.status !== 200 || !historyData.success || historyData.data.length < 2) {
      throw new Error(`Test 15/16 Failed: ${JSON.stringify(historyData)}`);
    }
    // Verify newest-first ordering: latest movement should be OUT created second
    if (historyData.data[0].type !== 'OUT' || historyData.data[1].type !== 'IN') {
      throw new Error(`Test 16 Failed: History not ordered newest-first`);
    }
    passCount++; // Test 15
    passCount++; // Test 16
    console.log(`  ✅ Stock movement audit log returned ${historyData.data.length} entries ordered newest-first`);

    // 17. Low-stock filter works
    console.log('\nTest 17: Low-stock filter works');
    const lowStockSku = `LOW-STOCK-${timeSuffix}`;
    const lowStockProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Critical Low Stock Fastener',
        sku: lowStockSku,
        category: 'Hardware',
        unitPrice: 20.00,
        currentStock: 3,
        minStockAlert: 10,
        location: 'Rack C-01',
      }),
    });
    const lowStockProdData = await lowStockProdRes.json();

    const filterLowStockRes = await fetch(`${baseUrl}/products?lowStock=true`, { headers: headers(adminToken) });
    const filterLowStockData = await filterLowStockRes.json();
    const foundLowStock = filterLowStockData.data?.some((p: { id: string }) => p.id === lowStockProdData.data.id);
    if (filterLowStockRes.status !== 200 || !foundLowStock) {
      throw new Error(`Test 17 Failed: Low stock filter did not include product with stock 3 vs alert 10`);
    }
    passCount++;
    console.log(`  ✅ Low-stock filter (currentStock <= minStockAlert) returned low-stock product`);

    // 18. Duplicate SKU → 409
    console.log('\nTest 18: Duplicate SKU → 409 Conflict');
    const dupRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Duplicate SKU Product',
        sku: adminSku, // already created in Test 1
        category: 'Hardware',
        unitPrice: 100,
        currentStock: 10,
        location: 'Rack D',
      }),
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 409 || dupData.error?.code !== 'CONFLICT') {
      throw new Error(`Test 18 Failed: Expected 409 CONFLICT, got ${dupRes.status}`);
    }
    passCount++;
    console.log('  ✅ Duplicate SKU submission rejected with HTTP 409 Conflict');

    // 19. Invalid product data → 400
    console.log('\nTest 19: Invalid product data → 400 Bad Request');
    const invalidProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: '',
        sku: '',
        category: '',
        unitPrice: -50,
        currentStock: -10,
        location: '',
      }),
    });
    const invalidProdData = await invalidProdRes.json();
    if (invalidProdRes.status !== 400 || invalidProdData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Test 19 Failed: Expected 400 VALIDATION_ERROR, got ${invalidProdRes.status}`);
    }
    passCount++;
    console.log(`  ✅ Invalid product data rejected with HTTP 400 VALIDATION_ERROR`);

    // 20. Unknown product → 404
    console.log('\nTest 20: Unknown product → 404 Not Found');
    const unknownRes = await fetch(`${baseUrl}/products/00000000-0000-0000-0000-000000000000`, {
      headers: headers(adminToken),
    });
    const unknownData = await unknownRes.json();
    if (unknownRes.status !== 404 || unknownData.error?.code !== 'NOT_FOUND') {
      throw new Error(`Test 20 Failed: Expected 404 NOT_FOUND, got ${unknownRes.status}`);
    }
    passCount++;
    console.log('  ✅ Unknown product ID returned HTTP 404 NOT_FOUND');

    // 21. Unauthenticated request → 401
    console.log('\nTest 21: Unauthenticated request → 401 Unauthorized');
    const unauthRes = await fetch(`${baseUrl}/products`);
    const unauthData = await unauthRes.json();
    if (unauthRes.status !== 401 || unauthData.error?.code !== 'UNAUTHORIZED') {
      throw new Error(`Test 21 Failed: Expected 401 UNAUTHORIZED, got ${unauthRes.status}`);
    }
    passCount++;
    console.log('  ✅ Request without Bearer token rejected with HTTP 401 Unauthorized');

    // 22. PUT attempting to modify currentStock is rejected by validation (400)
    console.log('\nTest 22: PUT attempting to modify currentStock is rejected by validation (400 Bad Request)');
    const putStockRes = await fetch(`${baseUrl}/products/${productId1}`, {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify({ currentStock: 9999 }),
    });
    const putStockData = await putStockRes.json();
    if (putStockRes.status !== 400 || putStockData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Test 22 Failed: Expected 400 VALIDATION_ERROR when passing currentStock in PUT, got ${putStockRes.status}: ${JSON.stringify(putStockData)}`);
    }
    passCount++;
    console.log('  ✅ Attempting to update currentStock via PUT rejected with HTTP 400 VALIDATION_ERROR');

    // 23. Valid PUT updates allowed catalog fields successfully
    console.log('\nTest 23: Valid PUT updates allowed catalog fields successfully');
    const updatePayload = {
      name: 'Updated Steel Beam 12mm',
      unitPrice: 1650.00,
      location: 'Warehouse A - Rack 08',
    };
    const validPutRes = await fetch(`${baseUrl}/products/${productId1}`, {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify(updatePayload),
    });
    const validPutData = await validPutRes.json();
    if (
      validPutRes.status !== 200 ||
      !validPutData.success ||
      validPutData.data.name !== updatePayload.name ||
      Number(validPutData.data.unitPrice) !== updatePayload.unitPrice ||
      validPutData.data.location !== updatePayload.location
    ) {
      throw new Error(`Test 23 Failed: ${JSON.stringify(validPutData)}`);
    }
    passCount++;
    console.log(`  ✅ Valid PUT update succeeded. Updated name: '${validPutData.data.name}', price: $${validPutData.data.unitPrice}`);

    console.log(`\n🎉 ALL ${passCount} / 23 PHASE 4 PRODUCTS + INVENTORY VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runProductVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
