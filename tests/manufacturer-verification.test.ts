import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockOtherAddress = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

// Mock contract state
let state = {
  admin: mockTxSender,
  verifiedManufacturers: {}
};

// Mock contract functions
const mockContract = {
  'is-admin': () => state.admin === mockTxSender,
  'add-manufacturer': (manufacturer) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    if (state.verifiedManufacturers[manufacturer]) return { type: 'err', value: 101 };
    state.verifiedManufacturers[manufacturer] = true;
    return { type: 'ok', value: true };
  },
  'remove-manufacturer': (manufacturer) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    if (!state.verifiedManufacturers[manufacturer]) return { type: 'err', value: 102 };
    delete state.verifiedManufacturers[manufacturer];
    return { type: 'ok', value: true };
  },
  'is-verified-manufacturer': (manufacturer) => {
    return !!state.verifiedManufacturers[manufacturer];
  },
  'transfer-admin': (newAdmin) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    state.admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Manufacturer Verification Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    state = {
      admin: mockTxSender,
      verifiedManufacturers: {}
    };
  });
  
  it('should allow admin to add a manufacturer', () => {
    const result = mockContract['add-manufacturer'](mockOtherAddress);
    expect(result.type).toBe('ok');
    expect(state.verifiedManufacturers[mockOtherAddress]).toBe(true);
  });
  
  it('should not allow adding a manufacturer twice', () => {
    mockContract['add-manufacturer'](mockOtherAddress);
    const result = mockContract['add-manufacturer'](mockOtherAddress);
    expect(result.type).toBe('err');
    expect(result.value).toBe(101); // ERR-ALREADY-VERIFIED
  });
  
  it('should allow admin to remove a manufacturer', () => {
    mockContract['add-manufacturer'](mockOtherAddress);
    const result = mockContract['remove-manufacturer'](mockOtherAddress);
    expect(result.type).toBe('ok');
    expect(state.verifiedManufacturers[mockOtherAddress]).toBeUndefined();
  });
  
  it('should not allow removing a non-existent manufacturer', () => {
    const result = mockContract['remove-manufacturer'](mockOtherAddress);
    expect(result.type).toBe('err');
    expect(result.value).toBe(102); // ERR-NOT-FOUND
  });
  
  it('should correctly verify a manufacturer', () => {
    expect(mockContract['is-verified-manufacturer'](mockOtherAddress)).toBe(false);
    mockContract['add-manufacturer'](mockOtherAddress);
    expect(mockContract['is-verified-manufacturer'](mockOtherAddress)).toBe(true);
  });
  
  it('should allow admin to transfer admin rights', () => {
    const result = mockContract['transfer-admin'](mockOtherAddress);
    expect(result.type).toBe('ok');
    expect(state.admin).toBe(mockOtherAddress);
  });
});
