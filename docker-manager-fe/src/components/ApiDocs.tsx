import React from "react";

export const ApiDocs: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <p className="mb-4">
        You can find the complete API documentation at{' '}
        <a
          href="/swagger/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
        >
          /swagger/index.html
        </a>
      </p>
    </div>
  )
}
