var azure = require('azure-storage');
var blobService = azure.createBlobService();

const getStorageAccessSignature = (parent, args, context, info) => {
    console.log('in getstorageaccess');

    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 100);
    startDate.setMinutes(startDate.getMinutes() - 100);

    var sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: azure.BlobUtilities.SharedAccessPermissions.CREATE + azure.BlobUtilities.SharedAccessPermissions.WRITE,
            Start: startDate,
            Expiry: expiryDate
        }
    };

    var token = blobService.generateSharedAccessSignature('clips', null, sharedAccessPolicy);
    var sasUrl = blobService.getUrl('clips', null, token);
    
    return {
        token,
        sasUrl,
    };
};

module.exports = getStorageAccessSignature;