import express from 'express';
import { sampleController } from '../../controllers';
import { adminAccess, superAdminAccess } from '../../middlewares';

const {
  getSamples,
  getSampleById,
  addSample,
  editSample,
  changeSampleStatus,
  deleteSample,
  restoreSample,
  pDeleteSample,
  deleteAllSample,
} = sampleController;

const router = express.Router();

router.route('/').get(adminAccess, getSamples).post(adminAccess, addSample);
router
  .route('/:sid')
  .get(adminAccess, getSampleById)
  .patch(adminAccess, editSample)
  .delete(adminAccess, deleteSample);
router.route('/change-status/:sid').patch(superAdminAccess, changeSampleStatus);
router.route('/restore/:sid').put(superAdminAccess, restoreSample);
router.route('/delete/all').delete(superAdminAccess, deleteAllSample);
router.route('/delete/:sid').delete(superAdminAccess, pDeleteSample);

export default router;
