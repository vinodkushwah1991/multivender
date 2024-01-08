"use strict";

/**
 * @namespace Product
 */

var server = require("server");

var cache = require("*/cartridge/scripts/middleware/cache");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var pageMetaData = require("*/cartridge/scripts/middleware/pageMetaData");

/**
 * @typedef ProductDetailPageResourceMap
 * @type Object
 * @property {String} global_availability - Localized string for "Availability"
 * @property {String} label_instock - Localized string for "In Stock"
 * @property {String} global_availability - Localized string for "This item is currently not
 *     available"
 * @property {String} info_selectforstock - Localized string for "Select Styles for Availability"
 */

/**
 * Product-Show : This endpoint is called to show the details of the selected product
 * @name Base/Product-Show
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */

server.get(
  "Show",
  cache.applyPromotionSensitiveCache,
  consentTracking.consent,
  function (req, res, next) {
    var productHelper = require("*/cartridge/scripts/helpers/productHelpers");
    var ProductMgr = require("dw/catalog/ProductMgr");
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var Logger = require("dw/system/Logger");

    var collections = require("*/cartridge/scripts/util/collections");
    var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");

    var localeAndCurrency = [
      { en_GB: "gbp" },
      { fr_FR: "eur" },
      { de_DE: "eur" },
    ];

    var pid = req.querystring.pid;

    var productId = pid;
    var siteLocal = res.viewData.locale;

    var localeMapping = localeAndCurrency.find(
      (mapping) => siteLocal in mapping
    );
    var currencyCode = null;
    if (localeMapping) {
      currencyCode = localeMapping[siteLocal];
    }

    var value_update = localeAndCurrency[siteLocal];
    var showVendorInventory = "product/components/showVendorInventory";

    var product = ProductMgr.getProduct(productId);


    var pid = req.querystring.pid;
    var productId = ProductMgr.getProduct(pid);
    var pRefId = productId.custom.ProductSellerRef;

    //if seller available passing true value in variable
    if (pRefId != null && pRefId && pRefId[0]) {
      sellerIsAvailable = true
   } else{
     sellerIsAvailable = false
   }

    var selected_variations = productId.variants;

    var matchingSellerInfo = [];
    var sellerRankAndData = [];
    var lowestRankSeller = null;
var sellerIsAvailable;

    for (var i = 0; i < pRefId.length; i++) {
      var finalPRefId = pRefId[i];
      var productSellerRefs = CustomObjectMgr.getCustomObject(
        "productSellerRef",
        finalPRefId
      );

      if (productSellerRefs != null) {
        var sellerRefUniqueId = productSellerRefs.custom.id;

        if (finalPRefId === sellerRefUniqueId) {
          var inventoryListIds = productSellerRefs.custom.inventoryListIds;
          var pricebookIds = productSellerRefs.custom.pricebookIds;

          var shippingMethodId = productSellerRefs.custom.shippingMethodId;
          var sellerIdOfSellerRef = productSellerRefs.custom.sellerId;

          var sellerInfo = {
            inventoryListIds: inventoryListIds,
            pricebookIds: pricebookIds,
            shippingMethodId: shippingMethodId,
            sellerRefUniqueId: sellerRefUniqueId,
            sellerIdOfSellerRef: sellerIdOfSellerRef,
            currencyCode: currencyCode,
          };
          matchingSellerInfo.push(sellerInfo);

          var PB = [];

          var Preview = CustomObjectMgr.getCustomObject(
            "seller",
            sellerIdOfSellerRef
          );
          if (Preview != null) {
            var sellerUniqueId = Preview.custom.id;

            if (sellerUniqueId != null) {
              var matchingSellerRank = Preview.custom.rank;
              var companyName = Preview.custom.companyName;
              var sellerFirstName = Preview.custom.firstName;
              var sellerLastName = Preview.custom.lastName;


              var locale = request.getLocale();
              for (var j = 0; j < pricebookIds.length; j++) {
                var data = pricebookIds[j].split("-");
                var loc = data[0];

                for (var k = 0; k < localeAndCurrency.length; k++) {
                  var val = localeAndCurrency[k];
                  for (var key in val) {
                    var c = val[key];
                    if (key == locale) {
                      if (loc == val[key]) {
                        var pricebookid = pricebookIds[j];
                        PB.push(pricebookid);
                      }
                    }
                  }
                }
              }

              var sellerRankAndDataObj = {
                inventoryListIds: inventoryListIds,
                pricebookIds: pricebookIds,
                shippingMethodId: shippingMethodId,
                sellerRefUniqueId: sellerRefUniqueId,
                sellerIdOfSellerRef: sellerIdOfSellerRef,
                currencyCode: currencyCode,
                sellerUniqueId: sellerUniqueId,
                matchingSellerRank: matchingSellerRank,
                companyName: companyName,
                sellerFirstName: sellerFirstName,
                sellerLastName: sellerLastName,
                lowestSellerRankLocalePricebook: PB,
              };

              sellerRankAndData.push(sellerRankAndDataObj);

              if (
                (lowestRankSeller === null && matchingSellerRank !== null) ||
                (matchingSellerRank !== null &&
                  matchingSellerRank < lowestRankSeller.matchingSellerRank)
              ) {
                lowestRankSeller = sellerRankAndDataObj;
              }
            }
          }
        }
      }
    }

    var dataOfLowestRankSeller = lowestRankSeller
      ? lowestRankSeller.lowestSellerRankLocalePricebook[0]
      : null;

    var lowestData = dataOfLowestRankSeller
      ? dataOfLowestRankSeller.split("-")[1]
      : null;

    var showProductPageHelperResult = productHelper.showProductPage(
      req.querystring,
      req.pageMetaData
    );

    var productType = showProductPageHelperResult.product.productType;

    if (
      !showProductPageHelperResult.product.online &&
      productType !== "set" &&
      productType !== "bundle"
    ) {
      res.setStatusCode(404);
      res.render("error/notFound");
    } else {
      var pageLookupResult = productHelper.getPageDesignerProductPage(
        showProductPageHelperResult.product
      );

      if (
        (pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) ||
        pageLookupResult.invisiblePage
      ) {
        res.cachePeriod = 0;
      }

      if (pageLookupResult.page) {
        res.page(
          pageLookupResult.page.ID,
          {},
          pageLookupResult.aspectAttributes
        );
      } else {
        res.render(showProductPageHelperResult.template, {
          product: showProductPageHelperResult.product,
          addToCartUrl: showProductPageHelperResult.addToCartUrl,
          resources: showProductPageHelperResult.resources,
          breadcrumbs: showProductPageHelperResult.breadcrumbs,
          canonicalUrl: showProductPageHelperResult.canonicalUrl,
          schemaData: showProductPageHelperResult.schemaData,
          productId: productId,
          pRefId: pRefId,
          sellerRankAndData: sellerRankAndData,
          matchingSellerInfo: matchingSellerInfo,
          lowestData: lowestData,
          dataOfLowestRankSeller: dataOfLowestRankSeller,
          selected_variations: selected_variations,
          sellerIsAvailable:sellerIsAvailable
        });
      }
    }

    next();
  },
  pageMetaData.computedPageMetaData
);

