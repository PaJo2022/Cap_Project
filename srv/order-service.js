const cds = require('@sap/cds');

class OrderService extends cds.ApplicationService {

    async init() {
        this.S4SOrder = await cds.connect.to('API_SALES_ORDER_SRV');
        this.S4bupa = await cds.connect.to('API_BUSINESS_PARTNER');
        this.remoteService = await cds.connect.to('RemoteService');
        const { Orders,OrderItems } = this.entities;
        this.before("CREATE", Orders, async (req) => this.validateCustomerAndCreateOrder(req));
        this.on("READ", Orders, async (req) => this.fetchOrderDetails(req));
        this.on("READ", OrderItems, async (req) => this.fetchOrderItemDetails(req));
        this.on("checkOrderItemName", async (req) => this.checkOrderItemNameHandler(req));
        this.on("changeOrderStatus", async (req) => this.changeOrderStatusHandler(req));
        this.on('OrderStatusChanged', async (req) => this.onOrderStatusChanged(req));
        return super.init();
    }

    async fetchOrderDetails(req) {
      try {
        const { Customer } = cds.entities('my.customer');
        const { OrderItem } = cds.entities('my.order');
    
        let orders = await cds.tx(req).run(req.query);
    
        if (!Array.isArray(orders)) {
          orders = orders ? [orders] : [];
        }
    
        if (orders.length === 0) return orders;
    
        const orderIds = orders.map((order) => order.ID);
    
        const orderItems = await cds.tx(req).run(
          SELECT.from(OrderItem).where({ order_ID: { in: orderIds } })
        );
    
        const customerIds = [...new Set(orders.map((order) => order.customer_ID))];
    
        const customers = await cds.tx(req).run(
          SELECT.from(Customer).where({ ID: { in: customerIds } })
        );
    
        const formatter = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        });

        const ordersWithDetails = orders.map((order) => {
          const items = orderItems.filter((item) => item.order_ID === order.ID);
          const totalCost = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );
    
          order.items = items;
          order.customer =
            customers.find((customer) => customer.ID === order.customer_ID) || null;
          order.totalAmount = formatter.format(totalCost);;
    
          return order;
        });
    
        return ordersWithDetails;
      } catch (error) {
        req.error(500, 'Failed to fetch order details. Please try again later.');
      }
    }
    async fetchOrderItemDetails(req) {
      try {
        const { Customer } = cds.entities('my.customer');
        const { Order } = cds.entities('my.order');
    
        
        let orderItems = await cds.tx(req).run(req.query);
    
        
        if (!Array.isArray(orderItems)) {
          orderItems = orderItems ? [orderItems] : [];
        }
    
        
        if (orderItems.length === 0) return orderItems;
    
        
        const orderIds = [...new Set(orderItems.map((item) => item.order_ID))];
    
        
        const orders = await cds.tx(req).run(
          SELECT.from(Order).where({ ID: { in: orderIds } })
        );
    
        
        const customerIds = [...new Set(orders.map((order) => order.customer_ID))];
    
        
        const customers = await cds.tx(req).run(
          SELECT.from(Customer).where({ ID: { in: customerIds } })
        );

  
        const orderItemsWithDetails = orderItems.map((item) => {
          const order = orders.find((o) => o.ID === item.order_ID) || null;
          const customer =
            order && order.customer_ID
              ? customers.find((c) => c.ID === order.customer_ID) || null
              : null;
    
          item.order = order;
          item.customer = customer;
          return item;
        });
    
        return orderItemsWithDetails;
      } catch (error) {
       req.error(500,error);
      }
    }
    async validateCustomerAndCreateOrder(req) {
        const { Customer } = cds.entities('my.customer')
        const { CustomerBupa } = this.remoteService.entities
        const {customer_ID} = req.data
    
        const customerDetails = await  SELECT.one.from(Customer)
        .where({ ID: customer_ID })

        if (!req.data || req.data.status !== 'Created') {
          req.error(400, "Order status must be 'Created' to proceed.");
          return;
         }
    
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
        const { orderId, status } = req.data;
        const { Order } = cds.entities('my.order');
    
        // Validate status
        if (!status || status.trim() === "") {
            req.error(400, "Invalid status value.");
            return;
        }
    
        const allowedStatuses = ['Created', 'Processed', 'Delivered'];
        if (!allowedStatuses.includes(status)) {
            req.error(400, `Invalid status value. Allowed values are: ${allowedStatuses.join(', ')}`);
            return;
        }
    
        // Find the order
        const order = await cds.tx(req).run(SELECT.from(Order).where({ ID: orderId }));
    
        if (order.length === 0) {
            req.error(404, `Order with ID ${orderId} not found.`);
            return;
        }
    
        const oldStatus = order[0].status;
    
        // Check the valid transitions
        if (oldStatus === 'Created' && status !== 'Processed') {
            req.error(400, "Order can only be processed after being created.");
            return;
        }
        if (oldStatus === 'Processed' && status !== 'Delivered') {
            req.error(400, "Order can only be delivered after being processed.");
            return;
        }
        if (oldStatus === 'Delivered') {
            req.error(400, "Order status cannot be updated after delivery.");
            return;
        }
    
        // Update order status
        order[0].status = status;
        await cds.tx(req).run(UPDATE(Order).set({ status }).where({ ID: orderId }));
    
        // Emit event
        this.emit('OrderStatusChanged', {
            orderId: orderId,
            oldStatus,
            newStatus: status,
            timeStamp: new Date().toISOString(),
        });
    
        // Return updated order
        return { ...order[0], status };
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