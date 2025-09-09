import React from "react";
import Header from "./Header";
import HeroSection from "./HeroSection";
import CardGrid from "./CardGrid";
import TripsTable from "./TripsTable";
import Footer from "./Footer";
import Section from "./Section";
import GenericSection from "./GenericSection";

// Error Boundary Component for better error handling
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <h3 className="text-red-800 font-semibold mb-2">Component Error</h3>
          <p className="text-red-600 text-sm mb-2">
            {this.state.error?.message || 'An error occurred while rendering this component'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-red-700 underline text-sm hover:text-red-900"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const COMPONENT_MAP = {
  header: Header,
  hero: HeroSection,
  herosection: HeroSection,
  'hero-section': HeroSection,
  cardgrid: CardGrid,
  'card-grid': CardGrid,
  cards: CardGrid,
  tripstable: TripsTable,
  'trips-table': TripsTable,
  table: TripsTable,
  footer: Footer,
  section: Section,
  generic: GenericSection,
  content: Section,
  container: Section,
};

function LayoutRenderer({ layoutSections = [] }) {
  // Helper function to sanitize props - only pass primitive values and valid objects
  const sanitizeProps = (props) => {
    if (!props || typeof props !== 'object') return {};
    
    const sanitized = {};
    for (const [key, value] of Object.entries(props)) {
      // Only include primitive values, arrays of primitives, or plain objects
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        (Array.isArray(value) && value.every(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean' ||
          (typeof item === 'object' && item !== null && !React.isValidElement(item) && !item.type && !item.props)
        )) ||
        (typeof value === 'object' && value !== null && !React.isValidElement(value) && !value.type && !value.props)
      ) {
        sanitized[key] = value;
      } else {
        console.warn('🚫 Filtered out invalid prop:', key, value);
      }
    }
    return sanitized;
  };

  // Helper function to check if an object has the problematic {type, props} structure
  const hasTypePropsStructure = (obj) => {
    return obj && typeof obj === 'object' && obj.type && obj.props;
  };

  const rendered = React.useMemo(() => {
    if (!Array.isArray(layoutSections) || layoutSections.length === 0) {
      return <div className="text-gray-400 text-center py-8">No layout to display.</div>;
    }
    
    console.log('🔍 LayoutRenderer - Full layoutSections:', JSON.stringify(layoutSections, null, 2));
    
    return layoutSections.map((section, idx) => {
      console.log(`🔍 Processing section ${idx}:`, section);
      
      // Ensure section is a valid object
      if (!section || typeof section !== 'object') {
        console.warn('❌ Invalid section:', section);
        return null;
      }
      
      // Check if section itself has type and props (this could be the issue!)
      if (hasTypePropsStructure(section)) {
        console.error('🚨 CRITICAL: Section has {type, props} structure - this will cause React error!', section);
        // Convert to a safe format
        const safeSection = {
          type: section.type,
          props: sanitizeProps(section.props)
        };
        console.log('🔧 Converted to safe section:', safeSection);
        section = safeSection;
      }
      
      const typeKey = section.type ? String(section.type).toLowerCase() : '';
      const SectionComponent = COMPONENT_MAP[typeKey];
      const key = section.id || section.props?.id || `${typeKey}-${idx}`;
      const sanitizedProps = sanitizeProps(section.props);
      
      console.log(`🔍 Section ${idx} - typeKey: ${typeKey}, key: ${key}, sanitizedProps:`, sanitizedProps);
      
      if (!SectionComponent) {
        console.log(`🔍 Using GenericSection for type: ${typeKey}`);
        return (
          <ComponentErrorBoundary key={key}>
            <GenericSection type={section.type} {...sanitizedProps} />
          </ComponentErrorBoundary>
        );
      }
      
      console.log(`🔍 Using ${typeKey} component`);
      
      // Wrap component in error boundary for better error handling
      return (
        <ComponentErrorBoundary key={key}>
          <SectionComponent {...sanitizedProps} />
        </ComponentErrorBoundary>
      );
    }).filter(Boolean); // Remove any null values
  }, [layoutSections]);
  
  return (
    <div className="space-y-8">
      {Array.isArray(rendered) ? rendered : <div>Error: Invalid rendered content</div>}
    </div>
  );
}

export default React.memo(LayoutRenderer);