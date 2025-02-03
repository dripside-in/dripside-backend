import { Schema, model } from 'mongoose';
import { ISample, IStatus } from '../../interfaces';
import { config } from '../../config';

const { SAMPLES } = config.MONGO_COLLECTIONS;

const adminSchema = new Schema<ISample>(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: IStatus,
      default: IStatus.ACTIVE,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastCodeDoc = await Sample.findOne({}, { code: 1 }).sort({
      createdAt: -1,
    });

    if (lastCodeDoc) {
      const lastNumber = parseInt(lastCodeDoc.code.slice(4));
      this.code = `SPLE${lastNumber + 1}`;
    } else {
      this.code = 'SPLE100';
    }
  }
  next();
});

const Sample = model(SAMPLES, adminSchema);

export default Sample;
