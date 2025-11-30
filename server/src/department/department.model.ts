

import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description?: string;
  parentDepartment?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getSubDepartments(): Promise<IDepartment[]>;
  getFullPath(): Promise<string[]>;
}

export interface IDepartmentModel extends mongoose.Model<IDepartment> {
  getRootDepartments(): Promise<IDepartment[]>;
  getHierarchy(): Promise<any[]>;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, "Назва відділу обов'язкова"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    code: {
      type: String,
      required: [true, "Код відділу обов'язковий"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ managerId: 1 });

departmentSchema.methods.getSubDepartments = async function () {
  return await Department.find({ parentDepartment: this._id, isActive: true });
};

departmentSchema.methods.getFullPath = async function (): Promise<string[]> {
  const path: string[] = [this.name];
  let current: any = this;

  while (current.parentDepartment) {
    const parent = await Department.findById(current.parentDepartment);
    if (parent) {
      path.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }

  return path;
};

departmentSchema.statics.getRootDepartments = function () {
  return this.find({ parentDepartment: null, isActive: true });
};

departmentSchema.statics.getHierarchy = async function () {
  const departments = await this.find({ isActive: true })
    .populate("managerId", "personalInfo email")
    .sort({ code: 1 });

  const buildTree = (parentId: any = null): any[] => {
    return departments
      .filter((dept: any) => {
        if (parentId === null) {
          return dept.parentDepartment === null;
        }
        return dept.parentDepartment?.toString() === parentId.toString();
      })
      .map((dept: any) => ({
        id: dept._id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        manager: dept.managerId,
        children: buildTree(dept._id),
      }));
  };

  return buildTree();
};

export const Department = mongoose.model<IDepartment, IDepartmentModel>("Department", departmentSchema);
