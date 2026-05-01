/** Options for photographer specialty / focus (application + profile). */
export const PHOTOGRAPHY_FOCUS_OPTIONS = [
  'Portraits',
  'Weddings & engagements',
  'Graduation & ceremonies',
  'Events & corporate',
  'Family & lifestyle',
  'Fashion & editorial',
  'Product & commercial',
  'Real estate',
  'Landscape & travel',
  'Sports',
  'Other',
] as const;

export type PhotographyFocusOption = (typeof PHOTOGRAPHY_FOCUS_OPTIONS)[number];
