import React, { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
} from "react-router-dom";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Browser Back / Forward
    // Let the browser restore the previous scroll position.
    if (navigationType === "POP") {
      return;
    }

    // Normal navigation
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });

    // Move keyboard focus to the main page content.
    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      mainContent.focus();
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;