const cds = require('@sap/cds');

class OrderService extends cds.ApplicationService {

    async init() {
        this.S4SOrder = await cds.connect.to('API_SALES_ORDER_SRV');
        this.S4bupa = await cds.connect.to('API_BUSINESS_PARTNER');
        this.remoteService = await cds.connect.to('RemoteService');
        const { Orders } = this.entities;
        this.before("CREATE", Orders, async (req) => this.validateCustomerAndCreateOrder(req));
        this.on("checkOrderItemName", async (req) => this.checkOrderItemNameHandler(req));
    
        this.on("changeOrderStatus", async (req) => this.changeOrderStatusHandler(req));
    
        this.on('OrderStatusChanged', async (data, req) => this.onOrderStatusChnaged(data,req));
        return super.init();
    }

    async validateCustomerAndCreateOrder(req) {
    
        
        const { Customer } = cds.entities('my.customer')
        const { CustomerBupa } = this.remoteService.entities
        const {customer_ID} = req.data
    
        const customerDetails = await  SELECT.one.from(Customer)
        .where({ ID: customer_ID })
    
        if (!customerDetails) {
          req.error(400, `No Customer Found.`)
          return
        }

        const {name} = customerDetails
        console.log(customerDetails)
        const result = await this.S4bupa.run(
          SELECT.from(CustomerBupa)
            .where({ BPCustomerFullName: name })
        );
        
        if(result.length == 0){
          console.log("No User Found")
          req.error(400, `Customer with name "${name}" not found.`);
          return
        }
      
    
        return false;
    
      }
    
      /** Custom Action Handler */
      async checkOrderItemNameHandler(req) {
        const { itemName } = req.data; // Retrieve the itemName from the action input
        console.log(`Checking order item name: ${itemName}`);
    
        // Example validation logic (replace with your own logic as needed)
        if (!itemName || itemName.trim() === "") {
          return false; // Return false if itemName is invalid
        }
    
        // Simulate checking the item name against a database or business rule
        const validItemNames = ["ItemA", "ItemB", "ItemC"]; // Example valid names
        const isValid = validItemNames.includes(itemName);
    
        console.log(`Is item name valid? ${Customers}`);
        return true; // Return the validation result
      }
    
      async changeOrderStatusHandler(req) {
        const { orderId,status } = req.data; // Retrieve the status from the action input
    
        if (!status || status.trim() === "") {
          // Return an error if the status is empty
          throw new Error("Invalid status value.");
        }
    
      
        // Retrieve the order from the database based on the order ID
        const order = await cds.tx(req).run(SELECT.from('my_customer_Order').where({ ID: orderId }));
    
        if (order.length === 0) {
          throw new Error(`Order with ID ${orderId} not found.`);
        }
    
    
        const oldStatus = order[0].status;
        const newStatus = status;
    
    
        // Update the order status
        order[0].status = status; // Assuming "status" is a field in the "Orders" entity
    
        // Save the updated order
        await cds.tx(req).run(UPDATE('my_customer_Order').set({ status }).where({ ID: orderId }));
    
        this.emit('OrderStatusChanged', {
          orderId: orderId,
          oldStatus,
          newStatus,
          timeStamp: new Date().toISOString(),
        });
    
        // Return the updated order
        return { ...order[0], status: newStatus };
      }

    async onOrderStatusChnaged(data,req){
        const { orderId, oldStatus, newStatus, timeStamp } = data.data;
        if (!orderId || !oldStatus || !newStatus || !timeStamp) {
          console.error("Missing required fields for OrderStatusChangeLogs") 
            return;
        }
        try {
            await INSERT.into(OrderStatusChangeLogs).entries({
                ID: cds.utils.uuid(), // Generate a unique ID
                orderId: orderId,
                oldStatus: oldStatus,
                newStatus: newStatus,
                timeStamp: timeStamp,
            });
            console.log('Log stored successfully in OrderStatusChangeLogs');
        } catch (error) {
            console.error('Error storing log in OrderStatusChangeLogs:', error);
            req.error(500, 'Failed to store the order status change log');
        }
    }
}

module.exports = OrderService