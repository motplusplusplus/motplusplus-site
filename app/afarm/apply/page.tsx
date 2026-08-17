import { getAllStudios } from "@/lib/studios";
import ApplyFormWithSuspense from "./ApplyForm";

export default async function ApplyPage() {
  const studios = await getAllStudios();
  return <ApplyFormWithSuspense studios={studios} />;
}
