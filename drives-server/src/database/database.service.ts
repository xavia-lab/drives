import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const nodeEnv = this.configService.get<string>('app.nodeEnv');

    // Only sync in development
    if (nodeEnv === 'development') {
      await this.syncDatabase();
    }
  }

  async syncDatabase(options?: { force?: boolean; alter?: boolean }) {
    const nodeEnv = this.configService.get<string>('app.nodeEnv');

    if (nodeEnv !== 'development') {
      console.warn('Database sync is only allowed in development environment');
      return;
    }

    const force = options?.force || false;
    const alter = options?.alter || false;

    console.log(`Syncing database with force: ${force}, alter: ${alter}`);

    try {
      await this.sequelize.sync({ force, alter });
      console.log('Database synchronized successfully');

      // Seed data after sync if needed
      if (force) {
        await this.seedDatabase();
      }
    } catch (error) {
      console.error('Database sync failed:', error);
      throw error;
    }
  }

  // Fixed: Removed 'async' keyword since there are no active 'await' calls inside
  seedDatabase() {
    console.log('Seeding database...');
    // Add your seed logic here
    // Example: await this.currencyService.seedDefaultCurrencies();
    return Promise.resolve(); // Returns a promise to keep compatibility with 'await this.seedDatabase()'
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
