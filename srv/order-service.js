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
        this.on('OrderStatusChanged', async (req) => this.onOrderStatusChanged(req));
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
        const result = await this.S4bupa.run(
          SELECT.from(CustomerBupa)
            .where({ name: name })
        );
        
        if(result.length == 0){
          req.error(400, `Customer with name "${name}" not found.`);
          return
        }
      
    
        return false;
    
      }
    
   
    
      async changeOrderStatusHandler(req) {
        const { orderId,status } = req.data;
        const { Order } = cds.entities('my.order')
        if (!status || status.trim() === "") {
          req.error(`Invalid status value.`);
          return;
        }
        const allowedStatuses = ['Created', 'Processed', 'Delivered'];
        if (!allowedStatuses.includes(status)) {
          req.error(400,`Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}`);  
          return;
        }
      
        const order = await cds.tx(req).run(SELECT.from(Order).where({ ID: orderId }));
    
        if (order.length === 0) {
           req.error(`Order with ID ${orderId} not found.`);
           return;
          }
    
    
        const oldStatus = order[0].status;
        const newStatus = status;
        order[0].status = status; 
        await cds.tx(req).run(UPDATE(Order).set({ status }).where({ ID: orderId }));
    
        this.emit('OrderStatusChanged', {
          orderId: orderId,
          oldStatus,
          newStatus,
          timeStamp: new Date().toISOString(),
        });
    
        
        return { ...order[0], status: newStatus };
      }

      async onOrderStatusChanged(req) {
        const { OrderStatusChangeLogs } = cds.entities('my.order');
        const { orderId, oldStatus, newStatus, timeStamp } = req.data;
    
        if (!orderId || !oldStatus || !newStatus || !timeStamp) {
            throw new Error('Missing required fields: orderId, oldStatus, newStatus, or timeStamp.');
        }
    
        const allowedStatuses = ['Created', 'Processed', 'Delivered'];
        if (!allowedStatuses.includes(newStatus)) {
            throw new Error(`Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}`);
        }
    
        try {
            await INSERT.into(OrderStatusChangeLogs).entries({
                ID: cds.utils.uuid(),
                orderId,
                oldStatus,
                newStatus,
                timeStamp,
            });
        } catch (error) {
            throw new Error('Failed to store the order status change log');
        }
    }
    
    
}

module.exports = OrderService