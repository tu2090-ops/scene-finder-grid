import Finder from "../components/Finder";
import { moments } from "../lib/moments";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const requested = typeof params?.moment === "string" ? params.moment : "";
  const initialId = moments.some((moment) => moment.id === requested) ? requested : "";
  return <Finder initialId={initialId} />;
}
