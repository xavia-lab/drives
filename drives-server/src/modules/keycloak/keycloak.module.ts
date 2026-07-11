import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakStrategy } from './strategies/keycloak.strategy';
import { KeycloakValidationService } from './keycloak-validation.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KeycloakStrategy, KeycloakValidationService],
  exports: [KeycloakStrategy, KeycloakValidationService],
})
export class KeycloakModule {}