server.post("FetchPriceBySeller", function (req, res, next) {
  // session selected id
  var pricebookIds = req.form.pricebookId.split(" ");
  var productId = req.form.productId;
  var selectedSeller = req.form.selectedSeller;
  var ProductMgr = require("dw/catalog/ProductMgr");
  var URLUtils = require("dw/web/URLUtils");
  session.custom.variationSelected = null;

  session.custom.selectedSeller = selectedSeller;

  var variationId = session.custom.variationSelected
    ? session.custom.variationSelected
    : productId;
  // Use the ProductMgr to retrieve the product
  var product = ProductMgr.getProduct(variationId);

  var priceModel = product.getPriceModel();
  var validPrices = {};

  // Iterate over each price book ID
  pricebookIds.forEach(function (pricebookId) {
    var productPrice = priceModel.getPriceBookPrice(pricebookId);

    // Check if the price is greater than 0
    if (productPrice.value > 0) {
      // Store the price in the validPrices object
      validPrices[pricebookId] = productPrice.value;
    }
  });
  next();
});

server.post("FetchSellerBySize", function (req, res, next) {
  var productId = "req.form.productId";
  res.json({ varientPrice: productId });
  next();
});

//   var ProductMgr = require("dw/catalog/ProductMgr");
//   var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");

