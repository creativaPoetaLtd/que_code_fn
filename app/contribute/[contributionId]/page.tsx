import PublicContributionPage from "@/components/contributions/PublicContributionPage";

interface Props {
  params: { contributionId: string };
}

export default function ContributePage({ params }: Props) {
  return <PublicContributionPage contributionId={params.contributionId} />;
}
