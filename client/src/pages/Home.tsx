import React from 'react';
import { Link } from 'wouter';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          STL to 2D Projections Viewer
        </h1>
        <p className="text-gray-600 mb-8">
          Upload STL files to generate orthogonal 2D projections
        </p>
        <Link href="/">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}
