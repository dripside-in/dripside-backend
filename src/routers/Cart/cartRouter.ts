import express from 'express';
import { cartController } from '../../controllers';
import { adminAccess, superAdminAccess } from '../../middlewares';

const {
  getCarts,
  getCartById,
  addCart,
  editCart,
  changeCartStatus,
  deleteCart,
  restoreCart,
  pDeleteCart,
  deleteAllCart,
} = cartController;

const router = express.Router();

router.route('/').get(adminAccess, getCarts).post(adminAccess, addCart);
router
  .route('/:sid')
  .get(adminAccess, getCartById)
  .patch(adminAccess, editCart)
  .delete(adminAccess, deleteCart);
router.route('/change-status/:sid').patch(superAdminAccess, changeCartStatus);
router.route('/restore/:sid').put(superAdminAccess, restoreCart);
router.route('/delete/all').delete(superAdminAccess, deleteAllCart);
router.route('/delete/:sid').delete(superAdminAccess, pDeleteCart);

export default router;
