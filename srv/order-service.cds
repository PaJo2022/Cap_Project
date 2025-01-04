namespace my.orderService;
using my.order as my from '../db/order';

@path : '/api/data/orders'
service OrderService {

    
entity Orders  as projection on my.Order;


    
    entity OrderItems  as projection on my.OrderItem;  


    
    
    action changeOrderStatus(orderId:String,status : String(20)) returns Orders;

    
    entity OrderStatusChangeLogs as projection on my.OrderStatusChangeLogs;

}