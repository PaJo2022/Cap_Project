const cds = require('@sap/cds');

class RemoteService extends cds.ApplicationService {
  /** Registering custom event handlers */
  async init() {
    this.S4bupa = await cds.connect.to('API_BUSINESS_PARTNER');
    this.S4Sorder = await cds.connect.to('API_SALES_ORDER_SRV');
    const { CustomerBupa,SalesOrderBupa } = this.entities;
    this.on("READ", CustomerBupa, async (req) => this.onSapCustomerRead(req));
    this.on("READ", SalesOrderBupa, async (req) => this.onSapCustomerRead(req));
    return super.init();
  }

  
  async onSapCustomerRead(req) {
    const { CustomerBupa } = this.entities;
    const result = await this.S4bupa.run(
      SELECT.from(CustomerBupa)
    );
   
    return result;
  }

  async onSapSalesOrderRead(req) {
    const { SalesOrderBupa } = this.entities;
    const result = await this.S4bupa.run(
      SELECT.from(SalesOrderBupa)
    );
   
    return result;
  }




}

module.exports = RemoteService