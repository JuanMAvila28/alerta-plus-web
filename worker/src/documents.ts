// Per-document sync with versions and "last writer wins" (plan section 7.6).
import type { Env } from './env';
import { HttpError, json, readJson } from './http';
import { DOCUMENT_SCHEMAS, isDocumentType, MAX_DOCUMENT_BYTES, putDocumentBody } from './schemas';

interface DocumentRow {
  type: string;
  content: string;
  version: number;
  updated_at: number;
}

const toJson = (row: DocumentRow) => ({
  type: row.type,
  content: JSON.parse(row.content) as unknown,
  updatedAt: row.updated_at,
  version: row.version,
});

export async function listDocuments(env: Env, userId: string): Promise<DocumentRow[]> {
  const { results } = await env.DB.prepare('SELECT type, content, version, updated_at FROM documents WHERE user_id = ?')
    .bind(userId)
    .all<DocumentRow>();
  return results;
}

/** GET /api/documents */
export async function getDocuments(env: Env, userId: string): Promise<Response> {
  return json((await listDocuments(env, userId)).map(toJson));
}

/** PUT /api/documents/:type */
export async function putDocument(request: Request, env: Env, userId: string, type: string): Promise<Response> {
  if (!isDocumentType(type)) throw new HttpError(404, 'unknown_type', 'Unknown document type.');

  const body = putDocumentBody.safeParse(await readJson(request));
  if (!body.success) throw new HttpError(400, 'invalid_body', body.error.message);
  const content = DOCUMENT_SCHEMAS[type].safeParse(body.data.content);
  if (!content.success) throw new HttpError(400, 'invalid_content', content.error.message);
  const serialized = JSON.stringify(content.data);
  if (new TextEncoder().encode(serialized).length > MAX_DOCUMENT_BYTES) {
    throw new HttpError(413, 'too_large', 'Document larger than 32 KB.');
  }

  const { baseVersion, updatedAt } = body.data;
  // Insert when new, update only when the client edited the current version.
  const saved =
    baseVersion === 0
      ? await env.DB.prepare(
          `INSERT INTO documents (user_id, type, content, version, updated_at) VALUES (?, ?, ?, 1, ?)
           ON CONFLICT (user_id, type) DO NOTHING RETURNING version`,
        )
          .bind(userId, type, serialized, updatedAt)
          .first<{ version: number }>()
      : await env.DB.prepare(
          `UPDATE documents SET content = ?, updated_at = ?, version = version + 1
           WHERE user_id = ? AND type = ? AND version = ? RETURNING version`,
        )
          .bind(serialized, updatedAt, userId, type, baseVersion)
          .first<{ version: number }>();
  if (saved) return json({ version: saved.version });

  const current = await env.DB.prepare(
    'SELECT type, content, version, updated_at FROM documents WHERE user_id = ? AND type = ?',
  )
    .bind(userId, type)
    .first<DocumentRow>();
  if (!current) throw new HttpError(409, 'conflict', 'The document does not exist; send baseVersion 0.');
  const { content: serverContent, updatedAt: serverUpdatedAt, version } = toJson(current);
  return json({ error: 'conflict', content: serverContent, updatedAt: serverUpdatedAt, version }, 409);
}
