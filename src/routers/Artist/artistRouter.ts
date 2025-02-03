import express from 'express';
import { artistController } from '../../controllers';
import { adminAccess, superAdminAccess, userAccess } from '../../middlewares';

const {
  getArtists,
  getArtistById,
  addArtist,
  editArtist,
  changeArtistStatus,
  deleteArtist,
  restoreArtist,
  pDeleteArtist,
  deleteAllArtist,
} = artistController;

const router = express.Router();

router.route('/').get(userAccess, getArtists).post(userAccess, addArtist);
router
  .route('/:sid')
  .get(userAccess, getArtistById)
  .patch(adminAccess, editArtist)
  .delete(adminAccess, deleteArtist);
router.route('/change-status/:sid').patch(superAdminAccess, changeArtistStatus);
router.route('/restore/:sid').put(superAdminAccess, restoreArtist);
router.route('/delete/all').delete(superAdminAccess, deleteAllArtist);
router.route('/delete/:sid').delete(superAdminAccess, pDeleteArtist);

export default router;
