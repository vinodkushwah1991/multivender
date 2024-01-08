function updatePricebookOnSellerRef() {
    var PriceBookMgr = require("dw/catalog/PriceBookMgr");
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var collections = require("*/cartridge/scripts/util/collections");
    var Transaction = require("dw/system/Transaction");
  
    var pricebooks = PriceBookMgr.getAllPriceBooks();
  
    var pricebookIds = new dw.util.HashSet();
  
    collections.forEach(pricebooks, function (pricebook) {
      var priceBookId = pricebook.ID;
      var updated = pricebook.custom.updatedAtSellerObject;
      if (updated == false || updated == null) {
        var parts = priceBookId.split("-");
        var sellerId_from_pricebook = parts[1] ? parts[1].toLowerCase() : null;
        if (sellerId_from_pricebook) {
          var productSellerReference = CustomObjectMgr.getCustomObject("productSellerRef", (id = sellerId_from_pricebook));
          if (productSellerReference) {
            pricebookIds.add({
              pricebookId: priceBookId,
              productSellerReferenceID: sellerId_from_pricebook
            });
            Transaction.wrap(function(){
                pricebook.custom.updatedAtSellerObject = true;
            })
          }
        }
      }
    });
  
    if (pricebookIds) {
      var pricebookArray = pricebookIds.toArray();
      
      // Group records by productSellerReferenceID
      var groupedPricebookData = pricebookArray.reduce(function (result, item) {
        var key = item.productSellerReferenceID;
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(item.pricebookId);
        return result;
      }, {});
      
      // Now groupedPricebookData is an object with keys as productSellerReferenceID and values as arrays of pricebookIds
      
      for (var productSellerReferenceID in groupedPricebookData) {
        Transaction.wrap(function () {
          var ProductSellerRef = CustomObjectMgr.getCustomObject("productSellerRef", productSellerReferenceID);
          var oldPricebooks = ProductSellerRef.custom.pricebookIds;
          var newPricebooks = groupedPricebookData[productSellerReferenceID];
          
          // Concatenate old and new pricebooks
          var combinedPricebooks = oldPricebooks.concat(newPricebooks);
          
          ProductSellerRef.custom.pricebookIds = combinedPricebooks;
          var a = 10;
        });
      }
    }
  }
  
  module.exports = {
    execute: updatePricebookOnSellerRef,
  };
  