// Identidad fiscal del emisor (el restaurante) para facturación electrónica CR.
// Se captura en Configuración; nunca se hardcodea.

export const HACIENDA_ENVIRONMENT = {
  sandbox: 'sandbox',       // pruebas (api.comprobanteselectronicos.go.cr/.../stag)
  production: 'production', // producción (.../prod)
} as const
export type HaciendaEnvironment = (typeof HACIENDA_ENVIRONMENT)[keyof typeof HACIENDA_ENVIRONMENT]

/** Tipo de identificación del emisor (catálogo Hacienda). */
export const ID_TYPE = {
  fisica: '01',
  juridica: '02',
  dimex: '03',
  nite: '04',
} as const
export type IdType = (typeof ID_TYPE)[keyof typeof ID_TYPE]

export interface TenantFiscalConfig {
  /** Si está activa la facturación electrónica para este tenant. */
  readonly enabled: boolean
  /** Razón social / nombre legal del emisor. */
  readonly legalName: string
  readonly idType: IdType
  /** Cédula del emisor (solo dígitos). */
  readonly idNumber: string
  /** Código de actividad económica registrado ante Hacienda. */
  readonly economicActivity: string
  readonly email: string
  readonly environment: HaciendaEnvironment
  /** Sucursal (3 dígitos, ej. "001"). */
  readonly branch: string
  /** Terminal/caja (5 dígitos, ej. "00001"). */
  readonly terminal: string
}

export const DEFAULT_FISCAL_CONFIG: TenantFiscalConfig = {
  enabled: false,
  legalName: '',
  idType: ID_TYPE.juridica,
  idNumber: '',
  economicActivity: '',
  email: '',
  environment: HACIENDA_ENVIRONMENT.sandbox,
  branch: '001',
  terminal: '00001',
}

/** True cuando hay datos mínimos para emitir comprobantes. */
export function isFiscalConfigComplete(config: TenantFiscalConfig): boolean {
  return (
    config.enabled &&
    config.legalName.trim().length > 0 &&
    config.idNumber.replace(/\D/g, '').length > 0 &&
    config.economicActivity.trim().length > 0
  )
}
