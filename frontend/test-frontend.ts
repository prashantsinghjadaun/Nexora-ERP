import fs from 'fs';
import path from 'path';

async function runFrontendVerification() {
  console.log('🧪 Starting Phase 6 Frontend Structure & Build Verification Suite...\n');

  const rootDir = process.cwd();

  const requiredFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/index.css',
    'src/types/index.ts',
    'src/services/apiClient.ts',
    'src/context/AuthContext.tsx',
    'src/components/guards/ProtectedRoute.tsx',
    'src/components/layout/AppLayout.tsx',
    'src/components/layout/Sidebar.tsx',
    'src/pages/auth/LoginPage.tsx',
    'src/pages/dashboard/DashboardPage.tsx',
    'src/pages/customers/CustomerListPage.tsx',
    'src/pages/customers/CustomerDetailPage.tsx',
    'src/pages/inventory/ProductListPage.tsx',
    'src/pages/inventory/StockMovementPage.tsx',
    'src/pages/challans/ChallanListPage.tsx',
    'src/pages/challans/CreateChallanPage.tsx',
    'src/pages/challans/ChallanDetailPage.tsx',
  ];

  let passCount = 0;

  console.log('Test 1: Verifying physical existence of all core frontend files...');
  for (const relativePath of requiredFiles) {
    const fullPath = path.join(rootDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required frontend source file: ${relativePath}`);
    }
  }
  passCount++;
  console.log(`  ✅ All ${requiredFiles.length} core frontend components physically exist in workspace`);

  console.log('\nTest 2: Verifying production bundle output directory (dist/)...');
  const distPath = path.join(rootDir, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Frontend build directory dist/ does not exist. Run npm run build first.');
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Production bundle index.html is missing from dist/');
  }
  passCount++;
  console.log('  ✅ Production bundle index.html verified in dist/');

  console.log(`\n🎉 ALL ${passCount} FRONTEND STRUCTURAL & BUNDLE VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
}

runFrontendVerification().catch((err) => {
  console.error('\n❌ FRONTEND VERIFICATION FAILED:', err);
  process.exit(1);
});
