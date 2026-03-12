// src/pages/CoursesView/courseUtils.js
// Утилиты вынесены отдельно — Fast Refresh требует чтобы файл
// экспортировал ТОЛЬКО компоненты ИЛИ только обычные значения, не вместе.

export const toSlug = (t = "") =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
