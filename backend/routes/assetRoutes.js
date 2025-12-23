const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

router.get('/history/:assetId', assetController.getAssetHistory);
router.get('/details/:assetId', assetController.getAssetDetails);
router.post('/reassign', assetController.reassignAsset);

module.exports = router;