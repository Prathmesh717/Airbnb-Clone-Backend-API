import { ThreadExperience } from "../../../components/ThreadExperience";

export default function ThreadPage({ params }: { params: { id: string } }) {
  return <ThreadExperience id={params.id} />;
}
