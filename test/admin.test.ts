import { describe, expect, it, vi } from 'vitest';

import { config } from '@/lib/config';
import { getAdminAddress } from '@/lib/stellar/balance';

describe('admin address resolution', () => {
  const contractAddr = 'GCONTRACTADMIN1234567890123456789012345678901234567890123456';
  const envAddr = 'GENVADMIN123456789012345678901234567890123456789012345678901';

  it('uses contract address when returned by contract call (contract only)', async () => {
    const originalEnv = config.adminAddress;
    try {
      config.adminAddress = '';
      const readContract = vi.fn().mockResolvedValue(contractAddr);
      const result = await getAdminAddress(readContract);
      expect(result).toBe(contractAddr);
      expect(readContract).toHaveBeenCalledTimes(1);
    } finally {
      config.adminAddress = originalEnv;
    }
  });

  it('prioritizes contract address over configured environment variable', async () => {
    const originalEnv = config.adminAddress;
    try {
      config.adminAddress = envAddr;
      const readContract = vi.fn().mockResolvedValue(contractAddr);
      const result = await getAdminAddress(readContract);
      expect(result).toBe(contractAddr);
    } finally {
      config.adminAddress = originalEnv;
    }
  });

  it('falls back to environment variable when contract is unavailable (configured)', async () => {
    const originalEnv = config.adminAddress;
    try {
      config.adminAddress = envAddr;
      const readContract = vi.fn().mockResolvedValue(null);
      const result = await getAdminAddress(readContract);
      expect(result).toBe(envAddr);
    } finally {
      config.adminAddress = originalEnv;
    }
  });

  it('falls back to environment variable when contract call rejects', async () => {
    const originalEnv = config.adminAddress;
    try {
      config.adminAddress = envAddr;
      const readContract = vi.fn().mockRejectedValue(new Error('RPC error'));
      const result = await getAdminAddress(readContract);
      expect(result).toBe(envAddr);
    } finally {
      config.adminAddress = originalEnv;
    }
  });

  it('returns null when neither contract nor environment variable is available (missing)', async () => {
    const originalEnv = config.adminAddress;
    try {
      config.adminAddress = '';
      const readContract = vi.fn().mockResolvedValue(null);
      const result = await getAdminAddress(readContract);
      expect(result).toBeNull();
    } finally {
      config.adminAddress = originalEnv;
    }
  });
});
