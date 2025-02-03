import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IAdmin,
  IGetAdminsResponse,
  IAdminResponse,
  AdminRoles,
  IResponseData,
  ILoginResponse,
  ICheckUsername,
  IAccountStatus,
} from '../../interfaces';
import { Admin } from '../../models';
import { config } from '../../config';
import { generatePassword } from '../../functions';
import { IDeleted } from '../../types';
import { ThrowError } from '../../classes';
import { generateToken, verifyToken } from '../../utils';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;

/**
 * To get all admins except deleted admins
 * @returns IAdmin[]
 */
export const getAdmins = (
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
  return new Promise<IGetAdminsResponse>(async (resolve, reject) => {
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

      const admins = await Admin.find(
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

      const totalCount = await Admin.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await Admin.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: admins.length > 0 ? 'Admins fetched' : 'Admin is empty',
        currentPage: PAGE,
        results: admins,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular admin by id
 * @param adminId
 * @returns IAdmin
 */
export const getAdminById = (adminId: IAdmin['_id'], role?: string) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId)) {
        return reject({
          message: !adminId ? 'Provide adminId' : 'adminId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperAdmin', 'DeveloperAdmin'].includes(role ?? '')
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperAdmin', 'DeveloperAdmin'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const admin = await Admin.findOne(
        { _id: adminId, ...deleteQuery },
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

      if (!admin) {
        return reject({
          message: 'Admin not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'Admin details fetched',
        results: admin,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To login a admin's account by email and password
 * @param {String} username
 * @param {String} email
 * @param {String} phone
 * @param {String} password
 * @returns {String} token
 */
export const adminLogin = (
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
          `Provide ${
            email ? 'Email' : phone ? 'Phone' : 'Username'
          } and password`,
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne(
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

      if (!admin)
        throw new ThrowError(
          `Invalid ${
            email ? 'Email' : phone ? 'Phone' : 'Username'
          } or Password`,
          HttpStatusCode.UNAUTHORIZED
        );

      if (admin.status === 'Blocked')
        throw new ThrowError(`Account blocked! contact Customer Care`, 401);

      if (admin && (await admin.matchPasswords(password))) {
        if (admin.status === IAccountStatus.INACTIVE)
          admin.status = IAccountStatus.ACTIVE;
        if (admin.passwordChanged) admin.passwordChanged = false;
        admin.lastSync = new Date();
        admin.lastUsed = new Date();

        await admin.save();

        const accessToken = await generateToken({
          id: admin._id.toString(),
          name: admin.name,
          role: admin.role,
          type: 'AccessToken',
        });

        const refreshToken = await generateToken({
          id: admin._id.toString(),
          name: admin.name,
          role: admin.role,
          type: 'RefreshToken',
        });

        resolve({
          message: 'Login Success',
          results: { accessToken, refreshToken },
        });
      } else {
        throw new ThrowError(
          `Invalid ${!email ? 'Phone' : 'Email'} or Password`,
          HttpStatusCode.UNAUTHORIZED
        );
      }
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin login failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To upgrade a admin's access token by refresh token
 * @param {String} token
 * @returns
 */
export const upgradeAdminAccessToken = (refreshToken: string) => {
  return new Promise<ILoginResponse>(async (resolve, reject) => {
    try {
      if (!refreshToken)
        throw new ThrowError(
          `Please Provide a Token`,
          HttpStatusCode.BAD_REQUEST
        );
      // const adminRefreshToken = await RefreshToken.findOne({ refreshToken });
      // if (adminRefreshToken) {
      //   const attempt: number = (adminRefreshToken.attempt ?? 0) + 1;
      //   const decoded = await verifyJwtToken(token, 'REFRESH_TOKEN');

      //  Check Admin Status

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
      // adminRefreshToken.refreshToken = refreshToken;
      // await adminRefreshToken.save()

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
 * To add a new admin
 * @param newAdmin { IAdmin }
 * @returns IAdmin
 */
export const addAdmin = (newAdmin: IAdmin) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (
        !newAdmin.name ||
        !newAdmin.username ||
        !newAdmin.phone ||
        !newAdmin.email
      ) {
        return reject({
          message: 'Please provide valid name, username, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isAdminFound: IAdmin[] = await Admin.find({
        $or: [
          { username: newAdmin.username.toLocaleLowerCase() },
          { phone: newAdmin.phone },
          { email: newAdmin.email.toLocaleLowerCase() },
        ],
      });

      if (isAdminFound.length > 0) {
        return reject({
          message:
            isAdminFound[0].username == newAdmin.username
              ? 'Username already exist'
              : isAdminFound[0].phone == newAdmin.phone
              ? 'Phone number already exist'
              : 'Email already exist',
        });
      }

      const adminPassword = newAdmin.password || generatePassword();

      console.log(adminPassword);

      const admin = new Admin({
        name: newAdmin.name,
        username: newAdmin.username.toLocaleLowerCase(),
        phone: newAdmin.phone,
        email: newAdmin.email.toLocaleLowerCase(),
        autoGeneratedPasswd: newAdmin.password ? false : true,
        password: adminPassword,
        role: AdminRoles.ADMIN,
        lastSync: new Date(),
        lastUsed: new Date(),
      });

      const editedAdmin = await admin.save();

      // sendMail("SendCredentials", {
      //   name: editedAdmin.name,
      //   email: editedAdmin.email,
      //   phone: editedAdmin.phone,
      //   role: editedAdmin.role,
      //   password: adminPassword,
      // })
      //   .then()
      //   .catch();

      resolve({
        message: `${editedAdmin.username}'s account created successfully`,
        results: editedAdmin,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular admin details
 * @param adminId
 * @param newAdmin
 * @returns IAdmin
 */
export const editAdmin = (adminId: IAdmin['_id'], data: IAdmin) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide vaild admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      const { name, username, email, phone, password } = data;

      // New username is already exist from another admin then
      if (username && admin.username != username) {
        const adminExists = await Admin.findOne({ username });
        if (adminExists)
          throw new ThrowError(
            'Email already exist for other admin',
            HttpStatusCode.BAD_REQUEST
          );
      }

      // New email is already exist from another admin then
      if (email && admin.email != email) {
        const adminExists = await Admin.findOne({ email });
        if (adminExists)
          throw new ThrowError(
            'Email already exist for other admin',
            HttpStatusCode.BAD_REQUEST
          );
      }

      // New phone is already exist from another admin then
      if (phone && admin.phone != phone) {
        const adminExists = await Admin.findOne({ phone });
        if (adminExists)
          throw new ThrowError(
            'Phone already exist for other admin',
            HttpStatusCode.BAD_REQUEST
          );
      }

      admin.name = name || admin.name;
      admin.username = username || admin.username;
      admin.email = email || admin.email;
      admin.phone = phone || admin.phone;

      if (password) {
        admin.changePassword(password);
        // sendMail("SendCredentials", {
        //   name: admin.name,
        //   email: admin.email,
        //   phone: admin.phone,
        //   role: admin.role,
        //   password: password,
        // })
        //   .then()
        //   .catch();
      }

      const editedAdmin = await admin.save();

      resolve({
        message: `Admin edited successfully`,
        results: editedAdmin,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To update a admin profile
 * @param {String} adminId
 * @param data
 * @returns IAdmin
 */
export const updateAdminProfile = (adminId: IAdmin['_id'], data: IAdmin) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide vaild admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // Update a values in db
      admin.name = name || admin.name;

      const updatedAdmin = await admin.save();

      resolve({
        message: `Profile Updated Successfully`,
        results: updatedAdmin,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin profile updation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To send a login credentials to admin's email
 * @param {String} adminId
 * @returns IAdmin
 */
export const sentLoginCredentials = (adminId: IAdmin['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide vaild admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.BAD_REQUEST);

      const adminPassword = generatePassword();
      admin.password = adminPassword;
      console.log(admin.password);
      await admin.save();

      // sendMail("SendCredentials", {
      //   name: admin.name,
      //   email: admin.email,
      //   phone: admin.phone,
      //   role: admin.role,
      //   password: adminPassword,
      // })
      //   .then()
      //   .catch();
      resolve({
        message: `Login credential sended to admin's mail ${admin.email}`,
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
 * To change a particular admin's username
 * @param adminId
 * @param newUsername
 * @returns IAdmin
 */
export const changeAdminUsername = (
  adminId: IAdmin['_id'],
  newUsername: IAdmin['username']
) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!newUsername || !adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          !newUsername
            ? 'Provide new username'
            : !adminId
            ? 'Provide adminId'
            : 'AdminId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      if (admin.username === newUsername)
        throw new ThrowError(
          'Old and new username must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isUsernameFound = await Admin.find({ username: newUsername });

      if (isUsernameFound.length > 0)
        throw new ThrowError(
          'New username already exist for other admin',
          HttpStatusCode.BAD_REQUEST
        );

      admin.username = newUsername;
      const editedAdmin = await admin.save();
      resolve({
        message: `${editedAdmin.name}'s username was changed to ${admin.username}`,
        results: editedAdmin,
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
 * To change a particular admin's email
 * @param adminId
 * @param newEmail
 * @returns IAdmin
 */
export const changeAdminEmail = (
  adminId: IAdmin['_id'],
  newEmail: IAdmin['email']
) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId) || !newEmail)
        throw new ThrowError(
          !newEmail
            ? 'Provide new email id'
            : !adminId
            ? 'Provide adminId'
            : 'AdminId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      if (admin.email === newEmail)
        throw new ThrowError(
          'Old and new email must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isEmailFound = await Admin.find({ email: newEmail });

      if (isEmailFound.length > 0) {
        throw new ThrowError(
          'New email already exist for other admin',
          HttpStatusCode.BAD_REQUEST
        );
      }

      admin.email = newEmail;
      const editedAdmin = await admin.save();
      resolve({
        message: `${editedAdmin.name}'s email id was changed to ${admin.email}`,
        results: editedAdmin,
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
 * To change a particular admin's phone
 * @param adminId
 * @param newPhone
 * @returns IAdmin
 */
export const changeAdminPhone = (
  adminId: IAdmin['_id'],
  newPhone: IAdmin['phone']
) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (
        !newPhone ||
        (newPhone && isNaN(Number(newPhone))) ||
        !adminId ||
        !isValidObjectId(adminId)
      )
        throw new ThrowError(
          'Provide new valid phone number',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });
      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      if (admin.phone === newPhone)
        throw new ThrowError(
          'Old and new phone must be different',
          HttpStatusCode.BAD_REQUEST
        );

      const isPhoneFound = await Admin.find({ phone: newPhone });

      if (isPhoneFound.length > 0)
        throw new ThrowError(
          'New Phone number already exists',
          HttpStatusCode.NOT_FOUND
        );

      admin.phone = newPhone;
      const editedAdmin = await admin.save();

      resolve({
        message: `${editedAdmin.name}'s phone number was changed to ${admin.phone}`,
        results: editedAdmin,
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
 * To change a particular admin's status
 * @param adminId
 * @returns IAdmin
 */
export const changeAdminStatus = (
  adminId: IAdmin['_id'],
  status: IAdmin['status']
) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (
        !adminId ||
        !isValidObjectId(adminId) ||
        !['Active', 'Inactive', 'Blocked'].includes(status)
      )
        throw new ThrowError(
          'Provide vaild admin id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findById(adminId, {
        code: 1,
        name: 1,
        username: 1,
        email: 1,
        phone: 1,
        status: 1,
        createdAt: 1,
      });

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      admin.status = status || admin.status;
      const editedAdmin = await admin.save();

      resolve({
        message: `${editedAdmin.name} status changed to ${editedAdmin.status}`,
        results: editedAdmin,
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
 * To change a particular admin's password
 * @param adminId
 * @param currentPassword
 * @param newPassword
 * @returns IAdmin
 */
export const changeAdminPassword = (
  adminId: IAdmin['_id'],
  currentPassword: IAdmin['password'],
  newPassword: IAdmin['password']
) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (
        !adminId ||
        !isValidObjectId(adminId) ||
        !newPassword ||
        !currentPassword
      )
        throw new ThrowError(
          !newPassword
            ? 'Provide new password'
            : !currentPassword
            ? 'Provide current password'
            : !adminId
            ? 'Provide adminId'
            : 'AdminId not Valid',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne({ _id: adminId }, { password: 1 });

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.BAD_REQUEST);

      const isPasswordMatched = await admin.matchPasswords(currentPassword);

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

      await admin.changePassword(newPassword);
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
 * @returns IAdmin
 */
export const forgotAdminPassword = (email: IAdmin['email']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!email)
        throw new ThrowError(
          'Please Provide Email',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne(
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

      if (admin) {
        admin.resetPasswordAccess = true;
        await admin.save();

        const token = await generateToken({
          id: admin._id.toString(),
          name: admin.name,
          role: admin.role,
          type: 'ResetToken',
        });

        console.log(token);

        // await sendMail("ResetPassword", {
        //   token,
        //   name: admin.name,
        //   email: admin.email,
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
 * @returns IAdmin
 */
export const resetAdminPassword = (token: string, password: string) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!token || !password)
        throw new ThrowError(
          'Please Provide Token and Password',
          HttpStatusCode.BAD_REQUEST
        );

      const decoded = await verifyToken(token, 'ResetToken');
      if (decoded && decoded.id) {
        const adminFound = await Admin.findOne(
          {
            _id: decoded.id,
            resetPasswordAccess: true,
          },
          {
            password: 1,
            resetPasswordAccess: 1,
          }
        );
        if (adminFound) {
          const isMatch = await adminFound.matchPasswords(password);
          if (isMatch) {
            throw new ThrowError(
              'New Pasword and Old Password is Same',
              HttpStatusCode.BAD_REQUEST
            );
          } else {
            adminFound.password = password;
            adminFound.resetPasswordAccess = false;
            await adminFound.save();
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
 * To check a particular admin's status
 * @param adminId
 * @returns IAdmin
 */
export const checkAdminStatus = (
  adminId: IAdmin['_id'],
  status: IAdmin['status'][]
) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId) || status.length <= 0)
        throw new ThrowError(
          'Provide vaild admin id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne(
        { _id: adminId, isDeleted: false },
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

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      if (admin.status === IAccountStatus.INACTIVE)
        admin.status = IAccountStatus.ACTIVE;
      admin.lastUsed = new Date();
      const editedAdmin = await admin.save();

      if (status.includes(admin.status)) {
        return resolve({
          message: `Admin is ${admin.status}`,
          results: editedAdmin,
        });
      } else {
        throw new ThrowError(
          `Admin is ${admin.status}`,
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
 * @returns IAdmin
 */
export const checkAdminUsername = (username: IAdmin['username']) => {
  return new Promise<ICheckUsername>(async (resolve, reject) => {
    try {
      if (!username)
        throw new ThrowError('Provide Username', HttpStatusCode.BAD_REQUEST);

      const isUsernameAvailable = await Admin.find({ username });

      resolve({
        message: `Username is ${
          isUsernameAvailable.length > 0 ? 'available' : 'not available'
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
 * To update particular admin profile
 * @param adminId
 * @returns message
 */
export const deleteAdmin = (adminId: IAdmin['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide valid admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne({
        _id: adminId,
        isDeleted: false,
      });

      if (!admin)
        throw new ThrowError('Admin Not Found', HttpStatusCode.NOT_FOUND);

      admin.status = IAccountStatus.INACTIVE;
      admin.isDeleted = true;
      admin.deletedAt = new Date();
      await admin.save();

      resolve({
        message: `${admin.username} admin was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To restore a admin
 * @param adminId
 * @returns message
 */
export const restoreAdmin = (adminId: IAdmin['_id']) => {
  return new Promise<IAdminResponse>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide valid admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne(
        {
          _id: adminId,
          isDeleted: true,
        },
        { name: 1, username: 1, email: 1, phone: 1, status: 1, createdAt: 1 }
      );

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      admin.status = IAccountStatus.ACTIVE;
      admin.isDeleted = false;
      admin.deletedAt = undefined;

      const editedadmin = await admin.save();

      resolve({
        message: `${editedadmin.username} admin was restored`,
        results: editedadmin,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Admin restore failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete a admin parmanently
 * @param adminId
 * @returns message
 */
export const pDeleteAdmin = (adminId: IAdmin['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!adminId || !isValidObjectId(adminId))
        throw new ThrowError(
          'Provide valid admin id',
          HttpStatusCode.BAD_REQUEST
        );

      const admin = await Admin.findOne(
        {
          _id: adminId,
          isDeleted: true,
        },
        { name: 1, username: 1, email: 1, phone: 1, status: 1, createdAt: 1 }
      );

      if (!admin)
        throw new ThrowError('Admin not found', HttpStatusCode.NOT_FOUND);

      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await admin.deleteOne();
      resolve({
        message: `${admin.username} admin was deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Admin permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete all admin parmanently
 * @returns message
 */
export const deleteAllAdmins = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await Admin.deleteMany({ role: AdminRoles.ADMIN });

      resolve({
        message: `All admin deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Admin permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
