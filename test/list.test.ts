import type { TapestryDocument } from '@nascencestudio/tapestry';
import { describe, expect, it } from 'vitest';
import {
	type Candidate,
	categoryOptions,
	excerpt,
	type ListSettings,
	matches,
	PAGE_LIST_TYPE,
	pageCount,
	pageHref,
	pageNumber,
	parseSettings,
	sortPages,
	withoutLists,
	withSubcategories,
} from '../src/list.js';

const T1 = 'tt_aaaaaaaaaaaaaaaa';
const T2 = 'tt_bbbbbbbbbbbbbbbb';
const page = (id: string, extra: Partial<Candidate> = {}): Candidate => ({
	id,
	title: id,
	publishedAt: null,
	categories: [],
	tags: [],
	template: null,
	lang: null,
	group: [id],
	...extra,
});
const settings = (extra: Partial<ListSettings> = {}): ListSettings => ({ ...parseSettings({}), ...extra });
const context = { categories: new Set<number>(), hostId: null, lang: null };

describe('the Page list’s settings', () => {
	it('have defaults: Teaser, 5 newest, linked, trimmed to 200', () => {
		expect(parseSettings({})).toEqual({
			categories: [],
			tags: [],
			template: null,
			mode: 'teaser',
			count: 5,
			sort: 'newest',
			link: true,
			trim: 200,
			pager: false,
		});
	});

	it('read the stored props, dropping anything unexpected', () => {
		expect(
			parseSettings({
				categories: ['12', 'x', '3', 7],
				tags: ['5'],
				template: T1,
				mode: 'card',
				count: 500,
				sort: 'title',
				link: false,
				trim: -4,
			}),
		).toEqual({
			categories: [12, 3],
			tags: [5],
			template: T1,
			mode: 'card',
			count: 50,
			sort: 'title',
			link: false,
			trim: 0,
			pager: false,
		});
		const odd = parseSettings({ template: '<x>', mode: 'Bad Mode', sort: 'random', count: Number.NaN });
		expect([odd.template, odd.mode, odd.sort, odd.count]).toEqual([null, 'teaser', 'newest', 5]);
	});
});

describe('matching', () => {
	const tree = [
		{ id: 1, name: 'News', parent: null },
		{ id: 2, name: 'Local', parent: 1 },
		{ id: 3, name: 'Street', parent: 2 },
		{ id: 4, name: 'Events', parent: null },
		// A loop in bad data must not hang.
		{ id: 5, name: 'A', parent: 6 },
		{ id: 6, name: 'B', parent: 5 },
	];

	it('counts subcategories as their parent', () => {
		expect([...withSubcategories([1], tree)].sort()).toEqual([1, 2, 3]);
		expect([...withSubcategories([5], tree)].sort()).toEqual([5, 6]);
	});

	it('needs any picked category AND any picked tag AND the template', () => {
		const s = settings({ categories: [1], tags: [10, 11], template: T1 });
		const c = { ...context, categories: withSubcategories([1], tree) };
		expect(matches(page('a', { categories: [{ id: 3 }], tags: [{ id: 11 }], template: T1 }), s, c)).toBe(true);
		expect(matches(page('b', { categories: [{ id: 4 }], tags: [{ id: 11 }], template: T1 }), s, c)).toBe(false);
		expect(matches(page('c', { categories: [{ id: 1 }], tags: [], template: T1 }), s, c)).toBe(false);
		expect(matches(page('d', { categories: [{ id: 1 }], tags: [{ id: 10 }], template: T2 }), s, c)).toBe(false);
		// Empty settings filter nothing.
		expect(matches(page('e'), settings(), context)).toBe(true);
	});

	it('never lists the page it’s on, or that page’s translations', () => {
		const c = { ...context, hostId: 'host' };
		expect(matches(page('host'), settings(), c)).toBe(false);
		expect(matches(page('host-fr', { group: ['host', 'host-fr'] }), settings(), c)).toBe(false);
		expect(matches(page('other'), settings(), c)).toBe(true);
	});

	it('keeps to the list page’s language', () => {
		const c = { ...context, lang: 'en' };
		expect(matches(page('a', { lang: 'en' }), settings(), c)).toBe(true);
		expect(matches(page('b', { lang: 'fr' }), settings(), c)).toBe(false);
	});
});

