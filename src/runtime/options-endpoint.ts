/**
 * `/_fabric/options/{categories|tags|templates|modes}` (editors): choices for the Page list's settings
 * (Tapestry ADR 0042's `optionsUrl`): `{ options: [{ value, label }] }`.
 */
import { listTemplateChoices, loadModes } from '@nascencestudio/tapestry/modes';
import type { APIRoute } from 'astro';
import { categoryOptions } from '../list.js';
import { OPTION_KINDS, type OptionKind } from '../routes.js';
import { json, roleOf } from './http.js';
import { loadCategories, loadTags } from './terms.js';

export const prerender = false;

const isKind = (value: unknown): value is OptionKind => OPTION_KINDS.includes(value as OptionKind);

export const GET: APIRoute = async (context) => {
	if (!(await roleOf(context)).editor) return json({ error: 'Editors only' }, 403);
	const kind = context.params.kind;
	if (!isKind(kind)) return json({ error: 'Not found' }, 404);
	try {
		switch (kind) {
			case 'categories':
				return json({ options: categoryOptions(await loadCategories()) });
			case 'tags':
				return json({ options: (await loadTags()).map((t) => ({ value: String(t.id), label: t.name || `#${t.id}` })) });
			case 'templates':
				return json({ options: await listTemplateChoices() });
			case 'modes':
				return json({ options: (await loadModes()).map((m) => ({ value: m.key, label: m.name })) });
		}
	} catch (error) {
		console.error(`[tapestry-fabric] reading ${kind} failed`, error);
		return json({ error: `Reading ${kind} failed` }, 500);
	}
};
