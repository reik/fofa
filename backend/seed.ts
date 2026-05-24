// Standalone dummy-data seeder for local development.
//   npx ts-node seed.ts
// In production the same data is seeded on startup when SEED_DUMMY_DATA=true
// (see src/index.ts). Both paths share src/utils/seedDummyData.ts.
import { seedDummyData } from './src/utils/seedDummyData';
import { closeDb } from './src/utils/db';

seedDummyData();
closeDb();
console.log('\n🌱 Seed complete. Login with any seeded user using password: Password123!');
console.log('   Example: sarah.mitchell@email.com / Password123!');
