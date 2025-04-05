import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockCertifier = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const mockBlockHeight = 123456;

// Mock contract state
let state = {
  admin: mockTxSender,
  authorizedCertifiers: {},
  equipmentCertifications: {}
};

// Mock contract functions
const mockContract = {
  'is-admin': () => state.admin === mockTxSender,
  'is-authorized-certifier': () => !!state.authorizedCertifiers[mockTxSender],
  'add-certifier': (certifier) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    state.authorizedCertifiers[certifier] = true;
    return { type: 'ok', value: true };
  },
  'remove-certifier': (certifier) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    delete state.authorizedCertifiers[certifier];
    return { type: 'ok', value: true };
  },
  'certify-equipment': (equipmentId, standardId) => {
    const key = `${equipmentId}-${standardId}`;
    if (state.admin !== mockTxSender && !state.authorizedCertifiers[mockTxSender]) {
      return { type: 'err', value: 100 };
    }
    if (state.equipmentCertifications[key]) {
      return { type: 'err', value: 101 };
    }
    state.equipmentCertifications[key] = {
      certified: true,
      timestamp: mockBlockHeight,
      certifier: mockTxSender
    };
    return { type: 'ok', value: true };
  },
  'is-certified': (equipmentId, standardId) => {
    const key = `${equipmentId}-${standardId}`;
    return state.equipmentCertifications[key]?.certified || false;
  },
  'get-certification-details': (equipmentId, standardId) => {
    const key = `${equipmentId}-${standardId}`;
    return state.equipmentCertifications[key] || null;
  },
  'transfer-admin': (newAdmin) => {
    if (state.admin !== mockTxSender) return { type: 'err', value: 100 };
    state.admin = newAdmin;
    return { type: 'ok', value: true };
  }
};

describe('Testing Certification Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    state = {
      admin: mockTxSender,
      authorizedCertifiers: {},
      equipmentCertifications: {}
    };
  });
  
  it('should allow admin to add a certifier', () => {
    const result = mockContract['add-certifier'](mockCertifier);
    expect(result.type).toBe('ok');
    expect(state.authorizedCertifiers[mockCertifier]).toBe(true);
  });
  
  it('should allow admin to remove a certifier', () => {
    mockContract['add-certifier'](mockCertifier);
    const result = mockContract['remove-certifier'](mockCertifier);
    expect(result.type).toBe('ok');
    expect(state.authorizedCertifiers[mockCertifier]).toBeUndefined();
  });
  
  it('should allow admin to certify equipment', () => {
    const equipmentId = 'EQUIP123';
    const standardId = 'ISO9001';
    const result = mockContract['certify-equipment'](equipmentId, standardId);
    expect(result.type).toBe('ok');
    expect(mockContract['is-certified'](equipmentId, standardId)).toBe(true);
  });
  
  it('should allow authorized certifier to certify equipment', () => {
    const originalTxSender = mockTxSender;
    mockContract['add-certifier'](mockCertifier);
    
    // Change tx-sender to certifier
    global.mockTxSender = mockCertifier;
    
    const equipmentId = 'EQUIP123';
    const standardId = 'ISO9001';
    const result = mockContract['certify-equipment'](equipmentId, standardId);
    
    // Restore original tx-sender
    global.mockTxSender = originalTxSender;
    
    expect(result.type).toBe('ok');
    expect(mockContract['is-certified'](equipmentId, standardId)).toBe(true);
  });
  
  it('should not allow certifying the same equipment twice', () => {
    const equipmentId = 'EQUIP123';
    const standardId = 'ISO9001';
    mockContract['certify-equipment'](equipmentId, standardId);
    const result = mockContract['certify-equipment'](equipmentId, standardId);
    expect(result.type).toBe('err');
    expect(result.value).toBe(101); // ERR-ALREADY-CERTIFIED
  });
  
  it('should return certification details', () => {
    const equipmentId = 'EQUIP123';
    const standardId = 'ISO9001';
    mockContract['certify-equipment'](equipmentId, standardId);
    const details = mockContract['get-certification-details'](equipmentId, standardId);
    expect(details).toEqual({
      certified: true,
      timestamp: mockBlockHeight,
      certifier: mockTxSender
    });
  });
});
