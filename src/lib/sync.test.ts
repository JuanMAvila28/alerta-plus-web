import { beforeEach, describe, expect, it } from 'vitest';
import type { DocumentType, UserDocument } from '../types';
import { AlertaDatabase } from './db';
import { dexieStore, type LocalStore } from './localStore';
import { syncOnce, type ServerDocument, type SyncServer } from './sync';

/** In-memory server with the same version rules as PUT /api/documents/:type. */
function fakeServer() {
  const documents = new Map<DocumentType, ServerDocument>();
  const server: SyncServer = {
    list: async () => [...documents.values()].map((document) => structuredClone(document)),
    async put({ type, content, updatedAt, version: baseVersion }) {
      const current = documents.get(type);
      if ((current?.version ?? 0) !== baseVersion) return { ok: false, server: structuredClone(current!) };
      const version = baseVersion + 1;
      documents.set(type, { type, content: structuredClone(content), updatedAt, version });
      return { ok: true, version };
    },
  };
  return { server, documents };
}

let counter = 0;
async function device(): Promise<LocalStore> {
  const database = new AlertaDatabase(`device-${++counter}`);
  await database.open();
  return dexieStore(database);
}

/** Like saveDocument(), on a given store. */
async function edit(store: LocalStore, type: DocumentType, content: UserDocument['content'], updatedAt: number) {
  const existing = await store.getDocument(type);
  await store.putDocument({ type, content, updatedAt, version: existing?.version ?? 0, pending: true });
}

describe('sync between two devices', () => {
  let server: ReturnType<typeof fakeServer>;
  let phone: LocalStore;
  let laptop: LocalStore;

  beforeEach(async () => {
    server = fakeServer();
    phone = await device();
    laptop = await device();
  });

  it('a change on one device shows up on the other', async () => {
    await edit(phone, 'kit', { checked: ['kit_1'] }, 100);
    await syncOnce(phone, server.server);
    expect(await phone.getDocument('kit')).toMatchObject({ version: 1, pending: false });

    await syncOnce(laptop, server.server);
    expect(await laptop.getDocument('kit')).toMatchObject({ content: { checked: ['kit_1'] }, version: 1, pending: false });
  });

  it('both edit the same document: the latest edit wins on both', async () => {
    await edit(phone, 'kit', { checked: ['kit_1'] }, 100);
    await syncOnce(phone, server.server);
    await syncOnce(laptop, server.server);

    await edit(phone, 'kit', { checked: ['kit_1', 'kit_2'] }, 200);
    await edit(laptop, 'kit', { checked: [] }, 300); // later
    await syncOnce(phone, server.server);
    await syncOnce(laptop, server.server); // 409 → local is newer → retries on top
    await syncOnce(phone, server.server);

    for (const store of [phone, laptop]) {
      expect(await store.getDocument('kit')).toMatchObject({ content: { checked: [] }, version: 3, pending: false });
    }
  });

  it('the older edit loses and takes the server copy', async () => {
    await edit(phone, 'checklist', { checked: ['checklist_1'] }, 100);
    await syncOnce(phone, server.server);
    await syncOnce(laptop, server.server);

    await edit(laptop, 'checklist', { checked: [] }, 150); // older, synced later
    await edit(phone, 'checklist', { checked: ['checklist_1', 'checklist_2'] }, 200);
    await syncOnce(phone, server.server);
    await syncOnce(laptop, server.server);

    expect(await laptop.getDocument('checklist')).toMatchObject({
      content: { checked: ['checklist_1', 'checklist_2'] },
      version: 2,
      pending: false,
    });
  });

  it('offline edits stay pending and upload when the connection is back', async () => {
    const offline: SyncServer = {
      list: () => Promise.reject(new Error('offline')),
      put: () => Promise.reject(new Error('offline')),
    };
    await edit(phone, 'firstAidKit', { checked: ['firstAidKit_3'] }, 100);
    await expect(syncOnce(phone, offline)).rejects.toThrow();
    expect(await phone.getDocument('firstAidKit')).toMatchObject({ pending: true, content: { checked: ['firstAidKit_3'] } });

    await syncOnce(phone, server.server);
    expect(server.documents.get('firstAidKit')?.content).toEqual({ checked: ['firstAidKit_3'] });
  });

  it('first login on a device: the server copy replaces the local one', async () => {
    await edit(phone, 'contacts', { people: [{ name: 'Ana', relationship: 'Mamá', phone: '300' }] }, 100);
    await syncOnce(phone, server.server);
    await edit(laptop, 'contacts', { people: [] }, 500);

    const replaced: string[] = [];
    await syncOnce(laptop, server.server, { preferServer: true, onReplaced: (d) => replaced.push(d.type) });
    expect(await laptop.getDocument('contacts')).toMatchObject({ content: { people: [{ name: 'Ana' }] }, pending: false });
    expect(replaced).toEqual(['contacts']);
  });

  it('an edit made during the upload is not lost', async () => {
    await edit(phone, 'kit', { checked: ['kit_1'] }, 100);
    const slow: SyncServer = {
      list: server.server.list,
      async put(document) {
        const result = await server.server.put(document);
        await edit(phone, 'kit', { checked: ['kit_1', 'kit_9'] }, 200); // the user taps again
        return result;
      },
    };
    await syncOnce(phone, slow);
    expect(await phone.getDocument('kit')).toMatchObject({ content: { checked: ['kit_1', 'kit_9'] }, version: 1, pending: true });

    await syncOnce(phone, server.server);
    expect(server.documents.get('kit')).toMatchObject({ content: { checked: ['kit_1', 'kit_9'] }, version: 2 });
  });
});
