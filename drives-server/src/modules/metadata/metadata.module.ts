import { Global, Module } from '@nestjs/common';
import { ManagedResourcesService } from './managed-resources.service';
import { MetadataController } from './metadata.controller';

@Global() // Makes ManagedResourcesService injectable in the app-wide CerbosGuard
@Module({
  controllers: [MetadataController],
  providers: [ManagedResourcesService],
  exports: [ManagedResourcesService],
})
export class MetadataModule {}
