import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

const RepaymentSchedule = ({ schedule }) => {
  if (!schedule || schedule.length === 0) {
    return <p className="text-sm text-gray-500">No repayment schedule available</p>;
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Balance</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {schedule.map((payment) => (
            <tr key={payment.payment_number}>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                {payment.payment_number}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                {formatDate(payment.due_date)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(payment.amount)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  payment.status === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(payment.remaining_balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RepaymentSchedule; 