//   // Define the product ID and inventory ID
//   // var productId = req.querystring.productId;
//   var productId = "701643415342M";
//   var siteLocal = res.viewData.locale;
//   var inventoryId = "inventory_vendor1_" + siteLocal;
//   // var inventoryId = req.querystring.inventoryId;

//   var showVendorInventory = "product/components/showVendorInventory";

//   // Get the product based on the product ID
//   var product = ProductMgr.getProduct(productId);

//   // Get the inventory record based on the inventory ID
//   var inventoryRecord =
//     ProductInventoryMgr.getInventoryList(inventoryId).getRecord(product);
//   // var InventoryLocal = ProductInventoryMgr.inventoryList.custom.InventoryLocal;

//   // Check if the inventory record exists and get the available stock
//   if (inventoryRecord) {
//     var availableStock = inventoryRecord.getATS().value;
//     res.render(showVendorInventory, {
//       availableStock: availableStock,
//       InventoryId: inventoryId,
//       productId: productId,
//     });

//     // Now 'availableStock' holds the available stock of the product in that inventory
//   } else {
//     // Handle the case where no inventory record was found for the product in that inventory
//     res.json({
//       success: false,
//     });
//   }
//   next();
// });
/**
 * Product-ShowInCategory : The Product-ShowInCategory endpoint renders the product detail page within the context of a category
 * @name Base/Product-ShowInCategory
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
  "ShowInCategory",
  cache.applyPromotionSensitiveCache,
  function (req, res, next) {
    var productHelper = require("*/cartridge/scripts/helpers/productHelpers");
    var showProductPageHelperResult = productHelper.showProductPage(
      req.querystring,
      req.pageMetaData
    );
    if (!showProductPageHelperResult.product.online) {
      res.setStatusCode(404);
      res.render("error/notFound");
    } else {
      res.render(showProductPageHelperResult.template, {
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        resources: showProductPageHelperResult.resources,
        breadcrumbs: showProductPageHelperResult.breadcrumbs,
      });
    }
    next();
  }
);

