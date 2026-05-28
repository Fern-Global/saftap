/**
 * Parameters used to initiate a payment request.
 */
export interface InitiatePaymentParams {
  touristId: string;
  destinationPhone?: string;
  destinationTill?: string;
  paybillNumber?: string;
  accountRef?: string;
  amountUsdc: number;
  savedPayeeId?: string;
}
