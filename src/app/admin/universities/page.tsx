import UniversitiesClient from "./UniversitiesClient";

export const metadata = {
  title: "Universities | QuduHub Admin",
};

export const runtime = "edge";

// Data is fetched client-side via SWR (auth token lives in Zustand store, not cookies).
// This page is a thin Server Component wrapper.
export default function UniversitiesPage() {
  return <UniversitiesClient />;
}
