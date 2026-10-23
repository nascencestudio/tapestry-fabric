/** The plugin's routes (shared by the server and the component). */
/** Editors: choices for the Page list's settings (`/_fabric/options/categories|tags|templates|modes`). */
export const OPTIONS_ROUTE = '/_fabric/options/[kind]';
export const optionsUrl = (kind: OptionKind) => `/_fabric/options/${kind}`;
export const OPTION_KINDS = ['categories', 'tags', 'templates', 'modes'] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];
/** Admins: add, rename and delete display modes (the Display Modes page's forms). */
export const MODES_ROUTE = '/_fabric/modes';
