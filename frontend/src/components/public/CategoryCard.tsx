import React from "react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  serviceCount: number;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  description,
  image,
  serviceCount,
  link,
}) => {
  return (
    <Link
      to={link}
      className="
        group
        block
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-xl
        focus:outline-none
        focus:ring-2
        focus:ring-[#4338ca]
        focus:ring-offset-2
      "
    >
      {/* Image */}
      <div className="h-44 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={name}
          className="
            h-full
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#4338ca]">
          {name}
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          {description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            {serviceCount} services
          </span>

          <span className="text-sm font-semibold text-[#ff8a3d]">
            View Services →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;