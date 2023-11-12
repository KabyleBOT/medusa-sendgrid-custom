const MIN_CODE = 100000;
const MAX_CODE = 999999;

const generateVerificationCode = () =>
  (
    Math.floor(Math.random() * (MAX_CODE - MIN_CODE + 1)) +
    MIN_CODE
  ).toString();

const logAndSendError = (
  logger,
  res,
  message,
  status = 400
) => {
  logger.error(`sendgrid/send-email-code: ${message}`);
  res.status(status).send(message);
};

const sendEmailCode = async (req, res) => {
  const logger = req.scope.resolve("logger");
  const rawData = req.body;
  const parsedData = JSON.parse(rawData.toString());
  const email = parsedData?.email;
  if (!email) {
    return logAndSendError(
      logger,
      res,
      "No email provided"
    );
  }

  const code = generateVerificationCode();
  const customerService = req.scope.resolve(
    "customerService"
  );
  let customer;

  try {
    customer =
      await customerService.retrieveRegisteredByEmail(
        email
      );
    return logAndSendError(
      logger,
      res,
      `account with ${email} already registered`
    );
  } catch (err) {
    // Handle error silently as this is expected
  }

  try {
    customer =
      await customerService.retrieveUnregisteredByEmail(
        email
      );
    customer = await customerService.update(customer?.id, {
      metadata: { verification_code: code },
    });
  } catch (err) {
    try {
      customer = await customerService.create({
        email,
        metadata: { verification_code: code },
      });
    } catch (err) {
      return logAndSendError(
        logger,
        res,
        "Error while creating customer"
      );
    }
  }

  if (!customer?.metadata?.verification_code) {
    return logAndSendError(
      logger,
      res,
      "Error while getting customer verification code"
    );
  }

  const sendgridService = req.scope.resolve(
    "sendgridService"
  );
  const templateId =
    sendgridService.options_.code_genrerated_template;
  const from = sendgridService.options_.from;

  if (!templateId) {
    return logAndSendError(
      logger,
      res,
      "No template id provided"
    );
  }

  if (!from) {
    return logAndSendError(
      logger,
      res,
      "No from email provided"
    );
  }

  const sendOptions = {
    template_id: templateId,
    from,
    to: email,
    dynamic_template_data: {
      code: customer?.metadata?.verification_code,
      email,
    },
  };

  try {
    await sendgridService.sendEmail(sendOptions);
    res.status(200).send("code email sent");
  } catch (err) {
    return logAndSendError(
      logger,
      res,
      "Error sending code email"
    );
  }
};

export default sendEmailCode;
