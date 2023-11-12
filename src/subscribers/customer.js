class CustomerSubscriber {
  constructor({ sendgridService, eventBusService }) {
    this.sendgridService_ = sendgridService;

    this.eventBus_ = eventBusService;

    this.eventBus_.subscribe(
      "customer.created",
      async (data) => {
        const hasAccount = data?.has_account;

        if (!hasAccount) {
          return;
        }

        await this.sendgridService_.sendNotification(
          "customer.created",
          data,
          null
        );
      }
    );
  }
}

export default CustomerSubscriber;
