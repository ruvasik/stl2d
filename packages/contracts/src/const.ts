/** Session cookie name */
export const COOKIE_NAME = 'session';

/** Maximum file size for STL uploads (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** View names in order */
export const VIEW_NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const;

/** Human-readable view labels */
export const VIEW_LABELS: Record<typeof VIEW_NAMES[number], string> = {
  front: 'Front (−Z)',
  back: 'Back (+Z)',
  left: 'Left (+X)',
  right: 'Right (−X)',
  top: 'Top (−Y)',
  bottom: 'Bottom (+Y)',
};
