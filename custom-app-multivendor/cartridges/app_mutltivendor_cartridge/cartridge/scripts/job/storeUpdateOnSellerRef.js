function updateStoreOnSellerRef() {
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");
    var sellers = CustomObjectMgr.getAllCustomObjects("productSellerRef");
    var Transaction = require("dw/system/Transaction");
    var Locale = require("dw/util/Locale");
    var current = request.locale;
    var locales = ["usd", "fr", "eur", "gbp", "aed"]; // use site Preference for this
    var inventoryListIds = new dw.util.HashSet();
    while (sellers.hasNext()) {
      var seller = sellers.next();
      var id = seller.custom.id.toLowerCase();
      var inventory = ProductInventoryMgr.getInventoryList(
        `inventory_${id}_${current}`
      ); // inventory_{{ProductSellerRef: ID}}_usd/fr
      if (inventory && !inventory.custom.updatedAtSellerObject) {
        var storeId = `store_${id}_${current}`;
        inventoryListIds.add({
          storeId: storeId,
          productSellerReferenceID: id,
        });
        Transaction.wrap(function () {
          inventory.custom.updatedAtSellerObject = true;
        });
      }
    }
  
    if (inventoryListIds) {
      var inventoryListArray = inventoryListIds.toArray();
      // Group records by productSellerReferenceID
      var groupedInventoryListData = inventoryListArray.reduce(function (
        result,
        item
      ) {
        var key = item.productSellerReferenceID;
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(item.storeId);
        return result;
      },
      {});
  
      // Now groupedPricebookData is an object with keys as productSellerReferenceID and values as arrays of pricebookIds
  
      for (var productSellerReferenceID in groupedInventoryListData) {
        Transaction.wrap(function () {
          var ProductSellerRef = CustomObjectMgr.getCustomObject(
            "productSellerRef",
            productSellerReferenceID
          );
          var oldInventoryList = ProductSellerRef.custom.inventoryListIds;
          var newInventoryList =
            groupedInventoryListData[productSellerReferenceID];
  
          // Concatenate old and new pricebooks
          var combinedInventoryList = oldInventoryList.concat(newInventoryList);
  
          ProductSellerRef.custom.inventoryListIds = combinedInventoryList;
          var a = 10;
        });
      }
    }
  }
  
  module.exports = {
    execute: updateStoreOnSellerRef,
  };
  