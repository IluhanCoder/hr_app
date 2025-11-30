

import mongoose, { Schema, Document } from "mongoose";

export interface ReportFilter {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "in";
  value: any;
}

export interface ReportSort {
  field: string;
  order: "asc" | "desc";
}

export interface ReportAggregation {
  function: "count" | "sum" | "avg" | "min" | "max";
  field: string;
  alias: string;
}

export interface IReport extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  entityType: "users" | "candidates" | "goals" | "reviews";

  fields: string[];
  filters: ReportFilter[];
  sort?: ReportSort;
  aggregations?: ReportAggregation[];

  isPublic: boolean;
  lastRun?: Date;
  runCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entityType: {
      type: String,
      enum: ["users", "candidates", "goals", "reviews"],
      required: true,
    },
    fields: {
      type: [String],
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v.length > 0;
        },
        message: "Потрібно вибрати хоча б одне поле",
      },
    },
    filters: {
      type: [
        {
          field: String,
          operator: {
            type: String,
            enum: ["equals", "not_equals", "contains", "gt", "gte", "lt", "lte", "in"],
          },
          value: Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    sort: {
      field: String,
      order: {
        type: String,
        enum: ["asc", "desc"],
      },
    },
    aggregations: {
      type: [
        {
          function: {
            type: String,
            enum: ["count", "sum", "avg", "min", "max"],
          },
          field: String,
          alias: String,
        },
      ],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastRun: {
      type: Date,
    },
    runCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ createdBy: 1 });
reportSchema.index({ entityType: 1 });
reportSchema.index({ isPublic: 1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
