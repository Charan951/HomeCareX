import React, { useEffect } from "react";
import LegalLayout from "../../../components/public/LegalLayout";
import { termsContent } from "../../../content/terms";

const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Terms & Conditions | HomeCareX";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Read the Terms and Conditions governing your access to and use of the HomeCareX digital platform, booking workflows, and home-services marketplace."
    );
  }, []);

  return <LegalLayout {...termsContent} />;
};

export default TermsPage;
