import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

async function bootstrap() {
  console.log('🔧 Starting database synchronization...');

  // Parse command line arguments
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  const alter = process.argv.includes('--alter') || process.argv.includes('-a');

  console.log(`📊 Sync options: force=${force}, alter=${alter}`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);

  try {
    await databaseService.syncDatabase({ force, alter });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
