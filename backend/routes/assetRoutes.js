const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

router.get('/id/:assetId', assetController.getAssetDetails); 

router.get('/details/:typeName', assetController.getAssetDetailsByCategory);

router.get('/history/:assetId', assetController.getAssetHistory);
router.post('/reassign', assetController.reassignAsset);
router.post('/', assetController.addAsset);
router.get('/type/:typeId', assetController.getAssetsByType);

module.exports = router;