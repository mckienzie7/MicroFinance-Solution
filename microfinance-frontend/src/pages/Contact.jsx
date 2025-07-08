import React from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Get in Touch
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            We'd love to hear from you. Please reach out with any questions or to learn more about our services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Your Name</label>
                <input type="text" id="name" name="name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Your Email</label>
                <input type="email" id="email" name="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-4">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea id="message" name="message" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300">Send Message</button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="flex items-center mb-4">
              <FaEnvelope className="text-blue-600 mr-4" size={24} />
              <a href="mailto:info@microfinance.com" className="text-lg text-gray-700 hover:text-blue-600">info@microfinance.com</a>
            </div>
            <div className="flex items-center mb-4">
              <FaPhone className="text-blue-600 mr-4" size={24} />
              <a href="tel:+1234567890" className="text-lg text-gray-700 hover:text-blue-600">+123-456-7890</a>
            </div>
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-blue-600 mr-4" size={24} />
              <p className="text-lg text-gray-700">123 Microfinance St, Addis Ababa, Ethiopia</p>
            </div>
            <div className="mt-8">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.743485792121!2d38.7636110147864!3d9.00540109353928!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85cef5ab402d%3A0x8427b63795e5756!2sAddis%20Ababa%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1620837293832!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Google Maps Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
