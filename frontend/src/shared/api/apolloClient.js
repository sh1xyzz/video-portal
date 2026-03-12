// src/shared/api/apolloClient.js
// ✅ Автоматически добавляет JWT токен в каждый GraphQL запрос
// Без этого markLessonComplete / addReview / deleteReview вернут "Authentication required"

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "http://localhost:8000/graphql",
});

// Читаем токен из zustand-persist storage перед каждым запросом
const authLink = setContext((_, { headers }) => {
  // zustand persist сохраняет под ключом "auth-storage" (см. useAuthStore)
  let token = null;
  try {
    const raw = localStorage.getItem("edustream-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.state?.token ?? null;
    }
  } catch {
    // ignore
  }

  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
