import React from "react";

const SkipLink: React.FC = () => {
  const handleSkip = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();

    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="
        fixed
        left-4
        top-4
        z-[100]
        -translate-y-20
        rounded-md
        bg-[#4338ca]
        px-4
        py-2
        text-sm
        font-semibold
        text-white
        shadow-lg
        transition-transform
        focus:translate-y-0
        focus:outline-none
        focus:ring-2
        focus:ring-white
        focus:ring-offset-2
      "
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;