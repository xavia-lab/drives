import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { Currency } from '../modules/currency/entities/currency.entity';
import { User } from '../modules/user/entities/user.entity';
// Import other entities

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

  async seedDatabase() {
    console.log('Seeding database...');
    // Add your seed logic here
    // Example: await this.currencyService.seedDefaultCurrencies();
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
