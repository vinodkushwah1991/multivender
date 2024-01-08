function updatePricebookOnSellerRef() {
  var CustomObjectMgr = require("dw/object/CustomObjectMgr");
  var collections = require("*/cartridge/scripts/util/collections");
  var Transaction = require("dw/system/Transaction");
  var ShippingMgr = require("dw/order/ShippingMgr");
  var shippingApplicable = new dw.util.HashSet();

  var shippings = ShippingMgr.getAllShippingMethods();

  collections.forEach(shippings, function (shipping) {
    for (var i = 0; i < shipping.custom.referenceID.length; i++) {
      var productSellerRef = CustomObjectMgr.getCustomObject("productSellerRef",shipping.custom.referenceID[i]);
      if (productSellerRef) {
        if (productSellerRef.custom.shippingMethodId.length != 0) {
            for(var j=0; j<productSellerRef.custom.shippingMethodId.length ; j++){
                shippingApplicable.add({
                    shipping: productSellerRef.custom.shippingMethodId[j],
                    productSellerReferenceID: shipping.custom.referenceID[i],
                  });
            }
        }

        shippingApplicable.add({
          shipping: shipping.ID,
          productSellerReferenceID: shipping.custom.referenceID[i],
        });
      }
    }
  });

  if (shippingApplicable) {
    var shippingArray = shippingApplicable.toArray();
    
    // Group records by productSellerReferenceID
    var groupedShippingData = shippingArray.reduce(function (result, item) {
      var key = item.productSellerReferenceID;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item.shipping);
      return result;
    }, {});


    for (var productSellerReferenceID in groupedShippingData) {
        Transaction.wrap(function () {
          var ProductSellerRef = CustomObjectMgr.getCustomObject("productSellerRef", productSellerReferenceID);
          ProductSellerRef.custom.shippingMethodId = groupedShippingData[productSellerReferenceID];
          var a = 10;
        });
      }
    }
}

module.exports = {
  execute: updatePricebookOnSellerRef,
};
