  console.log("background running...");

  var tabId;
  let lastWindowId;
  let tabRemovedListenerActive = false;

  var urls = [];
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      console.log("url opened - ", changeInfo.url);
      urls[tabId] = changeInfo.url;
    }
  });


  // Add an event listener for tab removal
  chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // Implement your logic here to handle tab closure
    tabClosed(tabId, removeInfo);
  });



  // Function to handle tab closure
  function tabClosed(tabId, removeInfo) {

      if(tabRemovedListenerActive || !urls[tabId].includes("www.myntra.com/checkout")) {
          console.log("not a checkout url or already called...")
          return;
      }

      console.log("closed url " + urls[tabId]);
      // You can call your custom function or perform any operations here
    
      // Define the URL you want to open and scrape
      var urlToOpen = "https://www.myntra.com/checkout/cart";
    
      // Create a new tab with the specified URL (hidden)
      
      
      // chrome.tabs.create({ url: urlToOpen, active: false}, function (tab) {
      //   if (chrome.runtime.lastError) {
      //     console.error(chrome.runtime.lastError);
      //   } else {
      //     // Inject a content script into the new tab
      //     chrome.scripting.executeScript({
      //       target: { tabId: tab.id }, // Specify the tabId here
      //       function: scrapePage,
      //     });
          
      //   }
      // });

      // Create a new browser window with the specified URL
      chrome.windows.create({
          url: urlToOpen,
          type: "normal", // "normal" opens a regular browser window
          focused: false, // Set to true if you want the window to be focused
          width: 1,
          height: 1
        }, function(window) {
          // The 'window' parameter contains information about the newly created window
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          } else {
            // You can access the window's ID using window.id
            console.log("New window ID: " + window.id);
            tabRemovedListenerActive = true;
            lastWindowId = window.id; 
        
            // Use the window ID to inject a content script into the newly created tab
            chrome.scripting.executeScript({
              target: { tabId: window.tabs[0].id }, // Specify the tabId of the first tab in the new window
              function: scrapePage, // Your content script function
            });
          }
        });


      
    
      // Content script to scrape data from the webpage
      function scrapePage() {
          // Capture the entire HTML of the page
          var pageHTML = document.documentElement.outerHTML;
      
          
          // Parse the HTML into a DOM tree
          var parser = new DOMParser();
          var doc = parser.parseFromString(pageHTML, 'text/html');
      
          // Find all div elements with a specific class (replace 'your-class' with the actual class name)
          var brands = doc.querySelectorAll('div.itemContainer-base-brand');
          var products = doc.querySelectorAll('a.itemContainer-base-itemLink');
          var prices = doc.querySelectorAll('div.itemComponents-base-price');

          var mergedData = [];

          // Iterate through the arrays
          for (var i = 0; i < brands.length; i++) {
          var brandText = brands[i].textContent.trim();
          var productText = products[i].textContent.trim();
          var priceText = prices[i].textContent.trim();

          // Create a JSON object and push it to the mergedData array
          var itemData = {
              brand: brandText,
              product: productText,
              price: priceText
          };

          mergedData.push(itemData);
          }
      
          chrome.runtime.sendMessage({ divContents: mergedData });

      }
    
    }
    
  // Listen for the message from the content script
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.divContents) {
        var products = message.divContents;
        console.log("Products :", products);

        chrome.windows.remove(lastWindowId, function() {
          if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
          } else {
              console.log("closed");
          }
      });

        //call chatgpt api from here with divContents
        
      }
    });
    
    