import { gql } from "@apollo/client";
import { client } from "../../shared/api/graphqlClient";

export const getCourses = async () => {
  const { data } = await client.query({
    query: gql`
      query {
        courses {
          id
          title
          description
        }
      }
    `,
  });
  return data.courses;
};