/**
 * Product-Variation : This endpoint is called when all the product variants are selected
 * @name Base/Product-Variation
 * @function
 * @memberof Product
 * @param {querystringparameter} - pid - Product ID
 * @param {querystringparameter} - quantity - Quantity
 * @param {querystringparameter} - dwvar_<pid>_color - Color Attribute ID
 * @param {querystringparameter} - dwvar_<pid>_size - Size Attribute ID
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.get("Variation", function (req, res, next) {
  var ProductMgr = require("dw/catalog/ProductMgr");
  var URLUtils = require("dw/web/URLUtils");
  var productHelper = require("*/cartridge/scripts/helpers/productHelpers");
  var priceHelper = require("*/cartridge/scripts/helpers/pricing");
  var ProductFactory = require("*/cartridge/scripts/factories/product");
  var PriceBookMgr = require("dw/catalog/PriceBookMgr");
  var renderTemplateHelper = require("*/cartridge/scripts/renderTemplateHelper");
  var ProductInventoryMgr = require("dw/catalog/ProductInventoryMgr");
  var ProductFactory = require("*/cartridge/scripts/factories/product");
  // PriceBookMgr.setApplicablePriceBooks();
  var fetchSellerByPrice = req.querystring.fetchSellerByPrice
    ? req.querystring.fetchSellerByPrice[0]
    : false;

  if (fetchSellerByPrice) {
    var pricebookIds = req.querystring.pricebookId;
    var productId = req.querystring.productId;
    var selectedSeller = req.querystring.selectedSeller;
    var variationSelected = session.custom.variationSelected
    var variationId = variationSelected
      ? variationSelected
      : productId;

    session.custom.selectedSeller = selectedSeller;
    
    var productData = ProductMgr.getProduct(variationId);
    var priceModel = productData.getPriceModel();
    var validPrices = {};
 

    var productPrice = priceModel.getPriceBookPrice(pricebookIds);
    PriceBookMgr.setApplicablePriceBooks();
    PriceBookMgr.setApplicablePriceBooks(
      PriceBookMgr.getPriceBook(pricebookIds)
    );

    // Check if the price is greater than 0
    if (productPrice.value > 0) {
      validPrices[pricebookIds] = productPrice.value;
    }

    // ---------------------------------------------------------


    // var inventorySellerId = ProductInventoryMgr.inventoryList.custom.vendorID;
    var params = req.querystring;
    var product = ProductFactory.get(params);

    var productId = variationId;
    var siteLocal = res.viewData.locale;
    var inventoryId = "inventory_" + selectedSeller + "_" + siteLocal;
    var showVendorInventory = "product/components/showVendorInventory";
    var product = ProductMgr.getProduct(productId);
    var inventoryRecord =
      ProductInventoryMgr.getInventoryList(inventoryId).getRecord(product);
    if (inventoryRecord) {
      var availableStock = inventoryRecord.getATS().value;
      var perpetual = inventoryRecord.perpetual;
      res.json({
        validPrices: validPrices,
        availableStock: availableStock,
        perpetual: perpetual,
      });
    } else {
      res.json({ validPrices: validPrices, availableStock: 0 });
    }
  }
  PriceBookMgr.setApplicablePriceBooks();
  var pid = req.querystring.pid ? true : false;
  if (pid) {
    var selectedSeller = session.custom.selectedSeller;

    var showProductPageHelperResult = productHelper.showProductPage(
      req.querystring,
      req.pageMetaData
    );

    var params = req.querystring;
    var product = ProductFactory.get(params);

    var CustomObjectMgr = require("dw/object/CustomObjectMgr");

    var localeAndCurrency = [
      { en_GB: "gbp" },
      { fr_FR: "eur" },
      { de_DE: "eur" },
    ];
    var siteLocal = res.viewData.locale;

    var localeMapping = localeAndCurrency.find(
      (mapping) => siteLocal in mapping
    );
    var currencyCode = null;
    if (localeMapping) {
      currencyCode = localeMapping[siteLocal];
      var a = 10;
    }

    var sellerDataArray = product.attributes? product.attributes[0].attributes[0].value : "";
    var sellerData = [];

    for (var i = 0; i < sellerDataArray.length; i++) {
      var finalPRefId = sellerDataArray[i];
      var productSellerRef = CustomObjectMgr.getCustomObject(
        "productSellerRef",
        finalPRefId
      );

      if (productSellerRef) {
        var currencyMapping = {
          gbp: "gbp",
          eur: "eur",
        };

        var inventoryMapping = {
          en_GB: "en_GB",
          fr_FR: "fr_FR",
          de_DE: "de_DE",
        };

        var pricebookIds = productSellerRef.custom.pricebookIds;
        var inventoryListIds = productSellerRef.custom.inventoryListIds;

        // Filter pricebookIds based on currencyCode
        var filteredPricebookIds = pricebookIds.filter(function (pricebookId) {
          return pricebookId.indexOf(currencyMapping[currencyCode]) !== -1;
        });

        // Filter inventoryListIds based on siteLocal
        var filteredInventoryListIds = inventoryListIds.filter(function (
          inventoryListId
        ) {
          return inventoryListId.indexOf(inventoryMapping[siteLocal]) !== -1;
        });

        /// according to locale pricelist getting price
        var varId = product.id;
        var productVaria = ProductMgr.getProduct(varId);
        var priceModel = productVaria.getPriceModel();

        var productPrice = priceModel.getPriceBookPrice(filteredPricebookIds);
        var productPriceFinalLocale = productPrice.value;

        sellerData.push({
          id: finalPRefId,
          pricebookIds: filteredPricebookIds,
          inventoryListIds: filteredInventoryListIds,
          currencyCode: currencyCode,
          localePrice: productPriceFinalLocale,
        });
      }
    }

    for (var i = 0; i < sellerData.length; i++) {
      if (sellerData[i].id == selectedSeller) {
        product.sellers = sellerData[i];
      }
    }

    var a = product.sellers ? product.sellers.pricebookIds[0] : "";

    PriceBookMgr.setApplicablePriceBooks(
      PriceBookMgr.getPriceBook(filteredPricebookIds)
    );

    var context = {
      price: product.price,
      sellerData: product.sellers,
    };

    product.price.html = priceHelper.renderHtml(
      priceHelper.getHtmlContext(context)
    );

    var attributeContext = { product: { attributes: product.attributes } };
    var attributeTemplate = "product/components/attributesPre";
    product.attributesHtml = renderTemplateHelper.getRenderedHtml(
      attributeContext,
      attributeTemplate
    );

    var promotionsContext = { product: { promotions: product.promotions } };
    var promotionsTemplate = "product/components/promotions";

    product.promotionsHtml = renderTemplateHelper.getRenderedHtml(
      promotionsContext,
      promotionsTemplate
    );

    var optionsContext = { product: { options: product.options } };
    var optionsTemplate = "product/components/options";

    product.optionsHtml = renderTemplateHelper.getRenderedHtml(
      optionsContext,
      optionsTemplate
    );

    session.custom.variationSelected = product.id;

    res.json({
      success: true,
      sellerAvailable: sellerData,
      product: product,
      resources: productHelper.getResources(),
    });
  }
  next();
});

