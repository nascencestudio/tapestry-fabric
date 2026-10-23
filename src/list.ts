/**
 * The Page list's rules (ADR 0001), pure: its settings, which pages match, their order, the plain-text
 * excerpt for empty teasers, and the guard that keeps lists from nesting.
 */
import type { TapestryDocument, TapestryNode } from '@nascencestudio/tapestry';

/** The component's type in Tapestry's library. */
export const PAGE_LIST_TYPE = 'fabric-page-list';

export const LIMITS = {
	/** Pages one list shows at most. */
	maxCount: 50,
	/** Longest excerpt, in characters. */
	maxTrim: 2000,
} as const;

export type SortOrder = 'newest' | 'oldest' | 'title';
export const SORT_ORDERS: ReadonlyArray<{ value: SortOrder; label: string }> = [
	{ value: 'newest', label: 'Newest first' },
	{ value: 'oldest', label: 'Oldest first' },
	{ value: 'title', label: 'Title A–Z' },
];

export interface ListSettings {
	categories: number[];
	tags: number[];
	template: string | null;
	mode: string;
	count: number;
	sort: SortOrder;
	link: boolean;
	/** Characters of Full text for an empty teaser; 0: off. */
	trim: number;
}

const ids = (value: unknown): number[] =>
	(Array.isArray(value) ? value : [])
		.map((v) => (typeof v === 'string' && /^\d{1,15}$/.test(v) ? Number(v) : Number.NaN))
		.filter((n) => Number.isSafeInteger(n));

const bounded = (value: unknown, min: number, max: number, fallback: number) =>
	typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;

/** The component's props (already validated by Tapestry) as settings, with defaults. */
export function parseSettings(props: Record<string, unknown>): ListSettings {
	const sort = SORT_ORDERS.some((o) => o.value === props.sort) ? (props.sort as SortOrder) : 'newest';
	return {
		categories: ids(props.categories),
		tags: ids(props.tags),
		template: typeof props.template === 'string' && /^tt_[a-z0-9]{16}$/.test(props.template) ? props.template : null,
		mode: typeof props.mode === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(props.mode) ? props.mode : 'teaser',
		count: bounded(props.count, 1, LIMITS.maxCount, 5),
		sort,
		link: props.link !== false,
		trim: bounded(props.trim, 0, LIMITS.maxTrim, 200),
	};
}

export interface Term {
	id: number;
	name: string;
	parent: number | null;
}

/** The picked categories and every category under them (a subcategory counts as its parent). */
export function withSubcategories(picked: readonly number[], all: readonly Term[]): Set<number> {
	const result = new Set(picked);
	let grew = true;
	// Bounded by the number of categories (a parent loop in the data can't run forever).
	for (let round = 0; grew && round <= all.length; round++) {
		grew = false;
		for (const term of all) {
			if (term.parent !== null && result.has(term.parent) && !result.has(term.id)) {
				result.add(term.id);
				grew = true;
			}
		}
	}
	return result;
}

export interface Candidate {
	id: string;
	title: string;
	publishedAt: string | null;
	categories: ReadonlyArray<{ id: number }>;
	tags: ReadonlyArray<{ id: number }>;
	template: string | null;
	lang: string | null;
	/** Its language versions' page ids (itself included). */
	group: readonly string[];
}

export interface MatchContext {
	/** The picked categories with their subcategories (`withSubcategories`). */
	categories: ReadonlySet<number>;
	/** The page the list is on: it and its translations are left out. */
	hostId: string | null;
	/** The list page's language (translated sites); null: any. */
	lang: string | null;
}

/** Whether a page is in the list: any picked category AND any picked tag AND the template (empty: any). */
export function matches(page: Candidate, settings: ListSettings, context: MatchContext): boolean {
	if (context.hostId && (page.id === context.hostId || page.group.includes(context.hostId))) return false;
	if (context.lang !== null && page.lang !== null && page.lang !== context.lang) return false;
	if (settings.template && page.template !== settings.template) return false;
	if (settings.categories.length > 0 && !page.categories.some((c) => context.categories.has(c.id))) return false;
	if (settings.tags.length > 0 && !page.tags.some((t) => settings.tags.includes(t.id))) return false;
	return true;
}

/** Pages in the list's order (stable; pages without a date go last when sorting by date). */
export function sortPages<T extends Pick<Candidate, 'title' | 'publishedAt'>>(
	pages: readonly T[],
	sort: SortOrder,
): T[] {
	const time = (p: T) => (p.publishedAt ? Date.parse(p.publishedAt) : Number.NaN);
	return [...pages].sort((a, b) => {
		if (sort === 'title') return a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
		const ta = time(a);
		const tb = time(b);
		if (Number.isNaN(ta) || Number.isNaN(tb)) return Number.isNaN(ta) ? (Number.isNaN(tb) ? 0 : 1) : -1;
		return sort === 'newest' ? tb - ta : ta - tb;
	});
}

/**
 * Plain text cut to at most `limit` characters at the last word boundary, with "…" when cut. Plain text
 * only (like Drupal summaries): nothing to break, styling is the site's.
 */
export function excerpt(text: string, limit: number): string {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (limit <= 0) return '';
	if (clean.length <= limit) return clean;
	const cut = clean.slice(0, limit);
	const space = cut.lastIndexOf(' ');
	// A single very long word is cut where the limit falls.
	const words = (space > limit * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.!?\-–—]+$/u, '');
	return `${words}…`;
}

/**
 * A listed page's document without Page lists: lists inside listed pages don't render (no loops, A lists B
 * lists A, and bounded work).
 */
export function withoutLists(doc: TapestryDocument): TapestryDocument {
	const strip = (nodes: readonly TapestryNode[]): TapestryNode[] =>
		nodes.flatMap((node) =>
			node.type === PAGE_LIST_TYPE ? [] : [node.children ? { ...node, children: strip(node.children) } : node],
		);
	return { ...doc, root: strip(doc.root) };
}

/** Category choices for the picker: `News › Local`, in tree order (parents before children). */
export function categoryOptions(all: readonly Term[]): Array<{ value: string; label: string }> {
	const byParent = new Map<number | null, Term[]>();
	const known = new Set(all.map((t) => t.id));
	for (const term of all) {
		const parent = term.parent !== null && known.has(term.parent) ? term.parent : null;
		byParent.set(parent, [...(byParent.get(parent) ?? []), term]);
	}
	const out: Array<{ value: string; label: string }> = [];
	const seen = new Set<number>();
	const walk = (parent: number | null, path: string[]) => {
		const children = [...(byParent.get(parent) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
		for (const term of children) {
			if (seen.has(term.id)) continue;
			seen.add(term.id);
			const label = [...path, term.name || `#${term.id}`];
			out.push({ value: String(term.id), label: label.join(' › ') });
			walk(term.id, label);
		}
	};
	walk(null, []);
	// Categories in a parent loop (bad data) still appear.
	for (const term of all)
		if (!seen.has(term.id)) out.push({ value: String(term.id), label: term.name || `#${term.id}` });
	return out;
}

/** CSS-safe class suffix for a mode key (already `[a-z0-9-]`). */
export const modeClass = (mode: string) => mode.replace(/[^a-z0-9-]/g, '');
