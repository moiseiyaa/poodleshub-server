import { z } from 'zod';

export const createApplicationSchema = z.object({
  // Step 1: Basic Info
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid zip code is required'),
  outsideUS: z.boolean().default(false),
  mobileNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  textAlerts: z.boolean().default(false),
  referralSource: z.string().optional(),

  // Step 2: Puppy Preferences
  breedChoices: z.array(z.object({
    priority: z.number(),
    breed: z.string(),
  })).min(1, 'At least one breed choice is required'),
  preferredSizes: z.array(z.string()).min(1, 'At least one size preference is required'),
  preferredGender: z.string().min(1, 'Gender preference is required'),
  preferredColors: z.array(z.string()).min(1, 'At least one color preference is required'),
  preferredCoatTypes: z.array(z.string()).min(1, 'At least one coat type is required'),
  activityLevel: z.string().min(1, 'Activity level is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  secondPickupLocation: z.string().optional(),
  deliveryMethod: z.enum(['pickup', 'delivery']),

  // Step 3: Household Info
  otherPets: z.boolean(),
  petTypes: z.string().optional(),
  allergies: z.string().optional(),
  hasChildren: z.boolean(),
  childrenAges: z.string().optional(),
  hasFence: z.boolean(),
  alternativeExercise: z.string().optional(),
  lifestyle: z.string().min(1, 'Lifestyle description is required'),
  typicalDay: z.string().min(1, 'Description of typical day is required'),
  whyGoodFit: z.string().min(1, 'Description of why you are a good fit is required'),
  firstDog: z.boolean(),
  previousPuppies: z.number().default(0),
  interestedInTraining: z.boolean(),

  // Step 4: Agreements
  spayNeuterAgreement: z.boolean().refine((val: boolean) => val === true, {
    message: 'You must agree to the spay/neuter agreement',
  }),
  optInCommunications: z.boolean().default(false),
  welcomeCall: z.boolean().default(false),

  // Payment Info
  paymentMethod: z.enum(['creditCard', 'bankTransfer', 'crypto']).optional(),
  depositAmount: z.number().default(300),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
