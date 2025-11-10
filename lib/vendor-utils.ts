import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

/**
 * Get vendor name from user profile
 * @param vendorId - The vendor's user ID
 * @returns Promise<string> - The vendor's display name
 */
export async function getVendorName(vendorId: string): Promise<string> {
  try {
    const vendorDoc = await getDoc(doc(db, 'users', vendorId))
    
    if (vendorDoc.exists()) {
      const vendorData = vendorDoc.data()
      
      // Priority order: storeName > businessName > displayName > email prefix > fallback
      return (
        vendorData.storeName ||
        vendorData.businessName ||
        vendorData.displayName ||
        vendorData.email?.split('@')[0] ||
        'Vendor Store'
      )
    }
    
    return 'Vendor Store'
  } catch (error) {
    console.error('Error fetching vendor name:', error)
    return 'Vendor Store'
  }
}

/**
 * Get multiple vendor names in batch
 * @param vendorIds - Array of vendor IDs
 * @returns Promise<Record<string, string>> - Object mapping vendor IDs to names
 */
export async function getVendorNames(vendorIds: string[]): Promise<Record<string, string>> {
  const vendorNames: Record<string, string> = {}
  
  try {
    const promises = vendorIds.map(async (vendorId) => {
      const name = await getVendorName(vendorId)
      vendorNames[vendorId] = name
    })
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error fetching vendor names:', error)
  }
  
  return vendorNames
}
