import { Schema, model } from 'mongoose';

export const BANNER_PLACEMENTS = [
  'HOME',
  'HOME_TOP',
  'HOME_MIDDLE',
  'HOME_BOTTOM',
] as const;

export type BannerPlacement =
  (typeof BANNER_PLACEMENTS)[number];

const BannerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    link: {
      type: String,
      trim: true,
      default: '',
    },

    placement: {
      type: String,
      required: true,
      enum: BANNER_PLACEMENTS,
      index: true,
    },

    startAt: {
      type: Date,
      required: true,
      index: true,
    },

    endAt: {
      type: Date,
      required: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

BannerSchema.index({
  placement: 1,
  active: 1,
  startAt: 1,
  endAt: 1,
  order: 1,
});

export const BannerModel =
  model('Banner', BannerSchema);

export default BannerModel;