/**
 * Product-ShowQuickView : This endpoint is called when a product quick view button is clicked
 * @name Base/Product-ShowQuickView
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.get(
  "ShowQuickView",
  cache.applyPromotionSensitiveCache,
  function (req, res, next) {
    var URLUtils = require("dw/web/URLUtils");
    var productHelper = require("*/cartridge/scripts/helpers/productHelpers");
    var ProductFactory = require("*/cartridge/scripts/factories/product");
    var renderTemplateHelper = require("*/cartridge/scripts/renderTemplateHelper");
    var Resource = require("dw/web/Resource");

    var params = req.querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url("Cart-AddProduct");
    var template =
      product.productType === "set"
        ? "product/setQuickView.isml"
        : "product/quickView.isml";

    var context = {
      product: product,
      addToCartUrl: addToCartUrl,
      resources: productHelper.getResources(),
      quickViewFullDetailMsg: Resource.msg(
        "link.quickview.viewdetails",
        "product",
        null
      ),
      closeButtonText: Resource.msg("link.quickview.close", "product", null),
      enterDialogMessage: Resource.msg("msg.enter.quickview", "product", null),
      template: template,
    };

    res.setViewData(context);

    this.on("route:BeforeComplete", function (req, res) {
      // eslint-disable-line no-shadow
      var viewData = res.getViewData();
      var renderedTemplate = renderTemplateHelper.getRenderedHtml(
        viewData,
        viewData.template
      );

      res.json({
        renderedTemplate: renderedTemplate,
        productUrl: URLUtils.url("Product-Show", "pid", viewData.product.id)
          .relative()
          .toString(),
      });
    });

    next();
  }
);

