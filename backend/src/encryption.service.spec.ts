import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeAll(() => {
    // Set up environment variable for testing
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt text correctly', () => {
    const originalText = 'test-token-12345';
    
    const encrypted = service.encrypt(originalText);
    expect(encrypted).toBeDefined();
    expect(encrypted).toContain(':');
    
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should produce different encrypted values for the same input', () => {
    const originalText = 'test-token-12345';
    
    const encrypted1 = service.encrypt(originalText);
    const encrypted2 = service.encrypt(originalText);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same value
    expect(service.decrypt(encrypted1)).toBe(originalText);
    expect(service.decrypt(encrypted2)).toBe(originalText);
  });

  it('should throw error for invalid encrypted text', () => {
    expect(() => {
      service.decrypt('invalid-format');
    }).toThrow('Invalid encrypted text format');
  });
});
