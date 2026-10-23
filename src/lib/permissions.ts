export const permissionLabels = {
  'content.manage': 'Edit and publish public pages, news, and media',
  'leadership.manage': 'Add and update leadership details',
  'spotlight.manage': 'Create, preview, publish, and archive Community Spotlight',
  'feedback.manage': 'Review website feedback and save internal notes',
  'residents.read': 'View resident roster and submissions',
  'residents.edit': 'Edit resident contact details and preferences',
  'residents.approve': 'Review and approve resident requests',
  'residents.export': 'Download the active resident roster',
  'residents.reconcile': 'Compare, merge, and recover duplicate records',
} as const;
export type Permission = keyof typeof permissionLabels;
export const initialRoles = [
  { name: 'Administrator', key: 'administrator', permissions: Object.keys(permissionLabels) as Permission[] },
  { name: 'Board Member', key: 'board', permissions: ['leadership.manage', 'content.manage', 'feedback.manage'] as Permission[] },
  { name: 'Membership', key: 'membership', permissions: ['residents.read', 'residents.edit', 'residents.approve', 'residents.export', 'residents.reconcile'] as Permission[] },
  { name: 'Public Relations', key: 'public-relations', permissions: ['spotlight.manage'] as Permission[] },
  { name: 'Content Editor', key: 'editor', permissions: ['content.manage'] as Permission[] },
];
