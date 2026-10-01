import React, { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  menuButtonRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Escape key + body scroll lock
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    // Prevent background scrolling
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /*
  |--------------------------------------------------------------------------
  | Focus first element when drawer opens
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    const firstFocusableElement =
      drawer.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );

    // Wait until drawer is rendered
    requestAnimationFrame(() => {
      firstFocusableElement?.focus();
    });
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | Return focus to menu button after drawer closes
  |--------------------------------------------------------------------------
  */

  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Drawer has just opened
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    // Drawer was already closed
    if (!wasOpenRef.current) {
      return;
    }

    // Drawer has just closed
    wasOpenRef.current = false;

    requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  }, [isOpen, menuButtonRef]);

  /*
  |--------------------------------------------------------------------------
  | Focus trap
  |--------------------------------------------------------------------------
  */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key !== "Tab") {
      return;
    }

    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    const focusableElements = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];

    const lastElement =
      focusableElements[focusableElements.length - 1];

    /*
    |----------------------------------------------------------------------
    | Shift + Tab
    |----------------------------------------------------------------------
    */

    if (
      event.shiftKey &&
      document.activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    /*
    |----------------------------------------------------------------------
    | Tab
    |----------------------------------------------------------------------
    */

    if (
      !event.shiftKey &&
      document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Don't render drawer when closed
  |--------------------------------------------------------------------------
  */

  if (!isOpen) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Drawer
  |--------------------------------------------------------------------------
  */

  return (
    <div
      ref={drawerRef}
      className="md:hidden border-t border-gray-200 bg-white shadow-lg"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
    >
      <nav className="flex flex-col gap-4 px-6 py-4">

        {/* Home */}
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "font-bold text-[#ff8a3d] transition"
              : "text-gray-700 transition hover:text-[#4338ca]"
          }
        >
          Home
        </NavLink>

        {/* Services */}
        <NavLink
          to="/services"
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "font-bold text-[#ff8a3d] transition"
              : "text-gray-700 transition hover:text-[#4338ca]"
          }
        >
          Services
        </NavLink>

        {/* About */}
        <NavLink
          to="/about"
          end
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "font-bold text-[#ff8a3d] transition"
              : "text-gray-700 transition hover:text-[#4338ca]"
          }
        >
          About
        </NavLink>

        {/* Contact */}
        <NavLink
          to="/contact"
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "font-bold text-[#ff8a3d] transition"
              : "text-gray-700 transition hover:text-[#4338ca]"
          }
        >
          Contact
        </NavLink>

        <hr className="border-gray-200" />

        {/* Login */}
        <NavLink
          to="/login"
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "font-bold text-[#ff8a3d] transition"
              : "font-medium text-[#4338ca] transition hover:text-[#ff8a3d]"
          }
        >
          Login
        </NavLink>

        {/* Register */}
        <NavLink
          to="/register"
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? "rounded-lg bg-[#4338ca] px-5 py-2.5 text-center font-medium text-white transition"
              : "rounded-lg bg-[#ff8a3d] px-5 py-2.5 text-center font-medium text-white transition hover:bg-[#4338ca]"
          }
        >
          Register
        </NavLink>

      </nav>
    </div>
  );
};

export default MobileDrawer;