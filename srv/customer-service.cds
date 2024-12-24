using my.customer as my from '../db/schema';

@path : '/api/data/customers'
service CustomerService {


    entity Customers @(restrict: [
    {
        grant: ['READ'],
        to: 'authenticated-user'
    },
    {
        grant: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        to: 'OrderManager'
    }
]) as projection on my.Customer;         // Expose the Customer entity

   
entity Orders @(restrict: [
    {
        grant: ['READ'],
        to: 'authenticated-user'
    },
    {
        grant: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        to: 'OrderManager'
    }
]) as projection on my.Order;


    
    entity OrderItems @(restrict: [
    {
        grant: ['READ'],
        to: 'authenticated-user'
    },
    {
        grant: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        to: 'OrderManager'
    }
]) as projection on my.OrderItem;  


     action getOrderItemsForCustomer(customerID: UUID) returns array of {
        ID: UUID;
        ProductName: String;
        Quantity: Integer;
        UnitPrice: Decimal(10,2);
        OrderID: UUID;
        OrderDate: DateTime;
        TotalAmount: Decimal(10,2);
        CustomerName: String;
        CustomerContact: String;
    };
    action checkOrderItemName(itemName : String) returns Boolean;
    
    @(restrict: [
    {
        grant: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        to: 'OrderManager'
    }
])
    action changeOrderStatus(orderId:String,status : String(20)) returns Orders;

    
    entity OrderStatusChangeLogs as projection on my.OrderStatusChangeLogs; 



     
}
