import React from 'react';
import {
  BanknotesIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

const services = [
  {
    name: 'Microloans for Small Businesses',
    description:
      'We provide accessible and affordable microloans to help entrepreneurs and small business owners start or expand their ventures. Our flexible repayment terms are designed to support your business growth.',
    icon: BanknotesIcon,
  },
  {
    name: 'Savings Accounts',
    description:
      'Secure your future with our competitive savings accounts. We offer a safe place for your money to grow, with easy access to your funds when you need them.',
    icon: ChartBarIcon,
  },
  {
    name: 'Financial Literacy Training',
    description:
      'Knowledge is power. We offer comprehensive financial literacy training to equip you with the skills to manage your finances effectively, make informed decisions, and build a secure financial future.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Mobile Banking',
    description:
      'Bank on the go with our user-friendly mobile banking platform. Check your balance, transfer funds, pay bills, and manage your account anytime, anywhere, right from your mobile device.',
    icon: DevicePhoneMobileIcon,
  },
];

const Services = () => {
  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
            Our Services
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            A Better Way to Manage Your Finances
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            We offer a range of services designed to meet the diverse needs of
            our clients.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {services.map((service) => (
              <div key={service.name} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <service.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    {service.name}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {service.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 text-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started Today
          </a>
        </div>
      </div>
    </div>
  );
};

export default Services;
