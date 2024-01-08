$(document).ready(function () {
  var lowestrandId = $("#lowestrank").val();
  var proId = $("#productId").val();
  var pricebookId = lowestrandId;

  var path = $("#seller-url").val()

  var seller = pricebookId.split('-');
  var finalSeller = seller[1];

  var form = {
    pricebookId: pricebookId,
    productId :proId,
    selectedSeller:finalSeller
  };
  $.ajax({
    url: path,
    method: "POST",
    data: form,
    success: function (response) {
      var rangeDiv = $(".price");

      rangeDiv.empty();

      // Iterate over the valid prices and append a new value div for each
      for (var pricebookId in response.validPrices) {
        if (response.validPrices.hasOwnProperty(pricebookId)) {
          var data = response.validPrices;
          var pricebookid = pricebookId;
          var priceValue = response.validPrices[pricebookId];
          console.log(data,pricebookid,priceValue, "this are the price related data")
          var newValueDiv = $("<div>").text(
            "Price for " + pricebookId + ": " + priceValue
          );
          // Append the new value div to the 'range' div
          var data = newValueDiv;
          rangeDiv.append(newValueDiv);
        }
      }
    },
    error: function (error) {
    alert("Error facing here",error);
    },
  });

  $("#sellerSelect").on("change", function () {
    var selectedOption = $("#sellerSelect option:selected");
 
    var pricebookId = selectedOption.attr("pricebookids").trim(); // Trim leading/trailing spaces
    var pricebookIdsArray = pricebookId.split(' '); // Split the string by spaces
    var productId = selectedOption.data("pid"); // variant ids
    var locale = selectedOption.data("lc");
    var actualPricebook = null;
    for(var i=0;i<pricebookIdsArray.length; i++){
      var value = pricebookIdsArray[i].split('-');
      var localeCheck = value[0];
      if(locale == localeCheck){
        actualPricebook = pricebookIdsArray[i]
      }
    }
    var rankPriceId = selectedOption.data("lowerrankpriceid");
    var selectedSeller = selectedOption.attr("refid");
    alert(actualPricebook);
    var path = $("#newVariant").val()
    var form = {
        pricebookId: actualPricebook,
        productId: productId,
        selectedSeller: selectedSeller,
        fetchSellerByPrice:true
    };
 
    $.ajax({
        url: path + '?fetchSellerByPrice=true',
        method: "GET",
        data: form,
        success: function (response) {
            var availableStock = response.availableStock;
            var perpetual = response.perpetual;
            var rangeDiv = $(".price");
            rangeDiv.empty();
            var stockInputLocation = $("#stockInputLocation");
            var stockInput = $("<input>").attr({
                type: "text",
                id: "stockInput",
                name: "stockInput",
                value: availableStock,
                readonly: "readonly",
            });
            stockInputLocation.html(stockInput);
 
            for (var i = 0; i < pricebookIdsArray.length; i++) {
                var pricebookId = pricebookIdsArray[i];
                if (response.validPrices.hasOwnProperty(pricebookId)) {
                    var priceValue = response.validPrices[pricebookId];
                    var newValueDiv = $("<div>").text(
                        "Price for " + pricebookId + ": " + priceValue
                    );
                    rangeDiv.append(newValueDiv);
                }
            }
 
            var addToCartDiv = $(".addToCart");
            var outOfStockMsg = $("#outOfStockMsg");
 
            if (availableStock > 0) {
                // Product is in stock, show the addToCart div and hide the message
                addToCartDiv.show();
                outOfStockMsg.hide();
                if( perpetual == "true"){
                  addToCartDiv.show();
                }
            } else {
                // Product is out of stock, hide the addToCart div and show the message
                addToCartDiv.hide();
                outOfStockMsg.text("Product is out of stock");
                outOfStockMsg.show();
            }
        },
        error: function () {
            alert("Error");
        },
    });
});
//   alert("Change event detected.");

//   // Perform the AJAX request
//   $.ajax({
//       url: $("#sellerPriceSize").val(), // Replace with the correct server endpoint URL
//       method: "GET",
//       success: function (response) {
//           console.log("Success: " + response); // Use the 'response' variable
//       },
//       error: function () {
//           // Handle the error
//           alert("Error occurred.");
//       },
//   });
// });

//   $(".select-size").on("change", function () {
//     // alert("dfdfdfdf");

//     var prId = $(".product-id").text();
//     alert(prId);
//     var variantPoId = "701643415373M"; // variant ids
//      var data = {
//        variantPoId: variantPoId,
//      };
//      $.ajax({
//        url: $("#sellerPriceSize").val(),
//        method: "POST",
//        data: data,
//        success: function (response) {
//          alert("hhhh");
//        },
//        error: function () {
//          alert("Error");
//        },
//      });
//  });
  // $("#sellerSelect").on("change", function () {
  //   var selectedOption = $("#sellerSelect option:selected");
  //   var pricebookId = selectedOption.attr("pricebookids");
  //   var productId = selectedOption.data("pid");
  //   var rankPriceId = selectedOption.data("lowerrankpriceid");
  //   var selectedSeller = selectedOption.attr("refid");
  //   alert(rankPriceId);
  //   var form = {
  //     pricebookId: pricebookId,
  //     productId: productId,
  //     selectedSeller: selectedSeller
  //   };

  //   $.ajax({
  //     url: $("#seller-url").val(),
  //     method: "POST",
  //     data: form,
  //     success: function (response) {
  //       var availableStock = response.availableStock;
  //       var rangeDiv = $(".range");
  //       rangeDiv.empty();
  //       var stockInputLocation = $("#stockInputLocation");
  //       var stockInput = $("<input>").attr({
  //         type: "text",
  //         id: "stockInput",
  //         name: "stockInput",
  //         value: availableStock,
  //         readonly: "readonly",
  //       });
  //       stockInputLocation.html(stockInput);

  //       for ( pricebookId in response.validPrices) {
  //         if (response.validPrices.hasOwnProperty(pricebookId)) {
  //           var priceValue = response.validPrices[pricebookId];
  //           var newValueDiv = $("<div>").text(
  //             "Price for " + pricebookId + ": " + priceValue
  //           );
  //           rangeDiv.append(newValueDiv);
  //         }
  //       }

  //       var addToCartDiv = $(".addToCart");
  //       var outOfStockMsg = $("#outOfStockMsg");

  //       if (availableStock > 0) {
  //         // Product is in stock, show the addToCart div and hide the message
  //         addToCartDiv.show();
  //         outOfStockMsg.hide();
  //       } else {
  //         // Product is out of stock, hide the addToCart div and show the message
  //         addToCartDiv.hide();
  //         outOfStockMsg.text("Product is out of stock");
  //         outOfStockMsg.show();
  //       }
  //     },
  //     error: function () {
  //       alert("Error");
  //     },
  //   });
  // });
});
