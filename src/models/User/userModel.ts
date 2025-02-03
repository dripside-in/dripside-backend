import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRoles, IUser, IAccountStatus } from '../../interfaces';
import { generateOTP, generatePassword } from '../../functions';
import { config } from '../../config';

const { USERS } = config.MONGO_COLLECTIONS;

interface IUserDocument extends IUser {
  matchPasswords: (password: string) => boolean;
  changePassword: (password: string) => void;
  resetPassword: () => string;
  matchLastPasswords: (password: string) => boolean;
  setOTP: () => string;
  matchOTP: (otp: string) => boolean;
}

const userSchema = new Schema<IUserDocument>(
  {
    code: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 15,
    },
    password: {
      type: String,
      select: false,
      required: true,
      default: generatePassword(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: Number,
      required: true,
      maxlength: 10,
      unique: true,
    },
    otp: {
      type: String,
      select: false,
      required: true,
    },
    otpSentedAt: {
      type: Date,
      select: false,
    },
    failedOtpVerifyAt: {
      type: Date,
      select: false,
    },
    failedOtpAttempt: {
      type: Number,
      default: 400,
      select: false,
    },
    role: {
      type: String,
      enum: UserRoles,
      default: UserRoles.USER,
    },
    status: {
      type: String,
      required: true,
      enum: IAccountStatus,
      default: IAccountStatus.ACTIVE,
    },
    lastPassword: {
      type: String,
      select: false,
    },
    passwordChanged: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    lastUsed: {
      type: Date,
      default: new Date(),
    },
    lastSync: {
      type: Date,
      default: new Date(),
    },
    usedIPaddress: [
      {
        type: String,
      },
    ],
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') && !this.isModified('otp')) {
    return next();
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('otp')) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  if (this.isNew) {
    const lastCodeDoc = await User.findOne({}, { code: 1 }).sort({
      createdAt: -1,
    });

    if (lastCodeDoc) {
      const lastNumber = parseInt(lastCodeDoc.code.slice(3));
      this.code = `USR${lastNumber + 1}`;
    } else {
      this.code = 'USR100';
    }
  }
  next();
});

userSchema.methods.matchPasswords = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.resetPassword = async function () {
  this.lastPassword = this.password;
  const newPassword = await generatePassword();
  this.password = newPassword;
  this.resetPasswordAccess = false;
  this.passwordChanged = true;
  this.passwordChangedAt = new Date();
  await this.save();
  return newPassword;
};

userSchema.methods.changePassword = async function async(password: string) {
  this.lastPassword = this.password;
  this.password = password;
  this.passwordChanged = true;
  this.passwordChangedAt = new Date();
  await this.save();
};

userSchema.methods.matchLastPasswords = async function (password: string) {
  return await bcrypt.compare(password, this.lastPassword);
};

userSchema.methods.setOTP = async function () {
  const otp = await generateOTP();
  this.otp = otp;
  this.otpSentedAt = new Date();
  await this.save();
  return otp;
};

userSchema.methods.matchOTP = async function (otp: string) {
  return await bcrypt.compare(otp, this.otp);
};


const User = model(USERS, userSchema);


export default User;

