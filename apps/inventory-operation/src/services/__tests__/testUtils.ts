import { vi } from 'vitest';
import { supabase } from '../../lib/supabase';

/**
 * Creates a fully chainable mock for Supabase queries.
 *
 * Key insight: when services do `const res = await query`, they're awaiting
 * a chainable object. The terminal `.then()` must resolve to the correct result.
 *
 * Chain patterns used by services:
 *   select().order()                          → orderResult
 *   select().eq().single()                    → singleResult
 *   select().gte().lte()                      → gteResult (for gte), lteResult (for lte)
 *   select().gte().lte().in().neq().order()   → orderResult (terminal)
 *   insert([...]).select().single()           → singleResult
 *   update({...}).eq('id', id).select().single() → singleResult
 *   delete().eq('id', id)                     → eqResult
 */
export function mockSupabaseChain(config: {
  selectResult?: any;
  orderResult?: any;
  eqResult?: any;
  orResult?: any;
  singleResult?: any;
  insertResult?: any;
  updateResult?: any;
  deleteResult?: any;
  limitResult?: any;
  gteResult?: any;
  lteResult?: any;
  neqResult?: any;
  inResult?: any;
}) {
  const defaultResolved = { data: [], error: null };

  // Helper: create a thenable object that resolves to a given value
  function thenable(value: any) {
    return {
      then: (onfulfilled: any) => Promise.resolve(onfulfilled(value)),
      catch: (_onrejected: any) => Promise.resolve(value),
      finally: (onfinally: any) => Promise.resolve(value).finally(onfinally),
    };
  }

  // Pre-create all terminal thenables
  const selectThenable = thenable(config.selectResult ?? defaultResolved);
  const orderThenable = thenable(config.orderResult ?? defaultResolved);
  const eqThenable = thenable(config.eqResult ?? defaultResolved);
  const orThenable = thenable(config.orResult ?? defaultResolved);
  const singleThenable = thenable(config.singleResult ?? defaultResolved);
  const limitThenable = thenable(config.limitResult ?? defaultResolved);
  const gteThenable = thenable(config.gteResult ?? defaultResolved);
  const lteThenable = thenable(config.lteResult ?? defaultResolved);
  const neqThenable = thenable(config.neqResult ?? defaultResolved);
  const inThenable = thenable(config.inResult ?? defaultResolved);

  // Pre-create all chain objects to avoid infinite recursion
  // Each chain method returns a pre-created chain object, not a new one
  const selectChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: selectThenable.then, catch: selectThenable.catch, finally: selectThenable.finally,
  };
  const orderChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: orderThenable.then, catch: orderThenable.catch, finally: orderThenable.finally,
  };
  const eqChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: eqThenable.then, catch: eqThenable.catch, finally: eqThenable.finally,
  };
  const gteChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: gteThenable.then, catch: gteThenable.catch, finally: gteThenable.finally,
  };
  const lteChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: lteThenable.then, catch: lteThenable.catch, finally: lteThenable.finally,
  };
  const neqChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: neqThenable.then, catch: neqThenable.catch, finally: neqThenable.finally,
  };
  const inChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: inThenable.then, catch: inThenable.catch, finally: inThenable.finally,
  };
  const orChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: orThenable.then, catch: orThenable.catch, finally: orThenable.finally,
  };

  // Now wire up the circular references
  selectChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  selectChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  selectChainObj.or = vi.fn().mockReturnValue(orChainObj);
  selectChainObj.single = vi.fn().mockReturnValue(singleThenable);
  selectChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  selectChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  selectChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  selectChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  selectChainObj.in = vi.fn().mockReturnValue(inChainObj);

  orderChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  orderChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  orderChainObj.or = vi.fn().mockReturnValue(orChainObj);
  orderChainObj.single = vi.fn().mockReturnValue(singleThenable);
  orderChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  orderChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  orderChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  orderChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  orderChainObj.in = vi.fn().mockReturnValue(inChainObj);

  eqChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  eqChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  eqChainObj.or = vi.fn().mockReturnValue(orChainObj);
  eqChainObj.single = vi.fn().mockReturnValue(singleThenable);
  eqChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  eqChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  eqChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  eqChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  eqChainObj.in = vi.fn().mockReturnValue(inChainObj);

  gteChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  gteChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  gteChainObj.or = vi.fn().mockReturnValue(orChainObj);
  gteChainObj.single = vi.fn().mockReturnValue(singleThenable);
  gteChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  gteChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  gteChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  gteChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  gteChainObj.in = vi.fn().mockReturnValue(inChainObj);

  lteChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  lteChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  lteChainObj.or = vi.fn().mockReturnValue(orChainObj);
  lteChainObj.single = vi.fn().mockReturnValue(singleThenable);
  lteChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  lteChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  lteChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  lteChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  lteChainObj.in = vi.fn().mockReturnValue(inChainObj);

  neqChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  neqChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  neqChainObj.or = vi.fn().mockReturnValue(orChainObj);
  neqChainObj.single = vi.fn().mockReturnValue(singleThenable);
  neqChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  neqChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  neqChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  neqChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  neqChainObj.in = vi.fn().mockReturnValue(inChainObj);

  inChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  inChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  inChainObj.or = vi.fn().mockReturnValue(orChainObj);
  inChainObj.single = vi.fn().mockReturnValue(singleThenable);
  inChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  inChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  inChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  inChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  inChainObj.in = vi.fn().mockReturnValue(inChainObj);

  orChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  orChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  orChainObj.or = vi.fn().mockReturnValue(orChainObj);
  orChainObj.single = vi.fn().mockReturnValue(singleThenable);
  orChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  orChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  orChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  orChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  orChainObj.in = vi.fn().mockReturnValue(inChainObj);

  // The select chain: select() returns selectChainObj (resolves to selectResult)
  // order() returns orderChainObj (resolves to orderResult)
  const selectChain = selectChainObj;

  // Single chain: used by insert().select().single() and update().eq().select().single()
  const singleChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: singleThenable.then, catch: singleThenable.catch, finally: singleThenable.finally,
  };
  singleChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  singleChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  singleChainObj.or = vi.fn().mockReturnValue(orChainObj);
  singleChainObj.single = vi.fn().mockReturnValue(singleThenable);
  singleChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  singleChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  singleChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  singleChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  singleChainObj.in = vi.fn().mockReturnValue(inChainObj);

  // Select chain (no .single()): used by insert().select() and update().eq().select()
  const selectOnlyChainObj = {
    order: null as any, eq: null as any, or: null as any, single: null as any,
    limit: null as any, gte: null as any, lte: null as any, neq: null as any, in: null as any,
    then: selectThenable.then, catch: selectThenable.catch, finally: selectThenable.finally,
  };
  selectOnlyChainObj.order = vi.fn().mockReturnValue(orderChainObj);
  selectOnlyChainObj.eq = vi.fn().mockReturnValue(eqChainObj);
  selectOnlyChainObj.or = vi.fn().mockReturnValue(orChainObj);
  selectOnlyChainObj.single = vi.fn().mockReturnValue(singleThenable);
  selectOnlyChainObj.limit = vi.fn().mockReturnValue(limitThenable);
  selectOnlyChainObj.gte = vi.fn().mockReturnValue(gteChainObj);
  selectOnlyChainObj.lte = vi.fn().mockReturnValue(lteChainObj);
  selectOnlyChainObj.neq = vi.fn().mockReturnValue(neqChainObj);
  selectOnlyChainObj.in = vi.fn().mockReturnValue(inChainObj);

  // Insert chain: insert() returns { select: () => chain that resolves to selectResult (no .single()) }
  // When .single() is chained, it returns singleThenable
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue(selectOnlyChainObj),
    then: selectThenable.then,
    catch: selectThenable.catch,
    finally: selectThenable.finally,
  });

  // Update chain: update() returns { eq: () => { select: () => chain(selectOnlyChainObj) } }
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(selectOnlyChainObj),
      then: eqThenable.then,
      catch: eqThenable.catch,
      finally: eqThenable.finally,
    }),
    then: eqThenable.then,
    catch: eqThenable.catch,
    finally: eqThenable.finally,
  });

  // Delete chain: delete() returns { eq: () => eqThenable }
  const deleteMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue(eqThenable),
    then: eqThenable.then,
    catch: eqThenable.catch,
    finally: eqThenable.finally,
  });

  // Apply the mock to supabase.from using vi.spyOn
  vi.spyOn(supabase, 'from').mockImplementation((_name: string) => ({
    select: vi.fn().mockReturnValue(selectChain),
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  } as any));

  return {
    selectMock: (supabase.from as any).mock.results[0]?.value?.select,
    orderMock: selectChain.order,
    eqMock: selectChain.eq,
    orMock: selectChain.or,
    singleMock: selectChain.single,
    insertMock,
    updateMock,
    deleteMock,
    limitMock: selectChain.limit,
    gteMock: selectChain.gte,
    lteMock: selectChain.lte,
    neqMock: selectChain.neq,
    inMock: selectChain.in,
  };
}

/**
 * Creates a mock for getCurrentUserId that can be used in vi.mock.
 * Usage in test file:
 *   const { mockGetCurrentUserId } = await import('./testUtils');
 *   vi.mock('../../lib/supabase', async (importOriginal) => {
 *     const mod = await importOriginal();
 *     return { ...mod, getCurrentUserId: () => Promise.resolve('test-user-id') };
 *   });
 */
export const MOCK_USER_ID = 'test-user-id';
