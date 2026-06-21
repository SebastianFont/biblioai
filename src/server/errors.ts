/**
 * Errores de dominio.
 *
 * Los services lanzan estos errores sin saber nada de HTTP. La capa HTTP
 * (ver http.ts) los traduce a códigos de estado. Así la lógica de negocio
 * queda desacoplada del framework y es fácil de testear.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** La request está mal formada (p. ej. body no JSON). → 400 */
export class BadRequestError extends DomainError {}

/** El recurso solicitado no existe (o no pertenece al usuario). → 404 */
export class NotFoundError extends DomainError {}

/** La operación no está permitida para el usuario actual. → 403 */
export class ForbiddenError extends DomainError {}
