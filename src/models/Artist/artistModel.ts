import { Schema, model } from 'mongoose';
import { IArtist, IStatus, IVerificationDetails } from '../../interfaces';
import { config } from '../../config';

const { ARTISTS } = config.MONGO_COLLECTIONS;

const verificationDetailsSchema = new Schema<IVerificationDetails>({
  adhaarCard: {
    type: String,
    required: false,
  },
  socialMediaUrls: {
    type: [String],
    required: false,
  },
  panCard: {
    type: String,
    required: false,
  },
  bankDetails: {
    type: String,
    required: false,
  },
});

const artistSchema = new Schema<IArtist>(
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
    verificationDocuments: {
      type: verificationDetailsSchema,
      default: {},
      required: true
    },
  },
  { timestamps: true }
);

artistSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastCodeDoc = await Artist.findOne({}, { code: 1 }).sort({
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

const Artist = model(ARTISTS, artistSchema);

export default Artist;
