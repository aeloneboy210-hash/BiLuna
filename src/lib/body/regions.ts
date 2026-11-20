/**
 * Body areas a patient can tap, and organs that can light up as "may be involved".
 * Shared by both 3D bodies so BiLuna's chat sees the same names whichever one is shown.
 */
export type RegionId =
  | 'head'
  | 'neck'
  | 'chest'
  | 'upperBack'
  | 'upperAbdomen'
  | 'lowerAbdomen'
  | 'lowerBack'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg'

export type OrganId =
  | 'brain'
  | 'trachea'
  | 'lungs'
  | 'heart'
  | 'liver'
  | 'stomach'
  | 'intestines'
  | 'pancreas'
  | 'spleen'
  | 'gallbladder'
  | 'bladder'
  | 'kidneys'

export type PartId = RegionId | OrganId

export const BODY_PARTS: Record<PartId, { en: string; bn: string }> = {
  head: { en: 'Head', bn: 'মাথা' },
  neck: { en: 'Neck and throat', bn: 'গলা ও ঘাড়' },
  chest: { en: 'Chest', bn: 'বুক' },
  upperBack: { en: 'Upper back', bn: 'পিঠের উপরের অংশ' },
  upperAbdomen: { en: 'Upper belly', bn: 'পেটের উপরের অংশ' },
  lowerAbdomen: { en: 'Lower belly', bn: 'তলপেট' },
  lowerBack: { en: 'Lower back', bn: 'কোমর' },
  leftArm: { en: 'Left arm', bn: 'বাম হাত' },
  rightArm: { en: 'Right arm', bn: 'ডান হাত' },
  leftLeg: { en: 'Left leg', bn: 'বাম পা' },
  rightLeg: { en: 'Right leg', bn: 'ডান পা' },
  brain: { en: 'Brain', bn: 'মস্তিষ্ক' },
  trachea: { en: 'Windpipe', bn: 'শ্বাসনালী' },
  lungs: { en: 'Lungs', bn: 'ফুসফুস' },
  heart: { en: 'Heart', bn: 'হৃৎপিণ্ড' },
  liver: { en: 'Liver', bn: 'যকৃৎ' },
  stomach: { en: 'Stomach', bn: 'পাকস্থলী' },
  intestines: { en: 'Intestines', bn: 'অন্ত্র' },
  pancreas: { en: 'Pancreas', bn: 'অগ্ন্যাশয়' },
  spleen: { en: 'Spleen', bn: 'প্লীহা' },
  gallbladder: { en: 'Gallbladder', bn: 'পিত্তথলি' },
  bladder: { en: 'Bladder', bn: 'মূত্রথলি' },
  kidneys: { en: 'Kidneys', bn: 'কিডনি' },
}

/**
 * Which area a tap landed on. y: 0 = feet, 1 = top of head. x: -1 = patient's right, 1 = patient's left
 * (as seen from the front). front: true when the tap was on the front of the body.
 */
export function regionAt({ y, x, front }: { y: number; x: number; front: boolean }): RegionId {
  if (y >= 0.89) return 'head'
  if (y >= 0.82) return 'neck'
  if (y >= 0.45 && Math.abs(x) >= 0.6) return x > 0 ? 'leftArm' : 'rightArm'
  if (y >= 0.68) return front ? 'chest' : 'upperBack'
  if (y >= 0.59) return front ? 'upperAbdomen' : 'lowerBack'
  if (y >= 0.48) return front ? 'lowerAbdomen' : 'lowerBack'
  return x >= 0 ? 'leftLeg' : 'rightLeg'
}
