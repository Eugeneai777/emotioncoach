import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useIndustryPartners } from "./industry-partners/useIndustryPartners";
import { IndustryPartnerList } from "./industry-partners/IndustryPartnerList";
import { IndustryPartnerDetail } from "./industry-partners/IndustryPartnerDetail";

export default function IndustryPartnerManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get("partner");

  const {
    partners,
    loading,
    isPartnerAdmin,
    refetch,
    createPartner,
    isCreating,
    bindUser,
    isBinding,
    unbindUser,
    unbindingId,
    isUnbinding,
  } = useIndustryPartners();

  // Auto-select for partner_admin with single partner
  useEffect(() => {
    if (isPartnerAdmin && partners.length === 1 && !partnerId) {
      setSearchParams({ partner: partners[0].id });
    }
  }, [isPartnerAdmin, partners, partnerId, setSearchParams]);

  const selectedPartner = partners.find((p) => p.id === partnerId);

  if (partnerId && selectedPartner) {
    return (
      <IndustryPartnerDetail
        partner={selectedPartner}
        isPartnerAdmin={isPartnerAdmin}
        onBack={() => setSearchParams({})}
        onBindUser={bindUser}
        isBinding={isBinding}
        onSaved={refetch}
      />
    );
  }

  return (
    <IndustryPartnerList
      partners={partners}
      loading={loading}
      isPartnerAdmin={isPartnerAdmin}
      onSelectPartner={(id) => setSearchParams({ partner: id })}
      onCreatePartner={createPartner}
      isCreating={isCreating}
      onBindUser={bindUser}
      isBinding={isBinding}
      onUnbindUser={unbindUser}
      isUnbinding={isUnbinding}
      unbindingId={unbindingId as string | undefined}
    />
  );
}
