namespace my.customer;

entity Customer {
    key ID : UUID;                    // Unique identifier for the customer
    name : String(100);               // Name of the customer
    contact : String(50);             // Contact information (e.g., phone or email)
    orders : Composition of many Order on orders.customer = $self; // One-to-many association to Orders
}


entity Order {
    key ID : UUID;                    // Unique identifier for the order
    orderDate : Date;                 // Date of the order
    totalAmount : Decimal(15, 2);     // Total amount for the order
    customer : Association to Customer;  // Reference to the Customer entity
    items : Composition of many OrderItem on items.order = $self; // One-to-many association to OrderItems
    status : String(20) enum {        // Enum for order status
        Created; 
        Processed; 
        Delivered; 
    };
}

entity OrderItem {
    key ID : UUID;                    // Unique identifier for the order item
    productName : String(100);        // Name of the product
    quantity : Integer;               // Quantity of the product
    unitPrice : Decimal(10, 2);       // Price per unit of the product
    order : Association to Order;     // Reference to the Order entity
}