describe('order', () => {
	const pages = [
		page('old', { title: 'Beta', publishedAt: '2026-01-01T00:00:00.000Z' }),
		page('none', { title: 'alpha' }),
		page('new', { title: 'Gamma 10', publishedAt: '2026-06-01T00:00:00.000Z' }),
		page('mid', { title: 'Gamma 9', publishedAt: '2026-03-01T00:00:00.000Z' }),
	];
	it('is newest or oldest first (undated last), or by title', () => {
		expect(sortPages(pages, 'newest').map((p) => p.id)).toEqual(['new', 'mid', 'old', 'none']);
		expect(sortPages(pages, 'oldest').map((p) => p.id)).toEqual(['old', 'mid', 'new', 'none']);
		expect(sortPages(pages, 'title').map((p) => p.id)).toEqual(['none', 'old', 'mid', 'new']);
	});
});

describe('excerpts', () => {
	it('cut plain text at a word boundary with an ellipsis', () => {
		expect(excerpt('The quick brown fox jumps over the lazy dog', 20)).toBe('The quick brown fox…');
		expect(excerpt('Short.', 20)).toBe('Short.');
		expect(excerpt('One, two, three, four', 10)).toBe('One, two…');
		expect(excerpt('Supercalifragilisticexpialidocious', 10)).toBe('Supercalif…');
		expect(excerpt('  spaced \n\n  out  ', 50)).toBe('spaced out');
		expect(excerpt('anything', 0)).toBe('');
	});

	it('stay plain text: markup-looking text is left as text (Astro escapes it)', () => {
		expect(excerpt('<script>alert(1)</script> and more words here', 30)).toBe('<script>alert(1)</script> and…');
	});
});

describe('nested lists', () => {
	it('are removed from a listed page’s document, at any depth', () => {
		const doc: TapestryDocument = {
			version: 1,
			root: [
				{ id: 'a', type: PAGE_LIST_TYPE, props: {} },
				{
					id: 'b',
					type: 'section',
					props: {},
					children: [
						{ id: 'c', type: PAGE_LIST_TYPE, props: {} },
						{ id: 'd', type: 'text', props: {} },
					],
				},
			],
		};
		expect(JSON.stringify(withoutLists(doc).root)).toBe(
			'[{"id":"b","type":"section","props":{},"children":[{"id":"d","type":"text","props":{}}]}]',
		);
	});
});

describe('category choices', () => {
	it('read as paths, parents first', () => {
		expect(
			categoryOptions([
				{ id: 2, name: 'Local', parent: 1 },
				{ id: 1, name: 'News', parent: null },
				{ id: 4, name: 'Events', parent: null },
				{ id: 9, name: 'Orphan', parent: 99 },
			]),
		).toEqual([
			{ value: '4', label: 'Events' },
			{ value: '1', label: 'News' },
			{ value: '2', label: 'News › Local' },
			{ value: '9', label: 'Orphan' },
		]);
	});
});

describe('list pages', () => {
	it('come from the list’s own parameter, page 1 when missing or out of range', () => {
		expect(pageNumber(null, 3)).toBe(1);
		expect(pageNumber('2', 3)).toBe(2);
		expect(pageNumber('4', 3)).toBe(1);
		expect(pageNumber('0', 3)).toBe(1);
		expect(pageNumber('-1', 3)).toBe(1);
		expect(pageNumber('2.5', 3)).toBe(1);
		expect(pageNumber('1e3', 3)).toBe(1);
		expect(pageNumber('9999999', 99999999)).toBe(1);
	});

	it('count at least one page', () => {
		expect([pageCount(0, 5), pageCount(5, 5), pageCount(6, 5), pageCount(11, 5)]).toEqual([1, 1, 2, 3]);
	});

	it('link to the same page with only this list’s parameter changed', () => {
		const url = new URL('https://example.com/news?lang=fr&other-list=3&mine=2');
		expect(pageHref(url, 'mine', 3)).toBe('/news?lang=fr&other-list=3&mine=3');
		expect(pageHref(url, 'mine', 1)).toBe('/news?lang=fr&other-list=3');
		expect(pageHref(new URL('https://example.com/news'), 'mine', 1)).toBe('/news');
	});

	it('are off unless asked for', () => {
		expect(parseSettings({}).pager).toBe(false);
		expect(parseSettings({ pager: true }).pager).toBe(true);
		expect(parseSettings({ pager: 'yes' }).pager).toBe(false);
	});
});
