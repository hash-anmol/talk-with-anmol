import crypto from "crypto";

export function verifyRazorpaySignature(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

export function verifyPaymentLinkSignature(
  paymentLinkId: string,
  paymentId: string,
  referenceId: string,
  status: string,
  signature: string,
  secret: string
) {
  const payload = `${paymentLinkId}|${paymentId}|${referenceId}|${status}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}
