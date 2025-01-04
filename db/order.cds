namespace my.order;
using my.customer as my from './customer';
entity Order {
    key ID : UUID;                    
    orderDate : Date;                 
    totalAmount : Decimal(15, 2);     
    customer : Association to my.Customer;  
    items : Composition of many OrderItem on items.order = $self; 
    status : String(20) enum {        
        Created; 
        Processed; 
        Delivered; 
    };
}

entity OrderItem {
    key ID : UUID;                    
    productName : String(100);        
    quantity : Integer;               
    unitPrice : Decimal(10, 2);       
    order : Association to Order;     
}

entity  OrderStatusChangeLogs{
    key ID : UUID;
    orderId : String;
    oldStatus : String;
    newStatus : String;
    timeStamp : Timestamp;
}