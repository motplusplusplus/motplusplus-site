/** Constants shared by the /trash server page (its inline pre-paint script)
 *  and the client grid. They live here, NOT in TrashPageShell.tsx: exports
 *  of a 'use client' module reach server code as client-reference stubs,
 *  not values (that bug shipped a broken inline script once). */
export const BATCH = 24;
export const GRID_ID = 'tg-grid';
export const ORDER_STYLE_ID = 'tg-order';
export const GRID_SINGLE_SIZES = '(min-width: 760px) 720px, calc(100vw - 32px)';
export const GRID_DENSE_SIZES = '(min-width: 1200px) 25vw, (min-width: 720px) 33vw, 50vw';
/** Default view: dense grid on a desktop, one large work per row on a
 *  phone. A visitor's own toggle (VIEW_KEY) wins for the session. */
export const DENSE_DEFAULT_QUERY = '(min-width: 760px)';
/** Filter: a small panel under the pill on a desktop, a bottom sheet on a phone. */
export const PANEL_QUERY = '(min-width: 760px) and (hover: hover)';
/** Set on <html> by the inline script while a dense first view waits for
 *  React (the static HTML is the single-column list). */
export const PRE_DENSE_CLASS = 'tg-pre-dense';
