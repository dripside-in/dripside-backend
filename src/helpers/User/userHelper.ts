import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IAccountStatus,
  IResponseData,
  ILoginResponse,
  IOtpVerifyResponse,
  IUserResponse,
  IGetUsersResponse,
  IUser,
  UserRoles,
  ICheckUsername,
} from '../../interfaces';
import { User } from '../../models';
import { config } from '../../config';
import { ThrowError } from '../../classes';
import { generateToken, verifyToken } from '../../utils';
import { IDeleted } from '../../types';
import { generateOTP, generatePassword } from '../../functions';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;
const { MIN_OTP_FAILED_ATTEMPT, OTP_EXPIRE_TIME, OTP_FAILED_RESET_TIME } =
  config.SETTINGS.OTP_SETTINGS;

/**
 * To get all users except deleted users
 * @returns IUser[]
 */
export const getUsers = (
  timestamp?: string,
  page?: string,
  limit?: string,
  role?: string,
  name?: string,
  username?: string,
  email?: string,
  phone?: string,
  status?: IAccountStatus[],
  deleted: IDeleted = 'NO'
) => {
  return new Promise<IGetUsersResponse>(async (resolve, reject) => {
    try {
      const PAGE = parseInt(page ?? '1');
      const LIMIT = parseInt(limit ?? '10');

      // Queries
      const timestampGTQuery =
        timestamp && !isNaN(Date.parse(timestamp))
          ? { createdAt: { $gt: timestamp } }
          : {};
      const timestampLTEQuery =
        timestamp && !isNaN(Date.parse(timestamp))
          ? { createdAt: { $lte: timestamp } }
          : {};
      const roleQuery = role ? { role } : {};
      const nameQuery = name ? { name: new RegExp(name, 'i') } : {};
      const usernameQuery = username
        ? { username: new RegExp(username, 'i') }
        : {};
      const emailQuery = email ? { email: new RegExp(email, 'i') } : {};
      const phoneQuery = phone ? { phone: new RegExp(phone, 'i') } : {};
      const statusQuery = status ? { status: status } : {};
      const deleteQuery =
        deleted != 'BOTH' ? { isDeleted: deleted === 'YES' } : {};
      const deleteProjection =
        deleted === 'BOTH' || deleted === 'YES'
          ? { isDeleted: 1, deletedAt: 1 }
          : {};

      // find condition
      const findCondition = {
        ...roleQuery,
        ...nameQuery,
        ...usernameQuery,
        ...emailQuery,
        ...phoneQuery,
        ...statusQuery,
        ...deleteQuery,
      };

      const users = await User.find(
        { ...findCondition, ...timestampLTEQuery },
        {
          code: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT === -1 ? 0 : LIMIT)
        .skip(LIMIT === -1 ? 0 : LIMIT * (PAGE - 1));

      const totalCount = await User.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await User.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: users.length > 0 ? 'Users fetched' : 'User is empty',
        currentPage: PAGE,
        results: users,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular user by id
 * @param userId
 * @returns IUser
 */
export const getUserById = (userId: IUser['_id'], role?: string) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId)) {
        return reject({
          message: !userId ? 'Provide userId' : 'userId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperUser', 'DeveloperUser'].includes(role ?? '')
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperUser', 'DeveloperUser'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const user = await User.findOne(
        { _id: userId, ...deleteQuery },
        {
          code: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      );

      if (!user) {
        return reject({
          message: 'User not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'User details fetched',
        results: user,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To login a user's account by email and password
 * @param {String} username
 * @param {String} email
 * @param {String} phone
 * @param {String} password
 * @returns {String} token
 */
export const userLogin = (
  username: string,
  email: string,
  phone: string,
  password: string
) => {
  return new Promise<ILoginResponse>(async (resolve, reject) => {
    try {
      if (
        (!username && !email && !phone) ||
        (phone && isNaN(Number(phone))) ||
        !password
      )
        throw new ThrowError(
          `Provide ${email ? 'Email' : phone ? 'Phone' : 'Username'
          } and password`,
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne(
        {
          $or: [{ username }, { email }, { phone }],
        },
        {
          name: 1,
          role: 1,
          password: 1,
          status: 1,
          lastSync: 1,
          lastUsed: 1,
        }
      );

      if (!user)
        throw new ThrowError(
          `Invalid ${email ? 'Email' : phone ? 'Phone' : 'Username'
          } or Password`,
          HttpStatusCode.UNAUTHORIZED
        );

      if (user.status === 'Blocked')
        throw new ThrowError(`Account blocked! contact Customer Care`, 401);

      if (user && (await user.matchPasswords(password))) {
        if (user.status === IAccountStatus.INACTIVE)
          user.status = IAccountStatus.ACTIVE;
        if (user.passwordChanged) user.passwordChanged = false;
        user.lastSync = new Date();
        user.lastUsed = new Date();

        await user.save();

        const accessToken = await generateToken({
          id: user._id.toString(),
          name: user.name,
          role: user.role,
          type: 'AccessToken',
        });

        const refreshToken = await generateToken({
          id: user._id.toString(),
          name: user.name,
          role: user.role,
          type: 'RefreshToken',
        });

        resolve({
          message: 'Login Success',
          results: { accessToken: accessToken, refreshToken: refreshToken, user },
        });
      } else {
        throw new ThrowError(
          `Invalid ${email ? 'Email' : phone ? 'Phone' : 'Username'
          } or Password`,
          HttpStatusCode.UNAUTHORIZED
        );
      }
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User login failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To upgrade a user's access token by refresh token
 * @param {String} token
 * @returns
 */
export const upgradeUserAccessToken = (refreshToken: string) => {
  return new Promise<ILoginResponse>(async (resolve, reject) => {
    try {
      if (!refreshToken)
        throw new ThrowError(
          `Please Provide a Token`,
          HttpStatusCode.BAD_REQUEST
        );
      // const userRefreshToken = await RefreshToken.findOne({ refreshToken });
      // if (userRefreshToken) {
      //   const attempt: number = (userRefreshToken.attempt ?? 0) + 1;
      //   const decoded = await verifyJwtToken(token, 'REFRESH_TOKEN');

      //  Check User Status

      //   const accessToken = await generateToken({
      //     id: decoded.id.toString(),
      //     name: decoded.audience,
      //     role: decoded.role,
      //     type: 'AccessToken',
      //   });

      //   const refreshToken = await generateToken({
      //     id: decoded.id.toString(),
      //     name: decoded.name,
      //     role: decoded.role,
      //     type: 'RefreshToken',
      //   });

      // update user refesh token in db
      // userRefreshToken.refreshToken = refreshToken;
      // await userRefreshToken.save()

      resolve({
        message: 'New Access Token Created',
        results: { accessToken: 'accessToken', refreshToken: 'refreshToken' },
      });
      // } else {
      // throw new ThrowError(`Unauthonticated Request`, HttpStatusCode.UNAUTHORIZED);
      // }
    } catch (error: any) {
      reject({
        message: error.message || error.msg,
        code: error.code || error.name,
      });
    }
  });
};

/**
 *  To sent a otp  for particular user by phone
 * @param userId
 * @returns IUser
 */
export const sentOTP = (phone: string | number) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!phone || (phone && isNaN(Number(phone)))) {
        return reject({
          message: 'Provide valid phone',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const user = await User.findOne(
        { phone },
        {
          otpSentedAt: 1,
          otp: 1,
        }
      );

      if (!user) {
        return reject({
          message: 'User not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }

      const otp = await user.setOTP();

      // Sent OTP to phone number
      console.log(otp);

      resolve({
        message: 'OTP sent successfully',
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To verify a otp  for particular user phone and otp code
 * @param userId, otp
 * @returns IUser
 */
export const verifyOTP = (
  phone: string | number,
  otp: string | number,
  isVerification: boolean = false
) => {
  return new Promise<IOtpVerifyResponse>(async (resolve, reject) => {
    try {
      if (
        !phone ||
        (phone && isNaN(Number(phone))) ||
        !otp ||
        (otp && isNaN(Number(otp)))
      ) {
        return reject({
          message: 'Provide valid phone and otp',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const user = await User.findOne(
        { phone },
        {
          name: 1,
          role: 1,
          failedOtpAttempt: 1,
          failedOtpVerifyAt: 1,
          otpSentedAt: 1,
          otp: 1,
        }
      );

      if (!user) {
        return reject({
          message: 'User not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      if (
        user.failedOtpAttempt < MIN_OTP_FAILED_ATTEMPT ||
        (user.failedOtpVerifyAt &&
          new Date().getTime() - user.failedOtpVerifyAt.getTime() >
          OTP_FAILED_RESET_TIME * 60 * 60 * 1000)
      ) {
        if (user.failedOtpAttempt === MIN_OTP_FAILED_ATTEMPT) {
          user.failedOtpAttempt = 0;
        }
        if (
          user.otpSentedAt &&
          new Date().getTime() - user.otpSentedAt.getTime() <
          OTP_EXPIRE_TIME * 60 * 1000
        ) {
          const valid = await user.matchOTP(otp.toString());
          if (valid) {
            await user.setOTP();

            const accessToken = await generateToken({
              id: user._id.toString(),
              name: user.name,
              role: user.role,
              type: 'AccessToken',
            });

            return resolve({
              message: 'OTP Verified',
              results: {
                verified: true,
                token: !isVerification ? accessToken : undefined,
              },
            });
          }
          user.failedOtpAttempt += 1;
          user.failedOtpVerifyAt = new Date();
          await user.save();
        } else {
          await user.setOTP();
          throw new ThrowError('OTP Expired', HttpStatusCode.UNAUTHORIZED);
        }
      } else {
        throw new ThrowError(
          `Incorrect otp attempt reached ${MIN_OTP_FAILED_ATTEMPT} times, so try after 2 hour`,
          HttpStatusCode.UNAUTHORIZED
        );
      }
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User otp verification failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To add a new user
 * @param newUser { IUser }
 * @returns IUser
 */
export const addUser = (newUser: IUser) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (
        !newUser.name ||
        !newUser.username ||
        !newUser.phone ||
        !newUser.email
      ) {
        return reject({
          message: 'Please provide valid name, username, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isUserFound: IUser[] = await User.find({
        $or: [
          { username: newUser.username.toLocaleLowerCase() },
          { phone: newUser.phone },
          { email: newUser.email.toLocaleLowerCase() },
        ],
      });

      if (isUserFound.length > 0) {
        return reject({
          message:
            isUserFound[0].username == newUser.username
              ? 'Username already exist'
              : isUserFound[0].phone == newUser.phone
                ? 'Phone number already exist'
                : 'Email already exist',
        });
      }

      const userPassword = newUser.password || generatePassword();

      console.log(userPassword);

      const user = new User({
        name: newUser.name,
        username: newUser.username.toLocaleLowerCase(),
        phone: newUser.phone,
        email: newUser.email.toLocaleLowerCase(),
        autoGeneratedPasswd: newUser.password ? false : true,
        password: userPassword,
        otp: generateOTP(),
        role: UserRoles.USER,
        lastSync: new Date(),
        lastUsed: new Date(),
      });

      const editedUser = await user.save();

      resolve({
        message: `${editedUser.username}'s account created successfully`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User registration failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To register a new user
 * @param newUser { IUser }
 * @returns IUser
 */
export const userRegistration = (newUser: IUser) => {
  return new Promise<ILoginResponse>(async (resolve, reject) => {
    try {
      if (
        !newUser.name ||
        !newUser.username ||
        !newUser.phone ||
        !newUser.email ||
        !newUser.password
      ) {
        return reject({
          message:
            'Please provide valid name, username, phone, email and password',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isUserFound: IUser[] = await User.find({
        $or: [
          { username: newUser.username.toLocaleLowerCase() },
          { phone: newUser.phone },
          { email: newUser.email.toLocaleLowerCase() },
        ],
      });

      if (isUserFound.length > 0) {
        return reject({
          message:
            isUserFound[0].username == newUser.username
              ? 'Username already exist'
              : isUserFound[0].phone == newUser.phone
                ? 'Phone number already exist'
                : 'Email already exist',
        });
      }

      const user = new User({
        name: newUser.name,
        username: newUser.username.toLocaleLowerCase(),
        phone: newUser.phone,
        email: newUser.email.toLocaleLowerCase(),
        autoGeneratedPasswd: newUser.password ? false : true,
        password: newUser.password,
        otp: generateOTP(),
        role: UserRoles.USER,
        lastSync: new Date(),
        lastUsed: new Date(),
      });

      const editedUser = await user.save();

      const accessToken = await generateToken({
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        type: 'AccessToken',
      });

      const refreshToken = await generateToken({
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        type: 'RefreshToken',
      });

      resolve({
        message: 'Registration Success',
        results: { accessToken, refreshToken },
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular user details
 * @param userId
 * @param newUser
 * @returns IUser
 */
export const editUser = (userId: IUser['_id'], data: IUser) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide vaild user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        password: 1,
        status: 1,
        createdAt: 1,
      });

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      const { name, username, email, phone, password } = data;

      // New username is already exist from another user then
      if (username && user.username != username) {
        const userExists = await User.findOne({ username });
        if (userExists)
          throw new ThrowError(
            'Email already exist for other user',
            HttpStatusCode.BAD_REQUEST
          );
      }

      // New email is already exist from another user then
      if (email && user.email != email) {
        const userExists = await User.findOne({ email });
        if (userExists)
          throw new ThrowError(
            'Email already exist for other user',
            HttpStatusCode.BAD_REQUEST
          );
      }

      // New phone is already exist from another user then
      if (phone && user.phone != phone) {
        const userExists = await User.findOne({ phone });
        if (userExists)
          throw new ThrowError(
            'Phone already exist for other user',
            HttpStatusCode.BAD_REQUEST
          );
      }

      user.name = name || user.name;
      user.username = username || user.username;
      user.email = email || user.email;
      user.phone = phone || user.phone;

      const editedUser = await user.save();

      if (password) {
        editedUser.changePassword(password);
        user.password = 'HIDDEN';
        user.lastPassword = undefined;
        user.passwordChangedAt = undefined;

        // sendMail("SendCredentials", {
        //   name: user.name,
        //   email: user.email,
        //   phone: user.phone,
        //   role: user.role,
        //   password: password,
        // })
        //   .then()
        //   .catch();
      }

      resolve({
        message: `User edited successfully`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To update a user profile
 * @param {String} userId
 * @param data
 * @returns IUser
 */
export const updateUserProfile = (userId: IUser['_id'], data: IUser) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide vaild user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // Update a values in db
      user.name = name || user.name;

      const updatedUser = await user.save();

      resolve({
        message: `Profile Updated Successfully`,
        results: updatedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User profile updation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To send a login credentials to user's email
 * @param {String} userId
 * @returns IUser
 */
export const sentLoginCredentials = (userId: IUser['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide vaild user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.BAD_REQUEST);

      const userPassword = generatePassword();
      user.password = userPassword;
      console.log(user.password);
      await user.save();

      // sendMail("SendCredentials", {
      //   name: user.name,
      //   email: user.email,
      //   phone: user.phone,
      //   role: user.role,
      //   password: userPassword,
      // })
      //   .then()
      //   .catch();
      resolve({
        message: `Login credential sended to user's mail ${user.email}`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Login credential sending failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular user's username
 * @param userId
 * @param newUsername
 * @returns IUser
 */
export const changeUserUsername = (
  userId: IUser['_id'],
  newUsername: IUser['username']
) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!newUsername || !userId || !isValidObjectId(userId))
        throw new ThrowError(
          !newUsername
            ? 'Provide new username'
            : !userId
              ? 'Provide userId'
              : 'UserId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      if (user.username === newUsername)
        throw new ThrowError(
          'Old and new username must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isUsernameFound = await User.find({ username: newUsername });

      if (isUsernameFound.length > 0)
        throw new ThrowError(
          'New username already exist for other user',
          HttpStatusCode.BAD_REQUEST
        );

      user.username = newUsername;
      const editedUser = await user.save();
      resolve({
        message: `${editedUser.name}'s username was changed to ${user.username}`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Username changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular user's email
 * @param userId
 * @param newEmail
 * @returns IUser
 */
export const changeUserEmail = (
  userId: IUser['_id'],
  newEmail: IUser['email']
) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId) || !newEmail)
        throw new ThrowError(
          !newEmail
            ? 'Provide new email id'
            : !userId
              ? 'Provide userId'
              : 'UserId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      if (user.email === newEmail)
        throw new ThrowError(
          'Old and new email must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isEmailFound = await User.find({ email: newEmail });

      if (isEmailFound.length > 0) {
        throw new ThrowError(
          'New email already exist for other user',
          HttpStatusCode.BAD_REQUEST
        );
      }

      user.email = newEmail;
      const editedUser = await user.save();
      resolve({
        message: `${editedUser.name}'s email id was changed to ${user.email}`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Email changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular user's phone
 * @param userId
 * @param newPhone
 * @returns IUser
 */
export const changeUserPhone = (
  userId: IUser['_id'],
  newPhone: IUser['phone']
) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (
        !newPhone ||
        (newPhone && isNaN(Number(newPhone))) ||
        !userId ||
        !isValidObjectId(userId)
      )
        throw new ThrowError(
          'Provide new valid phone number',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      if (user.phone === newPhone)
        throw new ThrowError(
          'Old and new phone must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isPhoneFound = await User.find({ phone: newPhone });

      if (isPhoneFound.length > 0)
        throw new ThrowError(
          'New Phone number already exists',
          HttpStatusCode.NOT_FOUND
        );

      user.phone = newPhone;
      const editedUser = await user.save();

      resolve({
        message: `${editedUser.name}'s phone number was changed to ${user.phone}`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Phone changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular user's status
 * @param userId
 * @returns IUser
 */
export const changeUserStatus = (
  userId: IUser['_id'],
  status: IUser['status']
) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (
        !userId ||
        !isValidObjectId(userId) ||
        !['Active', 'Inactive', 'Blocked'].includes(status)
      )
        throw new ThrowError(
          'Provide vaild user id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findById(userId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      user.status = status || user.status;
      const editedUser = await user.save();

      resolve({
        message: `${editedUser.name} status changed to ${editedUser.status}`,
        results: editedUser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Status changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular user's password
 * @param userId
 * @param currentPassword
 * @param newPassword
 * @returns IUser
 */
export const changeUserPassword = (
  userId: IUser['_id'],
  currentPassword: IUser['password'],
  newPassword: IUser['password']
) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (
        !userId ||
        !isValidObjectId(userId) ||
        !newPassword ||
        !currentPassword
      )
        throw new ThrowError(
          !newPassword
            ? 'Provide new password'
            : !currentPassword
              ? 'Provide current password'
              : !userId
                ? 'Provide userId'
                : 'UserId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne({ _id: userId }, { password: 1 });

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.BAD_REQUEST);

      const isPasswordMatched = await user.matchPasswords(currentPassword);

      if (!isPasswordMatched) {
        throw new ThrowError(
          'Current Password does not match',
          HttpStatusCode.UNAUTHORIZED
        );
      }
      if (currentPassword === newPassword) {
        throw new ThrowError(
          'Current and New password does not be same',
          HttpStatusCode.BAD_REQUEST
        );
      }

      await user.changePassword(newPassword);
      resolve({
        message: `Password changed successfully`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Password changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To send a reset link to email
 * @param {String} email
 * @returns IUser
 */
export const forgotUserPassword = (email: IUser['email']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!email)
        throw new ThrowError(
          'Please Provide Email',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne(
        { email },
        {
          code: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
        }
      );

      if (user) {
        user.resetPasswordAccess = true;
        await user.save();

        const token = await generateToken({
          id: user._id.toString(),
          name: user.name,
          role: user.role,
          type: 'ResetToken',
        });

        console.log(token);

        // await sendMail("ResetPassword", {
        //   token,
        //   name: user.name,
        //   email: user.email,
        // })
        //   .then()
        //   .catch();
      }

      resolve({
        message: `If your email exist,then the Password reset link will be sent to your email`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Forget password failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
/**
 * To reset a password using token
 * @param {String} token
 * @param {String} password
 * @returns IUser
 */
export const resetUserPassword = (token: string, password: string) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!token || !password)
        throw new ThrowError(
          'Please Provide Token and Password',
          HttpStatusCode.BAD_REQUEST
        );

      const decoded = await verifyToken(token, 'ResetToken');
      if (decoded && decoded.id) {
        const userFound = await User.findOne(
          {
            _id: decoded.id,
            resetPasswordAccess: true,
          },
          {
            password: 1,
            resetPasswordAccess: 1,
          }
        );
        if (userFound) {
          const isMatch = await userFound.matchPasswords(password);
          if (isMatch) {
            throw new ThrowError(
              'New Pasword and Old Password is Same',
              HttpStatusCode.BAD_REQUEST
            );
          } else {
            userFound.password = password;
            userFound.resetPasswordAccess = false;
            await userFound.save();
            return resolve({
              message: 'Password Reset Successfully',
            });
          }
        } else {
          throw new ThrowError(
            'Reset Password Permission Denied',
            HttpStatusCode.UNAUTHORIZED
          );
        }
      } else {
        throw new ThrowError(
          'Incorrect Credentials',
          HttpStatusCode.UNAUTHORIZED
        );
      }
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Password regeneration failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To check a particular user's status
 * @param userId
 * @returns IUser
 */
export const checkUserStatus = (
  userId: IUser['_id'],
  status: IUser['status'][]
) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId) || status.length <= 0)
        throw new ThrowError(
          'Provide vaild user id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne(
        { _id: userId, isDeleted: false },
        {
          code: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
        }
      );

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      if (user.status === IAccountStatus.INACTIVE)
        user.status = IAccountStatus.ACTIVE;
      user.lastUsed = new Date();
      const editedUser = await user.save();

      if (status.includes(user.status)) {
        return resolve({
          message: `User is ${user.status}`,
          results: editedUser,
        });
      } else {
        throw new ThrowError(
          `User is ${user.status}`,
          HttpStatusCode.UNAUTHORIZED
        );
      }
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Status checking failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To check username is avilable
 * @param username
 * @returns IUser
 */
export const checkUserUsername = (username: IUser['username']) => {
  return new Promise<ICheckUsername>(async (resolve, reject) => {
    try {
      if (!username)
        throw new ThrowError('Provide Username', HttpStatusCode.BAD_REQUEST);

      const isUsernameAvailable = await User.find({ username });

      resolve({
        message: `Username is ${isUsernameAvailable.length > 0 ? 'available' : 'not available'
          }`,
        available: isUsernameAvailable.length > 0 ? true : false,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Username checking failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To update particular user profile
 * @param userId
 * @returns message
 */
export const deleteUser = (userId: IUser['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide valid user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne({
        _id: userId,
        isDeleted: false,
      });

      if (!user)
        throw new ThrowError('User Not Found', HttpStatusCode.NOT_FOUND);

      user.status = IAccountStatus.INACTIVE;
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();

      resolve({
        message: `${user.username} user was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To restore a user
 * @param userId
 * @returns message
 */
export const restoreUser = (userId: IUser['_id']) => {
  return new Promise<IUserResponse>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide valid user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne(
        {
          _id: userId,
          isDeleted: true,
        },
        { name: 1, username: 1, email: 1, phone: 1, status: 1, createdAt: 1 }
      );

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      user.status = IAccountStatus.ACTIVE;
      user.isDeleted = false;
      user.deletedAt = undefined;

      const editeduser = await user.save();

      resolve({
        message: `${editeduser.username} user was restored`,
        results: editeduser,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'User restore failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete a user parmanently
 * @param userId
 * @returns message
 */
export const pDeleteUser = (userId: IUser['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!userId || !isValidObjectId(userId))
        throw new ThrowError(
          'Provide valid user id',
          HttpStatusCode.BAD_REQUEST
        );

      const user = await User.findOne(
        {
          _id: userId,
          isDeleted: true,
        },
        { name: 1, username: 1, email: 1, phone: 1, status: 1, createdAt: 1 }
      );

      if (!user)
        throw new ThrowError('User not found', HttpStatusCode.NOT_FOUND);

      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await user.deleteOne();
      resolve({
        message: `${user.username} user was deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'User permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete all user parmanently
 * @returns message
 */
export const deleteAllUsers = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await User.deleteMany({ role: UserRoles.USER });

      resolve({
        message: `All user deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'User permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
