import express from 'express';
import { adminController } from '../../controllers';
import { adminAccess, superAdminAccess } from '../../middlewares';

const {
  getAdmins,
  getAdminById,
  getAdminProfile,
  addAdmin,
  editAdmin,
  upgradeAdminAccessToken,
  updateAdminProfile,
  adminLogin,
  changeAdminUsername,
  changeAdminPhone,
  changeAdminEmail,
  changeAdminStatus,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
  sentLoginCredentials,
  checkAdminUsername,
  deleteAdmin,
  restoreAdmin,
  pDeleteAdmin,
  deleteAllAdmin,
} = adminController;

const router = express.Router();

router.route('/').get(adminAccess, getAdmins).post(superAdminAccess, addAdmin);
router
  .route('/profile')
  .get(adminAccess, getAdminProfile)
  .patch(adminAccess, updateAdminProfile);
router.route('/login').patch(adminLogin);
router.route('/upgrade-access-token').get(upgradeAdminAccessToken);
router.route('/forget-password').patch(forgotAdminPassword);
router.route('/reset-password').patch(resetAdminPassword);
router.route('/check-username').get(checkAdminUsername);
router.route('/change-username').patch(adminAccess, changeAdminUsername);
router.route('/change-phone').patch(adminAccess, changeAdminPhone);
router.route('/change-email').patch(adminAccess, changeAdminEmail);
router.route('/change-password').patch(adminAccess, changeAdminPassword);
router
  .route('/:aid')
  .get(adminAccess, getAdminById)
  .patch(superAdminAccess, editAdmin)
  .delete(superAdminAccess, deleteAdmin);
router.route('/change-status/:aid').patch(superAdminAccess, changeAdminStatus);
router.route('/restore/:aid').put(superAdminAccess, restoreAdmin);
router.route('/delete/all').delete(superAdminAccess, deleteAllAdmin);
router.route('/delete/:aid').delete(superAdminAccess, pDeleteAdmin);
router
  .route('/send-login-credentials/:aid')
  .patch(superAdminAccess, sentLoginCredentials);

export default router;
