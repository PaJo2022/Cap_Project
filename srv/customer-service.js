const cds = require('@sap/cds');

class CustomerService extends cds.ApplicationService {
  /** Registering custom event handlers */
  async init() {
    this.S4bupa = await cds.connect.to('API_BUSINESS_PARTNER');
    this.remoteService = await cds.connect.to('RemoteService');
    const { Customers } = this.entities;
   //this.on("READ", Customers, async (req) => this.onCustomerRead(req));
  
    return super.init();
  }

  

  /** Custom Validation */
  async onCustomerRead(req) {
    const {CustomerBupa} = this.remoteService.entities

    const result = await this.S4bupa.run(
      SELECT.from(CustomerBupa)
    );
       
   
    return result
  }



}




module.exports = CustomerService;
