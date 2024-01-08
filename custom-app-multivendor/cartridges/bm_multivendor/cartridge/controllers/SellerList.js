"use strict";
var server = require("server");
importPackage(dw.net);
importPackage(dw.system);
server.get("Extend", function (req, res, next) {

    // res.render("seller/sellerList");
    var Logger = require('dw/system/Logger');
    Logger.warn("test")


var CustomObjectMgr = require("dw/object/CustomObjectMgr");


var newPreview = CustomObjectMgr.getAllCustomObjects("productSellerRef")
var productSellerRefList = [];

while (newPreview.hasNext()) {
    var sellerRef = newPreview.next();
   
var vendorRefId = sellerRef.custom.refId
var vendorSellerId = sellerRef.custom.sellerId
var vendorShippingMethodIds = sellerRef.custom.shippingMethodId
var vendorPriceBookIds = sellerRef.custom.pricebookIds
var vendorInventoryListIds = sellerRef.custom.inventoryListIds


productSellerRefList.push({
    vendorRefId:vendorRefId,
    vendorSellerId:vendorSellerId,
    vendorShippingMethodIds:vendorShippingMethodIds,
    vendorPriceBookIds:vendorPriceBookIds,
    vendorInventoryListIds:vendorInventoryListIds
     });
    };


var Preview = CustomObjectMgr.getAllCustomObjects("seller")
var sellerList = [];
while (Preview.hasNext()) {
    var vendorCompany = Preview.next();
   
var vendorId = vendorCompany.custom.id
var vendorName = vendorCompany.custom.firstName
var vendorLastName = vendorCompany.custom.lastName
// var vendorPriceBook = vendorCompany.custom.priceList
// var vendorInventory = vendorCompany.custom.inventoryList


sellerList.push({
vendorId:vendorId,
vendorName:vendorName,
vendorLastName:vendorLastName,
// vendorPriceBook:vendorPriceBook,
// vendorInventory:vendorInventory
     });
    };
    res.render("seller/sellerList.isml",{sellerList:sellerList,productSellerRefList:productSellerRefList});
    next();
});

module.exports = server.exports();