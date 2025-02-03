import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IGetCategorysResponse,
  IResponseData,
  ICategory,
  ICategoryResponse,
  IStatus,
} from '../../interfaces';
import { Category } from '../../models';
import { IDeleted } from '../../types';
import { ThrowError } from '../../classes';
import { config } from '../../config';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;

/**
 * To get all categorys except deleted categorys
 * @returns ICategory[]
 */
export const getCategorys = (
  timestamp?: string,
  page?: string,
  limit?: string,
  code?: string,
  name?: string,
  status?: IStatus[],
  deleted: IDeleted = 'NO'
) => {
  return new Promise<IGetCategorysResponse>(async (resolve, reject) => {
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

      const categorys = await Category.find(
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

      const totalCount = await Category.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await Category.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: categorys.length > 0 ? 'Categorys fetched' : 'Category is empty',
        currentPage: PAGE,
        results: categorys,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular category by id
 * @param categoryId
 * @returns ICategory
 */
export const getCategoryById = (categoryId: ICategory['_id'], role?: string) => {
  return new Promise<ICategoryResponse>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId)) {
        return reject({
          message: !categoryId ? 'Provide categoryId' : 'categoryId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperCategory', 'DeveloperCategory'].includes(
        role ?? ''
      )
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperCategory', 'DeveloperCategory'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const category = await Category.findOne(
        { _id: categoryId, ...deleteQuery },
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

      if (!category) {
        return reject({
          message: 'Category not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'Category details fetched',
        results: category,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To add a new category
 * @param newCategory { ICategory }
 * @returns ICategory
 */
export const addCategory = (newCategory: ICategory) => {
  return new Promise<ICategoryResponse>(async (resolve, reject) => {
    try {
      if (!newCategory.name) {
        return reject({
          message: 'Please provide valid name, name, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isCategoryFound: ICategory[] = await Category.find({
        $or: [{ name: newCategory.name }],
      });

      if (isCategoryFound.length > 0) {
        return reject({
          message: 'Name already exist',
        });
      }

      const category = new Category({
        name: newCategory.name,
      });

      const editedCategory = await category.save();

      resolve({
        message: `${editedCategory.name}'s account created successfully`,
        results: editedCategory,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular category details
 * @param categoryId
 * @param newCategory
 * @returns ICategory
 */
export const editCategory = (categoryId: ICategory['_id'], data: ICategory) => {
  return new Promise<ICategoryResponse>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId))
        throw new ThrowError(
          'Provide vaild category id',
          HttpStatusCode.BAD_REQUEST
        );

      const category = await Category.findById(categoryId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!category)
        throw new ThrowError('Category not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // New name is already exist from another category then
      if (name && category.name != name) {
        const categoryExists = await Category.findOne({ name });
        if (categoryExists)
          throw new ThrowError(
            'Email already exist for other category',
            HttpStatusCode.BAD_REQUEST
          );
      }

      category.name = name || category.name;

      const editedCategory = await category.save();

      resolve({
        message: `Category edited successfully`,
        results: editedCategory,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular category's status
 * @param categoryId
 * @returns ICategory
 */
export const changeCategoryStatus = (categoryId: ICategory['_id']) => {
  return new Promise<ICategoryResponse>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId))
        throw new ThrowError(
          'Provide vaild category id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const category = await Category.findById(categoryId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!category)
        throw new ThrowError('Category not found', HttpStatusCode.NOT_FOUND);

      category.status =
        category.status === IStatus.ACTIVE ? IStatus.INACTIVE : IStatus.ACTIVE;
      const editedCategory = await category.save();

      resolve({
        message: `${editedCategory.name} status changed to ${editedCategory.status}`,
        results: editedCategory,
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
 * To update particular category profile
 * @param categoryId
 * @returns message
 */
export const deleteCategory = (categoryId: ICategory['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId))
        throw new ThrowError(
          'Provide valid category id',
          HttpStatusCode.BAD_REQUEST
        );

      const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
      });

      if (!category)
        throw new ThrowError('Category Not Found', HttpStatusCode.NOT_FOUND);

      category.status = IStatus.INACTIVE;
      category.isDeleted = true;
      category.deletedAt = new Date();
      await category.save();

      resolve({
        message: `${category.name} category was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To restore a category
 * @param categoryId
 * @returns message
 */
export const restoreCategory = (categoryId: ICategory['_id']) => {
  return new Promise<ICategoryResponse>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId))
        throw new ThrowError(
          'Provide valid category id',
          HttpStatusCode.BAD_REQUEST
        );

      const category = await Category.findOne(
        {
          _id: categoryId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!category)
        throw new ThrowError('Category not found', HttpStatusCode.NOT_FOUND);

      category.status = IStatus.ACTIVE;
      category.isDeleted = false;
      category.deletedAt = undefined;

      const editedcategory = await category.save();

      resolve({
        message: `${editedcategory.name} category was restored`,
        results: editedcategory,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Category restore failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete a category parmanently
 * @param categoryId
 * @returns message
 */
export const pDeleteCategory = (categoryId: ICategory['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!categoryId || !isValidObjectId(categoryId))
        throw new ThrowError(
          'Provide valid category id',
          HttpStatusCode.BAD_REQUEST
        );

      const category = await Category.findOne(
        {
          _id: categoryId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!category)
        throw new ThrowError('Category not found', HttpStatusCode.NOT_FOUND);

      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await category.deleteOne();
      resolve({
        message: `${category.name} category was deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Category permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete all category parmanently
 * @returns message
 */
export const deleteAllCategorys = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await Category.deleteMany({});

      resolve({
        message: `All category deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Category permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
