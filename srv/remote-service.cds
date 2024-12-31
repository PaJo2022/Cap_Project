using { API_BUSINESS_PARTNER as S4 } from './external/API_BUSINESS_PARTNER';
using { API_SALES_ORDER_SRV as SOrder } from './external/API_SALES_ORDER_SRV';
service RemoteService {
  entity BusinessPartner as projection on S4.A_BusinessPartner {
    key BusinessPartner as ID,
    FirstName as firstName,
    LastName as lastName,
    BusinessPartnerFullName as name
  }

   entity SalesOrder as projection on SOrder.A_SalesOrder;
}