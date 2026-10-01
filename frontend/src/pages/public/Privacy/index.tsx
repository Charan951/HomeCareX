import React, { useEffect } from "react";
import LegalLayout from "../../../components/public/LegalLayout";
import { privacyContent } from "../../../content/privacy";

const PrivacyPage: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy | HomeCareX";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Learn how HomeCareX collects, uses, shares, protects, and retains your personal information across our home-services platform and applications."
    );
  }, []);

  return <LegalLayout {...privacyContent} />;
};

export default PrivacyPage;
