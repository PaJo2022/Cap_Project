namespace my.customer;
using my.order.Order as Order from '../db/order';

entity Customer {
    key ID : UUID;                    
    name : String(100);               
    contact : String(50);             
    orders : Composition of many Order on orders.customer = $self; 
}



