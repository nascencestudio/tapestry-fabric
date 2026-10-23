/**
 * POST `/_fabric/modes` (admins): the Display Modes page's forms (add, rename, delete), as form posts that
 * redirect back to the page with `saved` or an error code (like Tapestry's Template Management).
 * Deleting a mode in use needs its name typed (`confirm`).
 */
import { hasPermission } from '@nascencestudio/tapestry';
import {
	addMode,
	deleteMode,
	isBuiltInMode,
	loadModes,
	loadModeUsage,
	renameMode,
} from '@nascencestudio/tapestry/modes';
import { getViewer } from '@nascencestudio/tapestry/page';
import type { APIRoute } from 'astro';
import type { ModeErrorCode } from '../modes-errors.js';

export const prerender = false;

const MAX_BODY = 8 * 1024;

const deny = (status: number, message: string) =>
	new Response(message, { status, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });

async function act(form: URLSearchParams): Promise<ModeErrorCode | null> {
	const key = form.get('key') ?? '';
	switch (form.get('action')) {
		case 'add': {
			const result = await addMode(form.get('name'));
			return 'error' in result ? result.error : null;
		}
		case 'rename': {
			const result = await renameMode(key, form.get('name'));
			return 'error' in result ? result.error : null;
		}
		case 'delete': {
			if (isBuiltInMode(key)) return 'built-in';
			const mode = (await loadModes()).find((m) => m.key === key);
			if (!mode) return 'not-found';
			const used = (await loadModeUsage()).get(key)?.components ?? 0;
			if (used > 0 && form.get('confirm') !== mode.name) return 'confirm-name';
			const result = await deleteMode(key);
			return 'error' in result ? result.error : null;
		}
		default:
			return 'failed';
	}
}

export const POST: APIRoute = async (context) => {
	if (context.request.headers.get('origin') !== context.url.origin) return deny(403, 'Cross-origin request refused');
	const viewer = await getViewer(context);
	if (!viewer.isLoggedIn || !hasPermission(viewer.permissionLevel, 'admin')) return deny(403, 'Admins only');
	if (Number(context.request.headers.get('content-length') ?? 0) > MAX_BODY) return deny(413, 'Too large');
	const body = await context.request.text();
	if (body.length > MAX_BODY) return deny(413, 'Too large');
	const form = new URLSearchParams(body);

	let problem: ModeErrorCode | null;
	try {
		problem = await act(form);
	} catch (error) {
		console.error('[tapestry-fabric] display mode change failed', error);
		problem = 'failed';
	}
	// Back to the page the form was on (same-origin addresses only), with the outcome.
	const back = new URL(form.get('return') || '/', context.url);
	const target = new URL(back.origin === context.url.origin ? back.pathname + back.search : '/', context.url);
	target.searchParams.delete('saved');
	target.searchParams.delete('error');
	if (problem) target.searchParams.set('error', problem);
	else target.searchParams.set('saved', '1');
	return new Response(null, {
		status: 303,
		headers: { Location: target.pathname + target.search, 'Cache-Control': 'no-store' },
	});
};
