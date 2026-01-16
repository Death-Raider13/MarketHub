export interface HelpArticle {
  title: string
  category: string
  content: string
  readTime: number
  lastUpdated: string
  relatedArticles?: string[]
}

export const helpArticles: Record<string, HelpArticle> = {
  // Orders & Shipping Articles
  "how-to-track-my-order": {
    title: "How to Track My Order",
    category: "Orders & Shipping",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["shipping-methods-and-costs", "order-modifications"],
    content: `
      <h2>Tracking Your Order on FEROMARKETHUB</h2>
      <p>Once your order is confirmed and shipped, you'll receive tracking information to monitor your package's journey to your doorstep.</p>
      
      <h3>Getting Your Tracking Information</h3>
      <ol>
        <li><strong>Email Confirmation:</strong> You'll receive an email with your tracking number once your order ships</li>
        <li><strong>Account Dashboard:</strong> Log into your account and visit the "My Orders" section</li>
        <li><strong>SMS Updates:</strong> If you provided a phone number, you'll receive SMS updates</li>
      </ol>

      <h3>How to Track Your Package</h3>
      <ol>
        <li>Go to your <a href="/orders" class="text-primary hover:underline">Orders page</a></li>
        <li>Find your order and click "Track Package"</li>
        <li>You'll see real-time updates on your package location</li>
        <li>Estimated delivery date will be displayed</li>
      </ol>

      <h3>Tracking Status Meanings</h3>
      <ul>
        <li><strong>Order Confirmed:</strong> Your order has been received and is being prepared</li>
        <li><strong>Processing:</strong> Your items are being picked and packed</li>
        <li><strong>Shipped:</strong> Your package is on its way to you</li>
        <li><strong>Out for Delivery:</strong> Your package is with the delivery driver</li>
        <li><strong>Delivered:</strong> Your package has been delivered</li>
      </ul>

      <h3>Delivery Issues</h3>
      <p>If your tracking shows "Delivered" but you haven't received your package:</p>
      <ul>
        <li>Check with neighbors or building management</li>
        <li>Look around your property (porches, garages, etc.)</li>
        <li>Contact us within 48 hours if you still can't locate your package</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">💡 Pro Tip</p>
        <p class="text-blue-700 text-sm mt-1">Enable push notifications in your account settings to get real-time delivery updates on your phone!</p>
      </div>
    `
  },
  "shipping-methods-and-costs": {
    title: "Shipping Methods and Costs",
    category: "Orders & Shipping",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-track-my-order", "international-shipping"],
    content: `
      <h2>Shipping Options Available</h2>
      <p>FEROMARKETHUB offers multiple shipping options to meet your delivery needs and budget.</p>
      
      <h3>Domestic Shipping (Within Nigeria)</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Method</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Delivery Time</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Standard Shipping</td>
              <td class="border border-gray-300 px-4 py-2">3-7 business days</td>
              <td class="border border-gray-300 px-4 py-2">₦1,500 - ₦3,000</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Express Shipping</td>
              <td class="border border-gray-300 px-4 py-2">1-3 business days</td>
              <td class="border border-gray-300 px-4 py-2">₦3,500 - ₦6,000</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Same-Day Delivery</td>
              <td class="border border-gray-300 px-4 py-2">Within 24 hours</td>
              <td class="border border-gray-300 px-4 py-2">₦5,000 - ₦8,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Free Shipping Eligibility</h3>
      <ul>
        <li>Orders over ₦50,000 qualify for free standard shipping</li>
        <li>FEROMARKETHUB Premium members get free shipping on all orders</li>
        <li>Some vendors offer free shipping promotions</li>
      </ul>

      <h3>Shipping Cost Factors</h3>
      <p>Shipping costs are calculated based on:</p>
      <ul>
        <li><strong>Weight and Size:</strong> Heavier and larger items cost more to ship</li>
        <li><strong>Distance:</strong> Delivery location affects shipping cost</li>
        <li><strong>Speed:</strong> Faster delivery options cost more</li>
        <li><strong>Vendor Location:</strong> Items from different vendors may have separate shipping costs</li>
      </ul>

      <h3>Shipping Restrictions</h3>
      <p>Some items cannot be shipped to certain locations:</p>
      <ul>
        <li>Hazardous materials (batteries, chemicals, etc.)</li>
        <li>Fragile items to remote areas</li>
        <li>Large furniture items to apartments without elevators</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">💰 Money-Saving Tip</p>
        <p class="text-green-700 text-sm mt-1">Combine items from the same vendor in one order to save on shipping costs!</p>
      </div>
    `
  },

  "international-shipping": {
    title: "International Shipping",
    category: "Orders & Shipping",
    readTime: 5,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["shipping-methods-and-costs", "how-to-track-my-order"],
    content: `
      <h2>Shipping Worldwide from Nigeria</h2>
      <p>FEROMARKETHUB ships to over 50 countries worldwide. Here's everything you need to know about international shipping.</p>
      
      <h3>Available Countries</h3>
      <p>We currently ship to:</p>
      <ul>
        <li><strong>Africa:</strong> Ghana, Kenya, South Africa, Egypt, Morocco, and 15+ other countries</li>
        <li><strong>Europe:</strong> UK, Germany, France, Netherlands, Italy, Spain, and more</li>
        <li><strong>North America:</strong> USA, Canada</li>
        <li><strong>Asia:</strong> UAE, Saudi Arabia, India, China, Singapore</li>
        <li><strong>Oceania:</strong> Australia, New Zealand</li>
      </ul>

      <h3>International Shipping Options</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Service</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Delivery Time</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Tracking</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">International Standard</td>
              <td class="border border-gray-300 px-4 py-2">7-21 business days</td>
              <td class="border border-gray-300 px-4 py-2">✅ Full tracking</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">International Express</td>
              <td class="border border-gray-300 px-4 py-2">3-7 business days</td>
              <td class="border border-gray-300 px-4 py-2">✅ Full tracking</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Customs and Duties</h3>
      <p><strong>Important:</strong> International orders may be subject to customs duties and taxes.</p>
      <ul>
        <li>Customs fees are determined by your country's regulations</li>
        <li>You are responsible for paying any customs duties</li>
        <li>Packages may be delayed at customs for inspection</li>
        <li>We mark packages with accurate values as required by law</li>
      </ul>

      <h3>Restricted Items</h3>
      <p>The following items cannot be shipped internationally:</p>
      <ul>
        <li>Electronics with lithium batteries (some countries)</li>
        <li>Food and perishable items</li>
        <li>Liquids and cosmetics (restrictions vary)</li>
        <li>Items prohibited by destination country laws</li>
      </ul>

      <h3>International Shipping Costs</h3>
      <p>Costs vary by destination and are calculated at checkout based on:</p>
      <ul>
        <li>Package weight and dimensions</li>
        <li>Destination country</li>
        <li>Shipping speed selected</li>
        <li>Insurance value</li>
      </ul>

      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p class="text-yellow-800 font-medium">⚠️ Important Note</p>
        <p class="text-yellow-700 text-sm mt-1">Delivery times are estimates and may be affected by customs processing, weather, or other factors beyond our control.</p>
      </div>
    `
  },

  "order-modifications": {
    title: "Order Modifications",
    category: "Orders & Shipping",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-track-my-order", "how-to-return-an-item"],
    content: `
      <h2>Modifying Your Order</h2>
      <p>Need to change something about your order? Here's what you can do and when you can do it.</p>
      
      <h3>What Can Be Modified</h3>
      <ul>
        <li><strong>Shipping Address:</strong> Before the item ships</li>
        <li><strong>Payment Method:</strong> Within 1 hour of placing order</li>
        <li><strong>Order Cancellation:</strong> Before the item ships</li>
        <li><strong>Item Quantity:</strong> Before vendor confirms the order</li>
      </ul>

      <h3>How to Modify Your Order</h3>
      <ol>
        <li>Go to your <a href="/orders" class="text-primary hover:underline">Orders page</a></li>
        <li>Find the order you want to modify</li>
        <li>Click "Modify Order" if available</li>
        <li>Make your changes and confirm</li>
      </ol>

      <h3>Time Limits for Changes</h3>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <ul class="space-y-2">
          <li><strong>Within 1 hour:</strong> Full modifications allowed</li>
          <li><strong>1-24 hours:</strong> Address changes and cancellations only</li>
          <li><strong>After 24 hours:</strong> Contact vendor directly</li>
          <li><strong>After shipping:</strong> No modifications possible</li>
        </ul>
      </div>

      <h3>When Modifications Aren't Possible</h3>
      <p>You cannot modify orders when:</p>
      <ul>
        <li>The vendor has already shipped the item</li>
        <li>It's a custom or personalized item</li>
        <li>The item is on flash sale or clearance</li>
        <li>The order is being processed for same-day delivery</li>
      </ul>

      <h3>Canceling Your Order</h3>
      <p>To cancel an order:</p>
      <ol>
        <li>Go to your Orders page</li>
        <li>Find the order and click "Cancel Order"</li>
        <li>Select a cancellation reason</li>
        <li>Confirm cancellation</li>
      </ol>

      <p><strong>Refund Timeline:</strong> Cancelled orders are refunded within 3-5 business days to your original payment method.</p>

      <h3>Need Help?</h3>
      <p>If you can't modify your order online:</p>
      <ul>
        <li>Contact the vendor directly through their store page</li>
        <li>Use our <a href="/contact" class="text-primary hover:underline">Contact Support</a> form</li>
        <li>Call our customer service at 1-800-MARKET</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">⏰ Quick Tip</p>
        <p class="text-green-700 text-sm mt-1">The sooner you request changes, the more likely we can accommodate them. Check your order details immediately after placing it!</p>
      </div>
    `
  },
  // Returns & Refunds Articles
  "how-to-return-an-item": {
    title: "How to Return an Item",
    category: "Returns & Refunds",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["refund-processing-time", "exchange-policy"],
    content: `
      <h2>Easy Returns on FEROMARKETHUB</h2>
      <p>We want you to be completely satisfied with your purchase. If you're not happy with an item, returning it is simple and straightforward.</p>
      
      <h3>Return Eligibility</h3>
      <p>Items can be returned if they meet these conditions:</p>
      <ul>
        <li><strong>Time Limit:</strong> Within 7 days of delivery</li>
        <li><strong>Condition:</strong> Unused and in original packaging</li>
        <li><strong>Tags:</strong> All original tags and labels attached</li>
        <li><strong>Receipt:</strong> Original purchase receipt or order number</li>
      </ul>

      <h3>Items That Cannot Be Returned</h3>
      <ul>
        <li>Personalized or custom-made items</li>
        <li>Perishable goods (food, flowers, etc.)</li>
        <li>Intimate apparel and swimwear</li>
        <li>Digital downloads and software</li>
        <li>Items marked as "Final Sale"</li>
      </ul>

      <h3>How to Start a Return</h3>
      <ol>
        <li>Log into your account and go to <a href="/orders" class="text-primary hover:underline">My Orders</a></li>
        <li>Find your order and click "Request Return"</li>
        <li>Select the item(s) you want to return</li>
        <li>Choose your reason for returning</li>
        <li>Submit your return request</li>
      </ol>

      <h3>Return Process</h3>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
          <div>
            <h4 class="font-semibold">Request Approved</h4>
            <p class="text-sm text-gray-600">You'll receive an email with return instructions and a prepaid shipping label.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
          <div>
            <h4 class="font-semibold">Package Your Item</h4>
            <p class="text-sm text-gray-600">Pack the item securely in its original packaging if possible.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
          <div>
            <h4 class="font-semibold">Ship It Back</h4>
            <p class="text-sm text-gray-600">Attach the prepaid label and drop off at any authorized shipping location.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
          <div>
            <h4 class="font-semibold">Refund Processed</h4>
            <p class="text-sm text-gray-600">Once we receive and inspect your return, your refund will be processed.</p>
          </div>
        </div>
      </div>

      <h3>Return Shipping</h3>
      <ul>
        <li><strong>Free Returns:</strong> We provide prepaid return labels for most items</li>
        <li><strong>International Returns:</strong> Customer pays return shipping costs</li>
        <li><strong>Defective Items:</strong> We cover all return shipping costs</li>
      </ul>

      <h3>Refund Timeline</h3>
      <p>After we receive your returned item:</p>
      <ul>
        <li><strong>Inspection:</strong> 1-2 business days</li>
        <li><strong>Refund Processing:</strong> 3-5 business days</li>
        <li><strong>Bank Processing:</strong> 5-10 business days (varies by bank)</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">📦 Packing Tip</p>
        <p class="text-blue-700 text-sm mt-1">Keep the original packaging until you're sure you want to keep the item. It makes returns much easier!</p>
      </div>
    `
  },

  "refund-processing-time": {
    title: "Refund Processing Time",
    category: "Returns & Refunds",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-return-an-item", "accepted-payment-methods"],
    content: `
      <h2>Understanding Refund Timelines</h2>
      <p>We process refunds as quickly as possible, but the timeline depends on several factors including your payment method and bank processing times.</p>
      
      <h3>Refund Timeline Breakdown</h3>
      <div class="space-y-4">
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold text-blue-700">Order Cancellation</h4>
          <p class="text-sm">If you cancel before shipping: <strong>1-3 business days</strong></p>
        </div>
        <div class="border-l-4 border-green-500 pl-4">
          <h4 class="font-semibold text-green-700">Return Processing</h4>
          <p class="text-sm">After we receive your return: <strong>3-5 business days</strong></p>
        </div>
        <div class="border-l-4 border-orange-500 pl-4">
          <h4 class="font-semibold text-orange-700">Bank Processing</h4>
          <p class="text-sm">Your bank processes the refund: <strong>5-10 business days</strong></p>
        </div>
      </div>

      <h3>Refund Methods by Payment Type</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Payment Method</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Refund Time</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Refund Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Credit/Debit Card</td>
              <td class="border border-gray-300 px-4 py-2">5-10 business days</td>
              <td class="border border-gray-300 px-4 py-2">Original card</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Bank Transfer</td>
              <td class="border border-gray-300 px-4 py-2">3-7 business days</td>
              <td class="border border-gray-300 px-4 py-2">Original account</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Mobile Money</td>
              <td class="border border-gray-300 px-4 py-2">1-3 business days</td>
              <td class="border border-gray-300 px-4 py-2">Original wallet</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Cryptocurrency</td>
              <td class="border border-gray-300 px-4 py-2">1-2 business days</td>
              <td class="border border-gray-300 px-4 py-2">Original wallet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Factors That May Delay Refunds</h3>
      <ul>
        <li><strong>Bank Holidays:</strong> Processing may be delayed during holidays</li>
        <li><strong>International Cards:</strong> May take longer due to currency conversion</li>
        <li><strong>Closed Accounts:</strong> If your original payment method is closed</li>
        <li><strong>Disputed Transactions:</strong> Additional verification may be required</li>
      </ul>

      <h3>Tracking Your Refund</h3>
      <p>You can track your refund status:</p>
      <ol>
        <li>Check your <a href="/orders" class="text-primary hover:underline">Orders page</a> for refund status</li>
        <li>Look for email updates about your refund</li>
        <li>Check your bank/card statement for the credit</li>
        <li>Contact us if it's been longer than expected</li>
      </ol>

      <h3>Partial Refunds</h3>
      <p>Sometimes you may receive a partial refund if:</p>
      <ul>
        <li>The item shows signs of use or damage</li>
        <li>Original packaging is missing</li>
        <li>Return is made after the 7-day window</li>
        <li>Promotional discounts need to be recalculated</li>
      </ul>

      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p class="text-yellow-800 font-medium">⏰ Still Waiting?</p>
        <p class="text-yellow-700 text-sm mt-1">If it's been more than 10 business days since we processed your refund, please contact your bank first, then reach out to us if needed.</p>
      </div>
    `
  },

  "exchange-policy": {
    title: "Exchange Policy",
    category: "Returns & Refunds",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-return-an-item", "refund-processing-time"],
    content: `
      <h2>Product Exchanges Made Easy</h2>
      <p>Need a different size, color, or style? Our exchange policy makes it simple to get exactly what you want.</p>
      
      <h3>What Can Be Exchanged</h3>
      <ul>
        <li><strong>Size Exchanges:</strong> Clothing, shoes, and accessories</li>
        <li><strong>Color Exchanges:</strong> Same product in different color</li>
        <li><strong>Style Exchanges:</strong> Similar items from the same vendor</li>
        <li><strong>Defective Items:</strong> Replacement for damaged products</li>
      </ul>

      <h3>Exchange Requirements</h3>
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <ul class="space-y-2">
          <li>✅ Item must be unused and in original condition</li>
          <li>✅ All tags and labels must be attached</li>
          <li>✅ Exchange requested within 7 days of delivery</li>
          <li>✅ Replacement item must be available in stock</li>
          <li>✅ Price difference may apply for upgrades</li>
        </ul>
      </div>

      <h3>How to Request an Exchange</h3>
      <ol>
        <li>Go to your <a href="/orders" class="text-primary hover:underline">Orders page</a></li>
        <li>Find your order and click "Exchange Item"</li>
        <li>Select the item you want to exchange</li>
        <li>Choose your preferred replacement (size, color, etc.)</li>
        <li>Submit your exchange request</li>
      </ol>

      <h3>Exchange Process</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
          <span>We'll send you a prepaid return label</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
          <span>Ship your original item back to us</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
          <span>We'll send your replacement item</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
          <span>Receive your new item in 3-7 business days</span>
        </div>
      </div>

      <h3>Exchange Fees</h3>
      <ul>
        <li><strong>Same Price Items:</strong> Free exchange</li>
        <li><strong>Higher Price Items:</strong> Pay the difference</li>
        <li><strong>Lower Price Items:</strong> Receive store credit for difference</li>
        <li><strong>Defective Items:</strong> Always free exchange</li>
      </ul>

      <h3>Items That Cannot Be Exchanged</h3>
      <ul>
        <li>Final sale or clearance items</li>
        <li>Personalized or custom products</li>
        <li>Intimate apparel and swimwear</li>
        <li>Electronics and digital products</li>
        <li>Perishable goods</li>
      </ul>

      <h3>International Exchanges</h3>
      <p>For international customers:</p>
      <ul>
        <li>Exchange shipping costs may apply</li>
        <li>Customs duties are customer's responsibility</li>
        <li>Processing time may be longer due to customs</li>
        <li>Some items may not be available for international exchange</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">💡 Smart Shopping Tip</p>
        <p class="text-green-700 text-sm mt-1">Check the size guide and product reviews before ordering to reduce the need for exchanges!</p>
      </div>
    `
  },

  "return-shipping-costs": {
    title: "Return Shipping Costs",
    category: "Returns & Refunds",
    readTime: 2,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-return-an-item", "exchange-policy"],
    content: `
      <h2>Understanding Return Shipping Costs</h2>
      <p>We strive to make returns as affordable as possible. Here's what you need to know about return shipping costs.</p>
      
      <h3>When Return Shipping is FREE</h3>
      <ul>
        <li><strong>Defective Items:</strong> Product arrived damaged or not as described</li>
        <li><strong>Wrong Item:</strong> We sent you the incorrect product</li>
        <li><strong>Vendor Error:</strong> Vendor made a mistake with your order</li>
        <li><strong>Premium Members:</strong> FEROMARKETHUB Premium members get free returns</li>
        <li><strong>High-Value Orders:</strong> Orders over ₦100,000 include free returns</li>
      </ul>

      <h3>When You Pay Return Shipping</h3>
      <ul>
        <li><strong>Change of Mind:</strong> You simply don't want the item anymore</li>
        <li><strong>Size Issues:</strong> Item doesn't fit as expected</li>
        <li><strong>Color Preference:</strong> You prefer a different color</li>
        <li><strong>Style Change:</strong> You found something you like better</li>
      </ul>

      <h3>Return Shipping Costs</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Item Category</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Domestic Return</th>
              <th class="border border-gray-300 px-4 py-2 text-left">International Return</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Small Items (under 1kg)</td>
              <td class="border border-gray-300 px-4 py-2">₦1,000 - ₦2,000</td>
              <td class="border border-gray-300 px-4 py-2">$15 - $25</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Medium Items (1-5kg)</td>
              <td class="border border-gray-300 px-4 py-2">₦2,500 - ₦4,000</td>
              <td class="border border-gray-300 px-4 py-2">$25 - $45</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Large Items (over 5kg)</td>
              <td class="border border-gray-300 px-4 py-2">₦5,000 - ₦8,000</td>
              <td class="border border-gray-300 px-4 py-2">$45 - $80</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>How Return Shipping is Deducted</h3>
      <p>When you pay for return shipping:</p>
      <ul>
        <li>Shipping cost is deducted from your refund amount</li>
        <li>You'll see the deduction clearly on your refund confirmation</li>
        <li>The exact cost depends on the item's weight and your location</li>
      </ul>

      <h3>Ways to Avoid Return Shipping Costs</h3>
      <ol>
        <li><strong>Read Product Descriptions:</strong> Carefully check size charts and specifications</li>
        <li><strong>Check Reviews:</strong> See what other customers say about sizing and quality</li>
        <li><strong>Contact Vendors:</strong> Ask questions before purchasing</li>
        <li><strong>Consider Premium:</strong> FEROMARKETHUB Premium includes free returns</li>
      </ol>

      <h3>Return Shipping Insurance</h3>
      <p>We recommend insuring valuable returns:</p>
      <ul>
        <li>Items over ₦50,000 should be insured</li>
        <li>Insurance costs 1-2% of item value</li>
        <li>Protects against loss or damage during return shipping</li>
        <li>Required for jewelry and electronics returns</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">💰 Cost-Saving Tip</p>
        <p class="text-blue-700 text-sm mt-1">Bundle multiple returns in one package to save on shipping costs. Just make sure to include all return forms!</p>
      </div>
    `
  },
  // Payment & Billing Articles
  "accepted-payment-methods": {
    title: "Accepted Payment Methods",
    category: "Payment & Billing",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["payment-security", "how-to-get-an-invoice"],
    content: `
      <h2>Payment Options on FEROMARKETHUB</h2>
      <p>We accept a wide variety of payment methods to make shopping convenient for everyone, whether you're in Nigeria or shopping internationally.</p>
      
      <h3>Nigerian Payment Methods</h3>
      
      <h4>🏦 Bank Cards</h4>
      <ul>
        <li><strong>Debit Cards:</strong> Visa, Mastercard, Verve</li>
        <li><strong>Credit Cards:</strong> Visa, Mastercard, American Express</li>
        <li><strong>Prepaid Cards:</strong> All major prepaid cards accepted</li>
      </ul>

      <h4>📱 Mobile Money & Digital Wallets</h4>
      <ul>
        <li><strong>Paystack:</strong> Secure card processing</li>
        <li><strong>Flutterwave:</strong> Multiple payment options</li>
        <li><strong>Opay:</strong> Digital wallet payments</li>
        <li><strong>Kuda:</strong> Bank transfers and cards</li>
        <li><strong>PalmPay:</strong> Mobile wallet</li>
      </ul>

      <h4>🏧 Bank Transfers</h4>
      <ul>
        <li><strong>Direct Bank Transfer:</strong> Transfer directly to vendor accounts</li>
        <li><strong>USSD Payments:</strong> Pay using your phone's USSD codes</li>
        <li><strong>Internet Banking:</strong> Online bank transfers</li>
      </ul>

      <h3>International Payment Methods</h3>
      
      <h4>💳 International Cards</h4>
      <ul>
        <li><strong>Visa:</strong> Accepted worldwide</li>
        <li><strong>Mastercard:</strong> Global acceptance</li>
        <li><strong>American Express:</strong> Premium card support</li>
        <li><strong>Discover:</strong> US and international</li>
      </ul>

      <h4>🌐 Digital Payment Platforms</h4>
      <ul>
        <li><strong>PayPal:</strong> Secure international payments</li>
        <li><strong>Stripe:</strong> Global payment processing</li>
        <li><strong>Apple Pay:</strong> Quick mobile payments</li>
        <li><strong>Google Pay:</strong> Android device payments</li>
      </ul>

      <h4>₿ Cryptocurrency</h4>
      <ul>
        <li><strong>Bitcoin (BTC):</strong> The original cryptocurrency</li>
        <li><strong>Ethereum (ETH):</strong> Smart contract payments</li>
        <li><strong>USDC:</strong> Stable coin payments</li>
        <li><strong>Other Altcoins:</strong> Selected cryptocurrencies</li>
      </ul>

      <h3>Payment Security Features</h3>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <ul class="space-y-2">
          <li>🔒 <strong>SSL Encryption:</strong> All transactions are encrypted</li>
          <li>🛡️ <strong>PCI Compliance:</strong> Industry-standard security</li>
          <li>🔐 <strong>Two-Factor Authentication:</strong> Extra security layer</li>
          <li>🚫 <strong>Fraud Protection:</strong> Advanced fraud detection</li>
          <li>💰 <strong>Buyer Protection:</strong> Money-back guarantee</li>
        </ul>
      </div>

      <h3>Payment Processing Times</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Payment Method</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Processing Time</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Confirmation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Debit/Credit Cards</td>
              <td class="border border-gray-300 px-4 py-2">Instant</td>
              <td class="border border-gray-300 px-4 py-2">Immediate</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Bank Transfer</td>
              <td class="border border-gray-300 px-4 py-2">1-24 hours</td>
              <td class="border border-gray-300 px-4 py-2">After verification</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Mobile Money</td>
              <td class="border border-gray-300 px-4 py-2">Instant</td>
              <td class="border border-gray-300 px-4 py-2">Immediate</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Cryptocurrency</td>
              <td class="border border-gray-300 px-4 py-2">10-60 minutes</td>
              <td class="border border-gray-300 px-4 py-2">After blockchain confirmation</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Currency Support</h3>
      <ul>
        <li><strong>Nigerian Naira (₦):</strong> Primary currency</li>
        <li><strong>US Dollar ($):</strong> International transactions</li>
        <li><strong>Euro (€):</strong> European customers</li>
        <li><strong>British Pound (£):</strong> UK customers</li>
        <li><strong>Other Currencies:</strong> Automatic conversion available</li>
      </ul>

      <h3>Payment Fees</h3>
      <p>Most payment methods are free for buyers:</p>
      <ul>
        <li><strong>Debit/Credit Cards:</strong> No additional fees</li>
        <li><strong>Bank Transfers:</strong> Your bank's standard fees apply</li>
        <li><strong>International Cards:</strong> Currency conversion fees may apply</li>
        <li><strong>Cryptocurrency:</strong> Network fees apply</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">💡 Payment Tip</p>
        <p class="text-blue-700 text-sm mt-1">Save your preferred payment method in your account for faster checkout on future purchases!</p>
      </div>
    `
  },

  "payment-security": {
    title: "Payment Security",
    category: "Payment & Billing",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["accepted-payment-methods", "account-security-tips"],
    content: `
      <h2>Your Payment Security is Our Priority</h2>
      <p>At FEROMARKETHUB, we use industry-leading security measures to protect your financial information and ensure safe transactions.</p>
      
      <h3>Security Technologies We Use</h3>
      
      <h4>🔒 SSL Encryption</h4>
      <ul>
        <li>All payment data is encrypted using 256-bit SSL</li>
        <li>Your information is scrambled during transmission</li>
        <li>Look for the padlock icon in your browser</li>
        <li>Our security certificate is verified by trusted authorities</li>
      </ul>

      <h4>🛡️ PCI DSS Compliance</h4>
      <ul>
        <li>We meet Payment Card Industry Data Security Standards</li>
        <li>Regular security audits and assessments</li>
        <li>Secure storage of payment information</li>
        <li>Restricted access to sensitive data</li>
      </ul>

      <h4>🔐 Tokenization</h4>
      <ul>
        <li>Your card details are replaced with secure tokens</li>
        <li>Real card numbers are never stored on our servers</li>
        <li>Tokens are useless if intercepted</li>
        <li>Enhanced protection for saved payment methods</li>
      </ul>

      <h3>Fraud Protection Measures</h3>
      
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 class="text-red-800 font-semibold">🚨 Fraud Detection</h4>
        <ul class="text-red-700 text-sm mt-2 space-y-1">
          <li>Real-time transaction monitoring</li>
          <li>Suspicious activity alerts</li>
          <li>Machine learning fraud detection</li>
          <li>Velocity checking for unusual patterns</li>
        </ul>
      </div>

      <h4>🔍 Transaction Verification</h4>
      <ul>
        <li><strong>3D Secure:</strong> Additional authentication for card payments</li>
        <li><strong>CVV Verification:</strong> Card security code checking</li>
        <li><strong>Address Verification:</strong> Billing address confirmation</li>
        <li><strong>Device Fingerprinting:</strong> Recognizing trusted devices</li>
      </ul>

      <h3>What We Never Store</h3>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <ul class="space-y-2">
          <li>❌ Full credit card numbers</li>
          <li>❌ CVV/CVC security codes</li>
          <li>❌ PIN numbers</li>
          <li>❌ Bank account passwords</li>
          <li>❌ Cryptocurrency private keys</li>
        </ul>
      </div>

      <h3>Your Role in Payment Security</h3>
      
      <h4>✅ Best Practices</h4>
      <ul>
        <li><strong>Use Strong Passwords:</strong> Create unique, complex passwords</li>
        <li><strong>Enable 2FA:</strong> Add two-factor authentication to your account</li>
        <li><strong>Shop on Secure Networks:</strong> Avoid public Wi-Fi for payments</li>
        <li><strong>Keep Software Updated:</strong> Update your browser and apps</li>
        <li><strong>Monitor Statements:</strong> Check your bank statements regularly</li>
      </ul>

      <h4>🚩 Red Flags to Watch For</h4>
      <ul>
        <li>Emails asking for payment information</li>
        <li>Suspicious login attempts notifications</li>
        <li>Unexpected charges on your account</li>
        <li>Requests to update payment info via email</li>
      </ul>

      <h3>Secure Payment Process</h3>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h5 class="font-semibold">Secure Connection</h5>
            <p class="text-sm text-gray-600">Your browser establishes an encrypted connection</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h5 class="font-semibold">Data Encryption</h5>
            <p class="text-sm text-gray-600">Payment information is encrypted before transmission</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <h5 class="font-semibold">Fraud Screening</h5>
            <p class="text-sm text-gray-600">Transaction is screened for suspicious activity</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
          <div>
            <h5 class="font-semibold">Authorization</h5>
            <p class="text-sm text-gray-600">Payment is authorized by your bank</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
          <div>
            <h5 class="font-semibold">Confirmation</h5>
            <p class="text-sm text-gray-600">You receive instant payment confirmation</p>
          </div>
        </div>
      </div>

      <h3>If You Suspect Fraud</h3>
      <p>If you notice unauthorized charges or suspicious activity:</p>
      <ol>
        <li><strong>Contact Your Bank:</strong> Report the issue immediately</li>
        <li><strong>Change Your Password:</strong> Update your FEROMARKETHUB password</li>
        <li><strong>Contact Us:</strong> Report the incident to our security team</li>
        <li><strong>Monitor Your Accounts:</strong> Watch for additional suspicious activity</li>
      </ol>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">🛡️ Security Guarantee</p>
        <p class="text-green-700 text-sm mt-1">We guarantee that your payment information is secure. If you experience fraud due to a security breach on our end, we'll cover any losses.</p>
      </div>
    `
  },

  "how-to-get-an-invoice": {
    title: "How to Get an Invoice",
    category: "Payment & Billing",
    readTime: 2,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["accepted-payment-methods", "promo-codes-and-discounts"],
    content: `
      <h2>Getting Your Purchase Invoice</h2>
      <p>Need an invoice for your purchase? We make it easy to download and print invoices for all your orders.</p>
      
      <h3>Automatic Invoice Generation</h3>
      <p>Every purchase on FEROMARKETHUB automatically generates an invoice that includes:</p>
      <ul>
        <li><strong>Invoice Number:</strong> Unique identifier for your purchase</li>
        <li><strong>Purchase Date:</strong> When the transaction was completed</li>
        <li><strong>Item Details:</strong> Product names, quantities, and prices</li>
        <li><strong>Tax Information:</strong> VAT and other applicable taxes</li>
        <li><strong>Payment Method:</strong> How you paid for the order</li>
        <li><strong>Vendor Information:</strong> Details about the seller</li>
      </ul>

      <h3>How to Download Your Invoice</h3>
      
      <h4>📧 From Your Email</h4>
      <ol>
        <li>Check your email for the order confirmation</li>
        <li>Look for "Download Invoice" button or link</li>
        <li>Click to download the PDF invoice</li>
        <li>Save or print as needed</li>
      </ol>

      <h4>💻 From Your Account</h4>
      <ol>
        <li>Log into your FEROMARKETHUB account</li>
        <li>Go to <a href="/orders" class="text-primary hover:underline">My Orders</a></li>
        <li>Find your order and click "View Details"</li>
        <li>Click "Download Invoice" button</li>
        <li>The PDF will download to your device</li>
      </ol>

      <h4>📱 From Mobile App</h4>
      <ol>
        <li>Open the FEROMARKETHUB mobile app</li>
        <li>Tap "Orders" in the bottom menu</li>
        <li>Select your order</li>
        <li>Tap "Invoice" to view or share</li>
      </ol>

      <h3>Invoice Information Included</h3>
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h5 class="font-semibold mb-2">Buyer Information</h5>
            <ul class="text-sm space-y-1">
              <li>• Your name and address</li>
              <li>• Email and phone number</li>
              <li>• Customer ID</li>
            </ul>
          </div>
          <div>
            <h5 class="font-semibold mb-2">Seller Information</h5>
            <ul class="text-sm space-y-1">
              <li>• Vendor name and address</li>
              <li>• Business registration details</li>
              <li>• Tax identification number</li>
            </ul>
          </div>
        </div>
      </div>

      <h3>Business Invoice Requirements</h3>
      <p>If you need an invoice for business purposes, make sure to:</p>
      <ul>
        <li><strong>Use Business Account:</strong> Register with your company details</li>
        <li><strong>Provide Tax ID:</strong> Add your business tax identification</li>
        <li><strong>Complete Address:</strong> Include full business address</li>
        <li><strong>Specify Requirements:</strong> Contact vendor for specific invoice formats</li>
      </ul>

      <h3>Custom Invoice Requests</h3>
      <p>Need a custom invoice format? Here's what you can do:</p>
      <ol>
        <li><strong>Contact the Vendor:</strong> Reach out directly for custom invoicing</li>
        <li><strong>Specify Requirements:</strong> Explain what format you need</li>
        <li><strong>Provide Details:</strong> Give all necessary business information</li>
        <li><strong>Allow Processing Time:</strong> Custom invoices may take 1-2 business days</li>
      </ol>

      <h3>Invoice for Multiple Orders</h3>
      <p>If you made multiple purchases and need a consolidated invoice:</p>
      <ul>
        <li>Contact our <a href="/contact" class="text-primary hover:underline">customer support</a></li>
        <li>Provide all order numbers you want consolidated</li>
        <li>Specify the date range for the consolidated invoice</li>
        <li>We'll create a summary invoice within 2-3 business days</li>
      </ul>

      <h3>Lost Invoice Recovery</h3>
      <p>Can't find your invoice? No problem:</p>
      <ul>
        <li>Check your email spam/junk folder</li>
        <li>Log into your account to re-download</li>
        <li>Contact support with your order number</li>
        <li>We can resend the invoice to your email</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">📄 Invoice Tip</p>
        <p class="text-blue-700 text-sm mt-1">Keep your invoices organized by creating a dedicated email folder or saving PDFs to a specific folder on your computer!</p>
      </div>
    `
  },

  "promo-codes-and-discounts": {
    title: "Promo Codes and Discounts",
    category: "Payment & Billing",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["accepted-payment-methods", "how-to-get-an-invoice"],
    content: `
      <h2>Save Money with Promo Codes and Discounts</h2>
      <p>FEROMARKETHUB offers various ways to save money on your purchases through promo codes, discounts, and special offers.</p>
      
      <h3>Types of Discounts Available</h3>
      
      <h4>🎫 Promo Codes</h4>
      <ul>
        <li><strong>Percentage Off:</strong> Get 10%, 20%, or more off your order</li>
        <li><strong>Fixed Amount:</strong> Save a specific amount (e.g., ₦5,000 off)</li>
        <li><strong>Free Shipping:</strong> No shipping charges on your order</li>
        <li><strong>Buy One Get One:</strong> BOGO deals on selected items</li>
      </ul>

      <h4>🏷️ Automatic Discounts</h4>
      <ul>
        <li><strong>Flash Sales:</strong> Limited-time price reductions</li>
        <li><strong>Bulk Discounts:</strong> Save when buying multiple items</li>
        <li><strong>Seasonal Sales:</strong> Holiday and seasonal promotions</li>
        <li><strong>Clearance Prices:</strong> Deep discounts on end-of-line items</li>
      </ul>

      <h3>How to Use Promo Codes</h3>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h5 class="font-semibold">Add Items to Cart</h5>
            <p class="text-sm text-gray-600">Shop and add your desired items to your shopping cart</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h5 class="font-semibold">Go to Checkout</h5>
            <p class="text-sm text-gray-600">Click on your cart and proceed to checkout</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <h5 class="font-semibold">Enter Promo Code</h5>
            <p class="text-sm text-gray-600">Look for "Promo Code" or "Discount Code" field</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
          <div>
            <h5 class="font-semibold">Apply and Save</h5>
            <p class="text-sm text-gray-600">Click "Apply" to see your discount reflected in the total</p>
          </div>
        </div>
      </div>

      <h3>Where to Find Promo Codes</h3>
      <ul>
        <li><strong>Email Newsletter:</strong> Subscribe for exclusive codes</li>
        <li><strong>Social Media:</strong> Follow us for flash promo codes</li>
        <li><strong>Mobile App:</strong> App-exclusive discounts</li>
        <li><strong>Vendor Stores:</strong> Individual vendor promotions</li>
        <li><strong>Special Events:</strong> Birthday, anniversary, and holiday codes</li>
        <li><strong>Referral Program:</strong> Earn codes by referring friends</li>
      </ul>

      <h3>Current Promotions</h3>
      <div class="space-y-4">
        <div class="border border-green-200 bg-green-50 rounded-lg p-4">
          <h5 class="font-semibold text-green-800">🎉 New Customer Discount</h5>
          <p class="text-green-700 text-sm">Get 15% off your first order with code: <strong>WELCOME15</strong></p>
          <p class="text-green-600 text-xs">Valid for orders over ₦10,000. Expires: January 31, 2025</p>
        </div>
        
        <div class="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h5 class="font-semibold text-blue-800">🚚 Free Shipping Weekend</h5>
          <p class="text-blue-700 text-sm">Free shipping on all orders with code: <strong>FREESHIP</strong></p>
          <p class="text-blue-600 text-xs">Valid on weekends only. No minimum order required.</p>
        </div>
        
        <div class="border border-purple-200 bg-purple-50 rounded-lg p-4">
          <h5 class="font-semibold text-purple-800">💎 Premium Member Exclusive</h5>
          <p class="text-purple-700 text-sm">Extra 10% off sale items with code: <strong>PREMIUM10</strong></p>
          <p class="text-purple-600 text-xs">For FEROMARKETHUB Premium members only</p>
        </div>
      </div>

      <h3>Discount Stacking Rules</h3>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 class="font-semibold text-yellow-800">⚠️ Important Rules</h5>
        <ul class="text-yellow-700 text-sm mt-2 space-y-1">
          <li>• Only one promo code per order</li>
          <li>• Promo codes cannot be combined with other codes</li>
          <li>• Some codes exclude sale items</li>
          <li>• Minimum order requirements may apply</li>
          <li>• Codes cannot be applied to shipping costs (unless specified)</li>
        </ul>
      </div>

      <h3>Troubleshooting Promo Codes</h3>
      
      <h4>❌ Code Not Working?</h4>
      <ul>
        <li><strong>Check Expiration:</strong> Make sure the code hasn't expired</li>
        <li><strong>Minimum Order:</strong> Verify you meet the minimum purchase amount</li>
        <li><strong>Eligible Items:</strong> Some codes only work on specific products</li>
        <li><strong>First-Time Use:</strong> Some codes are for new customers only</li>
        <li><strong>Case Sensitive:</strong> Enter the code exactly as shown</li>
      </ul>

      <h4>✅ Common Solutions</h4>
      <ul>
        <li>Clear your browser cache and try again</li>
        <li>Make sure you're logged into your account</li>
        <li>Remove and re-add items to your cart</li>
        <li>Try the code in incognito/private browsing mode</li>
      </ul>

      <h3>Loyalty Program Benefits</h3>
      <p>Join our loyalty program for ongoing savings:</p>
      <ul>
        <li><strong>Points System:</strong> Earn 1 point per ₦100 spent</li>
        <li><strong>Tier Benefits:</strong> Higher tiers get better discounts</li>
        <li><strong>Birthday Rewards:</strong> Special discount on your birthday</li>
        <li><strong>Early Access:</strong> Shop sales before everyone else</li>
        <li><strong>Exclusive Codes:</strong> Member-only promo codes</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">💰 Savings Tip</p>
        <p class="text-green-700 text-sm mt-1">Sign up for our newsletter and follow our social media accounts to never miss a discount opportunity!</p>
      </div>
    `
  },
  // Account & Security Articles
  "create-an-account": {
    title: "Create an Account",
    category: "Account & Security",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["reset-password", "update-profile-information"],
    content: `
      <h2>Creating Your FEROMARKETHUB Account</h2>
      <p>Join millions of shoppers and vendors on FEROMARKETHUB. Creating an account is quick, free, and gives you access to exclusive features.</p>
      
      <h3>Benefits of Having an Account</h3>
      <ul>
        <li><strong>Faster Checkout:</strong> Save your payment and shipping information</li>
        <li><strong>Order Tracking:</strong> Monitor all your purchases in one place</li>
        <li><strong>Wishlist:</strong> Save items for later purchase</li>
        <li><strong>Exclusive Deals:</strong> Access member-only discounts</li>
        <li><strong>Personalized Recommendations:</strong> Get product suggestions based on your interests</li>
        <li><strong>Vendor Communication:</strong> Message sellers directly</li>
        <li><strong>Review System:</strong> Leave and read product reviews</li>
      </ul>

      <h3>How to Create Your Account</h3>
      
      <h4>📧 Email Registration</h4>
      <ol>
        <li>Go to the <a href="/auth/register" class="text-primary hover:underline">Sign Up page</a></li>
        <li>Enter your email address</li>
        <li>Create a strong password</li>
        <li>Confirm your password</li>
        <li>Agree to our Terms of Service and Privacy Policy</li>
        <li>Click "Create Account"</li>
        <li>Check your email for verification link</li>
        <li>Click the verification link to activate your account</li>
      </ol>

      <h4>📱 Social Media Registration</h4>
      <p>Sign up quickly using your existing social media accounts:</p>
      <ul>
        <li><strong>Google:</strong> Use your Gmail account</li>
        <li><strong>Facebook:</strong> Connect with your Facebook profile</li>
        <li><strong>Apple:</strong> Sign in with Apple ID (iOS users)</li>
        <li><strong>Twitter:</strong> Use your Twitter account</li>
      </ul>

      <h3>Account Information Required</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 class="font-semibold text-blue-800 mb-2">Required Information</h5>
          <ul class="text-blue-700 text-sm space-y-1">
            <li>• Email address</li>
            <li>• Password (8+ characters)</li>
            <li>• First and last name</li>
            <li>• Phone number</li>
          </ul>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">Optional Information</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• Profile picture</li>
            <li>• Date of birth</li>
            <li>• Gender</li>
            <li>• Interests and preferences</li>
          </ul>
        </div>
      </div>

      <h3>Password Requirements</h3>
      <p>Create a strong password that includes:</p>
      <ul>
        <li>✅ At least 8 characters long</li>
        <li>✅ At least one uppercase letter (A-Z)</li>
        <li>✅ At least one lowercase letter (a-z)</li>
        <li>✅ At least one number (0-9)</li>
        <li>✅ At least one special character (!@#$%^&*)</li>
      </ul>

      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 class="font-semibold text-red-800">❌ Avoid These Passwords</h5>
        <ul class="text-red-700 text-sm mt-2 space-y-1">
          <li>• Common words (password, 123456)</li>
          <li>• Personal information (name, birthday)</li>
          <li>• Sequential characters (abcd, 1234)</li>
          <li>• Previously breached passwords</li>
        </ul>
      </div>

      <h3>Email Verification</h3>
      <p>After creating your account, you'll need to verify your email:</p>
      <ol>
        <li><strong>Check Your Inbox:</strong> Look for an email from FEROMARKETHUB</li>
        <li><strong>Check Spam Folder:</strong> Sometimes verification emails end up in spam</li>
        <li><strong>Click Verification Link:</strong> This activates your account</li>
        <li><strong>Resend if Needed:</strong> Didn't receive it? Request a new verification email</li>
      </ol>

      <h3>Account Types</h3>
      
      <h4>🛍️ Customer Account</h4>
      <ul>
        <li>Shop from thousands of vendors</li>
        <li>Track orders and manage returns</li>
        <li>Save favorite items and vendors</li>
        <li>Leave product reviews</li>
      </ul>

      <h4>🏪 Vendor Account</h4>
      <ul>
        <li>Sell your products to millions of customers</li>
        <li>Manage inventory and orders</li>
        <li>Access sales analytics</li>
        <li>Promote your products</li>
        <li><em>Note: Requires additional verification and approval</em></li>
      </ul>

      <h3>Account Security Setup</h3>
      <p>After creating your account, enhance security by:</p>
      <ul>
        <li><strong>Enable 2FA:</strong> Add two-factor authentication</li>
        <li><strong>Add Recovery Email:</strong> Backup email for account recovery</li>
        <li><strong>Set Security Questions:</strong> Additional verification method</li>
        <li><strong>Review Privacy Settings:</strong> Control what information is visible</li>
      </ul>

      <h3>Troubleshooting Account Creation</h3>
      
      <h4>Common Issues:</h4>
      <ul>
        <li><strong>Email Already Exists:</strong> You may already have an account. Try password reset.</li>
        <li><strong>Verification Email Not Received:</strong> Check spam folder or request resend</li>
        <li><strong>Password Too Weak:</strong> Make sure it meets all requirements</li>
        <li><strong>Technical Error:</strong> Try clearing browser cache or using different browser</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">🎉 Welcome Bonus</p>
        <p class="text-green-700 text-sm mt-1">New accounts get a 15% discount code for their first purchase! Check your welcome email for details.</p>
      </div>
    `
  },

  "reset-password": {
    title: "Reset Password",
    category: "Account & Security",
    readTime: 2,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["create-an-account", "account-security-tips"],
    content: `
      <h2>Resetting Your Password</h2>
      <p>Forgot your password? No worries! We'll help you regain access to your FEROMARKETHUB account quickly and securely.</p>
      
      <h3>How to Reset Your Password</h3>
      
      <h4>🔐 Standard Password Reset</h4>
      <ol>
        <li>Go to the <a href="/auth/login" class="text-primary hover:underline">Login page</a></li>
        <li>Click "Forgot Password?" link</li>
        <li>Enter your email address</li>
        <li>Click "Send Reset Link"</li>
        <li>Check your email for reset instructions</li>
        <li>Click the reset link in the email</li>
        <li>Enter your new password</li>
        <li>Confirm your new password</li>
        <li>Click "Reset Password"</li>
      </ol>

      <h4>📱 Mobile App Reset</h4>
      <ol>
        <li>Open the FEROMARKETHUB mobile app</li>
        <li>Tap "Login" then "Forgot Password"</li>
        <li>Enter your email address</li>
        <li>Follow the same email reset process</li>
      </ol>

      <h3>Password Reset Email</h3>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 class="font-semibold text-blue-800">📧 What to Expect</h5>
        <ul class="text-blue-700 text-sm mt-2 space-y-1">
          <li>• Email arrives within 5-10 minutes</li>
          <li>• Reset link expires in 24 hours</li>
          <li>• Link can only be used once</li>
          <li>• Email comes from noreply@feromarkethub.com</li>
        </ul>
      </div>

      <h3>Didn't Receive Reset Email?</h3>
      <p>If you don't see the password reset email:</p>
      <ul>
        <li><strong>Check Spam Folder:</strong> Reset emails sometimes go to spam</li>
        <li><strong>Check Email Address:</strong> Make sure you entered the correct email</li>
        <li><strong>Wait a Few Minutes:</strong> Emails can take up to 10 minutes to arrive</li>
        <li><strong>Try Again:</strong> Request another reset email</li>
        <li><strong>Contact Support:</strong> If still no email, contact our support team</li>
      </ul>

      <h3>Creating a New Strong Password</h3>
      <p>When setting your new password, make sure it:</p>
      
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">✅ Do Include</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• 8+ characters</li>
            <li>• Uppercase letters</li>
            <li>• Lowercase letters</li>
            <li>• Numbers</li>
            <li>• Special characters</li>
          </ul>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 class="font-semibold text-red-800 mb-2">❌ Don't Include</h5>
          <ul class="text-red-700 text-sm space-y-1">
            <li>• Personal information</li>
            <li>• Common words</li>
            <li>• Previous passwords</li>
            <li>• Sequential characters</li>
            <li>• Dictionary words</li>
          </ul>
        </div>
      </div>

      <h3>Password Reset Security</h3>
      <p>For your security:</p>
      <ul>
        <li><strong>Immediate Logout:</strong> All devices are logged out when you reset</li>
        <li><strong>One-Time Use:</strong> Reset links can only be used once</li>
        <li><strong>Time Limit:</strong> Reset links expire after 24 hours</li>
        <li><strong>Email Verification:</strong> Only the account email can request resets</li>
      </ul>

      <h3>Alternative Recovery Methods</h3>
      
      <h4>🔑 Two-Factor Authentication</h4>
      <p>If you have 2FA enabled:</p>
      <ul>
        <li>Use your authenticator app backup codes</li>
        <li>Contact support with identity verification</li>
        <li>Use your recovery email if set up</li>
      </ul>

      <h4>📞 Account Recovery</h4>
      <p>If you can't access your email:</p>
      <ul>
        <li>Contact our support team</li>
        <li>Provide account verification information</li>
        <li>Recent order details may be required</li>
        <li>Identity verification process may apply</li>
      </ul>

      <h3>After Resetting Your Password</h3>
      <ol>
        <li><strong>Log In:</strong> Use your new password to sign in</li>
        <li><strong>Update Saved Passwords:</strong> Update password managers</li>
        <li><strong>Check Account:</strong> Review recent activity</li>
        <li><strong>Enable 2FA:</strong> Add extra security if not already enabled</li>
        <li><strong>Update Other Devices:</strong> Sign in on mobile apps and other devices</li>
      </ol>

      <h3>Preventing Future Password Issues</h3>
      <ul>
        <li><strong>Use a Password Manager:</strong> Store passwords securely</li>
        <li><strong>Write It Down Safely:</strong> Keep a secure physical copy</li>
        <li><strong>Regular Updates:</strong> Change passwords periodically</li>
        <li><strong>Unique Passwords:</strong> Don't reuse passwords across sites</li>
      </ul>

      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p class="text-yellow-800 font-medium">🔒 Security Tip</p>
        <p class="text-yellow-700 text-sm mt-1">After resetting your password, enable two-factor authentication for an extra layer of security on your account!</p>
      </div>
    `
  },

  "update-profile-information": {
    title: "Update Profile Information",
    category: "Account & Security",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["create-an-account", "account-security-tips"],
    content: `
      <h2>Managing Your Profile Information</h2>
      <p>Keep your FEROMARKETHUB profile up-to-date to ensure smooth shopping experiences and accurate communications.</p>
      
      <h3>Accessing Your Profile</h3>
      <ol>
        <li>Log into your FEROMARKETHUB account</li>
        <li>Click on your profile picture or name in the top right</li>
        <li>Select "Account Settings" or "Profile"</li>
        <li>Choose the section you want to update</li>
      </ol>

      <h3>Profile Sections You Can Update</h3>
      
      <h4>👤 Personal Information</h4>
      <ul>
        <li><strong>Name:</strong> First name, last name, display name</li>
        <li><strong>Email:</strong> Primary and backup email addresses</li>
        <li><strong>Phone:</strong> Mobile number for order updates</li>
        <li><strong>Date of Birth:</strong> For age verification and birthday offers</li>
        <li><strong>Gender:</strong> Optional demographic information</li>
        <li><strong>Profile Picture:</strong> Upload a personal photo</li>
      </ul>

      <h4>📍 Address Information</h4>
      <ul>
        <li><strong>Default Shipping Address:</strong> Your primary delivery location</li>
        <li><strong>Billing Address:</strong> Address for payment verification</li>
        <li><strong>Multiple Addresses:</strong> Save work, home, and other addresses</li>
        <li><strong>Address Labels:</strong> Name your addresses for easy selection</li>
      </ul>

      <h4>💳 Payment Information</h4>
      <ul>
        <li><strong>Saved Cards:</strong> Add, remove, or update payment methods</li>
        <li><strong>Default Payment:</strong> Set your preferred payment method</li>
        <li><strong>Billing Information:</strong> Update billing details</li>
        <li><strong>Payment Security:</strong> Manage saved payment security</li>
      </ul>

      <h3>How to Update Each Section</h3>
      
      <h4>✏️ Editing Personal Information</h4>
      <ol>
        <li>Go to "Personal Information" section</li>
        <li>Click "Edit" next to the field you want to change</li>
        <li>Make your changes</li>
        <li>Click "Save Changes"</li>
        <li>Verify changes via email if required</li>
      </ol>

      <h4>🏠 Managing Addresses</h4>
      <ol>
        <li>Navigate to "Addresses" section</li>
        <li>Click "Add New Address" or "Edit" existing address</li>
        <li>Fill in complete address information</li>
        <li>Set as default if desired</li>
        <li>Save the address</li>
      </ol>

      <h4>💰 Payment Methods</h4>
      <ol>
        <li>Go to "Payment Methods" section</li>
        <li>Click "Add Payment Method" or edit existing</li>
        <li>Enter card or account details securely</li>
        <li>Set as default payment if preferred</li>
        <li>Save the payment method</li>
      </ol>

      <h3>Email Address Changes</h3>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 class="font-semibold text-yellow-800">⚠️ Important: Email Verification Required</h5>
        <p class="text-yellow-700 text-sm mt-2">When changing your email address:</p>
        <ul class="text-yellow-700 text-sm mt-2 space-y-1">
          <li>• You'll receive verification emails at both old and new addresses</li>
          <li>• Click verification links in both emails</li>
          <li>• Your old email remains active until new one is verified</li>
          <li>• Process may take up to 24 hours to complete</li>
        </ul>
      </div>

      <h3>Privacy Settings</h3>
      <p>Control what information is visible to others:</p>
      <ul>
        <li><strong>Profile Visibility:</strong> Choose who can see your profile</li>
        <li><strong>Review Privacy:</strong> Control visibility of your product reviews</li>
        <li><strong>Purchase History:</strong> Keep your orders private</li>
        <li><strong>Contact Information:</strong> Limit who can contact you</li>
      </ul>

      <h3>Communication Preferences</h3>
      <p>Manage how we communicate with you:</p>
      
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 class="font-semibold text-blue-800 mb-2">📧 Email Preferences</h5>
          <ul class="text-blue-700 text-sm space-y-1">
            <li>• Order confirmations</li>
            <li>• Shipping notifications</li>
            <li>• Promotional emails</li>
            <li>• Newsletter subscriptions</li>
            <li>• Security alerts</li>
          </ul>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">📱 SMS Preferences</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• Delivery updates</li>
            <li>• Order status changes</li>
            <li>• Security codes</li>
            <li>• Flash sale alerts</li>
            <li>• Account notifications</li>
          </ul>
        </div>
      </div>

      <h3>Account Deletion</h3>
      <p>If you want to delete your account:</p>
      <ol>
        <li>Go to "Account Settings"</li>
        <li>Scroll to "Delete Account" section</li>
        <li>Read the deletion consequences</li>
        <li>Complete any pending orders first</li>
        <li>Confirm deletion via email verification</li>
      </ol>

      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 class="font-semibold text-red-800">⚠️ Account Deletion Warning</h5>
        <p class="text-red-700 text-sm mt-2">Deleting your account will:</p>
        <ul class="text-red-700 text-sm mt-2 space-y-1">
          <li>• Permanently remove all your data</li>
          <li>• Cancel any pending orders</li>
          <li>• Remove saved addresses and payment methods</li>
          <li>• Delete your order history</li>
          <li>• Cannot be undone</li>
        </ul>
      </div>

      <h3>Data Export</h3>
      <p>You can request a copy of your data:</p>
      <ul>
        <li><strong>Personal Information:</strong> All profile data</li>
        <li><strong>Order History:</strong> Complete purchase records</li>
        <li><strong>Reviews and Ratings:</strong> Your product feedback</li>
        <li><strong>Communication History:</strong> Messages and support tickets</li>
      </ul>

      <h3>Troubleshooting Profile Updates</h3>
      
      <h4>Common Issues:</h4>
      <ul>
        <li><strong>Changes Not Saving:</strong> Check internet connection, try refreshing</li>
        <li><strong>Email Verification Pending:</strong> Check spam folder for verification emails</li>
        <li><strong>Address Validation Errors:</strong> Ensure complete and accurate address</li>
        <li><strong>Payment Method Issues:</strong> Verify card details and expiration dates</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">✅ Profile Tip</p>
        <p class="text-green-700 text-sm mt-1">Keep your profile information current to ensure smooth deliveries and important account notifications reach you!</p>
      </div>
    `
  },

  "account-security-tips": {
    title: "Account Security Tips",
    category: "Account & Security",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["reset-password", "create-an-account"],
    content: `
      <h2>Keeping Your Account Secure</h2>
      <p>Your account security is crucial for protecting your personal information, payment details, and shopping history. Follow these best practices to keep your FEROMARKETHUB account safe.</p>
      
      <h3>Strong Password Practices</h3>
      
      <h4>🔐 Creating Strong Passwords</h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">✅ Do This</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• Use 12+ characters</li>
            <li>• Mix uppercase and lowercase</li>
            <li>• Include numbers and symbols</li>
            <li>• Use unique passwords for each site</li>
            <li>• Consider passphrases</li>
          </ul>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 class="font-semibold text-red-800 mb-2">❌ Avoid This</h5>
          <ul class="text-red-700 text-sm space-y-1">
            <li>• Personal information</li>
            <li>• Common words or phrases</li>
            <li>• Sequential characters</li>
            <li>• Reusing old passwords</li>
            <li>• Sharing passwords</li>
          </ul>
        </div>
      </div>

      <h4>🔑 Password Management</h4>
      <ul>
        <li><strong>Password Managers:</strong> Use tools like 1Password, LastPass, or Bitwarden</li>
        <li><strong>Browser Passwords:</strong> Let your browser save and generate passwords</li>
        <li><strong>Regular Updates:</strong> Change passwords every 6-12 months</li>
        <li><strong>Breach Monitoring:</strong> Check if your passwords have been compromised</li>
      </ul>

      <h3>Two-Factor Authentication (2FA)</h3>
      
      <h4>🛡️ Why Enable 2FA?</h4>
      <ul>
        <li>Adds an extra layer of security beyond passwords</li>
        <li>Protects against password theft and breaches</li>
        <li>Required for high-value transactions</li>
        <li>Prevents unauthorized access even with stolen passwords</li>
      </ul>

      <h4>📱 2FA Options Available</h4>
      <div class="space-y-3">
        <div class="border border-blue-200 bg-blue-50 rounded-lg p-3">
          <h6 class="font-semibold text-blue-800">SMS Text Messages</h6>
          <p class="text-blue-700 text-sm">Receive codes via text message to your phone</p>
        </div>
        <div class="border border-green-200 bg-green-50 rounded-lg p-3">
          <h6 class="font-semibold text-green-800">Authenticator Apps</h6>
          <p class="text-green-700 text-sm">Use Google Authenticator, Authy, or Microsoft Authenticator</p>
        </div>
        <div class="border border-purple-200 bg-purple-50 rounded-lg p-3">
          <h6 class="font-semibold text-purple-800">Email Codes</h6>
          <p class="text-purple-700 text-sm">Receive verification codes in your email</p>
        </div>
      </div>

      <h4>⚙️ How to Enable 2FA</h4>
      <ol>
        <li>Go to Account Settings → Security</li>
        <li>Click "Enable Two-Factor Authentication"</li>
        <li>Choose your preferred 2FA method</li>
        <li>Follow the setup instructions</li>
        <li>Save your backup codes in a secure location</li>
        <li>Test the 2FA setup by logging out and back in</li>
      </ol>

      <h3>Recognizing Security Threats</h3>
      
      <h4>🎣 Phishing Attempts</h4>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 class="font-semibold text-yellow-800">⚠️ Warning Signs</h5>
        <ul class="text-yellow-700 text-sm mt-2 space-y-1">
          <li>• Urgent requests for account information</li>
          <li>• Suspicious email addresses or domains</li>
          <li>• Poor grammar and spelling</li>
          <li>• Requests to click suspicious links</li>
          <li>• Threats of account closure</li>
        </ul>
      </div>

      <h4>🔍 How to Verify Legitimate Communications</h4>
      <ul>
        <li><strong>Check Sender:</strong> Verify emails come from @feromarkethub.com</li>
        <li><strong>Log In Directly:</strong> Don't click email links, go to the website directly</li>
        <li><strong>Contact Support:</strong> When in doubt, contact us directly</li>
        <li><strong>Check Account:</strong> Log into your account to verify any claims</li>
      </ul>

      <h3>Safe Browsing Practices</h3>
      
      <h4>🌐 Secure Connections</h4>
      <ul>
        <li><strong>HTTPS Only:</strong> Always look for the padlock icon</li>
        <li><strong>Avoid Public Wi-Fi:</strong> Don't shop on unsecured networks</li>
        <li><strong>Use VPN:</strong> Consider a VPN for public internet access</li>
        <li><strong>Updated Browsers:</strong> Keep your browser current</li>
      </ul>

      <h4>💻 Device Security</h4>
      <ul>
        <li><strong>Lock Screens:</strong> Use PINs, passwords, or biometrics</li>
        <li><strong>Auto-Lock:</strong> Set devices to lock automatically</li>
        <li><strong>Software Updates:</strong> Keep operating systems updated</li>
        <li><strong>Antivirus Protection:</strong> Use reputable security software</li>
      </ul>

      <h3>Account Monitoring</h3>
      
      <h4>📊 Regular Account Reviews</h4>
      <ul>
        <li><strong>Login Activity:</strong> Check recent login locations and times</li>
        <li><strong>Order History:</strong> Review all purchases for unauthorized orders</li>
        <li><strong>Payment Methods:</strong> Verify all saved cards and accounts</li>
        <li><strong>Address Book:</strong> Ensure all addresses are legitimate</li>
        <li><strong>Email Settings:</strong> Check notification preferences</li>
      </ul>

      <h4>🚨 Signs of Compromise</h4>
      <p>Contact us immediately if you notice:</p>
      <ul>
        <li>Unrecognized purchases or orders</li>
        <li>Login notifications from unknown locations</li>
        <li>Changes to your account information</li>
        <li>Unexpected password reset emails</li>
        <li>Missing or altered order history</li>
      </ul>

      <h3>What to Do If Your Account is Compromised</h3>
      
      <h4>🚨 Immediate Actions</h4>
      <ol>
        <li><strong>Change Password:</strong> Reset your password immediately</li>
        <li><strong>Enable 2FA:</strong> Add two-factor authentication if not already enabled</li>
        <li><strong>Review Account:</strong> Check all account information and recent activity</li>
        <li><strong>Contact Support:</strong> Report the security incident to our team</li>
        <li><strong>Monitor Statements:</strong> Watch your bank and credit card statements</li>
      </ol>

      <h4>🔒 Securing Other Accounts</h4>
      <ul>
        <li>Change passwords on other sites using the same password</li>
        <li>Review other online accounts for suspicious activity</li>
        <li>Consider credit monitoring services</li>
        <li>Update security questions and recovery information</li>
      </ul>

      <h3>Privacy Settings</h3>
      
      <h4>🔐 Control Your Information</h4>
      <ul>
        <li><strong>Profile Visibility:</strong> Limit who can see your information</li>
        <li><strong>Purchase Privacy:</strong> Keep your buying history private</li>
        <li><strong>Review Settings:</strong> Control visibility of your product reviews</li>
        <li><strong>Communication Preferences:</strong> Manage who can contact you</li>
      </ul>

      <h3>Security Features We Provide</h3>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 class="font-semibold text-blue-800 mb-2">🛡️ Our Security Measures</h5>
        <ul class="text-blue-700 text-sm space-y-1">
          <li>• 256-bit SSL encryption for all data</li>
          <li>• PCI DSS compliant payment processing</li>
          <li>• Regular security audits and updates</li>
          <li>• 24/7 fraud monitoring systems</li>
          <li>• Secure data centers with physical security</li>
          <li>• Employee background checks and training</li>
        </ul>
      </div>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">🔒 Security Reminder</p>
        <p class="text-green-700 text-sm mt-1">We'll never ask for your password, credit card details, or personal information via email or phone. Always verify requests by logging into your account directly!</p>
      </div>
    `
  },
  // Vendor Information Articles
  "how-to-become-a-vendor": {
    title: "How to Become a Vendor",
    category: "Vendor Information",
    readTime: 5,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["vendor-dashboard-guide", "commission-structure"],
    content: `
      <h2>Start Selling on FEROMARKETHUB</h2>
      <p>Join thousands of successful vendors on Nigeria's leading marketplace. Whether you're a small business owner, artisan, or established retailer, FEROMARKETHUB provides the platform to reach millions of customers.</p>
      
      <h3>Why Sell on FEROMARKETHUB?</h3>
      <ul>
        <li><strong>Massive Reach:</strong> Access to millions of active shoppers across Nigeria and beyond</li>
        <li><strong>Easy Setup:</strong> Get your store online in minutes, not days</li>
        <li><strong>Marketing Support:</strong> Benefit from our advertising and promotional campaigns</li>
        <li><strong>Secure Payments:</strong> Reliable payment processing with fraud protection</li>
        <li><strong>Analytics:</strong> Detailed insights into your sales and customer behavior</li>
        <li><strong>Mobile Optimized:</strong> Your store works perfectly on all devices</li>
        <li><strong>Customer Support:</strong> Dedicated support team for vendors</li>
      </ul>

      <h3>Vendor Requirements</h3>
      
      <h4>📋 Basic Requirements</h4>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <ul class="space-y-2">
          <li>✅ <strong>Legal Business:</strong> Registered business or individual seller</li>
          <li>✅ <strong>Valid ID:</strong> Government-issued identification</li>
          <li>✅ <strong>Bank Account:</strong> Nigerian bank account for payments</li>
          <li>✅ <strong>Contact Information:</strong> Valid phone number and email</li>
          <li>✅ <strong>Product Quality:</strong> Commitment to selling authentic, quality products</li>
        </ul>
      </div>

      <h4>📄 Required Documents</h4>
      <ul>
        <li><strong>Individual Sellers:</strong>
          <ul>
            <li>Valid government ID (National ID, Driver's License, or Passport)</li>
            <li>Bank account details</li>
            <li>Proof of address (utility bill or bank statement)</li>
          </ul>
        </li>
        <li><strong>Business Sellers:</strong>
          <ul>
            <li>Business registration certificate (CAC)</li>
            <li>Tax identification number (TIN)</li>
            <li>Business bank account details</li>
            <li>Director's identification</li>
          </ul>
        </li>
      </ul>

      <h3>Application Process</h3>
      
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h5 class="font-semibold">Create Your Application</h5>
            <p class="text-sm text-gray-600">Visit our <a href="/auth/vendor-register" class="text-primary hover:underline">Vendor Registration page</a> and fill out the application form with your business details.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h5 class="font-semibold">Upload Documents</h5>
            <p class="text-sm text-gray-600">Submit all required documents for verification. Ensure all documents are clear and up-to-date.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <h5 class="font-semibold">Verification Process</h5>
            <p class="text-sm text-gray-600">Our team reviews your application and documents. This typically takes 2-5 business days.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
          <div>
            <h5 class="font-semibold">Account Approval</h5>
            <p class="text-sm text-gray-600">Once approved, you'll receive an email with your vendor dashboard access and setup instructions.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
          <div>
            <h5 class="font-semibold">Set Up Your Store</h5>
            <p class="text-sm text-gray-600">Complete your store profile, add products, and start selling!</p>
          </div>
        </div>
      </div>

      <h3>Product Categories</h3>
      <p>We accept vendors in most product categories:</p>
      
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">✅ Approved Categories</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• Electronics & Gadgets</li>
            <li>• Fashion & Clothing</li>
            <li>• Home & Garden</li>
            <li>• Health & Beauty</li>
            <li>• Sports & Fitness</li>
            <li>• Books & Media</li>
            <li>• Automotive</li>
            <li>• Handmade & Crafts</li>
          </ul>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 class="font-semibold text-red-800 mb-2">❌ Restricted Categories</h5>
          <ul class="text-red-700 text-sm space-y-1">
            <li>• Weapons & Ammunition</li>
            <li>• Illegal substances</li>
            <li>• Counterfeit goods</li>
            <li>• Adult content</li>
            <li>• Live animals</li>
            <li>• Prescription medications</li>
            <li>• Hazardous materials</li>
          </ul>
        </div>
      </div>

      <h3>Vendor Account Types</h3>
      
      <h4>🏪 Individual Seller</h4>
      <ul>
        <li><strong>Best for:</strong> Personal sellers, small-scale businesses</li>
        <li><strong>Commission:</strong> Standard marketplace fees apply</li>
        <li><strong>Features:</strong> Basic store features, standard support</li>
        <li><strong>Limits:</strong> Up to 100 products initially</li>
      </ul>

      <h4>🏢 Business Seller</h4>
      <ul>
        <li><strong>Best for:</strong> Registered businesses, established retailers</li>
        <li><strong>Commission:</strong> Negotiable rates for high-volume sellers</li>
        <li><strong>Features:</strong> Advanced analytics, priority support, bulk tools</li>
        <li><strong>Limits:</strong> Unlimited products, advanced customization</li>
      </ul>

      <h4>⭐ Premium Vendor</h4>
      <ul>
        <li><strong>Best for:</strong> Large businesses, brand manufacturers</li>
        <li><strong>Commission:</strong> Custom pricing and terms</li>
        <li><strong>Features:</strong> Dedicated account manager, custom integrations</li>
        <li><strong>Benefits:</strong> Featured placement, marketing support</li>
      </ul>

      <h3>Getting Started Checklist</h3>
      
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 class="font-semibold mb-3">📝 Before You Apply</h5>
        <div class="space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" disabled>
            <span class="text-sm">Gather all required documents</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" disabled>
            <span class="text-sm">Prepare high-quality product photos</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" disabled>
            <span class="text-sm">Write detailed product descriptions</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" disabled>
            <span class="text-sm">Set competitive pricing</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" disabled>
            <span class="text-sm">Plan your shipping and return policies</span>
          </label>
        </div>
      </div>

      <h3>Support and Training</h3>
      <p>We provide comprehensive support to help you succeed:</p>
      <ul>
        <li><strong>Vendor Onboarding:</strong> Step-by-step setup guidance</li>
        <li><strong>Training Materials:</strong> Video tutorials and guides</li>
        <li><strong>Webinars:</strong> Regular training sessions on best practices</li>
        <li><strong>Dedicated Support:</strong> Vendor-specific customer service</li>
        <li><strong>Community Forum:</strong> Connect with other vendors</li>
        <li><strong>Account Manager:</strong> Personal support for premium vendors</li>
      </ul>

      <h3>Success Tips</h3>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 class="font-semibold text-yellow-800 mb-2">💡 Pro Tips for New Vendors</h5>
        <ul class="text-yellow-700 text-sm space-y-1">
          <li>• Start with a focused product range</li>
          <li>• Invest in professional product photography</li>
          <li>• Respond quickly to customer inquiries</li>
          <li>• Maintain competitive pricing</li>
          <li>• Provide excellent customer service</li>
          <li>• Use our advertising tools to boost visibility</li>
          <li>• Keep inventory levels updated</li>
        </ul>
      </div>

      <h3>Application Review Process</h3>
      <p>Our review process ensures quality and trust:</p>
      <ul>
        <li><strong>Document Verification:</strong> All documents are verified for authenticity</li>
        <li><strong>Business Validation:</strong> We confirm business registration and legitimacy</li>
        <li><strong>Quality Assessment:</strong> Product samples may be requested</li>
        <li><strong>Policy Compliance:</strong> Ensure adherence to our vendor policies</li>
        <li><strong>Final Approval:</strong> Account activation and welcome package</li>
      </ul>

      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <p class="text-green-800 font-medium">🚀 Ready to Start?</p>
        <p class="text-green-700 text-sm mt-1">Join thousands of successful vendors on FEROMARKETHUB. <a href="/auth/vendor-register" class="text-primary hover:underline font-semibold">Apply now</a> and start your journey to online success!</p>
      </div>
    `
  },

  "vendor-dashboard-guide": {
    title: "Vendor Dashboard Guide",
    category: "Vendor Information",
    readTime: 6,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-become-a-vendor", "commission-structure"],
    content: `
      <h2>Mastering Your Vendor Dashboard</h2>
      <p>Your vendor dashboard is your command center for managing your FEROMARKETHUB store. This comprehensive guide will help you navigate and utilize all available features effectively.</p>
      
      <h3>Dashboard Overview</h3>
      <p>When you log into your vendor dashboard, you'll see:</p>
      <ul>
        <li><strong>Sales Summary:</strong> Today's sales, weekly trends, and monthly performance</li>
        <li><strong>Order Notifications:</strong> New orders requiring attention</li>
        <li><strong>Inventory Alerts:</strong> Low stock warnings and out-of-stock items</li>
        <li><strong>Performance Metrics:</strong> Customer ratings, response times, and fulfillment rates</li>
        <li><strong>Quick Actions:</strong> Add products, process orders, view messages</li>
      </ul>

      <h3>Navigation Menu</h3>
      
      <h4>📊 Dashboard Home</h4>
      <ul>
        <li><strong>Sales Overview:</strong> Revenue charts and key metrics</li>
        <li><strong>Recent Orders:</strong> Latest customer orders</li>
        <li><strong>Performance Indicators:</strong> Rating, response time, fulfillment rate</li>
        <li><strong>Notifications:</strong> Important updates and alerts</li>
      </ul>

      <h4>📦 Orders Management</h4>
      <ul>
        <li><strong>New Orders:</strong> Orders awaiting confirmation</li>
        <li><strong>Processing:</strong> Orders being prepared for shipment</li>
        <li><strong>Shipped:</strong> Orders sent to customers</li>
        <li><strong>Completed:</strong> Successfully delivered orders</li>
        <li><strong>Returns:</strong> Return requests and refunds</li>
      </ul>

      <h4>🛍️ Product Management</h4>
      <ul>
        <li><strong>All Products:</strong> Complete product catalog</li>
        <li><strong>Add Product:</strong> Create new product listings</li>
        <li><strong>Inventory:</strong> Stock levels and inventory tracking</li>
        <li><strong>Categories:</strong> Organize products by category</li>
        <li><strong>Bulk Actions:</strong> Edit multiple products at once</li>
      </ul>

      <h3>Managing Orders</h3>
      
      <h4>📋 Order Processing Workflow</h4>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h6 class="font-semibold">New Order Received</h6>
            <p class="text-sm text-gray-600">Customer places order → You receive notification</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h6 class="font-semibold">Confirm Order</h6>
            <p class="text-sm text-gray-600">Review order details → Confirm availability → Accept order</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <h6 class="font-semibold">Prepare for Shipping</h6>
            <p class="text-sm text-gray-600">Pack items → Generate shipping label → Update status</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
          <div>
            <h6 class="font-semibold">Ship Order</h6>
            <p class="text-sm text-gray-600">Hand over to courier → Add tracking info → Notify customer</p>
          </div>
        </div>
      </div>

      <h4>⚡ Quick Order Actions</h4>
      <ul>
        <li><strong>Bulk Confirm:</strong> Accept multiple orders at once</li>
        <li><strong>Print Labels:</strong> Generate shipping labels in batches</li>
        <li><strong>Update Status:</strong> Change order status for multiple orders</li>
        <li><strong>Send Messages:</strong> Communicate with customers about their orders</li>
      </ul>

      <h3>Product Management</h3>
      
      <h4>➕ Adding New Products</h4>
      <ol>
        <li><strong>Basic Information:</strong>
          <ul>
            <li>Product name and description</li>
            <li>Category and subcategory</li>
            <li>Brand and model (if applicable)</li>
            <li>SKU and barcode</li>
          </ul>
        </li>
        <li><strong>Pricing:</strong>
          <ul>
            <li>Regular price and sale price</li>
            <li>Cost price (for profit tracking)</li>
            <li>Tax settings</li>
            <li>Bulk pricing options</li>
          </ul>
        </li>
        <li><strong>Images:</strong>
          <ul>
            <li>Main product image (required)</li>
            <li>Additional images (up to 10)</li>
            <li>Image optimization tips</li>
            <li>360° view support</li>
          </ul>
        </li>
        <li><strong>Inventory:</strong>
          <ul>
            <li>Stock quantity</li>
            <li>Low stock alerts</li>
            <li>Inventory tracking settings</li>
            <li>Backorder options</li>
          </ul>
        </li>
      </ol>

      <h4>📝 Product Optimization Tips</h4>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h6 class="font-semibold text-green-800 mb-2">🎯 Best Practices</h6>
        <ul class="text-green-700 text-sm space-y-1">
          <li>• Use high-quality, well-lit product photos</li>
          <li>• Write detailed, keyword-rich descriptions</li>
          <li>• Include product specifications and dimensions</li>
          <li>• Set competitive pricing</li>
          <li>• Use relevant tags and categories</li>
          <li>• Enable customer reviews</li>
          <li>• Keep inventory levels accurate</li>
        </ul>
      </div>

      <h3>Analytics and Reports</h3>
      
      <h4>📈 Sales Analytics</h4>
      <ul>
        <li><strong>Revenue Tracking:</strong> Daily, weekly, monthly, and yearly sales</li>
        <li><strong>Product Performance:</strong> Best-selling and underperforming products</li>
        <li><strong>Customer Insights:</strong> Demographics and buying patterns</li>
        <li><strong>Traffic Analysis:</strong> Store visits and conversion rates</li>
      </ul>

      <h4>📊 Available Reports</h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="border border-gray-200 rounded-lg p-3">
          <h6 class="font-semibold mb-2">Sales Reports</h6>
          <ul class="text-sm space-y-1">
            <li>• Daily sales summary</li>
            <li>• Product sales ranking</li>
            <li>• Revenue by category</li>
            <li>• Profit margin analysis</li>
          </ul>
        </div>
        <div class="border border-gray-200 rounded-lg p-3">
          <h6 class="font-semibold mb-2">Customer Reports</h6>
          <ul class="text-sm space-y-1">
            <li>• Customer acquisition</li>
            <li>• Repeat customer rate</li>
            <li>• Customer lifetime value</li>
            <li>• Geographic distribution</li>
          </ul>
        </div>
      </div>

      <h3>Customer Communication</h3>
      
      <h4>💬 Messaging System</h4>
      <ul>
        <li><strong>Customer Inquiries:</strong> Answer product questions promptly</li>
        <li><strong>Order Updates:</strong> Keep customers informed about their orders</li>
        <li><strong>Issue Resolution:</strong> Handle complaints and concerns professionally</li>
        <li><strong>Follow-up:</strong> Check customer satisfaction after delivery</li>
      </ul>

      <h4>⭐ Review Management</h4>
      <ul>
        <li><strong>Monitor Reviews:</strong> Track customer feedback on your products</li>
        <li><strong>Respond to Reviews:</strong> Thank customers and address concerns</li>
        <li><strong>Encourage Reviews:</strong> Follow up with customers to leave feedback</li>
        <li><strong>Learn from Feedback:</strong> Use reviews to improve products and service</li>
      </ul>

      <h3>Marketing Tools</h3>
      
      <h4>🎯 Promotional Features</h4>
      <ul>
        <li><strong>Discount Codes:</strong> Create percentage or fixed-amount discounts</li>
        <li><strong>Flash Sales:</strong> Limited-time promotional pricing</li>
        <li><strong>Bundle Deals:</strong> Offer multiple products at discounted rates</li>
        <li><strong>Free Shipping:</strong> Promotional free shipping offers</li>
      </ul>

      <h4>📢 Advertising Options</h4>
      <ul>
        <li><strong>Sponsored Products:</strong> Boost product visibility in search results</li>
        <li><strong>Featured Listings:</strong> Highlight products on category pages</li>
        <li><strong>Banner Ads:</strong> Display ads on relevant pages</li>
        <li><strong>Email Marketing:</strong> Reach customers through newsletters</li>
      </ul>

      <h3>Financial Management</h3>
      
      <h4>💰 Payment and Payouts</h4>
      <ul>
        <li><strong>Earnings Overview:</strong> Track your total earnings and pending payouts</li>
        <li><strong>Transaction History:</strong> Detailed record of all transactions</li>
        <li><strong>Payout Schedule:</strong> When and how you receive payments</li>
        <li><strong>Tax Information:</strong> Download tax documents and reports</li>
      </ul>

      <h4>📋 Financial Reports</h4>
      <ul>
        <li><strong>Profit & Loss:</strong> Revenue minus costs and fees</li>
        <li><strong>Commission Breakdown:</strong> Detailed fee structure</li>
        <li><strong>Tax Reports:</strong> Information for tax filing</li>
        <li><strong>Expense Tracking:</strong> Monitor business expenses</li>
      </ul>

      <h3>Store Customization</h3>
      
      <h4>🎨 Store Appearance</h4>
      <ul>
        <li><strong>Store Logo:</strong> Upload your brand logo</li>
        <li><strong>Banner Images:</strong> Customize your store header</li>
        <li><strong>Color Scheme:</strong> Match your brand colors</li>
        <li><strong>Store Description:</strong> Tell your brand story</li>
      </ul>

      <h4>⚙️ Store Settings</h4>
      <ul>
        <li><strong>Business Information:</strong> Contact details and policies</li>
        <li><strong>Shipping Settings:</strong> Delivery options and costs</li>
        <li><strong>Return Policy:</strong> Define your return and refund terms</li>
        <li><strong>Payment Methods:</strong> Choose accepted payment options</li>
      </ul>

      <h3>Mobile Dashboard</h3>
      <p>Manage your store on the go with our mobile-optimized dashboard:</p>
      <ul>
        <li><strong>Order Notifications:</strong> Instant alerts for new orders</li>
        <li><strong>Quick Actions:</strong> Confirm orders and update status</li>
        <li><strong>Customer Messages:</strong> Respond to inquiries anywhere</li>
        <li><strong>Sales Tracking:</strong> Monitor performance in real-time</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">📱 Pro Tip</p>
        <p class="text-blue-700 text-sm mt-1">Download the FEROMARKETHUB Vendor app for iOS and Android to manage your store efficiently while on the move!</p>
      </div>
    `
  },

  "commission-structure": {
    title: "Commission Structure",
    category: "Vendor Information",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["vendor-dashboard-guide", "vendor-policies"],
    content: `
      <h2>Understanding FEROMARKETHUB Commission Structure</h2>
      <p>Our transparent commission structure is designed to be fair and competitive while providing excellent value for the services and platform we provide to help grow your business.</p>
      
      <h3>Commission Overview</h3>
      <p>FEROMARKETHUB charges a commission on each successful sale. This commission covers:</p>
      <ul>
        <li><strong>Platform Usage:</strong> Access to our marketplace and tools</li>
        <li><strong>Payment Processing:</strong> Secure transaction handling</li>
        <li><strong>Customer Support:</strong> 24/7 customer service</li>
        <li><strong>Marketing:</strong> Platform-wide advertising and promotion</li>
        <li><strong>Technology:</strong> Website maintenance and improvements</li>
        <li><strong>Trust & Safety:</strong> Fraud protection and dispute resolution</li>
      </ul>

      <h3>Commission Rates by Category</h3>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Product Category</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Commission Rate</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Electronics</td>
              <td class="border border-gray-300 px-4 py-2">8%</td>
              <td class="border border-gray-300 px-4 py-2">Phones, Laptops, TVs</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Fashion & Clothing</td>
              <td class="border border-gray-300 px-4 py-2">12%</td>
              <td class="border border-gray-300 px-4 py-2">Clothes, Shoes, Accessories</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Home & Garden</td>
              <td class="border border-gray-300 px-4 py-2">10%</td>
              <td class="border border-gray-300 px-4 py-2">Furniture, Appliances, Decor</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Health & Beauty</td>
              <td class="border border-gray-300 px-4 py-2">15%</td>
              <td class="border border-gray-300 px-4 py-2">Cosmetics, Skincare, Supplements</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Books & Media</td>
              <td class="border border-gray-300 px-4 py-2">5%</td>
              <td class="border border-gray-300 px-4 py-2">Books, Music, Movies</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Sports & Fitness</td>
              <td class="border border-gray-300 px-4 py-2">10%</td>
              <td class="border border-gray-300 px-4 py-2">Equipment, Apparel, Supplements</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Automotive</td>
              <td class="border border-gray-300 px-4 py-2">7%</td>
              <td class="border border-gray-300 px-4 py-2">Parts, Accessories, Tools</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Handmade & Crafts</td>
              <td class="border border-gray-300 px-4 py-2">6%</td>
              <td class="border border-gray-300 px-4 py-2">Art, Crafts, Custom Items</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Volume-Based Discounts</h3>
      <p>High-performing vendors can qualify for reduced commission rates:</p>
      
      <div class="space-y-4">
        <div class="border border-green-200 bg-green-50 rounded-lg p-4">
          <h5 class="font-semibold text-green-800">🥉 Bronze Tier</h5>
          <p class="text-green-700 text-sm"><strong>Monthly Sales:</strong> ₦1,000,000 - ₦4,999,999</p>
          <p class="text-green-700 text-sm"><strong>Discount:</strong> 5% reduction in commission rates</p>
        </div>
        
        <div class="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h5 class="font-semibold text-blue-800">🥈 Silver Tier</h5>
          <p class="text-blue-700 text-sm"><strong>Monthly Sales:</strong> ₦5,000,000 - ₦9,999,999</p>
          <p class="text-blue-700 text-sm"><strong>Discount:</strong> 10% reduction in commission rates</p>
        </div>
        
        <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <h5 class="font-semibold text-yellow-800">🥇 Gold Tier</h5>
          <p class="text-yellow-700 text-sm"><strong>Monthly Sales:</strong> ₦10,000,000+</p>
          <p class="text-yellow-700 text-sm"><strong>Discount:</strong> 15% reduction in commission rates</p>
        </div>
      </div>

      <h3>Additional Fees</h3>
      
      <h4>💳 Payment Processing Fees</h4>
      <p>These fees are charged by payment providers and passed through at cost:</p>
      <ul>
        <li><strong>Local Cards:</strong> 1.5% + ₦100 per transaction</li>
        <li><strong>International Cards:</strong> 3.8% + ₦100 per transaction</li>
        <li><strong>Bank Transfers:</strong> ₦50 per transaction</li>
        <li><strong>Mobile Money:</strong> 1% + ₦50 per transaction</li>
      </ul>

      <h4>📦 Optional Service Fees</h4>
      <ul>
        <li><strong>Fulfillment by FEROMARKETHUB:</strong> 15% of product price (optional)</li>
        <li><strong>Premium Listing:</strong> ₦5,000 - ₦50,000 per month (optional)</li>
        <li><strong>Advertising:</strong> Variable based on campaign (optional)</li>
        <li><strong>Professional Photography:</strong> ₦10,000 - ₦25,000 per product (optional)</li>
      </ul>

      <h3>Commission Calculation Example</h3>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 class="font-semibold text-blue-800 mb-3">📊 Sample Calculation</h5>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Product Sale Price:</span>
            <span class="font-semibold">₦50,000</span>
          </div>
          <div class="flex justify-between">
            <span>Category (Electronics):</span>
            <span>8% commission</span>
          </div>
          <div class="flex justify-between">
            <span>Commission Fee:</span>
            <span class="text-red-600">-₦4,000</span>
          </div>
          <div class="flex justify-between">
            <span>Payment Processing (1.5%):</span>
            <span class="text-red-600">-₦850</span>
          </div>
          <hr class="border-blue-300">
          <div class="flex justify-between font-semibold text-blue-800">
            <span>Your Earnings:</span>
            <span>₦45,150</span>
          </div>
        </div>
      </div>

      <h3>When Commission is Charged</h3>
      <ul>
        <li><strong>Successful Sale:</strong> Commission is deducted when customer payment is confirmed</li>
        <li><strong>Order Completion:</strong> Final commission calculation after delivery confirmation</li>
        <li><strong>Refunds:</strong> Commission is refunded if order is cancelled or returned</li>
        <li><strong>Partial Refunds:</strong> Commission adjusted proportionally</li>
      </ul>

      <h3>Payout Schedule</h3>
      
      <h4>💰 Regular Payouts</h4>
      <ul>
        <li><strong>Frequency:</strong> Weekly payouts every Friday</li>
        <li><strong>Minimum Threshold:</strong> ₦10,000 minimum payout amount</li>
        <li><strong>Processing Time:</strong> 1-3 business days to your bank account</li>
        <li><strong>Currency:</strong> Payments in Nigerian Naira (₦)</li>
      </ul>

      <h4>🏦 Payout Methods</h4>
      <ul>
        <li><strong>Bank Transfer:</strong> Direct deposit to your Nigerian bank account</li>
        <li><strong>Mobile Money:</strong> Transfer to your mobile wallet</li>
        <li><strong>Check:</strong> Physical check delivery (for large amounts)</li>
      </ul>

      <h3>Commission Transparency</h3>
      <p>We believe in complete transparency:</p>
      <ul>
        <li><strong>Detailed Breakdown:</strong> Every transaction shows exact commission calculation</li>
        <li><strong>Real-time Tracking:</strong> Monitor earnings and fees in your dashboard</li>
        <li><strong>Monthly Statements:</strong> Comprehensive financial reports</li>
        <li><strong>No Hidden Fees:</strong> All costs are clearly disclosed upfront</li>
      </ul>

      <h3>Reducing Your Commission Costs</h3>
      
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 class="font-semibold text-green-800 mb-2">💡 Cost-Saving Tips</h5>
        <ul class="text-green-700 text-sm space-y-1">
          <li>• Increase sales volume to qualify for tier discounts</li>
          <li>• Focus on categories with lower commission rates</li>
          <li>• Encourage bank transfers over card payments</li>
          <li>• Maintain high seller ratings for potential rate negotiations</li>
          <li>• Bundle products to increase average order value</li>
          <li>• Use our fulfillment services to reduce operational costs</li>
        </ul>
      </div>

      <h3>Special Programs</h3>
      
      <h4>🌟 New Vendor Promotion</h4>
      <ul>
        <li><strong>First Month:</strong> 50% reduction in commission rates</li>
        <li><strong>Second Month:</strong> 25% reduction in commission rates</li>
        <li><strong>Third Month:</strong> Standard rates apply</li>
      </ul>

      <h4>🎯 Category Promotions</h4>
      <p>Seasonal promotions may offer reduced rates for specific categories:</p>
      <ul>
        <li>Back-to-school promotions for books and electronics</li>
        <li>Holiday season discounts for gifts and decorations</li>
        <li>Fashion week promotions for clothing and accessories</li>
      </ul>

      <h3>Commission Policy Updates</h3>
      <p>Commission rates may be updated with:</p>
      <ul>
        <li><strong>30-Day Notice:</strong> All rate changes announced in advance</li>
        <li><strong>Grandfathering:</strong> Existing contracts honored for agreed periods</li>
        <li><strong>Negotiation:</strong> High-volume vendors can discuss custom rates</li>
        <li><strong>Market Adjustments:</strong> Rates adjusted to remain competitive</li>
      </ul>

      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p class="text-yellow-800 font-medium">📈 Growth Opportunity</p>
        <p class="text-yellow-700 text-sm mt-1">Focus on building your sales volume and maintaining excellent customer service to qualify for lower commission rates and additional benefits!</p>
      </div>
    `
  },

  "vendor-policies": {
    title: "Vendor Policies",
    category: "Vendor Information",
    readTime: 7,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["commission-structure", "how-to-become-a-vendor"],
    content: `
      <h2>FEROMARKETHUB Vendor Policies</h2>
      <p>These policies ensure a fair, safe, and trustworthy marketplace for all users. As a vendor, you agree to comply with these policies to maintain your selling privileges on FEROMARKETHUB.</p>
      
      <h3>Product Listing Policies</h3>
      
      <h4>✅ Allowed Products</h4>
      <ul>
        <li><strong>Authentic Items:</strong> Only genuine, original products</li>
        <li><strong>Legal Products:</strong> Items legal to sell in Nigeria</li>
        <li><strong>Quality Standards:</strong> Products meeting safety and quality requirements</li>
        <li><strong>Accurate Descriptions:</strong> Truthful and complete product information</li>
      </ul>

      <h4>❌ Prohibited Products</h4>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 class="font-semibold text-red-800 mb-2">Strictly Forbidden Items</h5>
        <div class="grid md:grid-cols-2 gap-4 text-red-700 text-sm">
          <ul class="space-y-1">
            <li>• Counterfeit or replica goods</li>
            <li>• Weapons and ammunition</li>
            <li>• Illegal drugs and substances</li>
            <li>• Stolen goods</li>
            <li>• Adult content and services</li>
            <li>• Live animals</li>
          </ul>
          <ul class="space-y-1">
            <li>• Prescription medications</li>
            <li>• Hazardous materials</li>
            <li>• Tobacco products</li>
            <li>• Gambling items</li>
            <li>• Human remains or body parts</li>
            <li>• Items violating intellectual property</li>
          </ul>
        </div>
      </div>

      <h3>Product Quality Standards</h3>
      
      <h4>📸 Image Requirements</h4>
      <ul>
        <li><strong>High Resolution:</strong> Minimum 800x800 pixels</li>
        <li><strong>Clear Photos:</strong> Well-lit, focused images</li>
        <li><strong>Accurate Representation:</strong> Images must match the actual product</li>
        <li><strong>Multiple Angles:</strong> Show product from different perspectives</li>
        <li><strong>No Watermarks:</strong> Clean images without logos or text overlays</li>
      </ul>

      <h4>📝 Description Standards</h4>
      <ul>
        <li><strong>Detailed Information:</strong> Complete product specifications</li>
        <li><strong>Accurate Details:</strong> Correct dimensions, weight, materials</li>
        <li><strong>Clear Language:</strong> Easy to understand descriptions</li>
        <li><strong>Relevant Keywords:</strong> Help customers find your products</li>
        <li><strong>No Misleading Claims:</strong> Honest representation of features and benefits</li>
      </ul>

      <h3>Pricing Policies</h3>
      
      <h4>💰 Fair Pricing</h4>
      <ul>
        <li><strong>Competitive Pricing:</strong> Reasonable prices compared to market rates</li>
        <li><strong>No Price Manipulation:</strong> Avoid artificially inflated prices</li>
        <li><strong>Clear Pricing:</strong> All costs clearly displayed</li>
        <li><strong>No Hidden Fees:</strong> Transparent pricing structure</li>
      </ul>

      <h4>🏷️ Promotional Pricing</h4>
      <ul>
        <li><strong>Genuine Discounts:</strong> Sale prices must be real reductions</li>
        <li><strong>Limited Time Offers:</strong> Honor promotional periods</li>
        <li><strong>Stock Availability:</strong> Ensure advertised items are in stock</li>
        <li><strong>Terms and Conditions:</strong> Clearly state promotion rules</li>
      </ul>

      <h3>Order Fulfillment Requirements</h3>
      
      <h4>⏰ Processing Times</h4>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Order Type</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Maximum Processing Time</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Expected Standard</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">In-Stock Items</td>
              <td class="border border-gray-300 px-4 py-2">2 business days</td>
              <td class="border border-gray-300 px-4 py-2">Same day preferred</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Made-to-Order</td>
              <td class="border border-gray-300 px-4 py-2">7 business days</td>
              <td class="border border-gray-300 px-4 py-2">5 business days</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Custom Products</td>
              <td class="border border-gray-300 px-4 py-2">14 business days</td>
              <td class="border border-gray-300 px-4 py-2">10 business days</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4>📦 Shipping Requirements</h4>
      <ul>
        <li><strong>Secure Packaging:</strong> Protect items during transit</li>
        <li><strong>Accurate Tracking:</strong> Provide valid tracking information</li>
        <li><strong>Timely Shipping:</strong> Ship within stated timeframes</li>
        <li><strong>Proper Labeling:</strong> Correct addresses and shipping labels</li>
      </ul>

      <h3>Customer Service Standards</h3>
      
      <h4>💬 Communication Requirements</h4>
      <ul>
        <li><strong>Response Time:</strong> Reply to customer messages within 24 hours</li>
        <li><strong>Professional Tone:</strong> Courteous and helpful communication</li>
        <li><strong>Problem Resolution:</strong> Work actively to resolve customer issues</li>
        <li><strong>Language:</strong> Communicate in English or local languages as appropriate</li>
      </ul>

      <h4>🔄 Return and Refund Policy</h4>
      <ul>
        <li><strong>Clear Policy:</strong> State your return policy clearly</li>
        <li><strong>Reasonable Terms:</strong> Fair return windows and conditions</li>
        <li><strong>Process Returns:</strong> Handle returns promptly and professionally</li>
        <li><strong>Refund Timeline:</strong> Process refunds within 5-7 business days</li>
      </ul>

      <h3>Performance Standards</h3>
      
      <h4>📊 Key Performance Indicators</h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 class="font-semibold text-green-800 mb-2">✅ Target Standards</h5>
          <ul class="text-green-700 text-sm space-y-1">
            <li>• Order fulfillment rate: >95%</li>
            <li>• Customer rating: >4.0 stars</li>
            <li>• Response time: <24 hours</li>
            <li>• Return rate: <5%</li>
            <li>• Dispute rate: <1%</li>
          </ul>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 class="font-semibold text-yellow-800 mb-2">⚠️ Warning Thresholds</h5>
          <ul class="text-yellow-700 text-sm space-y-1">
            <li>• Order fulfillment rate: <90%</li>
            <li>• Customer rating: <3.5 stars</li>
            <li>• Response time: >48 hours</li>
            <li>• Return rate: >10%</li>
            <li>• Dispute rate: >3%</li>
          </ul>
        </div>
      </div>

      <h3>Intellectual Property Policy</h3>
      
      <h4>🛡️ Copyright and Trademark</h4>
      <ul>
        <li><strong>Respect IP Rights:</strong> Don't infringe on others' intellectual property</li>
        <li><strong>Authorized Sales:</strong> Only sell products you're authorized to sell</li>
        <li><strong>Original Content:</strong> Use only your own images and descriptions</li>
        <li><strong>Brand Guidelines:</strong> Follow brand guidelines when selling branded products</li>
      </ul>

      <h4>📋 DMCA Compliance</h4>
      <ul>
        <li><strong>Takedown Requests:</strong> Respond promptly to valid DMCA notices</li>
        <li><strong>Counter-Notices:</strong> File counter-notices if you believe content was wrongly removed</li>
        <li><strong>Repeat Offenders:</strong> Multiple violations may result in account suspension</li>
      </ul>

      <h3>Account Security and Privacy</h3>
      
      <h4>🔐 Account Security</h4>
      <ul>
        <li><strong>Secure Passwords:</strong> Use strong, unique passwords</li>
        <li><strong>Two-Factor Authentication:</strong> Enable 2FA for enhanced security</li>
        <li><strong>Account Sharing:</strong> Don't share account credentials</li>
        <li><strong>Suspicious Activity:</strong> Report any unauthorized access immediately</li>
      </ul>

      <h4>🔒 Customer Data Protection</h4>
      <ul>
        <li><strong>Data Privacy:</strong> Protect customer personal information</li>
        <li><strong>Limited Use:</strong> Use customer data only for order fulfillment</li>
        <li><strong>No Sharing:</strong> Don't share customer information with third parties</li>
        <li><strong>Secure Storage:</strong> Store any customer data securely</li>
      </ul>

      <h3>Prohibited Practices</h3>
      
      <h4>🚫 Manipulation and Fraud</h4>
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h5 class="font-semibold text-red-800 mb-2">Strictly Prohibited</h5>
        <ul class="text-red-700 text-sm space-y-1">
          <li>• Fake reviews or ratings manipulation</li>
          <li>• Creating multiple accounts to circumvent policies</li>
          <li>• Misleading product information or bait-and-switch tactics</li>
          <li>• Artificially inflating search rankings</li>
          <li>• Coordinating with other sellers to manipulate prices</li>
          <li>• Using automated tools to create listings or reviews</li>
        </ul>
      </div>

      <h3>Enforcement and Penalties</h3>
      
      <h4>⚖️ Violation Consequences</h4>
      <div class="space-y-3">
        <div class="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
          <h6 class="font-semibold text-yellow-800">First Violation</h6>
          <p class="text-yellow-700 text-sm">Warning notice and mandatory policy review</p>
        </div>
        <div class="border border-orange-200 bg-orange-50 rounded-lg p-3">
          <h6 class="font-semibold text-orange-800">Second Violation</h6>
          <p class="text-orange-700 text-sm">Temporary account restriction (7-30 days)</p>
        </div>
        <div class="border border-red-200 bg-red-50 rounded-lg p-3">
          <h6 class="font-semibold text-red-800">Severe/Repeated Violations</h6>
          <p class="text-red-700 text-sm">Permanent account suspension and fund withholding</p>
        </div>
      </div>

      <h4>📞 Appeals Process</h4>
      <ul>
        <li><strong>Appeal Window:</strong> 30 days from penalty notification</li>
        <li><strong>Documentation:</strong> Provide evidence supporting your appeal</li>
        <li><strong>Review Process:</strong> Appeals reviewed within 5-10 business days</li>
        <li><strong>Final Decision:</strong> Appeal decisions are final</li>
      </ul>

      <h3>Policy Updates</h3>
      
      <h4>📢 Notification Process</h4>
      <ul>
        <li><strong>Advance Notice:</strong> 30 days notice for major policy changes</li>
        <li><strong>Communication Channels:</strong> Email, dashboard notifications, and vendor portal</li>
        <li><strong>Effective Date:</strong> Clear indication of when changes take effect</li>
        <li><strong>Grandfathering:</strong> Existing agreements honored where applicable</li>
      </ul>

      <h3>Support and Resources</h3>
      
      <h4>🆘 Getting Help</h4>
      <ul>
        <li><strong>Vendor Support:</strong> Dedicated support team for policy questions</li>
        <li><strong>Knowledge Base:</strong> Comprehensive guides and FAQs</li>
        <li><strong>Training Materials:</strong> Webinars and tutorials on best practices</li>
        <li><strong>Community Forum:</strong> Connect with other vendors for advice</li>
      </ul>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p class="text-blue-800 font-medium">📚 Stay Informed</p>
        <p class="text-blue-700 text-sm mt-1">Regularly review these policies and stay updated on changes. Successful vendors are those who understand and follow our guidelines while providing excellent customer service!</p>
      </div>
    `
  },
  // General Questions Articles  
  "about-feromarkethub": {
    title: "About FEROMARKETHUB",
    category: "General Questions",
    readTime: 3,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["how-to-contact-support", "how-to-become-a-vendor"],
    content: `<h2>Welcome to FEROMARKETHUB</h2><p>FEROMARKETHUB is Nigeria's premier online marketplace connecting millions of buyers with thousands of trusted vendors.</p><h3>Our Mission</h3><p>To empower businesses and individuals by providing a secure, accessible platform for commerce.</p><h3>What We Offer</h3><ul><li><strong>Wide Selection:</strong> Millions of products across all categories</li><li><strong>Secure Shopping:</strong> Protected payments and buyer guarantee</li><li><strong>Fast Delivery:</strong> Multiple shipping options</li><li><strong>Quality Assurance:</strong> Verified vendors and authentic products</li></ul><div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6"><p class="text-blue-800 font-medium"> Join Us</p><p class="text-blue-700 text-sm mt-1">Whether you're shopping or selling, FEROMARKETHUB is your trusted partner for online commerce in Nigeria!</p></div>`
  },

  "how-to-contact-support": {
    title: "How to Contact Support",
    category: "General Questions",
    readTime: 2,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["about-feromarkethub"],
    content: `<h2>Get Help When You Need It</h2><p>Our support team is available 24/7 to assist you with any questions or issues.</p><h3>Contact Methods</h3><ul><li><strong>Live Chat:</strong> Instant support through our website</li><li><strong>Email:</strong> support@feromarkethub.com</li><li><strong>Phone:</strong> 1-800-MARKET (Mon-Fri, 9AM-6PM)</li><li><strong>Support Tickets:</strong> Create a ticket for detailed issues</li></ul><div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6"><p class="text-green-800 font-medium"> Quick Response</p><p class="text-green-700 text-sm mt-1">Most inquiries are answered within 24 hours. For urgent issues, use live chat for immediate assistance!</p></div>`
  },

  "terms-of-service": {
    title: "Terms of Service",
    category: "General Questions",
    readTime: 5,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["privacy-policy", "about-feromarkethub"],
    content: `<h2>Terms of Service</h2><p>By using FEROMARKETHUB, you agree to these terms and conditions.</p><h3>User Responsibilities</h3><ul><li>Provide accurate information</li><li>Maintain account security</li><li>Comply with all applicable laws</li><li>Respect intellectual property rights</li></ul><h3>Prohibited Activities</h3><ul><li>Selling counterfeit or illegal items</li><li>Fraudulent transactions</li><li>Harassment or abuse</li><li>Unauthorized access attempts</li></ul><p>For complete terms, visit our <a href="/terms" class="text-primary hover:underline">Terms of Service page</a>.</p>`
  },

  "privacy-policy": {
    title: "Privacy Policy",
    category: "General Questions",
    readTime: 4,
    lastUpdated: "January 15, 2025",
    relatedArticles: ["terms-of-service", "account-security-tips"],
    content: `<h2>Your Privacy Matters</h2><p>We are committed to protecting your personal information and privacy.</p><h3>Information We Collect</h3><ul><li>Account information (name, email, phone)</li><li>Payment details (securely encrypted)</li><li>Shipping addresses</li><li>Browsing and purchase history</li></ul><h3>How We Use Your Data</h3><ul><li>Process orders and payments</li><li>Improve our services</li><li>Send order updates and notifications</li><li>Prevent fraud and enhance security</li></ul><h3>Your Rights</h3><ul><li>Access your personal data</li><li>Request data deletion</li><li>Opt-out of marketing communications</li><li>Export your data</li></ul><p>For complete details, visit our <a href="/privacy" class="text-primary hover:underline">Privacy Policy page</a>.</p>`
  }
}
