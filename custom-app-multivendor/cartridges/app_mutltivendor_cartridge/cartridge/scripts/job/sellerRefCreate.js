function generateRandomAlphaNumeric(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function createProductSellerRef() {
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var Transaction = require('dw/system/Transaction');
  var UUIDUtils = require('dw/util/UUIDUtils');
  let returnData = {
    success: false
  }
  var Preview = CustomObjectMgr.getAllCustomObjects("seller")
  while (Preview.hasNext()) {
    var vendorCompany = Preview.next();
    var createdProductSellerRef = vendorCompany.custom.createdProductSellerRef;
    var id = vendorCompany.custom.id;
    var companyName = vendorCompany.custom.companyName;
    
    // Create updatedCompanyName as requested
    var productSellerReferenceID = generateRandomAlphaNumeric(5).toLowerCase();
    var a = 10
    
    if (createdProductSellerRef === null || createdProductSellerRef == "" || createdProductSellerRef == false) {
      let makeProductSellerRef = null;
      Transaction.wrap(function () {
        try {
          let uuid = UUIDUtils.createUUID();
          makeProductSellerRef = CustomObjectMgr.createCustomObject('productSellerRef', productSellerReferenceID);
          makeProductSellerRef.custom.sellerId = id;
          vendorCompany.custom.createdProductSellerRef = true;
          var a = 10;
          returnData.success = true;
        } catch (error) {
          returnData.error = error
        }
      })
    }
  };
};

module.exports = {
  execute: createProductSellerRef,
};
