/** Constants shared by the /trash server page (its inline pre-paint script)
 *  and the client grid. They live here, NOT in TrashPageShell.tsx: exports
 *  of a 'use client' module reach server code as client-reference stubs,
 *  not values (that bug shipped a broken inline script once). */
export const BATCH = 24;
export const GRID_ID = 'tg-grid';
export const ORDER_STYLE_ID = 'tg-order';
export const GRID_SINGLE_SIZES = '(min-width: 760px) 720px, calc(100vw - 32px)';
