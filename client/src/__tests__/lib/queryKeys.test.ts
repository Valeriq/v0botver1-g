import { describe, it, expect } from 'vitest';
import { queryKeys } from '../../lib/queryKeys';

describe('queryKeys', () => {
  describe('contacts', () => {
    it('queryKeys.contacts.all returns ["contacts"]', () => {
      expect(queryKeys.contacts.all).toEqual(['contacts']);
    });

    it('queryKeys.contacts.list() returns ["contacts", "list"]', () => {
      expect(queryKeys.contacts.list()).toEqual(['contacts', 'list']);
    });

    it('queryKeys.contacts.detail("123") returns ["contacts", "detail", "123"]', () => {
      expect(queryKeys.contacts.detail('123')).toEqual(['contacts', 'detail', '123']);
    });
  });

  describe('campaigns', () => {
    it('queryKeys.campaigns.all returns ["campaigns"]', () => {
      expect(queryKeys.campaigns.all).toEqual(['campaigns']);
    });

    it('queryKeys.campaigns.list() returns ["campaigns", "list"]', () => {
      expect(queryKeys.campaigns.list()).toEqual(['campaigns', 'list']);
    });

    it('queryKeys.campaigns.detail("456") returns ["campaigns", "detail", "456"]', () => {
      expect(queryKeys.campaigns.detail('456')).toEqual(['campaigns', 'detail', '456']);
    });
  });

  describe('leads', () => {
    it('queryKeys.leads.all returns ["leads"]', () => {
      expect(queryKeys.leads.all).toEqual(['leads']);
    });

    it('queryKeys.leads.list() returns ["leads", "list"]', () => {
      expect(queryKeys.leads.list()).toEqual(['leads', 'list']);
    });

    it('queryKeys.leads.detail("789") returns ["leads", "detail", "789"]', () => {
      expect(queryKeys.leads.detail('789')).toEqual(['leads', 'detail', '789']);
    });
  });

  describe('emails', () => {
    it('queryKeys.emails.all returns ["emails"]', () => {
      expect(queryKeys.emails.all).toEqual(['emails']);
    });

    it('queryKeys.emails.list() returns ["emails", "list"]', () => {
      expect(queryKeys.emails.list()).toEqual(['emails', 'list']);
    });

    it('queryKeys.emails.detail("abc") returns ["emails", "detail", "abc"]', () => {
      expect(queryKeys.emails.detail('abc')).toEqual(['emails', 'detail', 'abc']);
    });
  });

  describe('gmailAccounts', () => {
    it('queryKeys.gmailAccounts.all returns ["gmailAccounts"]', () => {
      expect(queryKeys.gmailAccounts.all).toEqual(['gmailAccounts']);
    });

    it('queryKeys.gmailAccounts.list() returns ["gmailAccounts", "list"]', () => {
      expect(queryKeys.gmailAccounts.list()).toEqual(['gmailAccounts', 'list']);
    });

    it('queryKeys.gmailAccounts.detail("xyz") returns ["gmailAccounts", "detail", "xyz"]', () => {
      expect(queryKeys.gmailAccounts.detail('xyz')).toEqual(['gmailAccounts', 'detail', 'xyz']);
    });
  });

  describe('promptProfiles', () => {
    it('queryKeys.promptProfiles.all returns ["promptProfiles"]', () => {
      expect(queryKeys.promptProfiles.all).toEqual(['promptProfiles']);
    });

    it('queryKeys.promptProfiles.list() returns ["promptProfiles", "list"]', () => {
      expect(queryKeys.promptProfiles.list()).toEqual(['promptProfiles', 'list']);
    });

    it('queryKeys.promptProfiles.detail("def") returns ["promptProfiles", "detail", "def"]', () => {
      expect(queryKeys.promptProfiles.detail('def')).toEqual(['promptProfiles', 'detail', 'def']);
    });
  });

  describe('type safety', () => {
    it('all keys are readonly (as const)', () => {
      // TypeScript will enforce this at compile time
      // This test verifies the structure is correct
      expect(queryKeys.contacts.all).toBeInstanceOf(Array);
      expect(queryKeys.campaigns.all).toBeInstanceOf(Array);
      expect(queryKeys.leads.all).toBeInstanceOf(Array);
    });
  });
});
