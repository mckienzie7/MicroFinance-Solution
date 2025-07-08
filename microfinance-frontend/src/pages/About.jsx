import React from 'react';

const About = () => {
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            About Our Microfinance Solution
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Empowering communities through accessible financial services.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-lg text-gray-600">
                Our mission is to provide innovative and inclusive financial solutions to underserved communities, fostering economic growth and empowering individuals to achieve their financial goals. We are committed to leveraging technology to make financial services more accessible, affordable, and user-friendly.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                className="rounded-lg shadow-lg"
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="Our Mission"
              />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center md:order-2">
              <img
                className="rounded-lg shadow-lg"
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="Our Vision"
              />
            </div>
            <div className="md:order-1">
              <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              <p className="mt-4 text-lg text-gray-600">
                We envision a world where everyone has access to the financial tools and resources they need to thrive. We aim to be a leading force in the microfinance industry, driving positive change and creating a more equitable and prosperous future for all.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900">Our Values</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-gray-900">Integrity</h3>
              <p className="mt-2 text-gray-600">
                We operate with the highest standards of honesty and transparency.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-gray-900">Inclusivity</h3>
              <p className="mt-2 text-gray-600">
                We are dedicated to serving all members of our community.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold text-gray-900">Innovation</h3>
              <p className="mt-2 text-gray-600">
                We continuously seek new and better ways to serve our clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
