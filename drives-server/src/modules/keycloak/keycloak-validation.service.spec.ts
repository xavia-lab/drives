import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { KeycloakValidationService } from './keycloak-validation.service';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

jest.mock('jsonwebtoken');

// CRITICAL FIX: Explicitly mock the factory to stop Jest from traversing the 'jose' ESM module
jest.mock('jwks-rsa', () => {
  return {
    JwksClient: jest.fn().mockImplementation(() => ({
      getSigningKey: jest.fn().mockResolvedValue({
        getPublicKey: () => 'mock-public-key',
      }),
    })),
  };
});

describe('KeycloakValidationService', () => {
  let service: KeycloakValidationService;

  const mockConfig = {
    'keycloak.auth-server-url': 'https://keycloak.example.com',
    'keycloak.realm': 'my-realm',
    'keycloak.clientId': 'my-client',
  };

  beforeEach(async () => {
    (JwksClient as jest.Mock).mockImplementation(() => ({
      getSigningKey: jest.fn().mockResolvedValue({
        getPublicKey: () => 'mock-public-key',
      }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakValidationService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => mockConfig[key]) },
        },
      ],
    }).compile();

    // Silence the logger for tests
    module.useLogger(false);

    service = module.get<KeycloakValidationService>(KeycloakValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate token and return user info', async () => {
    (jwt.decode as jest.Mock).mockReturnValue({ header: { kid: '123' } });
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      preferred_username: 'tester',
      given_name: 'John',
      family_name: 'Doe',
      realm_access: { roles: ['admin'] },
    });

    const result = await service.getUserInfo('valid-token');

    expect(result).toMatchObject({
      id: 'user-123',
      name: 'John Doe',
    });
  });

  it('should return null and log error if jwt.verify fails', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    (jwt.decode as jest.Mock).mockReturnValue({ header: { kid: '123' } });
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const result = await service.getUserInfo('bad-token');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Token validation failed: Invalid signature'),
    );

    loggerSpy.mockRestore();
  });

  it('should return null if token header is missing kid', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    (jwt.decode as jest.Mock).mockReturnValue({ header: {} });

    const result = await service.getUserInfo('no-kid-token');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('missing kid'),
    );

    loggerSpy.mockRestore();
  });
});
