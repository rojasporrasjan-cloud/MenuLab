import { DomainError } from './DomainError'

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION'
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}
