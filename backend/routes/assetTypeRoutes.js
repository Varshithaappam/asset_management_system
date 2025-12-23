const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

router.get('/', assetController.getAllAssetTypes);
router.post('/', assetController.createAssetType);

module.exports = router;