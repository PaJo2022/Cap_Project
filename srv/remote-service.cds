using { API_BUSINESS_PARTNER as S4 } from './external/API_BUSINESS_PARTNER';
using { API_SALES_ORDER_SRV as SOrder } from './external/API_SALES_ORDER_SRV';
service RemoteService {
  entity CustomerBupa as projection on S4.A_Customer {
    key Customer as ID,
    BPCustomerFullName as name
  }

   entity SalesOrderBupa as projection on SOrder.A_SalesOrder{
    key SalesOrder as ID,
    SalesOrganization as organizationName
   };
}