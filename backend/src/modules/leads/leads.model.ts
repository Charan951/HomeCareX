import { Schema, model } from 'mongoose';

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    skills: { type: String, trim: true },
    source: {
      type: String,
      required: true,
      enum: ['contact', 'partner'],
    },
    status: {
      type: String,
      required: true,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  },
);

export const LeadModel = model('Lead', leadSchema);
