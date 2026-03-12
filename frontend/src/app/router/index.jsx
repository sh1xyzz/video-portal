// src/app/router/index.jsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import HomeView       from "../../pages/HomeView";
import Courses        from "../../pages/CoursesView/Courses";
import CourseDetail   from "../../pages/CoursesView/CoursesDetailView";
import LessonView     from "../../pages/LessonView";
import AdminPanel     from "../../pages/Admin";
import ProfileView    from "../../pages/ProfileView";
import MyCoursesPage  from "../../pages/MyCoursesView/MyCoursesView";
import SettingsView   from "../../pages/Settings/SettingsView";
import InstructorsView from "../../pages/Instructors/InstructorsView";
import CategoriesView from "../../pages/Categories/CategoriesView";

const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────
  { path: "/",                                    element: <HomeView />        },
  { path: "/courses",                             element: <Courses />         },
  { path: "/courses/:slug",                       element: <CourseDetail />    },
  { path: "/courses/:courseId/lessons/:lessonId", element: <LessonView />      },
  { path: "/categories",                          element: <CategoriesView />  },
  { path: "/instructors",                         element: <InstructorsView /> },

  // ── Auth-required ────────────────────────────────────────────────────────
  { path: "/profile",                             element: <ProfileView />     },
  { path: "/my-courses",                          element: <MyCoursesPage />   },
  { path: "/settings",                            element: <SettingsView />    },

  // ── Admin-only ───────────────────────────────────────────────────────────
  { path: "/admin",                               element: <AdminPanel />      },

  // ── 404 ──────────────────────────────────────────────────────────────────
  { path: "*",                                    element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;