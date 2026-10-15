import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { KeycloakValidationService } from './keycloak-validation.service';
import * as jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 🚀 Explicitly mock jsonwebtoken using Vitest tracking factories
vi.mock('jsonwebtoken', () => ({
  decode: vi.fn(),
  verify: vi.fn(),
}));

// 🚀 Mock jwks-rsa with a clean, trackable mock function on its prototype
const mockGetSigningKey = vi.fn().mockResolvedValue({
  getPublicKey: () => 'mock-public-key',
});

vi.mock('jwks-rsa', () => {
  return {
    JwksClient: class {
      getSigningKey = mockGetSigningKey;
    },
  };
});

describe('KeycloakValidationService', () => {
  let service: KeycloakValidationService;

  const mockConfig: Record<string, string> = {
    'keycloak.auth-server-url': 'https://example.com',
    'keycloak.realm': 'my-realm',
    'keycloak.clientId': 'my-client',
  };

  beforeEach(async () => {
    // 🚀 Reset the instance method's return value before each test run
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakValidationService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string): string => mockConfig[key] || ''),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<KeycloakValidationService>(KeycloakValidationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should validate token and return user info', async () => {
    // 🚀 Fixed: Added explicit safe casting wrapper definitions to satisfy ESLint
    vi.mocked(jwt.decode).mockReturnValue({
      header: { kid: '123' },
    });
    vi.mocked(jwt.verify).mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      preferred_username: 'tester',
      given_name: 'John',
      family_name: 'Doe',
      realm_access: { roles: ['admin'] },
    } as unknown as jwt.JwtPayload);

    const result = await service.getUserInfo('valid-token');

    expect(result).toMatchObject({
      id: 'user-123',
      name: 'John Doe',
    });
  });

  it('should return null and log error if jwt.verify fails', async () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    vi.mocked(jwt.decode).mockReturnValue({
      header: { kid: '123' },
    });
    vi.mocked(jwt.verify).mockImplementation(() => {
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
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    vi.mocked(jwt.decode).mockReturnValue({ header: {} });

    const result = await service.getUserInfo('no-kid-token');

    expect(result).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('missing kid'),
    );

    loggerSpy.mockRestore();
  });
});
