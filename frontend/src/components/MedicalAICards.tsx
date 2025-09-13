import React from 'react'

const MedicalAICards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card 1 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Symptom Checker</h3>
        <p className="text-gray-600">Get instant insights on your symptoms.</p>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Medication Advice</h3>
        <p className="text-gray-600">Find the right medication for your condition.</p>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Health Tips</h3>
        <p className="text-gray-600">Receive personalized health tips and advice.</p>
      </div>
    </div>
  )
}

export default MedicalAICards
