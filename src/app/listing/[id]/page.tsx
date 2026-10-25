import { ListingDetailExperience } from "../../../components/ListingDetailExperience";

export default function ListingPage({ params }: { params: { id: string } }) {
  return <ListingDetailExperience id={params.id} />;
}
