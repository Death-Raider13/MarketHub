export const BUSINESS_FEES = {
  affiliateRegistration: 8000,
  creatorAdditionalUpload: 4000,
  creatorWaitlistAdditionalUpload: 3000,
  creatorVerificationAndFeaturing: 10000,
  waitlistDiscountPercent: 25,
  affiliateSalePercent: 15,
  directCreatorSalePercent: 90,
  affiliateCreatorSalePercent: 75,
  platformSalePercent: 10,
  referralSharePercent: 50,
} as const

export const CREATOR_FREE_BOOK_LIMIT = 3

export type FeeType =
  | 'affiliate_registration'
  | 'creator_additional_upload'
  | 'creator_waitlist_additional_upload'
  | 'creator_verification_featuring'

export function feeAmount(type: FeeType): number {
  switch (type) {
    case 'affiliate_registration':
      return BUSINESS_FEES.affiliateRegistration
    case 'creator_additional_upload':
      return BUSINESS_FEES.creatorAdditionalUpload
    case 'creator_waitlist_additional_upload':
      return BUSINESS_FEES.creatorWaitlistAdditionalUpload
    case 'creator_verification_featuring':
      return BUSINESS_FEES.creatorVerificationAndFeaturing
  }
}

export function referralRewardForFee(type: FeeType): number {
  return Math.round(feeAmount(type) * BUSINESS_FEES.referralSharePercent / 100)
}

export function creatorUploadFee(isWaitlistEligible: boolean): FeeType {
  return isWaitlistEligible
    ? 'creator_waitlist_additional_upload'
    : 'creator_additional_upload'
}

export function saleSplit(hasAffiliate: boolean): {
  creatorPercent: number
  affiliatePercent: number
  platformPercent: number
} {
  return hasAffiliate
    ? {
        creatorPercent: BUSINESS_FEES.affiliateCreatorSalePercent,
        affiliatePercent: BUSINESS_FEES.affiliateSalePercent,
        platformPercent: BUSINESS_FEES.platformSalePercent,
      }
    : {
        creatorPercent: BUSINESS_FEES.directCreatorSalePercent,
        affiliatePercent: 0,
        platformPercent: BUSINESS_FEES.platformSalePercent,
      }
}
