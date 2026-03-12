// src/index.jsx
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import client from "@/shared/api/apolloClient";
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
