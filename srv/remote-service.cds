using { API_BUSINESS_PARTNER as S4 } from './external/API_BUSINESS_PARTNER';

service RemoteService {
  entity BusinessPartner as projection on S4.A_BusinessPartner {
    key BusinessPartner as ID,
    FirstName as firstName,
    LastName as lastName,
    BusinessPartnerFullName as name
  }
}