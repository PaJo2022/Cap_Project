namespace my.orderService;
using my.order as my from '../db/order';

@path : '/api/data/orders'
service OrderService {

    
entity Orders  as projection on my.Order;
entity OrderItems  as projection on my.OrderItem;  
@requires: 'order-manager'
action changeOrderStatus(orderId: String, status: String(20)) returns Orders;
entity OrderStatusChangeLogs as projection on my.OrderStatusChangeLogs;
annotate Orders with @restrict: [
     {
        grant: ['READ'], 
        to: 'authenticated-user'
    },
    {
        grant: ['READ','CREATE', 'UPDATE', 'DELETE'], 
        to: 'order-manager'
    }
   ]; 
annotate OrderItems with @restrict: [
     {
        grant: ['READ'], 
        to: 'authenticated-user'
    },
    {
        grant: ['READ','CREATE', 'UPDATE', 'DELETE'], 
        to: 'order-manager'
    }
   ];  

annotate OrderStatusChangeLogs with @restrict: [
     {
        grant: ['READ'], 
        to: 'authenticated-user'
    },
    {
        grant: ['READ','CREATE', 'UPDATE', 'DELETE'], 
        to: 'order-manager'
    }
   ];      

}