import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

/**
 * Get creator name from user profile
 * @param creatorId - The creator's user ID
 * @returns Promise<string> - The creator's display name
 */
export async function getCreatorName(creatorId: string): Promise<string> {
  try {
    const creatorDoc = await getDoc(doc(db, 'users', creatorId))
    
    if (creatorDoc.exists()) {
      const creatorData = creatorDoc.data()
      
      // Priority order: brandName > storeName > businessName > displayName > email prefix > fallback
      return (
        creatorData.brandName ||
        creatorData.hubName ||
        creatorData.storeName ||
        creatorData.businessName ||
        creatorData.displayName ||
        creatorData.email?.split('@')[0] ||
        'Creator Hub'
      )
    }
    
    return 'Creator Hub'
  } catch (error) {
    console.error('Error fetching creator name:', error)
    return 'Creator Hub'
  }
}

/**
 * Get multiple creator names in batch
 * @param creatorIds - Array of creator IDs
 * @returns Promise<Record<string, string>> - Object mapping creator IDs to names
 */
export async function getCreatorNames(creatorIds: string[]): Promise<Record<string, string>> {
  const creatorNames: Record<string, string> = {}
  
  try {
    const promises = creatorIds.map(async (creatorId) => {
      const name = await getCreatorName(creatorId)
      creatorNames[creatorId] = name
    })
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error fetching creator names:', error)
  }
  
  return creatorNames
}
