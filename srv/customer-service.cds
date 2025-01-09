namespace my.customerService;
using my.customer as my from '../db/customer';


@path : '/api/data/customers'
service CustomerService {

entity Customers as projection on my.Customer;
annotate Customers with @restrict: [
    {
        grant: ['READ'], 
        to: 'authenticated-user'
    },
    {
        grant: ['CREATE', 'UPDATE', 'DELETE'], 
        to: 'order-manager'
    }
];    
}
