// RBAC Helper Utilities
// Centralizes role-based access control logic for the UI layer

export type Role = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'DATA_ENTRY' | 'GUEST' | string;

type Entity = 'universities' | 'courses' | 'subjects' | 'chapters' | 'resources' | 'team' | 'settings';

/**
 * Can the user create/edit this entity type?
 */
export function canEdit(role: Role, entity: Entity): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'CONTENT_MANAGER') return entity !== 'universities' && entity !== 'team' && entity !== 'settings';
  if (role === 'DATA_ENTRY') return entity === 'chapters' || entity === 'resources';
  return false;
}

/**
 * Can the user delete this entity type?
 */
export function canDelete(role: Role, entity: Entity): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'CONTENT_MANAGER') return entity !== 'universities' && entity !== 'team' && entity !== 'settings';
  if (role === 'DATA_ENTRY') return false;
  return false;
}

/**
 * Can the user view (navigate to) this section?
 */
export function canView(role: Role, entity: Entity): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'CONTENT_MANAGER') return entity !== 'team' && entity !== 'settings';
  if (role === 'DATA_ENTRY') return entity !== 'team' && entity !== 'settings' && entity !== 'universities';
  return false;
}
