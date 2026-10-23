/**
 * Why a Display Modes action failed: codes in the redirect (never free text, so a crafted link can't put
 * words on the page), messages on the page.
 */
export const MODE_ERRORS = {
	off: 'Display modes are off on this site.',
	'name-required': 'Give it a name.',
	'name-taken': 'A display mode with that name already exists.',
	'too-many': 'A site can have at most 16 display modes.',
	'not-found': 'That display mode no longer exists.',
	'built-in': 'Full and Teaser can’t be renamed or deleted.',
	'confirm-name': 'Type the display mode’s name to delete it.',
	failed: 'Saving failed. Try again.',
} as const;

export type ModeErrorCode = keyof typeof MODE_ERRORS;

export const isModeError = (value: string | null): value is ModeErrorCode =>
	value !== null && Object.hasOwn(MODE_ERRORS, value);
