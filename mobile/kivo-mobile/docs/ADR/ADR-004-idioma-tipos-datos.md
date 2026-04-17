# ADR-004: Inglés como idioma base para tipos de datos y enumeraciones

| Campo      | Valor                                                       |
| ---------- | ----------------------------------------------------------- |
| **ID**     | ADR-004                                                     |
| **Título** | Inglés como idioma base para tipos de datos y enumeraciones |
| **Estado** | Aceptado                                                    |
| **Fecha**  | 2026-04-15                                                  |
| **Autor**  | Joahan Ortega                                               |

## Contexto

El proyecto Kivo está desarrollado en español — UI, comentarios y documentación.
Sin embargo, los valores de enumeraciones en base de datos y servicios
(`income`, `expense`, `create`, `update`, `delete`) están en inglés,
lo que genera una aparente inconsistencia con el resto del sistema.

## Decisión

Se mantiene el inglés para todos los valores de enumeraciones, tipos
de datos, y constantes técnicas del sistema.

La UI puede mostrar etiquetas en cualquier idioma independientemente
de los valores internos — `"income"` se muestra como `"Ingreso"` en
español o `"Income"` en inglés sin cambiar la BD.

## Razones

- Kivo está diseñado para escalar a múltiples idiomas en el futuro.
  Si los tipos internos fueran en español, una internacionalización
  posterior requeriría una migration de base de datos.
- Las APIs externas, librerías y herramientas del ecosistema usan
  inglés — mantener consistencia reduce fricción de integración.
- Es el estándar de la industria para valores técnicos internos.

## Consecuencias

- La capa de presentación es responsable de traducir los valores
  técnicos a etiquetas visibles según el idioma del usuario.
- Todos los valores de enumeraciones nuevos deben definirse en inglés.
- Los comentarios, documentación y UI permanecen en español.