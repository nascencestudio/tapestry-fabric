/// <reference types="studiocms/v/types" />
/**
 * The site's categories and tags, read from StudioCMS's tables through the SDK's database client. Server only.
 */
import { SDKCoreJs } from 'studiocms:sdk';
import type { Term } from '../list.js';

const toTerm = (row: { id: unknown; name: unknown; parent?: unknown }): Term | null => {
	const id = Number(row.id);
	if (!Number.isSafeInteger(id)) return null;
	const parent = row.parent === null || row.parent === undefined ? null : Number(row.parent);
	return { id, name: String(row.name ?? ''), parent: Number.isSafeInteger(parent) ? parent : null };
};

export async function loadCategories(): Promise<Term[]> {
	const rows = await SDKCoreJs.dbService.db
		.selectFrom('StudioCMSPageDataCategories')
		.select(['id', 'name', 'parent'])
		.execute();
	return rows.map(toTerm).filter((t): t is Term => t !== null);
}

export async function loadTags(): Promise<Term[]> {
	const rows = await SDKCoreJs.dbService.db.selectFrom('StudioCMSPageDataTags').select(['id', 'name']).execute();
	return rows
		.map((row) => toTerm({ ...row, parent: null }))
		.filter((t): t is Term => t !== null)
		.sort((a, b) => a.name.localeCompare(b.name));
}
