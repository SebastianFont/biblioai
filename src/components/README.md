# `components` — UI reutilizable

Componentes de React presentacionales y reutilizables.

- `ui/` — primitivos (botones, inputs, cards) basados en shadcn/ui.
- El resto: componentes de dominio compuestos a partir de los primitivos.

Los componentes acá deberían ser lo más "tontos" posible: reciben props y
renderizan. La obtención de datos vive en Server Components / páginas.