/**
 * Product-SizeChart : This endpoint is called when the "Size Chart" link on the product details page is clicked
 * @name Base/Product-SizeChart
 * @function
 * @memberof Product
 * @param {querystringparameter} - cid - Size Chart ID
 * @param {category} - non-sensitve
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.get("SizeChart", function (req, res, next) {
  var ContentMgr = require("dw/content/ContentMgr");

  var apiContent = ContentMgr.getContent(req.querystring.cid);

  if (apiContent) {
    res.json({
      success: true,
      content: apiContent.custom.body.markup,
    });
  } else {
    res.json({});
  }
  next();
});

/**
 * Product-ShowBonusProducts : This endpoint is called when a product with bonus product is added to Cart
 * @name Base/Product-ShowBonusProducts
 * @function
 * @memberof Product
 * @param {querystringparameter} - DUUID - Discount Line Item UUID
 * @param {querystringparameter} - pagesize - Number of products to show on a page
 * @param {querystringparameter} - pagestart - Starting Page Number
 * @param {querystringparameter} - maxpids - Limit maximum number of Products
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.get("ShowBonusProducts", function (req, res, next) {
  var Resource = require("dw/web/Resource");
  var ProductFactory = require("*/cartridge/scripts/factories/product");
  var renderTemplateHelper = require("*/cartridge/scripts/renderTemplateHelper");
  var moreUrl = null;
  var pagingModel;
  var products = [];
  var product;
  var duuid = req.querystring.DUUID;
  var collections = require("*/cartridge/scripts/util/collections");
  var BasketMgr = require("dw/order/BasketMgr");
  var currentBasket = BasketMgr.getCurrentOrNewBasket();
  var showMoreButton;
  var selectedBonusProducts;

  if (duuid) {
    var bonusDiscountLineItem = collections.find(
      currentBasket.getBonusDiscountLineItems(),
      function (item) {
        return item.UUID === duuid;
      }
    );

    if (
      bonusDiscountLineItem &&
      bonusDiscountLineItem.bonusProductLineItems.length
    ) {
      selectedBonusProducts = collections.map(
        bonusDiscountLineItem.bonusProductLineItems,
        function (bonusProductLineItem) {
          var option = {
            optionid: "",
            selectedvalue: "",
          };
          if (!bonusProductLineItem.optionProductLineItems.empty) {
            option.optionid =
              bonusProductLineItem.optionProductLineItems[0].optionID;
            option.optionid =
              bonusProductLineItem.optionProductLineItems[0].optionValueID;
          }
          return {
            pid: bonusProductLineItem.productID,
            name: bonusProductLineItem.productName,
            submittedQty: bonusProductLineItem.quantityValue,
            option: option,
          };
        }
      );
    } else {
      selectedBonusProducts = [];
    }

    if (req.querystring.pids) {
      var params = req.querystring.pids.split(",");
      products = params.map(function (param) {
        product = ProductFactory.get({
          pid: param,
          pview: "bonus",
          duuid: duuid,
        });
        return product;
      });
    } else {
      var URLUtils = require("dw/web/URLUtils");
      var PagingModel = require("dw/web/PagingModel");
      var pageStart = parseInt(req.querystring.pagestart, 10);
      var pageSize = parseInt(req.querystring.pagesize, 10);
      showMoreButton = true;

      var ProductSearchModel = require("dw/catalog/ProductSearchModel");
      var apiProductSearch = new ProductSearchModel();
      var productSearchHit;
      apiProductSearch.setPromotionID(bonusDiscountLineItem.promotionID);
      apiProductSearch.setPromotionProductType("bonus");
      apiProductSearch.search();
      pagingModel = new PagingModel(
        apiProductSearch.getProductSearchHits(),
        apiProductSearch.count
      );
      pagingModel.setStart(pageStart);
      pagingModel.setPageSize(pageSize);

      var totalProductCount = pagingModel.count;

      if (pageStart + pageSize > totalProductCount) {
        showMoreButton = false;
      }

      moreUrl = URLUtils.url(
        "Product-ShowBonusProducts",
        "DUUID",
        duuid,
        "pagesize",
        pageSize,
        "pagestart",
        pageStart + pageSize
      ).toString();

      var iter = pagingModel.pageElements;
      while (iter !== null && iter.hasNext()) {
        productSearchHit = iter.next();
        product = ProductFactory.get({
          pid: productSearchHit.getProduct().ID,
          pview: "bonus",
          duuid: duuid,
        });
        products.push(product);
      }
    }
  }

  var context = {
    products: products,
    selectedBonusProducts: selectedBonusProducts,
    maxPids: req.querystring.maxpids,
    moreUrl: moreUrl,
    showMoreButton: showMoreButton,
    closeButtonText: Resource.msg(
      "link.choice.of.bonus.dialog.close",
      "product",
      null
    ),
    enterDialogMessage: Resource.msg(
      "msg.enter.choice.of.bonus.select.products",
      "product",
      null
    ),
    template: "product/components/choiceOfBonusProducts/bonusProducts.isml",
  };

  res.setViewData(context);

  this.on("route:BeforeComplete", function (req, res) {
    // eslint-disable-line no-shadow
    var viewData = res.getViewData();

    res.json({
      renderedTemplate: renderTemplateHelper.getRenderedHtml(
        viewData,
        viewData.template
      ),
    });
  });

  next();
});

module.exports = server.exports();
