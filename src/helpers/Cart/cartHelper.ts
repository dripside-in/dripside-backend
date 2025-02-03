import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IGetCartsResponse,
  IResponseData,
  ICart,
  ICartResponse,
  IStatus,
} from '../../interfaces';
import { Cart } from '../../models';
import { IDeleted } from '../../types';
import { ThrowError } from '../../classes';
import { config } from '../../config';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;

/**
 * To get all carts except deleted carts
 * @returns ICart[]
 */
export const getCarts = (
  timestamp?: string,
  page?: string,
  limit?: string,
  code?: string,
  name?: string,
  status?: IStatus[],
  deleted: IDeleted = 'NO'
) => {
  return new Promise<IGetCartsResponse>(async (resolve, reject) => {
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
      const codeQuery = code ? { code: new RegExp(code, 'i') } : {};
      const nameQuery = name ? { name: new RegExp(name, 'i') } : {};
      const statusQuery = status ? { status: status } : {};
      const deleteQuery =
        deleted != 'BOTH' ? { isDeleted: deleted === 'YES' } : {};
      const deleteProjection =
        deleted === 'BOTH' || deleted === 'YES'
          ? { isDeleted: 1, deletedAt: 1 }
          : {};

      // find condition
      const findCondition = {
        ...codeQuery,
        ...nameQuery,
        ...statusQuery,
        ...deleteQuery,
      };

      const carts = await Cart.find(
        { ...findCondition, ...timestampLTEQuery },
        {
          code: 1,
          name: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT === -1 ? 0 : LIMIT)
        .skip(LIMIT === -1 ? 0 : LIMIT * (PAGE - 1));

      const totalCount = await Cart.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await Cart.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: carts.length > 0 ? 'Carts fetched' : 'Cart is empty',
        currentPage: PAGE,
        results: carts,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular cart by id
 * @param cartId
 * @returns ICart
 */
export const getCartById = (cartId: ICart['_id'], role?: string) => {
  return new Promise<ICartResponse>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId)) {
        return reject({
          message: !cartId ? 'Provide cartId' : 'cartId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperCart', 'DeveloperCart'].includes(
        role ?? ''
      )
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperCart', 'DeveloperCart'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const cart = await Cart.findOne(
        { _id: cartId, ...deleteQuery },
        {
          code: 1,
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      );

      if (!cart) {
        return reject({
          message: 'Cart not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'Cart details fetched',
        results: cart,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To add a new cart
 * @param newCart { ICart }
 * @returns ICart
 */
export const addCart = (newCart: ICart) => {
  return new Promise<ICartResponse>(async (resolve, reject) => {
    try {
      if (!newCart.name) {
        return reject({
          message: 'Please provide valid name, name, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isCartFound: ICart[] = await Cart.find({
        $or: [{ name: newCart.name }],
      });

      if (isCartFound.length > 0) {
        return reject({
          message: 'Name already exist',
        });
      }

      const cart = new Cart({
        name: newCart.name,
      });

      const editedCart = await cart.save();

      resolve({
        message: `${editedCart.name}'s account created successfully`,
        results: editedCart,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular cart details
 * @param cartId
 * @param newCart
 * @returns ICart
 */
export const editCart = (cartId: ICart['_id'], data: ICart) => {
  return new Promise<ICartResponse>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId))
        throw new ThrowError(
          'Provide vaild cart id',
          HttpStatusCode.BAD_REQUEST
        );

      const cart = await Cart.findById(cartId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!cart)
        throw new ThrowError('Cart not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // New name is already exist from another cart then
      if (name && cart.name != name) {
        const cartExists = await Cart.findOne({ name });
        if (cartExists)
          throw new ThrowError(
            'Email already exist for other cart',
            HttpStatusCode.BAD_REQUEST
          );
      }

      cart.name = name || cart.name;

      const editedCart = await cart.save();

      resolve({
        message: `Cart edited successfully`,
        results: editedCart,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular cart's status
 * @param cartId
 * @returns ICart
 */
export const changeCartStatus = (cartId: ICart['_id']) => {
  return new Promise<ICartResponse>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId))
        throw new ThrowError(
          'Provide vaild cart id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const cart = await Cart.findById(cartId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!cart)
        throw new ThrowError('Cart not found', HttpStatusCode.NOT_FOUND);

      cart.status =
        cart.status === IStatus.ACTIVE ? IStatus.INACTIVE : IStatus.ACTIVE;
      const editedCart = await cart.save();

      resolve({
        message: `${editedCart.name} status changed to ${editedCart.status}`,
        results: editedCart,
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
 * To update particular cart profile
 * @param cartId
 * @returns message
 */
export const deleteCart = (cartId: ICart['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId))
        throw new ThrowError(
          'Provide valid cart id',
          HttpStatusCode.BAD_REQUEST
        );

      const cart = await Cart.findOne({
        _id: cartId,
        isDeleted: false,
      });

      if (!cart)
        throw new ThrowError('Cart Not Found', HttpStatusCode.NOT_FOUND);

      cart.status = IStatus.INACTIVE;
      cart.isDeleted = true;
      cart.deletedAt = new Date();
      await cart.save();

      resolve({
        message: `${cart.name} cart was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To restore a cart
 * @param cartId
 * @returns message
 */
export const restoreCart = (cartId: ICart['_id']) => {
  return new Promise<ICartResponse>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId))
        throw new ThrowError(
          'Provide valid cart id',
          HttpStatusCode.BAD_REQUEST
        );

      const cart = await Cart.findOne(
        {
          _id: cartId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!cart)
        throw new ThrowError('Cart not found', HttpStatusCode.NOT_FOUND);

      cart.status = IStatus.ACTIVE;
      cart.isDeleted = false;
      cart.deletedAt = undefined;

      const editedcart = await cart.save();

      resolve({
        message: `${editedcart.name} cart was restored`,
        results: editedcart,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Cart restore failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete a cart parmanently
 * @param cartId
 * @returns message
 */
export const pDeleteCart = (cartId: ICart['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!cartId || !isValidObjectId(cartId))
        throw new ThrowError(
          'Provide valid cart id',
          HttpStatusCode.BAD_REQUEST
        );

      const cart = await Cart.findOne(
        {
          _id: cartId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!cart)
        throw new ThrowError('Cart not found', HttpStatusCode.NOT_FOUND);

      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await cart.deleteOne();
      resolve({
        message: `${cart.name} cart was deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Cart permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete all cart parmanently
 * @returns message
 */
export const deleteAllCarts = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await Cart.deleteMany({});

      resolve({
        message: `All cart deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Cart permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
