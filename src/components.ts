/**
 * `@nascencestudio/tapestry-fabric/components`: the Page list for Tapestry's component library (ADR 0001):
 * pages by category, tag and template, each shown in a display mode (Tapestry ADR 0046).
 *
 * @example
 * ```js
 * // studiocms.config.mjs
 * import { fabricComponents } from '@nascencestudio/tapestry-fabric/components';
 * tapestry({ components: [...components, ...fabricComponents()] })
 * ```
 */
import { type ComponentDefinition, defineComponent } from '@nascencestudio/tapestry';
import { LIMITS, PAGE_LIST_TYPE, SORT_ORDERS } from './list.js';
import { optionsUrl } from './routes.js';

export { PAGE_LIST_TYPE };

export interface FabricComponentsOptions {
	/** The library category. Default "Lists". */
	category?: string;
}

const file = (path: string) => new URL(path, import.meta.url).href;

export function fabricComponents(options: FabricComponentsOptions = {}): ComponentDefinition[] {
	return [
		defineComponent({
			type: PAGE_LIST_TYPE,
			label: 'Page list',
			description: 'Other pages by category, tag and template, shown in a display mode (e.g. teasers).',
			category: options.category ?? 'Lists',
			component: file('./runtime/PageList.astro'),
			// Its id names its page parameter (`?<id>=2`), so several lists on one page page on their own.
			withNodeId: true,
			thumbnail: file('./thumbnails/page-list.svg'),
			props: {
				categories: {
					type: 'select',
					label: 'Categories',
					description: 'Pages in any of these (or their subcategories). Empty: any category.',
					multiple: true,
					options: [],
					optionsUrl: optionsUrl('categories'),
				},
				tags: {
					type: 'select',
					label: 'Tags',
					description: 'Pages with any of these tags. Empty: any tags.',
					multiple: true,
					options: [],
					optionsUrl: optionsUrl('tags'),
				},
				template: {
					type: 'select',
					label: 'Template',
					description: 'Only pages using this template. Empty: any.',
					options: [],
					optionsUrl: optionsUrl('templates'),
				},
				mode: {
					type: 'select',
					label: 'Display mode',
					description: 'How each page is shown. Display modes are set in Dashboard → Display Modes.',
					options: [],
					optionsUrl: optionsUrl('modes'),
					default: 'teaser',
				},
				count: {
					type: 'number',
					label: 'Number of pages',
					description: 'With page links: how many per list page.',
					default: 5,
					min: 1,
					max: LIMITS.maxCount,
				},
				sort: {
					type: 'select',
					label: 'Sort by',
					options: SORT_ORDERS.map((o) => ({ value: o.value, label: o.label })),
					default: 'newest',
				},
				link: {
					type: 'boolean',
					label: 'Link each item to its page',
					default: true,
				},
				pager: {
					type: 'boolean',
					label: 'Show page links',
					description: 'Previous and Next when more pages match than the number shown.',
					default: false,
				},
				trim: {
					type: 'number',
					label: 'Empty teasers: trim the Full text to',
					description: 'Characters of plain text, for pages with nothing in this display mode. 0: off.',
					default: 200,
					min: 0,
					max: LIMITS.maxTrim,
				},
			},
		}),
	];
}
