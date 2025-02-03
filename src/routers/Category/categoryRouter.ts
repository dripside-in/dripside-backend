import express from 'express';
import { categoryController } from '../../controllers';
import { adminAccess, superAdminAccess } from '../../middlewares';

const {
  getCategorys,
  getCategoryById,
  addCategory,
  editCategory,
  changeCategoryStatus,
  deleteCategory,
  restoreCategory,
  pDeleteCategory,
  deleteAllCategory,
} = categoryController;

const router = express.Router();

router.route('/').get(adminAccess, getCategorys).post(adminAccess, addCategory);
router
  .route('/:sid')
  .get(adminAccess, getCategoryById)
  .patch(adminAccess, editCategory)
  .delete(adminAccess, deleteCategory);
router.route('/change-status/:sid').patch(superAdminAccess, changeCategoryStatus);
router.route('/restore/:sid').put(superAdminAccess, restoreCategory);
router.route('/delete/all').delete(superAdminAccess, deleteAllCategory);
router.route('/delete/:sid').delete(superAdminAccess, pDeleteCategory);

export default router;
