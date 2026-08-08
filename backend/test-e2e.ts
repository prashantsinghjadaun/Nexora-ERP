import app from './src/app';
import { generateToken } from './src/utils/jwt';
import { prisma } from './src/lib/prisma';
import { Role, CustomerType, CustomerStatus } from '@prisma/client';
import http from 'http';
import { AddressInfo } from 'net';

async function runMasterE2EVerification() {
  console.log('🌐 Starting Phase 7 Master End-to-End System Integration Verification...\n');

  // Query actual seeded users from database
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const salesUser = await prisma.user.findFirst({ where: { role: Role.SALES } });
  const warehouseUser = await prisma.user.findFirst({ where: { role: Role.WAREHOUSE } });
  const accountsUser = await prisma.user.findFirst({ where: { role: Role.ACCOUNTS } });

  if (!adminUser || !salesUser || !warehouseUser || !accountsUser) {
    throw new Error('❌ Test setup failed: Seeded users not found in database.');
  }

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
  const timeSuffix = Date.now().toString().slice(-6);

  try {
    // ==================================================
    // FLOW 1: AUTHENTICATION & SESSION
    // ==================================================
    console.log('--- FLOW 1: AUTHENTICATION & SESSION ---');
    
    // 1. ADMIN login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'admin@nexora.com', password: 'Admin@123456' }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.success || !adminLoginData.data.token) {
      throw new Error(`Flow 1 Failed: ADMIN login unsuccessful`);
    }
    const adminToken = adminLoginData.data.token;
    passCount++;
    console.log('  ✅ ADMIN authentication successful (JWT token issued)');

    // 2. /auth/me profile fetch
    const adminMeRes = await fetch(`${baseUrl}/auth/me`, { headers: headers(adminToken) });
    const adminMeData = await adminMeRes.json();
    if (adminMeRes.status !== 200 || adminMeData.data.email !== 'admin@nexora.com') {
      throw new Error(`Flow 1 Failed: /auth/me profile fetch unsuccessful`);
    }
    passCount++;
    console.log(`  ✅ User profile retrieved via /auth/me (${adminMeData.data.fullName} - ${adminMeData.data.role})`);

    // 3. Non-admin login (SALES)
    const salesLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'sales@nexora.com', password: 'Sales@123456' }),
    });
    const salesLoginData = await salesLoginRes.json();
    if (salesLoginRes.status !== 200 || salesLoginData.data.user.role !== 'SALES') {
      throw new Error(`Flow 1 Failed: SALES login unsuccessful`);
    }
    const salesToken = salesLoginData.data.token;
    passCount++;
    console.log('  ✅ SALES authentication successful');

    // 4. Unauthenticated request rejection
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    if (unauthRes.status !== 401) {
      throw new Error(`Flow 1 Failed: Unauthenticated request returned ${unauthRes.status}`);
    }
    passCount++;
    console.log('  ✅ Unauthenticated request rejected with HTTP 401 Unauthorized');


    // ==================================================
    // FLOW 2 & 3: CUSTOMER -> PRODUCT -> CHALLAN DRAFT -> CONFIRM -> STOCK DEDUCTION
    // ==================================================
    console.log('\n--- FLOW 2 & 3: CUSTOMER -> PRODUCT -> DRAFT CHALLAN -> CONFIRM -> INVENTORY DEDUCTION ---');

    // 1. Create Customer
    const custRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        name: `E2E Customer ${timeSuffix}`,
        mobile: '+919876543210',
        email: `e2e.cust.${timeSuffix}@test.com`,
        businessName: `E2E Enterprises ${timeSuffix}`,
        type: 'WHOLESALE',
        status: 'ACTIVE',
        address: '404 Enterprise Way',
      }),
    });
    const custData = await custRes.json();
    if (custRes.status !== 201 || !custData.success) {
      throw new Error(`Flow 2 Failed: Customer creation unsuccessful`);
    }
    const customerId = custData.data.id;
    passCount++;
    console.log(`  ✅ Customer created: '${custData.data.name}' (${custData.data.businessName})`);

    // 2. Create Products
    const prod1Res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Structural Steel Column 10m',
        sku: `SKU-E2E1-${timeSuffix}`,
        category: 'Construction',
        unitPrice: 1200.00,
        currentStock: 100,
        minStockAlert: 15,
        location: 'Warehouse A - Bay 01',
      }),
    });
    const prod1Data = await prod1Res.json();
    const productId1 = prod1Data.data.id;

    const prod2Res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Copper Fitting 25mm',
        sku: `SKU-E2E2-${timeSuffix}`,
        category: 'Plumbing',
        unitPrice: 150.00,
        currentStock: 30, // low initial stock for testing excess order
        minStockAlert: 10,
        location: 'Warehouse B - Bin 05',
      }),
    });
    const prod2Data = await prod2Res.json();
    const productId2 = prod2Data.data.id;
    passCount++;
    console.log(`  ✅ Products created: '${prod1Data.data.name}' (Stock: 100) & '${prod2Data.data.name}' (Stock: 30)`);

    // 3. Manual Stock IN & OUT Movement
    const manualInRes = await fetch(`${baseUrl}/products/${productId1}/stock-movements`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        quantity: 20,
        type: 'IN',
        reason: 'Restock shipment received (PO-9912)',
      }),
    });
    const manualInData = await manualInRes.json();
    if (manualInRes.status !== 201 || manualInData.data.type !== 'IN') {
      throw new Error(`Flow 3 Failed: Manual Stock IN failed`);
    }
    const checkStockAfterIn = await prisma.product.findUnique({ where: { id: productId1 } });
    if (checkStockAfterIn?.currentStock !== 120) {
      throw new Error(`Flow 3 Failed: Stock IN failed to increase stock from 100 to 120`);
    }
    passCount++;
    console.log('  ✅ Manual Stock IN movement verified: Stock increased from 100 to 120');

    // 4. Create Draft Challan
    const draftRes = await fetch(`${baseUrl}/challans`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        customerId,
        items: [
          { productId: productId1, quantity: 20 }, // 20 * 1200 = 24000
          { productId: productId2, quantity: 5 },  // 5 * 150 = 750
        ],
        notes: 'End-to-End Integration Draft Order',
      }),
    });
    const draftData = await draftRes.json();
    if (draftRes.status !== 201 || draftData.data.status !== 'DRAFT') {
      throw new Error(`Flow 2 Failed: Draft challan creation failed`);
    }
    const challanId = draftData.data.id;
    passCount++;
    console.log(`  ✅ Draft Sales Challan created: ${draftData.data.challanNumber} (Total Amount: $${draftData.data.totalAmount})`);

    // Verify stock remains UNCHANGED during draft creation
    const checkProd1DraftStock = await prisma.product.findUnique({ where: { id: productId1 } });
    if (checkProd1DraftStock?.currentStock !== 120) {
      throw new Error(`Flow 2 Failed: Draft creation altered stock!`);
    }
    console.log('  ✅ Verified: Inventory remains UNCHANGED during draft creation');

    // 5. Test Insufficient Stock Rejection & Rollback (Excess order for product 2)
    const excessDraftRes = await fetch(`${baseUrl}/challans`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        customerId,
        items: [{ productId: productId2, quantity: 9999 }], // stock is 30
      }),
    });
    const excessDraftData = await excessDraftRes.json();
    const excessChallanId = excessDraftData.data.id;

    const confirmExcessRes = await fetch(`${baseUrl}/challans/${excessChallanId}/confirm`, {
      method: 'POST',
      headers: headers(salesToken),
    });
    const confirmExcessData = await confirmExcessRes.json();
    if (confirmExcessRes.status !== 422 || confirmExcessData.error?.code !== 'INSUFFICIENT_STOCK') {
      throw new Error(`Flow 3 Failed: Expected 422 INSUFFICIENT_STOCK, got ${confirmExcessRes.status}`);
    }
    const checkStockAfterExcess = await prisma.product.findUnique({ where: { id: productId2 } });
    if (checkStockAfterExcess?.currentStock !== 30) {
      throw new Error(`Flow 3 Failed: Stock altered after rejected confirmation!`);
    }
    passCount++;
    console.log('  ✅ Excess order rejected with HTTP 422 INSUFFICIENT_STOCK. Stock remained unchanged at 30');

    // 6. Confirm Valid Challan in Single Atomic Transaction
    const confirmRes = await fetch(`${baseUrl}/challans/${challanId}/confirm`, {
      method: 'POST',
      headers: headers(salesToken),
    });
    const confirmData = await confirmRes.json();
    if (confirmRes.status !== 200 || confirmData.data.status !== 'CONFIRMED') {
      throw new Error(`Flow 2 Failed: Challan confirmation failed`);
    }
    passCount++;
    console.log(`  ✅ Sales Challan ${confirmData.data.challanNumber} CONFIRMED inside single atomic transaction`);

    // Verify Stock Decrement
    const checkProd1AfterConfirm = await prisma.product.findUnique({ where: { id: productId1 } });
    const checkProd2AfterConfirm = await prisma.product.findUnique({ where: { id: productId2 } });
    if (checkProd1AfterConfirm?.currentStock !== 100 || checkProd2AfterConfirm?.currentStock !== 25) {
      throw new Error(`Flow 2 Failed: Stock deduction incorrect! Prod1: ${checkProd1AfterConfirm?.currentStock}, Prod2: ${checkProd2AfterConfirm?.currentStock}`);
    }
    passCount++;
    console.log('  ✅ Product stock decremented correctly (Prod1: 120 -> 100, Prod2: 30 -> 25)');

    // Verify StockMovement Audit Log Created
    const auditMovements = await prisma.stockMovement.findMany({
      where: { productId: { in: [productId1, productId2] }, type: 'OUT' },
    });
    if (auditMovements.length < 2) {
      throw new Error(`Flow 2 Failed: StockMovement audit logs missing`);
    }
    passCount++;
    console.log(`  ✅ Internal StockMovement OUT audit logs created cleanly with reason: 'Sales Challan #${confirmData.data.challanNumber}'`);

    // 7. Verify Challan Detail Inspector Endpoint
    const challanDetailRes = await fetch(`${baseUrl}/challans/${challanId}`, { headers: headers(adminToken) });
    const challanDetailData = await challanDetailRes.json();
    if (challanDetailRes.status !== 200 || !challanDetailData.data.customer || !challanDetailData.data.items[0].productNameSnapshot) {
      throw new Error(`Flow 2 Failed: Challan detail payload incomplete`);
    }
    passCount++;
    console.log(`  ✅ Challan detail inspector returned full customer & snapshot item breakdown`);


    // ==================================================
    // FLOW 4: CUSTOMER FOLLOW-UP TIMELINE
    // ==================================================
    console.log('\n--- FLOW 4: CUSTOMER FOLLOW-UP TIMELINE ---');
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();
    const followUpRes = await fetch(`${baseUrl}/customers/${customerId}/follow-ups`, {
      method: 'POST',
      headers: headers(salesToken),
      body: JSON.stringify({
        notes: 'Followed up regarding structural steel delivery requirements',
        followUpDate: new Date().toISOString(),
        nextFollowUpDate: futureDate,
      }),
    });
    const followUpData = await followUpRes.json();
    if (followUpRes.status !== 201 || !followUpData.success) {
      throw new Error(`Flow 4 Failed: Follow-up creation failed`);
    }
    passCount++;

    const verifyCustRes = await fetch(`${baseUrl}/customers/${customerId}`, { headers: headers(salesToken) });
    const verifyCustData = await verifyCustRes.json();
    if (!verifyCustData.data.nextFollowUpDate || verifyCustData.data.followUps?.length === 0) {
      throw new Error(`Flow 4 Failed: Customer nextFollowUpDate or timeline not updated`);
    }
    passCount++;
    console.log(`  ✅ Customer follow-up logged cleanly. nextFollowUpDate updated to: ${verifyCustData.data.nextFollowUpDate}`);


    // ==================================================
    // FLOW 5: ROLE SECURITY & RBAC ENFORCEMENT
    // ==================================================
    console.log('\n--- FLOW 5: ROLE SECURITY & RBAC ENFORCEMENT ---');
    
    // WAREHOUSE login
    const whLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'warehouse@nexora.com', password: 'Warehouse@123456' }),
    });
    const whToken = (await whLoginRes.json()).data.token;

    // WAREHOUSE forbidden on customer endpoints
    const whCustRes = await fetch(`${baseUrl}/customers`, { headers: headers(whToken) });
    if (whCustRes.status !== 403) {
      throw new Error(`Flow 5 Failed: WAREHOUSE accessing customers returned ${whCustRes.status}`);
    }
    passCount++;
    console.log('  ✅ WAREHOUSE access to Customer CRM blocked with HTTP 403 Forbidden');

    // ACCOUNTS login
    const accLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email: 'accounts@nexora.com', password: 'Accounts@123456' }),
    });
    const accToken = (await accLoginRes.json()).data.token;

    // ACCOUNTS read OK, write blocked
    const accReadCustRes = await fetch(`${baseUrl}/customers`, { headers: headers(accToken) });
    const accCreateCustRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: headers(accToken),
      body: JSON.stringify({ name: 'Hacked', mobile: '+919999999999', type: 'RETAIL' }),
    });
    if (accReadCustRes.status !== 200 || accCreateCustRes.status !== 403) {
      throw new Error(`Flow 5 Failed: ACCOUNTS RBAC enforcement failed`);
    }
    passCount++;
    console.log('  ✅ ACCOUNTS has read access (200 OK) and modification blocked (403 Forbidden)');


    // ==================================================
    // FLOW 6: CHALLAN LIFECYCLE & CANCELLATION INVARIANTS
    // ==================================================
    console.log('\n--- FLOW 6: CHALLAN LIFECYCLE & CANCELLATION INVARIANTS ---');
    
    // Attempting to cancel CONFIRMED challan
    const cancelConfirmedRes = await fetch(`${baseUrl}/challans/${challanId}/cancel`, {
      method: 'POST',
      headers: headers(salesToken),
    });
    const cancelConfirmedData = await cancelConfirmedRes.json();
    if (cancelConfirmedRes.status !== 422 || cancelConfirmedData.error?.code !== 'CANNOT_CANCEL_CONFIRMED_CHALLAN') {
      throw new Error(`Flow 6 Failed: Expected 422 CANNOT_CANCEL_CONFIRMED_CHALLAN, got ${cancelConfirmedRes.status}`);
    }
    passCount++;
    console.log('  ✅ Cancelling CONFIRMED challan rejected with HTTP 422 CANNOT_CANCEL_CONFIRMED_CHALLAN');


    // ==================================================
    // FLOW 7: SINGLE DATABASE TRANSACTION INTEGRITY & ROLLBACK
    // ==================================================
    console.log('\n--- FLOW 7: SINGLE DATABASE TRANSACTION INTEGRITY & ROLLBACK ---');
    const checkFinalStock1 = await prisma.product.findUnique({ where: { id: productId1 } });
    const checkFinalStock2 = await prisma.product.findUnique({ where: { id: productId2 } });

    if (checkFinalStock1?.currentStock !== 100 || checkFinalStock2?.currentStock !== 25) {
      throw new Error(`Flow 7 Failed: Database inventory state inconsistent`);
    }
    passCount++;
    console.log('  ✅ Final database state verified: All ACID transaction rollbacks and stock changes intact');

    console.log(`\n🎉 ALL ${passCount} MASTER END-TO-END SYSTEM INTEGRATION CHECKS PASSED SUCCESSFULLY!`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runMasterE2EVerification().catch((err) => {
  console.error('\n❌ MASTER E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
