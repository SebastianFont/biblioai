# `components` — UI reutilizable

Componentes de React presentacionales y reutilizables.

- `ui/` — primitivos propios con Tailwind (botones, inputs, cards, badges, spinner).
- El resto: componentes de dominio compuestos a partir de los primitivos
  (tarjeta de libro, formularios, badge de sentimiento, header).

Los componentes acá deberían ser lo más "tontos" posible: reciben props y
renderizan. La obtención de datos vive en Server Components / páginas.
