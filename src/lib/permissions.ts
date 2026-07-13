import type { PermissionAction } from '../data/erpCatalog'

export type PermissionRow = {
  modulo: string
  visualizar: boolean
  cadastrar: boolean
  editar: boolean
  excluir: boolean
  imprimir: boolean
  emitir: boolean
}

export type AccessControl = {
  role: string
  isManager: boolean
  rows: PermissionRow[]
  can: (moduleId: string, action: PermissionAction) => boolean
}

export function createAccessControl(role: string, rows: PermissionRow[] = []): AccessControl {
  const normalizedRole = role.toLowerCase()
  const isManager = ['proprietario', 'administrador'].includes(normalizedRole)
  const byModule = new Map(rows.map((row) => [row.modulo, row]))
  return {
    role,
    isManager,
    rows,
    can(moduleId, action) {
      if (isManager) return true
      const row = byModule.get(moduleId)
      return Boolean(row?.[action])
    },
  }
}

export const emptyAccess = createAccessControl('leitura', [])
