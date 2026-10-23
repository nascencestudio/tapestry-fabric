/**
 * @nascencestudio/tapestry-fabric: content types by proxy for Tapestry sites on StudioCMS (ADR 0001).
 * - Dashboard → **Display Modes** (after Template Management): Full and Teaser built in, up to 16 in all.
 *   Template components say which modes they're shown in, and content areas get a tab per mode on pages
 *   (Tapestry ADR 0046, which this plugin turns on).
 * - The **Page list** component (`fabricComponents()` from `/components`): pages by category, tag and
 *   template, each shown in a display mode, linked, with a plain-text excerpt for empty teasers.
 * Requires Tapestry (`@nascencestudio/tapestry` 0.7 or later), listed before this plugin, and Tapestry's
 * shipped StudioCMS and SDK patches (tags and categories).
 */
import { fileURLToPath } from 'node:url';
import { definePlugin } from 'studiocms/plugins';
import { MODES_ROUTE, OPTIONS_ROUTE } from './routes.js';

export type { ListSettings, SortOrder } from './list.js';
export { categoryOptions, excerpt, LIMITS, matches, PAGE_LIST_TYPE, parseSettings, sortPages } from './list.js';
export { MODES_ROUTE, OPTIONS_ROUTE, optionsUrl } from './routes.js';

const PACKAGE_NAME = '@nascencestudio/tapestry-fabric';
const TAPESTRY = '@nascencestudio/tapestry';

export type TapestryFabricPlugin = ReturnType<typeof definePlugin>;

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * The Tapestry Fabric plugin.
 *
 * @example
 * ```js
 * // studiocms.config.mjs
 * import tapestry from '@nascencestudio/tapestry';
 * import tapestryFabric from '@nascencestudio/tapestry-fabric';
 * import { fabricComponents } from '@nascencestudio/tapestry-fabric/components';
 * export default defineStudioCMSConfig({
 *   plugins: [tapestry({ components: [...components, ...fabricComponents()] }), tapestryFabric()],
 * });
 * ```
 */
export function tapestryFabric(): TapestryFabricPlugin {
	return definePlugin({
		identifier: PACKAGE_NAME,
		name: 'Tapestry Fabric',
		requires: [TAPESTRY],
		hooks: {
			'studiocms:astro-config': ({ addIntegrations }) => {
				addIntegrations({
					name: PACKAGE_NAME,
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {
							injectRoute({
								pattern: OPTIONS_ROUTE,
								entrypoint: resolve('./runtime/options-endpoint.js'),
								prerender: false,
							});
							injectRoute({
								pattern: MODES_ROUTE,
								entrypoint: resolve('./runtime/modes-endpoint.js'),
								prerender: false,
							});
						},
					},
				});
			},
			'studiocms:dashboard': ({ setDashboard }) => {
				setDashboard({
					translations: { en: {} },
					// In the Dashboard section after Tapestry's Template Management (plugins are listed in config
					// order). StudioCMS lists only editor-level pages there: editors look, admins change.
					dashboardPages: {
						user: [
							{
								title: { en: 'Display Modes' },
								description: 'How pages are shown: Full, Teaser and your own.',
								route: 'display-modes',
								icon: 'heroicons:rectangle-stack',
								sidebar: 'single',
								requiredPermissions: 'editor',
								pageBodyComponent: resolve('./runtime/DisplayModes.astro'),
							},
						],
					},
				});
			},
		},
	});
}

export default tapestryFabric;
