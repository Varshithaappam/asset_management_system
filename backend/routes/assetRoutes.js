const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');


router.get('/details/:typeName', assetController.getAssetDetailsByCategory);
router.post('/', assetController.addAsset);
router.get('/type/:typeId', assetController.getAssetsByType);
// -----------
router.get('/id/:assetId', assetController.getAssetDetails);
router.get('/history/:assetId', assetController.getAssetHistory);
router.post('/reassign', assetController.reassignAsset);
router.post('/assignments', assetController.assignNewAsset);
router.get('/repairs/:assetId', assetController.getAssetRepairs);
router.post('/add-repair', assetController.addRepair);
router.post('/end-assignment', assetController.endAssignment);
router.get('/status/:typeName/:status', assetController.getAssetsByStatus);
router.post('/assign-existing', assetController.assignExistingAsset);
router.put('/retire/:assetId', assetController.retireAsset);
router.post('/repair', assetController.moveToRepair);
router.put('/solve-repair/:asset_id', assetController.solveRepair);
router.put('/unassign/:asset_id', assetController.unassignAsset);
router.delete('/:assetId', assetController.softDeleteAssetData);
router.put('/:assetId', assetController.updateAssetDetails);
router.put('/status-update/:assetId', assetController.retireAsset);
router.put('/restore/:assetId', assetController.restoreAssetToInventory);
module.exports = router;