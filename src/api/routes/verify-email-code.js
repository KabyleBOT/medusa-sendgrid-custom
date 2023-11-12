const logAndSendError = (
  logger,
  res,
  message,
  status = 400
) => {
  logger.error(`sendgrid/verify-email-code: ${message}`);
  res.status(status).send(message);
};

const verifyEmailCode = async (req, res) => {
  const logger = req.scope.resolve("logger");
  const customerService = req.scope.resolve(
    "customerService"
  );
  const rawData = req.body;
  const parsedData = JSON.parse(rawData.toString());
  // 1. Check if information is provided
  const { email, code } = parsedData;
  if (!email || !code) {
    return logAndSendError(
      logger,
      res,
      "Email or code not provided"
    );
  }

  // 2. Retrieve user by email using customer service
  try {
    // 2.1 Check with registered email
    await customerService.retrieveRegisteredByEmail(email);
    return logAndSendError(
      logger,
      res,
      "This email has a registered account"
    );
  } catch (err) {
    // Silently handle this error, expected for unregistered emails
  }

  // 2.2 Check with unregistered email
  let unregisteredCustomer;
  try {
    unregisteredCustomer =
      await customerService.retrieveUnregisteredByEmail(
        email
      );
  } catch (err) {
    return logAndSendError(
      logger,
      res,
      "Email not found in unregistered accounts"
    );
  }

  const storedCode =
    unregisteredCustomer?.metadata?.verification_code;
  if (storedCode !== code) {
    return logAndSendError(
      logger,
      res,
      "Verification code does not match"
    );
  }

  // Code verification successful
  res.status(200).send("Verification successful");
};

export default verifyEmailCode;
