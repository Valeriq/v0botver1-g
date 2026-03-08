import { describe, it, expect } from 'vitest';
import { queryKeys } from '../../lib/queryKeys';

describe('queryKeys', () => {
  it('should have contacts keys', () => {
    expect(queryKeys.contacts.all).toEqual(['contacts']);
    expect(queryKeys.contacts.lists()).toEqual(['contacts', 'list']);
    expect(queryKeys.contacts.list({ page: 1 })).toEqual(['contacts', 'list', { filters: { page: 1 } }]);
    expect(queryKeys.contacts.detail('123')).toEqual(['contacts', 'detail', '123']);
  });

  it('should have campaigns keys', () => {
    expect(queryKeys.campaigns.all).toEqual(['campaigns']);
    expect(queryKeys.campaigns.detail('456')).toEqual(['campaigns', 'detail', '456']);
  });

  it('should have leads keys', () => {
    expect(queryKeys.leads.all).toEqual(['leads']);
    expect(queryKeys.leads.list({ status: 'new' })).toEqual(['leads', 'list', { filters: { status: 'new' } }]);
  });

  it('should have accounts keys', () => {
    expect(queryKeys.accounts.all).toEqual(['accounts']);
    expect(queryKeys.accounts.list('ws-1')).toEqual(['accounts', 'list', 'ws-1']);
  });

  it('should have emails keys with thread', () => {
    expect(queryKeys.emails.thread('contact-1')).toEqual(['emails', 'thread', 'contact-1']);
  });
});
