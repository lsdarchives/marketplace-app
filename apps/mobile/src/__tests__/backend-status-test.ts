import { checkBackend } from '@/lib/backend-status';

/** Minimal stand-in for the `from().select()` chain used by checkBackend. */
function fakeClient(select: () => Promise<{ error: unknown }>) {
  return { from: () => ({ select }) } as unknown as Parameters<typeof checkBackend>[0];
}

describe('checkBackend', () => {
  it('reports unconfigured when there is no client', async () => {
    await expect(checkBackend(null)).resolves.toBe('unconfigured');
  });

  it('reports online when the query succeeds', async () => {
    await expect(checkBackend(fakeClient(async () => ({ error: null })))).resolves.toBe('online');
  });

  it('reports offline when the API returns an error', async () => {
    const client = fakeClient(async () => ({ error: { message: 'relation does not exist' } }));
    await expect(checkBackend(client)).resolves.toBe('offline');
  });

  it('reports offline when the request throws (e.g. network down)', async () => {
    const client = fakeClient(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(checkBackend(client)).resolves.toBe('offline');
  });
});
