import React from "react";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  id: string;
  image: string;
  category: string;
  name: string;
  rating: number;
  price: number;
  duration: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  image,
  category,
  name,
  rating,
  price,
  duration,
}) => {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e0e7ff] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eef2ff]">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Category */}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4338ca] shadow-md">
          {category}
        </span>

        {/* Rating */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#11104f] shadow-md">
          <Star
            size={13}
            fill="#ff8a3d"
            className="text-[#ff8a3d]"
          />
          {rating}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">

        {/* Service Name */}
        <h3 className="text-lg font-extrabold text-[#11104f]">
          {name}
        </h3>

        {/* Price + Duration */}
        <div className="mt-3 flex items-center justify-between">

          {/* Price */}
          <div>
            <p className="text-xs text-[#6b6b8a]">
              Starting from
            </p>

            <p className="text-lg font-extrabold text-[#4338ca]">
              ₹{price}
            </p>
          </div>

          {/* Duration */}
          <div className="text-right">
            <p className="text-xs text-[#6b6b8a]">
              Duration
            </p>

            <p className="text-sm font-semibold text-[#11104f]">
              {duration}
            </p>
          </div>

        </div>

        {/* View Details */}
        <Link
          to={`/services/${id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4338ca] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3730a3]"
        >
          View Details
          <ArrowRight size={16} />
        </Link>

      </div>
    </article>
  );
};

export default ServiceCard;