// import { useContext } from 'react';
// import { AddressContext } from './providers/SearchProvider';
// import LeadForm from './LeadForm';
// import { Button } from '@/components/ui';

// export default function LeadFormStep() {
//   const { currentStep, previousStep } = useContext(AddressContext);

//   if (currentStep !== 'lead-form') return null;

//   return (
//     <div className="flex flex-col items-center justify-center min-h-[600px] bg-white p-8 rounded-2xl shadow-md">
//       <h2 className="text-2xl font-bold mb-4 text-center">Contact Information</h2>
//       <p className="text-gray-600 mb-6 text-center max-w-xl">
//         Please fill out your contact details so we can send you a personalized quote for your roof project.
//       </p>
//       <LeadForm />
//       <div className="flex justify-center mt-8">
//         <Button variant="outline" className="rounded-full px-6 py-3" onClick={previousStep}>
//           Back to Roof Selection
//         </Button>
//       </div>
//     </div>
//   );
// } 