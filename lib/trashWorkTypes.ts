/** +1 trash work types: the stored slug (Sanity `trashItem.workType`, also the
 *  `?type=` URL value) and the lowercase label shown on the filter buttons.
 *  Order here is the button order. Keep in sync with
 *  motplus-sanity/schemaTypes/trashItem.ts (`workType` options). */
export const TRASH_WORK_TYPES = [
  { value: 'painting', label: 'painting' },
  { value: 'drawing', label: 'drawing' },
  { value: 'sculpture', label: 'sculpture' },
  { value: 'installation', label: 'installation' },
  { value: 'textile', label: 'textile' },
  { value: 'video-digital', label: 'video / digital' },
  { value: 'sound', label: 'sound' },
  { value: 'photography-print', label: 'photography / print' },
  { value: 'performance-relic', label: 'performance relic' },
  { value: 'performance-documentation', label: 'performance documentation' },
] as const;

export type TrashWorkType = typeof TRASH_WORK_TYPES[number]['value'];

export function isTrashWorkType(v: string | null | undefined): v is TrashWorkType {
  return !!v && TRASH_WORK_TYPES.some(t => t.value === v);
}
