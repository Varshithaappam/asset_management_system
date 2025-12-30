const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

router.get('/', assetController.getAllAssetTypes);
router.post('/', assetController.createAssetType);
router.put('/soft-delete/:typeName', assetController.softDeleteAsset);
router.put('/retire/:assetId', assetController.retireAsset);
module.exports = router;