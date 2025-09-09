import React from "react";

export default function Section({ 
  title, 
  content, 
  subtitle,
  image,
  testimonials,
  style = {}, 
  children, 
  ...rest 
}) {
  console.log('🔍 Section - title:', title, 'content:', content, 'subtitle:', subtitle, 'image:', image, 'testimonials:', testimonials);
  
  // Handle testimonials
  const renderTestimonials = () => {
    if (!testimonials || !Array.isArray(testimonials)) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {testimonials.map((testimonial, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-6 border">
            <div className="flex items-center mb-4">
              {testimonial.avatar && (
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author || 'Testimonial'} 
                  className="w-12 h-12 rounded-full mr-4"
                />
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{testimonial.author || 'Anonymous'}</h4>
                {testimonial.role && (
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                )}
              </div>
            </div>
            <blockquote className="text-gray-700 italic">
              "{testimonial.quote || testimonial.content || ''}"
            </blockquote>
          </div>
        ))}
      </div>
    );
  };
  
  // Handle content properly - it might be an array of objects
  const renderContent = () => {
    if (!content) return null;
    
    // If content is an array, render each item properly
    if (Array.isArray(content)) {
      return (
        <div className="space-y-4">
          {content.map((item, idx) => {
            console.log(`🔍 Section - processing content item ${idx}:`, item);
            
            // Ensure item is a valid object
            if (!item || typeof item !== 'object') {
              console.warn('❌ Section - invalid content item:', item);
              return null;
            }
            
            // Handle different types of content items
            if (item.type === 'card') {
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center space-x-3">
                    {item.icon && (
                      <img src={item.icon} alt="" className="w-8 h-8" />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title || 'Card'}</h4>
                      <p className="text-gray-600">{item.value || ''}</p>
                    </div>
                  </div>
                </div>
              );
            } else if (item.type === 'chart') {
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title || 'Chart'}</h4>
                  <p className="text-gray-600 text-sm">Chart data: {item.data ? `${item.data.length} data points` : 'No data'}</p>
                </div>
              );
            } else {
              // Fallback for unknown content types
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border">
                  <pre className="text-xs text-gray-500">{JSON.stringify(item, null, 2)}</pre>
                </div>
              );
            }
          }).filter(Boolean)}
        </div>
      );
    }
    
    // If content is a string or other primitive, render it directly
    return <div className="text-gray-700 mb-2">{content}</div>;
  };

  return (
    <section className="bg-white rounded-lg shadow p-6 w-full" style={style}>
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      {subtitle && <p className="text-lg text-gray-600 mb-4">{subtitle}</p>}
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {renderContent()}
          {renderTestimonials()}
        </div>
        
        {image && (
          <div className="lg:w-1/2">
            <img 
              src={image} 
              alt={title || 'Section image'} 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
      
      {children}
    </section>
  );
} 