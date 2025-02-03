import express from 'express';
import { userController } from '../../controllers';
import { adminAccess, superAdminAccess } from '../../middlewares';
import { allRoleAccess, userAccess } from '../../middlewares/authMiddleware';
import { sentOTP, verifyOTP } from '../../controllers/User/userController';

const {
  getUsers,
  getUserById,
  getUserProfile,
  addUser,
  editUser,
  updateUserProfile,
  userLogin,
  userRegistration,
  upgradeUserAccessToken,
  changeUserUsername,
  changeUserPhone,
  changeUserEmail,
  changeUserStatus,
  changeUserPassword,
  forgotUserPassword,
  resetUserPassword,
  sentLoginCredentials,
  checkUserUsername,
  deleteUser,
  restoreUser,
  pDeleteUser,
  deleteAllUser,
} = userController;

const router = express.Router();

router.route('/').get(adminAccess, getUsers).post(adminAccess, addUser);
router
  .route('/profile')
  .get(userAccess, getUserProfile)
  .patch(userAccess, updateUserProfile);
router.route('/register').post(userRegistration);
router.route('/login').patch(userLogin);
router.route('/upgrade-access-token').get(upgradeUserAccessToken);
router.route('/sent-otp').patch(sentOTP);
router.route('/verify-otp-login').patch(verifyOTP);
router.route('/forget-password').patch(forgotUserPassword);
router.route('/reset-password').patch(resetUserPassword);
router.route('/check-username').get(checkUserUsername);
router.route('/change-username').patch(userAccess, changeUserUsername);
router.route('/change-phone').patch(userAccess, changeUserPhone);
router.route('/change-email').patch(userAccess, changeUserEmail);
router.route('/change-password').patch(userAccess, changeUserPassword);
router
  .route('/:uid')
  .get(allRoleAccess, getUserById)
  .patch(adminAccess, editUser)
  .delete(adminAccess, deleteUser);
router.route('/change-status/:uid').patch(superAdminAccess, changeUserStatus);
router.route('/restore/:uid').put(superAdminAccess, restoreUser);
router.route('/delete/all').delete(superAdminAccess, deleteAllUser);
router.route('/delete/:uid').delete(superAdminAccess, pDeleteUser);
router
  .route('/send-login-credentials/:uid')
  .patch(superAdminAccess, sentLoginCredentials);

export default router;
