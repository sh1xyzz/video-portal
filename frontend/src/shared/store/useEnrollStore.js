// src/shared/store/useEnrollStore.js
// Хранит список курсов, на которые записан пользователь
// Данные персистентны через localStorage

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useEnrollStore = create(
  persist(
    (set, get) => ({
      // Map: courseId -> { id, title, thumb, instructor, progress, enrolledAt, totalLessons, completedLessons }
      enrolled: {},

      enroll: (course) => {
        const { enrolled } = get();
        if (enrolled[course.id]) return; // уже записан
        set({
          enrolled: {
            ...enrolled,
            [course.id]: {
              id: course.id,
              title: course.title,
              thumb: course.thumb,
              instructor: course.instructor,
              category: course.category ?? "",
              level: course.level ?? "",
              totalLessons: course.totalLessons ?? 0,
              completedLessons: 0,
              progress: 0,
              enrolledAt: new Date().toISOString(),
            },
          },
        });
      },

      unenroll: (courseId) => {
        const { enrolled } = get();
        const next = { ...enrolled };
        delete next[courseId];
        set({ enrolled: next });
      },

      isEnrolled: (courseId) => !!get().enrolled[courseId],

      // Обновить прогресс (вызывать при завершении урока)
      updateProgress: (courseId, completedLessons) => {
        const { enrolled } = get();
        const course = enrolled[courseId];
        if (!course) return;
        const progress =
          course.totalLessons > 0
            ? Math.round((completedLessons / course.totalLessons) * 100)
            : 0;
        set({
          enrolled: {
            ...enrolled,
            [courseId]: { ...course, completedLessons, progress },
          },
        });
      },

      getList: () =>
        Object.values(get().enrolled).sort(
          (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt),
        ),
    }),
    {
      name: "edustream-enrolled",
    },
  ),
);

export default useEnrollStore;
