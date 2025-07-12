"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomFilterDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function CustomFilterDropdown({
  options,
  value,
  onChange,
  label,
}: CustomFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select";

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm text-[#A3A3A3] mb-2 block">{label}</label>
      <button
        type="button"
        className="w-full bg-grey-darkest text-white px-4 py-2 focus:outline-none flex justify-between items-center"
        onClick={handleToggle}
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-grey-darkest shadow-lg">
          <ul>
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-white hover:bg-grey-darker flex items-center justify-between"
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
